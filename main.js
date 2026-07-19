// ============================================================
//  Peppa's Party Time! — a cheerful 3D party game for kids
//  Built with Three.js. All art is generated in code.
//  (Unofficial fan game, personal/non-commercial use only.)
// ============================================================
import * as THREE from 'three';

// ---------------- Config ----------------
const WORLD_R = 30;          // how far the pig can roam
const TOTAL_TREATS = 10;
const SPEED = 6.5;

// ---------------- DOM ----------------
const $ = (id) => document.getElementById(id);
const starCountEl = $('starCount');
const bannerEl = $('banner');
const danceBtn = $('danceBtn');
const againBtn = $('againBtn');
const musicBtn = $('musicBtn');
const joyEl = $('joy');
const joyKnob = $('joyKnob');

// ============================================================
//  AUDIO — cheerful original chiptune + silly sound effects
// ============================================================
const NOTE = {
  C3: 130.81, E3: 164.81, F3: 174.61, G3: 196.0,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77, C6: 1046.5,
};
// An original bouncy birthday-garden tune (C major)
const MELODY = [
  ['C5', 1], ['E5', 1], ['G5', 1], ['E5', 1],
  ['A5', 1], ['G5', 1], ['E5', 1], ['C5', 1],
  ['D5', 1], ['F5', 1], ['A5', 1], ['F5', 1],
  ['G5', 2], ['E5', 1], ['C5', 1],
  ['C5', 1], ['E5', 1], ['G5', 1], ['E5', 1],
  ['A5', 1], ['G5', 1], ['A5', 1], ['C6', 1],
  ['G5', 1], ['E5', 1], ['D5', 1], ['E5', 1],
  ['C5', 2], ['G4', 1], ['C5', 1],
];
const BASS = ['C3', 'C3', 'F3', 'F3', 'C3', 'C3', 'G3', 'G3'];
const BEAT = 0.21;

let actx = null, master = null, musicOn = true, musicStep = 0, musicTimer = null;

function initAudio() {
  if (actx) { actx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  actx = new AC();
  master = actx.createGain();
  master.gain.value = 0.5;
  master.connect(actx.destination);
  musicTimer = setInterval(musicTick, BEAT * 1000);
}

function tone(freq, dur, { type = 'triangle', vol = 0.15, when = 0, slide = null } = {}) {
  if (!actx) return;
  const t = actx.currentTime + when;
  const o = actx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}

function noiseBurst(dur, { freq = 800, type = 'lowpass', vol = 0.3, when = 0, slideTo = null } = {}) {
  if (!actx) return;
  const t = actx.currentTime + when;
  const len = Math.max(1, Math.floor(actx.sampleRate * dur));
  const buf = actx.createBuffer(1, len, actx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = actx.createBufferSource();
  src.buffer = buf;
  const f = actx.createBiquadFilter();
  f.type = type; f.frequency.setValueAtTime(freq, t);
  if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  const g = actx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t); src.stop(t + dur);
}

function musicTick() {
  if (!musicOn || !actx) return;
  const seqLen = MELODY.reduce((a, n) => a + n[1], 0);
  let acc = 0, idx = musicStep % seqLen;
  for (const [name, beats] of MELODY) {
    if (idx < acc + beats) {
      tone(NOTE[name], BEAT * beats * 0.95, { vol: 0.11 });
      break;
    }
    acc += beats;
  }
  if (musicStep % 2 === 0) tone(NOTE[BASS[(musicStep / 2) % BASS.length | 0]], BEAT * 1.8, { type: 'sine', vol: 0.07 });
  musicStep++;
}

// --- Sound effects ---
const sfxCollect = () => {
  tone(NOTE.E5, 0.12, { vol: 0.25 });
  tone(NOTE.G5, 0.12, { vol: 0.25, when: 0.09 });
  tone(NOTE.C6, 0.22, { vol: 0.25, when: 0.18 });
};
const sfxSplat = () => {
  noiseBurst(0.28, { freq: 500, vol: 0.5, slideTo: 120 });
  tone(180, 0.25, { type: 'sine', vol: 0.3, slide: 55 });
};
const sfxBoing = () => tone(140, 0.3, { type: 'square', vol: 0.1, slide: 620 });
const sfxPop = () => {
  noiseBurst(0.09, { freq: 2500, type: 'highpass', vol: 0.22 });
  tone(900, 0.09, { vol: 0.15, slide: 300 });
};
const sfxFanfare = () => {
  const seq = ['C5', 'E5', 'G5', 'C6'];
  seq.forEach((n, i) => tone(NOTE[n], 0.2, { type: 'square', vol: 0.14, when: i * 0.15 }));
  tone(NOTE.C6, 0.7, { type: 'square', vol: 0.14, when: 0.62 });
  tone(NOTE.E5, 0.7, { type: 'square', vol: 0.09, when: 0.62 });
};

// ============================================================
//  RENDERER / SCENE
// ============================================================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 45, 95);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 250);
camera.position.set(0, 11, 15);

const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x7ec850, 0.95);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff3d6, 1.35);
sun.position.set(22, 32, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -45; sun.shadow.camera.right = 45;
sun.shadow.camera.top = 45; sun.shadow.camera.bottom = -45;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 100;
scene.add(sun);

const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...opts });
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

