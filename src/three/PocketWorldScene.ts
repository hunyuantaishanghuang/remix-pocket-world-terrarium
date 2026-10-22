import * as THREE from 'three';
import { CameraViewId, TimeMode, ToolId, WorldState } from '../types/world';
import { soundManager } from '../utils/audio';
import { createRoomEnvTexture } from '../utils/textures';
import {
  BalloonEntity,
  CloudEntity,
  createBeehiveMesh,
  createCampfireMesh,
  createCrystalClusterMesh,
  createDeerMesh,
  createFlowerClusterMesh,
  createHotAirBalloonMesh,
  createHotSpringMesh,
  createLanternPostMesh,
  createOakTreeMesh,
  createPalmTreeMesh,
  createPastelHouseMesh,
  createPavilionMesh,
  createPineTreeMesh,
  createPuffyCloudMesh,
  createRainbowArchMesh,
  createSailboatMesh,
  createSakuraTreeMesh,
  createSheepMesh,
  createShootingStarMesh,
  createSteppingPathMesh,
  createStoneWatchtowerMesh,
  createStoneWellMesh,
  createStripedLighthouseMesh,
  createSwanDuckFlockMesh,
  createToriiMesh,
  createVillagerMesh,
  createWhiteWindmillMesh,
  createWoodenDockMesh,
  createWoodenFenceMesh,
  DeerEntity,
  DuckEntity,
  PlacedObjectEntity,
  PlacedObjectType,
  SailboatEntity,
  SheepEntity,
  ShootingStarEntity,
  VillagerEntity,
} from './MiniatureObjects';
import { createPlanetTerrain } from './PlanetTerrain';
import { createRoomEnvironment } from './RoomEnvironment';

const UP_VEC = new THREE.Vector3(0, 1, 0);

interface SparkleBurst {
  points: THREE.Points;
  velocities: THREE.Vector3[];
  age: number;
  maxAge: number;
}

export class PocketWorldController {
  private container: HTMLElement;
  private onStateChange: (updater: (prev: WorldState) => WorldState) => void;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animFrameId: number | null = null;
  private clock = new THREE.Clock();

  private roomEnv!: ReturnType<typeof createRoomEnvironment>;
  private planetRoot!: THREE.Group;
  private terrain!: ReturnType<typeof createPlanetTerrain>;
  private objectsGroup!: THREE.Group;
  private inhabitantsGroup!: THREE.Group;
  private atmosphereGroup!: THREE.Group;
  private effectsGroup!: THREE.Group;

  // Celestial bodies & lighting
  private roomWindowLight!: THREE.DirectionalLight;
  private roomAmbientLight!: THREE.AmbientLight;
  private roomHemiLight!: THREE.HemisphereLight;
  private sunGroup!: THREE.Group;
  private sunLight!: THREE.DirectionalLight;
  private moonGroup!: THREE.Group;
  private moonLight!: THREE.DirectionalLight;
  private firefliesPoints!: THREE.Points;
  private firefliesMat!: THREE.PointsMaterial;
  private firefliesBasePositions: THREE.Vector3[] = [];

  // Dynamic Weather & Atmospheric Particles (Rain, Snow, Stardust, Sakura Petals, Swirling Leaves)
  private dynamicWeatherPoints!: THREE.Points;
  private dynamicWeatherMat!: THREE.PointsMaterial;
  private dynamicWeatherPositions!: Float32Array;
  private dynamicWeatherColors!: Float32Array;
  private dynamicWeatherCount = 140;

  // Entities
  private placedObjects: PlacedObjectEntity[] = [];
  private villagers: VillagerEntity[] = [];
  private sheepList: SheepEntity[] = [];
  private deerList: DeerEntity[] = [];
  private clouds: CloudEntity[] = [];
  private sailboats: SailboatEntity[] = [];
  private ducks: DuckEntity[] = [];
  private balloons: BalloonEntity[] = [];
  private shootingStars: ShootingStarEntity[] = [];
  private sparkles: SparkleBurst[] = [];

  private wellDirection = new THREE.Vector3(-0.16, 0.22, 0.96).normalize();
  private pastureCenter = new THREE.Vector3(-0.20, -0.15, 0.97).normalize();
  private pastureRadius = 0.098;
  private houseCounter = 0;
  private villagerCounter = 0;
  private boatCounter = 0;
  private balloonCounter = 0;
  private shootingStarGazeTimer = 0;

  // Hover indicator on spherical surface
  private cursorRing!: THREE.Mesh;

  // Interaction & Inertia state
  private activeTool: ToolId = 'tree';
  private activeView: CameraViewId = 'orb';
  private timeMode: TimeMode = 'auto';
  private timeOfDay = 0.24; // Starts in warm sunlit afternoon
  private dayCount = 1;

  private isPointerDown = false;
  private isDraggingSpin = false;
  private pointerDownPos = new THREE.Vector2();
  private lastPointerPos = new THREE.Vector2();
  private angularVelocity = new THREE.Vector2(0.0, 0.0);

  // Initial 3-second 360-degree intro spin state
  private introSpinActive = true;
  private introSpinElapsed = 0;

  // Camera choreography
  private camCurrentPos = new THREE.Vector3(-1.12, 0.78, 4.35);
  private camCurrentLook = new THREE.Vector3(0.08, -0.22, 0.0);
  private camTargetPos = new THREE.Vector3(-1.12, 0.78, 4.35);
  private camTargetLook = new THREE.Vector3(0.08, -0.22, 0.0);

  // 30-Second Choreographed Demo Tour state
  private tourActive = false;
  private tourElapsed = 0;
  private tourStartTimeMs = 0;
  private lastReportedTourRemaining = -1;
  private tourStepTriggered = new Set<number>();
  private tourCursorDir = new THREE.Vector3(-0.16, 0.22, 0.96).normalize();
  private tourSpawnedCleanups: (() => void)[] = [];

  constructor(
    container: HTMLElement,
    onStateChange: (updater: (prev: WorldState) => WorldState) => void,
  ) {
    this.container = container;
    this.onStateChange = onStateChange;
    this.initScene();
    this.populateInitialWorld();
    this.bindEvents();
    this.syncWorldStats();
    this.animate();
  }

