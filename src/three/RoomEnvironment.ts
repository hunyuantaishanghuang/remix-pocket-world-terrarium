import * as THREE from 'three';
import {
  createChalkyWindowsillTextures,
  createLinenTextures,
  createWalnutTextures,
} from '../utils/textures';

export interface RoomEnvironmentHandles {
  group: THREE.Group;
  orbGlassMaterial: THREE.ShaderMaterial;
  skyMaterial: THREE.ShaderMaterial;
  updateTimeOfDay: (
    dayFactor: number,
    twilightFactor: number,
    nightFactor: number,
    elapsedTime: number,
  ) => void;
}

export function createRoomEnvironment(
  envMap: THREE.Texture,
): RoomEnvironmentHandles {
  const group = new THREE.Group();

  const walnutTex = createWalnutTextures();
  const linenTex = createLinenTextures();
  const chalkTex = createChalkyWindowsillTextures();

  // ---------------------------------------------------------------------------
  // 1. LAVENDER EVENING SKY BACKDROP (smoothly transitions Day -> Twilight -> Night)
  // ---------------------------------------------------------------------------
  const skyGeo = new THREE.SphereGeometry(28, 48, 32);
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uDayFactor: { value: 1.0 },
      uTwilightFactor: { value: 0.0 },
      uNightFactor: { value: 0.0 },
      uTime: { value: 0.0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vWorldPos;
      varying vec2 vUv;
      uniform float uDayFactor;
      uniform float uTwilightFactor;
      uniform float uNightFactor;
      uniform float uTime;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      void main() {
        vec3 dir = normalize(vWorldPos);
        float h = clamp(dir.y * 0.65 + 0.35, 0.0, 1.0);

        // Evening Lavender Sky (Default / Day state)
        vec3 dayBottom = vec3(0.88, 0.76, 0.84); // Warm rosy-lavender horizon
        vec3 dayMid    = vec3(0.68, 0.60, 0.79); // Soft lavender evening sky
        vec3 dayTop    = vec3(0.45, 0.39, 0.61); // Deeper twilight violet zenith
        vec3 dayCol = mix(dayBottom, dayMid, smoothstep(0.0, 0.48, h));
        dayCol = mix(dayCol, dayTop, smoothstep(0.48, 1.0, h));

        // Blue Twilight Sky
        vec3 twiBottom = vec3(0.56, 0.45, 0.66); // Warm dusk band
        vec3 twiMid    = vec3(0.24, 0.31, 0.52); // Deep cobalt-blue twilight
        vec3 twiTop    = vec3(0.12, 0.16, 0.32); // Indigo zenith
        vec3 twiCol = mix(twiBottom, twiMid, smoothstep(0.0, 0.45, h));
        twiCol = mix(twiCol, twiTop, smoothstep(0.45, 1.0, h));

        // Night Sky
        vec3 nightBottom = vec3(0.12, 0.14, 0.25);
        vec3 nightMid    = vec3(0.07, 0.09, 0.17);
        vec3 nightTop    = vec3(0.03, 0.04, 0.09);
        vec3 nightCol = mix(nightBottom, nightMid, smoothstep(0.0, 0.45, h));
        nightCol = mix(nightCol, nightTop, smoothstep(0.45, 1.0, h));

        vec3 sky = dayCol * uDayFactor + twiCol * uTwilightFactor + nightCol * uNightFactor;

        // Subtle distant stars in twilight/night
        float starVisibility = clamp(uNightFactor + uTwilightFactor * 0.4, 0.0, 1.0);
        if (starVisibility > 0.01 && dir.y > -0.05) {
          vec2 grid = floor(vUv * vec2(260.0, 130.0));
          float n = hash(grid);
          if (n > 0.992) {
            float twinkle = 0.6 + 0.4 * sin(uTime * 2.5 + n * 80.0);
            sky += vec3(0.92, 0.95, 1.0) * twinkle * starVisibility * smoothstep(-0.05, 0.25, dir.y);
          }
        }

        gl_FragColor = vec4(sky, 1.0);
      }
    `,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMaterial);
  group.add(skyMesh);

  // ---------------------------------------------------------------------------
  // 2. CHALKY WHITE WINDOWSILL & WINDOW CASING
  // ---------------------------------------------------------------------------
  const sillGroup = new THREE.Group();
  const chalkMat = new THREE.MeshStandardMaterial({
    map: chalkTex.map,
    bumpMap: chalkTex.bumpMap,
    bumpScale: 0.014,
    color: new THREE.Color('#f5f1ea'),
    roughness: 0.89,
    metalness: 0.01,
  });

  // Main deep windowsill board
  const mainSillGeo = new THREE.BoxGeometry(11.5, 0.26, 4.4);
  const mainSill = new THREE.Mesh(mainSillGeo, chalkMat);
  mainSill.position.set(0, -2.21, 0.15);
  mainSill.receiveShadow = true;
  sillGroup.add(mainSill);

  // Classic rounded front bullnose molding along windowsill front edge
  const bullnoseGeo = new THREE.CylinderGeometry(0.13, 0.13, 11.5, 24);
  bullnoseGeo.rotateZ(Math.PI / 2);
  const bullnose = new THREE.Mesh(bullnoseGeo, chalkMat);
  bullnose.position.set(0, -2.21, 2.35);
  bullnose.receiveShadow = true;
  sillGroup.add(bullnose);

  // Lower apron trim under windowsill
  const apronGeo = new THREE.BoxGeometry(11.2, 0.55, 0.22);
  const apron = new THREE.Mesh(apronGeo, chalkMat);
  apron.position.set(0, -2.6, 2.15);
  apron.receiveShadow = true;
  sillGroup.add(apron);

  // Subtle back window frame lower rail & vertical muntin bar to ground the windowsill
  const backRailGeo = new THREE.BoxGeometry(11.5, 0.22, 0.28);
  const backRail = new THREE.Mesh(backRailGeo, chalkMat);
  backRail.position.set(0, -1.98, -1.92);
  backRail.receiveShadow = true;
  sillGroup.add(backRail);

  const leftJambGeo = new THREE.BoxGeometry(0.45, 9.0, 0.36);
  const leftJamb = new THREE.Mesh(leftJambGeo, chalkMat);
  leftJamb.position.set(-4.6, 2.4, -1.92);
  sillGroup.add(leftJamb);

  const rightJamb = new THREE.Mesh(leftJambGeo, chalkMat);
  rightJamb.position.set(4.6, 2.4, -1.92);
  sillGroup.add(rightJamb);

  group.add(sillGroup);

  // ---------------------------------------------------------------------------
  // 3. FOLDED LINEN CLOTH (Woven texture + natural stacked folds)
  // ---------------------------------------------------------------------------
  const linenGroup = new THREE.Group();
  const linenMat = new THREE.MeshStandardMaterial({
    map: linenTex.map,
    bumpMap: linenTex.bumpMap,
    bumpScale: 0.026,
    color: new THREE.Color('#eae1d3'),
    roughness: 0.93,
    metalness: 0.0,
  });

  // Helper to create soft-edged cloth fold layer
  const createClothFold = (
    w: number,
    h: number,
    d: number,
    y: number,
    rotY: number,
    offsetX: number,
    offsetZ: number,
  ) => {
    const geo = new THREE.BoxGeometry(w, h, d, 20, 2, 20);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      // Soften corners & add organic linen ripple
      const edgeX = Math.abs(v.x) / (w * 0.5);
      const edgeZ = Math.abs(v.z) / (d * 0.5);
      const edgeFactor = Math.max(edgeX, edgeZ);
      if (edgeFactor > 0.85 && v.y > 0) {
        v.y *= 1.0 - (edgeFactor - 0.85) * 4.2;
      }
      const wave =
        Math.sin(v.x * 3.2 + v.z * 2.1) * 0.008 +
        Math.cos(v.z * 4.5) * 0.005;
      v.y += wave;
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, linenMat);
    mesh.position.set(offsetX, y, offsetZ);
    mesh.rotation.y = rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // Bottom fold
  linenGroup.add(createClothFold(3.35, 0.036, 2.25, -2.062, 0.09, 0.55, 0.18));
  // Middle fold
  linenGroup.add(createClothFold(3.12, 0.034, 2.02, -2.032, -0.05, 0.48, 0.14));
  // Top fold
  linenGroup.add(createClothFold(2.86, 0.032, 1.84, -2.004, 0.04, 0.42, 0.11));

  // Decorative woven stripe band along the top fold edge
  const stripeMat = new THREE.MeshStandardMaterial({
    map: linenTex.map,
    bumpMap: linenTex.bumpMap,
    bumpScale: 0.028,
    color: new THREE.Color('#c4b49d'),
    roughness: 0.94,
  });
  const stripeGeo = new THREE.BoxGeometry(2.84, 0.034, 0.12);
  const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
  stripeMesh.position.set(0.42, -2.002, 0.82);
  stripeMesh.rotation.y = 0.04;
  stripeMesh.receiveShadow = true;
  linenGroup.add(stripeMesh);

  group.add(linenGroup);

  // ---------------------------------------------------------------------------
  // 4. SMALL POTTED SUCCULENT (Fleshy leaves in ceramic/terracotta pot)
  // ---------------------------------------------------------------------------
  const succulentGroup = new THREE.Group();
  succulentGroup.position.set(1.92, -1.99, 0.42);

  // Turned small stoneware/terracotta pot
  const potPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.23, 0.0),
    new THREE.Vector2(0.28, 0.18),
    new THREE.Vector2(0.32, 0.38),
    new THREE.Vector2(0.34, 0.42),
    new THREE.Vector2(0.34, 0.47),
    new THREE.Vector2(0.29, 0.47),
    new THREE.Vector2(0.27, 0.39),
    new THREE.Vector2(0.0, 0.39),
  ];
  const potGeo = new THREE.LatheGeometry(potPoints, 32);
  const potMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d48c6a'), // Warm terracotta clay
    roughness: 0.68,
    metalness: 0.04,
  });
  const potMesh = new THREE.Mesh(potGeo, potMat);
  potMesh.castShadow = true;
  potMesh.receiveShadow = true;
  succulentGroup.add(potMesh);

  // Soil bed
  const soilGeo = new THREE.CylinderGeometry(0.28, 0.26, 0.06, 24);
  const soilMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#3b2d23'),
    roughness: 0.95,
  });
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.position.y = 0.4;
  succulentGroup.add(soilMesh);

  // Fleshy Echeveria Succulent Leaves (3 concentric spiral whorls)
  const createFleshyLeaf = (length: number, width: number, thickness: number) => {
    const geo = new THREE.SphereGeometry(1, 16, 12);
    const pos = geo.attributes.position;
    const colors: number[] = [];
    const baseCol = new THREE.Color('#6fa37c'); // Fleshy sage jade
    const midCol = new THREE.Color('#86b890'); // Plump pale green center
    const tipCol = new THREE.Color('#b86b77'); // Warm rosy-blush leaf tip
    const v = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      // Map z from [-1..1] to [0..1] along leaf length
      const t = (v.z + 1) * 0.5;
      // Plump spoon-like profile: narrow at base, wide near 70% length, pointed at tip
      const widthProfile = Math.sin(Math.pow(t, 0.75) * Math.PI) * (0.45 + 0.65 * t);
      const thickProfile = Math.sin(t * Math.PI) * (1.1 - 0.35 * t);

      v.x *= width * widthProfile;
      v.y *= thickness * thickProfile;
      // Cupped upper surface and rounded keel underneath
      if (v.y > 0) {
        v.y *= 0.65;
      }
      v.y += Math.pow(t, 1.8) * 0.055; // Gentle upward curl at tip
      v.z = t * length;

      pos.setXYZ(i, v.x, v.y, v.z);

      const c = baseCol.clone().lerp(midCol, Math.min(1, t * 1.3));
      if (t > 0.72) {
        c.lerp(tipCol, (t - 0.72) / 0.28);
      }
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  };

  const leafMat = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.38,
    metalness: 0.0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.45,
    sheen: 0.35,
    sheenColor: new THREE.Color('#cde6d3'),
  });

  const whorls = [
    { count: 9, radius: 0.05, len: 0.29, wid: 0.12, thk: 0.052, pitch: 0.22, y: 0.43 },
    { count: 7, radius: 0.03, len: 0.22, wid: 0.1, thk: 0.048, pitch: 0.52, y: 0.46 },
    { count: 5, radius: 0.015, len: 0.14, wid: 0.075, thk: 0.042, pitch: 0.88, y: 0.49 },
  ];

  whorls.forEach((w, wIdx) => {
    const leafGeo = createFleshyLeaf(w.len, w.wid, w.thk);
    for (let i = 0; i < w.count; i++) {
      const angle = (i / w.count) * Math.PI * 2 + wIdx * 0.55;
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(
        Math.sin(angle) * w.radius,
        w.y,
        Math.cos(angle) * w.radius,
      );
      leaf.rotation.order = 'YXZ';
      leaf.rotation.y = angle;
      leaf.rotation.x = -w.pitch;
      leaf.castShadow = true;
      leaf.receiveShadow = true;
      succulentGroup.add(leaf);
    }
  });

  group.add(succulentGroup);

  // ---------------------------------------------------------------------------
  // 5. TURNED WALNUT STAND WITH BRASS COLLAR
  // ---------------------------------------------------------------------------
  const standGroup = new THREE.Group();

  // Turned walnut wood base (from y = -1.99 up to y = -1.42)
  const walnutPoints = [
    new THREE.Vector2(0.0, -1.99),
    new THREE.Vector2(0.88, -1.99), // Wide stable base foot
    new THREE.Vector2(0.91, -1.95), // Foot bead
    new THREE.Vector2(0.86, -1.90),
    new THREE.Vector2(0.72, -1.84), // Lower cove curve
    new THREE.Vector2(0.56, -1.74), // Turned waist
    new THREE.Vector2(0.64, -1.65), // Center torus ring
    new THREE.Vector2(0.58, -1.57), // Upper neck cove
    new THREE.Vector2(0.71, -1.49), // Upper flare supporting brass collar
    new THREE.Vector2(0.68, -1.44),
    new THREE.Vector2(0.52, -1.44), // Inner cradle recess
    new THREE.Vector2(0.0, -1.52),
  ];
  const walnutGeo = new THREE.LatheGeometry(walnutPoints, 64);
  const walnutMat = new THREE.MeshStandardMaterial({
    map: walnutTex.map,
    bumpMap: walnutTex.bumpMap,
    bumpScale: 0.018,
    roughness: 0.36,
    metalness: 0.06,
    envMap,
    envMapIntensity: 0.55,
  });
  const walnutMesh = new THREE.Mesh(walnutGeo, walnutMat);
  walnutMesh.castShadow = true;
  walnutMesh.receiveShadow = true;
  standGroup.add(walnutMesh);

  // Turned Brass Collar cradling the glass orb (around y = -1.45 to -1.28)
  // At y = -1.33, the orb of radius 1.50 has horizontal radius sqrt(1.5^2 - 1.33^2) = 0.69
  const brassPoints = [
    new THREE.Vector2(0.54, -1.46),
    new THREE.Vector2(0.71, -1.46),
    new THREE.Vector2(0.75, -1.41), // Lower brass bead
    new THREE.Vector2(0.73, -1.35), // Tapered brass collar wall
    new THREE.Vector2(0.76, -1.30), // Rolled upper brass rim
    new THREE.Vector2(0.71, -1.28), // Top lip hugging glass orb
    new THREE.Vector2(0.67, -1.33), // Inner wall against glass
    new THREE.Vector2(0.54, -1.44),
  ];
  const brassGeo = new THREE.LatheGeometry(brassPoints, 64);
  const brassMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#deb868'),
    metalness: 0.88,
    roughness: 0.22,
    envMap,
    envMapIntensity: 1.2,
  });
  const brassMesh = new THREE.Mesh(brassGeo, brassMat);
  brassMesh.castShadow = true;
  brassMesh.receiveShadow = true;
  standGroup.add(brassMesh);

  group.add(standGroup);

  // ---------------------------------------------------------------------------
  // 6. 30CM CLEAR GLASS ORB (Radius = 1.50 = 30cm across)
  //    Features:
  //    - Visible glass wall thickness (double shell + green borosilicate rim)
  //    - Faint green edges at grazing angles
  //    - Curved window reflection on upper-left surface
  //    - Leaves the central miniature village completely clear and inspectable
  // ---------------------------------------------------------------------------
  const orbGroup = new THREE.Group();

  // Inner glass wall (BackSide) for physical depth cue
  const innerGlassGeo = new THREE.SphereGeometry(1.46, 64, 64);
  const innerGlassMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#dcfaee'),
    transparent: true,
    opacity: 0.06,
    roughness: 0.08,
    metalness: 0.0,
    side: THREE.BackSide,
    depthWrite: false,
    envMap,
    envMapIntensity: 0.4,
  });
  const innerGlassMesh = new THREE.Mesh(innerGlassGeo, innerGlassMat);
  innerGlassMesh.renderOrder = 10;
  orbGroup.add(innerGlassMesh);

  // Outer custom shader shell: visible glass thickness band, faint green edges,
  // and curved 4-pane evening window reflection on the upper-left curve
  const outerGlassGeo = new THREE.SphereGeometry(1.5, 96, 96);
  const orbGlassMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    uniforms: {
      uDayFactor: { value: 1.0 },
      uTwilightFactor: { value: 0.0 },
      uNightFactor: { value: 0.0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalWorld;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPosition.xyz;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        vNormalView = normalize(normalMatrix * normal);
        vViewDir = normalize(cameraPosition - worldPosition.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vNormalWorld;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;

      uniform float uDayFactor;
      uniform float uTwilightFactor;
      uniform float uNightFactor;

      void main() {
        vec3 N = normalize(vNormalWorld);
        vec3 V = normalize(vViewDir);
        vec3 R = reflect(-V, N);

        float ndotv = clamp(dot(N, V), 0.0, 1.0);
        float fresnel = pow(1.0 - ndotv, 3.2);

        // 1. Visible glass thickness ring: double-stepped rim at the outer 4% of radius
        //    ndotv near 0.0..0.32 corresponds to the physical glass wall thickness
        float outerEdge = smoothstep(0.34, 0.04, ndotv);
        float innerWallStep = smoothstep(0.28, 0.22, ndotv) * (1.0 - smoothstep(0.22, 0.14, ndotv));

        // Faint soda-lime / borosilicate green edge tint
        vec3 glassGreen = mix(
          vec3(0.72, 0.94, 0.84),
          vec3(0.55, 0.85, 0.78),
          uNightFactor * 0.5
        );

        // 2. Curved Window Reflection on the upper-left surface of the orb
        //    We map view-space normal (vNormalView) so the curved window reflection
        //    gracefully hugs the upper-left curvature while keeping the center clear!
        vec2 vn = vNormalView.xy;
        // Transform into tilted curved window coordinates on upper-left quadrant
        vec2 winCenter = vec2(-0.46, 0.42);
        vec2 p = vn - winCenter;
        // Slight spherical warp
        float r2 = dot(vn, vn);
        p.x += vn.y * 0.14;
        p.y -= vn.x * 0.10;

        // Window outer bounds
        float inWinX = smoothstep(0.29, 0.25, abs(p.x));
        float inWinY = smoothstep(0.33, 0.28, abs(p.y));
        float windowMask = inWinX * inWinY;

        // Window muntin crossbars (4 panes)
        float mullionX = smoothstep(0.012, 0.024, abs(p.x));
        float mullionY = smoothstep(0.014, 0.026, abs(p.y));
        float panes = windowMask * mullionX * mullionY;

        // Soft vertical falloff across the window reflection
        float paneGrad = smoothstep(-0.32, 0.32, p.y) * 0.45 + 0.55;
        float windowReflection = panes * paneGrad;

        // Secondary subtle opposite-side bottom-right warm bounce reflection
        vec2 bounceP = vn - vec2(0.55, -0.48);
        float bounceHighlight = exp(-dot(bounceP, bounceP) * 18.0) * 0.22;

        // Specular sun/sky pinpoint highlight
        vec3 lightDir = normalize(vec3(-0.6, 0.75, 0.5));
        float spec = pow(max(dot(R, lightDir), 0.0), 90.0) * 0.45;

        // Tint window reflection based on time of day
        vec3 winColorDay = vec3(1.0, 0.96, 0.91);
        vec3 winColorTwi = vec3(0.78, 0.84, 1.0);
        vec3 winColorNight = vec3(0.48, 0.62, 0.88);
        vec3 winColor = winColorDay * uDayFactor + winColorTwi * uTwilightFactor + winColorNight * uNightFactor;

        // Combine color and alpha — center stays crystal clear (alpha ~ 0.015)
        vec3 col = glassGreen * (outerEdge * 0.85 + innerWallStep * 0.55);
        col = mix(col, winColor, clamp(windowReflection * 1.3 + spec, 0.0, 1.0));
        col += vec3(0.95, 0.88, 0.80) * bounceHighlight;

        float alpha =
          fresnel * 0.34 +
          outerEdge * 0.22 +
          innerWallStep * 0.18 +
          windowReflection * (0.36 * uDayFactor + 0.28 * uTwilightFactor + 0.18 * uNightFactor) +
          bounceHighlight * 0.18 +
          spec * 0.35 +
          0.012;

        // Keep bottom contact inside brass collar slightly darker/grounded
        float collarMask = smoothstep(-1.42, -1.22, vWorldPos.y);
        alpha *= mix(0.65, 1.0, collarMask);

        gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.78));
      }
    `,
  });

  const outerGlassMesh = new THREE.Mesh(outerGlassGeo, orbGlassMaterial);
  outerGlassMesh.renderOrder = 20;
  orbGroup.add(outerGlassMesh);

  group.add(orbGroup);

  const updateTimeOfDay = (
    dayFactor: number,
    twilightFactor: number,
    nightFactor: number,
    elapsedTime: number,
  ) => {
    skyMaterial.uniforms.uDayFactor.value = dayFactor;
    skyMaterial.uniforms.uTwilightFactor.value = twilightFactor;
    skyMaterial.uniforms.uNightFactor.value = nightFactor;
    skyMaterial.uniforms.uTime.value = elapsedTime;

    orbGlassMaterial.uniforms.uDayFactor.value = dayFactor;
    orbGlassMaterial.uniforms.uTwilightFactor.value = twilightFactor;
    orbGlassMaterial.uniforms.uNightFactor.value = nightFactor;
  };

  return {
    group,
    orbGlassMaterial,
    skyMaterial,
    updateTimeOfDay,
  };
}