// ============================================================
//  WORLD — garden party
// ============================================================
// Ground
const ground = new THREE.Mesh(new THREE.CircleGeometry(42, 48), mat(0x77d158));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Soft hills on the horizon
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2 + 0.4;
  const hill = new THREE.Mesh(new THREE.SphereGeometry(rand(7, 11), 16, 12), mat(0x5db843));
  hill.scale.y = 0.28;
  hill.position.set(Math.cos(a) * 38, 0, Math.sin(a) * 38);
  scene.add(hill);
}

// Sun + rainbow
const sunBall = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffe066 }));
sunBall.position.set(28, 26, -34);
scene.add(sunBall);

const rainbowColors = [0xff5d5d, 0xffa53f, 0xffe066, 0x7cf585, 0x3fd2ff, 0xb98cff];
rainbowColors.forEach((c, i) => {
  const arc = new THREE.Mesh(new THREE.TorusGeometry(15 + i * 0.95, 0.45, 8, 40, Math.PI), new THREE.MeshBasicMaterial({ color: c }));
  arc.position.set(-12, 0, -40);
  scene.add(arc);
});

// Clouds
const clouds = [];
for (let i = 0; i < 6; i++) {
  const cloud = new THREE.Group();
  const n = 3 + (Math.random() * 3 | 0);
  for (let j = 0; j < n; j++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(rand(1.2, 2.2), 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    puff.position.set(j * rand(1.3, 1.9) - n, rand(-0.3, 0.4), rand(-0.5, 0.5));
    cloud.add(puff);
  }
  cloud.position.set(rand(-35, 35), rand(15, 24), rand(-35, 10));
  clouds.push(cloud);
  scene.add(cloud);
}

// Trees around the garden
for (let i = 0; i < 9; i++) {
  const a = (i / 9) * Math.PI * 2 + 0.25;
  const r = rand(31, 36);
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.2, 8), mat(0x8d5a2b));
  trunk.position.y = 1.1; trunk.castShadow = true;
  tree.add(trunk);
  for (let j = 0; j < 3; j++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(rand(1.3, 1.9), 12, 10), mat(0x3f9e3f));
    leaf.position.set(rand(-0.8, 0.8), 2.6 + j * 0.8, rand(-0.8, 0.8));
    leaf.castShadow = true;
    tree.add(leaf);
  }
  tree.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  tree.scale.setScalar(rand(0.9, 1.5));
  scene.add(tree);
}

