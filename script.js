const canvas = document.getElementById("solarSystemCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 30, 100);
camera.lookAt(0, 0, 0);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const pointLight = new THREE.PointLight(0xffffff, 1.5, 500);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Sun
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(5, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffff00 })
);
scene.add(sun);

// Planet data
const planetData = [
  { name: "Mercury", color: 0xaaaaaa, distance: 10, size: 0.5, speed: 0.02 },
  { name: "Venus", color: 0xffcc99, distance: 14, size: 0.8, speed: 0.015 },
  { name: "Earth", color: 0x3399ff, distance: 18, size: 1, speed: 0.01 },
  { name: "Mars", color: 0xff3300, distance: 22, size: 0.9, speed: 0.008 },
  { name: "Jupiter", color: 0xff9966, distance: 28, size: 2, speed: 0.005 },
  { name: "Saturn", color: 0xffcc66, distance: 34, size: 1.7, speed: 0.0035 },
  { name: "Uranus", color: 0x66ffff, distance: 40, size: 1.3, speed: 0.002 },
  { name: "Neptune", color: 0x3366ff, distance: 46, size: 1.2, speed: 0.0015 },
];

const planets = [];
const orbitLines = [];

planetData.forEach(data => {
  const geometry = new THREE.SphereGeometry(data.size, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: data.color });
  const planet = new THREE.Mesh(geometry, material);

  planet.userData = {
    name: data.name,
    angle: 0,
    speed: data.speed,
    distance: data.distance,
    size: data.size,
  };

  planet.position.x = data.distance;
  scene.add(planet);
  planets.push(planet);

  // Orbit ring
  const orbitGeometry = new THREE.RingGeometry(data.distance - 0.05, data.distance + 0.05, 100);
  const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
  orbit.rotation.x = Math.PI / 2;
  scene.add(orbit);
  orbitLines.push(orbit);

  // Speed control slider
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = 0.0005;
  slider.max = 0.05;
  slider.step = 0.0005;
  slider.value = data.speed;
  slider.dataset.name = data.name;
  slider.addEventListener("input", (e) => {
    const target = planets.find(p => p.userData.name === e.target.dataset.name);
    if (target) target.userData.speed = parseFloat(e.target.value);
  });

  const label = document.createElement("label");
  label.innerText = data.name + ": ";
  label.appendChild(slider);
  document.getElementById("sliders").appendChild(label);
  document.getElementById("sliders").appendChild(document.createElement("br"));
});

// Add Moon to Earth
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.2, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xcccccc })
);
moon.userData = { angle: 0, distance: 1.5 };
scene.add(moon);

// Enhanced Starfield
const starGeometry = new THREE.BufferGeometry();
const starCount = 10000;
const starVertices = [];
for (let i = 0; i < starCount; i++) {
  const x = (Math.random() - 0.5) * 4000;
  const y = (Math.random() - 0.5) * 4000;
  const z = (Math.random() - 0.5) * 4000;
  starVertices.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8 });
const starField = new THREE.Points(starGeometry, starMaterial);
scene.add(starField);

// Raycaster for clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Click-to-Zoom and Info Panel
function onClick(event) {
  const bounds = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);

  if (intersects.length > 0) {
    const planet = intersects[0].object;
    document.getElementById("planetName").innerText = planet.userData.name;
    document.getElementById("planetDetails").innerText = `Distance: ${planet.userData.distance} AU`;
    document.getElementById("infoBox").classList.remove("hidden");

    const target = planet.position.clone();
    const camPos = target.clone().add(new THREE.Vector3(10, 10, 10));
    gsap.to(camera.position, {
      duration: 1.5,
      x: camPos.x,
      y: camPos.y,
      z: camPos.z,
      onUpdate: () => camera.lookAt(target)
    });
  }
}
canvas.addEventListener("click", onClick);
function closeInfo() {
  document.getElementById("infoBox").classList.add("hidden");
}

// Animation loop
let paused = false;

function animate() {
  requestAnimationFrame(animate);

  if (!paused) {
    planets.forEach(planet => {
      planet.userData.angle += planet.userData.speed;
      planet.position.x = Math.cos(planet.userData.angle) * planet.userData.distance;
      planet.position.z = Math.sin(planet.userData.angle) * planet.userData.distance;
      planet.rotation.y += 0.01;
    });

    // Moon orbiting Earth
    const earth = planets.find(p => p.userData.name === "Earth");
    if (earth) {
      moon.userData.angle += 0.05;
      moon.position.x = earth.position.x + Math.cos(moon.userData.angle) * moon.userData.distance;
      moon.position.z = earth.position.z + Math.sin(moon.userData.angle) * moon.userData.distance;
      moon.position.y = earth.position.y;
    }
  }

  renderer.render(scene, camera);
}
animate();

// Button Events
document.getElementById("pauseBtn").onclick = () => (paused = true);
document.getElementById("resumeBtn").onclick = () => (paused = false);
document.getElementById("toggleMode").onclick = () => {
  document.body.classList.toggle("light-mode");
};
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

