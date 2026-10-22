import * as THREE from 'three';

export type PlacedObjectType =
  | 'house'
  | 'windmill'
  | 'lighthouse'
  | 'well'
  | 'fence'
  | 'path'
  | 'oak'
  | 'pine'
  | 'palm'
  | 'sakura'
  | 'torii'
  | 'onsen'
  | 'crystal'
  | 'pavilion'
  | 'flower'
  | 'dock'
  | 'bridge'
  | 'campfire'
  | 'watchtower'
  | 'beehive'
  | 'lantern'
  | 'rainbow';

export interface PlacedObjectEntity {
  id: string;
  type: PlacedObjectType;
  dir: THREE.Vector3;
  yaw: number;
  mesh: THREE.Group;
  baseScale: number;
  growth: number;
  targetGrowth: number;
  bounceTime: number;
  bounceActive: boolean;
  // Dynamic parts for animation
  windmillRotor?: THREE.Object3D;
  lighthouseBeamPivot?: THREE.Object3D;
  lighthouseConeMats?: THREE.MeshBasicMaterial[];
  lighthousePointLight?: THREE.PointLight;
  windowMaterials?: THREE.MeshStandardMaterial[];
  campfireFlameGroup?: THREE.Group;
  campfireEmbers?: THREE.Points;
  campfireLight?: THREE.PointLight;
  watchtowerFlag?: THREE.Mesh;
  butterflySwarm?: THREE.Group;
  steamParticles?: THREE.Points;
  crystalMat?: THREE.MeshStandardMaterial;
  crystalLight?: THREE.PointLight;
  petalParticles?: THREE.Points;
  pavilionLanternLight?: THREE.PointLight;
  removable: boolean;
}

export interface DeerEntity {
  id: string;
  mesh: THREE.Group;
  headGroup: THREE.Group;
  legs: THREE.Group[];
  tailMesh: THREE.Object3D;
  dir: THREE.Vector3;
  targetDir: THREE.Vector3;
  speed: number;
  walkPhase: number;
  grazeTimer: number;
  isGrazing: boolean;
  bounceTime: number;
  yaw: number;
}

export interface VillagerEntity {
  id: string;
  mesh: THREE.Group;
  bodyMesh: THREE.Object3D;
  headGroup: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  dir: THREE.Vector3;
  targetDir: THREE.Vector3;
  speed: number;
  walkPhase: number;
  pauseTimer: number;
  headingToWell: boolean;
  bounceTime: number;
  yaw: number;
  stuckTimer?: number;
  steerSign?: number;
}

export interface SheepEntity {
  id: string;
  mesh: THREE.Group;
  headGroup: THREE.Group;
  legs: THREE.Group[];
  tailMesh: THREE.Object3D;
  dir: THREE.Vector3;
  targetDir: THREE.Vector3;
  speed: number;
  walkPhase: number;
  grazeTimer: number;
  isGrazing: boolean;
  bounceTime: number;
  yaw: number;
  inPasture?: boolean;
}

export interface CloudEntity {
  id: string;
  isSnow: boolean;
  mesh: THREE.Group;
  rainLines: THREE.LineSegments;
  rainMat: THREE.LineBasicMaterial;
  snowPoints?: THREE.Points;
  snowMat?: THREE.PointsMaterial;
  orbitAxis: THREE.Vector3;
  currentDir: THREE.Vector3;
  orbitSpeed: number;
  altitude: number;
  rainTimer: number;
  isRaining: boolean;
  bounceTime: number;
}

export interface SailboatEntity {
  id: string;
  mesh: THREE.Group;
  hullGroup: THREE.Group;
  lanternMat: THREE.MeshStandardMaterial;
  dir: THREE.Vector3;
  targetDir: THREE.Vector3;
  speed: number;
  bobPhase: number;
  yaw: number;
}

export interface DuckEntity {
  id: string;
  mesh: THREE.Group;
  rippleRings: THREE.Mesh[];
  dir: THREE.Vector3;
  targetDir: THREE.Vector3;
  speed: number;
  bobPhase: number;
  yaw: number;
}

export interface BalloonEntity {
  id: string;
  mesh: THREE.Group;
  burnerMat: THREE.MeshStandardMaterial;
  orbitAxis: THREE.Vector3;
  currentDir: THREE.Vector3;
  orbitSpeed: number;
  baseAltitude: number;
  phase: number;
}

export interface ShootingStarEntity {
  id: string;
  mesh: THREE.Group;
  orbitAxis: THREE.Vector3;
  currentDir: THREE.Vector3;
  speed: number;
  altitude: number;
  age: number;
  maxAge: number;
  sparkleTimer: number;
}

const HOUSE_PALETTES = [
  { wall: '#fae4ad', roof: '#d96b4c', door: '#6e472b', trim: '#fffdf7', shutter: '#58826b' },
  { wall: '#f7c5b4', roof: '#6b7d99', door: '#593a28', trim: '#fcf9f2', shutter: '#4f627d' },
  { wall: '#c5e8cf', roof: '#c95b49', door: '#63412c', trim: '#ffffff', shutter: '#a85042' },
  { wall: '#ced7f7', roof: '#8f6578', door: '#4d3527', trim: '#faf8f5', shutter: '#6e4f5d' },
];

export function createPastelHouseMesh(variantIndex: number): {
  group: THREE.Group;
  windowMaterials: THREE.MeshStandardMaterial[];
} {
  const palette = HOUSE_PALETTES[variantIndex % HOUSE_PALETTES.length];
  const group = new THREE.Group();
  const windowMaterials: THREE.MeshStandardMaterial[] = [];

  const plinthMat = new THREE.MeshStandardMaterial({
    color: '#9c9891',
    roughness: 0.88,
    flatShading: true,
  });
  const stoneQuoinMat = new THREE.MeshStandardMaterial({
    color: '#858079',
    roughness: 0.9,
    flatShading: true,
  });
  const timberMat = new THREE.MeshStandardMaterial({
    color: '#6b4930',
    roughness: 0.82,
  });

  // Stone foundation plinth + front porch step + stepping stones
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, 0.022, 0.058),
    plinthMat,
  );
  plinth.position.y = 0.004;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const doorstep = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.007, 0.014),
    stoneQuoinMat,
  );
  doorstep.position.set(-0.01, 0.012, 0.032);
  group.add(doorstep);

  const frontStone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.008, 0.004, 6),
    stoneQuoinMat,
  );
  frontStone.position.set(-0.01, 0.008, 0.044);
  group.add(frontStone);

  const wallMat = new THREE.MeshStandardMaterial({
    color: palette.wall,
    roughness: 0.76,
    flatShading: true,
  });
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(0.062, 0.048, 0.052),
    wallMat,
  );
  walls.position.y = 0.036;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  // Corner timber posts & horizontal half-timber beams
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const cornerPost = new THREE.Mesh(
        new THREE.BoxGeometry(0.0038, 0.049, 0.0038),
        timberMat,
      );
      cornerPost.position.set(sx * 0.0305, 0.036, sz * 0.0255);
      group.add(cornerPost);
    }
  }
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(0.064, 0.0032, 0.054),
    timberMat,
  );
  beam.position.y = 0.059;
  group.add(beam);

  const gableGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.052, 3);
  gableGeo.rotateY(Math.PI / 2);
  gableGeo.scale(1.0, 0.55, 1.0);
  const gable = new THREE.Mesh(gableGeo, wallMat);
  gable.position.y = 0.066;
  gable.castShadow = true;
  group.add(gable);

  // Exposed gable collar beam & bargeboards on front and back gables
  for (const sz of [-0.0262, 0.0262]) {
    const collarBeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.0024, 0.0024),
      timberMat,
    );
    collarBeam.position.set(0, 0.071, sz);
    group.add(collarBeam);

    const kingPost = new THREE.Mesh(
      new THREE.BoxGeometry(0.0024, 0.015, 0.0024),
      timberMat,
    );
    kingPost.position.set(0, 0.077, sz);
    group.add(kingPost);
  }

  const tileMat = new THREE.MeshStandardMaterial({
    color: palette.roof,
    roughness: 0.65,
    flatShading: true,
  });
  const tileAltMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(palette.roof).offsetHSL(0.01, 0.03, -0.05),
    roughness: 0.65,
    flatShading: true,
  });

  // Layered shingle courses + bargeboard trim
  const roofSlopeAngle = 0.62;
  for (let side = -1; side <= 1; side += 2) {
    for (let row = 0; row < 5; row++) {
      const t = row / 4;
      const distDown = 0.005 + (1 - t) * 0.027;
      const yPos = 0.083 - (1 - t) * 0.022;
      const xPos = side * distDown;

      const tileRow = new THREE.Mesh(
        new THREE.BoxGeometry(0.0105, 0.0045, 0.063),
        row % 2 === 0 ? tileMat : tileAltMat,
      );
      tileRow.position.set(xPos, yPos, 0);
      tileRow.rotation.z = -side * roofSlopeAngle;
      tileRow.castShadow = true;
      tileRow.receiveShadow = true;
      group.add(tileRow);
    }
  }

  const ridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, 0.006, 0.065),
    tileMat,
  );
  ridge.position.set(0, 0.086, 0);
  ridge.castShadow = true;
  group.add(ridge);

  // Brick Chimney + Rim + Terracotta Chimney Pot
  const chimneyMat = new THREE.MeshStandardMaterial({
    color: '#b85d4b',
    roughness: 0.8,
  });
  const chimneyRimMat = new THREE.MeshStandardMaterial({
    color: '#e6dcd2',
    roughness: 0.7,
  });
  const chimneyShaft = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.028, 0.012),
    chimneyMat,
  );
  chimneyShaft.position.set(0.016, 0.084, -0.012);
  chimneyShaft.castShadow = true;
  group.add(chimneyShaft);

  const chimneyRim = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, 0.0045, 0.016),
    chimneyRimMat,
  );
  chimneyRim.position.set(0.016, 0.098, -0.012);
  chimneyRim.castShadow = true;
  group.add(chimneyRim);

  const chimneyPot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0032, 0.004, 0.007, 8),
    chimneyMat,
  );
  chimneyPot.position.set(0.016, 0.103, -0.012);
  group.add(chimneyPot);

  // Arched wooden plank door + timber canopy awning + brass doorknob + iron strap hinges
  const doorMat = new THREE.MeshStandardMaterial({
    color: palette.door,
    roughness: 0.8,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: palette.trim,
    roughness: 0.7,
  });
  const doorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, 0.026, 0.0035),
    frameMat,
  );
  doorFrame.position.set(-0.01, 0.027, 0.026);
  group.add(doorFrame);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.013, 0.024, 0.0045),
    doorMat,
  );
  door.position.set(-0.01, 0.026, 0.0265);
  group.add(door);

  const doorAwning = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.003, 0.011),
    tileMat,
  );
  doorAwning.position.set(-0.01, 0.041, 0.029);
  doorAwning.rotation.x = 0.28;
  group.add(doorAwning);

  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.0012, 6, 6),
    new THREE.MeshStandardMaterial({ color: '#e5bc57', metalness: 0.7, roughness: 0.25 }),
  );
  knob.position.set(-0.006, 0.025, 0.0292);
  group.add(knob);

  // Banded wooden rain barrel at front right corner + stacked firewood logs along side wall
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0052, 0.0046, 0.013, 8),
    timberMat,
  );
  barrel.position.set(0.028, 0.019, 0.03);
  barrel.castShadow = true;
  group.add(barrel);

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3 - row; col++) {
      const log = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0022, 0.0022, 0.014, 6),
        timberMat,
      );
      log.rotation.x = Math.PI / 2;
      log.position.set(
        -0.034,
        0.016 + row * 0.0038,
        -0.01 + col * 0.0046 + row * 0.0023,
      );
      group.add(log);
    }
  }

  const winMat = new THREE.MeshStandardMaterial({
    color: '#fff3c4',
    emissive: new THREE.Color('#ffae38'),
    emissiveIntensity: 0.25,
    roughness: 0.2,
  });
  windowMaterials.push(winMat);

  const shutterMat = new THREE.MeshStandardMaterial({
    color: palette.shutter,
    roughness: 0.75,
  });

  const addWindow = (x: number, y: number, z: number, rotY: number, withFlowerBox: boolean) => {
    const winGroup = new THREE.Group();
    winGroup.position.set(x, y, z);
    winGroup.rotation.y = rotY;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.015, 0.015, 0.003),
      frameMat,
    );
    const pane = new THREE.Mesh(
      new THREE.BoxGeometry(0.011, 0.011, 0.004),
      winMat,
    );
    const vBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.0016, 0.013, 0.0048),
      frameMat,
    );
    const hBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.013, 0.0016, 0.0048),
      frameMat,
    );
    winGroup.add(frame, pane, vBar, hBar);

    // Louvered side shutters
    for (const side of [-1, 1]) {
      const shutter = new THREE.Mesh(
        new THREE.BoxGeometry(0.0042, 0.0145, 0.0025),
        shutterMat,
      );
      shutter.position.set(side * 0.0095, 0, 0.0012);
      shutter.rotation.y = -side * 0.18;
      winGroup.add(shutter);
    }

    // Window sill + flower box with colorful blossoms
    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.0025, 0.0055),
      timberMat,
    );
    sill.position.set(0, -0.0082, 0.002);
    winGroup.add(sill);

    if (withFlowerBox) {
      const planter = new THREE.Mesh(
        new THREE.BoxGeometry(0.015, 0.004, 0.005),
        timberMat,
      );
      planter.position.set(0, -0.0095, 0.0032);
      winGroup.add(planter);

      const bloomCols = ['#ff7890', '#ffe066', '#b892ff'];
      for (let b = -1; b <= 1; b++) {
        const bloom = new THREE.Mesh(
          new THREE.SphereGeometry(0.0022, 6, 6),
          new THREE.MeshStandardMaterial({ color: bloomCols[b + 1], roughness: 0.6 }),
        );
        bloom.position.set(b * 0.0042, -0.0068, 0.0038);
        winGroup.add(bloom);
      }
    }

    group.add(winGroup);
  };

  addWindow(0.013, 0.036, 0.026, 0, true);
  addWindow(0.031, 0.036, 0.0, Math.PI / 2, true);
  addWindow(-0.031, 0.036, 0.0, -Math.PI / 2, false);
  // Attic gable circular window + frame
  const atticFrame = new THREE.Mesh(
    new THREE.TorusGeometry(0.0052, 0.001, 6, 12),
    timberMat,
  );
  atticFrame.position.set(0, 0.066, 0.0265);
  group.add(atticFrame);

  const atticWin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0048, 0.0048, 0.004, 10),
    winMat,
  );
  atticWin.rotation.x = Math.PI / 2;
  atticWin.position.set(0, 0.066, 0.0255);
  group.add(atticWin);

  return { group, windowMaterials };
}