// Flowers
const flowerColors = [0xff5da2, 0xffd23f, 0xffffff, 0xb98cff, 0xff8a5c];
for (let i = 0; i < 46; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = rand(4, 27);
  const f = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5), mat(0x3f9e3f));
  stem.position.y = 0.25;
  f.add(stem);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), mat(pick(flowerColors), { roughness: 0.5 }));
  head.position.y = 0.55;
  f.add(head);
  f.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  scene.add(f);
}

// Bunting (party flag garlands)
function bunting(ax, az, bx, bz, height) {
  const a = new THREE.Vector3(ax, height, az);
  const b = new THREE.Vector3(bx, height, bz);
  [a, b].forEach((p) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, height, 8), mat(0xffffff));
    pole.position.set(p.x, height / 2, p.z);
    pole.castShadow = true;
    scene.add(pole);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat(0xff5da2));
    ball.position.set(p.x, height + 0.15, p.z);
    scene.add(ball);
  });
  const mid = a.clone().lerp(b, 0.5); mid.y -= 1.7;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const rope = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.025, 5), mat(0xffffff));
  scene.add(rope);
  const flagCols = [0xff5da2, 0xffd23f, 0x3fd2ff, 0x7cf585];
  const shape = new THREE.Shape();
  shape.moveTo(-0.3, 0); shape.lineTo(0.3, 0); shape.lineTo(0, -0.6); shape.closePath();
  const flagGeo = new THREE.ShapeGeometry(shape);
  for (let i = 1; i < 12; i++) {
    const t = i / 12;
    const p = curve.getPoint(t);
    const tan = curve.getTangent(t);
    const flag = new THREE.Mesh(flagGeo, new THREE.MeshStandardMaterial({ color: flagCols[i % 4], side: THREE.DoubleSide }));
    flag.position.copy(p);
    flag.rotation.y = Math.atan2(tan.x, tan.z);
    scene.add(flag);
  }
}
bunting(-9, -13, 9, -13, 5.6);
bunting(-12, 5, -2, 12, 5.2);
bunting(12, 6, 3, 13, 5.2);

// Birthday cake table
const CAKE_POS = new THREE.Vector3(0, 0, -8);
{
  const table = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.14, 20), mat(0xffffff));
  top.position.y = 0.95; top.castShadow = true;
  table.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.95, 10), mat(0xffd9e8));
  leg.position.y = 0.48;
  table.add(leg);

  const tiers = [
    [1.1, 0.45, 0xff8fb0],
    [0.8, 0.4, 0xffffff],
    [0.52, 0.35, 0xff8fb0],
  ];
  let y = 1.02;
  tiers.forEach(([r, h, c]) => {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), mat(c, { roughness: 0.5 }));
    t.position.y = y + h / 2; t.castShadow = true;
    table.add(t);
    y += h;
  });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.3, 6), mat(0x3fd2ff));
    candle.position.set(Math.cos(a) * 0.25, y + 0.15, Math.sin(a) * 0.25);
    table.add(candle);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 6), new THREE.MeshBasicMaterial({ color: 0xffb703 }));
    flame.position.set(Math.cos(a) * 0.25, y + 0.36, Math.sin(a) * 0.25);
    table.add(flame);
  }
  table.position.copy(CAKE_POS);
  scene.add(table);
}
const candleLight = new THREE.PointLight(0xffc46b, 1.1, 7);
candleLight.position.set(CAKE_POS.x, 2.6, CAKE_POS.z);
scene.add(candleLight);

// Disco ball above the cake
const disco = new THREE.Mesh(
  new THREE.SphereGeometry(0.75, 20, 14),
  new THREE.MeshStandardMaterial({ color: 0xcfd8ff, metalness: 0.55, roughness: 0.25, emissive: 0x5566aa, emissiveIntensity: 0.35 })
);
disco.position.set(CAKE_POS.x, 7, CAKE_POS.z);
scene.add(disco);
const discoRope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4, 5), mat(0xffffff));
discoRope.position.set(CAKE_POS.x, 9.2, CAKE_POS.z);
scene.add(discoRope);
const discoLight = new THREE.PointLight(0xffffff, 0.5, 32);
discoLight.position.copy(disco.position);
scene.add(discoLight);