  private initScene() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    // Camera framed slightly above and to the left so the 30cm orb (3.0 units diameter)
    // fills approximately 60% of the viewport height.
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.08, 60);
    this.applyCameraPreset('orb', true);

    const envMap = createRoomEnvTexture();
    this.scene.environment = envMap;

    // 1. Domestic Room Environment (Windowsill, Linen Cloth, Succulent, Walnut Stand, Brass Collar, Glass Orb)
    this.roomEnv = createRoomEnvironment(envMap);
    this.scene.add(this.roomEnv.group);

    // 2. Room Lighting (Warm evening window light + subdued interior fill)
    this.roomAmbientLight = new THREE.AmbientLight('#f2e6dc', 0.55);
    this.scene.add(this.roomAmbientLight);

    this.roomHemiLight = new THREE.HemisphereLight('#dcd0f0', '#5e4b3e', 0.52);
    this.scene.add(this.roomHemiLight);

    this.roomWindowLight = new THREE.DirectionalLight('#ffdfb8', 1.35);
    this.roomWindowLight.position.set(-4.8, 4.6, 3.8);
    this.roomWindowLight.castShadow = true;
    this.roomWindowLight.shadow.mapSize.set(2048, 2048);
    this.roomWindowLight.shadow.camera.near = 1.0;
    this.roomWindowLight.shadow.camera.far = 15.0;
    const d = 3.2;
    this.roomWindowLight.shadow.camera.left = -d;
    this.roomWindowLight.shadow.camera.right = d;
    this.roomWindowLight.shadow.camera.top = d;
    this.roomWindowLight.shadow.camera.bottom = -d;
    this.roomWindowLight.shadow.bias = -0.0005;
    this.scene.add(this.roomWindowLight);

    // 3. Suspended Faceted Planet Root (Centered inside the glass orb at (0,0,0))
    this.planetRoot = new THREE.Group();
    this.scene.add(this.planetRoot);

    this.terrain = createPlanetTerrain();
    this.planetRoot.add(this.terrain.group);

    this.objectsGroup = new THREE.Group();
    this.planetRoot.add(this.objectsGroup);

    this.inhabitantsGroup = new THREE.Group();
    this.planetRoot.add(this.inhabitantsGroup);

    this.atmosphereGroup = new THREE.Group();
    this.planetRoot.add(this.atmosphereGroup);

    this.effectsGroup = new THREE.Group();
    this.planetRoot.add(this.effectsGroup);

    // 4. Celestial Bodies (Small glowing Sun & Pale Moon on opposing sides of curved path)
    this.initCelestialBodies();

    // 5. Drifting Fireflies inside the glass orb (for Twilight / Night mode)
    this.initFireflies();

    // 5.5 Dynamic Interactive Weather & Foliage Particles (Rain, Snow, Stardust, Sakura Petals, Swirling Leaves)
    this.initDynamicWeather();

    // 6. Surface Placement Cursor Ring
    const ringGeo = new THREE.RingGeometry(0.028, 0.036, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#fff8d6',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    this.cursorRing = new THREE.Mesh(ringGeo, ringMat);
    this.cursorRing.visible = false;
    this.planetRoot.add(this.cursorRing);
  }

  private initCelestialBodies() {
    // 1. Radiant Storybook Sun with Sculpted Sunbeam Crown & Astrolabe Ring
    this.sunGroup = new THREE.Group();

    const sunCore = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.055, 2),
      new THREE.MeshBasicMaterial({ color: '#fff5b8' }),
    );
    this.sunGroup.add(sunCore);

    // Inner & outer rotating sunbeam crowns (12 alternating long/short sculpted rays)
    const rayCrown = new THREE.Group();
    rayCrown.name = 'sunRayCrown';
    const rayPrimaryMat = new THREE.MeshBasicMaterial({ color: '#ffd45c' });
    const raySecondaryMat = new THREE.MeshBasicMaterial({ color: '#ffae36' });

    const rayCount = 12;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const isLong = i % 2 === 0;
      const rayLen = isLong ? 0.036 : 0.024;
      const rayRad = isLong ? 0.011 : 0.0085;
      const rayGeo = new THREE.ConeGeometry(rayRad, rayLen, 4);
      const ray = new THREE.Mesh(
        rayGeo,
        isLong ? rayPrimaryMat : raySecondaryMat,
      );
      const dist = 0.052 + rayLen * 0.45;
      ray.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist, 0);
      ray.rotation.z = angle - Math.PI / 2;
      rayCrown.add(ray);
    }
    this.sunGroup.add(rayCrown);

    // Delicate tilted golden astrolabe ring around the Sun
    const sunRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.086, 0.0016, 8, 36),
      new THREE.MeshBasicMaterial({
        color: '#ffe28a',
        transparent: true,
        opacity: 0.65,
      }),
    );
    sunRing.name = 'sunAstrolabeRing';
    sunRing.rotation.set(0.65, 0.35, 0);
    this.sunGroup.add(sunRing);

    const sunHalo = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.098, 2),
      new THREE.MeshBasicMaterial({
        color: '#ffbe4f',
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      }),
    );
    this.sunGroup.add(sunHalo);
    this.planetRoot.add(this.sunGroup);

    // Little sun directional light casting moving shadows across the planet
    this.sunLight = new THREE.DirectionalLight('#fff0c2', 1.9);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.near = 0.2;
    this.sunLight.shadow.camera.far = 3.5;
    const sd = 1.05;
    this.sunLight.shadow.camera.left = -sd;
    this.sunLight.shadow.camera.right = sd;
    this.sunLight.shadow.camera.top = sd;
    this.sunLight.shadow.camera.bottom = -sd;
    this.sunLight.shadow.bias = -0.0008;
    this.planetRoot.add(this.sunLight);
    this.planetRoot.add(this.sunLight.target);

    // 2. Detailed Cratered Moon with Lunar Mare Basins & Companion Starlets
    this.moonGroup = new THREE.Group();
    const moonMat = new THREE.MeshStandardMaterial({
      color: '#e8effc',
      emissive: new THREE.Color('#8eabdc'),
      emissiveIntensity: 0.55,
      roughness: 0.72,
      flatShading: true,
    });
    const craterMat = new THREE.MeshStandardMaterial({
      color: '#bccbe6',
      emissive: new THREE.Color('#6b88b8'),
      emissiveIntensity: 0.45,
      roughness: 0.82,
      flatShading: true,
    });

    const moonBody = new THREE.Group();
    moonBody.name = 'moonBody';

    const moonMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.052, 2),
      moonMat,
    );
    moonBody.add(moonMesh);

    // Sculpted rimmed craters & lunar basins on the Moon surface
    const craterSpecs: [number, number, number, number][] = [
      [0.35, 0.25, 0.9, 0.013],
      [-0.48, 0.38, 0.79, 0.0105],
      [0.18, -0.52, 0.83, 0.0115],
      [-0.65, -0.25, 0.71, 0.009],
      [0.58, 0.42, -0.69, 0.012],
      [-0.25, 0.68, -0.69, 0.01],
      [0.12, -0.74, -0.66, 0.011],
    ];
    for (const [cx, cy, cz, cr] of craterSpecs) {
      const dir = new THREE.Vector3(cx, cy, cz).normalize();
      const craterGroup = new THREE.Group();
      craterGroup.position.copy(dir.clone().multiplyScalar(0.0505));
      craterGroup.lookAt(dir.clone().multiplyScalar(0.15));

      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(cr, cr * 0.26, 6, 12),
        craterMat,
      );
      const basin = new THREE.Mesh(
        new THREE.CircleGeometry(cr * 0.85, 10),
        craterMat,
      );
      basin.position.z = -0.0008;
      craterGroup.add(rim, basin);
      moonBody.add(craterGroup);
    }
    this.moonGroup.add(moonBody);

    // Orbiting silver companion starlets around the Moon
    const starletGroup = new THREE.Group();
    starletGroup.name = 'moonStarlets';
    const starletMat = new THREE.MeshBasicMaterial({ color: '#eef5ff' });
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const starlet = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.0055 - i * 0.001, 0),
        starletMat,
      );
      starlet.position.set(
        Math.cos(angle) * 0.078,
        Math.sin(angle * 1.5) * 0.018,
        Math.sin(angle) * 0.078,
      );
      starletGroup.add(starlet);
    }
    this.moonGroup.add(starletGroup);

    const moonHalo = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.076, 2),
      new THREE.MeshBasicMaterial({
        color: '#b5d0ff',
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      }),
    );
    this.moonGroup.add(moonHalo);
    this.planetRoot.add(this.moonGroup);

    // Moon directional light to illuminate silver edges on terrain at night
    this.moonLight = new THREE.DirectionalLight('#b8d4ff', 0.0);
    this.planetRoot.add(this.moonLight);
    this.planetRoot.add(this.moonLight.target);
  }

  private initFireflies() {
    const count = 38;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Distributed in the atmosphere shell between planet (0.82) and inner glass orb (1.36)
      const dir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5,
      ).normalize();
      const r = 0.84 + Math.random() * 0.48;
      const pos = dir.multiplyScalar(r);
      this.firefliesBasePositions.push(pos);
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Soft circular glow sprite texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 248, 150, 1)');
    grad.addColorStop(0.4, 'rgba(215, 245, 110, 0.65)');
    grad.addColorStop(1, 'rgba(180, 230, 80, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const spriteTex = new THREE.CanvasTexture(canvas);

    this.firefliesMat = new THREE.PointsMaterial({
      map: spriteTex,
      size: 0.065,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.firefliesPoints = new THREE.Points(geo, this.firefliesMat);
    this.planetRoot.add(this.firefliesPoints);
  }

  private initDynamicWeather() {
    const count = this.dynamicWeatherCount;
    this.dynamicWeatherPositions = new Float32Array(count * 3);
    this.dynamicWeatherColors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 0.84 + Math.cbrt(Math.random()) * 0.48;
      const sinPhi = Math.sin(phi);
      const x = r * sinPhi * Math.cos(theta);
      const y = r * sinPhi * Math.sin(theta);
      const z = r * Math.cos(phi);

      this.dynamicWeatherPositions[i * 3] = x;
      this.dynamicWeatherPositions[i * 3 + 1] = y;
      this.dynamicWeatherPositions[i * 3 + 2] = z;

      this.dynamicWeatherColors[i * 3] = 0.65;
      this.dynamicWeatherColors[i * 3 + 1] = 0.82;
      this.dynamicWeatherColors[i * 3 + 2] = 1.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.dynamicWeatherPositions, 3),
    );
    geo.setAttribute(
      'color',
      new THREE.BufferAttribute(this.dynamicWeatherColors, 3),
    );

    // Smooth soft sprite for weather particles
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const spriteTex = new THREE.CanvasTexture(canvas);

    this.dynamicWeatherMat = new THREE.PointsMaterial({
      map: spriteTex,
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.dynamicWeatherPoints = new THREE.Points(geo, this.dynamicWeatherMat);
    this.planetRoot.add(this.dynamicWeatherPoints);
  }

  private populateInitialWorld() {
    // 1. Stone Well at the center of "Little Meadow"
    this.placeStaticObject('well', this.wellDirection, 0, false, false);

    // 2. Ten Pastel Houses distributed across the globe in four distinct neighborhoods
    const westSquare = new THREE.Vector3(-0.80, 0.24, 0.54).normalize();
    const eastBackSquare = new THREE.Vector3(0.54, -0.24, -0.80).normalize();
    const southSquare = new THREE.Vector3(-0.04, -0.66, -0.75).normalize();

    const houseConfigs: { dir: THREE.Vector3; hub: THREE.Vector3 }[] = [
      // Front Meadow Village (+Z) — spaced generously around the stone well
      { dir: new THREE.Vector3(-0.36, 0.30, 0.88).normalize(), hub: this.wellDirection },
      { dir: new THREE.Vector3(-0.01, 0.38, 0.92).normalize(), hub: this.wellDirection },
      { dir: new THREE.Vector3(-0.38, 0.08, 0.92).normalize(), hub: this.wellDirection },
      { dir: new THREE.Vector3(0.08, 0.12, 0.99).normalize(), hub: this.wellDirection },
      // Western Sunset Ridge (-X)
      { dir: new THREE.Vector3(-0.74, 0.36, 0.56).normalize(), hub: westSquare },
      { dir: new THREE.Vector3(-0.88, 0.16, 0.44).normalize(), hub: westSquare },
      // Back-Eastern Highland Hamlet (+X / -Z)
      { dir: new THREE.Vector3(0.64, -0.14, -0.75).normalize(), hub: eastBackSquare },
      { dir: new THREE.Vector3(0.38, -0.36, -0.85).normalize(), hub: eastBackSquare },
      { dir: new THREE.Vector3(0.82, 0.14, -0.55).normalize(), hub: eastBackSquare },
      // Southern Valley Overlook (-Y / -Z)
      { dir: new THREE.Vector3(-0.14, -0.64, -0.76).normalize(), hub: southSquare },
    ];

    const initialHouses: PlacedObjectEntity[] = [];
    houseConfigs.forEach(({ dir, hub }, idx) => {
      const houseYaw = this.computeYawFacingTarget(dir, hub);
      const hObj = this.placeStaticObject('house', dir, houseYaw, true, false);
      initialHouses.push(hObj);

      // Add stepping stone path outside each cottage's front doorstep toward its neighborhood square
      const doorDir = this.getBuildingEntranceDir(hObj, 0);
      const midDir = doorDir.clone().lerp(hub, 0.42).normalize();
      const pathYaw = this.computeYawFacingTarget(midDir, hub);
      this.placeStaticObject('path', midDir, pathYaw + idx * 0.1, true, false);
    });

    // 3. White Windmill on the breezy western knoll overlooking the meadow
    const windmillDir = new THREE.Vector3(-0.52, 0.36, 0.77).normalize();
    const windmillYaw = this.computeYawFacingTarget(windmillDir, this.wellDirection);
    this.placeStaticObject('windmill', windmillDir, windmillYaw, true, false);

    // 4. Striped Cliff-Top Lighthouse on the eastern coastal promontory overlooking Sea 1
    const lighthouseDir = new THREE.Vector3(0.62, 0.34, 0.71).normalize();
    this.placeStaticObject('lighthouse', lighthouseDir, -0.4, true, false);

    // 5. Continuous 10-Segment Tangential Wooden Fence Corral enclosing the Sheep Pasture
    const pRight = new THREE.Vector3()
      .crossVectors(UP_VEC, this.pastureCenter)
      .normalize();
    const pUp = new THREE.Vector3()
      .crossVectors(this.pastureCenter, pRight)
      .normalize();
    const fenceSegments = 10;
    for (let i = 0; i < fenceSegments; i++) {
      const angle = (i / fenceSegments) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const fDir = this.pastureCenter
        .clone()
        .addScaledVector(pRight, cosA * this.pastureRadius)
        .addScaledVector(pUp, sinA * this.pastureRadius)
        .normalize();
      const outwardDir = this.pastureCenter
        .clone()
        .addScaledVector(pRight, cosA * (this.pastureRadius + 0.08))
        .addScaledVector(pUp, sinA * (this.pastureRadius + 0.08))
        .normalize();
      // Align local +Z outward so the fence's local X rails run strictly tangent to the pasture perimeter
      const fenceYaw = this.computeYawFacingTarget(fDir, outwardDir);
      this.placeStaticObject('fence', fDir, fenceYaw, true, false);
    }

    // 6. Rounded Oaks across the grassy hills around the globe
    const oakDirs = [
      new THREE.Vector3(-0.48, 0.48, 0.73).normalize(),
      new THREE.Vector3(-0.22, 0.52, 0.82).normalize(),
      new THREE.Vector3(0.24, 0.46, 0.85).normalize(),
      new THREE.Vector3(-0.66, 0.18, 0.73).normalize(),
      new THREE.Vector3(-0.58, -0.28, 0.76).normalize(),
      new THREE.Vector3(0.15, -0.56, 0.81).normalize(),
      new THREE.Vector3(0.45, 0.58, -0.68).normalize(),
      new THREE.Vector3(-0.32, 0.42, -0.85).normalize(),
      new THREE.Vector3(0.76, 0.32, -0.56).normalize(),
      new THREE.Vector3(-0.86, -0.18, 0.48).normalize(),
      new THREE.Vector3(0.22, -0.62, -0.75).normalize(),
    ];
    oakDirs.forEach((d, i) => {
      this.placeStaticObject('oak', d, i * 1.7, true, false);
    });

    // 7. Narrow Pines near the northern snowy mountain & high ridges
    const pineDirs = [
      new THREE.Vector3(0.05, 0.78, 0.62).normalize(),
      new THREE.Vector3(-0.18, 0.82, 0.54).normalize(),
      new THREE.Vector3(0.28, 0.79, 0.54).normalize(),
      new THREE.Vector3(0.35, 0.84, -0.41).normalize(),
      new THREE.Vector3(-0.26, 0.86, -0.44).normalize(),
      new THREE.Vector3(0.02, 0.88, -0.47).normalize(),
      new THREE.Vector3(-0.42, 0.74, 0.52).normalize(),
    ];
    pineDirs.forEach((d, i) => {
      this.placeStaticObject('pine', d, i * 2.1, true, false);
    });

    // 8. Palms beside the coast (along sandy beaches of both turquoise seas)
    const palmDirs = [
      new THREE.Vector3(0.32, -0.08, 0.94).normalize(),
      new THREE.Vector3(0.38, -0.26, 0.88).normalize(),
      new THREE.Vector3(0.52, 0.14, 0.84).normalize(),
      new THREE.Vector3(0.84, -0.05, 0.54).normalize(),
      new THREE.Vector3(-0.38, -0.18, -0.91).normalize(),
      new THREE.Vector3(-0.88, 0.12, -0.46).normalize(),
    ];
    palmDirs.forEach((d, i) => {
      this.placeStaticObject('palm', d, i * 1.4, true, false);
    });

    // 9. Meadow Flowers across the neighborhoods
    const flowerDirs = [
      new THREE.Vector3(-0.26, 0.34, 0.90).normalize(),
      new THREE.Vector3(0.06, 0.28, 0.96).normalize(),
      new THREE.Vector3(-0.82, 0.28, 0.50).normalize(),
      new THREE.Vector3(0.48, -0.18, -0.86).normalize(),
      new THREE.Vector3(-0.04, -0.58, -0.81).normalize(),
    ];
    flowerDirs.forEach((d, i) => {
      this.placeStaticObject('flower', d, i * 0.9, true, false);
    });

    // 10. Cozy Village & Global Landmarks (Campfires, Beehives, Lanterns away from the well, Watchtower, Dock)
    this.placeStaticObject(
      'campfire',
      new THREE.Vector3(-0.18, 0.05, 0.98).normalize(),
      0.4,
      true,
      false,
    );
    this.placeStaticObject(
      'campfire',
      eastBackSquare,
      1.1,
      true,
      false,
    );
    this.placeStaticObject(
      'beehive',
      new THREE.Vector3(-0.15, 0.44, 0.88).normalize(),
      0.8,
      true,
      false,
    );
    this.placeStaticObject(
      'beehive',
      new THREE.Vector3(-0.82, 0.04, 0.57).normalize(),
      -0.6,
      true,
      false,
    );
    // Streetlamps positioned along outer avenues across the globe, far clear of the stone well plaza
    const lanternDirs = [
      new THREE.Vector3(-0.28, 0.44, 0.85).normalize(),
      new THREE.Vector3(0.18, 0.26, 0.95).normalize(),
      new THREE.Vector3(-0.78, 0.22, 0.58).normalize(),
      new THREE.Vector3(0.48, -0.28, -0.83).normalize(),
    ];
    lanternDirs.forEach((lDir, idx) => {
      this.placeStaticObject('lantern', lDir, idx * 0.9 - 0.4, true, false);
    });
    const watchtowerDir = new THREE.Vector3(-0.34, 0.65, 0.68).normalize();
    const watchtowerYaw = this.computeYawFacingTarget(
      watchtowerDir,
      this.wellDirection,
    );
    this.placeStaticObject(
      'watchtower',
      watchtowerDir,
      watchtowerYaw,
      true,
      false,
    );
    const dockDir = new THREE.Vector3(0.285, -0.04, 0.958).normalize();
    this.placeStaticObject(
      'dock',
      dockDir,
      1.50,
      true,
      false,
    );
    const dockShorePathDir = new THREE.Vector3(0.19, -0.02, 0.981).normalize();
    const dockShorePathYaw = this.computeYawFacingTarget(dockShorePathDir, dockDir);
    this.placeStaticObject('path', dockShorePathDir, dockShorePathYaw, true, false);

    // 11. Water Life: Sailboats & Paddling Swans/Ducks on the turquoise seas
    this.spawnSailboat(new THREE.Vector3(0.62, -0.14, 0.77).normalize(), false);
    this.spawnSailboat(new THREE.Vector3(-0.66, -0.14, -0.73).normalize(), false);
    this.spawnDuckFlock(new THREE.Vector3(0.52, -0.22, 0.82).normalize(), false);

    // 12. Hot Air Balloon drifting gently in the upper atmosphere
    this.spawnBalloon(new THREE.Vector3(0.35, 0.52, 0.78).normalize(), false);

    // 13. Twelve Villagers distributed across the 10 houses around the entire globe
    for (let i = 0; i < 12; i++) {
      const homeObj = initialHouses[i % initialHouses.length];
      const lateral = ((i % 3) - 1) * 0.016;
      const startDir = this.getBuildingEntranceDir(homeObj, lateral);
      this.spawnVillager(startDir, false);
    }

    // 14. Eight White Sheep grazing safely inside the fenced sheep pasture corral
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + (i % 2) * 0.2;
      const radialDist = i < 3 ? 0.028 : 0.056;
      const sDir = this.pastureCenter
        .clone()
        .addScaledVector(pRight, Math.cos(angle) * radialDist)
        .addScaledVector(pUp, Math.sin(angle) * radialDist)
        .normalize();
      this.spawnSheep(sDir, false, true);
    }

    // 15. Sakura Trees (Cherry Blossoms with pink petals)
    this.placeStaticObject(
      'sakura',
      new THREE.Vector3(-0.44, 0.45, 0.77).normalize(),
      0.7,
      true,
      false,
    );
    this.placeStaticObject(
      'sakura',
      new THREE.Vector3(-0.62, 0.38, 0.68).normalize(),
      1.4,
      true,
      false,
    );

    // 16. Torii Gate on scenic grassy path toward the shrine ridge
    const toriiDir = new THREE.Vector3(-0.52, 0.42, 0.74).normalize();
    this.placeStaticObject(
      'torii',
      toriiDir,
      this.computeYawFacingTarget(toriiDir, this.wellDirection),
      true,
      false,
    );

    // 17. Steaming Natural Hot Spring near mountain foot
    this.placeStaticObject(
      'onsen',
      new THREE.Vector3(-0.16, 0.66, 0.73).normalize(),
      0.4,
      true,
      false,
    );

    // 18. Gazebo / Pavilion overlooking the turquoise sea
    const pavDir = new THREE.Vector3(0.38, 0.36, 0.85).normalize();
    this.placeStaticObject(
      'pavilion',
      pavDir,
      this.computeYawFacingTarget(pavDir, this.wellDirection),
      true,
      false,
    );

    // 19. Glowing Mystic Crystal Cluster on mountain crag
    this.placeStaticObject(
      'crystal',
      new THREE.Vector3(0.16, 0.74, -0.65).normalize(),
      0.8,
      true,
      false,
    );

    // 20. Forest Deer roaming peacefully
    this.spawnDeer(new THREE.Vector3(-0.32, 0.42, 0.84).normalize(), false);
    this.spawnDeer(new THREE.Vector3(-0.58, 0.22, 0.77).normalize(), false);

    // 21. Three Puffy Clouds following curved paths around the world
    const cloudDirs = [
      new THREE.Vector3(-0.28, 0.38, 0.88).normalize(),
      new THREE.Vector3(0.68, 0.25, -0.68).normalize(),
      new THREE.Vector3(-0.55, -0.48, -0.68).normalize(),
    ];
    cloudDirs.forEach((d, idx) => {
      this.spawnCloud(d, false, idx === 0 ? 3.5 : 8.0 + idx * 4.0, false);
    });
  }

  private getObjectCollisionRadius(type: PlacedObjectType): number {
    switch (type) {
      case 'house':
        return 0.054;
      case 'pavilion':
        return 0.052;
      case 'windmill':
        return 0.056;
      case 'lighthouse':
        return 0.056;
      case 'watchtower':
        return 0.054;
      case 'torii':
        return 0.048;
      case 'onsen':
        return 0.048;
      case 'well':
        return 0.035;
      case 'campfire':
        return 0.032;
      case 'crystal':
        return 0.025;
      case 'beehive':
        return 0.025;
      case 'oak':
        return 0.022;
      case 'sakura':
        return 0.024;
      case 'pine':
        return 0.019;
      case 'palm':
        return 0.019;
      case 'lantern':
        return 0.011;
      default:
        return 0;
    }
  }

  private computeYawFacingTarget(
    dir: THREE.Vector3,
    targetDir: THREE.Vector3,
  ): number {
    const surface = this.terrain.getSurfacePointAndNormal(dir);
    const tangent = targetDir
      .clone()
      .sub(dir)
      .projectOnPlane(surface.normal)
      .normalize();
    if (tangent.lengthSq() < 1e-6) return 0;
    const alignQuat = new THREE.Quaternion().setFromUnitVectors(
      UP_VEC,
      surface.normal,
    );
    const localTangent = tangent
      .clone()
      .applyQuaternion(alignQuat.clone().invert());
    return Math.atan2(localTangent.x, localTangent.z);
  }

  private getBuildingEntranceDir(
    obj: PlacedObjectEntity,
    lateralOffset = 0,
  ): THREE.Vector3 {
    const surface = this.terrain.getSurfacePointAndNormal(obj.dir);
    const alignQuat = new THREE.Quaternion().setFromUnitVectors(
      UP_VEC,
      surface.normal,
    );
    const yawQuat = new THREE.Quaternion().setFromAxisAngle(UP_VEC, obj.yaw);
    const fullQuat = alignQuat.multiply(yawQuat);

    if (obj.type === 'dock' || obj.type === 'bridge') {
      // Approach the landward end of the dock or bridge
      const reach = obj.type === 'dock' ? 0.068 : 0.038;
      const axisZ = new THREE.Vector3(0, 0, 1)
        .applyQuaternion(fullQuat)
        .normalize();
      const endA = obj.dir.clone().addScaledVector(axisZ, -reach).normalize();
      const endB = obj.dir.clone().addScaledVector(axisZ, reach).normalize();
      const surfA = this.terrain.getSurfacePointAndNormal(endA);
      return !surfA.isWater ? endA : endB;
    }

    const frontTangent = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(fullQuat)
      .normalize();
    const rightTangent = new THREE.Vector3(1, 0, 0)
      .applyQuaternion(fullQuat)
      .normalize();
    const clearance = this.getObjectCollisionRadius(obj.type) + 0.022;

    const candidate = obj.dir
      .clone()
      .addScaledVector(frontTangent, clearance)
      .addScaledVector(rightTangent, lateralOffset)
      .normalize();

    // Ensure the entrance point itself isn't underwater
    const candSurf = this.terrain.getSurfacePointAndNormal(candidate);
    if (!candSurf.isWater) {
      return candidate;
    }
    return obj.dir
      .clone()
      .addScaledVector(frontTangent, -clearance)
      .normalize();
  }

  private getFenceSegmentOnSphere(fenceObj: PlacedObjectEntity): {
    segA: THREE.Vector3;
    segB: THREE.Vector3;
    railAxis: THREE.Vector3;
  } {
    const surface = this.terrain.getSurfacePointAndNormal(fenceObj.dir);
    const alignQuat = new THREE.Quaternion().setFromUnitVectors(
      UP_VEC,
      surface.normal,
    );
    const yawQuat = new THREE.Quaternion().setFromAxisAngle(
      UP_VEC,
      fenceObj.yaw,
    );
    const fullQuat = alignQuat.multiply(yawQuat);
    const railAxis = new THREE.Vector3(1, 0, 0)
      .applyQuaternion(fullQuat)
      .normalize();
    const halfSpan = 0.035;
    const segA = fenceObj.dir
      .clone()
      .addScaledVector(railAxis, -halfSpan)
      .normalize();
    const segB = fenceObj.dir
      .clone()
      .addScaledVector(railAxis, halfSpan)
      .normalize();
    return { segA, segB, railAxis };
  }

  private closestPointOnSphereSegment(
    pt: THREE.Vector3,
    segA: THREE.Vector3,
    segB: THREE.Vector3,
  ): THREE.Vector3 {
    const ab = segB.clone().sub(segA);
    const lenSq = ab.lengthSq();
    if (lenSq < 1e-8) return segA.clone();
    const ap = pt.clone().sub(segA);
    const t = THREE.MathUtils.clamp(ap.dot(ab) / lenSq, 0, 1);
    return segA.clone().addScaledVector(ab, t).normalize();
  }

  private getRainbowFootDirs(
    dir: THREE.Vector3,
    yaw: number,
  ): [THREE.Vector3, THREE.Vector3] {
    const surface = this.terrain.getSurfacePointAndNormal(dir);
    const alignQuat = new THREE.Quaternion().setFromUnitVectors(
      UP_VEC,
      surface.normal,
    );
    const yawQuat = new THREE.Quaternion().setFromAxisAngle(UP_VEC, yaw);
    const fullQuat = alignQuat.multiply(yawQuat);
    const xAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(fullQuat);
    const footA = surface.point.clone().addScaledVector(xAxis, -0.058).normalize();
    const footB = surface.point.clone().addScaledVector(xAxis, 0.058).normalize();
    return [footA, footB];
  }

  private findCollisionFreeRainbowYaw(dir: THREE.Vector3): number {
    let bestYaw = -0.25;
    let bestScore = -999;
    const surf = this.terrain.getSurfacePointAndNormal(dir);
    const alignQuat = new THREE.Quaternion().setFromUnitVectors(
      UP_VEC,
      surf.normal,
    );

    for (let step = 0; step < 24; step++) {
      const candidateYaw = (step / 24) * Math.PI;
      const yawQuat = new THREE.Quaternion().setFromAxisAngle(UP_VEC, candidateYaw);
      const q = alignQuat.clone().multiply(yawQuat);
      let minClear = 999;

      for (let aStep = 0; aStep <= 8; aStep++) {
        const a = (aStep / 8) * Math.PI;
        const lx = Math.cos(a) * 0.068;
        const ly = 0.016 + Math.sin(a) * 0.068;
        const pt = new THREE.Vector3(lx, ly, 0).applyQuaternion(q).add(surf.point);
        const ptDir = pt.clone().normalize();

        for (const obj of this.placedObjects) {
          const r = this.getObjectCollisionRadius(obj.type);
          if (r <= 0) continue;
          const d = ptDir.distanceTo(obj.dir) * 0.75 - (r + 0.024);
          if (d < minClear) minClear = d;
        }
      }

      if (minClear > bestScore) {
        bestScore = minClear;
        bestYaw = candidateYaw;
      }
    }
    return bestYaw;
  }

  private isPositionClearOfObstacles(
    dir: THREE.Vector3,
    extraMargin = 0.012,
    allowInsidePasture = false,
  ): boolean {
    const surf = this.terrain.getSurfacePointAndNormal(dir);
    if (surf.isWater || surf.isMountain) return false;
    if (surf.normal.dot(dir) < 0.75) return false;

    if (
      !allowInsidePasture &&
      dir.distanceTo(this.pastureCenter) < this.pastureRadius + extraMargin
    ) {
      return false;
    }

    for (const obj of this.placedObjects) {
      if (obj.type === 'fence') {
        const { segA, segB } = this.getFenceSegmentOnSphere(obj);
        const closest = this.closestPointOnSphereSegment(dir, segA, segB);
        if (dir.distanceTo(closest) < 0.015 + extraMargin) {
          return false;
        }
        continue;
      }
      if (obj.type === 'rainbow') {
        const [footA, footB] = this.getRainbowFootDirs(obj.dir, obj.yaw);
        if (
          dir.distanceTo(footA) < 0.026 + extraMargin ||
          dir.distanceTo(footB) < 0.026 + extraMargin
        ) {
          return false;
        }
        continue;
      }
      const r = this.getObjectCollisionRadius(obj.type);
      if (r > 0 && dir.distanceTo(obj.dir) < r + extraMargin) {
        return false;
      }
    }
    return true;
  }

  private orientObjectOnSurface(
    obj: THREE.Object3D,
    dir: THREE.Vector3,
    yaw: number,
    normalOffset = 0,
    stickToSeaLevel = false,
    useRadialUp = false,
  ) {
    const surface = this.terrain.getSurfacePointAndNormal(dir);
    const normDir = dir.clone().normalize();
    const basePoint = stickToSeaLevel
      ? normDir.clone().multiplyScalar(this.terrain.seaLevel)
      : surface.point;
    const upNormal = stickToSeaLevel || useRadialUp ? normDir : surface.normal;

    const pos = basePoint.clone().addScaledVector(upNormal, normalOffset);
    obj.position.copy(pos);

    const alignQuat = new THREE.Quaternion().setFromUnitVectors(UP_VEC, upNormal);
    const yawQuat = new THREE.Quaternion().setFromAxisAngle(UP_VEC, yaw);
    obj.quaternion.copy(alignQuat).multiply(yawQuat);
  }

  public placeStaticObject(
    type: PlacedObjectType,
    dir: THREE.Vector3,
    yaw = Math.random() * Math.PI * 2,
    removable = true,
    withSparkles = true,
  ): PlacedObjectEntity {
    const normDir = dir.clone().normalize();
    let meshGroup: THREE.Group;
    let windmillRotor: THREE.Object3D | undefined;
    let lighthouseBeamPivot: THREE.Object3D | undefined;
    let lighthouseConeMats: THREE.MeshBasicMaterial[] | undefined;
    let lighthousePointLight: THREE.PointLight | undefined;
    let windowMaterials: THREE.MeshStandardMaterial[] | undefined;
    let campfireFlameGroup: THREE.Group | undefined;
    let campfireEmbers: THREE.Points | undefined;
    let campfireLight: THREE.PointLight | undefined;
    let watchtowerFlag: THREE.Mesh | undefined;
    let butterflySwarm: THREE.Group | undefined;
    let steamParticles: THREE.Points | undefined;
    let crystalMat: THREE.MeshStandardMaterial | undefined;
    let crystalLight: THREE.PointLight | undefined;
    let petalParticles: THREE.Points | undefined;
    let pavilionLanternLight: THREE.PointLight | undefined;

    if (type === 'house') {
      const res = createPastelHouseMesh(this.houseCounter++);
      meshGroup = res.group;
      windowMaterials = res.windowMaterials;
    } else if (type === 'windmill') {
      const res = createWhiteWindmillMesh();
      meshGroup = res.group;
      windmillRotor = res.rotor;
      windowMaterials = res.windowMaterials;
    } else if (type === 'lighthouse') {
      const res = createStripedLighthouseMesh();
      meshGroup = res.group;
      lighthouseBeamPivot = res.beamPivot;
      lighthouseConeMats = res.coneMats;
      lighthousePointLight = res.pointLight;
      windowMaterials = res.windowMaterials;
    } else if (type === 'well') {
      meshGroup = createStoneWellMesh();
    } else if (type === 'fence') {
      meshGroup = createWoodenFenceMesh();
    } else if (type === 'path') {
      meshGroup = createSteppingPathMesh();
    } else if (type === 'oak') {
      meshGroup = createOakTreeMesh();
    } else if (type === 'pine') {
      const surface = this.terrain.getSurfacePointAndNormal(normDir);
      meshGroup = createPineTreeMesh(surface.isMountain || normDir.y > 0.65);
    } else if (type === 'palm') {
      meshGroup = createPalmTreeMesh();
    } else if (type === 'sakura') {
      const res = createSakuraTreeMesh();
      meshGroup = res.group;
      petalParticles = res.petalParticles;
    } else if (type === 'torii') {
      const res = createToriiMesh();
      meshGroup = res.group;
    } else if (type === 'onsen') {
      const res = createHotSpringMesh();
      meshGroup = res.group;
      steamParticles = res.steamParticles;
    } else if (type === 'crystal') {
      const res = createCrystalClusterMesh();
      meshGroup = res.group;
      crystalMat = res.crystalMat;
      crystalLight = res.crystalLight;
    } else if (type === 'pavilion') {
      const res = createPavilionMesh();
      meshGroup = res.group;
      pavilionLanternLight = res.pavilionLanternLight;
    } else if (type === 'dock' || type === 'bridge') {
      const res = createWoodenDockMesh(type === 'bridge');
      meshGroup = res.group;
      windowMaterials = res.windowMaterials;
    } else if (type === 'campfire') {
      const res = createCampfireMesh();
      meshGroup = res.group;
      campfireFlameGroup = res.flameGroup;
      campfireEmbers = res.embers;
      campfireLight = res.light;
    } else if (type === 'watchtower') {
      const res = createStoneWatchtowerMesh();
      meshGroup = res.group;
      watchtowerFlag = res.flagMesh;
      windowMaterials = res.windowMaterials;
    } else if (type === 'beehive') {
      const res = createBeehiveMesh();
      meshGroup = res.group;
      butterflySwarm = res.butterflySwarm;
    } else if (type === 'lantern') {
      const res = createLanternPostMesh();
      meshGroup = res.group;
      windowMaterials = res.windowMaterials;
    } else if (type === 'rainbow') {
      meshGroup = createRainbowArchMesh();
    } else {
      meshGroup = createFlowerClusterMesh();
    }

    const stickToSea = type === 'dock' || type === 'bridge';
    const useRadialUp = stickToSea || type === 'lighthouse';
    this.orientObjectOnSurface(meshGroup, normDir, yaw, 0, stickToSea, useRadialUp);
    this.objectsGroup.add(meshGroup);

    const isTree = type === 'oak' || type === 'pine' || type === 'palm' || type === 'sakura';
    const initialGrowth = isTree ? 0.82 + Math.random() * 0.22 : 1.0;

    const entity: PlacedObjectEntity = {
      id: `${type}_${Date.now()}_${Math.random()}`,
      type,
      dir: normDir,
      yaw,
      mesh: meshGroup,
      baseScale: 1.0,
      growth: initialGrowth,
      targetGrowth: initialGrowth,
      bounceTime: withSparkles ? 0.0 : 10.0,
      bounceActive: withSparkles,
      windmillRotor,
      lighthouseBeamPivot,
      lighthouseConeMats,
      lighthousePointLight,
      windowMaterials,
      campfireFlameGroup,
      campfireEmbers,
      campfireLight,
      watchtowerFlag,
      butterflySwarm,
      steamParticles,
      crystalMat,
      crystalLight,
      petalParticles,
      pavilionLanternLight,
      removable,
    };

    if (withSparkles) {
      meshGroup.scale.setScalar(0.01);
      this.emitSparklesAtDir(normDir, '#ffe484');
    } else {
      meshGroup.scale.setScalar(initialGrowth);
    }

    this.placedObjects.push(entity);
    return entity;
  }

  private spawnSailboat(dir: THREE.Vector3, withSparkles = true) {
    let waterDir = dir.clone().normalize();
    const surf = this.terrain.getSurfacePointAndNormal(waterDir);
    if (!surf.isWater) {
      const nearestWater = this.terrain.findNearestWaterDirection(waterDir, 0.95);
      if (nearestWater) {
        waterDir = nearestWater;
      } else {
        this.terrain.sculptAtDirection(waterDir, 'lake');
        this.realignAllObjectsToTerrain();
      }
    }

    const { group, hullGroup, lanternMat } = createSailboatMesh(this.boatCounter++);
    const yaw = Math.random() * Math.PI * 2;
    this.orientObjectOnSurface(group, waterDir, yaw, 0, true);
    this.inhabitantsGroup.add(group);

    const targetDir = this.pickRandomWaterTarget(waterDir);
    const entity: SailboatEntity = {
      id: `sailboat_${Date.now()}_${Math.random()}`,
      mesh: group,
      hullGroup,
      lanternMat,
      dir: waterDir,
      targetDir,
      speed: 0.048 + Math.random() * 0.02,
      bobPhase: Math.random() * Math.PI * 2,
      yaw,
    };

    if (withSparkles) {
      this.emitSparklesAtDir(waterDir, '#7ef2e6', this.terrain.seaLevel);
    }

    this.sailboats.push(entity);
  }

  private spawnDuckFlock(dir: THREE.Vector3, withSparkles = true) {
    let waterDir = dir.clone().normalize();
    const surf = this.terrain.getSurfacePointAndNormal(waterDir);
    if (!surf.isWater) {
      const nearestWater = this.terrain.findNearestWaterDirection(waterDir, 0.95);
      if (nearestWater) {
        waterDir = nearestWater;
      } else {
        this.terrain.sculptAtDirection(waterDir, 'lake');
        this.realignAllObjectsToTerrain();
      }
    }

    const { group, rippleRings } = createSwanDuckFlockMesh();
    const yaw = Math.random() * Math.PI * 2;
    this.orientObjectOnSurface(group, waterDir, yaw, 0, true);
    this.inhabitantsGroup.add(group);

    const targetDir = this.pickRandomWaterTarget(waterDir);
    const entity: DuckEntity = {
      id: `duck_${Date.now()}_${Math.random()}`,
      mesh: group,
      rippleRings,
      dir: waterDir,
      targetDir,
      speed: 0.028 + Math.random() * 0.015,
      bobPhase: Math.random() * Math.PI * 2,
      yaw,
    };

    if (withSparkles) {
      this.emitSparklesAtDir(waterDir, '#ffffff', this.terrain.seaLevel);
    }

    this.ducks.push(entity);
  }

  private pickRandomWaterTarget(fromDir: THREE.Vector3): THREE.Vector3 {
    for (let attempt = 0; attempt < 24; attempt++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 0.36,
        (Math.random() - 0.5) * 0.36,
        (Math.random() - 0.5) * 0.36,
      );
      const candidate = fromDir.clone().add(offset).normalize();
      const surf = this.terrain.getSurfacePointAndNormal(candidate);
      if (surf.isWater) {
        return candidate;
      }
    }
    return this.terrain.findNearestWaterDirection(fromDir, 0.8) || fromDir.clone();
  }

  private spawnBalloon(dir: THREE.Vector3, withSparkles = true) {
    const normDir = dir.clone().normalize();
    const { group, burnerMat } = createHotAirBalloonMesh(this.balloonCounter++);

    const randVec = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() + 0.5,
      Math.random() - 0.5,
    ).normalize();
    const orbitAxis = new THREE.Vector3()
      .crossVectors(normDir, randVec)
      .normalize();

    const baseAltitude = 1.02 + Math.random() * 0.1;
    group.position.copy(normDir).multiplyScalar(baseAltitude);
    group.quaternion.setFromUnitVectors(UP_VEC, normDir);
    this.atmosphereGroup.add(group);

    const entity: BalloonEntity = {
      id: `balloon_${Date.now()}_${Math.random()}`,
      mesh: group,
      burnerMat,
      orbitAxis,
      currentDir: normDir,
      orbitSpeed: 0.065 + Math.random() * 0.03,
      baseAltitude,
      phase: Math.random() * Math.PI * 2,
    };

    if (withSparkles) {
      this.emitSparklesAtDir(normDir, '#ffb8d1', baseAltitude);
    }

    this.balloons.push(entity);
  }

  private spawnShootingStar(dir: THREE.Vector3) {
    const normDir = dir.clone().normalize();
    const mesh = createShootingStarMesh();

    const randVec = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5,
    ).normalize();
    const orbitAxis = new THREE.Vector3()
      .crossVectors(normDir, randVec)
      .normalize();

    const altitude = 1.22;
    mesh.position.copy(normDir).multiplyScalar(altitude);
    this.atmosphereGroup.add(mesh);

    const entity: ShootingStarEntity = {
      id: `star_${Date.now()}_${Math.random()}`,
      mesh,
      orbitAxis,
      currentDir: normDir,
      speed: 1.35,
      altitude,
      age: 0,
      maxAge: 1.65,
      sparkleTimer: 0,
    };

    this.shootingStars.push(entity);
    this.shootingStarGazeTimer = 2.4;
    this.emitSparklesAtDir(normDir, '#fff3a1', altitude);
  }

  private spawnVillager(dir: THREE.Vector3, withSparkles = true) {
    const normDir = dir.clone().normalize();
    const vIdx = this.villagerCounter++;
    const { group, bodyMesh, headGroup, leftLeg, rightLeg, leftArm, rightArm } =
      createVillagerMesh(vIdx);
    const yaw = Math.random() * Math.PI * 2;
    this.orientObjectOnSurface(group, normDir, yaw);
    this.inhabitantsGroup.add(group);

    const headingToWell = vIdx % 4 === 0;
    const targetDir = this.pickNextVillagerTarget(headingToWell, normDir);
    const entity: VillagerEntity = {
      id: `villager_${Date.now()}_${Math.random()}`,
      mesh: group,
      bodyMesh,
      headGroup,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      dir: normDir,
      targetDir,
      speed: 0.082 + Math.random() * 0.032,
      walkPhase: Math.random() * Math.PI * 2,
      pauseTimer: Math.random() * 1.2,
      headingToWell,
      bounceTime: withSparkles ? 0.0 : 10.0,
      yaw,
      stuckTimer: 0,
      steerSign: vIdx % 2 === 0 ? 1 : -1,
    };

    // Immediately resolve any spawn overlap with buildings or fences
    this.resolveVillagerCollisions(entity, []);
    this.orientObjectOnSurface(entity.mesh, entity.dir, entity.yaw);

    if (withSparkles) {
      this.emitSparklesAtDir(entity.dir, '#ffd180');
    }

    this.villagers.push(entity);
  }

  private sampleClearRingAroundHub(
    hubDir: THREE.Vector3,
    minRingRadius: number,
    maxRingRadius: number,
  ): THREE.Vector3 | null {
    const refUp = Math.abs(hubDir.y) < 0.9 ? UP_VEC : new THREE.Vector3(1, 0, 0);
    const ringRight = new THREE.Vector3().crossVectors(refUp, hubDir).normalize();
    const ringUp = new THREE.Vector3().crossVectors(hubDir, ringRight).normalize();

    for (let attempt = 0; attempt < 14; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const r =
        minRingRadius + Math.random() * Math.max(0.005, maxRingRadius - minRingRadius);
      const candidate = hubDir
        .clone()
        .addScaledVector(ringRight, Math.cos(angle) * r)
        .addScaledVector(ringUp, Math.sin(angle) * r)
        .normalize();
      if (this.isPositionClearOfObstacles(candidate, 0.018)) {
        return candidate;
      }
    }
    return null;
  }

  private pickNextVillagerTarget(
    headingToSocialHub: boolean,
    fromDir?: THREE.Vector3,
  ): THREE.Vector3 {
    const isEveningOrNight = this.timeOfDay > 0.42 && this.timeOfDay < 0.9;
    const campfires = this.placedObjects.filter((o) => o.type === 'campfire');

    // Count how many villagers are already near or heading toward the stone well
    const wellVisitorCount = this.villagers.filter(
      (v) =>
        v.dir.distanceTo(this.wellDirection) < 0.14 ||
        v.targetDir.distanceTo(this.wellDirection) < 0.14,
    ).length;

    if (headingToSocialHub) {
      // 1. At dusk and night, villagers gather around the outside ring of cozy campfires
      if (isEveningOrNight && campfires.length > 0 && Math.random() < 0.75) {
        const sortedFires = fromDir
          ? [...campfires].sort(
              (a, b) => a.dir.distanceTo(fromDir) - b.dir.distanceTo(fromDir),
            )
          : campfires;
        const cf = sortedFires[0];
        const baseR = this.getObjectCollisionRadius('campfire');
        const spot = this.sampleClearRingAroundHub(cf.dir, baseR + 0.026, baseR + 0.044);
        if (spot) return spot;
      }

      // 2. Only allow at most 2 villagers at a time to head to the Stone Well, and only if reasonably nearby
      const nearWellHemisphere = !fromDir || fromDir.distanceTo(this.wellDirection) < 0.85;
      if (wellVisitorCount < 2 && nearWellHemisphere && Math.random() < 0.45) {
        const wellBaseR = this.getObjectCollisionRadius('well');
        const wellSpot = this.sampleClearRingAroundHub(
          this.wellDirection,
          wellBaseR + 0.028,
          wellBaseR + 0.048,
        );
        if (wellSpot) return wellSpot;
      }

      // 3. Otherwise visit one of the other scenic community landmarks across the globe
      const communityHubs = this.placedObjects.filter(
        (o) =>
          o.type === 'campfire' ||
          o.type === 'windmill' ||
          o.type === 'watchtower' ||
          o.type === 'beehive' ||
          o.type === 'dock',
      );
      if (communityHubs.length > 0) {
        const filteredHubs = fromDir
          ? communityHubs.filter((h) => h.dir.distanceTo(fromDir) > 0.08)
          : communityHubs;
        const pool = filteredHubs.length > 0 ? filteredHubs : communityHubs;
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        if (
          chosen.type === 'windmill' ||
          chosen.type === 'watchtower' ||
          chosen.type === 'dock'
        ) {
          return this.getBuildingEntranceDir(
            chosen,
            (Math.random() - 0.5) * 0.022,
          );
        }
        const hubR = this.getObjectCollisionRadius(chosen.type);
        const hubSpot = this.sampleClearRingAroundHub(
          chosen.dir,
          hubR + 0.026,
          hubR + 0.044,
        );
        if (hubSpot) return hubSpot;
      }
    }

    // Visit a cottage, watchtower, windmill, or dock around the globe
    const destinations = this.placedObjects.filter(
      (o) =>
        o.type === 'house' ||
        o.type === 'watchtower' ||
        o.type === 'windmill' ||
        o.type === 'dock',
    );
    if (destinations.length > 0) {
      // Exclude the building the villager is currently standing right in front of
      const candidates = fromDir
        ? destinations.filter((d) => d.dir.distanceTo(fromDir) > 0.09)
        : destinations;
      const pool = candidates.length > 0 ? candidates : destinations;

      // 70% of the time pick one of the 4 closest destinations in the villager's region; 30% trek across the globe
      let chosen: PlacedObjectEntity;
      if (fromDir && Math.random() < 0.7 && pool.length > 4) {
        const sorted = [...pool].sort(
          (a, b) => a.dir.distanceTo(fromDir) - b.dir.distanceTo(fromDir),
        );
        const localSlice = sorted.slice(0, 4);
        chosen = localSlice[Math.floor(Math.random() * localSlice.length)];
      } else {
        chosen = pool[Math.floor(Math.random() * pool.length)];
      }

      const lateral = (Math.random() - 0.5) * 0.022;
      // Target the front door threshold / porch outside the building, NEVER the building center!
      return this.getBuildingEntranceDir(chosen, lateral);
    }

    for (let attempt = 0; attempt < 16; attempt++) {
      const candidate = this.wellDirection
        .clone()
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 0.34,
            (Math.random() - 0.5) * 0.34,
            0,
          ),
        )
        .normalize();
      if (this.isPositionClearOfObstacles(candidate, 0.014)) {
        return candidate;
      }
    }
    return this.wellDirection
      .clone()
      .add(new THREE.Vector3(0, 0.068, 0))
      .normalize();
  }

  private spawnSheep(
    dir: THREE.Vector3,
    withSparkles = true,
    forceInPasture?: boolean,
  ) {
    const normDir = dir.clone().normalize();
    const { group, headGroup, legs, tailMesh } = createSheepMesh();
    const yaw = Math.random() * Math.PI * 2;
    this.orientObjectOnSurface(group, normDir, yaw);
    this.inhabitantsGroup.add(group);

    const isInsideCorral =
      forceInPasture !== undefined
        ? forceInPasture
        : normDir.distanceTo(this.pastureCenter) < this.pastureRadius - 0.01;

    const entity: SheepEntity = {
      id: `sheep_${Date.now()}_${Math.random()}`,
      mesh: group,
      headGroup,
      legs,
      tailMesh,
      dir: normDir,
      targetDir: normDir.clone(),
      speed: 0.04 + Math.random() * 0.018,
      walkPhase: Math.random() * Math.PI * 2,
      grazeTimer: 0.8 + Math.random() * 2.4,
      isGrazing: true,
      bounceTime: withSparkles ? 0.0 : 10.0,
      yaw,
      inPasture: isInsideCorral,
    };

    this.resolveSheepCollisions(entity);
    this.orientObjectOnSurface(entity.mesh, entity.dir, entity.yaw);

    if (withSparkles) {
      this.emitSparklesAtDir(entity.dir, '#ffffff');
    }

    this.sheepList.push(entity);
  }

  private spawnDeer(dir: THREE.Vector3, withSparkles = true) {
    const normDir = dir.clone().normalize();
    const { group, headGroup, legs, tailMesh } = createDeerMesh();
    const yaw = Math.random() * Math.PI * 2;
    this.orientObjectOnSurface(group, normDir, yaw);
    this.inhabitantsGroup.add(group);

    const entity: DeerEntity = {
      id: `deer_${Date.now()}_${Math.random()}`,
      mesh: group,
      headGroup,
      legs,
      tailMesh,
      dir: normDir,
      targetDir: normDir.clone(),
      speed: 0.046 + Math.random() * 0.016,
      walkPhase: Math.random() * Math.PI * 2,
      grazeTimer: 1.2 + Math.random() * 2.8,
      isGrazing: true,
      bounceTime: withSparkles ? 0.0 : 10.0,
      yaw,
    };

    this.orientObjectOnSurface(entity.mesh, entity.dir, entity.yaw);

    if (withSparkles) {
      this.emitSparklesAtDir(entity.dir, '#fed7aa');
    }

    this.deerList.push(entity);
  }

  private spawnCloud(
    dir: THREE.Vector3,
    withSparkles = true,
    initialRainTimer = 4.0,
    isSnow = false,
  ) {
    const normDir = dir.clone().normalize();
    const { group, rainLines, rainMat, snowPoints, snowMat } =
      createPuffyCloudMesh(isSnow);

    // Pick an orbital axis perpendicular to initial direction
    const randVec = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() + 0.4,
      Math.random() - 0.5,
    ).normalize();
    const orbitAxis = new THREE.Vector3()
      .crossVectors(normDir, randVec)
      .normalize();

    const altitude = 1.09 + Math.random() * 0.07; // Suspended inside the 1.50 glass orb above 0.75 planet
    group.position.copy(normDir).multiplyScalar(altitude);
    group.quaternion.setFromUnitVectors(UP_VEC, normDir);
    this.atmosphereGroup.add(group);

    const entity: CloudEntity = {
      id: `cloud_${Date.now()}_${Math.random()}`,
      isSnow,
      mesh: group,
      rainLines,
      rainMat,
      snowPoints,
      snowMat,
      orbitAxis,
      currentDir: normDir,
      orbitSpeed: 0.11 + Math.random() * 0.05,
      altitude,
      rainTimer: initialRainTimer,
      isRaining: isSnow, // Snow clouds begin gently snowing right away
      bounceTime: withSparkles ? 0.0 : 10.0,
    };

    if (withSparkles) {
      this.emitSparklesAtDir(normDir, isSnow ? '#ffffff' : '#cce8ff', altitude);
    }

    this.clouds.push(entity);
  }

  public emitSparklesAtDir(
    dir: THREE.Vector3,
    hexColor = '#ffe57f',
    customRadius?: number,
  ) {
    const surface = this.terrain.getSurfacePointAndNormal(dir);
    const origin = customRadius
      ? dir.clone().normalize().multiplyScalar(customRadius)
      : surface.point.clone().addScaledVector(surface.normal, 0.025);

    const count = 18;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];
    const baseCol = new THREE.Color(hexColor);
    const altCol = new THREE.Color('#ffffff');

    for (let i = 0; i < count; i++) {
      positions[i * 3] = origin.x;
      positions[i * 3 + 1] = origin.y;
      positions[i * 3 + 2] = origin.z;

      const c = i % 2 === 0 ? baseCol : altCol;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      const spread = new THREE.Vector3(
        (Math.random() - 0.5) * 1.4,
        (Math.random() - 0.5) * 1.4,
        (Math.random() - 0.5) * 1.4,
      );
      const vel = surface.normal
        .clone()
        .multiplyScalar(0.12 + Math.random() * 0.14)
        .addScaledVector(spread, 0.09);
      velocities.push(vel);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.032,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    this.effectsGroup.add(points);
    this.sparkles.push({
      points,
      velocities,
      age: 0,
      maxAge: 0.75,
    });
  }

  private realignAllObjectsToTerrain() {
    for (const obj of this.placedObjects) {
      const stickToSea = obj.type === 'dock' || obj.type === 'bridge';
      const useRadialUp = stickToSea || obj.type === 'lighthouse';
      this.orientObjectOnSurface(obj.mesh, obj.dir, obj.yaw, 0, stickToSea, useRadialUp);
    }
  }

  public handleSurfaceAction(localDir: THREE.Vector3) {
    const surface = this.terrain.getSurfacePointAndNormal(localDir);
    const tool = this.activeTool;

    if (tool === 'raise' || tool === 'lower' || tool === 'mountain' || tool === 'lake') {
      this.terrain.sculptAtDirection(localDir, tool);
      this.realignAllObjectsToTerrain();
      this.emitSparklesAtDir(
        localDir,
        tool === 'lake' || tool === 'lower' ? '#7ef2e6' : '#c9f29b',
      );
      this.syncWorldStats();
      return;
    }

    if (tool === 'remove') {
      // Find closest removable placed object, sailboat, duck, balloon, or cloud
      let bestIdx = -1;
      let bestDist = 0.16;
      for (let i = 0; i < this.placedObjects.length; i++) {
        const o = this.placedObjects[i];
        if (!o.removable) continue;
        const d = o.dir.distanceTo(localDir);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      if (bestIdx !== -1) {
        const removed = this.placedObjects.splice(bestIdx, 1)[0];
        this.objectsGroup.remove(removed.mesh);
        this.emitSparklesAtDir(removed.dir, '#ffb8b8');
        this.syncWorldStats();
        return;
      }

      // Check sailboats
      for (let i = 0; i < this.sailboats.length; i++) {
        if (this.sailboats[i].dir.distanceTo(localDir) < 0.18) {
          const removed = this.sailboats.splice(i, 1)[0];
          this.inhabitantsGroup.remove(removed.mesh);
          this.emitSparklesAtDir(removed.dir, '#ffb8b8', this.terrain.seaLevel);
          this.syncWorldStats();
          return;
        }
      }

      // Check ducks
      for (let i = 0; i < this.ducks.length; i++) {
        if (this.ducks[i].dir.distanceTo(localDir) < 0.18) {
          const removed = this.ducks.splice(i, 1)[0];
          this.inhabitantsGroup.remove(removed.mesh);
          this.emitSparklesAtDir(removed.dir, '#ffb8b8', this.terrain.seaLevel);
          this.syncWorldStats();
          return;
        }
      }

      // Check deer
      for (let i = 0; i < this.deerList.length; i++) {
        if (this.deerList[i].dir.distanceTo(localDir) < 0.18) {
          const removed = this.deerList.splice(i, 1)[0];
          this.inhabitantsGroup.remove(removed.mesh);
          this.emitSparklesAtDir(removed.dir, '#ffb8b8');
          soundManager.playPlaceTone('remove');
          this.syncWorldStats();
          return;
        }
      }

      // Check balloons
      for (let i = 0; i < this.balloons.length; i++) {
        if (this.balloons[i].currentDir.distanceTo(localDir) < 0.24) {
          const removed = this.balloons.splice(i, 1)[0];
          this.atmosphereGroup.remove(removed.mesh);
          this.emitSparklesAtDir(removed.currentDir, '#ffb8b8', removed.baseAltitude);
          soundManager.playPlaceTone('remove');
          this.syncWorldStats();
          return;
        }
      }
      return;
    }

    // Play placement sound effect
    soundManager.playPlaceTone(tool);

    // Weather & Sky tools
    if (tool === 'cloud') {
      this.spawnCloud(localDir, true, 1.0, false);
      this.syncWorldStats();
      return;
    }
    if (tool === 'snowcloud') {
      this.spawnCloud(localDir, true, 0.2, true);
      this.syncWorldStats();
      return;
    }
    if (tool === 'balloon') {
      this.spawnBalloon(localDir, true);
      this.syncWorldStats();
      return;
    }
    if (tool === 'shootingstar') {
      this.spawnShootingStar(localDir);
      this.syncWorldStats();
      return;
    }
    if (tool === 'rainbow') {
      const yaw = this.findCollisionFreeRainbowYaw(localDir);
      this.placeStaticObject(
        'rainbow',
        localDir,
        yaw,
        true,
        true,
      );
      this.syncWorldStats();
      return;
    }

    // Water & Coastal tools
    if (tool === 'sailboat') {
      soundManager.playWaterSplash();
      this.spawnSailboat(localDir, true);
      this.syncWorldStats();
      return;
    }
    if (tool === 'duck') {
      soundManager.playWaterSplash();
      this.spawnDuckFlock(localDir, true);
      this.syncWorldStats();
      return;
    }
    if (tool === 'dock') {
      if (surface.isWater) {
        // Clicking on water spans an arched wooden footbridge across the channel
        this.placeStaticObject(
          'bridge',
          localDir,
          Math.random() * Math.PI * 2,
          true,
          true,
        );
      } else {
        // Clicking near shoreline builds a timber pier extending toward the nearest water
        const nearestWater = this.terrain.findNearestWaterDirection(localDir, 0.55);
        let yaw = Math.random() * Math.PI * 2;
        if (nearestWater) {
          const tangent = nearestWater
            .clone()
            .sub(localDir)
            .projectOnPlane(surface.normal)
            .normalize();
          yaw = Math.atan2(tangent.x, tangent.z);
        }
        this.placeStaticObject('dock', localDir, yaw, true, true);
      }
      this.syncWorldStats();
      return;
    }

    // Ensure dry land for land-based items (if underwater, gently raise a small island patch!)
    if (surface.isWater) {
      this.terrain.sculptAtDirection(localDir, 'raise');
      this.realignAllObjectsToTerrain();
    }

    if (tool === 'tree') {
      const updated = this.terrain.getSurfacePointAndNormal(localDir);
      let treeType: PlacedObjectType = 'oak';
      if (updated.isBeach) {
        treeType = 'palm';
      } else if (updated.isMountain || localDir.y > 0.58) {
        treeType = 'pine';
      }
      this.placeStaticObject(treeType, localDir, Math.random() * Math.PI * 2, true, true);
    } else if (tool === 'sakura') {
      this.placeStaticObject('sakura', localDir, Math.random() * Math.PI * 2, true, true);
    } else if (tool === 'torii') {
      const yaw = this.computeYawFacingTarget(localDir, this.wellDirection);
      this.placeStaticObject('torii', localDir, yaw, true, true);
    } else if (tool === 'onsen') {
      this.placeStaticObject('onsen', localDir, Math.random() * Math.PI * 2, true, true);
    } else if (tool === 'crystal') {
      this.placeStaticObject('crystal', localDir, Math.random() * Math.PI * 2, true, true);
    } else if (tool === 'pavilion') {
      const yaw = this.computeYawFacingTarget(localDir, this.wellDirection);
      this.placeStaticObject('pavilion', localDir, yaw, true, true);
    } else if (tool === 'house') {
      const houseYaw = this.computeYawFacingTarget(localDir, this.wellDirection);
      const newHouse = this.placeStaticObject('house', localDir, houseYaw, true, true);
      // Connect with a stepping stone path from the front door toward the well if nearby
      const doorDir = this.getBuildingEntranceDir(newHouse, 0);
      if (localDir.distanceTo(this.wellDirection) < 0.55) {
        const pathDir = doorDir.clone().lerp(this.wellDirection, 0.5).normalize();
        const pathYaw = this.computeYawFacingTarget(pathDir, this.wellDirection);
        this.placeStaticObject('path', pathDir, pathYaw, true, false);
      }
      // Every new house welcomes 2 new villagers at its front doorstep!
      this.spawnVillager(this.getBuildingEntranceDir(newHouse, -0.014), false);
      this.spawnVillager(this.getBuildingEntranceDir(newHouse, 0.014), false);
    } else if (tool === 'windmill') {
      const yaw = this.computeYawFacingTarget(localDir, this.wellDirection);
      this.placeStaticObject('windmill', localDir, yaw, true, true);
    } else if (tool === 'lighthouse') {
      this.placeStaticObject('lighthouse', localDir, Math.random() * Math.PI * 2, true, true);
    } else if (tool === 'watchtower') {
      const yaw = this.computeYawFacingTarget(localDir, this.wellDirection);
      this.placeStaticObject('watchtower', localDir, yaw, true, true);
    } else if (tool === 'campfire') {
      this.placeStaticObject('campfire', localDir, Math.random() * Math.PI * 2, true, true);
    } else if (tool === 'beehive') {
      this.placeStaticObject('beehive', localDir, Math.random() * Math.PI * 2, true, true);
      // Also scatter a nearby meadow blossom cluster for the bees & butterflies
      const blossomDir = localDir
        .clone()
        .add(new THREE.Vector3(0.035, 0.02, -0.02))
        .normalize();
      if (!this.terrain.getSurfacePointAndNormal(blossomDir).isWater) {
        this.placeStaticObject('flower', blossomDir, Math.random() * Math.PI * 2, true, false);
      }
    } else if (tool === 'lantern') {
      this.placeStaticObject('lantern', localDir, Math.random() * Math.PI * 2, true, true);
    } else if (tool === 'flower') {
      this.placeStaticObject('flower', localDir, Math.random() * Math.PI * 2, true, true);
    } else if (tool === 'villager') {
      this.spawnVillager(localDir, true);
    } else if (tool === 'sheep') {
      this.spawnSheep(localDir, true);
    } else if (tool === 'deer') {
      this.spawnDeer(localDir, true);
    }

    // Displace any villagers or sheep standing inside a newly placed structure's footprint
    const bridgesAndDocks = this.placedObjects.filter(
      (o) => o.type === 'bridge' || o.type === 'dock',
    );
    for (const v of this.villagers) {
      this.resolveVillagerCollisions(v, bridgesAndDocks);
    }
    for (const s of this.sheepList) {
      this.resolveSheepCollisions(s);
    }

    this.syncWorldStats();
  }

  /**
   * "Grow" button advances village development through new homes, paths, and trees,
   * and visibly advances existing trees' growth!
   */
  public triggerGrowVillage() {
    // 1. Mature existing trees with a joyful bounce
    for (const obj of this.placedObjects) {
      if (obj.type === 'oak' || obj.type === 'pine' || obj.type === 'palm') {
        obj.targetGrowth = Math.min(1.42, obj.targetGrowth + 0.18);
        obj.bounceTime = 0;
        obj.bounceActive = true;
      }
    }

    // 2. Find an open meadow spot near the village well for a new pastel cottage + path
    for (let attempt = 0; attempt < 28; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.19 + Math.random() * 0.26;
      const candidate = new THREE.Vector3(
        this.wellDirection.x + Math.cos(angle) * dist,
        this.wellDirection.y + Math.sin(angle) * dist,
        this.wellDirection.z + (Math.random() - 0.5) * 0.2,
      ).normalize();

      if (this.isPositionClearOfObstacles(candidate, 0.068, false)) {
        const houseYaw = this.computeYawFacingTarget(candidate, this.wellDirection);
        const newHouse = this.placeStaticObject('house', candidate, houseYaw, true, true);
        const doorDir = this.getBuildingEntranceDir(newHouse, 0);
        const pathDir = doorDir.clone().lerp(this.wellDirection, 0.5).normalize();
        const pathYaw = this.computeYawFacingTarget(pathDir, this.wellDirection);
        this.placeStaticObject('path', pathDir, pathYaw, true, true);
        this.spawnVillager(this.getBuildingEntranceDir(newHouse, -0.014), false);
        this.spawnVillager(this.getBuildingEntranceDir(newHouse, 0.014), false);
        break;
      }
    }

    // 3. Plant 2 new trees and 1 flower cluster on open land
    for (let t = 0; t < 3; t++) {
      const randDir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() + 0.2,
      ).normalize();
      const surf = this.terrain.getSurfacePointAndNormal(randDir);
      if (!surf.isWater) {
        const kind: PlacedObjectType =
          t === 2
            ? 'flower'
            : surf.isBeach
              ? 'palm'
              : surf.isMountain
                ? 'pine'
                : 'oak';
        this.placeStaticObject(kind, randDir, Math.random() * Math.PI * 2, true, true);
      }
    }

    this.dayCount += 1;
    this.syncWorldStats();
  }

  public setTool(tool: ToolId) {
    this.activeTool = tool;
    this.onStateChange((prev) => ({ ...prev, activeTool: tool }));
  }

  public setTimeMode(mode: TimeMode) {
    this.timeMode = mode;
    if (mode === 'day') {
      this.timeOfDay = 0.22;
    } else if (mode === 'twilight') {
      this.timeOfDay = 0.52;
    } else if (mode === 'night') {
      this.timeOfDay = 0.78;
    }
    soundManager.playTimeChange(mode === 'night');
    this.onStateChange((prev) => ({
      ...prev,
      timeMode: mode,
      timeOfDay: this.timeOfDay,
    }));
  }

  public captureSnapshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  public setTimeOfDayManual(val: number) {
    this.timeMode = 'auto';
    this.timeOfDay = ((val % 1) + 1) % 1;
    this.onStateChange((prev) => ({
      ...prev,
      timeOfDay: this.timeOfDay,
    }));
  }

  public applyCameraPreset(view: CameraViewId, immediate = false) {
    this.activeView = view;
    if (view === 'orb') {
      // Slightly above and to the left, orb filling ~60% of image height
      this.camTargetPos.set(-1.12, 0.78, 4.35);
      this.camTargetLook.set(0.08, -0.22, 0.0);
    } else if (view === 'surface') {
      // Low horizon-skimming view across coastal beach, sea, and hills
      this.camTargetPos.set(0.62, 0.22, 1.44);
      this.camTargetLook.set(-0.12, 0.24, 0.62);
    } else if (view === 'orbit') {
      // Centered close planetary view for sculpting & building
      this.camTargetPos.set(0.0, 0.32, 2.58);
      this.camTargetLook.set(0.0, 0.0, 0.0);
    } else if (view === 'village') {
      // Intimate village-level view inspecting roof tiles, chimney rims, fence rails, and sails
      this.camTargetPos.set(-0.26, 0.34, 1.42);
      this.camTargetLook.set(-0.16, 0.18, 0.74);
    }

    if (immediate) {
      this.camCurrentPos.copy(this.camTargetPos);
      this.camCurrentLook.copy(this.camTargetLook);
      this.camera.position.copy(this.camCurrentPos);
      this.camera.lookAt(this.camCurrentLook);
    }

    this.onStateChange((prev) => ({ ...prev, activeView: view }));
  }

  private clearPreviousTourSpawns() {
    while (this.tourSpawnedCleanups.length > 0) {
      const fn = this.tourSpawnedCleanups.pop();
      if (fn) fn();
    }
  }

  private trackTourPlacedObject(entity: PlacedObjectEntity) {
    this.tourSpawnedCleanups.push(() => {
      const idx = this.placedObjects.indexOf(entity);
      if (idx !== -1) this.placedObjects.splice(idx, 1);
      this.objectsGroup.remove(entity.mesh);
    });
  }

  public startTour() {
    this.clearPreviousTourSpawns();
    this.tourActive = true;
    this.introSpinActive = false;
    this.tourElapsed = 0;
    this.tourStartTimeMs = performance.now();
    this.lastReportedTourRemaining = 30;
    this.tourStepTriggered.clear();
    this.cursorRing.visible = false;
    this.cursorRing.scale.setScalar(1.0);
    (this.cursorRing.material as THREE.MeshBasicMaterial).color.set('#fff8d6');

    // Reset planet orientation & camera to crisp morning establishing frame
    this.angularVelocity.set(0, 0);
    this.planetRoot.quaternion.identity();
    this.timeMode = 'auto';
    this.timeOfDay = 0.22;
    this.tourCursorDir.set(-0.16, 0.22, 0.96).normalize();

    this.camTargetPos.set(-0.85, 0.65, 4.15);
    this.camTargetLook.set(0.0, -0.10, 0.0);
    this.camCurrentPos.copy(this.camTargetPos);
    this.camCurrentLook.copy(this.camTargetLook);
    this.camera.position.copy(this.camCurrentPos);
    this.camera.lookAt(this.camCurrentLook);

    this.syncWorldStats();
    this.onStateChange((prev) => ({
      ...prev,
      tourActive: true,
      tourElapsed: 0,
      tourPhase: '第一幕：360° 全景巡礼',
    }));
  }

  public stopTour() {
    if (!this.tourActive) return;
    this.tourActive = false;
    this.cursorRing.visible = false;
    this.cursorRing.scale.setScalar(1.0);
    (this.cursorRing.material as THREE.MeshBasicMaterial).color.set('#fff8d6');
    this.applyCameraPreset(this.activeView, false);
    this.onStateChange((prev) => ({
      ...prev,
      tourActive: false,
      tourElapsed: 0,
      tourPhase: '',
    }));
  }

  private updateSimulatedTourCursor(
    t: number,
    fromTime: number,
    clickTime: number,
    fromDir: THREE.Vector3,
    targetDir: THREE.Vector3,
    isWaterTarget = false,
  ) {
    this.cursorRing.visible = true;
    const moveDuration = Math.max(0.15, clickTime - fromTime - 0.12);
    const moveProgress = THREE.MathUtils.clamp(
      (t - fromTime) / moveDuration,
      0,
      1,
    );
    const smoothMove = moveProgress * moveProgress * (3 - 2 * moveProgress);
    this.tourCursorDir.copy(fromDir).lerp(targetDir, smoothMove).normalize();

    this.orientObjectOnSurface(
      this.cursorRing,
      this.tourCursorDir,
      0,
      0.006,
      isWaterTarget,
    );

    // Visual click pulse right around clickTime
    const timeToClick = Math.abs(t - clickTime);
    const ringMat = this.cursorRing.material as THREE.MeshBasicMaterial;
    if (timeToClick < 0.18) {
      const pulse = 1.0 - timeToClick / 0.18;
      this.cursorRing.scale.setScalar(1.35 - pulse * 0.55);
      ringMat.color.set('#ffe066');
      ringMat.opacity = 0.98;
    } else {
      this.cursorRing.scale.setScalar(1.25 + Math.sin(t * 8.0) * 0.08);
      ringMat.color.set('#fff8d6');
      ringMat.opacity = 0.88;
    }
  }

  private updateTour(dt: number) {
    // Use exact wall-clock elapsed time so the tour lasts an exact 30.0 seconds
    this.tourElapsed = (performance.now() - this.tourStartTimeMs) / 1000;
    if (this.tourElapsed >= 30.0) {
      this.tourActive = false;
      this.cursorRing.visible = false;
      this.cursorRing.scale.setScalar(1.0);
      (this.cursorRing.material as THREE.MeshBasicMaterial).color.set('#fff8d6');
      this.applyCameraPreset('orb', false);
      this.onStateChange((prev) => ({
        ...prev,
        tourActive: false,
        tourElapsed: 30,
        tourPhase: '',
      }));
      return;
    }

    const t = this.tourElapsed;
    const remainingSec = Math.max(1, Math.ceil(30.0 - t));
    let currentPhase = '第一幕：360° 全景巡礼';
    if (t >= 23.0) currentPhase = '第四幕：璀璨夜幕与许愿流星';
    else if (t >= 15.0) currentPhase = '第三幕：创造与互动魔法';
    else if (t >= 8.0) currentPhase = '第二幕：生机盎然的田园村落';

    if (remainingSec !== this.lastReportedTourRemaining) {
      this.lastReportedTourRemaining = remainingSec;
      this.onStateChange((prev) => ({
        ...prev,
        tourElapsed: t,
        tourPhase: currentPhase,
      }));
    }

    const smoothstep = (val: number) => {
      const c = THREE.MathUtils.clamp(val, 0, 1);
      return c * c * (3 - 2 * c);
    };

    // Waypoint directions for Act III simulated clicks
    const startCursorSpot = new THREE.Vector3(-0.16, 0.22, 0.96).normalize();
    const windmillSpot = new THREE.Vector3(-0.22, 0.44, 0.87).normalize();
    const cottageSpot = new THREE.Vector3(-0.04, -0.02, 0.998).normalize();
    const lighthouseSpot = new THREE.Vector3(0.18, 0.52, 0.835).normalize();
    const sailboatSpot = new THREE.Vector3(0.42, 0.14, 0.896).normalize();
    const villagerSpot = new THREE.Vector3(-0.24, 0.16, 0.957).normalize();
    const sheepSpot = new THREE.Vector3(-0.18, -0.14, 0.974).normalize();
    const campfireSpot = new THREE.Vector3(-0.12, 0.08, 0.99).normalize();
    const snowCloudSpot = new THREE.Vector3(-0.26, 0.42, 0.87).normalize();
    const rainbowSpot = new THREE.Vector3(-0.37, 0.19, 0.95).normalize();
    const balloonSpot = new THREE.Vector3(-0.05, 0.18, 0.98).normalize();

    // =========================================================================
    // ACT I (0.0s – 8.0s): Grand Reveal & Full 360° Globe Orbit
    // =========================================================================
    if (t < 2.0) {
      // 0:00 – 0:02 | Morning Establishing Shot
      const p = smoothstep(t / 2.0);
      this.timeOfDay = THREE.MathUtils.lerp(0.22, 0.24, p);
      this.planetRoot.quaternion.identity();
      this.camTargetPos.set(
        THREE.MathUtils.lerp(-0.85, -0.45, p),
        THREE.MathUtils.lerp(0.65, 0.52, p),
        THREE.MathUtils.lerp(4.15, 3.85, p),
      );
      this.camTargetLook.set(0.0, -0.10, 0.0);
    } else if (t < 7.0) {
      // 0:02 – 0:07 | Full 360° Planetary Rotation showcasing all 4 neighborhoods & seas
      const p = smoothstep((t - 2.0) / 5.0);
      this.timeOfDay = THREE.MathUtils.lerp(0.24, 0.27, p);
      const spinAngle = p * Math.PI * 2;
      this.planetRoot.quaternion.setFromAxisAngle(UP_VEC, spinAngle);
      this.camTargetPos.set(
        THREE.MathUtils.lerp(-0.45, 0.0, p),
        THREE.MathUtils.lerp(0.52, 0.42, p),
        THREE.MathUtils.lerp(3.85, 3.45, p),
      );
      this.camTargetLook.set(0.0, -0.06, 0.0);
    } else if (t < 8.0) {
      // 0:07 – 0:08 | Settle Rotation & Zoom-In Transition toward Village
      const p = smoothstep((t - 7.0) / 1.0);
      this.timeOfDay = THREE.MathUtils.lerp(0.27, 0.28, p);
      this.planetRoot.quaternion.identity();
      this.camTargetPos.set(
        THREE.MathUtils.lerp(0.0, -0.28, p),
        THREE.MathUtils.lerp(0.42, 0.36, p),
        THREE.MathUtils.lerp(3.45, 1.52, p),
      );
      this.camTargetLook.set(
        THREE.MathUtils.lerp(0.0, -0.16, p),
        THREE.MathUtils.lerp(-0.06, 0.22, p),
        THREE.MathUtils.lerp(0.0, 0.72, p),
      );
    }
    // =========================================================================
    // ACT II (8.0s – 15.0s): Close-Up Living World Inspection
    // =========================================================================
    else if (t < 10.5) {
      // 0:08 – 0:10.5 | Focus 1 — Pastel Cottages, Multi-Layered Trees & Walking Villagers
      const p = smoothstep((t - 8.0) / 2.5);
      this.timeOfDay = THREE.MathUtils.lerp(0.28, 0.30, p);
      const yaw = THREE.MathUtils.lerp(0.0, 0.12, p);
      this.planetRoot.quaternion.setFromAxisAngle(UP_VEC, yaw);
      this.camTargetPos.set(
        THREE.MathUtils.lerp(-0.28, -0.12, p),
        THREE.MathUtils.lerp(0.36, 0.30, p),
        THREE.MathUtils.lerp(1.52, 1.44, p),
      );
      this.camTargetLook.set(
        THREE.MathUtils.lerp(-0.16, -0.14, p),
        THREE.MathUtils.lerp(0.22, 0.18, p),
        THREE.MathUtils.lerp(0.72, 0.74, p),
      );
    } else if (t < 13.0) {
      // 0:10.5 – 0:13.0 | Focus 2 — Fenced Sheep Pasture & Beehive Meadow
      const p = smoothstep((t - 10.5) / 2.5);
      this.timeOfDay = THREE.MathUtils.lerp(0.30, 0.32, p);
      const yaw = THREE.MathUtils.lerp(0.12, 0.18, p);
      this.planetRoot.quaternion.setFromAxisAngle(UP_VEC, yaw);
      this.camTargetPos.set(
        THREE.MathUtils.lerp(-0.12, -0.22, p),
        THREE.MathUtils.lerp(0.30, -0.14, p),
        THREE.MathUtils.lerp(1.44, 1.46, p),
      );
      this.camTargetLook.set(
        THREE.MathUtils.lerp(-0.14, -0.16, p),
        THREE.MathUtils.lerp(0.18, -0.12, p),
        THREE.MathUtils.lerp(0.74, 0.74, p),
      );
    } else if (t < 15.0) {
      // 0:13.0 – 0:15.0 | Focus 3 — Striped Coastal Lighthouse, Timber Pier, Sailboats & Ducks
      const p = smoothstep((t - 13.0) / 2.0);
      this.timeOfDay = THREE.MathUtils.lerp(0.32, 0.34, p);
      const yaw = THREE.MathUtils.lerp(0.18, -0.48, p);
      this.planetRoot.quaternion.setFromAxisAngle(UP_VEC, yaw);
      this.camTargetPos.set(
        THREE.MathUtils.lerp(-0.22, 0.22, p),
        THREE.MathUtils.lerp(-0.14, 0.26, p),
        THREE.MathUtils.lerp(1.46, 1.56, p),
      );
      this.camTargetLook.set(
        THREE.MathUtils.lerp(-0.16, 0.12, p),
        THREE.MathUtils.lerp(-0.12, 0.16, p),
        THREE.MathUtils.lerp(0.74, 0.72, p),
      );
    }
    // =========================================================================
    // ACT III (15.0s – 23.0s): Simulated Live Building & Interactive Spawning
    // =========================================================================
    else if (t < 17.0) {
      // 0:15.0 – 0:17.0 | Simulated Click 1 — Adding New Windmill & Pastel Cottage
      const p = smoothstep((t - 15.0) / 2.0);
      this.timeOfDay = THREE.MathUtils.lerp(0.34, 0.36, p);
      const yaw = THREE.MathUtils.lerp(-0.48, 0.08, p);
      this.planetRoot.quaternion.setFromAxisAngle(UP_VEC, yaw);
      this.camTargetPos.set(
        THREE.MathUtils.lerp(0.22, -0.18, p),
        THREE.MathUtils.lerp(0.26, 0.32, p),
        THREE.MathUtils.lerp(1.56, 1.68, p),
      );
      this.camTargetLook.set(
        THREE.MathUtils.lerp(0.12, -0.10, p),
        THREE.MathUtils.lerp(0.16, 0.16, p),
        THREE.MathUtils.lerp(0.72, 0.72, p),
      );

      if (t < 15.7) {
        this.updateSimulatedTourCursor(
          t,
          15.0,
          15.6,
          startCursorSpot,
          windmillSpot,
          false,
        );
      } else {
        this.updateSimulatedTourCursor(
          t,
          15.7,
          16.4,
          windmillSpot,
          cottageSpot,
          false,
        );
      }

      if (t >= 15.6 && !this.tourStepTriggered.has(1)) {
        this.tourStepTriggered.add(1);
        const wmYaw = this.computeYawFacingTarget(windmillSpot, this.wellDirection);
        const wm = this.placeStaticObject('windmill', windmillSpot, wmYaw, true, true);
        this.trackTourPlacedObject(wm);
        this.syncWorldStats();
      }

      if (t >= 16.4 && !this.tourStepTriggered.has(2)) {
        this.tourStepTriggered.add(2);
        const hYaw = this.computeYawFacingTarget(cottageSpot, this.wellDirection);
        const newHouse = this.placeStaticObject('house', cottageSpot, hYaw, true, true);
        this.trackTourPlacedObject(newHouse);
        const doorDir = this.getBuildingEntranceDir(newHouse, 0);
        const pathDir = doorDir.clone().lerp(this.wellDirection, 0.45).normalize();
        const pathYaw = this.computeYawFacingTarget(pathDir, this.wellDirection);
        const newPath = this.placeStaticObject('path', pathDir, pathYaw, true, true);
        this.trackTourPlacedObject(newPath);
        this.spawnVillager(this.getBuildingEntranceDir(newHouse, -0.014), true);
        const v1 = this.villagers[this.villagers.length - 1];
        this.spawnVillager(this.getBuildingEntranceDir(newHouse, 0.014), true);
        const v2 = this.villagers[this.villagers.length - 1];
        this.tourSpawnedCleanups.push(() => {
          for (const v of [v1, v2]) {
            const idx = this.villagers.indexOf(v);
            if (idx !== -1) this.villagers.splice(idx, 1);
            this.inhabitantsGroup.remove(v.mesh);
          }
        });
        this.syncWorldStats();
      }
    } else if (t < 19.0) {
      // 0:17.0 – 0:19.0 | Simulated Click 2 — Adding Second Cliffside Lighthouse & Sailboat
      const p = smoothstep((t - 17.0) / 2.0);
      this.timeOfDay = THREE.MathUtils.lerp(0.36, 0.38, p);
      const yaw = THREE.MathUtils.lerp(0.08, -0.35, p);
      this.planetRoot.quaternion.setFromAxisAngle(UP_VEC, yaw);
      this.camTargetPos.set(
        THREE.MathUtils.lerp(-0.18, 0.24, p),
        THREE.MathUtils.lerp(0.32, 0.34, p),
        THREE.MathUtils.lerp(1.68, 1.72, p),
      );
      this.camTargetLook.set(
        THREE.MathUtils.lerp(-0.10, 0.10, p),
        THREE.MathUtils.lerp(0.16, 0.22, p),
        THREE.MathUtils.lerp(0.72, 0.72, p),
      );

      if (t < 17.7) {
        this.updateSimulatedTourCursor(
          t,
          17.0,
          17.6,
          cottageSpot,
          lighthouseSpot,
          false,
        );
      } else {
        this.updateSimulatedTourCursor(
          t,
          17.7,
          18.4,
          lighthouseSpot,
          sailboatSpot,
          true,
        );
      }

      if (t >= 17.6 && !this.tourStepTriggered.has(3)) {
        this.tourStepTriggered.add(3);
        const lh = this.placeStaticObject('lighthouse', lighthouseSpot, -0.3, true, true);
        this.trackTourPlacedObject(lh);
        this.syncWorldStats();
      }

      if (t >= 18.4 && !this.tourStepTriggered.has(4)) {
        this.tourStepTriggered.add(4);
        this.spawnSailboat(sailboatSpot, true);
        const boat = this.sailboats[this.sailboats.length - 1];
        this.tourSpawnedCleanups.push(() => {
          const idx = this.sailboats.indexOf(boat);
          if (idx !== -1) this.sailboats.splice(idx, 1);
          this.inhabitantsGroup.remove(boat.mesh);
        });
        this.syncWorldStats();
      }
    } else if (t < 21.0) {
      // 0:19.0 – 0:21.0 | Simulated Click 3 — Spawning Villagers, Sheep, Campfire & Lantern
      const p = smoothstep((t - 19.0) / 2.0);
      this.timeOfDay = THREE.MathUtils.lerp(0.38, 0.41, p);
      const yaw = THREE.MathUtils.lerp(-0.35, 0.05, p);
      this.planetRoot.quaternion.setFromAxisAngle(UP_VEC, yaw);
      this.camTargetPos.set(
        THREE.MathUtils.lerp(0.24, -0.20, p),
        THREE.MathUtils.lerp(0.34, 0.20, p),
        THREE.MathUtils.lerp(1.72, 1.66, p),
      );
      this.camTargetLook.set(
        THREE.MathUtils.lerp(0.10, -0.14, p),
        THREE.MathUtils.lerp(0.22, 0.10, p),
        THREE.MathUtils.lerp(0.72, 0.74, p),
      );

      if (t < 19.5) {
        this.updateSimulatedTourCursor(
          t,
          19.0,
          19.4,
          sailboatSpot,
          villagerSpot,
          false,
        );
      } else if (t < 20.2) {
        this.updateSimulatedTourCursor(
          t,
          19.5,
          20.1,
          villagerSpot,
          sheepSpot,
          false,
        );
      } else {
        this.updateSimulatedTourCursor(
          t,
          20.2,
          20.7,
          sheepSpot,
          campfireSpot,
          false,
        );
      }

      if (t >= 19.4 && !this.tourStepTriggered.has(5)) {
        this.tourStepTriggered.add(5);
        this.spawnVillager(villagerSpot, true);
        const vA = this.villagers[this.villagers.length - 1];
        this.spawnVillager(
          new THREE.Vector3(-0.10, 0.14, 0.985).normalize(),
          true,
        );
        const vB = this.villagers[this.villagers.length - 1];
        this.tourSpawnedCleanups.push(() => {
          for (const v of [vA, vB]) {
            const idx = this.villagers.indexOf(v);
            if (idx !== -1) this.villagers.splice(idx, 1);
            this.inhabitantsGroup.remove(v.mesh);
          }
        });
        this.syncWorldStats();
      }

      if (t >= 20.1 && !this.tourStepTriggered.has(6)) {
        this.tourStepTriggered.add(6);
        this.spawnSheep(sheepSpot, true, true);
        const sA = this.sheepList[this.sheepList.length - 1];
        this.spawnSheep(
          new THREE.Vector3(-0.28, 0.02, 0.96).normalize(),
          true,
          false,
        );
        const sB = this.sheepList[this.sheepList.length - 1];
        this.tourSpawnedCleanups.push(() => {
          for (const s of [sA, sB]) {
            const idx = this.sheepList.indexOf(s);
            if (idx !== -1) this.sheepList.splice(idx, 1);
            this.inhabitantsGroup.remove(s.mesh);
          }
        });
        this.syncWorldStats();
      }

      if (t >= 20.7 && !this.tourStepTriggered.has(7)) {
        this.tourStepTriggered.add(7);
        const cf = this.placeStaticObject('campfire', campfireSpot, 0.4, true, true);
        this.trackTourPlacedObject(cf);
        const lp = this.placeStaticObject(
          'lantern',
          new THREE.Vector3(-0.24, 0.28, 0.93).normalize(),
          0.0,
          true,
          true,
        );
        this.trackTourPlacedObject(lp);
        this.syncWorldStats();
      }
    } else if (t < 23.0) {
      // 0:21.0 – 0:23.0 | Simulated Click 4 — Weather Magic: Snow/Rain Cloud, Rainbow Arch & Hot Air Balloon
      const p = smoothstep((t - 21.0) / 2.0);
      this.timeOfDay = THREE.MathUtils.lerp(0.41, 0.45, p);
      const yaw = THREE.MathUtils.lerp(0.05, 0.0, p);
      this.planetRoot.quaternion.setFromAxisAngle(UP_VEC, yaw);
      this.camTargetPos.set(
        THREE.MathUtils.lerp(-0.20, -0.16, p),
        THREE.MathUtils.lerp(0.20, 0.34, p),
        THREE.MathUtils.lerp(1.66, 2.15, p),
      );
      this.camTargetLook.set(
        THREE.MathUtils.lerp(-0.14, -0.08, p),
        THREE.MathUtils.lerp(0.10, 0.18, p),
        THREE.MathUtils.lerp(0.74, 0.55, p),
      );

      if (t < 21.4) {
        this.updateSimulatedTourCursor(
          t,
          21.0,
          21.3,
          campfireSpot,
          snowCloudSpot,
          false,
        );
      } else if (t < 22.0) {
        this.updateSimulatedTourCursor(
          t,
          21.4,
          21.9,
          snowCloudSpot,
          rainbowSpot,
          false,
        );
      } else if (t < 22.75) {
        this.updateSimulatedTourCursor(
          t,
          22.0,
          22.5,
          rainbowSpot,
          balloonSpot,
          false,
        );
      } else {
        this.cursorRing.visible = false;
      }

      if (t >= 21.3 && !this.tourStepTriggered.has(8)) {
        this.tourStepTriggered.add(8);
        this.spawnCloud(snowCloudSpot, true, 5.5, true);
        const snowCloud = this.clouds[this.clouds.length - 1];
        this.tourSpawnedCleanups.push(() => {
          const idx = this.clouds.indexOf(snowCloud);
          if (idx !== -1) this.clouds.splice(idx, 1);
          this.atmosphereGroup.remove(snowCloud.mesh);
        });
        if (this.clouds.length > 0) {
          this.clouds[0].currentDir.set(-0.12, 0.24, 0.96).normalize();
          this.clouds[0].isRaining = true;
          this.clouds[0].rainTimer = 4.5;
        }
        // Nourish existing trees with a joyful growth bounce
        for (const obj of this.placedObjects) {
          if (obj.type === 'oak' || obj.type === 'pine' || obj.type === 'palm') {
            obj.targetGrowth = Math.min(1.38, obj.targetGrowth + 0.16);
            obj.bounceTime = 0;
            obj.bounceActive = true;
          }
        }
        this.syncWorldStats();
      }

      if (t >= 21.9 && !this.tourStepTriggered.has(9)) {
        this.tourStepTriggered.add(9);
        const rb = this.placeStaticObject('rainbow', rainbowSpot, -0.25, true, true);
        this.trackTourPlacedObject(rb);
        this.syncWorldStats();
      }

      if (t >= 22.5 && !this.tourStepTriggered.has(10)) {
        this.tourStepTriggered.add(10);
        this.spawnBalloon(balloonSpot, true);
        const bal = this.balloons[this.balloons.length - 1];
        this.tourSpawnedCleanups.push(() => {
          const idx = this.balloons.indexOf(bal);
          if (idx !== -1) this.balloons.splice(idx, 1);
          this.atmosphereGroup.remove(bal.mesh);
        });
        this.syncWorldStats();
      }
    }
    // =========================================================================
    // ACT IV (23.0s – 30.0s): Golden Twilight, Nighttime Glow & Finale Pull-Back
    // =========================================================================
    else if (t < 26.5) {
      // 0:23.0 – 0:26.5 | Sunset to Blue Twilight & Night Transition (Windows, Campfires, Lighthouses & Fireflies ignite)
      this.cursorRing.visible = false;
      const p = smoothstep((t - 23.0) / 3.5);
      this.timeOfDay = THREE.MathUtils.lerp(0.45, 0.76, p);
      const yaw = THREE.MathUtils.lerp(0.0, -0.18, p);
      this.planetRoot.quaternion.setFromAxisAngle(UP_VEC, yaw);
      this.camTargetPos.set(
        THREE.MathUtils.lerp(-0.16, 0.18, p),
        THREE.MathUtils.lerp(0.34, 0.32, p),
        THREE.MathUtils.lerp(2.15, 2.35, p),
      );
      this.camTargetLook.set(
        THREE.MathUtils.lerp(-0.08, -0.04, p),
        THREE.MathUtils.lerp(0.18, 0.12, p),
        THREE.MathUtils.lerp(0.55, 0.42, p),
      );
    } else if (t < 28.5) {
      // 0:26.5 – 0:28.5 | Shooting Star Wonder Moment across the Starry Night Orb
      this.cursorRing.visible = false;
      const p = smoothstep((t - 26.5) / 2.0);
      this.timeOfDay = THREE.MathUtils.lerp(0.76, 0.80, p);
      const yaw = THREE.MathUtils.lerp(-0.18, -0.06, p);
      this.planetRoot.quaternion.setFromAxisAngle(UP_VEC, yaw);
      this.camTargetPos.set(
        THREE.MathUtils.lerp(0.18, -0.35, p),
        THREE.MathUtils.lerp(0.32, 0.48, p),
        THREE.MathUtils.lerp(2.35, 2.95, p),
      );
      this.camTargetLook.set(
        THREE.MathUtils.lerp(-0.04, -0.02, p),
        THREE.MathUtils.lerp(0.12, 0.05, p),
        THREE.MathUtils.lerp(0.42, 0.25, p),
      );

      if (t >= 26.6 && !this.tourStepTriggered.has(11)) {
        this.tourStepTriggered.add(11);
        this.spawnShootingStar(new THREE.Vector3(-0.22, 0.52, 0.82).normalize());
      }
      if (t >= 27.4 && !this.tourStepTriggered.has(12)) {
        this.tourStepTriggered.add(12);
        this.spawnShootingStar(new THREE.Vector3(0.25, 0.48, 0.84).normalize());
      }
    } else {
      // 0:28.5 – 0:30.0 | Grand Finale Pull-Back to Full Glass Orb Hero Framing
      this.cursorRing.visible = false;
      const p = smoothstep((t - 28.5) / 1.5);
      this.timeOfDay = THREE.MathUtils.lerp(0.80, 0.82, p);
      const yaw = THREE.MathUtils.lerp(-0.06, 0.0, p);
      this.planetRoot.quaternion.setFromAxisAngle(UP_VEC, yaw);
      this.camTargetPos.set(
        THREE.MathUtils.lerp(-0.35, -1.12, p),
        THREE.MathUtils.lerp(0.48, 0.78, p),
        THREE.MathUtils.lerp(2.95, 4.35, p),
      );
      this.camTargetLook.set(
        THREE.MathUtils.lerp(-0.02, 0.08, p),
        THREE.MathUtils.lerp(0.05, -0.22, p),
        THREE.MathUtils.lerp(0.25, 0.0, p),
      );
    }
  }

  private syncWorldStats() {
    const houses = this.placedObjects.filter((o) => o.type === 'house').length;
    const trees = this.placedObjects.filter(
      (o) => o.type === 'oak' || o.type === 'pine' || o.type === 'palm',
    ).length;
    const sakura = this.placedObjects.filter((o) => o.type === 'sakura').length;
    const windmills = this.placedObjects.filter((o) => o.type === 'windmill').length;
    const lighthouses = this.placedObjects.filter(
      (o) => o.type === 'lighthouse' || o.type === 'watchtower',
    ).length;
    const torii = this.placedObjects.filter((o) => o.type === 'torii').length;
    const onsen = this.placedObjects.filter((o) => o.type === 'onsen').length;
    const crystals = this.placedObjects.filter((o) => o.type === 'crystal').length;
    const pavilions = this.placedObjects.filter((o) => o.type === 'pavilion').length;
    const flowers = this.placedObjects.filter(
      (o) => o.type === 'flower' || o.type === 'beehive',
    ).length;
    const rainbows = this.placedObjects.filter((o) => o.type === 'rainbow').length;
    const campfires = this.placedObjects.filter((o) => o.type === 'campfire').length;
    const villagers = this.villagers.length;
    const sheep = this.sheepList.length;
    const deer = this.deerList.length;
    const clouds = this.clouds.length;
    const boats = this.sailboats.length + this.ducks.length;

    const happiness = Math.min(
      100,
      Math.round(
        78 +
          houses * 2 +
          trees * 0.6 +
          sakura * 1.5 +
          flowers * 1.2 +
          windmills * 3 +
          lighthouses * 2 +
          torii * 3 +
          onsen * 3 +
          crystals * 2 +
          pavilions * 3 +
          rainbows * 4 +
          campfires * 2 +
          deer * 1.8 +
          boats * 1.5,
      ),
    );

    this.onStateChange((prev) => ({
      ...prev,
      population: villagers,
      happiness,
      dayCount: this.dayCount,
      objectCounts: {
        houses,
        trees,
        sakura,
        windmills,
        lighthouses,
        villagers,
        sheep,
        deer,
        clouds,
        flowers,
        boats,
        torii,
        onsen,
        crystals,
        pavilions,
      },
    }));
  }

  private bindEvents() {
    const dom = this.renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();

    const updateNDC = (e: PointerEvent) => {
      const rect = dom.getBoundingClientRect();
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const getTerrainHit = (e: PointerEvent) => {
      updateNDC(e);
      raycaster.setFromCamera(pointerNDC, this.camera);
      const hits = raycaster.intersectObjects(
        [this.terrain.terrainMesh, this.terrain.waterMesh],
        false,
      );
      if (hits.length > 0) {
        const worldPt = hits[0].point.clone();
        const localPt = this.planetRoot.worldToLocal(worldPt);
        return localPt.normalize();
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.button !== 2) return;
      if (this.tourActive) return;
      this.isPointerDown = true;
      this.isDraggingSpin = false;
      this.pointerDownPos.set(e.clientX, e.clientY);
      this.lastPointerPos.set(e.clientX, e.clientY);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (this.tourActive) {
        return;
      }
      const hitDir = getTerrainHit(e);
      if (hitDir && !this.isDraggingSpin) {
        this.cursorRing.visible = true;
        const surf = this.terrain.getSurfacePointAndNormal(hitDir);
        this.orientObjectOnSurface(
          this.cursorRing,
          hitDir,
          0,
          0.004,
          surf.isWater,
        );
      } else {
        this.cursorRing.visible = false;
      }

      if (!this.isPointerDown) return;

      const dx = e.clientX - this.lastPointerPos.x;
      const dy = e.clientY - this.lastPointerPos.y;
      const totalDist = Math.hypot(
        e.clientX - this.pointerDownPos.x,
        e.clientY - this.pointerDownPos.y,
      );

      if (totalDist > 5) {
        this.isDraggingSpin = true;
        this.cursorRing.visible = false;
      }

      if (this.isDraggingSpin) {
        // Spin the planet with gentle inertia
        this.angularVelocity.x = dx * 0.0055;
        this.angularVelocity.y = dy * 0.0055;
        this.applyPlanetSpin(this.angularVelocity.x, this.angularVelocity.y);
      }

      this.lastPointerPos.set(e.clientX, e.clientY);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!this.isPointerDown) return;
      this.isPointerDown = false;

      if (!this.isDraggingSpin && e.button === 0) {
        const hitDir = getTerrainHit(e);
        if (hitDir) {
          this.handleSurfaceAction(hitDir);
        }
      }
      this.isDraggingSpin = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (this.tourActive) return;
      const zoomDir = this.camTargetPos
        .clone()
        .sub(this.camTargetLook)
        .normalize();
      const dist = this.camTargetPos.distanceTo(this.camTargetLook);
      const nextDist = THREE.MathUtils.clamp(
        dist + e.deltaY * 0.0022,
        1.15,
        5.6,
      );
      this.camTargetPos
        .copy(this.camTargetLook)
        .addScaledVector(zoomDir, nextDist);
    };

    const onResize = () => {
      if (!this.container) return;
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      onResize();
    });
    resizeObserver.observe(this.container);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.tourActive) {
        this.stopTour();
      }
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKeyDown);

    // Save cleanup reference
    (this as unknown as { _cleanup: () => void })._cleanup = () => {
      resizeObserver.disconnect();
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
    };
  }

  private applyPlanetSpin(deltaYaw: number, deltaPitch: number) {
    const qYaw = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      deltaYaw,
    );
    const qPitch = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      deltaPitch,
    );
    this.planetRoot.quaternion.premultiply(qYaw).premultiply(qPitch);
  }

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.getElapsedTime();

    if (this.shootingStarGazeTimer > 0) {
      this.shootingStarGazeTimer = Math.max(0, this.shootingStarGazeTimer - dt);
    }

    // 1. Tour or Auto Time-of-Day advancement
    if (this.tourActive) {
      this.updateTour(dt);
    } else if (this.timeMode === 'auto') {
      const prevTime = this.timeOfDay;
      this.timeOfDay = (this.timeOfDay + dt * 0.014) % 1.0;
      if (this.timeOfDay < prevTime) {
        this.dayCount += 1;
        this.syncWorldStats();
      }
    }

    // 2. Initial 3-second 360° spin on load, then pause and zoom out a bit
    if (this.introSpinActive) {
      if (this.isDraggingSpin || this.tourActive) {
        this.introSpinActive = false;
      } else {
        this.introSpinElapsed += dt;
        if (this.introSpinElapsed < 3.0) {
          const progress = this.introSpinElapsed / 3.0;
          const angle = progress * Math.PI * 2;
          this.planetRoot.quaternion.setFromAxisAngle(UP_VEC, angle);
        } else {
          // Complete 360° turn, pause rotation, and zoom out a bit
          this.introSpinActive = false;
          this.planetRoot.quaternion.identity();
          this.angularVelocity.set(0, 0);

          const zoomDir = this.camTargetPos
            .clone()
            .sub(this.camTargetLook)
            .normalize();
          const currentDist = this.camTargetPos.distanceTo(this.camTargetLook);
          this.camTargetPos
            .copy(this.camTargetLook)
            .addScaledVector(zoomDir, currentDist * 1.14);
        }
      }
    } else if (!this.isPointerDown && !this.tourActive) {
      // Planet rotational inertia when not actively dragging
      if (this.angularVelocity.lengthSq() > 1e-7) {
        this.applyPlanetSpin(this.angularVelocity.x, this.angularVelocity.y);
        this.angularVelocity.multiplyScalar(0.94); // Gentle inertia damping
      }
    }

    // 3. Smooth Camera Interpolation
    this.camCurrentPos.lerp(this.camTargetPos, 1.0 - Math.exp(-dt * 4.5));
    this.camCurrentLook.lerp(this.camTargetLook, 1.0 - Math.exp(-dt * 4.5));
    this.camera.position.copy(this.camCurrentPos);
    this.camera.lookAt(this.camCurrentLook);

    // 4. Compute Day / Blue Twilight / Night factors from timeOfDay (0..1)
    const t = this.timeOfDay;
    let dayFactor = 0;
    let twilightFactor = 0;
    let nightFactor = 0;

    if (t < 0.38) {
      dayFactor = 1.0;
    } else if (t < 0.54) {
      const p = (t - 0.38) / 0.16;
      dayFactor = 1.0 - p;
      twilightFactor = p;
    } else if (t < 0.68) {
      const p = (t - 0.54) / 0.14;
      twilightFactor = 1.0 - p;
      nightFactor = p;
    } else if (t < 0.88) {
      nightFactor = 1.0;
    } else {
      const p = (t - 0.88) / 0.12;
      nightFactor = 1.0 - p;
      dayFactor = p;
    }

    // 5. Orbit the Little Sun & Pale Moon on opposing sides of a tilted curved path
    const orbitAngle = (t - 0.22) * Math.PI * 2;
    const orbitRadius = 1.24; // Inside the 1.50 glass orb
    const sunPos = new THREE.Vector3(
      Math.sin(orbitAngle) * orbitRadius,
      Math.cos(orbitAngle) * orbitRadius * 0.72 + 0.12,
      Math.cos(orbitAngle) * orbitRadius * 0.68,
    );
    const moonPos = sunPos.clone().negate();

    this.sunGroup.position.copy(sunPos);
    this.sunGroup.lookAt(0, 0, 0);
    const sunRayCrown = this.sunGroup.getObjectByName('sunRayCrown');
    if (sunRayCrown) {
      sunRayCrown.rotation.z = elapsed * 0.45;
    }
    const sunAstrolabeRing = this.sunGroup.getObjectByName('sunAstrolabeRing');
    if (sunAstrolabeRing) {
      sunAstrolabeRing.rotation.x = 0.65 + Math.sin(elapsed * 0.8) * 0.25;
      sunAstrolabeRing.rotation.y = elapsed * 0.6;
    }

    this.sunLight.position.copy(sunPos);
    this.moonGroup.position.copy(moonPos);
    const moonBody = this.moonGroup.getObjectByName('moonBody');
    if (moonBody) {
      moonBody.rotation.y = elapsed * 0.22;
    }
    const moonStarlets = this.moonGroup.getObjectByName('moonStarlets');
    if (moonStarlets) {
      moonStarlets.rotation.y = -elapsed * 0.65;
      moonStarlets.rotation.z = Math.sin(elapsed * 0.9) * 0.18;
    }
    this.moonLight.position.copy(moonPos);

    // Update lighting intensities for Day, Blue Twilight, and Night
    this.sunLight.intensity = 1.95 * dayFactor + 0.75 * twilightFactor;
    this.sunLight.color.setRGB(
      1.0,
      THREE.MathUtils.lerp(0.95, 0.68, twilightFactor),
      THREE.MathUtils.lerp(0.78, 0.45, twilightFactor),
    );

    // Moon illuminates silver edges on terrain at night
    this.moonLight.intensity = 1.35 * nightFactor + 0.45 * twilightFactor;

    // Room evening window light & interior fill darken in Night mode
    this.roomWindowLight.intensity =
      1.35 * dayFactor + 0.65 * twilightFactor + 0.18 * nightFactor;
    this.roomAmbientLight.intensity =
      0.55 * dayFactor + 0.38 * twilightFactor + 0.22 * nightFactor;
    this.roomHemiLight.intensity =
      0.52 * dayFactor + 0.44 * twilightFactor + 0.28 * nightFactor;

    this.roomEnv.updateTimeOfDay(dayFactor, twilightFactor, nightFactor, elapsed);
    this.terrain.update(elapsed, dt, nightFactor);

    // 6. Update Placed Objects (Bounce, Windmill, Windows, Lighthouse, Campfire, Watchtower Flag, Butterflies)
    const warmGlowFactor = Math.min(1.0, twilightFactor * 0.85 + nightFactor * 1.0);

    for (const obj of this.placedObjects) {
      if (Math.abs(obj.growth - obj.targetGrowth) > 0.001) {
        obj.growth = THREE.MathUtils.lerp(obj.growth, obj.targetGrowth, dt * 3.5);
      }

      let bounceScale = 1.0;
      if (obj.bounceActive) {
        obj.bounceTime += dt;
        if (obj.bounceTime < 0.65) {
          const p = obj.bounceTime / 0.65;
          bounceScale =
            1.0 - Math.exp(-p * 6.0) * Math.cos(p * Math.PI * 3.5) * 0.65;
        } else {
          obj.bounceActive = false;
        }
      }
      obj.mesh.scale.setScalar(obj.growth * bounceScale);

      if (obj.windmillRotor) {
        obj.windmillRotor.rotation.z -= dt * 1.15;
      }

      if (obj.windowMaterials) {
        const emIntensity = 0.15 + warmGlowFactor * 2.1;
        for (const wm of obj.windowMaterials) {
          wm.emissiveIntensity = emIntensity;
        }
      }

      if (obj.lighthouseBeamPivot && obj.lighthouseConeMats && obj.lighthousePointLight) {
        if (this.tourActive && this.tourElapsed >= 27.0) {
          // Smoothly align the lighthouse beam perpendicular to the camera's view ray and tower axis
          // so the searchlight is strictly 90° perpendicular to the lighthouse in both 3D and 2D screen space at 0:29
          obj.mesh.updateMatrixWorld(true);
          const worldQuat = new THREE.Quaternion();
          obj.mesh.getWorldQuaternion(worldQuat);
          const lanternWorldPos = new THREE.Vector3(0, 0.14, 0).applyMatrix4(
            obj.mesh.matrixWorld,
          );
          const viewDir = lanternWorldPos
            .clone()
            .sub(this.camera.position)
            .normalize();
          const towerUpWorld = new THREE.Vector3(0, 1, 0)
            .applyQuaternion(worldQuat)
            .normalize();
          const perpWorld = new THREE.Vector3()
            .crossVectors(towerUpWorld, viewDir)
            .normalize();
          const perpLocal = perpWorld
            .clone()
            .applyQuaternion(worldQuat.clone().invert());
          const targetRotY = Math.atan2(perpLocal.x, perpLocal.z);

          const angleDiff =
            (((targetRotY - obj.lighthouseBeamPivot.rotation.y) % Math.PI) +
              Math.PI * 1.5) %
              Math.PI -
            Math.PI * 0.5;
          obj.lighthouseBeamPivot.rotation.y +=
            angleDiff * Math.min(1.0, dt * 6.5);
        } else {
          obj.lighthouseBeamPivot.rotation.y += dt * 1.25;
        }
        const beamOpacity = warmGlowFactor * 0.42;
        for (const cm of obj.lighthouseConeMats) {
          cm.opacity = beamOpacity;
        }
        obj.lighthousePointLight.intensity = warmGlowFactor * 0.85;
      }

      // Campfire crackling flames, rising ember particles & warm orange glow
      if (obj.campfireFlameGroup && obj.campfireEmbers && obj.campfireLight) {
        const flicker = 1.0 + Math.sin(elapsed * 18.0 + obj.yaw) * 0.16;
        obj.campfireFlameGroup.scale.set(
          1.0 + Math.cos(elapsed * 14.0) * 0.1,
          flicker,
          1.0 + Math.sin(elapsed * 16.0) * 0.1,
        );
        obj.campfireLight.intensity = (0.38 + warmGlowFactor * 0.95) * flicker;

        const emberPos = obj.campfireEmbers.geometry.attributes.position;
        for (let i = 0; i < emberPos.count; i++) {
          let y = emberPos.getY(i) + dt * 0.032;
          if (y > 0.058) y = 0.01;
          const x = Math.sin(elapsed * 5.0 + i * 2.1) * 0.006;
          const z = Math.cos(elapsed * 4.5 + i * 1.7) * 0.006;
          emberPos.setXYZ(i, x, y, z);
        }
        emberPos.needsUpdate = true;
      }

      // Stone Watchtower waving pennant flag
      if (obj.watchtowerFlag) {
        obj.watchtowerFlag.rotation.y =
          Math.sin(elapsed * 5.2 + obj.yaw) * 0.24;
      }

      // Beehive fluttering butterflies & golden bees
      if (obj.butterflySwarm) {
        obj.butterflySwarm.rotation.y = elapsed * 1.4;
        obj.butterflySwarm.children.forEach((bPivot, idx) => {
          bPivot.position.y =
            0.008 + Math.sin(elapsed * 4.2 + idx * 1.6) * 0.008;
          const flap = Math.sin(elapsed * 22.0 + idx) * 0.55;
          if (bPivot.children[0]) bPivot.children[0].rotation.y = 0.4 + flap;
          if (bPivot.children[1]) bPivot.children[1].rotation.y = -0.4 - flap;
        });
      }

      // Sakura falling blossom petals
      if (obj.petalParticles) {
        obj.petalParticles.rotation.y = elapsed * 0.22;
        const pAttr = obj.petalParticles.geometry.attributes.position;
        for (let i = 0; i < pAttr.count; i++) {
          let y = pAttr.getY(i) - dt * 0.014;
          if (y < 0.004) y = 0.065;
          pAttr.setY(i, y);
        }
        pAttr.needsUpdate = true;
      }

      // Hot spring rising thermal steam
      if (obj.steamParticles) {
        obj.steamParticles.rotation.y = elapsed * 0.32;
        const sAttr = obj.steamParticles.geometry.attributes.position;
        for (let i = 0; i < sAttr.count; i++) {
          let y = sAttr.getY(i) + dt * 0.024;
          if (y > 0.058) y = 0.012;
          sAttr.setY(i, y);
        }
        sAttr.needsUpdate = true;
      }

      // Crystal pulsating glow and point light
      if (obj.crystalMat && obj.crystalLight) {
        const pulse = 0.45 + Math.sin(elapsed * 2.5 + obj.yaw) * 0.3;
        obj.crystalMat.emissiveIntensity = pulse;
        obj.crystalLight.intensity = (0.35 + pulse * 0.55) * (0.3 + nightFactor * 0.95);
      }

      // Pavilion interior lantern night glow
      if (obj.pavilionLanternLight) {
        obj.pavilionLanternLight.intensity = 0.15 + warmGlowFactor * 0.85;
      }
    }

    // 7. Update Villagers traveling between homes, stone well, bridges & campfires
    //    with look-ahead tangent steering around buildings/fences & hard non-penetration physics
    const bridgesAndDocks = this.placedObjects.filter(
      (o) => o.type === 'bridge' || o.type === 'dock',
    );
    const villagerRadius = 0.012;

    for (const v of this.villagers) {
      if (this.shootingStarGazeTimer > 0) {
        // Stop, look up at the sky, and wave excitedly while watching the shooting star!
        v.bodyMesh.position.y = Math.abs(Math.sin(elapsed * 10.0)) * 0.0025;
        v.headGroup.rotation.x = THREE.MathUtils.lerp(
          v.headGroup.rotation.x,
          -0.42,
          dt * 6.0,
        );
        v.leftLeg.rotation.x = 0;
        v.rightLeg.rotation.x = 0;
        v.leftArm.rotation.x = 0;
        v.rightArm.rotation.x = -2.4 + Math.sin(elapsed * 14.0) * 0.35;
        continue;
      }

      if (v.pauseTimer > 0) {
        v.pauseTimer -= dt;
        v.bodyMesh.position.y = 0;
        v.leftLeg.rotation.x = THREE.MathUtils.lerp(v.leftLeg.rotation.x, 0, dt * 8);
        v.rightLeg.rotation.x = THREE.MathUtils.lerp(v.rightLeg.rotation.x, 0, dt * 8);
        v.leftArm.rotation.x = THREE.MathUtils.lerp(v.leftArm.rotation.x, 0, dt * 8);
        v.rightArm.rotation.x = THREE.MathUtils.lerp(v.rightArm.rotation.x, 0, dt * 8);
        v.headGroup.rotation.x = THREE.MathUtils.lerp(v.headGroup.rotation.x, 0, dt * 6);
        v.headGroup.rotation.y = Math.sin(elapsed * 2.2 + v.walkPhase) * 0.25;
        continue;
      }

      const distToTarget = v.dir.distanceTo(v.targetDir);
      if (distToTarget < 0.026) {
        v.headingToWell = !v.headingToWell;
        v.targetDir = this.pickNextVillagerTarget(v.headingToWell, v.dir);
        v.pauseTimer = 0.9 + Math.random() * 1.4;
        v.stuckTimer = 0;
        continue;
      }

      const prevDir = v.dir.clone();
      const surfBefore = this.terrain.getSurfacePointAndNormal(v.dir);

      // Desired tangent direction toward target on local surface plane
      const desiredTangent = v.targetDir
        .clone()
        .sub(v.dir)
        .projectOnPlane(surfBefore.normal)
        .normalize();

      // Compute smooth look-ahead obstacle avoidance steering vector around buildings, trees & fences
      const steerVec = desiredTangent.clone();
      const signHint = v.steerSign || 1;

      for (const obj of this.placedObjects) {
        if (obj.type === 'fence') {
          const { segA, segB, railAxis } = this.getFenceSegmentOnSphere(obj);
          const closest = this.closestPointOnSphereSegment(v.dir, segA, segB);
          const dFence = v.dir.distanceTo(closest);
          const minClear = 0.015 + villagerRadius;
          const avoidDist = minClear + 0.036;
          if (dFence < avoidDist && dFence > 1e-6) {
            const awayNormal = v.dir
              .clone()
              .sub(closest)
              .projectOnPlane(surfBefore.normal)
              .normalize();
            const alongRail =
              railAxis.dot(desiredTangent) >= 0
                ? railAxis.clone()
                : railAxis.clone().negate();
            const weight = Math.pow(
              1.0 - Math.max(0, dFence - minClear) / (avoidDist - minClear),
              1.35,
            );
            steerVec.addScaledVector(alongRail, weight * 1.65);
            steerVec.addScaledVector(awayNormal, weight * 1.25);
          }
          continue;
        }

        if (obj.type === 'rainbow') {
          const [footA, footB] = this.getRainbowFootDirs(obj.dir, obj.yaw);
          for (const footDir of [footA, footB]) {
            const dFoot = v.dir.distanceTo(footDir);
            const minClear = 0.026 + villagerRadius;
            const avoidDist = minClear + 0.042;
            if (dFoot < avoidDist && dFoot > 1e-6) {
              const away = v.dir
                .clone()
                .sub(footDir)
                .projectOnPlane(surfBefore.normal)
                .normalize();
              const weight = Math.pow(
                1.0 - Math.max(0, dFoot - minClear) / (avoidDist - minClear),
                1.35,
              );
              steerVec.addScaledVector(away, weight * 1.5);
            }
          }
          continue;
        }

        const obsR = this.getObjectCollisionRadius(obj.type);
        if (obsR <= 0) continue;

        const dObs = v.dir.distanceTo(obj.dir);
        const minClear = obsR + villagerRadius;
        const avoidDist = minClear + 0.048;

        if (dObs < avoidDist && dObs > 1e-6) {
          const toObs = obj.dir
            .clone()
            .sub(v.dir)
            .projectOnPlane(surfBefore.normal);
          const toObsNorm = toObs.clone().normalize();
          const approaching = toObsNorm.dot(desiredTangent);

          // Steer around the building if it lies in our forward hemisphere or we are very close
          if (approaching > -0.15 || dObs < minClear + 0.014) {
            const tangentLeft = new THREE.Vector3()
              .crossVectors(surfBefore.normal, toObsNorm)
              .normalize();
            const dotLeft = tangentLeft.dot(desiredTangent);
            const chosenTangent =
              Math.abs(dotLeft) > 0.08
                ? dotLeft >= 0
                  ? tangentLeft
                  : tangentLeft.clone().negate()
                : tangentLeft.clone().multiplyScalar(signHint);
            const awayRadial = toObsNorm.clone().negate();

            const weight = Math.pow(
              1.0 - Math.max(0, dObs - minClear) / (avoidDist - minClear),
              1.35,
            );
            steerVec.addScaledVector(chosenTangent, weight * 1.85);
            steerVec.addScaledVector(awayRadial, weight * 1.15);
          }
        }
      }

      // Also steer around the fenced sheep pasture corral
      const dPasture = v.dir.distanceTo(this.pastureCenter);
      const pastureClear = this.pastureRadius + villagerRadius + 0.008;
      const pastureAvoid = pastureClear + 0.044;
      if (dPasture < pastureAvoid && dPasture > 1e-6) {
        const toPasture = this.pastureCenter
          .clone()
          .sub(v.dir)
          .projectOnPlane(surfBefore.normal)
          .normalize();
        if (toPasture.dot(desiredTangent) > -0.1 || dPasture < pastureClear + 0.01) {
          const tangentLeft = new THREE.Vector3()
            .crossVectors(surfBefore.normal, toPasture)
            .normalize();
          const chosenTangent =
            tangentLeft.dot(desiredTangent) >= 0
              ? tangentLeft
              : tangentLeft.clone().negate();
          const weight = Math.pow(
            1.0 - Math.max(0, dPasture - pastureClear) / (pastureAvoid - pastureClear),
            1.35,
          );
          steerVec.addScaledVector(chosenTangent, weight * 1.85);
          steerVec.addScaledVector(toPasture.clone().negate(), weight * 1.25);
        }
      }

      // Personal-space steering around other villagers
      for (const other of this.villagers) {
        if (other === v) continue;
        const dOther = v.dir.distanceTo(other.dir);
        if (dOther < 0.028 && dOther > 1e-6) {
          const away = v.dir
            .clone()
            .sub(other.dir)
            .projectOnPlane(surfBefore.normal)
            .normalize();
          steerVec.addScaledVector(away, ((0.028 - dOther) / 0.028) * 0.9);
        }
      }

      steerVec.projectOnPlane(surfBefore.normal).normalize();
      if (steerVec.lengthSq() < 1e-6) {
        steerVec.copy(desiredTangent);
      }

      // Advance along steered tangent vector
      v.dir.addScaledVector(steerVec, v.speed * dt).normalize();

      // Enforce hard non-penetration constraints against all buildings, fences, water & cliffs
      this.resolveVillagerCollisions(v, bridgesAndDocks, prevDir);

      // Watchdog: if blocked from making progress for too long, choose a new clear target
      const actualStep = v.dir.distanceTo(prevDir);
      if (actualStep < v.speed * dt * 0.18) {
        v.stuckTimer = (v.stuckTimer || 0) + dt;
        if (v.stuckTimer > 1.1) {
          v.steerSign = -(v.steerSign || 1);
          v.headingToWell = !v.headingToWell;
          v.targetDir = this.pickNextVillagerTarget(v.headingToWell, v.dir);
          v.stuckTimer = 0;
        }
      } else {
        v.stuckTimer = Math.max(0, (v.stuckTimer || 0) - dt * 0.5);
      }

      const surf = this.terrain.getSurfacePointAndNormal(v.dir);
      const bridgeObj = bridgesAndDocks.find(
        (b) => b.dir.distanceTo(v.dir) < 0.056,
      );

      v.walkPhase += dt * 13.5;
      const stride = Math.sin(v.walkPhase);
      const hop = Math.abs(stride) * 0.0032;

      // Swing articulated legs & arms in opposition
      v.leftLeg.rotation.x = stride * 0.58;
      v.rightLeg.rotation.x = -stride * 0.58;
      v.leftArm.rotation.x = -stride * 0.46;
      v.rightArm.rotation.x = stride * 0.46;
      v.headGroup.rotation.x = Math.abs(stride) * 0.08;
      v.headGroup.rotation.y = 0;

      let basePt = surf.point;
      if (bridgeObj) {
        const dRatio = THREE.MathUtils.clamp(
          v.dir.distanceTo(bridgeObj.dir) / 0.048,
          0,
          1,
        );
        const deckHeight =
          bridgeObj.type === 'bridge'
            ? 0.015 + (1.0 - dRatio * dRatio) * 0.017
            : 0.019;
        basePt = v.dir
          .clone()
          .multiplyScalar(Math.max(surf.radius, this.terrain.seaLevel + deckHeight));
      }
      v.mesh.position.copy(basePt).addScaledVector(surf.normal, hop);

      const actualMoveTangent = v.dir
        .clone()
        .sub(prevDir)
        .projectOnPlane(surf.normal);
      const faceTangent =
        actualMoveTangent.lengthSq() > 1e-7
          ? actualMoveTangent.normalize()
          : steerVec;

      if (faceTangent.lengthSq() > 1e-5) {
        const alignQuat = new THREE.Quaternion().setFromUnitVectors(
          UP_VEC,
          surf.normal,
        );
        const invAlign = alignQuat.clone().invert();
        const localTangent = faceTangent.clone().applyQuaternion(invAlign);
        const targetYaw = Math.atan2(localTangent.x, localTangent.z);
        // Smooth angular turn so villagers don't snap-spin around corners
        let diff = targetYaw - v.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        v.yaw += diff * Math.min(1.0, dt * 10.0);
        const yawQuat = new THREE.Quaternion().setFromAxisAngle(UP_VEC, v.yaw);
        v.mesh.quaternion.copy(alignQuat).multiply(yawQuat);
      }
    }

    // 8. Update White Sheep grazing inside the fenced pasture & respecting all fences/structures
    const pRight = new THREE.Vector3()
      .crossVectors(UP_VEC, this.pastureCenter)
      .normalize();
    const pUp = new THREE.Vector3()
      .crossVectors(this.pastureCenter, pRight)
      .normalize();

    for (const s of this.sheepList) {
      s.grazeTimer -= dt;
      if (s.grazeTimer <= 0) {
        s.isGrazing = !s.isGrazing;
        s.grazeTimer = s.isGrazing
          ? 2.0 + Math.random() * 2.5
          : 2.2 + Math.random() * 2.0;
        if (!s.isGrazing) {
          if (s.inPasture) {
            // Pick a random grazing spot strictly inside the fenced sheep pasture corral
            const maxR = this.pastureRadius - 0.025;
            for (let attempt = 0; attempt < 12; attempt++) {
              const angle = Math.random() * Math.PI * 2;
              const r = (0.15 + Math.random() * 0.85) * maxR;
              const candidate = this.pastureCenter
                .clone()
                .addScaledVector(pRight, Math.cos(angle) * r)
                .addScaledVector(pUp, Math.sin(angle) * r)
                .normalize();
              if (this.isPositionClearOfObstacles(candidate, 0.012, true)) {
                s.targetDir.copy(candidate);
                break;
              }
            }
          } else {
            // Free-range sheep placed outside the pasture corral
            for (let attempt = 0; attempt < 12; attempt++) {
              const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 0.14,
                (Math.random() - 0.5) * 0.14,
                (Math.random() - 0.5) * 0.14,
              );
              const candidate = s.dir.clone().add(offset).normalize();
              if (this.isPositionClearOfObstacles(candidate, 0.014, false)) {
                s.targetDir.copy(candidate);
                break;
              }
            }
          }
        }
      }

      // Cute wagging woolly tail
      s.tailMesh.rotation.y = Math.sin(elapsed * 8.5 + s.walkPhase) * 0.32;

      if (s.isGrazing) {
        s.headGroup.rotation.x =
          0.48 + Math.sin(elapsed * 7.0 + s.walkPhase) * 0.14;
        for (const leg of s.legs) {
          leg.rotation.x = THREE.MathUtils.lerp(leg.rotation.x, 0, dt * 8);
        }
      } else {
        s.headGroup.rotation.x = THREE.MathUtils.lerp(
          s.headGroup.rotation.x,
          0.0,
          dt * 6.0,
        );
        const dist = s.dir.distanceTo(s.targetDir);
        if (dist > 0.008) {
          const prevSheepDir = s.dir.clone();
          s.dir
            .lerp(s.targetDir, (s.speed * dt) / Math.max(dist, 0.01))
            .normalize();

          // Enforce fence rail collision, pasture containment, building collision & flock separation
          const hitBoundary = this.resolveSheepCollisions(s, prevSheepDir);
          if (hitBoundary) {
            // Pick a fresh grazing point away from the fence/obstacle
            s.targetDir.copy(
              s.inPasture ? this.pastureCenter : prevSheepDir,
            );
          }

          s.walkPhase += dt * 12.0;
          const stride = Math.sin(s.walkPhase);
          const hop = Math.abs(stride) * 0.0025;

          // Quadruped diagonal trot leg swing
          if (s.legs.length === 4) {
            s.legs[0].rotation.x = stride * 0.45;
            s.legs[1].rotation.x = -stride * 0.45;
            s.legs[2].rotation.x = -stride * 0.45;
            s.legs[3].rotation.x = stride * 0.45;
          }

          const surf = this.terrain.getSurfacePointAndNormal(s.dir);
          s.mesh.position.copy(surf.point).addScaledVector(surf.normal, hop);

          const moveTangent = s.targetDir
            .clone()
            .sub(s.dir)
            .projectOnPlane(surf.normal)
            .normalize();
          const alignQuat = new THREE.Quaternion().setFromUnitVectors(
            UP_VEC,
            surf.normal,
          );
          if (moveTangent.lengthSq() > 1e-5) {
            const invAlign = alignQuat.clone().invert();
            const localTangent = moveTangent.clone().applyQuaternion(invAlign);
            const targetYaw = Math.atan2(localTangent.x, localTangent.z);
            let diff = targetYaw - s.yaw;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            s.yaw += diff * Math.min(1.0, dt * 8.0);
          }
          const yawQuat = new THREE.Quaternion().setFromAxisAngle(UP_VEC, s.yaw);
          s.mesh.quaternion.copy(alignQuat).multiply(yawQuat);
        } else {
          s.isGrazing = true;
          s.grazeTimer = 1.8 + Math.random() * 2.2;
        }
      }
    }

    // 8.5 Update Graceful Forest Deer (grazing, walking across hills, tail wag)
    for (const d of this.deerList) {
      if (d.bounceTime < 0.65) {
        d.bounceTime += dt;
        const p = d.bounceTime / 0.65;
        const scale = 1.0 - Math.exp(-p * 6.0) * Math.cos(p * Math.PI * 3.5) * 0.65;
        d.mesh.scale.setScalar(scale);
      } else {
        d.mesh.scale.setScalar(1.0);
      }

      d.grazeTimer -= dt;
      if (d.grazeTimer <= 0) {
        d.isGrazing = !d.isGrazing;
        d.grazeTimer = d.isGrazing
          ? 2.2 + Math.random() * 3.2
          : 3.5 + Math.random() * 3.8;
        if (!d.isGrazing) {
          // Pick a scenic meadow/hill spot
          for (let attempt = 0; attempt < 8; attempt++) {
            const wander = d.dir.clone().add(new THREE.Vector3(
              (Math.random() - 0.5) * 0.45,
              (Math.random() - 0.5) * 0.45,
              (Math.random() - 0.5) * 0.45
            )).normalize();
            const surf = this.terrain.getSurfacePointAndNormal(wander);
            if (!surf.isWater && surf.normal.dot(wander) > 0.65) {
              d.targetDir.copy(wander);
              break;
            }
          }
        }
      }

      // Wagging tail
      d.tailMesh.rotation.y = Math.sin(elapsed * 6.0 + d.walkPhase) * 0.28;

      if (d.isGrazing) {
        d.headGroup.rotation.x = THREE.MathUtils.lerp(
          d.headGroup.rotation.x,
          0.52 + Math.sin(elapsed * 5.0 + d.walkPhase) * 0.12,
          dt * 4.0,
        );
        for (const leg of d.legs) {
          leg.rotation.x = THREE.MathUtils.lerp(leg.rotation.x, 0, dt * 8);
        }
      } else {
        d.headGroup.rotation.x = THREE.MathUtils.lerp(
          d.headGroup.rotation.x,
          0.05,
          dt * 5.0,
        );
        const dist = d.dir.distanceTo(d.targetDir);
        if (dist > 0.012) {
          d.dir.lerp(d.targetDir, (d.speed * dt) / Math.max(dist, 0.01)).normalize();
          d.walkPhase += dt * 10.0;
          const stride = Math.sin(d.walkPhase);
          const hop = Math.abs(stride) * 0.003;

          if (d.legs.length === 4) {
            d.legs[0].rotation.x = stride * 0.42;
            d.legs[1].rotation.x = -stride * 0.42;
            d.legs[2].rotation.x = -stride * 0.42;
            d.legs[3].rotation.x = stride * 0.42;
          }

          const surf = this.terrain.getSurfacePointAndNormal(d.dir);
          d.mesh.position.copy(surf.point).addScaledVector(surf.normal, hop);

          const moveTangent = d.targetDir
            .clone()
            .sub(d.dir)
            .projectOnPlane(surf.normal)
            .normalize();
          const alignQuat = new THREE.Quaternion().setFromUnitVectors(
            UP_VEC,
            surf.normal,
          );
          if (moveTangent.lengthSq() > 1e-5) {
            const invAlign = alignQuat.clone().invert();
            const localTangent = moveTangent.clone().applyQuaternion(invAlign);
            const targetYaw = Math.atan2(localTangent.x, localTangent.z);
            let diff = targetYaw - d.yaw;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            d.yaw += diff * Math.min(1.0, dt * 6.0);
          }
          const yawQuat = new THREE.Quaternion().setFromAxisAngle(UP_VEC, d.yaw);
          d.mesh.quaternion.copy(alignQuat).multiply(yawQuat);
        } else {
          d.isGrazing = true;
          d.grazeTimer = 2.0 + Math.random() * 2.5;
        }
      }
    }

    // 9. Update Sailboats bobbing & sailing across turquoise seas (avoiding docks, bridges & shorelines)
    for (const b of this.sailboats) {
      b.lanternMat.emissiveIntensity = 0.2 + warmGlowFactor * 2.3;

      const dist = b.dir.distanceTo(b.targetDir);
      if (dist < 0.03) {
        b.targetDir = this.pickRandomWaterTarget(b.dir);
      } else {
        const nextDir = b.dir
          .clone()
          .lerp(b.targetDir, (b.speed * dt) / Math.max(dist, 0.01))
          .normalize();
        const surf = this.terrain.getSurfacePointAndNormal(nextDir);
        const hitsPier = bridgesAndDocks.some(
          (pier) => pier.dir.distanceTo(nextDir) < 0.052,
        );
        const hitsOtherBoat = this.sailboats.some(
          (other) => other !== b && other.dir.distanceTo(nextDir) < 0.048,
        );

        if (surf.isWater && !hitsPier && !hitsOtherBoat) {
          const tangent = b.targetDir
            .clone()
            .sub(b.dir)
            .projectOnPlane(nextDir)
            .normalize();
          if (tangent.lengthSq() > 1e-5) {
            b.yaw = Math.atan2(tangent.x, tangent.z);
          }
          b.dir.copy(nextDir);
        } else {
          b.targetDir = this.pickRandomWaterTarget(b.dir);
        }
      }

      const bobOffset = Math.sin(elapsed * 2.6 + b.bobPhase) * 0.0022;
      this.orientObjectOnSurface(b.mesh, b.dir, b.yaw, bobOffset, true);
      b.hullGroup.rotation.z = Math.sin(elapsed * 2.1 + b.bobPhase) * 0.085;
      b.hullGroup.rotation.x = Math.cos(elapsed * 1.8 + b.bobPhase) * 0.05;
    }

    // 10. Update Paddling Swans & Ducks with expanding water ripple rings (avoiding docks & boats)
    for (const d of this.ducks) {
      const dist = d.dir.distanceTo(d.targetDir);
      if (dist < 0.025) {
        d.targetDir = this.pickRandomWaterTarget(d.dir);
      } else {
        const nextDir = d.dir
          .clone()
          .lerp(d.targetDir, (d.speed * dt) / Math.max(dist, 0.01))
          .normalize();
        const surf = this.terrain.getSurfacePointAndNormal(nextDir);
        const hitsPier = bridgesAndDocks.some(
          (pier) => pier.dir.distanceTo(nextDir) < 0.044,
        );
        const hitsBoat = this.sailboats.some(
          (boat) => boat.dir.distanceTo(nextDir) < 0.045,
        );

        if (surf.isWater && !hitsPier && !hitsBoat) {
          const tangent = d.targetDir
            .clone()
            .sub(d.dir)
            .projectOnPlane(nextDir)
            .normalize();
          if (tangent.lengthSq() > 1e-5) {
            d.yaw = Math.atan2(tangent.x, tangent.z);
          }
          d.dir.copy(nextDir);
        } else {
          d.targetDir = this.pickRandomWaterTarget(d.dir);
        }
      }

      const bobOffset = Math.sin(elapsed * 3.4 + d.bobPhase) * 0.0012;
      this.orientObjectOnSurface(d.mesh, d.dir, d.yaw, bobOffset, true);

      d.rippleRings.forEach((ring, idx) => {
        const rippleCycle = (elapsed * 0.85 + idx * 0.5 + d.bobPhase) % 1.0;
        const scale = 0.8 + rippleCycle * 1.45;
        ring.scale.setScalar(scale);
        (ring.material as THREE.MeshBasicMaterial).opacity =
          (1.0 - rippleCycle) * 0.45;
      });
    }

    // 11. Update Hot Air Balloons floating in the upper atmosphere
    for (const bal of this.balloons) {
      const qStep = new THREE.Quaternion().setFromAxisAngle(
        bal.orbitAxis,
        bal.orbitSpeed * dt,
      );
      bal.currentDir.applyQuaternion(qStep).normalize();
      const alt =
        bal.baseAltitude + Math.sin(elapsed * 1.2 + bal.phase) * 0.018;
      bal.mesh.position.copy(bal.currentDir).multiplyScalar(alt);
      bal.mesh.quaternion.setFromUnitVectors(UP_VEC, bal.currentDir);

      // Periodic golden burner flame puff
      const burnerPulse =
        Math.max(0, Math.sin(elapsed * 2.4 + bal.phase * 2.0)) * 1.8;
      bal.burnerMat.emissiveIntensity = 0.7 + burnerPulse + warmGlowFactor * 1.1;
    }

    // 12. Update Puffy Rain Clouds & Frosty Snow Clouds
    for (const c of this.clouds) {
      const qStep = new THREE.Quaternion().setFromAxisAngle(
        c.orbitAxis,
        c.orbitSpeed * dt,
      );
      c.currentDir.applyQuaternion(qStep).normalize();
      c.mesh.position.copy(c.currentDir).multiplyScalar(c.altitude);
      c.mesh.quaternion.setFromUnitVectors(UP_VEC, c.currentDir);

      c.rainTimer -= dt;
      if (c.rainTimer <= 0) {
        c.isRaining = !c.isRaining;
        c.rainTimer = c.isRaining
          ? 5.2 + Math.random() * 2.5
          : 6.5 + Math.random() * 4.5;
      }

      if (c.isSnow && c.snowPoints && c.snowMat) {
        const targetSnowOpacity = c.isRaining ? 0.88 : 0.0;
        c.snowMat.opacity = THREE.MathUtils.lerp(
          c.snowMat.opacity,
          targetSnowOpacity,
          dt * 4.0,
        );
        if (c.isRaining) {
          c.snowPoints.position.y = -((elapsed * 0.14) % 0.06);
          c.snowPoints.rotation.y = elapsed * 0.8;
          this.terrain.applySnowAtDirection(c.currentDir, dt);
        }
      } else {
        const targetRainOpacity = c.isRaining ? 0.65 : 0.0;
        c.rainMat.opacity = THREE.MathUtils.lerp(
          c.rainMat.opacity,
          targetRainOpacity,
          dt * 4.0,
        );

        if (c.isRaining) {
          c.rainLines.position.y = -((elapsed * 0.38) % 0.06);
          this.terrain.applyRainAtDirection(c.currentDir, dt);

          for (const obj of this.placedObjects) {
            if (obj.type === 'oak' || obj.type === 'pine' || obj.type === 'palm') {
              if (obj.dir.distanceTo(c.currentDir) < 0.28 && obj.targetGrowth < 1.38) {
                obj.targetGrowth = Math.min(1.38, obj.targetGrowth + dt * 0.09);
              }
            }
          }
        }
      }
    }

    // 13. Update Shooting Stars streaking across the upper orb sky
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const st = this.shootingStars[i];
      st.age += dt;
      if (st.age >= st.maxAge) {
        this.atmosphereGroup.remove(st.mesh);
        this.shootingStars.splice(i, 1);
        continue;
      }

      const prevPos = st.currentDir.clone().multiplyScalar(st.altitude);
      const qStep = new THREE.Quaternion().setFromAxisAngle(
        st.orbitAxis,
        st.speed * dt,
      );
      st.currentDir.applyQuaternion(qStep).normalize();
      const nextPos = st.currentDir.clone().multiplyScalar(st.altitude);

      st.mesh.position.copy(nextPos);
      const velDir = nextPos.clone().sub(prevPos).normalize();
      if (velDir.lengthSq() > 1e-5) {
        const targetLook = nextPos.clone().add(velDir);
        st.mesh.lookAt(targetLook);
      }

      const fade = 1.0 - Math.pow(st.age / st.maxAge, 2.0);
      st.mesh.scale.setScalar(Math.max(0.01, fade));

      st.sparkleTimer += dt;
      if (st.sparkleTimer > 0.09) {
        st.sparkleTimer = 0;
        this.emitSparklesAtDir(st.currentDir, '#fff4b8', st.altitude);
      }
    }

    // 14. Update Drifting Fireflies inside the glass orb in Night / Twilight mode
    const fireflyAlpha = Math.max(0, nightFactor * 0.92 + twilightFactor * 0.35);
    this.firefliesMat.opacity = fireflyAlpha;
    if (fireflyAlpha > 0.01) {
      const posAttr = this.firefliesPoints.geometry.attributes.position;
      for (let i = 0; i < this.firefliesBasePositions.length; i++) {
        const base = this.firefliesBasePositions[i];
        const x = base.x + Math.sin(elapsed * 1.1 + i * 1.7) * 0.055;
        const y = base.y + Math.cos(elapsed * 0.9 + i * 2.3) * 0.055;
        const z = base.z + Math.sin(elapsed * 1.3 + i * 0.9) * 0.055;
        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;
    }

    // 15. Update Sparkle Bursts
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const b = this.sparkles[i];
      b.age += dt;
      if (b.age >= b.maxAge) {
        this.effectsGroup.remove(b.points);
        b.points.geometry.dispose();
        (b.points.material as THREE.Material).dispose();
        this.sparkles.splice(i, 1);
        continue;
      }
      const posAttr = b.points.geometry.attributes.position;
      for (let k = 0; k < b.velocities.length; k++) {
        const vx = posAttr.getX(k) + b.velocities[k].x * dt;
        const vy = posAttr.getY(k) + b.velocities[k].y * dt;
        const vz = posAttr.getZ(k) + b.velocities[k].z * dt;
        posAttr.setXYZ(k, vx, vy, vz);
      }
      posAttr.needsUpdate = true;
      (b.points.material as THREE.PointsMaterial).opacity =
        1.0 - b.age / b.maxAge;
    }

    // 16. Update Dynamic Weather & Atmospheric Swirling Particles
    this.updateDynamicWeather(dt, elapsed);

    this.renderer.render(this.scene, this.camera);
  };

  private updateDynamicWeather(dt: number, elapsed: number) {
    if (!this.dynamicWeatherPoints || !this.dynamicWeatherMat) return;

    // Detect weather or nature tool
    const tool = this.activeTool;
    let targetMode: 'rain' | 'snow' | 'stardust' | 'sakura' | 'leaves' | 'none' = 'none';

    if (tool === 'cloud') {
      targetMode = 'rain';
    } else if (tool === 'snowcloud') {
      targetMode = 'snow';
    } else if (tool === 'rainbow' || tool === 'shootingstar') {
      targetMode = 'stardust';
    } else if (tool === 'sakura') {
      targetMode = 'sakura';
    } else if (tool === 'tree') {
      targetMode = 'leaves';
    }

    const isWeatherToolActive = targetMode !== 'none';
    const targetOpacity = isWeatherToolActive ? 0.88 : 0.0;
    this.dynamicWeatherMat.opacity = THREE.MathUtils.lerp(
      this.dynamicWeatherMat.opacity,
      targetOpacity,
      dt * 3.5,
    );

    if (this.dynamicWeatherMat.opacity < 0.01) return;

    const posAttr = this.dynamicWeatherPoints.geometry.attributes.position;
    const colAttr = this.dynamicWeatherPoints.geometry.attributes.color;
    const count = this.dynamicWeatherCount;

    for (let i = 0; i < count; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);

      if (targetMode === 'rain') {
        // Dynamic falling raindrops
        y -= (0.28 + (i % 5) * 0.05) * dt * 2.2;
        x += Math.sin(elapsed * 2.5 + i) * 0.002;
        z += Math.cos(elapsed * 2.5 + i) * 0.002;
        colAttr.setXYZ(i, 0.58, 0.78, 1.0);
      } else if (targetMode === 'snow') {
        // Swirling gentle snowflakes
        y -= (0.05 + (i % 4) * 0.015) * dt * 1.5;
        x += Math.sin(elapsed * 1.5 + i * 0.4) * dt * 0.06;
        z += Math.cos(elapsed * 1.5 + i * 0.4) * dt * 0.06;
        colAttr.setXYZ(i, 0.95, 0.98, 1.0);
      } else if (targetMode === 'stardust') {
        // Twinkling prismatic rainbow stardust
        y += Math.sin(elapsed * 2.5 + i) * dt * 0.04;
        const angle = elapsed * 0.8 + (i / count) * Math.PI * 2;
        const radius = 0.88 + (i % 6) * 0.08;
        x = THREE.MathUtils.lerp(x, Math.cos(angle) * radius, dt * 2.0);
        z = THREE.MathUtils.lerp(z, Math.sin(angle) * radius, dt * 2.0);
        const hue = (elapsed * 0.25 + i * 0.08) % 1.0;
        const c = new THREE.Color().setHSL(hue, 0.85, 0.7);
        colAttr.setXYZ(i, c.r, c.g, c.b);
      } else if (targetMode === 'sakura') {
        // Swirling pink blossom petals vortex
        const vortexSpeed = 0.75 + (i % 4) * 0.15;
        const angle = elapsed * vortexSpeed + (i / count) * Math.PI * 2;
        const r = 0.86 + (i % 7) * 0.07;
        y -= (0.04 + (i % 3) * 0.02) * dt;
        x = THREE.MathUtils.lerp(x, Math.cos(angle) * r, dt * 3.5);
        z = THREE.MathUtils.lerp(z, Math.sin(angle) * r, dt * 3.5);
        const pinkTone =
          i % 3 === 0
            ? [1.0, 0.72, 0.84]
            : i % 3 === 1
              ? [0.96, 0.45, 0.71]
              : [1.0, 0.82, 0.92];
        colAttr.setXYZ(i, pinkTone[0], pinkTone[1], pinkTone[2]);
      } else if (targetMode === 'leaves') {
        // Swirling autumn & woodland leaves
        const windGust = elapsed * 0.9 + i * 0.35;
        x += Math.sin(windGust) * dt * 0.12;
        z += Math.cos(windGust * 0.8) * dt * 0.12;
        y -= (0.05 + (i % 5) * 0.015) * dt;
        const leafColor =
          i % 3 === 0
            ? [0.96, 0.62, 0.04]
            : i % 3 === 1
              ? [0.92, 0.34, 0.05]
              : [0.4, 0.64, 0.1];
        colAttr.setXYZ(i, leafColor[0], leafColor[1], leafColor[2]);
      }

      // Check bounds within glass orb: respawn if fallen below or inside planet core
      const dist = Math.sqrt(x * x + y * y + z * z);
      if (dist < 0.75 || dist > 1.38 || y < -1.1 || y > 1.38) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 0.85 + Math.random() * 0.45;
        const sinPhi = Math.sin(phi);
        x = r * sinPhi * Math.cos(theta);
        y =
          targetMode === 'rain'
            ? 0.95 + Math.random() * 0.35
            : r * sinPhi * Math.sin(theta);
        z = r * Math.cos(phi);
      }

      posAttr.setXYZ(i, x, y, z);
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  private resolveVillagerCollisions(
    v: VillagerEntity,
    bridgesAndDocks: PlacedObjectEntity[],
    fallbackDir?: THREE.Vector3,
  ) {
    const villagerRadius = 0.012;

    // 3-pass position-based non-penetration constraint solver
    for (let pass = 0; pass < 3; pass++) {
      // 1. Solid Buildings, Trees, Wells, Campfires, Beehives, Lanterns & Fences
      for (const obj of this.placedObjects) {
        if (obj.type === 'fence') {
          const { segA, segB } = this.getFenceSegmentOnSphere(obj);
          const closest = this.closestPointOnSphereSegment(v.dir, segA, segB);
          const minFenceDist = 0.015 + villagerRadius;
          const dist = v.dir.distanceTo(closest);
          if (dist < minFenceDist) {
            const pushDir =
              dist > 1e-6
                ? v.dir.clone().sub(closest).normalize()
                : v.dir.clone().sub(this.pastureCenter).normalize();
            v.dir
              .copy(closest)
              .addScaledVector(pushDir, minFenceDist + 0.001)
              .normalize();
          }
          continue;
        }

        if (obj.type === 'rainbow') {
          const [footA, footB] = this.getRainbowFootDirs(obj.dir, obj.yaw);
          for (const footDir of [footA, footB]) {
            const minFootDist = 0.028 + villagerRadius;
            const dFoot = v.dir.distanceTo(footDir);
            if (dFoot < minFootDist) {
              const pushDir =
                dFoot > 1e-6
                  ? v.dir.clone().sub(footDir).normalize()
                  : new THREE.Vector3(1, 0, 0);
              v.dir
                .copy(footDir)
                .addScaledVector(pushDir, minFootDist + 0.001)
                .normalize();
            }
          }
          continue;
        }

        const obsR = this.getObjectCollisionRadius(obj.type);
        if (obsR <= 0) continue;

        const minDist = obsR + villagerRadius;
        const dist = v.dir.distanceTo(obj.dir);
        if (dist < minDist) {
          const pushDir =
            dist > 1e-6
              ? v.dir.clone().sub(obj.dir).normalize()
              : new THREE.Vector3(1, 0, 0);
          v.dir
            .copy(obj.dir)
            .addScaledVector(pushDir, minDist + 0.001)
            .normalize();
        }
      }

      // 2. Keep villagers outside the fenced sheep pasture corral
      const dPasture = v.dir.distanceTo(this.pastureCenter);
      const minPastureDist = this.pastureRadius + villagerRadius + 0.006;
      if (dPasture < minPastureDist) {
        const pushOut =
          dPasture > 1e-6
            ? v.dir.clone().sub(this.pastureCenter).normalize()
            : new THREE.Vector3(0, 1, 0);
        v.dir
          .copy(this.pastureCenter)
          .addScaledVector(pushOut, minPastureDist + 0.001)
          .normalize();
      }

      // 3. Villager-to-Villager personal space separation
      for (const other of this.villagers) {
        if (other === v) continue;
        const minSep = 0.020;
        const d = v.dir.distanceTo(other.dir);
        if (d < minSep && d > 1e-6) {
          const push = v.dir.clone().sub(other.dir).normalize();
          const overlap = (minSep - d) * 0.5;
          v.dir.addScaledVector(push, overlap).normalize();
        }
      }

      // 4. Villager-to-Sheep separation
      for (const s of this.sheepList) {
        const minSep = 0.022;
        const d = v.dir.distanceTo(s.dir);
        if (d < minSep && d > 1e-6) {
          const push = v.dir.clone().sub(s.dir).normalize();
          v.dir.addScaledVector(push, minSep - d).normalize();
        }
      }
    }

    // 5. Enforce water & sheer cliff constraints
    const surf = this.terrain.getSurfacePointAndNormal(v.dir);
    const onBridge = bridgesAndDocks.some(
      (b) => b.dir.distanceTo(v.dir) < 0.058,
    );
    const isTooSteep = surf.normal.dot(v.dir) < 0.74;

    if ((surf.isWater && !onBridge) || surf.isMountain || isTooSteep) {
      if (fallbackDir) {
        v.dir.copy(fallbackDir);
      }
      v.targetDir = this.pickNextVillagerTarget(true);
    }
  }

  private resolveSheepCollisions(
    s: SheepEntity,
    fallbackDir?: THREE.Vector3,
  ): boolean {
    const sheepRadius = 0.013;
    let hitBoundary = false;

    for (let pass = 0; pass < 3; pass++) {
      // 1. Continuous Pasture Corral Containment for pasture sheep
      if (s.inPasture) {
        const maxInsideDist = this.pastureRadius - sheepRadius - 0.008;
        const dCenter = s.dir.distanceTo(this.pastureCenter);
        if (dCenter > maxInsideDist && dCenter > 1e-6) {
          const fromCenter = s.dir
            .clone()
            .sub(this.pastureCenter)
            .normalize();
          s.dir
            .copy(this.pastureCenter)
            .addScaledVector(fromCenter, maxInsideDist)
            .normalize();
          hitBoundary = true;
        }
      } else {
        // Free-range sheep outside the corral cannot walk through the fence into the corral
        const minOutsideDist = this.pastureRadius + sheepRadius + 0.008;
        const dCenter = s.dir.distanceTo(this.pastureCenter);
        if (dCenter < minOutsideDist && dCenter > 1e-6) {
          const fromCenter = s.dir
            .clone()
            .sub(this.pastureCenter)
            .normalize();
          s.dir
            .copy(this.pastureCenter)
            .addScaledVector(fromCenter, minOutsideDist)
            .normalize();
          hitBoundary = true;
        }
      }

      // 2. Individual Fence Segment Capsule Colliders & Solid Buildings/Trees
      for (const obj of this.placedObjects) {
        if (obj.type === 'fence') {
          const { segA, segB } = this.getFenceSegmentOnSphere(obj);
          const closest = this.closestPointOnSphereSegment(s.dir, segA, segB);
          const minFenceDist = 0.015 + sheepRadius;
          const dist = s.dir.distanceTo(closest);
          if (dist < minFenceDist) {
            const pushDir =
              dist > 1e-6
                ? s.dir.clone().sub(closest).normalize()
                : this.pastureCenter.clone().sub(closest).normalize();
            s.dir
              .copy(closest)
              .addScaledVector(pushDir, minFenceDist + 0.001)
              .normalize();
            hitBoundary = true;
          }
          continue;
        }

        if (obj.type === 'rainbow') {
          const [footA, footB] = this.getRainbowFootDirs(obj.dir, obj.yaw);
          for (const footDir of [footA, footB]) {
            const minFootDist = 0.028 + sheepRadius;
            const dFoot = s.dir.distanceTo(footDir);
            if (dFoot < minFootDist) {
              const pushDir =
                dFoot > 1e-6
                  ? s.dir.clone().sub(footDir).normalize()
                  : new THREE.Vector3(1, 0, 0);
              s.dir
                .copy(footDir)
                .addScaledVector(pushDir, minFootDist + 0.001)
                .normalize();
              hitBoundary = true;
            }
          }
          continue;
        }

        const obsR = this.getObjectCollisionRadius(obj.type);
        if (obsR <= 0) continue;

        const minDist = obsR + sheepRadius;
        const dist = s.dir.distanceTo(obj.dir);
        if (dist < minDist) {
          const pushDir =
            dist > 1e-6
              ? s.dir.clone().sub(obj.dir).normalize()
              : new THREE.Vector3(1, 0, 0);
          s.dir
            .copy(obj.dir)
            .addScaledVector(pushDir, minDist + 0.001)
            .normalize();
          hitBoundary = true;
        }
      }

      // 3. Sheep-to-Sheep flock separation
      for (const other of this.sheepList) {
        if (other === s) continue;
        const minSep = 0.024;
        const d = s.dir.distanceTo(other.dir);
        if (d < minSep && d > 1e-6) {
          const push = s.dir.clone().sub(other.dir).normalize();
          s.dir.addScaledVector(push, (minSep - d) * 0.5).normalize();
        }
      }
    }

    // 4. Prevent sheep from entering water or steep mountain cliffs
    const surf = this.terrain.getSurfacePointAndNormal(s.dir);
    if (surf.isWater || surf.isMountain || surf.normal.dot(s.dir) < 0.75) {
      if (fallbackDir) {
        s.dir.copy(fallbackDir);
      }
      hitBoundary = true;
    }

    return hitBoundary;
  }

  public dispose() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    const cleanup = (this as unknown as { _cleanup?: () => void })._cleanup;
    if (cleanup) cleanup();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