export function createWhiteWindmillMesh(): {
  group: THREE.Group;
  rotor: THREE.Group;
  windowMaterials: THREE.MeshStandardMaterial[];
} {
  const group = new THREE.Group();
  const windowMaterials: THREE.MeshStandardMaterial[] = [];

  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#9e978d',
    roughness: 0.88,
    flatShading: true,
  });
  const darkStoneMat = new THREE.MeshStandardMaterial({
    color: '#827c73',
    roughness: 0.9,
    flatShading: true,
  });
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.044, 0.026, 10),
    stoneMat,
  );
  base.position.y = 0.012;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Projecting dressed stone masonry quoins around the octagonal base
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(0.011, 0.009, 0.006),
      i % 2 === 0 ? darkStoneMat : stoneMat,
    );
    block.position.set(Math.sin(a) * 0.04, 0.009 + (i % 2) * 0.007, Math.cos(a) * 0.04);
    block.rotation.y = a;
    group.add(block);
  }

  const whiteMat = new THREE.MeshStandardMaterial({
    color: '#f8f6f0',
    roughness: 0.72,
    flatShading: true,
  });
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.035, 0.088, 10),
    whiteMat,
  );
  tower.position.y = 0.064;
  tower.castShadow = true;
  tower.receiveShadow = true;
  group.add(tower);

  const woodMat = new THREE.MeshStandardMaterial({
    color: '#785235',
    roughness: 0.8,
  });

  // Arched miller's door + stone steps + two burlap flour sacks beside the entry
  const doorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.023, 0.005),
    darkStoneMat,
  );
  doorFrame.position.set(0, 0.018, 0.038);
  group.add(doorFrame);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.02, 0.006),
    woodMat,
  );
  door.position.set(0, 0.018, 0.0385);
  group.add(door);

  const step = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.006, 0.012),
    darkStoneMat,
  );
  step.position.set(0, 0.005, 0.044);
  group.add(step);

  const sackMat = new THREE.MeshStandardMaterial({
    color: '#e8dec3',
    roughness: 0.88,
    flatShading: true,
  });
  for (let s = 0; s < 2; s++) {
    const sack = new THREE.Mesh(
      new THREE.SphereGeometry(0.0052, 7, 7),
      sackMat,
    );
    sack.scale.set(0.9, 1.25, 0.85);
    sack.position.set(0.014 + s * 0.006, 0.009, 0.039 - s * 0.004);
    sack.rotation.z = -0.15 + s * 0.25;
    sack.castShadow = true;
    group.add(sack);
  }

  // Octagonal timber balcony gallery + handrail posts + top rail
  const gallery = new THREE.Mesh(
    new THREE.CylinderGeometry(0.039, 0.036, 0.0048, 10),
    woodMat,
  );
  gallery.position.y = 0.042;
  gallery.castShadow = true;
  group.add(gallery);

  const railRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.0375, 0.0015, 6, 12),
    woodMat,
  );
  railRing.rotation.x = Math.PI / 2;
  railRing.position.y = 0.052;
  group.add(railRing);

  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0012, 0.0012, 0.011, 6),
      woodMat,
    );
    post.position.set(Math.cos(a) * 0.0375, 0.047, Math.sin(a) * 0.0375);
    group.add(post);

    // Diagonal support struts under the balcony
    const strut = new THREE.Mesh(
      new THREE.BoxGeometry(0.0022, 0.015, 0.0022),
      woodMat,
    );
    strut.position.set(Math.cos(a) * 0.033, 0.035, Math.sin(a) * 0.033);
    strut.rotation.y = -a;
    strut.rotation.z = 0.45;
    group.add(strut);
  }

  // Domed shingle cap + rear tailpole & spoked fantail wind-wheel
  const capGeo = new THREE.SphereGeometry(
    0.0258,
    12,
    10,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.6,
  );
  const capMat = new THREE.MeshStandardMaterial({
    color: '#63442d',
    roughness: 0.75,
    flatShading: true,
  });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 0.106;
  cap.castShadow = true;
  group.add(cap);

  const tailBoom = new THREE.Mesh(
    new THREE.BoxGeometry(0.003, 0.003, 0.012),
    woodMat,
  );
  tailBoom.position.set(0, 0.11, -0.024);
  group.add(tailBoom);

  const fantailRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.009, 0.0014, 6, 12),
    woodMat,
  );
  fantailRing.rotation.y = Math.PI / 2;
  fantailRing.position.set(0, 0.112, -0.03);
  group.add(fantailRing);

  for (let f = 0; f < 6; f++) {
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.001, 0.017, 0.0022),
      woodMat,
    );
    spoke.position.set(0, 0.112, -0.03);
    spoke.rotation.x = (f / 6) * Math.PI;
    group.add(spoke);
  }

  const winMat = new THREE.MeshStandardMaterial({
    color: '#fff3c4',
    emissive: new THREE.Color('#ffae38'),
    emissiveIntensity: 0.25,
    roughness: 0.2,
  });
  windowMaterials.push(winMat);
  for (const wy of [0.062, 0.086]) {
    const winFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.0135, 0.0155, 0.004),
      woodMat,
    );
    winFrame.position.set(0, wy, 0.0285);
    group.add(winFrame);

    const win = new THREE.Mesh(
      new THREE.BoxGeometry(0.0105, 0.0125, 0.0052),
      winMat,
    );
    win.position.set(0, wy, 0.029);
    group.add(win);
  }

  const rotor = new THREE.Group();
  rotor.position.set(0, 0.108, 0.062);

  const hubCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0078, 0.0086, 0.010, 10),
    darkStoneMat,
  );
  hubCollar.rotation.x = Math.PI / 2;
  hubCollar.position.z = -0.035;
  rotor.add(hubCollar);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0058, 0.0068, 0.048, 10),
    woodMat,
  );
  hub.rotation.x = Math.PI / 2;
  hub.position.z = -0.019;
  rotor.add(hub);

  const hubCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.0062, 8, 8),
    new THREE.MeshStandardMaterial({ color: '#d4af63', metalness: 0.6, roughness: 0.3 }),
  );
  hubCap.position.z = 0.005;
  rotor.add(hubCap);

  const canvasSailMat = new THREE.MeshStandardMaterial({
    color: '#fcf6e6',
    roughness: 0.85,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < 4; i++) {
    const bladeGroup = new THREE.Group();
    bladeGroup.rotation.z = (i * Math.PI) / 2 + 0.25;

    const spar = new THREE.Mesh(
      new THREE.BoxGeometry(0.0035, 0.076, 0.0035),
      woodMat,
    );
    spar.position.y = 0.039;
    spar.castShadow = true;
    bladeGroup.add(spar);

    // Lattice grid bars + stitched canvas sail
    for (let r = 0; r < 6; r++) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.0018, 0.002),
        woodMat,
      );
      bar.position.set(0.0085, 0.018 + r * 0.011, 0);
      bladeGroup.add(bar);
    }
    const outerRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.0018, 0.058, 0.002),
      woodMat,
    );
    outerRail.position.set(0.018, 0.046, 0);
    bladeGroup.add(outerRail);

    const sail = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.056, 0.0015),
      canvasSailMat,
    );
    sail.position.set(0.0095, 0.046, 0.0012);
    sail.rotation.y = 0.14;
    sail.castShadow = true;
    bladeGroup.add(sail);

    rotor.add(bladeGroup);
  }

  group.add(rotor);
  return { group, rotor, windowMaterials };
}

export function createStripedLighthouseMesh(): {
  group: THREE.Group;
  beamPivot: THREE.Group;
  coneMats: THREE.MeshBasicMaterial[];
  pointLight: THREE.PointLight;
  windowMaterials: THREE.MeshStandardMaterial[];
} {
  const group = new THREE.Group();
  const windowMaterials: THREE.MeshStandardMaterial[] = [];

  const rockMat = new THREE.MeshStandardMaterial({
    color: '#7d828c',
    roughness: 0.9,
    flatShading: true,
  });
  const darkRockMat = new THREE.MeshStandardMaterial({
    color: '#636873',
    roughness: 0.92,
    flatShading: true,
  });
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.046, 0.024, 10),
    rockMat,
  );
  base.position.y = 0.01;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Craggy coastal cliff boulders & stone wave-break wall around foundation
  const boulderSpecs = [
    { x: 0.038, y: 0.006, z: 0.018, r: 0.011 },
    { x: 0.032, y: 0.005, z: -0.026, r: 0.013 },
    { x: -0.038, y: 0.006, z: -0.022, r: 0.012 },
    { x: 0.012, y: 0.005, z: -0.04, r: 0.01 },
    { x: -0.014, y: 0.005, z: 0.038, r: 0.009 },
  ];
  boulderSpecs.forEach((b, idx) => {
    const boulder = new THREE.Mesh(
      new THREE.DodecahedronGeometry(b.r, 0),
      idx % 2 === 0 ? darkRockMat : rockMat,
    );
    boulder.position.set(b.x, b.y, b.z);
    boulder.scale.set(1.2, 0.75, 1.1);
    boulder.castShadow = true;
    group.add(boulder);
  });

  const redMat = new THREE.MeshStandardMaterial({
    color: '#d6473c',
    roughness: 0.65,
    flatShading: true,
  });
  const whiteMat = new THREE.MeshStandardMaterial({
    color: '#f7f4eb',
    roughness: 0.68,
    flatShading: true,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: '#2d3138',
    roughness: 0.5,
    metalness: 0.5,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: '#e5bc57',
    metalness: 0.72,
    roughness: 0.25,
  });

  // Attached coastal keeper's annex cottage with gable roof, brick chimney & doorway
  const annex = new THREE.Mesh(
    new THREE.BoxGeometry(0.032, 0.026, 0.026),
    whiteMat,
  );
  annex.position.set(-0.028, 0.024, 0.006);
  annex.castShadow = true;
  annex.receiveShadow = true;
  group.add(annex);

  const annexRoof = new THREE.Mesh(
    new THREE.ConeGeometry(0.024, 0.016, 4),
    redMat,
  );
  annexRoof.rotation.y = Math.PI / 4;
  annexRoof.scale.set(1.15, 1.0, 0.95);
  annexRoof.position.set(-0.028, 0.044, 0.006);
  annexRoof.castShadow = true;
  group.add(annexRoof);

  const annexChimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.0065, 0.014, 0.0065),
    redMat,
  );
  annexChimney.position.set(-0.036, 0.048, -0.001);
  group.add(annexChimney);

  // Arched lighthouse entryway door & stone steps at front of tower
  const entryDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.011, 0.018, 0.005),
    ironMat,
  );
  entryDoor.position.set(0.01, 0.021, 0.032);
  entryDoor.rotation.y = 0.28;
  group.add(entryDoor);

  const entryStep = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.006, 0.01),
    darkRockMat,
  );
  entryStep.position.set(0.012, 0.01, 0.037);
  entryStep.rotation.y = 0.28;
  group.add(entryStep);

  // 5-band tapered masonry tower
  const bandHeight = 0.021;
  for (let i = 0; i < 5; i++) {
    const t0 = i / 5;
    const t1 = (i + 1) / 5;
    const rBottom = THREE.MathUtils.lerp(0.029, 0.019, t0);
    const rTop = THREE.MathUtils.lerp(0.029, 0.019, t1);
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(rTop, rBottom, bandHeight, 16),
      i % 2 === 0 ? redMat : whiteMat,
    );
    band.position.y = 0.022 + i * bandHeight + bandHeight * 0.5;
    band.castShadow = true;
    band.receiveShadow = true;
    group.add(band);
  }

  // Corbel brackets under observation gallery deck + wrought-iron guardrail + stanchions
  const deck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.027, 0.022, 0.0055, 16),
    ironMat,
  );
  deck.position.y = 0.128;
  deck.castShadow = true;
  group.add(deck);

  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    // Supporting stone corbel under the deck
    const corbel = new THREE.Mesh(
      new THREE.BoxGeometry(0.003, 0.007, 0.005),
      whiteMat,
    );
    corbel.position.set(Math.sin(a) * 0.0205, 0.123, Math.cos(a) * 0.0205);
    corbel.rotation.y = a;
    group.add(corbel);

    // Vertical iron railing stanchion
    const stanchion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0008, 0.0008, 0.009, 5),
      ironMat,
    );
    stanchion.position.set(Math.sin(a) * 0.025, 0.1325, Math.cos(a) * 0.025);
    group.add(stanchion);
  }

  const guardrail = new THREE.Mesh(
    new THREE.TorusGeometry(0.025, 0.0012, 6, 18),
    ironMat,
  );
  guardrail.rotation.x = Math.PI / 2;
  guardrail.position.y = 0.137;
  group.add(guardrail);

  // Miniature red lifebuoy ring mounted on the gallery railing
  const lifebuoy = new THREE.Mesh(
    new THREE.TorusGeometry(0.0035, 0.0011, 6, 12),
    redMat,
  );
  lifebuoy.position.set(0, 0.133, 0.0265);
  group.add(lifebuoy);

  const lanternMat = new THREE.MeshStandardMaterial({
    color: '#fff7d6',
    emissive: new THREE.Color('#ffca57'),
    emissiveIntensity: 0.4,
    roughness: 0.15,
  });
  windowMaterials.push(lanternMat);

  // Brass-framed porthole windows spiraling up the shaft + keeper annex windows
  for (let w = 0; w < 3; w++) {
    const portZ = 0.0255 - w * 0.0032;
    const portY = 0.045 + w * 0.032;
    const brassRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.0042, 0.0009, 6, 12),
      brassMat,
    );
    brassRim.position.set(0, portY, portZ);
    group.add(brassRim);

    const porthole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0038, 0.0038, 0.004, 10),
      lanternMat,
    );
    porthole.rotation.x = Math.PI / 2;
    porthole.position.set(0, portY, portZ - 0.0005);
    group.add(porthole);
  }

  for (const wz of [0.0195, -0.0075]) {
    const annexWin = new THREE.Mesh(
      new THREE.BoxGeometry(0.0075, 0.0085, 0.004),
      lanternMat,
    );
    annexWin.position.set(-0.028, 0.025, wz);
    group.add(annexWin);
  }

  // Translucent glass lantern room + internal brass-and-crystal Fresnel lens
  const lanternGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0165, 0.0165, 0.021, 14),
    lanternMat,
  );
  lanternGlass.position.y = 0.14;
  group.add(lanternGlass);

  for (const ringY of [0.135, 0.14, 0.145]) {
    const fresnelRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.0168, 0.0007, 6, 14),
      brassMat,
    );
    fresnelRing.rotation.x = Math.PI / 2;
    fresnelRing.position.y = ringY;
    group.add(fresnelRing);
  }

  // Helical/vertical cage bars around the glass lantern room
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0009, 0.0009, 0.022, 6),
      ironMat,
    );
    bar.position.set(Math.cos(a) * 0.017, 0.14, Math.sin(a) * 0.017);
    group.add(bar);
  }

  // Cupola dome with projecting cornice rim, weathervane & lightning rod finial
  const cupolaRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.0195, 0.0014, 6, 16),
    ironMat,
  );
  cupolaRim.rotation.x = Math.PI / 2;
  cupolaRim.position.y = 0.15;
  group.add(cupolaRim);

  const cupola = new THREE.Mesh(
    new THREE.ConeGeometry(0.021, 0.019, 16),
    redMat,
  );
  cupola.position.y = 0.159;
  cupola.castShadow = true;
  group.add(cupola);

  const finialBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.003, 8, 8),
    brassMat,
  );
  finialBall.position.y = 0.169;
  group.add(finialBall);

  const lightningRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0005, 0.0009, 0.012, 6),
    ironMat,
  );
  lightningRod.position.y = 0.175;
  group.add(lightningRod);

  const weathervane = new THREE.Mesh(
    new THREE.BoxGeometry(0.011, 0.0018, 0.0008),
    brassMat,
  );
  weathervane.position.set(0.002, 0.174, 0);
  group.add(weathervane);

  const beamPivot = new THREE.Group();
  beamPivot.position.y = 0.14;

  const coneMats: THREE.MeshBasicMaterial[] = [];
  const createBeamCone = (dirSign: number) => {
    const coneGeo = new THREE.ConeGeometry(0.045, 0.48, 20, 1, true);
    coneGeo.translate(0, -0.24, 0);
    coneGeo.rotateX((dirSign * Math.PI) / 2);

    const pos = coneGeo.attributes.position;
    const colors: number[] = [];
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const dist = v.length() / 0.48;
      const intensity = Math.pow(1.0 - THREE.MathUtils.clamp(dist, 0, 1), 1.6);
      colors.push(1.0 * intensity, 0.91 * intensity, 0.62 * intensity);
    }
    coneGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    coneMats.push(mat);
    return new THREE.Mesh(coneGeo, mat);
  };

  beamPivot.add(createBeamCone(1));
  beamPivot.add(createBeamCone(-1));

  const pointLight = new THREE.PointLight('#ffcf6e', 0, 0.55, 1.5);
  pointLight.position.y = 0.01;
  beamPivot.add(pointLight);

  group.add(beamPivot);

  return { group, beamPivot, coneMats, pointLight, windowMaterials };
}

export function createStoneWellMesh(): THREE.Group {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#918d86',
    roughness: 0.88,
    flatShading: true,
  });
  const stoneAltMat = new THREE.MeshStandardMaterial({
    color: '#7d7972',
    roughness: 0.88,
    flatShading: true,
  });

  // Circular cobblestone base apron around the well
  const apron = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.034, 0.004, 14),
    stoneAltMat,
  );
  apron.position.y = 0.002;
  apron.receiveShadow = true;
  group.add(apron);

  const ringRadius = 0.021;
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + row * 0.26;
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(0.0115, 0.008, 0.009),
        (i + row) % 2 === 0 ? stoneMat : stoneAltMat,
      );
      block.position.set(
        Math.sin(angle) * ringRadius,
        0.005 + row * 0.0075,
        Math.cos(angle) * ringRadius,
      );
      block.rotation.y = angle;
      block.castShadow = true;
      block.receiveShadow = true;
      group.add(block);
    }
  }

  // Flat stone coping rim on top of the well wall
  const copingRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.021, 0.0045, 6, 16),
    stoneMat,
  );
  copingRim.rotation.x = Math.PI / 2;
  copingRim.position.y = 0.025;
  copingRim.scale.set(1, 1, 0.55);
  group.add(copingRim);

  const waterDisk = new THREE.Mesh(
    new THREE.CircleGeometry(0.018, 14),
    new THREE.MeshStandardMaterial({
      color: '#34b8c9',
      roughness: 0.12,
      metalness: 0.15,
    }),
  );
  waterDisk.rotation.x = -Math.PI / 2;
  waterDisk.position.y = 0.02;
  group.add(waterDisk);

  const woodMat = new THREE.MeshStandardMaterial({
    color: '#734f34',
    roughness: 0.82,
  });
  const ropeMat = new THREE.MeshStandardMaterial({
    color: '#c9ad79',
    roughness: 0.88,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: '#2e3238',
    metalness: 0.55,
    roughness: 0.45,
  });

  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.0048, 0.044, 0.0048),
      woodMat,
    );
    post.position.set(side * 0.021, 0.04, 0);
    post.castShadow = true;
    group.add(post);

    // Diagonal knee braces at top of posts
    const brace = new THREE.Mesh(
      new THREE.BoxGeometry(0.0028, 0.011, 0.0028),
      woodMat,
    );
    brace.position.set(side * 0.016, 0.055, 0);
    brace.rotation.z = side * 0.65;
    group.add(brace);
  }

  // Windlass spindle + coiled rope wraps + iron crank handle
  const spindle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0028, 0.0028, 0.046, 8),
    woodMat,
  );
  spindle.rotation.z = Math.PI / 2;
  spindle.position.y = 0.048;
  group.add(spindle);

  for (let r = -2; r <= 2; r++) {
    const coil = new THREE.Mesh(
      new THREE.TorusGeometry(0.0033, 0.0008, 6, 10),
      ropeMat,
    );
    coil.rotation.y = Math.PI / 2;
    coil.position.set(r * 0.0014, 0.048, 0);
    group.add(coil);
  }

  // Iron crank arm on right post
  const crankArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.0015, 0.009, 0.0015),
    ironMat,
  );
  crankArm.position.set(0.025, 0.045, 0);
  group.add(crankArm);

  const crankHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.001, 0.001, 0.005, 6),
    woodMat,
  );
  crankHandle.rotation.z = Math.PI / 2;
  crankHandle.position.set(0.0275, 0.041, 0);
  group.add(crankHandle);

  // Hanging rope & iron-banded wooden stave bucket
  const hangingRope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0007, 0.0007, 0.015, 5),
    ropeMat,
  );
  hangingRope.position.y = 0.041;
  group.add(hangingRope);

  const bucket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0052, 0.0042, 0.0085, 8),
    woodMat,
  );
  bucket.position.y = 0.032;
  bucket.castShadow = true;
  group.add(bucket);

  const bucketBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.0048, 0.0006, 5, 10),
    ironMat,
  );
  bucketBand.rotation.x = Math.PI / 2;
  bucketBand.position.y = 0.034;
  group.add(bucketBand);

  // Layered shingle gable roof + ridge beam
  const roofMat = new THREE.MeshStandardMaterial({
    color: '#8c583a',
    roughness: 0.78,
    flatShading: true,
  });
  const roofAltMat = new THREE.MeshStandardMaterial({
    color: '#78482d',
    roughness: 0.8,
    flatShading: true,
  });
  for (const side of [-1, 1]) {
    for (let row = 0; row < 3; row++) {
      const slope = new THREE.Mesh(
        new THREE.BoxGeometry(0.054, 0.0032, 0.01),
        row % 2 === 0 ? roofMat : roofAltMat,
      );
      slope.position.set(0, 0.066 - row * 0.0042, side * (0.004 + row * 0.0065));
      slope.rotation.x = side * 0.52;
      slope.castShadow = true;
      group.add(slope);
    }
  }

  const ridgeBeam = new THREE.Mesh(
    new THREE.BoxGeometry(0.056, 0.004, 0.0045),
    woodMat,
  );
  ridgeBeam.position.y = 0.068;
  group.add(ridgeBeam);

  return group;
}