// Floating balloons near the cake
const balloons = [];
for (let i = 0; i < 7; i++) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 12), mat(pick([0xff5da2, 0xffd23f, 0x3fd2ff, 0xb98cff, 0x7cf585]), { roughness: 0.35 }));
  b.scale.y = 1.15; b.castShadow = true;
  g.add(b);
  const str = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.6, 4), mat(0xffffff));
  str.position.y = -1.05;
  g.add(str);
  const a = (i / 7) * Math.PI * 2;
  g.position.set(CAKE_POS.x + Math.cos(a) * rand(3, 4.5), rand(2.6, 4.2), CAKE_POS.z + Math.sin(a) * rand(3, 4.5));
  g.userData.phase = Math.random() * Math.PI * 2;
  balloons.push(g);
  scene.add(g);
}

// Muddy puddles!
const puddles = [];
const puddleSpots = [[-8, 5], [9, 8], [-3, 15], [12, -3], [-14, -5]];
for (const [x, z] of puddleSpots) {
  const p = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.7, 0.1, 18),
    mat(0x8a5a33, { roughness: 0.08, metalness: 0.35 })
  );
  p.position.set(x, 0.05, z);
  p.receiveShadow = true;
  p.userData.cool = 0;
  puddles.push(p);
  scene.add(p);
}

// ============================================================
//  THE PIG — pink, red dress, yellow boots, party hat
// ============================================================
const pig = new THREE.Group();
const pigParts = {};
{
  const pink = mat(0xffa8c5, { roughness: 0.6 });
  const pinkLight = mat(0xffc4d8, { roughness: 0.6 });
  const red = mat(0xe63946, { roughness: 0.6 });

  // Dress
  const dress = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.5, 24), red);
  dress.position.y = 0.95; dress.castShadow = true;
  pig.add(dress);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 16), pink);
  head.position.y = 2.0; head.castShadow = true;
  pig.add(head);

  // Snout
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.3, 14), pinkLight);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, 1.95, 0.62);
  pig.add(snout);
  [-0.09, 0.09].forEach((x) => {
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), mat(0xc25a7e));
    n.position.set(x, 1.95, 0.78);
    pig.add(n);
  });

  // Eyes
  [-0.22, 0.22].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mat(0xffffff, { roughness: 0.3 }));
    eye.position.set(x, 2.18, 0.5);
    pig.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(0x222222));
    pupil.position.set(x, 2.18, 0.61);
    pig.add(pupil);
  });

  // Rosy cheeks
  [-0.4, 0.4].forEach((x) => {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), mat(0xff7ba0));
    cheek.scale.z = 0.4;
    cheek.position.set(x, 1.88, 0.44);
    pig.add(cheek);
  });

  // Smile
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.03, 8, 16, Math.PI), mat(0xc25a7e));
  smile.rotation.z = Math.PI;
  smile.position.set(0, 1.82, 0.58);
  pig.add(smile);

  // Ears
  [-0.28, 0.28].forEach((x) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 8), pink);
    ear.position.set(x, 2.58, 0);
    ear.rotation.z = x > 0 ? -0.35 : 0.35;
    pig.add(ear);
  });

  // Party hat
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.55, 12), mat(0xffd23f, { roughness: 0.5 }));
  hat.position.set(0, 2.78, 0);
  pig.add(hat);
  const hatBand = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.045, 8, 16), mat(0xff5da2));
  hatBand.rotation.x = Math.PI / 2;
  hatBand.position.set(0, 2.55, 0);
  pig.add(hatBand);
  const pom = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), mat(0xffffff));
  pom.position.set(0, 3.08, 0);
  pig.add(pom);

  // Arms (pivot at shoulder)
  [-1, 1].forEach((side) => {
    const arm = new THREE.Group();
    const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 8), pink);
    limb.position.y = -0.25;
    arm.add(limb);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), pinkLight);
    hand.position.y = -0.5;
    arm.add(hand);
    arm.position.set(side * 0.62, 1.3, 0);
    arm.rotation.z = side * 0.6;
    pig.add(arm);
    pigParts[side < 0 ? 'armL' : 'armR'] = arm;
  });

  // Legs + yellow boots
  [-0.25, 0.25].forEach((x, i) => {
    const leg = new THREE.Group();
    const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 8), pink);
    limb.position.y = -0.25;
    leg.add(limb);
    const boot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat(0xffd23f, { roughness: 0.4 }));
    boot.scale.z = 1.4;
    boot.position.set(0, -0.5, 0.05);
    leg.add(boot);
    leg.position.set(x, 0.55, 0);
    pig.add(leg);
    pigParts[i === 0 ? 'legL' : 'legR'] = leg;
  });

  // Curly tail
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.15, -0.5),
    new THREE.Vector3(0.18, 1.2, -0.72),
    new THREE.Vector3(0.05, 1.32, -0.88),
    new THREE.Vector3(-0.12, 1.22, -0.92),
  ]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 16, 0.035, 6), pink);
  pig.add(tail);
}
scene.add(pig);

