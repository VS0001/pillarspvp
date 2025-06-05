const socket = io();
const canvas = document.getElementById('gameCanvas');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(innerWidth, innerHeight);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

// Your player
let player = {
  mesh: null,
  speed: 0.1,
  id: null
};

// Others
const otherPlayers = {};

function createPlayerMesh(color = 0x00ff00) {
  const geometry = new THREE.BoxGeometry(1, 2, 1);
  const material = new THREE.MeshStandardMaterial({ color });
  return new THREE.Mesh(geometry, material);
}

// Local player
function initPlayer(data) {
  player.mesh = createPlayerMesh(0x00ff00);
  player.mesh.position.set(data.position.x, data.position.y, data.position.z);
  scene.add(player.mesh);
  camera.position.set(0, 5, 10);
  camera.lookAt(player.mesh.position);
}

// Add new other player
function addOtherPlayer(id, data) {
  const mesh = createPlayerMesh(0xff0000);
  mesh.position.set(data.position.x, data.position.y, data.position.z);
  otherPlayers[id] = mesh;
  scene.add(mesh);
}

// Socket handlers
socket.on('currentPlayers', all => {
  Object.keys(all).forEach(id => {
    if (id === socket.id) {
      initPlayer(all[id]);
    } else {
      addOtherPlayer(id, all[id]);
    }
  });
});

socket.on('newPlayer', data => {
  if (data.id !== socket.id) addOtherPlayer(data.id, data);
});

socket.on('playerMoved', data => {
  const other = otherPlayers[data.id];
  if (other) {
    other.position.set(data.position.x, data.position.y, data.position.z);
  }
});

socket.on('playerDisconnected', id => {
  scene.remove(otherPlayers[id]);
  delete otherPlayers[id];
});

// Controls
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

// Left/right click
document.addEventListener('mousedown', e => {
  if (e.button === 0) {
    console.log("Left click = basic attack");
    // TODO: Add melee attack
  } else if (e.button === 2) {
    console.log("Right click = use item");
    // TODO: Use equipped item
  }
});
document.addEventListener('contextmenu', e => e.preventDefault());

// Animate
function animate() {
  requestAnimationFrame(animate);
  handleMovement();
  renderer.render(scene, camera);
}

function handleMovement() {
  if (!player.mesh) return;
  let moved = false;
  if (keys['w']) { player.mesh.position.z -= player.speed; moved = true; }
  if (keys['s']) { player.mesh.position.z += player.speed; moved = true; }
  if (keys['a']) { player.mesh.position.x -= player.speed; moved = true; }
  if (keys['d']) { player.mesh.position.x += player.speed; moved = true; }
  if (moved) {
    socket.emit('playerMovement', {
      position: player.mesh.position,
      rotation: player.mesh.rotation
    });
  }
}

animate();