export function createWoodenFenceMesh(): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    color: '#a87c56',
    roughness: 0.84,
    flatShading: true,
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: '#8a6240',
    roughness: 0.86,
    flatShading: true,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#918d86',
    roughness: 0.9,
    flatShading: true,
  });

  // 3 chamfered fence posts with stone base collars & pyramid caps
  for (const px of [-0.025, 0, 0.025]) {
    const stoneBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0044, 0.0054, 0.0055, 6),
      stoneMat,
    );
    stoneBase.position.set(px, 0.0025, 0);
    group.add(stoneBase);

    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.0054, 0.029, 0.0054),
      woodMat,
    );
    post.position.set(px, 0.0145, 0);
    post.castShadow = true;
    group.add(post);

    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(0.0046, 0.0042, 4),
      darkWoodMat,
    );
    cap.rotation.y = Math.PI / 4;
    cap.position.set(px, 0.0308, 0);
    group.add(cap);
  }

  // Double horizontal mortised rails + diagonal cross braces
  for (const h of [0.0105, 0.0215]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.054, 0.0038, 0.0028),
      woodMat,
    );
    rail.position.set(0, h, 0.0016);
    rail.castShadow = true;
    group.add(rail);
  }

  for (const side of [-1, 1]) {
    const diag = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.0028, 0.0022),
      darkWoodMat,
    );
    diag.position.set(side * 0.0125, 0.016, -0.0012);
    diag.rotation.z = side * 0.42;
    group.add(diag);
  }

  return group;
}

export function createSteppingPathMesh(): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#c9bfa8',
    roughness: 0.9,
    flatShading: true,
  });
  const warmStoneMat = new THREE.MeshStandardMaterial({
    color: '#b8ac93',
    roughness: 0.9,
    flatShading: true,
  });
  const mossMat = new THREE.MeshStandardMaterial({
    color: '#6eb856',
    roughness: 0.85,
    flatShading: true,
  });

  const slabs = [
    { x: -0.016, z: -0.005, r: 0.0085, sy: 0.0048, warm: false },
    { x: -0.005, z: 0.005, r: 0.0095, sy: 0.0052, warm: true },
    { x: 0.007, z: -0.003, r: 0.0105, sy: 0.005, warm: false },
    { x: 0.018, z: 0.004, r: 0.008, sy: 0.0045, warm: true },
    { x: -0.012, z: 0.012, r: 0.0045, sy: 0.0035, warm: true },
    { x: 0.014, z: -0.011, r: 0.005, sy: 0.0038, warm: false },
  ];
  slabs.forEach((o, i) => {
    const stone = new THREE.Mesh(
      new THREE.CylinderGeometry(o.r, o.r * 1.12, o.sy, 7),
      o.warm ? warmStoneMat : stoneMat,
    );
    stone.position.set(o.x, o.sy * 0.45, o.z);
    stone.rotation.y = i * 0.8;
    stone.receiveShadow = true;
    group.add(stone);
  });

  // Tiny lush moss tufts between flagstones
  for (const [mx, mz] of [
    [-0.01, -0.001],
    [0.001, 0.002],
    [0.012, 0.001],
  ]) {
    const moss = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.0028, 0),
      mossMat,
    );
    moss.scale.set(1.2, 0.55, 1.1);
    moss.position.set(mx, 0.0018, mz);
    group.add(moss);
  }

  return group;
}

export function createOakTreeMesh(): THREE.Group {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({
    color: '#734e34',
    roughness: 0.86,
    flatShading: true,
  });
  const darkBarkMat = new THREE.MeshStandardMaterial({
    color: '#5c3d27',
    roughness: 0.9,
    flatShading: true,
  });

  // Flared buttress roots gripping the ground
  for (let r = 0; r < 4; r++) {
    const a = (r / 4) * Math.PI * 2 + 0.3;
    const root = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0022, 0.0048, 0.014, 5),
      darkBarkMat,
    );
    root.position.set(Math.cos(a) * 0.0065, 0.0045, Math.sin(a) * 0.0065);
    root.rotation.z = -Math.cos(a) * 0.55;
    root.rotation.x = Math.sin(a) * 0.55;
    group.add(root);
  }

  // Gnarled lower & upper trunk
  const lowerTrunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0065, 0.0098, 0.022, 7),
    trunkMat,
  );
  lowerTrunk.position.y = 0.01;
  lowerTrunk.castShadow = true;
  group.add(lowerTrunk);

  const upperTrunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.0068, 0.02, 7),
    trunkMat,
  );
  upperTrunk.position.set(0.001, 0.027, 0);
  upperTrunk.rotation.z = -0.08;
  upperTrunk.castShadow = true;
  group.add(upperTrunk);

  // 3 visible diverging primary boughs reaching into the canopy
  const branches = [
    { x: 0.006, y: 0.036, z: 0.004, rz: -0.58, rx: 0.28 },
    { x: -0.006, y: 0.035, z: -0.004, rz: 0.52, rx: -0.25 },
    { x: -0.002, y: 0.038, z: 0.006, rz: 0.18, rx: 0.55 },
  ];
  branches.forEach((b) => {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0022, 0.004, 0.018, 5),
      trunkMat,
    );
    branch.position.set(b.x, b.y, b.z);
    branch.rotation.z = b.rz;
    branch.rotation.x = b.rx;
    branch.castShadow = true;
    group.add(branch);
  });

  // Tiny cozy wooden birdhouse on the side of the trunk
  const birdhouse = new THREE.Mesh(
    new THREE.BoxGeometry(0.0055, 0.0065, 0.0055),
    new THREE.MeshStandardMaterial({ color: '#e8c882', roughness: 0.75 }),
  );
  birdhouse.position.set(0.0085, 0.024, 0.002);
  group.add(birdhouse);

  const birdhouseRoof = new THREE.Mesh(
    new THREE.ConeGeometry(0.0048, 0.004, 4),
    new THREE.MeshStandardMaterial({ color: '#c95b49', roughness: 0.7 }),
  );
  birdhouseRoof.rotation.y = Math.PI / 4;
  birdhouseRoof.position.set(0.0085, 0.029, 0.002);
  group.add(birdhouseRoof);

  // Multi-tone sculpted canopy puffs
  const greens = ['#72c257', '#58ad49', '#87d466', '#4c9c42', '#9be074'];
  const puffs = [
    { x: 0, y: 0.05, z: 0, r: 0.022, c: 0 },
    { x: 0.014, y: 0.042, z: 0.008, r: 0.016, c: 1 },
    { x: -0.014, y: 0.044, z: -0.007, r: 0.017, c: 2 },
    { x: -0.005, y: 0.058, z: 0.008, r: 0.015, c: 4 },
    { x: 0.008, y: 0.054, z: -0.01, r: 0.015, c: 2 },
    { x: -0.009, y: 0.041, z: 0.012, r: 0.014, c: 3 },
    { x: 0.011, y: 0.041, z: -0.011, r: 0.013, c: 3 },
  ];
  puffs.forEach((p) => {
    const mat = new THREE.MeshStandardMaterial({
      color: greens[p.c],
      roughness: 0.78,
      flatShading: true,
    });
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(p.r, 1), mat);
    puff.position.set(p.x, p.y, p.z);
    puff.scale.set(1.08, 0.88, 1.05);
    puff.castShadow = true;
    puff.receiveShadow = true;
    group.add(puff);
  });

  return group;
}

export function createPineTreeMesh(snowCapped = false): THREE.Group {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({
    color: '#63422b',
    roughness: 0.88,
    flatShading: true,
  });
  const coneNutMat = new THREE.MeshStandardMaterial({
    color: '#4a2f1d',
    roughness: 0.85,
  });
  const snowMat = new THREE.MeshStandardMaterial({
    color: '#f2f8fc',
    roughness: 0.65,
    flatShading: true,
  });

  // Flared root collar + tapered trunk
  const rootBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.0095, 0.009, 7),
    trunkMat,
  );
  rootBase.position.y = 0.003;
  group.add(rootBase);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0038, 0.0068, 0.032, 7),
    trunkMat,
  );
  trunk.position.y = 0.015;
  trunk.castShadow = true;
  group.add(trunk);

  // 5 overlapping feathered conifer tiers with rotated facets
  const tiers = [
    { y: 0.028, r: 0.024, h: 0.026, col: '#2d663c', rot: 0.0 },
    { y: 0.041, r: 0.021, h: 0.025, col: '#347546', rot: 0.45 },
    { y: 0.054, r: 0.017, h: 0.024, col: '#3f8752', rot: 0.9 },
    { y: 0.066, r: 0.013, h: 0.022, col: '#48965c', rot: 1.35 },
    {
      y: 0.077,
      r: 0.009,
      h: 0.019,
      col: snowCapped ? '#eff7fc' : '#54a668',
      rot: 1.8,
    },
  ];
  tiers.forEach((t, idx) => {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(t.r, t.h, 8),
      new THREE.MeshStandardMaterial({
        color: t.col,
        roughness: 0.8,
        flatShading: true,
      }),
    );
    cone.position.y = t.y;
    cone.rotation.y = t.rot;
    cone.castShadow = true;
    cone.receiveShadow = true;
    group.add(cone);

    if (snowCapped && idx >= 2) {
      const snowCap = new THREE.Mesh(
        new THREE.ConeGeometry(t.r * 0.72, t.h * 0.55, 8),
        snowMat,
      );
      snowCap.position.y = t.y + t.h * 0.24;
      snowCap.rotation.y = t.rot + 0.2;
      group.add(snowCap);
    }
  });

  // Tiny hanging pinecones under the lower boughs
  for (let c = 0; c < 3; c++) {
    const a = (c / 3) * Math.PI * 2 + 0.4;
    const pinecone = new THREE.Mesh(
      new THREE.SphereGeometry(0.0022, 6, 6),
      coneNutMat,
    );
    pinecone.scale.set(0.8, 1.35, 0.8);
    pinecone.position.set(Math.cos(a) * 0.014, 0.02, Math.sin(a) * 0.014);
    group.add(pinecone);
  }

  return group;
}

export function createPalmTreeMesh(): THREE.Group {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({
    color: '#9c734e',
    roughness: 0.85,
    flatShading: true,
  });
  const ringMat = new THREE.MeshStandardMaterial({
    color: '#7d5938',
    roughness: 0.88,
    flatShading: true,
  });

  // Curved 7-segment coconut palm trunk with raised bark rings
  let curX = 0;
  let curY = 0;
  for (let i = 0; i < 7; i++) {
    const rTop = 0.0056 - i * 0.00042;
    const rBot = 0.0064 - i * 0.00042;
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(rTop, rBot, 0.0105, 7),
      trunkMat,
    );
    const tilt = (i + 0.4) * 0.068;
    curX += Math.sin(tilt) * 0.009;
    curY += Math.cos(tilt) * 0.009;
    seg.position.set(curX, curY - 0.003, 0);
    seg.rotation.z = -tilt;
    seg.castShadow = true;
    group.add(seg);

    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(rTop * 1.03, 0.0007, 5, 8),
      ringMat,
    );
    collar.rotation.x = Math.PI / 2;
    collar.rotation.y = -tilt;
    collar.position.set(curX, curY + 0.0015, 0);
    group.add(collar);
  }

  const crown = new THREE.Group();
  crown.position.set(curX + 0.002, curY + 0.003, 0);

  const frondMat = new THREE.MeshStandardMaterial({
    color: '#6ec454',
    roughness: 0.72,
    flatShading: true,
  });
  const frondAltMat = new THREE.MeshStandardMaterial({
    color: '#56ab40',
    roughness: 0.75,
    flatShading: true,
  });

  // 8 multi-segment gracefully arching feather palm fronds
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const frondPivot = new THREE.Group();
    frondPivot.rotation.y = angle;
    frondPivot.rotation.z = (i % 2 === 0 ? 0.12 : -0.06);

    const mat = i % 2 === 0 ? frondMat : frondAltMat;

    const seg1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.013, 0.0024, 0.0075),
      mat,
    );
    seg1.position.set(0.0065, 0.0015, 0);
    seg1.rotation.z = 0.18;
    seg1.castShadow = true;
    frondPivot.add(seg1);

    const seg2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.013, 0.0022, 0.0095),
      mat,
    );
    seg2.position.set(0.018, 0.0002, 0);
    seg2.rotation.z = -0.26;
    seg2.castShadow = true;
    frondPivot.add(seg2);

    const seg3 = new THREE.Mesh(
      new THREE.ConeGeometry(0.0048, 0.012, 5),
      mat,
    );
    seg3.rotation.z = -Math.PI / 2 - 0.62;
    seg3.scale.set(0.5, 1.0, 1.2);
    seg3.position.set(0.028, -0.0055, 0);
    seg3.castShadow = true;
    frondPivot.add(seg3);

    crown.add(frondPivot);
  }

  // Cluster of 4 coconuts nestled under the fronds
  const cocoMat = new THREE.MeshStandardMaterial({
    color: '#573a22',
    roughness: 0.8,
  });
  for (let c = 0; c < 4; c++) {
    const a = (c / 4) * Math.PI * 2;
    const coco = new THREE.Mesh(new THREE.SphereGeometry(0.0034, 7, 7), cocoMat);
    coco.scale.set(0.9, 1.15, 0.9);
    coco.position.set(Math.cos(a) * 0.0048, -0.0032, Math.sin(a) * 0.0048);
    crown.add(coco);
  }

  group.add(crown);
  return group;
}

export function createFlowerClusterMesh(): THREE.Group {
  const group = new THREE.Group();
  const stemMat = new THREE.MeshStandardMaterial({
    color: '#4f9c49',
    roughness: 0.8,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: '#5eb352',
    roughness: 0.78,
    flatShading: true,
  });
  const pollenMat = new THREE.MeshStandardMaterial({
    color: '#ffcf33',
    roughness: 0.5,
  });
  const petalColors = ['#ff7898', '#ffde59', '#b994ff', '#ffffff', '#ff9b63'];

  // Basal green foliage leaves radiating on the ground
  for (let l = 0; l < 6; l++) {
    const la = (l / 6) * Math.PI * 2;
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.0038, 0.011, 5),
      leafMat,
    );
    leaf.rotation.z = -Math.PI / 2 + 0.35;
    leaf.rotation.y = la;
    leaf.scale.set(0.45, 1.0, 1.1);
    leaf.position.set(Math.cos(la) * 0.009, 0.0025, Math.sin(la) * 0.009);
    group.add(leaf);
  }

  // 5 multi-petaled blossoms with golden pollen centers
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + (i % 2) * 0.3;
    const dist = i === 0 ? 0 : 0.0115;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const h = 0.011 + (i % 3) * 0.0032;

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0011, 0.0013, h, 5),
      stemMat,
    );
    stem.position.set(x, h * 0.5, z);
    group.add(stem);

    const headGroup = new THREE.Group();
    headGroup.position.set(x, h + 0.0015, z);
    headGroup.rotation.x = (i === 0 ? 0 : 0.22) * Math.sin(angle);
    headGroup.rotation.z = (i === 0 ? 0 : -0.22) * Math.cos(angle);

    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.002, 6, 6),
      pollenMat,
    );
    center.scale.set(1, 0.65, 1);
    headGroup.add(center);

    const petalMat = new THREE.MeshStandardMaterial({
      color: petalColors[i % petalColors.length],
      roughness: 0.58,
      flatShading: true,
    });
    for (let p = 0; p < 5; p++) {
      const pa = (p / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(
        new THREE.SphereGeometry(0.0021, 6, 6),
        petalMat,
      );
      petal.scale.set(1.15, 0.5, 0.85);
      petal.position.set(Math.cos(pa) * 0.0028, 0, Math.sin(pa) * 0.0028);
      petal.rotation.y = -pa;
      petal.castShadow = true;
      headGroup.add(petal);
    }

    group.add(headGroup);
  }

  return group;
}

// ---------------------------------------------------------------------------
// NEW TOOL MESHES: A. WATER & COASTAL LIFE
// ---------------------------------------------------------------------------

const SAIL_PALETTES = ['#f7b2a1', '#fce5a2', '#b3e5cd', '#bdd3f7'];