// ============================================================
//  TREATS to collect (cupcakes, presents, donuts)
// ============================================================
function makeCupcake() {
  const g = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.2, 0.32, 12), mat(pick([0x3fd2ff, 0xffd23f, 0xb98cff]), { roughness: 0.5 }));
  cup.position.y = 0.16; g.add(cup);
  const frost = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), mat(pick([0xff8fb0, 0xffffff]), { roughness: 0.4 }));
  frost.scale.y = 0.8; frost.position.y = 0.45; g.add(frost);
  const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), mat(0xe63946, { roughness: 0.3 }));
  cherry.position.y = 0.68; g.add(cherry);
  return g;
}
function makePresent() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.55), mat(pick([0xff5da2, 0x3fd2ff, 0x7cf585]), { roughness: 0.5 }));
  box.position.y = 0.25; g.add(box);
  const rib1 = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.52, 0.12), mat(0xffd23f, { roughness: 0.4 }));
  rib1.position.y = 0.25; g.add(rib1);
  const rib2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.52, 0.58), mat(0xffd23f, { roughness: 0.4 }));
  rib2.position.y = 0.25; g.add(rib2);
  return g;
}
function makeDonut() {
  const g = new THREE.Group();
  const d = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.15, 10, 20), mat(pick([0xff8fb0, 0xffd23f, 0xb98cff]), { roughness: 0.4 }));
  d.rotation.x = Math.PI / 2;
  d.position.y = 0.3;
  g.add(d);
  return g;
}

const treats = [];
function placeTreats() {
  for (const t of treats) {
    let x, z, ok, tries = 0;
    do {
      ok = true;
      const a = Math.random() * Math.PI * 2;
      const r = rand(5, 25);
      x = Math.cos(a) * r; z = Math.sin(a) * r;
      if (Math.hypot(x - CAKE_POS.x, z - CAKE_POS.z) < 4) ok = false;
      for (const p of puddles) if (Math.hypot(x - p.position.x, z - p.position.z) < 3) ok = false;
      for (const o of treats) if (o !== t && o.visible && Math.hypot(x - o.position.x, z - o.position.z) < 4) ok = false;
    } while (!ok && ++tries < 40);
    t.position.set(x, 0.75, z);
    t.visible = true;
  }
}
for (let i = 0; i < TOTAL_TREATS; i++) {
  const makers = [makeCupcake, makePresent, makeDonut];
  const t = makers[i % 3]();
  t.userData.phase = Math.random() * Math.PI * 2;
  t.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  treats.push(t);
  scene.add(t);
}
placeTreats();