export function createSailboatMesh(variantIdx: number): {
  group: THREE.Group;
  hullGroup: THREE.Group;
  lanternMat: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();
  const hullGroup = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({
    color: '#754829',
    roughness: 0.78,
    flatShading: true,
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: '#54321b',
    roughness: 0.82,
    flatShading: true,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: '#f7f0e1',
    roughness: 0.72,
    flatShading: true,
  });
  const ropeMat = new THREE.MeshStandardMaterial({
    color: '#cfb482',
    roughness: 0.88,
  });

  // Sculpted carvel-planked boat hull + keel + raised bow stempost & stern transom
  const hullGeo = new THREE.CylinderGeometry(0.0145, 0.0095, 0.048, 8);
  hullGeo.rotateX(Math.PI / 2);
  hullGeo.scale(0.88, 0.52, 1.0);
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.y = 0.005;
  hull.castShadow = true;
  hullGroup.add(hull);

  // Cream gunwale coaming & interior cockpit floor grating
  const gunwale = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.0022, 0.04),
    trimMat,
  );
  gunwale.position.y = 0.0092;
  hullGroup.add(gunwale);

  const cockpitFloor = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.0018, 0.028),
    darkWoodMat,
  );
  cockpitFloor.position.y = 0.0098;
  hullGroup.add(cockpitFloor);

  // Two cross-hull wooden bench thwarts + stowed wooden oars along gunwales
  for (const bz of [-0.007, 0.007]) {
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.0018, 0.0042),
      hullMat,
    );
    bench.position.set(0, 0.0112, bz);
    hullGroup.add(bench);
  }

  for (const side of [-1, 1]) {
    const oarShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0007, 0.0007, 0.028, 5),
      trimMat,
    );
    oarShaft.rotation.x = Math.PI / 2;
    oarShaft.position.set(side * 0.0095, 0.0115, -0.002);
    hullGroup.add(oarShaft);

    const oarBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.0022, 0.0008, 0.007),
      hullMat,
    );
    oarBlade.position.set(side * 0.0095, 0.0115, -0.014);
    hullGroup.add(oarBlade);
  }

  // Raised prow stempost + bowsprit spar + stern rudder & tiller handle
  const stempost = new THREE.Mesh(
    new THREE.BoxGeometry(0.0025, 0.009, 0.003),
    darkWoodMat,
  );
  stempost.position.set(0, 0.011, 0.0235);
  stempost.rotation.x = 0.35;
  hullGroup.add(stempost);

  const bowsprit = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0009, 0.0014, 0.014, 6),
    darkWoodMat,
  );
  bowsprit.rotation.x = Math.PI / 2 - 0.22;
  bowsprit.position.set(0, 0.0125, 0.027);
  hullGroup.add(bowsprit);

  const rudder = new THREE.Mesh(
    new THREE.BoxGeometry(0.0018, 0.0085, 0.0055),
    darkWoodMat,
  );
  rudder.position.set(0, 0.0055, -0.025);
  hullGroup.add(rudder);

  const tiller = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0007, 0.0009, 0.011, 5),
    darkWoodMat,
  );
  tiller.rotation.x = Math.PI / 2 + 0.25;
  tiller.position.set(0, 0.0115, -0.02);
  hullGroup.add(tiller);

  // Coiled mooring rope on the foredeck + lifebuoy ring on the stern quarter
  const ropeCoil = new THREE.Mesh(
    new THREE.TorusGeometry(0.0026, 0.0009, 5, 10),
    ropeMat,
  );
  ropeCoil.rotation.x = Math.PI / 2;
  ropeCoil.position.set(0, 0.011, 0.015);
  hullGroup.add(ropeCoil);

  const lifebuoy = new THREE.Mesh(
    new THREE.TorusGeometry(0.0028, 0.0009, 6, 10),
    new THREE.MeshStandardMaterial({ color: '#d94b3d', roughness: 0.6 }),
  );
  lifebuoy.rotation.y = Math.PI / 2;
  lifebuoy.position.set(0.0105, 0.0095, -0.012);
  hullGroup.add(lifebuoy);

  // Timber mast + horizontal main boom + upper gaff spar
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0014, 0.002, 0.056, 7),
    hullMat,
  );
  mast.position.set(0, 0.036, 0.003);
  mast.castShadow = true;
  hullGroup.add(mast);

  const boom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.001, 0.0012, 0.027, 6),
    darkWoodMat,
  );
  boom.rotation.x = Math.PI / 2;
  boom.position.set(0.0015, 0.016, -0.01);
  boom.rotation.y = -0.15;
  hullGroup.add(boom);

  // Pastel canvas mainsail + foresail jib + masthead pennant
  const sailColor = SAIL_PALETTES[variantIdx % SAIL_PALETTES.length];
  const sailMat = new THREE.MeshStandardMaterial({
    color: sailColor,
    roughness: 0.72,
    side: THREE.DoubleSide,
    flatShading: true,
  });

  // Billowed multi-panel mainsail
  const mainSailGeo = new THREE.BufferGeometry();
  const mainVerts = new Float32Array([
    // Lower belly triangle
    0, 0.058, 0.003,
    0, 0.016, 0.003,
    0.0055, 0.032, -0.01,
    // Aft leach triangle
    0, 0.058, 0.003,
    0.0055, 0.032, -0.01,
    0.0038, 0.017, -0.023,
    // Foot triangle
    0, 0.016, 0.003,
    0.0038, 0.017, -0.023,
    0.0055, 0.032, -0.01,
  ]);
  mainSailGeo.setAttribute('position', new THREE.BufferAttribute(mainVerts, 3));
  mainSailGeo.computeVertexNormals();
  const mainSail = new THREE.Mesh(mainSailGeo, sailMat);
  mainSail.castShadow = true;
  hullGroup.add(mainSail);

  // Billowed jib foresail reaching out to the bowsprit
  const jibGeo = new THREE.BufferGeometry();
  const jibVerts = new Float32Array([
    0, 0.052, 0.004,
    0, 0.014, 0.031,
    -0.0038, 0.025, 0.012,
  ]);
  jibGeo.setAttribute('position', new THREE.BufferAttribute(jibVerts, 3));
  jibGeo.computeVertexNormals();
  const jibSail = new THREE.Mesh(jibGeo, trimMat);
  hullGroup.add(jibSail);

  // Tiny fluttering pennant flag at top of mast
  const pennant = new THREE.Mesh(
    new THREE.ConeGeometry(0.0025, 0.009, 4),
    sailMat,
  );
  pennant.rotation.x = -Math.PI / 2;
  pennant.position.set(0, 0.063, -0.0015);
  hullGroup.add(pennant);

  // Tiny brass bow lantern that glows warm amber at night
  const lanternMat = new THREE.MeshStandardMaterial({
    color: '#fff4c2',
    emissive: new THREE.Color('#ffba42'),
    emissiveIntensity: 0.3,
    roughness: 0.2,
  });
  const bowLantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0028, 0.0024, 0.0055, 6),
    lanternMat,
  );
  bowLantern.position.set(0, 0.015, 0.022);
  hullGroup.add(bowLantern);

  const lanternCap = new THREE.Mesh(
    new THREE.ConeGeometry(0.0035, 0.0025, 6),
    darkWoodMat,
  );
  lanternCap.position.set(0, 0.0185, 0.022);
  hullGroup.add(lanternCap);

  group.add(hullGroup);
  return { group, hullGroup, lanternMat };
}

export function createWoodenDockMesh(isBridge = false): {
  group: THREE.Group;
  windowMaterials: THREE.MeshStandardMaterial[];
} {
  const group = new THREE.Group();
  const windowMaterials: THREE.MeshStandardMaterial[] = [];

  const woodMat = new THREE.MeshStandardMaterial({
    color: '#8f6340',
    roughness: 0.85,
    flatShading: true,
  });
  const plankAltMat = new THREE.MeshStandardMaterial({
    color: '#a3754f',
    roughness: 0.84,
    flatShading: true,
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: '#69452a',
    roughness: 0.88,
    flatShading: true,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#8c8881',
    roughness: 0.9,
    flatShading: true,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: '#2e3238',
    metalness: 0.55,
    roughness: 0.45,
  });
  const ropeMat = new THREE.MeshStandardMaterial({
    color: '#cfb482',
    roughness: 0.88,
  });

  const lanternMat = new THREE.MeshStandardMaterial({
    color: '#fff4c2',
    emissive: new THREE.Color('#ffba42'),
    emissiveIntensity: 0.35,
    roughness: 0.2,
  });
  windowMaterials.push(lanternMat);

  if (isBridge) {
    // Arched footbridge with dressed stone abutments, wing walls, cambered planks, X-truss balustrades & bridge lanterns
    for (const side of [-1, 1]) {
      const abutment = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.024, 0.015),
        stoneMat,
      );
      abutment.position.set(0, 0.006, side * 0.039);
      abutment.castShadow = true;
      group.add(abutment);

      // Stone coping stones on abutment corners
      for (const sx of [-0.012, 0.012]) {
        const pillar = new THREE.Mesh(
          new THREE.BoxGeometry(0.0055, 0.012, 0.0055),
          stoneMat,
        );
        pillar.position.set(sx, 0.02, side * 0.042);
        group.add(pillar);
      }
    }

    const plankCount = 11;
    for (let i = 0; i < plankCount; i++) {
      const t = i / (plankCount - 1) - 0.5; // -0.5 .. 0.5
      const z = t * 0.074;
      const archY = 0.014 + (0.25 - t * t) * 0.068;
      const slope = -t * 0.56;

      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 0.0034, 0.0064),
        i % 2 === 0 ? woodMat : plankAltMat,
      );
      plank.position.set(0, archY, z);
      plank.rotation.x = slope;
      plank.castShadow = true;
      plank.receiveShadow = true;
      group.add(plank);

      // Newel posts + ball caps + center bridge lanterns
      if (i % 2 === 0) {
        for (const rx of [-0.0115, 0.0115]) {
          const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.0026, 0.015, 0.0026),
            darkWoodMat,
          );
          post.position.set(rx, archY + 0.0075, z);
          group.add(post);

          if (i === 5) {
            // Warm glowing bridge lanterns at the apex of the arch
            const lantern = new THREE.Mesh(
              new THREE.CylinderGeometry(0.0024, 0.002, 0.005, 6),
              lanternMat,
            );
            lantern.position.set(rx, archY + 0.017, z);
            group.add(lantern);
          }
        }
      }
    }

    // Segmented arched top & middle handrails following the camber of the bridge
    for (const rx of [-0.0115, 0.0115]) {
      for (let s = 0; s < 4; s++) {
        const t0 = s / 4 - 0.5;
        const t1 = (s + 1) / 4 - 0.5;
        const tm = (t0 + t1) * 0.5;
        const z = tm * 0.074;
        const archY = 0.014 + (0.25 - tm * tm) * 0.068;
        const slope = -tm * 0.56;

        const topRail = new THREE.Mesh(
          new THREE.BoxGeometry(0.0024, 0.0024, 0.02),
          darkWoodMat,
        );
        topRail.position.set(rx, archY + 0.014, z);
        topRail.rotation.x = slope;
        group.add(topRail);

        const midRail = new THREE.Mesh(
          new THREE.BoxGeometry(0.0018, 0.0018, 0.02),
          woodMat,
        );
        midRail.position.set(rx, archY + 0.008, z);
        midRail.rotation.x = slope;
        group.add(midRail);
      }
    }
  } else {
    // Coastal timber pier dock with shoreward stone abutment, sloped land-access ramp, cross-braced pilings, deck boards, mooring bollard, cargo barrel & hanging lantern
    for (let row = 0; row < 5; row++) {
      const z = -0.032 + row * 0.0155;
      for (const side of [-0.012, 0.012]) {
        const piling = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0028, 0.003, 0.036, 7),
          darkWoodMat,
        );
        piling.position.set(side, 0.006, z);
        piling.castShadow = true;
        group.add(piling);
      }
      // Crossbeam cap between piling pairs
      const crossCap = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.003, 0.0035),
        darkWoodMat,
      );
      crossCap.position.set(0, 0.0165, z);
      group.add(crossCap);
    }

    // Longitudinal stringers + side wheel-guard curbs along main pier deck
    for (const sx of [-0.0125, 0.0125]) {
      const curb = new THREE.Mesh(
        new THREE.BoxGeometry(0.0028, 0.0025, 0.076),
        darkWoodMat,
      );
      curb.position.set(sx, 0.0215, 0.001);
      group.add(curb);
    }

    // Individual beveled deck boards along horizontal pier section
    for (let i = 0; i < 13; i++) {
      const z = -0.035 + i * 0.0061;
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.0032, 0.0052),
        i % 2 === 0 ? woodMat : plankAltMat,
      );
      plank.position.set(0, 0.019, z);
      plank.castShadow = true;
      plank.receiveShadow = true;
      group.add(plank);
    }

    // Sloped wooden shore-access ramp & stone landward abutment connecting the pier deck onto the dry grassy bank above terrain
    const rampSlope = 0.24;
    for (const sx of [-0.0125, 0.0125]) {
      const rampCurb = new THREE.Mesh(
        new THREE.BoxGeometry(0.0028, 0.0028, 0.042),
        darkWoodMat,
      );
      rampCurb.position.set(sx, 0.015, -0.055);
      rampCurb.rotation.x = rampSlope;
      group.add(rampCurb);

      const rampHandrail = new THREE.Mesh(
        new THREE.BoxGeometry(0.0022, 0.0022, 0.042),
        woodMat,
      );
      rampHandrail.position.set(sx, 0.025, -0.055);
      rampHandrail.rotation.x = rampSlope;
      group.add(rampHandrail);

      for (const [pz, py] of [
        [-0.038, 0.023],
        [-0.055, 0.019],
        [-0.072, 0.015],
      ]) {
        const rampPost = new THREE.Mesh(
          new THREE.BoxGeometry(0.0024, 0.012, 0.0024),
          darkWoodMat,
        );
        rampPost.position.set(sx, py, pz);
        group.add(rampPost);
      }
    }

    for (let r = 0; r < 7; r++) {
      const t = (r + 0.5) / 7;
      const rz = THREE.MathUtils.lerp(-0.037, -0.073, t);
      const ry = THREE.MathUtils.lerp(0.0185, 0.0098, t);
      const rampPlank = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.0032, 0.005),
        r % 2 === 0 ? woodMat : plankAltMat,
      );
      rampPlank.position.set(0, ry, rz);
      rampPlank.rotation.x = rampSlope;
      rampPlank.castShadow = true;
      rampPlank.receiveShadow = true;
      group.add(rampPlank);
    }

    const shoreAbutment = new THREE.Mesh(
      new THREE.BoxGeometry(0.034, 0.014, 0.016),
      stoneMat,
    );
    shoreAbutment.position.set(0, 0.004, -0.076);
    shoreAbutment.castShadow = true;
    shoreAbutment.receiveShadow = true;
    group.add(shoreAbutment);

    // Cast-iron mooring bollard with coiled hemp rope on left of pier head
    const bollard = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0024, 0.0028, 0.007, 7),
      ironMat,
    );
    bollard.position.set(-0.009, 0.0235, 0.028);
    group.add(bollard);

    const ropeCoil = new THREE.Mesh(
      new THREE.TorusGeometry(0.0032, 0.001, 5, 10),
      ropeMat,
    );
    ropeCoil.rotation.x = Math.PI / 2;
    ropeCoil.position.set(-0.009, 0.0215, 0.028);
    group.add(ropeCoil);

    // Wooden cargo barrel & crate stacked near shore end of pier
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0042, 0.0038, 0.0095, 8),
      darkWoodMat,
    );
    barrel.position.set(-0.007, 0.025, -0.012);
    barrel.castShadow = true;
    group.add(barrel);

    // Wrought-iron dock lantern post + hanging bracket + glass lantern at pier head
    const lanternPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0016, 0.0022, 0.028, 6),
      ironMat,
    );
    lanternPost.position.set(0.011, 0.034, 0.029);
    lanternPost.castShadow = true;
    group.add(lanternPost);

    const lanternArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.0016, 0.0016),
      ironMat,
    );
    lanternArm.position.set(0.008, 0.047, 0.029);
    group.add(lanternArm);

    const lanternBulb = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0032, 0.0024, 0.007, 6),
      lanternMat,
    );
    lanternBulb.position.set(0.005, 0.042, 0.029);
    group.add(lanternBulb);

    const lanternRoof = new THREE.Mesh(
      new THREE.ConeGeometry(0.0042, 0.003, 6),
      ironMat,
    );
    lanternRoof.position.set(0.005, 0.0465, 0.029);
    group.add(lanternRoof);
  }

  return { group, windowMaterials };
}

export function createSwanDuckFlockMesh(): {
  group: THREE.Group;
  rippleRings: THREE.Mesh[];
} {
  const group = new THREE.Group();
  const rippleRings: THREE.Mesh[] = [];

  const whitePlumageMat = new THREE.MeshStandardMaterial({
    color: '#fdfbf7',
    roughness: 0.65,
    flatShading: true,
  });
  const wingFeatherMat = new THREE.MeshStandardMaterial({
    color: '#f4efe6',
    roughness: 0.68,
    flatShading: true,
  });
  const cygnetMat = new THREE.MeshStandardMaterial({
    color: '#f7eed7',
    roughness: 0.72,
    flatShading: true,
  });
  const beakMat = new THREE.MeshStandardMaterial({
    color: '#f08324',
    roughness: 0.5,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: '#24201d',
    roughness: 0.4,
  });

  const buildWaterbird = (
    scale: number,
    offsetX: number,
    offsetZ: number,
    isSwan: boolean,
  ) => {
    const bird = new THREE.Group();
    bird.position.set(offsetX, 0, offsetZ);
    bird.scale.setScalar(scale);

    const bodyMat = isSwan ? whitePlumageMat : cygnetMat;

    // Sculpted buoyant torso
    const torso = new THREE.Mesh(
      new THREE.SphereGeometry(0.0078, 10, 8),
      bodyMat,
    );
    torso.scale.set(0.88, 0.68, 1.42);
    torso.position.set(0, 0.0045, -0.001);
    torso.castShadow = true;
    bird.add(torso);

    // Rounded breast puff at the front
    const breast = new THREE.Mesh(
      new THREE.SphereGeometry(0.0062, 8, 8),
      bodyMat,
    );
    breast.scale.set(0.92, 0.78, 1.05);
    breast.position.set(0, 0.0055, 0.0055);
    bird.add(breast);

    // Upturned tail feather fan at the rear
    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(0.0045, 0.009, 6),
      bodyMat,
    );
    tail.position.set(0, 0.007, -0.0115);
    tail.rotation.x = -0.85;
    tail.scale.set(1.1, 1.0, 0.65);
    bird.add(tail);

    // Folded sculpted left & right wings along the flanks
    for (const side of [-1, 1]) {
      const wingGroup = new THREE.Group();
      wingGroup.position.set(side * 0.0058, 0.0068, -0.0015);
      wingGroup.rotation.y = side * 0.12;
      wingGroup.rotation.z = -side * 0.18;

      const mainWing = new THREE.Mesh(
        new THREE.SphereGeometry(0.0056, 8, 6),
        isSwan ? wingFeatherMat : bodyMat,
      );
      mainWing.scale.set(0.38, 0.65, 1.55);
      mainWing.castShadow = true;
      wingGroup.add(mainWing);

      // Secondary layered wing tip feather
      const wingTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.0032, 0.008, 5),
        bodyMat,
      );
      wingTip.rotation.x = -Math.PI / 2 + 0.25;
      wingTip.position.set(0, 0.0008, -0.0065);
      wingGroup.add(wingTip);

      bird.add(wingGroup);
    }

    // Graceful S-curved neck (3 articulated segments for swan, compact for duck)
    if (isSwan) {
      const neck1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0021, 0.0028, 0.0065, 8),
        bodyMat,
      );
      neck1.position.set(0, 0.0095, 0.0075);
      neck1.rotation.x = 0.35;
      bird.add(neck1);

      const neck2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0018, 0.0021, 0.0075, 8),
        bodyMat,
      );
      neck2.position.set(0, 0.0148, 0.0085);
      neck2.rotation.x = -0.12;
      bird.add(neck2);

      const neck3 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0017, 0.0018, 0.0045, 8),
        bodyMat,
      );
      neck3.position.set(0, 0.0192, 0.0082);
      neck3.rotation.x = 0.22;
      bird.add(neck3);
    } else {
      const duckNeck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0024, 0.0032, 0.0065, 8),
        bodyMat,
      );
      duckNeck.position.set(0, 0.0095, 0.0065);
      duckNeck.rotation.x = 0.18;
      bird.add(duckNeck);
    }

    const headY = isSwan ? 0.0215 : 0.0138;
    const headZ = isSwan ? 0.0092 : 0.0078;

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.0034, 10, 10),
      bodyMat,
    );
    head.scale.set(0.92, 0.95, 1.15);
    head.position.set(0, headY, headZ);
    bird.add(head);

    // Glossy bead eyes on both sides of head
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.00075, 6, 6),
        darkMat,
      );
      eye.position.set(side * 0.0026, headY + 0.0006, headZ + 0.0015);
      bird.add(eye);
    }

    // Swan dark basal bill knob
    if (isSwan) {
      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.0012, 6, 6),
        darkMat,
      );
      knob.position.set(0, headY + 0.0006, headZ + 0.0034);
      bird.add(knob);
    }

    // Sculpted waterfowl bill
    const beak = new THREE.Mesh(
      new THREE.ConeGeometry(0.0018, 0.0052, 6),
      beakMat,
    );
    beak.rotation.x = Math.PI / 2 + 0.08;
    beak.scale.set(1.15, 1.0, 0.68);
    beak.position.set(0, headY - 0.0005, headZ + 0.0052);
    bird.add(beak);

    // Underwater orange webbed feet paddles
    for (const side of [-1, 1]) {
      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(0.0028, 0.0008, 0.0042),
        beakMat,
      );
      foot.position.set(side * 0.0032, 0.0008, -0.002);
      bird.add(foot);
    }

    // Expanding ripple ring on water surface
    const ringGeo = new THREE.RingGeometry(0.009, 0.0125, 20);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.0015;
    bird.add(ring);
    rippleRings.push(ring);

    group.add(bird);
  };

  // Graceful mother swan leading two smaller cygnets/ducks in V-formation
  buildWaterbird(1.08, 0, 0.004, true);
  buildWaterbird(0.76, -0.012, -0.013, false);
  buildWaterbird(0.68, 0.011, -0.018, false);

  return { group, rippleRings };
}

// ---------------------------------------------------------------------------
// NEW TOOL MESHES: B. COZY VILLAGE & COUNTRYSIDE LANDMARKS
// ---------------------------------------------------------------------------

export function createCampfireMesh(): {
  group: THREE.Group;
  flameGroup: THREE.Group;
  embers: THREE.Points;
  light: THREE.PointLight;
} {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#87837c',
    roughness: 0.9,
    flatShading: true,
  });
  const darkStoneMat = new THREE.MeshStandardMaterial({
    color: '#6e6a64',
    roughness: 0.92,
    flatShading: true,
  });

  // 10-stone firepit ring + glowing ember coal bed at center
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.0052, 0),
      i % 2 === 0 ? stoneMat : darkStoneMat,
    );
    stone.scale.set(1.15, 0.78, 1.0);
    stone.position.set(Math.cos(a) * 0.017, 0.003, Math.sin(a) * 0.017);
    stone.rotation.y = a;
    stone.castShadow = true;
    group.add(stone);
  }

  const coalBed = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.014, 0.0035, 10),
    new THREE.MeshStandardMaterial({
      color: '#ff511a',
      emissive: new THREE.Color('#ff3b00'),
      emissiveIntensity: 0.9,
      roughness: 0.6,
    }),
  );
  coalBed.position.y = 0.0018;
  group.add(coalBed);

  const logMat = new THREE.MeshStandardMaterial({
    color: '#5e3c23',
    roughness: 0.88,
  });
  const benchLogMat = new THREE.MeshStandardMaterial({
    color: '#785032',
    roughness: 0.85,
    flatShading: true,
  });

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI + 0.25;
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0026, 0.0032, 0.026, 6),
      logMat,
    );
    log.position.set(0, 0.0055, 0);
    log.rotation.order = 'YXZ';
    log.rotation.y = a;
    log.rotation.z = Math.PI / 2 - 0.24;
    log.castShadow = true;
    group.add(log);
  }

  // Two rustic log-bench seats placed outside the stone ring for villagers
  for (const side of [-1, 1]) {
    const benchLog = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0038, 0.004, 0.022, 7),
      benchLogMat,
    );
    benchLog.rotation.z = Math.PI / 2;
    benchLog.position.set(0, 0.0038, side * 0.028);
    benchLog.castShadow = true;
    group.add(benchLog);
  }

  // Rustic wooden tripod cooking frame + hanging cast-iron kettle pot over the fire
  const ironMat = new THREE.MeshStandardMaterial({
    color: '#282a2e',
    metalness: 0.6,
    roughness: 0.45,
  });
  for (let t = 0; t < 3; t++) {
    const ta = (t / 3) * Math.PI * 2 + 0.4;
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.001, 0.0014, 0.044, 5),
      logMat,
    );
    pole.position.set(Math.cos(ta) * 0.011, 0.019, Math.sin(ta) * 0.011);
    pole.rotation.z = Math.cos(ta) * 0.36;
    pole.rotation.x = -Math.sin(ta) * 0.36;
    pole.castShadow = true;
    group.add(pole);
  }

  const kettleChain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0005, 0.0005, 0.012, 4),
    ironMat,
  );
  kettleChain.position.y = 0.031;
  group.add(kettleChain);

  const kettle = new THREE.Mesh(
    new THREE.SphereGeometry(0.0048, 8, 8),
    ironMat,
  );
  kettle.scale.set(1.05, 0.88, 1.05);
  kettle.position.y = 0.0235;
  kettle.castShadow = true;
  group.add(kettle);

  const flameGroup = new THREE.Group();
  const outerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.009, 0.023, 7),
    new THREE.MeshBasicMaterial({ color: '#ff6d24' }),
  );
  outerFlame.position.y = 0.013;
  const innerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.0055, 0.016, 6),
    new THREE.MeshBasicMaterial({ color: '#ffe066' }),
  );
  innerFlame.position.y = 0.011;
  const sideTongue = new THREE.Mesh(
    new THREE.ConeGeometry(0.0045, 0.014, 5),
    new THREE.MeshBasicMaterial({ color: '#ff9636' }),
  );
  sideTongue.position.set(0.0035, 0.011, 0.002);
  sideTongue.rotation.z = -0.22;
  flameGroup.add(outerFlame, innerFlame, sideTongue);
  group.add(flameGroup);

  // Rising glowing ember particles
  const emberCount = 12;
  const emberPos = new Float32Array(emberCount * 3);
  for (let i = 0; i < emberCount; i++) {
    emberPos[i * 3] = (Math.random() - 0.5) * 0.015;
    emberPos[i * 3 + 1] = 0.01 + (i / emberCount) * 0.048;
    emberPos[i * 3 + 2] = (Math.random() - 0.5) * 0.015;
  }
  const emberGeo = new THREE.BufferGeometry();
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
  const embers = new THREE.Points(
    emberGeo,
    new THREE.PointsMaterial({
      color: '#ffaa33',
      size: 0.012,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  group.add(embers);

  const light = new THREE.PointLight('#ff8833', 0.65, 0.36, 1.6);
  light.position.y = 0.024;
  group.add(light);

  return { group, flameGroup, embers, light };
}

export function createHotAirBalloonMesh(variantIdx: number): {
  group: THREE.Group;
  burnerMat: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();

  const basketMat = new THREE.MeshStandardMaterial({
    color: '#9c6f44',
    roughness: 0.86,
    flatShading: true,
  });
  const leatherRimMat = new THREE.MeshStandardMaterial({
    color: '#634126',
    roughness: 0.78,
  });
  const sandbagMat = new THREE.MeshStandardMaterial({
    color: '#d9c49a',
    roughness: 0.88,
  });

  // Woven wicker gondola basket + padded leather rim + 4 corner sandbags
  const basket = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, 0.013, 0.016),
    basketMat,
  );
  basket.position.y = -0.042;
  basket.castShadow = true;
  group.add(basket);

  const basketRim = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.0025, 0.018),
    leatherRimMat,
  );
  basketRim.position.y = -0.035;
  group.add(basketRim);

  // 4 rigging lines + corner ballast sandbags
  const ropeMat = new THREE.MeshStandardMaterial({
    color: '#5c432c',
    roughness: 0.8,
  });
  for (const sx of [-0.0065, 0.0065]) {
    for (const sz of [-0.0065, 0.0065]) {
      const rope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0006, 0.0006, 0.022, 4),
        ropeMat,
      );
      rope.position.set(sx, -0.025, sz);
      group.add(rope);

      const bag = new THREE.Mesh(
        new THREE.SphereGeometry(0.0022, 6, 6),
        sandbagMat,
      );
      bag.scale.set(0.85, 1.3, 0.85);
      bag.position.set(sx * 1.35, -0.039, sz * 1.35);
      group.add(bag);
    }
  }

  // Throat collar ring + burner flame inside throat
  const throatRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.012, 0.0014, 6, 14),
    leatherRimMat,
  );
  throatRing.rotation.x = Math.PI / 2;
  throatRing.position.y = -0.017;
  group.add(throatRing);

  const burnerMat = new THREE.MeshStandardMaterial({
    color: '#fff3b8',
    emissive: new THREE.Color('#ff9d2e'),
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });
  const burner = new THREE.Mesh(
    new THREE.SphereGeometry(0.0046, 8, 8),
    burnerMat,
  );
  burner.scale.set(0.9, 1.3, 0.9);
  burner.position.y = -0.022;
  group.add(burner);

  // Striped pastel balloon envelope with equator bunting band & crown medallion
  const envGeo = new THREE.IcosahedronGeometry(0.036, 2);
  const pos = envGeo.attributes.position;
  const colors: number[] = [];
  const stripePalettes = [
    [new THREE.Color('#f7a899'), new THREE.Color('#fff5d6')],
    [new THREE.Color('#a6dec4'), new THREE.Color('#fef6e4')],
    [new THREE.Color('#b8caf7'), new THREE.Color('#fde2e8')],
  ];
  const pair = stripePalettes[variantIdx % stripePalettes.length];
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // Taper bottom of balloon envelope into a teardrop shape
    if (v.y < 0) {
      const t = Math.abs(v.y) / 0.036;
      v.x *= 1.0 - t * 0.48;
      v.z *= 1.0 - t * 0.48;
      v.y *= 1.15;
    }
    pos.setXYZ(i, v.x, v.y, v.z);

    const angle = Math.atan2(v.z, v.x);
    const stripeIdx = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 8);
    const c = stripeIdx % 2 === 0 ? pair[0] : pair[1];
    colors.push(c.r, c.g, c.b);
  }
  envGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  envGeo.computeVertexNormals();

  const envelope = new THREE.Mesh(
    envGeo,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.68,
      flatShading: true,
    }),
  );
  envelope.position.y = 0.012;
  envelope.castShadow = true;
  group.add(envelope);

  // Decorative gold equator band & top crown cap on the envelope
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: '#f2c968',
    roughness: 0.45,
    metalness: 0.35,
  });
  const equatorBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.0358, 0.0014, 6, 18),
    goldTrimMat,
  );
  equatorBand.rotation.x = Math.PI / 2;
  equatorBand.position.y = 0.014;
  group.add(equatorBand);

  const crownCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.012, 0.003, 12),
    goldTrimMat,
  );
  crownCap.position.y = 0.0475;
  group.add(crownCap);

  return { group, burnerMat };
}

export function createStoneWatchtowerMesh(): {
  group: THREE.Group;
  flagMesh: THREE.Mesh;
  windowMaterials: THREE.MeshStandardMaterial[];
} {
  const group = new THREE.Group();
  const windowMaterials: THREE.MeshStandardMaterial[] = [];

  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#918d86',
    roughness: 0.88,
    flatShading: true,
  });
  const darkStoneMat = new THREE.MeshStandardMaterial({
    color: '#78746d',
    roughness: 0.9,
    flatShading: true,
  });
  const slateRoofMat = new THREE.MeshStandardMaterial({
    color: '#4c5d78',
    roughness: 0.68,
    flatShading: true,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: '#5e3e26',
    roughness: 0.82,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: '#d4af63',
    metalness: 0.65,
    roughness: 0.3,
  });

  // Battered octagonal stone plinth base + stone steps + arched oak portcullis door
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.039, 0.022, 10),
    darkStoneMat,
  );
  plinth.position.y = 0.009;
  plinth.castShadow = true;
  group.add(plinth);

  const doorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.022, 0.006),
    darkStoneMat,
  );
  doorFrame.position.set(0, 0.019, 0.032);
  group.add(doorFrame);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.0115, 0.019, 0.0065),
    woodMat,
  );
  door.position.set(0, 0.0185, 0.0325);
  group.add(door);

  const step = new THREE.Mesh(
    new THREE.BoxGeometry(0.017, 0.006, 0.011),
    darkStoneMat,
  );
  step.position.set(0, 0.005, 0.038);
  group.add(step);

  // Main cylindrical stone keep shaft + middle decorative stone stringcourse ring
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.03, 0.078, 12),
    stoneMat,
  );
  shaft.position.y = 0.055;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  group.add(shaft);

  const stringCourse = new THREE.Mesh(
    new THREE.TorusGeometry(0.028, 0.0016, 6, 12),
    darkStoneMat,
  );
  stringCourse.rotation.x = Math.PI / 2;
  stringCourse.position.y = 0.052;
  group.add(stringCourse);

  // Attached fairytale side stair-turret (bartizan) with its own conical slate roof
  const sideTurret = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.009, 0.042, 8),
    stoneMat,
  );
  sideTurret.position.set(-0.024, 0.072, 0.008);
  sideTurret.castShadow = true;
  group.add(sideTurret);

  const sideTurretBase = new THREE.Mesh(
    new THREE.ConeGeometry(0.01, 0.014, 8),
    darkStoneMat,
  );
  sideTurretBase.rotation.x = Math.PI;
  sideTurretBase.position.set(-0.024, 0.046, 0.008);
  group.add(sideTurretBase);

  const sideTurretRoof = new THREE.Mesh(
    new THREE.ConeGeometry(0.013, 0.022, 8),
    slateRoofMat,
  );
  sideTurretRoof.position.set(-0.024, 0.103, 0.008);
  sideTurretRoof.castShadow = true;
  group.add(sideTurretRoof);

  // Crenelated parapet ring + supporting machicolation corbels + 8 battlements
  const parapet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0295, 0.0265, 0.012, 12),
    darkStoneMat,
  );
  parapet.position.y = 0.096;
  group.add(parapet);

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const corbel = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.007, 0.005),
      darkStoneMat,
    );
    corbel.position.set(Math.cos(a) * 0.026, 0.088, Math.sin(a) * 0.026);
    corbel.rotation.y = -a;
    group.add(corbel);

    const merlon = new THREE.Mesh(
      new THREE.BoxGeometry(0.0072, 0.0085, 0.0052),
      stoneMat,
    );
    merlon.position.set(Math.cos(a) * 0.0265, 0.104, Math.sin(a) * 0.0265);
    merlon.rotation.y = -a;
    group.add(merlon);
  }

  // Fairytale conical slate turret roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.0265, 0.044, 12),
    slateRoofMat,
  );
  roof.position.y = 0.123;
  roof.castShadow = true;
  group.add(roof);

  // Glowing lancet windows on main tower & side bartizan
  const winMat = new THREE.MeshStandardMaterial({
    color: '#fff3c4',
    emissive: new THREE.Color('#ffae38'),
    emissiveIntensity: 0.3,
    roughness: 0.2,
  });
  windowMaterials.push(winMat);
  for (const side of [-1, 1]) {
    const slit = new THREE.Mesh(
      new THREE.BoxGeometry(0.0055, 0.015, 0.0045),
      winMat,
    );
    slit.position.set(side * 0.026, 0.066, 0);
    slit.rotation.y = Math.PI / 2;
    group.add(slit);
  }
  const frontWin = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, 0.014, 0.0045),
    winMat,
  );
  frontWin.position.set(0, 0.072, 0.026);
  group.add(frontWin);

  const turretWin = new THREE.Mesh(
    new THREE.BoxGeometry(0.0045, 0.009, 0.004),
    winMat,
  );
  turretWin.position.set(-0.024, 0.074, 0.018);
  group.add(turretWin);

  // Brass Flagpole + Finial Orb & Waving Pennant Flag
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.001, 0.0013, 0.028, 6),
    brassMat,
  );
  pole.position.y = 0.153;
  group.add(pole);

  const poleBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.0022, 6, 6),
    brassMat,
  );
  poleBall.position.y = 0.168;
  group.add(poleBall);

  const flagGeo = new THREE.BoxGeometry(0.023, 0.0095, 0.0015, 4, 1, 1);
  flagGeo.translate(0.0115, 0, 0);
  const flagMesh = new THREE.Mesh(
    flagGeo,
    new THREE.MeshStandardMaterial({
      color: '#e3564b',
      roughness: 0.65,
      side: THREE.DoubleSide,
    }),
  );
  flagMesh.position.set(0, 0.16, 0);
  group.add(flagMesh);

  return { group, flagMesh, windowMaterials };
}