// ============================================================
//  CONFETTI / FIREWORK PARTICLES
// ============================================================
const P_MAX = 1000;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(P_MAX * 3).fill(-999);
const pCol = new Float32Array(P_MAX * 3);
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const points = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.22, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false }));
points.frustumCulled = false;
scene.add(points);

const parts = Array.from({ length: P_MAX }, () => ({ active: false, vx: 0, vy: 0, vz: 0, life: 0, g: 9 }));
let pCursor = 0;
const CONFETTI_COLS = [0xff5da2, 0xffd23f, 0x3fd2ff, 0x7cf585, 0xb98cff, 0xff8a5c];

function spawnParticles(origin, count, { speed = 5, up = 4, spread = 0.4, gravity = 9, life = 1.6, radial = false, colors = CONFETTI_COLS } = {}) {
  for (let n = 0; n < count; n++) {
    const i = pCursor = (pCursor + 1) % P_MAX;
    const p = parts[i];
    p.active = true;
    p.life = life * rand(0.6, 1.3);
    p.g = gravity;
    pPos[i * 3] = origin.x + rand(-spread, spread);
    pPos[i * 3 + 1] = origin.y + rand(-spread, spread);
    pPos[i * 3 + 2] = origin.z + rand(-spread, spread);
    if (radial) {
      const th = Math.random() * Math.PI * 2, ph = Math.acos(rand(-1, 1));
      const s = speed * rand(0.45, 1);
      p.vx = Math.sin(ph) * Math.cos(th) * s;
      p.vy = Math.cos(ph) * s;
      p.vz = Math.sin(ph) * Math.sin(th) * s;
    } else {
      p.vx = rand(-0.5, 0.5) * speed;
      p.vz = rand(-0.5, 0.5) * speed;
      p.vy = up * rand(0.5, 1.1);
    }
    const c = new THREE.Color(pick(colors));
    pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b;
  }
  pGeo.attributes.color.needsUpdate = true;
}

function updateParticles(dt) {
  for (let i = 0; i < P_MAX; i++) {
    const p = parts[i];
    if (!p.active) continue;
    pPos[i * 3] += p.vx * dt;
    pPos[i * 3 + 1] += p.vy * dt;
    pPos[i * 3 + 2] += p.vz * dt;
    p.vy -= p.g * dt;
    p.life -= dt;
    if (p.life <= 0) { p.active = false; pPos[i * 3 + 1] = -999; }
  }
  pGeo.attributes.position.needsUpdate = true;
}

// ============================================================
//  INPUT — keyboard + virtual joystick + buttons
// ============================================================
const keys = {};
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  keys[k] = true;
  if (k === ' ') toggleDance();
  if (k === 'm') toggleMusic();
});
addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

const joy = { x: 0, y: 0, id: null };
function joyMove(e) {
  const rect = joyEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  let dx = e.clientX - cx, dy = e.clientY - cy;
  const max = rect.width / 2 - 10;
  const d = Math.hypot(dx, dy);
  if (d > max) { dx = dx / d * max; dy = dy / d * max; }
  joy.x = dx / max; joy.y = dy / max;
  joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}
function joyReset() {
  joy.x = 0; joy.y = 0; joy.id = null;
  joyKnob.style.transform = 'translate(-50%,-50%)';
}
joyEl.addEventListener('pointerdown', (e) => { joy.id = e.pointerId; joyEl.setPointerCapture(e.pointerId); joyMove(e); });
joyEl.addEventListener('pointermove', (e) => { if (joy.id === e.pointerId) joyMove(e); });
joyEl.addEventListener('pointerup', joyReset);
joyEl.addEventListener('pointercancel', joyReset);

// ============================================================
//  GAME STATE
// ============================================================
let collected = 0;
let dancing = false;
let party = false;
let walkPhase = 0;
let vy = 0, airY = 0;
let fireTimer = 0, rainTimer = 0, noteTimer = 0;
let bannerTimeout = null;