export function createBeehiveMesh(): {
  group: THREE.Group;
  butterflySwarm: THREE.Group;
} {
  const group = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({
    color: '#8c623d',
    roughness: 0.85,
  });
  const darkSlotMat = new THREE.MeshStandardMaterial({
    color: '#26180d',
    roughness: 0.9,
  });

  // Raised timber hive stand with 4 corner legs + landing board
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 0.004, 0.028),
    woodMat,
  );
  base.position.y = 0.0065;
  group.add(base);

  for (const lx of [-0.01, 0.01]) {
    for (const lz of [-0.01, 0.01]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.0032, 0.006, 0.0032),
        woodMat,
      );
      leg.position.set(lx, 0.003, lz);
      group.add(leg);
    }
  }

  // Two painted pastel Langstroth apiary hive boxes with entrance slot & side handles
  const box1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.014, 0.022),
    new THREE.MeshStandardMaterial({
      color: '#fae39c',
      roughness: 0.72,
      flatShading: true,
    }),
  );
  box1.position.y = 0.0155;
  box1.castShadow = true;
  group.add(box1);

  const entranceSlot = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.0022, 0.002),
    darkSlotMat,
  );
  entranceSlot.position.set(0, 0.0095, 0.0112);
  group.add(entranceSlot);

  const box2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.021, 0.012, 0.021),
    new THREE.MeshStandardMaterial({
      color: '#bfe3c8',
      roughness: 0.72,
      flatShading: true,
    }),
  );
  box2.position.y = 0.0285;
  box2.castShadow = true;
  group.add(box2);

  const upperHole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0016, 0.0016, 0.002, 8),
    darkSlotMat,
  );
  upperHole.rotation.x = Math.PI / 2;
  upperHole.position.set(0, 0.0285, 0.0106);
  group.add(upperHole);

  // Pitched gabled hive roof with overhangs & ridge cap
  for (const side of [-1, 1]) {
    const roofSlope = new THREE.Mesh(
      new THREE.BoxGeometry(0.015, 0.0028, 0.025),
      woodMat,
    );
    roofSlope.position.set(side * 0.006, 0.0375, 0);
    roofSlope.rotation.z = -side * 0.45;
    roofSlope.castShadow = true;
    group.add(roofSlope);
  }

  // Miniature golden honey jar resting beside the hive stand
  const honeyJar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0032, 0.0035, 0.0065, 8),
    new THREE.MeshStandardMaterial({
      color: '#f5b027',
      roughness: 0.25,
      metalness: 0.1,
    }),
  );
  honeyJar.position.set(0.017, 0.0032, 0.008);
  group.add(honeyJar);

  const jarLid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0034, 0.0034, 0.0018, 8),
    new THREE.MeshStandardMaterial({ color: '#fcf6e6', roughness: 0.7 }),
  );
  jarLid.position.set(0.017, 0.007, 0.008);
  group.add(jarLid);

  // Swarm of 5 detailed pastel butterflies & plump striped golden honeybees
  const butterflySwarm = new THREE.Group();
  butterflySwarm.position.y = 0.048;

  const darkBodyMat = new THREE.MeshStandardMaterial({
    color: '#2e2621',
    roughness: 0.7,
  });
  const beeGoldMat = new THREE.MeshStandardMaterial({
    color: '#f5b82e',
    roughness: 0.55,
  });

  const wingColors = ['#ff9ebb', '#ffd954', '#9ed8ff', '#d4a6ff', '#ffb870'];
  for (let i = 0; i < 5; i++) {
    const bPivot = new THREE.Group();
    const angle = (i / 5) * Math.PI * 2;
    bPivot.position.set(
      Math.cos(angle) * 0.025,
      (i % 2) * 0.012,
      Math.sin(angle) * 0.025,
    );
    bPivot.rotation.y = -angle;

    const isHoneybee = i % 2 === 1;

    if (isHoneybee) {
      // Plump golden honeybee with black stripe band & translucent wings
      const leftWingGroup = new THREE.Group();
      const rightWingGroup = new THREE.Group();
      const translucentWingMat = new THREE.MeshBasicMaterial({
        color: '#eef8ff',
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
      });

      const lw = new THREE.Mesh(
        new THREE.CircleGeometry(0.0032, 8),
        translucentWingMat,
      );
      lw.scale.set(1.3, 0.75, 1.0);
      lw.position.set(-0.0032, 0.001, 0);
      leftWingGroup.add(lw);

      const rw = new THREE.Mesh(
        new THREE.CircleGeometry(0.0032, 8),
        translucentWingMat,
      );
      rw.scale.set(1.3, 0.75, 1.0);
      rw.position.set(0.0032, 0.001, 0);
      rightWingGroup.add(rw);

      // Keep children[0] and children[1] as left/right wing groups for animation
      bPivot.add(leftWingGroup, rightWingGroup);

      const beeBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.0022, 8, 8),
        beeGoldMat,
      );
      beeBody.scale.set(0.85, 0.85, 1.45);
      bPivot.add(beeBody);

      const stripe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.002, 0.002, 0.0016, 8),
        darkBodyMat,
      );
      stripe.rotation.x = Math.PI / 2;
      bPivot.add(stripe);
    } else {
      // Sculpted 4-wing Butterfly with thorax, abdomen & fore/hind wings
      const wingMat = new THREE.MeshBasicMaterial({
        color: wingColors[i],
        side: THREE.DoubleSide,
      });

      const leftWingGroup = new THREE.Group();
      const foreLeft = new THREE.Mesh(
        new THREE.CircleGeometry(0.0038, 8),
        wingMat,
      );
      foreLeft.scale.set(1.25, 0.88, 1.0);
      foreLeft.position.set(-0.0034, 0, 0.0014);
      const hindLeft = new THREE.Mesh(
        new THREE.CircleGeometry(0.0026, 8),
        wingMat,
      );
      hindLeft.position.set(-0.0026, 0, -0.0022);
      leftWingGroup.add(foreLeft, hindLeft);

      const rightWingGroup = new THREE.Group();
      const foreRight = new THREE.Mesh(
        new THREE.CircleGeometry(0.0038, 8),
        wingMat,
      );
      foreRight.scale.set(1.25, 0.88, 1.0);
      foreRight.position.set(0.0034, 0, 0.0014);
      const hindRight = new THREE.Mesh(
        new THREE.CircleGeometry(0.0026, 8),
        wingMat,
      );
      hindRight.position.set(0.0026, 0, -0.0022);
      rightWingGroup.add(foreRight, hindRight);

      bPivot.add(leftWingGroup, rightWingGroup);

      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0007, 0.0006, 0.0068, 6),
        darkBodyMat,
      );
      body.rotation.x = Math.PI / 2;
      bPivot.add(body);
    }

    butterflySwarm.add(bPivot);
  }

  group.add(butterflySwarm);
  return { group, butterflySwarm };
}

export function createLanternPostMesh(): {
  group: THREE.Group;
  windowMaterials: THREE.MeshStandardMaterial[];
} {
  const group = new THREE.Group();
  const windowMaterials: THREE.MeshStandardMaterial[] = [];

  // Cobblestone road medallion underneath the streetlamp
  const cobbleGroup = createSteppingPathMesh();
  group.add(cobbleGroup);

  const ironMat = new THREE.MeshStandardMaterial({
    color: '#2c3038',
    roughness: 0.5,
    metalness: 0.5,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: '#d9b15b',
    metalness: 0.65,
    roughness: 0.3,
  });

  // Fluted Victorian cast-iron base plinth + tapered post + ladder rest crossbar
  const basePlinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0034, 0.0048, 0.011, 8),
    ironMat,
  );
  basePlinth.position.y = 0.0055;
  group.add(basePlinth);

  const baseCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.0034, 0.0008, 6, 10),
    brassMat,
  );
  baseCollar.rotation.x = Math.PI / 2;
  baseCollar.position.y = 0.0115;
  group.add(baseCollar);

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0016, 0.0026, 0.042, 8),
    ironMat,
  );
  post.position.y = 0.031;
  post.castShadow = true;
  group.add(post);

  const ladderBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0007, 0.0007, 0.012, 6),
    ironMat,
  );
  ladderBar.rotation.x = Math.PI / 2;
  ladderBar.position.y = 0.039;
  group.add(ladderBar);

  // Curved scrollwork bracket arm
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.0018, 0.0018),
    ironMat,
  );
  arm.position.set(0.0065, 0.05, 0);
  group.add(arm);

  const scrollBrace = new THREE.Mesh(
    new THREE.TorusGeometry(0.0042, 0.0007, 5, 10, Math.PI),
    ironMat,
  );
  scrollBrace.position.set(0.0055, 0.049, 0);
  group.add(scrollBrace);

  const lanternMat = new THREE.MeshStandardMaterial({
    color: '#fff5c8',
    emissive: new THREE.Color('#ffba3b'),
    emissiveIntensity: 0.35,
    roughness: 0.15,
  });
  windowMaterials.push(lanternMat);

  // 6-sided glass lantern cage + iron dome hood + top & bottom finials
  const lantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0044, 0.0032, 0.009, 6),
    lanternMat,
  );
  lantern.position.set(0.0125, 0.043, 0);
  group.add(lantern);

  const lanternRoof = new THREE.Mesh(
    new THREE.ConeGeometry(0.0054, 0.004, 6),
    ironMat,
  );
  lanternRoof.position.set(0.0125, 0.049, 0);
  group.add(lanternRoof);

  const bottomFinial = new THREE.Mesh(
    new THREE.ConeGeometry(0.0022, 0.0035, 6),
    ironMat,
  );
  bottomFinial.rotation.x = Math.PI;
  bottomFinial.position.set(0.0125, 0.037, 0);
  group.add(bottomFinial);

  return { group, windowMaterials };
}

// ---------------------------------------------------------------------------
// NEW TOOL MESHES: C. WEATHER & ELEMENTAL POWERS
// ---------------------------------------------------------------------------

export function createRainbowArchMesh(): THREE.Group {
  const group = new THREE.Group();
  const bandColors = [
    '#ff7575',
    '#ffb866',
    '#fff275',
    '#75e096',
    '#75c4ff',
    '#b88aff',
  ];

  const baseY = 0.016;
  bandColors.forEach((hex, idx) => {
    const radius = 0.068 - idx * 0.0042;
    const arcGeo = new THREE.TorusGeometry(radius, 0.0028, 8, 40, Math.PI);
    const arcMat = new THREE.MeshBasicMaterial({
      color: hex,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    const arc = new THREE.Mesh(arcGeo, arcMat);
    arc.position.y = baseY;
    group.add(arc);
  });

  // Soft white cloud anchor puffs at both feet of the rainbow arch
  const cloudFootMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.85,
    flatShading: true,
  });
  for (const side of [-1, 1]) {
    const footX = side * 0.058;
    for (const [ox, oy, oz, r] of [
      [0, baseY + 0.001, 0, 0.012],
      [-0.007, baseY - 0.002, 0.004, 0.009],
      [0.007, baseY - 0.002, -0.003, 0.009],
    ]) {
      const puff = new THREE.Mesh(
        new THREE.IcosahedronGeometry(r, 1),
        cloudFootMat,
      );
      puff.position.set(footX + ox, oy, oz);
      group.add(puff);
    }
  }

  return group;
}

export function createShootingStarMesh(): THREE.Group {
  const group = new THREE.Group();

  // Multi-point faceted star head + golden aura ring
  const starMat = new THREE.MeshBasicMaterial({ color: '#fffbe0' });
  const headA = new THREE.Mesh(new THREE.OctahedronGeometry(0.019, 0), starMat);
  const headB = new THREE.Mesh(new THREE.OctahedronGeometry(0.019, 0), starMat);
  headB.rotation.set(Math.PI / 4, Math.PI / 4, 0);
  group.add(headA, headB);

  const halo = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.028, 1),
    new THREE.MeshBasicMaterial({
      color: '#ffd966',
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  );
  group.add(halo);

  // Tapered glowing comet tail along -Z
  const tailGeo = new THREE.ConeGeometry(0.015, 0.26, 12, 1, true);
  tailGeo.translate(0, -0.13, 0);
  tailGeo.rotateX(Math.PI / 2);

  const pos = tailGeo.attributes.position;
  const colors: number[] = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const dist = Math.abs(v.z) / 0.26;
    const fade = Math.pow(1.0 - THREE.MathUtils.clamp(dist, 0, 1), 1.6);
    colors.push(1.0 * fade, 0.94 * fade, 0.68 * fade);
  }
  tailGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const tail = new THREE.Mesh(
    tailGeo,
    new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  group.add(tail);

  return group;
}

const VILLAGER_COLORS = [
  '#e35b54',
  '#4c8fd6',
  '#f0a637',
  '#9c6cd4',
  '#45b583',
  '#e8769b',
  '#d9763d',
  '#52b5c4',
];

const HAIR_COLORS = ['#4a3222', '#8c4a27', '#d9a44e', '#2c221e', '#6e472b'];
const TROUSER_COLORS = ['#3b495e', '#594636', '#465747', '#634f3d'];

export function createVillagerMesh(colorIdx: number): {
  group: THREE.Group;
  bodyMesh: THREE.Object3D;
  headGroup: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
} {
  const group = new THREE.Group();
  // Slightly larger, clearly readable storybook figurine scale
  const inner = new THREE.Group();
  inner.scale.setScalar(1.22);

  const tunicColor = VILLAGER_COLORS[colorIdx % VILLAGER_COLORS.length];
  const tunicMat = new THREE.MeshStandardMaterial({
    color: tunicColor,
    roughness: 0.72,
    flatShading: true,
  });
  const trouserMat = new THREE.MeshStandardMaterial({
    color: TROUSER_COLORS[colorIdx % TROUSER_COLORS.length],
    roughness: 0.8,
    flatShading: true,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: '#3b2618',
    roughness: 0.78,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: '#f7d2b5',
    roughness: 0.65,
  });
  const cheekMat = new THREE.MeshStandardMaterial({
    color: '#f29488',
    roughness: 0.7,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: HAIR_COLORS[colorIdx % HAIR_COLORS.length],
    roughness: 0.82,
    flatShading: true,
  });
  const creamClothMat = new THREE.MeshStandardMaterial({
    color: '#fcf7eb',
    roughness: 0.75,
    flatShading: true,
  });
  const beltMat = new THREE.MeshStandardMaterial({
    color: '#4f3522',
    roughness: 0.75,
  });
  const buckleMat = new THREE.MeshStandardMaterial({
    color: '#e5bc57',
    metalness: 0.65,
    roughness: 0.3,
  });

  // 1. Articulated Left & Right Legs with Trousers & Rounded Boots
  const buildLeg = (side: number) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.0026, 0.0075, 0);

    const legShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0017, 0.0015, 0.0062, 8),
      trouserMat,
    );
    legShaft.position.y = -0.003;
    legShaft.castShadow = true;
    legPivot.add(legShaft);

    const boot = new THREE.Mesh(
      new THREE.BoxGeometry(0.0032, 0.0026, 0.0048),
      bootMat,
    );
    boot.position.set(0, -0.0062, 0.0008);
    boot.castShadow = true;
    legPivot.add(boot);

    return legPivot;
  };

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);
  inner.add(leftLeg, rightLeg);

  // 2. Sculpted Torso: Flared Tunic Skirt + Upper Bodice + Belt + Collar/Apron
  const torsoGroup = new THREE.Group();

  const skirt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0044, 0.0068, 0.0082, 10),
    tunicMat,
  );
  skirt.position.y = 0.0098;
  skirt.castShadow = true;
  torsoGroup.add(skirt);

  const upperChest = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0046, 0.0044, 0.0075, 10),
    tunicMat,
  );
  upperChest.position.y = 0.0162;
  upperChest.castShadow = true;
  torsoGroup.add(upperChest);

  // Rounded shoulders collar / shawl
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.0038, 0.0013, 6, 12),
    creamClothMat,
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.0195;
  torsoGroup.add(collar);

  // Leather waist belt + brass buckle
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0047, 0.0049, 0.0018, 10),
    beltMat,
  );
  belt.position.y = 0.0132;
  torsoGroup.add(belt);

  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.0022, 0.0022, 0.0012),
    buckleMat,
  );
  buckle.position.set(0, 0.0132, 0.0046);
  torsoGroup.add(buckle);

  // Cozy front apron or satchel on some villagers
  if (colorIdx % 3 === 0) {
    const apron = new THREE.Mesh(
      new THREE.BoxGeometry(0.0056, 0.0068, 0.0015),
      creamClothMat,
    );
    apron.position.set(0, 0.0096, 0.0052);
    apron.rotation.x = -0.18;
    torsoGroup.add(apron);
  }

  inner.add(torsoGroup);

  // 3. Articulated Swinging Left & Right Arms with Sleeves & Hands
  const buildArm = (side: number, hasBasket: boolean) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 0.0056, 0.0185, 0);
    armPivot.rotation.z = -side * 0.18;

    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0016, 0.0014, 0.0068, 8),
      tunicMat,
    );
    sleeve.position.y = -0.0032;
    sleeve.castShadow = true;
    armPivot.add(sleeve);

    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.0016, 8, 8),
      skinMat,
    );
    hand.position.y = -0.0072;
    armPivot.add(hand);

    if (hasBasket) {
      const basket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0028, 0.002, 0.0032, 7),
        new THREE.MeshStandardMaterial({ color: '#b8864c', roughness: 0.85 }),
      );
      basket.position.set(side * 0.0012, -0.009, 0.0015);
      armPivot.add(basket);
    }

    return armPivot;
  };

  const leftArm = buildArm(-1, false);
  const rightArm = buildArm(1, colorIdx % 3 === 1);
  inner.add(leftArm, rightArm);

  // 4. Expressive Head with Face, Eyes, Rosy Cheeks, Hair & Varied Hats
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.0245, 0);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.0052, 12, 12),
    skinMat,
  );
  head.castShadow = true;
  headGroup.add(head);

  // Tiny nose on +Z front of face
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.001, 6, 6),
    skinMat,
  );
  nose.position.set(0, -0.0002, 0.0051);
  headGroup.add(nose);

  // Glossy dark eyes + rosy cheeks
  const eyeMat = new THREE.MeshStandardMaterial({
    color: '#1f1916',
    roughness: 0.3,
  });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.00075, 6, 6),
      eyeMat,
    );
    eye.position.set(side * 0.0019, 0.0008, 0.0046);
    headGroup.add(eye);

    const cheek = new THREE.Mesh(
      new THREE.SphereGeometry(0.0009, 6, 6),
      cheekMat,
    );
    cheek.scale.set(1.2, 0.8, 0.5);
    cheek.position.set(side * 0.0028, -0.0007, 0.0043);
    headGroup.add(cheek);

    // Tiny ears
    const ear = new THREE.Mesh(
      new THREE.SphereGeometry(0.0011, 6, 6),
      skinMat,
    );
    ear.position.set(side * 0.005, 0.0, 0.0);
    headGroup.add(ear);
  }

  // Sculpted Hair cap + back bun or side locks
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.0054,
      10,
      8,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.58,
    ),
    hairMat,
  );
  hairCap.rotation.x = -0.35;
  headGroup.add(hairCap);

  const hairBun = new THREE.Mesh(
    new THREE.SphereGeometry(0.0024, 8, 8),
    hairMat,
  );
  hairBun.position.set(0, 0.0005, -0.0052);
  headGroup.add(hairBun);

  // Distinct Headwear variants
  const hatStyle = colorIdx % 4;
  if (hatStyle === 0) {
    // Straw Sunhat with colored ribbon band
    const strawMat = new THREE.MeshStandardMaterial({
      color: '#edd495',
      roughness: 0.82,
    });
    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0088, 0.0092, 0.0012, 12),
      strawMat,
    );
    brim.position.y = 0.0038;
    brim.rotation.x = -0.12;
    headGroup.add(brim);

    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0046, 0.0052, 0.0036, 10),
      strawMat,
    );
    crown.position.y = 0.0056;
    crown.rotation.x = -0.12;
    headGroup.add(crown);

    const ribbon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0053, 0.0053, 0.001, 10),
      tunicMat,
    );
    ribbon.position.y = 0.0045;
    ribbon.rotation.x = -0.12;
    headGroup.add(ribbon);
  } else if (hatStyle === 1) {
    // Jaunty tilted wool beret
    const beret = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0058, 0.0045, 0.0024, 10),
      tunicMat,
    );
    beret.position.set(0.0008, 0.0048, -0.0005);
    beret.rotation.z = -0.22;
    beret.rotation.x = -0.15;
    headGroup.add(beret);
  } else if (hatStyle === 2) {
    // Cozy pointed gnome/country cap
    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(0.0052, 0.0075, 10),
      tunicMat,
    );
    cap.position.set(0, 0.0068, -0.001);
    cap.rotation.x = -0.28;
    headGroup.add(cap);
  }

  inner.add(headGroup);
  group.add(inner);

  return {
    group,
    bodyMesh: inner,
    headGroup,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
  };
}

export function createSheepMesh(): {
  group: THREE.Group;
  headGroup: THREE.Group;
  legs: THREE.Group[];
  tailMesh: THREE.Object3D;
} {
  const group = new THREE.Group();
  const inner = new THREE.Group();
  inner.scale.setScalar(1.18);

  const woolMat = new THREE.MeshStandardMaterial({
    color: '#fcfaf2',
    roughness: 0.9,
    flatShading: true,
  });
  const woolWarmMat = new THREE.MeshStandardMaterial({
    color: '#f5efe1',
    roughness: 0.92,
    flatShading: true,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: '#38302a',
    roughness: 0.82,
    flatShading: true,
  });
  const hoofMat = new THREE.MeshStandardMaterial({
    color: '#1f1a17',
    roughness: 0.7,
  });
  const noseMat = new THREE.MeshStandardMaterial({
    color: '#e89b96',
    roughness: 0.65,
  });

  // 1. Multi-Puff Cloud-Like Sculpted Wool Fleece Body
  const woolPuffs = [
    { x: 0, y: 0.0125, z: 0, r: 0.0072, sx: 1.05, sy: 0.95, sz: 1.25 },
    { x: 0, y: 0.013, z: 0.0058, r: 0.0062, sx: 1.0, sy: 0.95, sz: 1.0 },
    { x: 0, y: 0.0125, z: -0.0062, r: 0.0064, sx: 1.02, sy: 0.95, sz: 1.0 },
    { x: -0.0046, y: 0.0118, z: 0.001, r: 0.0054, sx: 0.9, sy: 0.9, sz: 1.15 },
    { x: 0.0046, y: 0.0118, z: 0.001, r: 0.0054, sx: 0.9, sy: 0.9, sz: 1.15 },
    { x: -0.0038, y: 0.0122, z: -0.0045, r: 0.0048, sx: 1, sy: 1, sz: 1 },
    { x: 0.0038, y: 0.0122, z: -0.0045, r: 0.0048, sx: 1, sy: 1, sz: 1 },
    { x: 0, y: 0.0162, z: 0.001, r: 0.0052, sx: 1.05, sy: 0.8, sz: 1.2 },
  ];

  woolPuffs.forEach((p, idx) => {
    const puff = new THREE.Mesh(
      new THREE.IcosahedronGeometry(p.r, 1),
      idx % 2 === 0 ? woolMat : woolWarmMat,
    );
    puff.position.set(p.x, p.y, p.z);
    puff.scale.set(p.sx, p.sy, p.sz);
    puff.castShadow = true;
    inner.add(puff);
  });

  // Cute round woolly tail at the back
  const tailMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.0032, 1),
    woolMat,
  );
  tailMesh.position.set(0, 0.0115, -0.0122);
  inner.add(tailMesh);

  // 2. Four Articulated Legs with Upper Wool Cuffs & Hooves
  const legs: THREE.Group[] = [];
  const legOffsets = [
    [-0.0042, 0.0052],
    [0.0042, 0.0052],
    [-0.0042, -0.0055],
    [0.0042, -0.0055],
  ];
  legOffsets.forEach(([lx, lz]) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(lx, 0.0082, lz);

    const woolCuff = new THREE.Mesh(
      new THREE.SphereGeometry(0.0022, 6, 6),
      woolMat,
    );
    woolCuff.position.y = -0.001;
    legPivot.add(woolCuff);

    const shin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0013, 0.0011, 0.0068, 6),
      darkMat,
    );
    shin.position.y = -0.0042;
    shin.castShadow = true;
    legPivot.add(shin);

    const hoof = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0013, 0.0015, 0.0018, 6),
      hoofMat,
    );
    hoof.position.y = -0.0074;
    legPivot.add(hoof);

    legs.push(legPivot);
    inner.add(legPivot);
  });

  // 3. Detailed Sheep Head with Snout, Horizontal Ears, Glossy Eyes & Forehead Wool Tuft
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.0145, 0.0105);

  const cranium = new THREE.Mesh(
    new THREE.SphereGeometry(0.0042, 8, 8),
    darkMat,
  );
  cranium.scale.set(0.95, 0.92, 1.15);
  cranium.position.set(0, 0, 0.002);
  cranium.castShadow = true;
  headGroup.add(cranium);

  const snout = new THREE.Mesh(
    new THREE.SphereGeometry(0.0031, 8, 8),
    darkMat,
  );
  snout.scale.set(0.88, 0.78, 1.15);
  snout.position.set(0, -0.0008, 0.0056);
  headGroup.add(snout);

  const noseTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.001, 6, 6),
    noseMat,
  );
  noseTip.position.set(0, -0.0004, 0.0088);
  headGroup.add(noseTip);

  // Two glossy eyes + splayed floppy sheep ears
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const pupilMat = new THREE.MeshBasicMaterial({ color: '#14110f' });
  for (const side of [-1, 1]) {
    const eyeWhite = new THREE.Mesh(
      new THREE.SphereGeometry(0.0009, 6, 6),
      eyeWhiteMat,
    );
    eyeWhite.position.set(side * 0.0035, 0.0008, 0.0038);
    headGroup.add(eyeWhite);

    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.00055, 6, 6),
      pupilMat,
    );
    pupil.position.set(side * 0.0039, 0.0008, 0.0041);
    headGroup.add(pupil);

    // Floppy horizontal ear
    const ear = new THREE.Mesh(
      new THREE.SphereGeometry(0.0018, 6, 6),
      darkMat,
    );
    ear.scale.set(1.65, 0.48, 0.75);
    ear.position.set(side * 0.0052, 0.0006, 0.0012);
    ear.rotation.z = -side * 0.28;
    headGroup.add(ear);
  }

  // Fluffy wool crown tuft on top of head
  const tuft = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.0038, 1),
    woolMat,
  );
  tuft.scale.set(1.1, 0.85, 1.05);
  tuft.position.set(0, 0.0036, 0.0018);
  headGroup.add(tuft);

  inner.add(headGroup);
  group.add(inner);

  return { group, headGroup, legs, tailMesh };
}

export function createPuffyCloudMesh(isSnow = false): {
  group: THREE.Group;
  rainLines: THREE.LineSegments;
  rainMat: THREE.LineBasicMaterial;
  snowPoints?: THREE.Points;
  snowMat?: THREE.PointsMaterial;
} {
  const group = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: isSnow ? '#e8f4ff' : '#ffffff',
    roughness: 0.88,
    metalness: 0.0,
    flatShading: true,
    transparent: true,
    opacity: 0.96,
  });
  const underCloudMat = new THREE.MeshStandardMaterial({
    color: isSnow ? '#cce4fc' : '#e6eef7',
    roughness: 0.92,
    metalness: 0.0,
    flatShading: true,
    transparent: true,
    opacity: 0.94,
  });

  // Upper billowy cumulus crowns + lower flat-bottomed shadowed puffs
  const puffs = [
    { x: 0, y: 0.008, z: 0, r: 0.044, sx: 1.08, sy: 0.96, sz: 1.04, under: false },
    { x: 0.034, y: -0.004, z: 0.008, r: 0.033, sx: 1.05, sy: 0.88, sz: 1.0, under: false },
    { x: -0.035, y: -0.003, z: -0.006, r: 0.035, sx: 1.06, sy: 0.9, sz: 1.0, under: false },
    { x: 0.016, y: 0.016, z: -0.018, r: 0.029, sx: 1.0, sy: 0.95, sz: 1.0, under: false },
    { x: -0.016, y: 0.014, z: 0.021, r: 0.028, sx: 1.0, sy: 0.95, sz: 1.0, under: false },
    { x: 0.024, y: -0.011, z: -0.015, r: 0.024, sx: 1.15, sy: 0.72, sz: 1.1, under: true },
    { x: -0.024, y: -0.011, z: 0.015, r: 0.025, sx: 1.15, sy: 0.72, sz: 1.1, under: true },
    { x: 0, y: -0.013, z: 0, r: 0.036, sx: 1.35, sy: 0.62, sz: 1.2, under: true },
  ];

  puffs.forEach((p) => {
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(p.r, 1),
      p.under ? underCloudMat : cloudMat,
    );
    mesh.position.set(p.x, p.y, p.z);
    mesh.scale.set(p.sx, p.sy, p.sz);
    mesh.castShadow = true;
    group.add(mesh);
  });

  // Subtle icy crystal crown on Snow Clouds
  if (isSnow) {
    const crystalMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: new THREE.Color('#bfe3ff'),
      emissiveIntensity: 0.35,
      roughness: 0.25,
    });
    for (let i = 0; i < 3; i++) {
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.0065, 0),
        crystalMat,
      );
      crystal.position.set((i - 1) * 0.022, 0.042 - Math.abs(i - 1) * 0.006, 0);
      group.add(crystal);
    }
  }

  const dropCount = 26;
  const positions = new Float32Array(dropCount * 6);
  for (let i = 0; i < dropCount; i++) {
    const angle = (i / dropCount) * Math.PI * 2;
    const rad = 0.01 + (i % 4) * 0.012;
    const x = Math.cos(angle) * rad;
    const z = Math.sin(angle) * rad;
    const yTop = -0.02 - (i % 5) * 0.045;
    const yBot = yTop - 0.042;

    positions[i * 6] = x;
    positions[i * 6 + 1] = yTop;
    positions[i * 6 + 2] = z;
    positions[i * 6 + 3] = x;
    positions[i * 6 + 4] = yBot;
    positions[i * 6 + 5] = z;
  }

  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const rainMat = new THREE.LineBasicMaterial({
    color: '#b8e3ff',
    transparent: true,
    opacity: 0.0,
  });
  const rainLines = new THREE.LineSegments(rainGeo, rainMat);
  group.add(rainLines);

  let snowPoints: THREE.Points | undefined;
  let snowMat: THREE.PointsMaterial | undefined;

  if (isSnow) {
    const flakeCount = 32;
    const flakePos = new Float32Array(flakeCount * 3);
    for (let i = 0; i < flakeCount; i++) {
      const a = (i / flakeCount) * Math.PI * 2;
      const r = 0.008 + (i % 5) * 0.011;
      flakePos[i * 3] = Math.cos(a) * r;
      flakePos[i * 3 + 1] = -0.025 - (i / flakeCount) * 0.24;
      flakePos[i * 3 + 2] = Math.sin(a) * r;
    }
    const snowGeo = new THREE.BufferGeometry();
    snowGeo.setAttribute('position', new THREE.BufferAttribute(flakePos, 3));
    snowMat = new THREE.PointsMaterial({
      color: '#ffffff',
      size: 0.016,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    snowPoints = new THREE.Points(snowGeo, snowMat);
    group.add(snowPoints);
  }

  return { group, rainLines, rainMat, snowPoints, snowMat };
}

// ---------------------------------------------------------------------------
// NEW COZY MINIATURE ELEMENTS: Sakura, Torii, Onsen, Deer, Crystal, Pavilion
// ---------------------------------------------------------------------------

/**
 * 1. 樱花树 (Sakura / Cherry Blossom Tree)
 * Gnarled dark trunk with root flares, layered soft pink blossom clouds, and drifting petals
 */
export function createSakuraTreeMesh(): {
  group: THREE.Group;
  petalParticles: THREE.Points;
} {
  const group = new THREE.Group();

  const trunkMat = new THREE.MeshStandardMaterial({
    color: '#3d2b22',
    roughness: 0.88,
    flatShading: true,
  });

  // Base root flares
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + 0.3;
    const root = new THREE.Mesh(
      new THREE.CylinderGeometry(0.002, 0.0055, 0.016, 5),
      trunkMat,
    );
    root.position.set(Math.cos(angle) * 0.008, 0.004, Math.sin(angle) * 0.008);
    root.rotation.z = Math.cos(angle) * 0.35;
    root.rotation.x = Math.sin(angle) * 0.35;
    group.add(root);
  }

  // Main gnarled trunk with natural gentle tilt
  const trunkGeo = new THREE.CylinderGeometry(0.0075, 0.011, 0.052, 6);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(0.002, 0.024, 0.001);
  trunk.rotation.z = -0.06;
  trunk.castShadow = true;
  group.add(trunk);

  // Secondary branches reaching out
  const branchConfigs = [
    { x: -0.012, y: 0.042, z: 0.006, rx: 0.2, rz: 0.6, len: 0.024, r: 0.0045 },
    { x: 0.014, y: 0.045, z: -0.008, rx: -0.3, rz: -0.5, len: 0.026, r: 0.0048 },
    { x: 0.004, y: 0.048, z: 0.012, rx: 0.5, rz: 0.1, len: 0.022, r: 0.0042 },
  ];
  branchConfigs.forEach((b) => {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(b.r * 0.6, b.r, b.len, 5),
      trunkMat,
    );
    branch.position.set(b.x, b.y, b.z);
    branch.rotation.x = b.rx;
    branch.rotation.z = b.rz;
    branch.castShadow = true;
    group.add(branch);
  });

  // Multilayered fluffy cherry blossom cloud clusters
  const blossomPuffs = [
    { x: 0, y: 0.068, z: 0, r: 0.038, col: '#fbcfe8', sx: 1.15, sy: 0.9, sz: 1.1 },
    { x: -0.022, y: 0.056, z: 0.012, r: 0.028, col: '#f472b6', sx: 1.1, sy: 0.85, sz: 1.05 },
    { x: 0.024, y: 0.058, z: -0.014, r: 0.029, col: '#f9a8d4', sx: 1.05, sy: 0.88, sz: 1.05 },
    { x: 0.008, y: 0.06, z: 0.022, r: 0.026, col: '#fbcfe8', sx: 1.0, sy: 0.8, sz: 1.1 },
    { x: -0.014, y: 0.076, z: -0.012, r: 0.027, col: '#ffb7c5', sx: 1.05, sy: 0.9, sz: 1.0 },
    { x: 0.016, y: 0.078, z: 0.008, r: 0.025, col: '#fce7f3', sx: 0.95, sy: 0.92, sz: 0.95 },
  ];

  blossomPuffs.forEach((p) => {
    const mat = new THREE.MeshStandardMaterial({
      color: p.col,
      roughness: 0.72,
      metalness: 0.02,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(p.r, 1), mat);
    mesh.position.set(p.x, p.y, p.z);
    mesh.scale.set(p.sx, p.sy, p.sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  // Falling drifting blossom petals
  const petalCount = 16;
  const petalPos = new Float32Array(petalCount * 3);
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const dist = 0.015 + (i % 4) * 0.012;
    petalPos[i * 3] = Math.cos(angle) * dist + (Math.random() - 0.5) * 0.01;
    petalPos[i * 3 + 1] = 0.012 + (i / petalCount) * 0.055;
    petalPos[i * 3 + 2] = Math.sin(angle) * dist + (Math.random() - 0.5) * 0.01;
  }
  const petalGeo = new THREE.BufferGeometry();
  petalGeo.setAttribute('position', new THREE.BufferAttribute(petalPos, 3));
  const petalMat = new THREE.PointsMaterial({
    color: '#f472b6',
    size: 0.014,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const petalParticles = new THREE.Points(petalGeo, petalMat);
  group.add(petalParticles);

  return { group, petalParticles };
}

/**
 * 2. 神社鸟居 (Torii Gate)
 * Traditional vermilion wood gate with stone plinths and stone lanterns
 */
export function createToriiMesh(): {
  group: THREE.Group;
} {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#475569',
    roughness: 0.9,
    flatShading: true,
  });
  const vermilionMat = new THREE.MeshStandardMaterial({
    color: '#dc2626',
    roughness: 0.55,
    metalness: 0.05,
    flatShading: true,
  });
  const blackCapMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.6,
    metalness: 0.1,
  });
  const goldPlaqueMat = new THREE.MeshStandardMaterial({
    color: '#1c1917',
    roughness: 0.4,
    metalness: 0.2,
  });

  // Stone foundation bases (Kamebara)
  const pillarSpacing = 0.046;
  for (const sx of [-1, 1]) {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.0085, 0.008, 6),
      stoneMat,
    );
    base.position.set(sx * pillarSpacing, 0.004, 0);
    base.castShadow = true;
    group.add(base);

    // Vermilion main pillar (Hashira) leaning very slightly inward
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0042, 0.0052, 0.076, 8),
      vermilionMat,
    );
    pillar.position.set(sx * pillarSpacing, 0.042, 0);
    pillar.rotation.z = -sx * 0.025;
    pillar.castShadow = true;
    group.add(pillar);

    // Black ring at base of pillar (Nemaki)
    const nemaki = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0054, 0.0055, 0.012, 8),
      blackCapMat,
    );
    nemaki.position.set(sx * pillarSpacing, 0.012, 0);
    group.add(nemaki);
  }

  // Nuki (horizontal cross-tie beam below top)
  const nuki = new THREE.Mesh(
    new THREE.BoxGeometry(0.118, 0.0048, 0.006),
    vermilionMat,
  );
  nuki.position.set(0, 0.062, 0);
  nuki.castShadow = true;
  group.add(nuki);

  // Shimaki (second horizontal beam directly beneath Kasagi)
  const shimaki = new THREE.Mesh(
    new THREE.BoxGeometry(0.126, 0.0055, 0.0075),
    vermilionMat,
  );
  shimaki.position.set(0, 0.076, 0);
  shimaki.castShadow = true;
  group.add(shimaki);

  // Kasagi (top curved lintel beam) with slightly upturned winged tips
  const kasagi = new THREE.Mesh(
    new THREE.BoxGeometry(0.138, 0.0068, 0.009),
    blackCapMat,
  );
  kasagi.position.set(0, 0.082, 0);
  kasagi.castShadow = true;
  group.add(kasagi);

  // Gakuzuka (central tablet / plaque)
  const plaque = new THREE.Mesh(
    new THREE.BoxGeometry(0.009, 0.012, 0.004),
    goldPlaqueMat,
  );
  plaque.position.set(0, 0.069, 0.0035);
  group.add(plaque);

  // Flanking miniature stone Toro lanterns
  const lanternMat = new THREE.MeshStandardMaterial({
    color: '#64748b',
    roughness: 0.85,
    flatShading: true,
  });
  const glowWindowMat = new THREE.MeshStandardMaterial({
    color: '#fef08a',
    emissive: new THREE.Color('#f59e0b'),
    emissiveIntensity: 0.65,
    roughness: 0.3,
  });

  for (const side of [-1, 1]) {
    const lx = side * 0.074;
    const lz = 0.018;

    // Stone base + pedestal
    const lBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.0075, 0.005, 6),
      lanternMat,
    );
    lBase.position.set(lx, 0.0025, lz);
    group.add(lBase);

    const lShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.0035, 0.016, 6),
      lanternMat,
    );
    lShaft.position.set(lx, 0.012, lz);
    group.add(lShaft);

    // Light chamber (Hibukuro)
    const lChamber = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.008, 0.008),
      glowWindowMat,
    );
    lChamber.position.set(lx, 0.023, lz);
    group.add(lChamber);

    // Hexagonal stone roof cap (Kasa) + jewel finial
    const lRoof = new THREE.Mesh(
      new THREE.ConeGeometry(0.009, 0.006, 6),
      lanternMat,
    );
    lRoof.position.set(lx, 0.029, lz);
    group.add(lRoof);
  }

  return { group };
}