function showBanner(text, dur = 1200, big = false) {
  bannerEl.textContent = text;
  bannerEl.classList.toggle('big', big);
  bannerEl.classList.add('show');
  clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(() => bannerEl.classList.remove('show'), dur);
}

function toggleDance() {
  dancing = !dancing;
  danceBtn.classList.toggle('on', dancing);
  if (dancing) { sfxBoing(); showBanner(pick(["Let's dance! 💃", 'Boogie time! 🕺', 'Dance dance dance! 🎶']), 1000); }
}
danceBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); toggleDance(); });

function toggleMusic() {
  musicOn = !musicOn;
  musicBtn.textContent = musicOn ? '🎵' : '🔇';
}
musicBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); toggleMusic(); });

function collectTreat(t) {
  t.visible = false;
  collected++;
  starCountEl.textContent = collected;
  spawnParticles(t.position, 26, { speed: 4.5, up: 5, life: 1.3 });
  sfxCollect();
  if (collected >= TOTAL_TREATS) {
    startParty();
  } else {
    showBanner(pick(['Yummy! 😋', 'Hooray! ⭐', 'Yippee! 🎈', 'So tasty! 🧁', 'Wheee! 🎉']));
  }
}

function startParty() {
  party = true;
  if (!dancing) toggleDance();
  showBanner('🎉 PARTY TIME! 🎉', 4000, true);
  sfxFanfare();
  setTimeout(() => { againBtn.style.display = 'block'; }, 2500);
}

againBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  collected = 0;
  starCountEl.textContent = '0';
  party = false;
  if (dancing) toggleDance();
  againBtn.style.display = 'none';
  placeTreats();
  showBanner('Go go go! 🐷', 1200);
});

// Start overlay — also unlocks audio
$('playBtn').addEventListener('click', () => {
  initAudio();
  $('startOverlay').classList.add('hide');
  showBanner('Find the party treats! ⭐', 2000);
});

// ============================================================
//  MAIN LOOP
// ============================================================
const camTarget = new THREE.Vector3(0, 0, 4);
const clock = new THREE.Clock();

function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // --- Movement ---
  const ix = ((keys.arrowright || keys.d) ? 1 : 0) - ((keys.arrowleft || keys.a) ? 1 : 0) + joy.x;
  const iz = ((keys.arrowdown || keys.s) ? 1 : 0) - ((keys.arrowup || keys.w) ? 1 : 0) + joy.y;
  const len = Math.hypot(ix, iz);
  const moving = len > 0.15 && !dancing;

  if (moving) {
    const nx = ix / Math.max(len, 1), nz = iz / Math.max(len, 1);
    pig.position.x += nx * SPEED * dt;
    pig.position.z += nz * SPEED * dt;
    const d = Math.hypot(pig.position.x, pig.position.z);
    if (d > WORLD_R) { pig.position.x *= WORLD_R / d; pig.position.z *= WORLD_R / d; }
    pig.rotation.y = lerpAngle(pig.rotation.y, Math.atan2(nx, nz), 1 - Math.pow(0.0001, dt));
    walkPhase += dt * 11;
  }

  // --- Pig animation ---
  if (dancing) {
    pig.rotation.y += dt * 6;
    pigParts.armL.rotation.z = -2.4 + Math.sin(t * 8) * 0.4;
    pigParts.armR.rotation.z = 2.4 - Math.sin(t * 8) * 0.4;
    pigParts.legL.rotation.x = 0;
    pigParts.legR.rotation.x = 0;
  } else {
    const swing = moving ? Math.sin(walkPhase) * 0.55 : 0;
    pigParts.legL.rotation.x = swing;
    pigParts.legR.rotation.x = -swing;
    pigParts.armL.rotation.z = -0.6 - (moving ? Math.sin(walkPhase) * 0.3 : 0);
    pigParts.armR.rotation.z = 0.6 + (moving ? Math.sin(walkPhase) * 0.3 : 0);
  }

  // Hop physics (puddle jumps)
  airY += vy * dt;
  vy -= 13 * dt;
  if (airY <= 0) { airY = 0; vy = 0; }
  const bob = dancing ? Math.abs(Math.sin(t * 8)) * 0.35 : (moving ? Math.abs(Math.sin(walkPhase)) * 0.13 : 0);
  pig.position.y = airY + bob;

  // --- Treats: bob, spin, collect ---
  for (const tr of treats) {
    if (!tr.visible) continue;
    tr.rotation.y += dt * 1.5;
    tr.position.y = 0.75 + Math.sin(t * 2.2 + tr.userData.phase) * 0.15;
    if (Math.hypot(pig.position.x - tr.position.x, pig.position.z - tr.position.z) < 1.5) collectTreat(tr);
  }

  // --- Puddles: splash! ---
  for (const p of puddles) {
    p.userData.cool -= dt;
    if (p.userData.cool <= 0 && airY === 0 &&
        Math.hypot(pig.position.x - p.position.x, pig.position.z - p.position.z) < 1.4) {
      p.userData.cool = 1.4;
      vy = 5;
      sfxSplat();
      showBanner(pick(['SPLASH! 💦', 'Muddy puddle! 🐷', 'Squelch squelch! 💦']), 900);
      spawnParticles(p.position.clone().setY(0.3), 30, { speed: 5, up: 5.5, gravity: 12, life: 0.9, colors: [0x8a5a33, 0xa06a42, 0x6b4423] });
    }
  }

  // --- Party mode: fireworks + confetti rain ---
  if (party) {
    fireTimer -= dt;
    if (fireTimer <= 0) {
      fireTimer = rand(0.4, 0.9);
      const sky = new THREE.Vector3(rand(-16, 16), rand(11, 19), rand(-14, 6));
      spawnParticles(sky, 70, { radial: true, speed: 8, gravity: 3.2, life: 2.1 });
      sfxPop();
    }
    rainTimer -= dt;
    if (rainTimer <= 0) {
      rainTimer = 0.08;
      spawnParticles(new THREE.Vector3(pig.position.x + rand(-12, 12), 15, pig.position.z + rand(-12, 12)), 2, { speed: 0.4, up: -2.5, gravity: 0.9, life: 4 });
    }
  }

  // Dance sparkles
  if (dancing) {
    noteTimer -= dt;
    if (noteTimer <= 0) {
      noteTimer = 0.22;
      spawnParticles(pig.position.clone().setY(2.6), 3, { speed: 1.5, up: 2.2, gravity: 1.2, life: 1.2, colors: [0xffd23f, 0xff5da2, 0x3fd2ff] });
    }
  }

  updateParticles(dt);

  // --- Ambient life ---
  for (const c of clouds) {
    c.position.x += dt * 0.4;
    if (c.position.x > 45) c.position.x = -45;
  }
  for (const b of balloons) {
    b.position.y += Math.sin(t * 1.5 + b.userData.phase) * dt * 0.35;
    b.rotation.z = Math.sin(t + b.userData.phase) * 0.08;
  }
  disco.rotation.y += dt * (dancing || party ? 3 : 0.6);
  if (dancing || party) {
    discoLight.color.setHSL((t * 0.4) % 1, 1, 0.6);
    discoLight.intensity = 2.6;
  } else {
    discoLight.color.set(0xffffff);
    discoLight.intensity = 0.5;
  }
  candleLight.intensity = 1 + Math.sin(t * 9) * 0.25;

  // --- Camera follows pig ---
  camTarget.lerp(pig.position, 1 - Math.pow(0.001, dt));
  camera.position.set(camTarget.x, 11, camTarget.z + 14);
  camera.lookAt(camTarget.x, 1.6, camTarget.z);

  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