/**
 * 3. 露天温泉 (Hot Spring / Onsen)
 * Stacked river stones, steaming mineral thermal pool, bamboo spout, and rising vapor
 */
export function createHotSpringMesh(): {
  group: THREE.Group;
  steamParticles: THREE.Points;
} {
  const group = new THREE.Group();

  const stoneMat1 = new THREE.MeshStandardMaterial({
    color: '#64748b',
    roughness: 0.9,
    flatShading: true,
  });
  const stoneMat2 = new THREE.MeshStandardMaterial({
    color: '#475569',
    roughness: 0.92,
    flatShading: true,
  });
  const bambooMat = new THREE.MeshStandardMaterial({
    color: '#84cc16',
    roughness: 0.65,
  });
  const woodTubMat = new THREE.MeshStandardMaterial({
    color: '#b45309',
    roughness: 0.75,
  });

  // Natural boulder ring (12 irregular faceted stones around pool rim)
  const rimRadius = 0.046;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + (i % 3) * 0.1;
    const rScale = 0.009 + (i % 4) * 0.0025;
    const stone = new THREE.Mesh(
      new THREE.IcosahedronGeometry(rScale, 0),
      i % 2 === 0 ? stoneMat1 : stoneMat2,
    );
    stone.position.set(
      Math.cos(angle) * rimRadius,
      0.006 + (i % 3) * 0.002,
      Math.sin(angle) * rimRadius,
    );
    stone.scale.set(1.2, 0.85, 1.1);
    stone.castShadow = true;
    stone.receiveShadow = true;
    group.add(stone);
  }

  // Turquoise steaming thermal pool water
  const waterMat = new THREE.MeshStandardMaterial({
    color: '#22d3ee',
    emissive: new THREE.Color('#0891b2'),
    emissiveIntensity: 0.25,
    roughness: 0.12,
    metalness: 0.15,
    transparent: true,
    opacity: 0.88,
  });
  const poolWater = new THREE.Mesh(
    new THREE.CylinderGeometry(rimRadius * 0.88, rimRadius * 0.85, 0.006, 16),
    waterMat,
  );
  poolWater.position.y = 0.004;
  group.add(poolWater);

  // Concentric ripple rings on water
  const rippleMat = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.45,
  });
  const ripple1 = new THREE.Mesh(new THREE.RingGeometry(0.012, 0.015, 16), rippleMat);
  ripple1.rotation.x = -Math.PI / 2;
  ripple1.position.y = 0.0075;
  group.add(ripple1);

  // Bamboo water spout (Shishi-odoshi) pouring hot spring water
  const spoutPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.003, 0.0035, 0.024, 6),
    bambooMat,
  );
  spoutPost.position.set(-0.038, 0.012, -0.018);
  spoutPost.rotation.z = -0.2;
  group.add(spoutPost);

  const spoutTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0022, 0.0026, 0.028, 6),
    bambooMat,
  );
  spoutTube.position.set(-0.028, 0.019, -0.018);
  spoutTube.rotation.z = Math.PI / 3;
  group.add(spoutTube);

  // Cedar bathing tub (Oke) on stone ledge
  const tub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0065, 0.0055, 0.006, 8),
    woodTubMat,
  );
  tub.position.set(0.032, 0.011, 0.034);
  tub.castShadow = true;
  group.add(tub);

  // Rising steam puffs particle system
  const steamCount = 18;
  const steamPos = new Float32Array(steamCount * 3);
  for (let i = 0; i < steamCount; i++) {
    const angle = (i / steamCount) * Math.PI * 2;
    const r = (i % 3) * 0.011;
    steamPos[i * 3] = Math.cos(angle) * r;
    steamPos[i * 3 + 1] = 0.014 + (i / steamCount) * 0.038;
    steamPos[i * 3 + 2] = Math.sin(angle) * r;
  }
  const steamGeo = new THREE.BufferGeometry();
  steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
  const steamMat = new THREE.PointsMaterial({
    color: '#e0f2fe',
    size: 0.018,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const steamParticles = new THREE.Points(steamGeo, steamMat);
  group.add(steamParticles);

  return { group, steamParticles };
}

/**
 * 4. 森林灵鹿 (Forest Deer / Fawn)
 * Articulated fawn in chestnut brown with dappled spots, antlers, and walking legs
 */
export function createDeerMesh(): {
  group: THREE.Group;
  headGroup: THREE.Group;
  legs: THREE.Group[];
  tailMesh: THREE.Object3D;
} {
  const group = new THREE.Group();
  const inner = new THREE.Group();

  const coatMat = new THREE.MeshStandardMaterial({
    color: '#b45309', // warm chestnut
    roughness: 0.78,
    flatShading: true,
  });
  const underbellyMat = new THREE.MeshStandardMaterial({
    color: '#fef3c7',
    roughness: 0.82,
    flatShading: true,
  });
  const spotMat = new THREE.MeshBasicMaterial({
    color: '#ffffff',
  });
  const hoofMat = new THREE.MeshStandardMaterial({
    color: '#292524',
    roughness: 0.7,
  });
  const antlerMat = new THREE.MeshStandardMaterial({
    color: '#f5ebe0',
    roughness: 0.68,
    flatShading: true,
  });

  // Torso / Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.013, 0.026),
    coatMat,
  );
  body.position.set(0, 0.021, 0);
  body.castShadow = true;
  inner.add(body);

  // Underbelly patch
  const belly = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.003, 0.022),
    underbellyMat,
  );
  belly.position.set(0, 0.014, 0);
  inner.add(belly);

  // Dappled white spots on deer flanks
  for (const side of [-1, 1]) {
    for (let r = 0; r < 3; r++) {
      const spot = new THREE.Mesh(
        new THREE.SphereGeometry(0.0012, 4, 4),
        spotMat,
      );
      spot.position.set(side * 0.0072, 0.022 + (r % 2) * 0.0028, -0.006 + r * 0.006);
      spot.scale.set(0.6, 1.0, 1.2);
      inner.add(spot);
    }
  }

  // Cute perky tail
  const tailMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.0038, 0.005, 0.008),
    coatMat,
  );
  tailMesh.position.set(0, 0.026, -0.014);
  tailMesh.rotation.x = -0.55;
  inner.add(tailMesh);

  // Four slender legs with dark hooves
  const legPositions = [
    { x: -0.0052, z: 0.0085 },
    { x: 0.0052, z: 0.0085 },
    { x: -0.0052, z: -0.0085 },
    { x: 0.0052, z: -0.0085 },
  ];
  const legs: THREE.Group[] = [];

  legPositions.forEach((pos) => {
    const legG = new THREE.Group();
    legG.position.set(pos.x, 0.016, pos.z);

    const legUpper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0016, 0.0018, 0.016, 5),
      coatMat,
    );
    legUpper.position.y = -0.008;
    legUpper.castShadow = true;
    legG.add(legUpper);

    const hoof = new THREE.Mesh(
      new THREE.BoxGeometry(0.0028, 0.0032, 0.0036),
      hoofMat,
    );
    hoof.position.set(0, -0.015, 0.0005);
    legG.add(hoof);

    inner.add(legG);
    legs.push(legG);
  });

  // Head and graceful neck group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.024, 0.012);

  // Elongated graceful neck
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0032, 0.0042, 0.018, 5),
    coatMat,
  );
  neck.position.set(0, 0.008, 0.004);
  neck.rotation.x = 0.52;
  headGroup.add(neck);

  // Deer head
  const headMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.0085, 0.008, 0.012),
    coatMat,
  );
  headMesh.position.set(0, 0.017, 0.01);
  headGroup.add(headMesh);

  // Snout
  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.0055, 0.005, 0.007),
    underbellyMat,
  );
  snout.position.set(0, 0.015, 0.017);
  headGroup.add(snout);

  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.0012, 4, 4),
    hoofMat,
  );
  nose.position.set(0, 0.0165, 0.0205);
  headGroup.add(nose);

  // Glossy dark eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#1c1917' });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.0011, 4, 4), eyeMat);
    eye.position.set(side * 0.0044, 0.018, 0.012);
    headGroup.add(eye);

    // Cute pointed ears
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.0024, 0.0075, 4),
      coatMat,
    );
    ear.position.set(side * 0.0048, 0.023, 0.007);
    ear.rotation.z = -side * 0.55;
    ear.rotation.x = -0.3;
    headGroup.add(ear);

    // Branching cream antlers
    const antlerBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0009, 0.0012, 0.014, 4),
      antlerMat,
    );
    antlerBase.position.set(side * 0.0028, 0.026, 0.007);
    antlerBase.rotation.z = -side * 0.35;
    antlerBase.rotation.x = -0.2;
    headGroup.add(antlerBase);

    // Antler tines
    const tine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0007, 0.0009, 0.007, 4),
      antlerMat,
    );
    tine.position.set(side * 0.0048, 0.03, 0.009);
    tine.rotation.z = -side * 0.75;
    headGroup.add(tine);
  }

  inner.add(headGroup);
  group.add(inner);

  return { group, headGroup, legs, tailMesh };
}

/**
 * 5. 秘境水晶 (Crystal Gem Cluster)
 * Translucent hexagonal prism crystals with pulsing glowing emissive core and point light
 */
export function createCrystalClusterMesh(): {
  group: THREE.Group;
  crystalMat: THREE.MeshStandardMaterial;
  crystalLight: THREE.PointLight;
} {
  const group = new THREE.Group();

  const rockMat = new THREE.MeshStandardMaterial({
    color: '#334155',
    roughness: 0.94,
    flatShading: true,
  });

  // Rocky geode crag cluster base
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const r = 0.015 + (i % 2) * 0.008;
    const rock = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.014 + (i % 3) * 0.004, 0),
      rockMat,
    );
    rock.position.set(Math.cos(angle) * r, 0.005, Math.sin(angle) * r);
    rock.scale.set(1.2, 0.6, 1.1);
    rock.castShadow = true;
    group.add(rock);
  }

  // Glowing translucent crystal material
  const crystalMat = new THREE.MeshStandardMaterial({
    color: '#c084fc', // purple / violet
    emissive: new THREE.Color('#9333ea'),
    emissiveIntensity: 0.45,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.88,
  });

  const cyanCrystalMat = new THREE.MeshStandardMaterial({
    color: '#38bdf8', // bright cyan
    emissive: new THREE.Color('#0284c7'),
    emissiveIntensity: 0.5,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.88,
  });

  // 7 hexagonal prism crystals of varied heights and orientations
  const crystalConfigs = [
    { x: 0, y: 0.026, z: 0, h: 0.052, r: 0.0075, rx: 0.05, rz: -0.05, cyan: false },
    { x: -0.015, y: 0.021, z: 0.008, h: 0.042, r: 0.0062, rx: 0.22, rz: 0.35, cyan: true },
    { x: 0.014, y: 0.023, z: -0.006, h: 0.045, r: 0.0065, rx: -0.25, rz: -0.3, cyan: false },
    { x: 0.006, y: 0.018, z: 0.015, h: 0.035, r: 0.0055, rx: 0.35, rz: -0.15, cyan: true },
    { x: -0.008, y: 0.016, z: -0.014, h: 0.032, r: 0.005, rx: -0.3, rz: 0.2, cyan: false },
    { x: 0.019, y: 0.013, z: 0.011, h: 0.026, r: 0.0042, rx: 0.28, rz: -0.4, cyan: false },
    { x: -0.018, y: 0.012, z: -0.012, h: 0.024, r: 0.004, rx: -0.35, rz: 0.45, cyan: true },
  ];

  crystalConfigs.forEach((c) => {
    // Hexagonal crystal body (cylinder with 6 segments) + pointed pyramid cap
    const cMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(c.r, c.r * 1.1, c.h, 6),
      c.cyan ? cyanCrystalMat : crystalMat,
    );
    cMesh.position.set(c.x, c.y, c.z);
    cMesh.rotation.x = c.rx;
    cMesh.rotation.z = c.rz;
    cMesh.castShadow = true;
    group.add(cMesh);

    const capMesh = new THREE.Mesh(
      new THREE.ConeGeometry(c.r, c.r * 1.8, 6),
      c.cyan ? cyanCrystalMat : crystalMat,
    );
    capMesh.position.set(0, c.h / 2 + (c.r * 1.8) / 2, 0);
    cMesh.add(capMesh);
  });

  // Soft purple night glow point light
  const crystalLight = new THREE.PointLight('#a855f7', 0.8, 0.28);
  crystalLight.position.set(0, 0.035, 0);
  group.add(crystalLight);

  return { group, crystalMat, crystalLight };
}

/**
 * 6. 观景凉亭 (Pavilion)
 * Traditional hexagonal timber pavilion with stone steps, columns, upturned pagoda roof, and glowing lantern
 */
export function createPavilionMesh(): {
  group: THREE.Group;
  pavilionLanternLight: THREE.PointLight;
} {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#64748b',
    roughness: 0.88,
    flatShading: true,
  });
  const woodDeckMat = new THREE.MeshStandardMaterial({
    color: '#854d0e',
    roughness: 0.72,
    flatShading: true,
  });
  const redPillarMat = new THREE.MeshStandardMaterial({
    color: '#b91c1c',
    roughness: 0.55,
  });
  const roofTileMat = new THREE.MeshStandardMaterial({
    color: '#15803d', // emerald jade glazed tile
    roughness: 0.45,
    metalness: 0.1,
    flatShading: true,
  });
  const goldFinialMat = new THREE.MeshStandardMaterial({
    color: '#facc15',
    roughness: 0.3,
    metalness: 0.5,
  });

  // Raised stone foundation platform
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.046, 0.009, 6),
    stoneMat,
  );
  plinth.position.y = 0.0045;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // Polished timber deck
  const deck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.041, 0.042, 0.004, 6),
    woodDeckMat,
  );
  deck.position.y = 0.01;
  group.add(deck);

  // Six red lacquer pillars around perimeter
  const colRadius = 0.033;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const px = Math.cos(angle) * colRadius;
    const pz = Math.sin(angle) * colRadius;

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.0034, 0.048, 8),
      redPillarMat,
    );
    pillar.position.set(px, 0.034, pz);
    pillar.castShadow = true;
    group.add(pillar);

    // Timber railing between pillars (skip 1 side for entrance)
    if (i !== 0) {
      const nextAngle = ((i + 1) / 6) * Math.PI * 2;
      const midX = (px + Math.cos(nextAngle) * colRadius) / 2;
      const midZ = (pz + Math.sin(nextAngle) * colRadius) / 2;
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.003, 0.0025),
        woodDeckMat,
      );
      rail.position.set(midX, 0.022, midZ);
      rail.rotation.y = -angle - Math.PI / 6;
      group.add(rail);
    }
  }

  // Front stone doorstep
  const step = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.005, 0.012),
    stoneMat,
  );
  step.position.set(colRadius + 0.008, 0.0035, 0);
  group.add(step);

  // Flared hexagonal roof with upturned eaves
  const roofLower = new THREE.Mesh(
    new THREE.ConeGeometry(0.056, 0.022, 6),
    roofTileMat,
  );
  roofLower.position.y = 0.068;
  roofLower.castShadow = true;
  group.add(roofLower);

  // Second tier cap
  const roofUpper = new THREE.Mesh(
    new THREE.ConeGeometry(0.032, 0.016, 6),
    roofTileMat,
  );
  roofUpper.position.y = 0.082;
  roofUpper.castShadow = true;
  group.add(roofUpper);

  // Golden lotus treasure finial
  const finial = new THREE.Mesh(
    new THREE.SphereGeometry(0.0048, 6, 6),
    goldFinialMat,
  );
  finial.position.y = 0.093;
  group.add(finial);

  // Hanging interior octagonal lantern
  const lanternMat = new THREE.MeshStandardMaterial({
    color: '#fef08a',
    emissive: new THREE.Color('#f59e0b'),
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });
  const lantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0045, 0.0045, 0.008, 6),
    lanternMat,
  );
  lantern.position.set(0, 0.048, 0);
  group.add(lantern);

  const pavilionLanternLight = new THREE.PointLight('#f59e0b', 0.6, 0.22);
  pavilionLanternLight.position.set(0, 0.046, 0);
  group.add(pavilionLanternLight);

  return { group, pavilionLanternLight };
}

