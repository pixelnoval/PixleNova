import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import mapData from './mapData.json';

export function useThreeBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ─── RENDERER ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // ─── SCENE + CAMERA ──────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5.5;

    // Master group
    const group = new THREE.Group();
    scene.add(group);

    // ─── GLOBE GROUP ─────────────────────────────────────────────────────────
    const globeGroup = new THREE.Group();
    group.add(globeGroup);

    const GLOBE_R = 1.35;
    const toDispose = [];

    const w = window.innerWidth;
    const isMobile = w < 768;
    const isTablet = w >= 768 && w < 1024;

    const LAT_LINES = isMobile ? 24 : (isTablet ? 36 : 48);
    const LON_LINES = isMobile ? 36 : (isTablet ? 48 : 64);

    // Controlled density: Only distributed over land
    const TARGET_PTS = isMobile ? 10000 : (isTablet ? 15000 : 22000);
    const CONN_CNT = isMobile ? 15 : (isTablet ? 25 : 35); // Elegant, sparse network

    // ─── SHADER REUSABLES FOR DEPTH ───────────────────────────────────────────
    const depthVertexShader = `
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `;

    // Shader for points with varying size and color
    const dataPointVertexShader = `
      varying vec3 vWorldPos;
      varying vec3 vColor;
      attribute vec3 color;
      attribute float aSize;
      
      void main() {
        vColor = color;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPosition.xyz;
        vec4 mvPosition = viewMatrix * worldPosition;
        // Adjusted base size down slightly to compensate for denser coverage
        gl_PointSize = aSize * (11.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const dataPointFragmentShader = `
      uniform float baseOpacity;
      varying vec3 vWorldPos;
      varying vec3 vColor;
      void main() {
        float dist = distance(gl_PointCoord, vec2(0.5));
        if (dist > 0.5) discard;
        // Front-facing: ~0.60 opacity, Side: ~0.375, Back: ~0.15
        float depthAlpha = smoothstep(-1.0, 1.0, vWorldPos.z);
        // Reduced overall opacity for a subtle, premium look
        float alpha = baseOpacity * (0.15 + 0.45 * depthAlpha);
        gl_FragColor = vec4(vColor, alpha);
      }
    `;

    // Universal wireframe/tube depth shader with physical translucent occlusion
    const meshDepthFragmentShader = `
      uniform vec3 color;
      uniform float baseOpacity;
      uniform vec3 earthCenter;
      uniform float earthScale;
      varying vec3 vWorldPos;
      void main() {
        // Natural 3D depth fade
        float depthAlpha = smoothstep(-1.0, 0.8, vWorldPos.z - earthCenter.z);
        float alpha = baseOpacity * (0.15 + 0.85 * depthAlpha);
        
        // True physical occlusion: fade out if behind the translucent Earth sphere
        float distXY = length(vWorldPos.xy - earthCenter.xy);
        float currentRadius = 1.35 * earthScale;
        if (vWorldPos.z < earthCenter.z) {
          float edgeFade = smoothstep(currentRadius * 0.85, currentRadius * 1.02, distXY);
          // Drops to 15% opacity behind the dark core, fully opaque outside the silhouette
          alpha *= mix(0.15, 1.0, edgeFade);
        }
        
        gl_FragColor = vec4(color, alpha);
      }
    `;

    // Grid shader - fades heavily on the back
    const gridDepthFragmentShader = `
      uniform vec3 color;
      uniform float baseOpacity;
      varying vec3 vWorldPos;
      void main() {
        float depthAlpha = smoothstep(-0.2, 0.8, vWorldPos.z);
        float alpha = baseOpacity * (0.02 + 0.98 * depthAlpha);
        gl_FragColor = vec4(color, alpha);
      }
    `;

    const dotDepthVertexShader = `
      varying vec3 vWorldPos;
      uniform float size;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPosition.xyz;
        vec4 mvPosition = viewMatrix * worldPosition;
        gl_PointSize = size * (5.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const dotDepthFragmentShader = `
      uniform vec3 color;
      uniform float baseOpacity;
      varying vec3 vWorldPos;
      void main() {
        float dist = distance(gl_PointCoord, vec2(0.5));
        if (dist > 0.5) discard;
        float depthAlpha = smoothstep(-0.6, 0.4, vWorldPos.z);
        float alpha = baseOpacity * (0.05 + 0.95 * depthAlpha) * (1.0 - dist * 2.0);
        gl_FragColor = vec4(color, alpha);
      }
    `;

    // ── LAYER 1: ATMOSPHERE & RIM GLOW ───────────────────────────────────────
    const rimGeo = new THREE.SphereGeometry(GLOBE_R * 1.015, 64, 64);
    const rimMat = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0x1A66FF) },
        introFade: { value: 1.0 } // Temporarily set to 1.0, will be modulated in animate loop
      },
      vertexShader: depthVertexShader,
      fragmentShader: `
        uniform vec3 color;
        uniform float introFade;
        varying vec3 vNormal;
        void main() {
          // Normalize the interpolated normal per-pixel to ensure a perfectly smooth 360° ring without polygonal banding
          vec3 n = normalize(vNormal);
          float v = abs(dot(n, vec3(0.0, 0.0, 1.0)));
          
          // Strong, continuous, sharp blue outer rim
          float edge = smoothstep(0.82, 1.0, 1.0 - v);
          float intensity = edge * 1.5;
          
          gl_FragColor = vec4(color * intensity, edge * 0.95 * introFade);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    toDispose.push(rimGeo, rimMat);
    globeGroup.add(new THREE.Mesh(rimGeo, rimMat));

    // Transparent dark core - allows reading the digital structure
    const coreGeo = new THREE.SphereGeometry(GLOBE_R * 0.99, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x020813, // Almost black navy
      transparent: true,
      opacity: 0.85, // Increased opacity to ensure oceans are dark and contrast is high
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    toDispose.push(coreGeo, coreMat);
    globeGroup.add(new THREE.Mesh(coreGeo, coreMat));

    // ── GLOBE WIREFRAME (Secondary structural element - 10-15% visual weight) ───
    const wireMat = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0x1a44aa) },
        baseOpacity: { value: 0.05 } // Secondary, very subtle
      },
      vertexShader: depthVertexShader,
      // Grid doesn't need earthCenter occlusion because it's part of the Earth itself
      fragmentShader: gridDepthFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    toDispose.push(wireMat);

    const SEG = isMobile ? 64 : 128;

    for (let i = 1; i < LAT_LINES; i++) {
      const phi = (i / LAT_LINES) * Math.PI;
      const r = GLOBE_R * Math.sin(phi);
      const y = GLOBE_R * Math.cos(phi);
      const pts = [];
      for (let j = 0; j <= SEG; j++) {
        const theta = (j / SEG) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      toDispose.push(geo);
      globeGroup.add(new THREE.Line(geo, wireMat));
    }

    for (let i = 0; i < LON_LINES; i++) {
      const lambda = (i / LON_LINES) * Math.PI * 2;
      const pts = [];
      for (let j = 0; j <= SEG; j++) {
        const phi = (j / SEG) * Math.PI;
        pts.push(new THREE.Vector3(
          GLOBE_R * Math.sin(phi) * Math.cos(lambda),
          GLOBE_R * Math.cos(phi),
          GLOBE_R * Math.sin(phi) * Math.sin(lambda)
        ));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      toDispose.push(geo);
      globeGroup.add(new THREE.Line(geo, wireMat));
    }

    // ── LAYER 2: DIGITAL EARTH SURFACE (Structured Dot Matrix) ──────────────
    const mapW = mapData.w;
    const mapH = mapData.h;
    const mapBits = mapData.data;

    // Bilinear interpolation for perfectly smooth probability gradients using the 512x256 GeoJSON mask
    function sampleMap(lat, lon) {
      let x = ((lon + Math.PI) / (Math.PI * 2)) * mapW;
      let y = ((Math.PI / 2 - lat) / Math.PI) * mapH;

      if (x < 0) x += mapW;
      if (x >= mapW) x -= mapW;
      y = Math.max(0, Math.min(mapH - 1.001, y));

      const x0 = Math.floor(x);
      const x1 = (x0 + 1) % mapW;
      const y0 = Math.floor(y);
      const y1 = y0 + 1;

      const tx = x - x0;
      const ty = y - y0;

      const v00 = mapBits[y0 * mapW + x0] === '1' ? 1 : 0;
      const v10 = mapBits[y0 * mapW + x1] === '1' ? 1 : 0;
      const v01 = mapBits[y1 * mapW + x0] === '1' ? 1 : 0;
      const v11 = mapBits[y1 * mapW + x1] === '1' ? 1 : 0;

      const v0 = v00 * (1 - tx) + v10 * tx;
      const v1 = v01 * (1 - tx) + v11 * tx;
      return v0 * (1 - ty) + v1 * ty;
    }

    const dataPts = [];
    const colors = [];
    const sizes = [];
    const nodePts = [];

    // Face the front of the sphere towards Asia/India for balanced geographic framing
    const lonOffset = Math.PI * 0.45;

    // Create a structured, clean geographic point grid.
    // Moderately increased density to fill interior landmass gaps naturally.
    const LAT_STEPS = isMobile ? 100 : (isTablet ? 140 : 190);
    const LON_STEPS = isMobile ? 200 : (isTablet ? 280 : 380);

    const colorCoast = new THREE.Color(0x3388ff); // Medium blue/cyan for edge definition
    const colorInterior = new THREE.Color(0x113388); // Deep electric blue for interior structure
    const colorHighlight = new THREE.Color(0x55aaff); // Rare cyan highlight

    for (let i = 0; i <= LAT_STEPS; i++) {
      const phi = (i / LAT_STEPS) * Math.PI; 
      const lat = Math.PI / 2 - phi;
      
      const radiusAtLat = Math.sin(phi);
      const currentLonSteps = Math.max(1, Math.floor(LON_STEPS * radiusAtLat));
      
      for (let j = 0; j < currentLonSteps; j++) {
        let displayLon = (j / currentLonSteps) * Math.PI * 2;
        
        let mapLon = displayLon + lonOffset;
        while (mapLon > Math.PI) mapLon -= Math.PI * 2;
        while (mapLon < -Math.PI) mapLon += Math.PI * 2;

        // Pure structured lookup, NO procedural noise
        const val = sampleMap(lat, mapLon);
        
        if (val > 0.4) {
          // Coastline detection: Check adjacent geographic points
          const stepLat = Math.PI / LAT_STEPS;
          const stepLon = (Math.PI * 2) / LON_STEPS;
          
          const vLeft = sampleMap(lat, mapLon - stepLon);
          const vRight = sampleMap(lat, mapLon + stepLon);
          const vUp = sampleMap(lat + stepLat, mapLon);
          const vDown = sampleMap(lat - stepLat, mapLon);
          
          const isCoast = (vLeft < 0.4 || vRight < 0.4 || vUp < 0.4 || vDown < 0.4);

          // Standard geographic 3D projection
          const x = Math.cos(lat) * Math.sin(displayLon);
          const y = Math.sin(lat);
          const z = Math.cos(lat) * Math.cos(displayLon);
          
          const vec = new THREE.Vector3(x, y, z).multiplyScalar(GLOBE_R);
          dataPts.push(vec);
          
          let targetColor, sizeMult;
          if (isCoast) {
            targetColor = colorCoast;
            sizeMult = 1.6; // Stronger coastline definition
          } else {
            // Interior structured points
            if (Math.random() < 0.95) {
              targetColor = colorInterior;
              sizeMult = 1.0;
            } else {
              targetColor = colorHighlight;
              sizeMult = 1.3;
            }
          }

          colors.push(targetColor.r, targetColor.g, targetColor.b);
          sizes.push(sizeMult);

          // Major nodes (hub connection points) - Collect them just in case, disabled in Phase 1
          if (Math.random() > 0.985 && val > 0.8) {
            nodePts.push(vec.clone());
          }
        }
      }
    }

    const dataGeo = new THREE.BufferGeometry().setFromPoints(dataPts);
    dataGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    dataGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));

    const dataMat = new THREE.ShaderMaterial({
      uniforms: {
        baseOpacity: { value: 1.0 } // Increased opacity for primary structure
      },
      vertexShader: dataPointVertexShader,
      fragmentShader: dataPointFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    toDispose.push(dataGeo, dataMat);
    const dataMesh = new THREE.Points(dataGeo, dataMat);
    dataMesh.renderOrder = 5; // Ensure land is drawn above core
    globeGroup.add(dataMesh);

    // ── LAYER 3: NETWORK SYSTEM (DISABLED FOR PHASE 1 - GLOBE ONLY) ──────────
    const ENABLE_NETWORK = false;

    if (ENABLE_NETWORK) {
      const nodeGeo = new THREE.BufferGeometry().setFromPoints(nodePts);
      const nodeMat = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0x3388ff) },
          baseOpacity: { value: 0.8 },
          size: { value: 2.5 }
        },
        vertexShader: dotDepthVertexShader,
        fragmentShader: dotDepthFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      toDispose.push(nodeGeo, nodeMat);
      globeGroup.add(new THREE.Points(nodeGeo, nodeMat));

      // Major Glowing Hubs (8-12 elegant nodes)
      const hubCount = Math.floor(Math.random() * 5) + 8;
      const hubPts = [];
      for (let i = 0; i < hubCount; i++) {
        if (nodePts.length > 0) {
          hubPts.push(nodePts[Math.floor(Math.random() * nodePts.length)]);
        }
      }
      const hubGeo = new THREE.BufferGeometry().setFromPoints(hubPts);

      // Hub subtle halo
      const hubGlowMat = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0x1a66ff) },
          baseOpacity: { value: 0.5 },
          size: { value: 12.0 }
        },
        vertexShader: dotDepthVertexShader,
        fragmentShader: dotDepthFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      toDispose.push(hubGeo, hubGlowMat);
      globeGroup.add(new THREE.Points(hubGeo, hubGlowMat));

      // Hub tiny bright cyan/white core
      const hubCoreMat = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0xddeeff) },
          baseOpacity: { value: 1.0 },
          size: { value: 3.5 }
        },
        vertexShader: dotDepthVertexShader,
        fragmentShader: dotDepthFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      toDispose.push(hubGeo, hubCoreMat);
      globeGroup.add(new THREE.Points(hubGeo, hubCoreMat));

      // Elegant network connections
      const connMat = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0x3388ff) },
          baseOpacity: { value: 0.4 }
        },
        vertexShader: depthVertexShader,
        fragmentShader: meshDepthFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      toDispose.push(connMat);

      for (let c = 0; c < CONN_CNT; c++) {
        if (nodePts.length === 0) break;
        const a = nodePts[Math.floor(Math.random() * nodePts.length)];
        const b = nodePts[Math.floor(Math.random() * nodePts.length)];
        const dist = a.distanceTo(b);
        // Connect meaningful geographic points
        if (dist < GLOBE_R * 1.6 && dist > 0.2) {
          const arcPts = [];
          for (let s = 0; s <= 32; s++) {
            const t = s / 32;
            const v = new THREE.Vector3().lerpVectors(a, b, t);
            v.normalize().multiplyScalar(GLOBE_R * (1 + 0.08 * dist * Math.sin(t * Math.PI)));
            arcPts.push(v);
          }
          const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
          toDispose.push(arcGeo);
          globeGroup.add(new THREE.Line(arcGeo, connMat));
        }
      }
    }

    // ── TWO PRIMARY ORBITAL RINGS ────────────────────────────────────────────
    const orbitUniforms = []; // Store uniforms to update in animate loop
    
    // Explicitly shared origin to guarantee perfect mathematical centering
    const sharedOrbitOrigin = new THREE.Group();
    sharedOrbitOrigin.position.set(0, 0, 0);
    group.add(sharedOrbitOrigin);

    function buildOrbit({ radius, glowOpacity, coreOpacity, inclX, inclY, inclZ, coreColor, glowColor, satColor, orbitIndex }) {
      const orbitGroup = new THREE.Group();
      orbitGroup.position.set(0, 0, 0); // Strictly lock center to globe origin
      orbitGroup.rotation.set(inclX, inclY, inclZ);
      const OSEG = 128;

      const glowPts = [];
      for (let i = 0; i <= OSEG; i++) {
        const t = (i / OSEG) * Math.PI * 2;
        // Perfect circle centered strictly at (0,0,0) (removes TubeGeometry self-intersection artifact)
        glowPts.push(new THREE.Vector3(Math.cos(t) * radius, Math.sin(t) * radius, 0));
      }

      const curve = new THREE.CatmullRomCurve3(glowPts, true);
      // Extremely thin elegant electric-blue lines
      const glowGeo = new THREE.TubeGeometry(curve, OSEG, 0.008, 6, true);
      const glowMat = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(glowColor) },
          baseOpacity: { value: glowOpacity },
          originalOpacity: { value: glowOpacity },
          isOrbit: { value: true },
          orbitIndex: { value: orbitIndex },
          earthCenter: { value: new THREE.Vector3() },
          earthScale: { value: 1.0 }
        },
        vertexShader: depthVertexShader,
        fragmentShader: meshDepthFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      toDispose.push(glowGeo, glowMat);
      orbitGroup.add(new THREE.Mesh(glowGeo, glowMat));
      orbitUniforms.push(glowMat.uniforms);

      const coreGeo = new THREE.TubeGeometry(curve, OSEG, 0.002, 6, true);
      const coreMat = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(coreColor) },
          baseOpacity: { value: coreOpacity },
          originalOpacity: { value: coreOpacity },
          isOrbit: { value: true },
          orbitIndex: { value: orbitIndex },
          earthCenter: { value: new THREE.Vector3() },
          earthScale: { value: 1.0 }
        },
        vertexShader: depthVertexShader,
        fragmentShader: meshDepthFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      toDispose.push(coreGeo, coreMat);
      orbitGroup.add(new THREE.Mesh(coreGeo, coreMat));
      orbitUniforms.push(coreMat.uniforms);

      const satPivot = new THREE.Group();
      orbitGroup.add(satPivot);

      // Single satellite node per orbit
      const satGlowGeo = new THREE.SphereGeometry(0.035, 16, 16);
      const satGlowMat = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(satColor) },
          baseOpacity: { value: 0.6 },
          originalOpacity: { value: 0.6 },
          isSat: { value: true },
          earthCenter: { value: new THREE.Vector3() },
          earthScale: { value: 1.0 }
        },
        vertexShader: depthVertexShader,
        fragmentShader: meshDepthFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const satCoreGeo = new THREE.SphereGeometry(0.012, 16, 16);
      const satCoreMat = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0xffffff) },
          baseOpacity: { value: 1.0 },
          originalOpacity: { value: 1.0 },
          isSat: { value: true },
          earthCenter: { value: new THREE.Vector3() },
          earthScale: { value: 1.0 }
        },
        vertexShader: depthVertexShader,
        fragmentShader: meshDepthFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const sGlowMesh = new THREE.Mesh(satGlowGeo, satGlowMat);
      sGlowMesh.position.set(radius, 0, 0);
      const sCoreMesh = new THREE.Mesh(satCoreGeo, satCoreMat);
      sCoreMesh.position.set(radius, 0, 0);

      toDispose.push(satGlowGeo, satGlowMat, satCoreGeo, satCoreMat);
      // Place satellites directly in the orbit group so they share the exact orbital transform plane
      // Add particles directly to orbitGroup to avoid double-rotation transform detachment
      orbitGroup.add(sGlowMesh);
      orbitGroup.add(sCoreMesh);
      orbitUniforms.push(satGlowMat.uniforms, satCoreMat.uniforms);

      // Initialize orbital phase (starting at PI/2 so they start at origin intersection)
      orbitGroup.userData.phase = Math.PI / 2;

      return { orbitGroup, curve, sGlowMesh, sCoreMesh };
    }

    // ORBIT 1: Broad horizontal/diagonal ellipse
    const { orbitGroup: orbit1, curve: curve1, sGlowMesh: sGlow1, sCoreMesh: sCore1 } = buildOrbit({
      radius: GLOBE_R * 1.5,
      glowOpacity: 0.25,
      coreOpacity: 0.85,
      inclX: Math.PI / 2 - 0.2, // ~78 degrees
      inclY: 0.2,
      inclZ: -0.1,
      coreColor: 0x3388ff,
      glowColor: 0x1a66ff,
      satColor: 0x66ccff,
      orbitIndex: 1
    });
    sharedOrbitOrigin.add(orbit1);

    // ORBIT 2: Strongly diagonal / tilted ellipse
    const { orbitGroup: orbit2, curve: curve2, sGlowMesh: sGlow2, sCoreMesh: sCore2 } = buildOrbit({
      radius: GLOBE_R * 1.35,
      glowOpacity: 0.25,
      coreOpacity: 0.85,
      inclX: 1.0,
      inclY: 0.6,
      inclZ: 0.5, // Different plane entirely
      coreColor: 0x66ccff,
      glowColor: 0x3388ff,
      satColor: 0xddeeff,
      orbitIndex: 2
    });
    sharedOrbitOrigin.add(orbit2);

    // ORBIT 3: New diagonal orbit (exact copy of Orbit 1, new direction)
    const { orbitGroup: orbit3, curve: curve3, sGlowMesh: sGlow3, sCoreMesh: sCore3 } = buildOrbit({
      radius: GLOBE_R * 1.5,
      glowOpacity: 0.25,
      coreOpacity: 0.85,
      inclX: 2.2, // Tilted steep diagonal
      inclY: -0.6,
      inclZ: 0.1,
      coreColor: 0x3388ff,
      glowColor: 0x1a66ff,
      satColor: 0x66ccff,
      orbitIndex: 3
    });
    sharedOrbitOrigin.add(orbit3);

    // ─── LAYOUT STATE ────────────────────────────────────────────────────────
    let baseScale = 0.86;
    let baseX = 0;
    let baseY = 0;
    let scrollMult = 1.0;
    let scrollDeltaY = 0;

    const updateLayout = () => {
      const w = window.innerWidth;
      const isMobile = w < 768;
      const isDesktop = w >= 1024;

      // Target Earth diameter ~430-520px, restrained
      baseScale = isMobile ? 0.55 : (isDesktop ? 0.82 : 0.72);

      if (isDesktop) {
        const fovRad = (50 * Math.PI) / 180;
        const halfFrH = Math.tan(fovRad / 2) * camera.position.z;
        const halfFrW = halfFrH * camera.aspect;
        // Positioned cleanly on the right (~72% of viewport width)
        // Shifting right by +22% of viewport width (0.44 * halfFrW = 22%)
        baseX = halfFrW * 0.44;
        baseY = -0.05; // Slightly below perfect center to hit ~52% height
      } else {
        baseX = 0;
        baseY = isMobile ? -0.3 : 0;
      }
    };
    updateLayout();

    // ─── INTERACTIVE GLOBE ROTATION ──────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDraggingGlobe = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    // Invisible hit sphere for raycasting (matches globe size)
    const globeHitGeometry = new THREE.SphereGeometry(GLOBE_R * 1.05, 32, 32);
    const globeHitMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const globeHitMesh = new THREE.Mesh(globeHitGeometry, globeHitMaterial);
    globeGroup.add(globeHitMesh);
    toDispose.push(globeHitGeometry, globeHitMaterial);

    const xAxis = new THREE.Vector3(1, 0, 0);
    const yAxis = new THREE.Vector3(0, 1, 0);

    const onPointerDown = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(globeHitMesh);
      if (intersects.length > 0) {
        isDraggingGlobe = true;
        canvas.setPointerCapture(e.pointerId);
        previousMousePosition = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
      }
    };

    const onPointerMove = (e) => {
      if (!isDraggingGlobe) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(globeHitMesh);
        canvas.style.cursor = intersects.length > 0 ? 'grab' : 'default';
        return;
      }
      
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      
      // Rotate on world axes to preserve trackball-like physical feel
      globeGroup.rotateOnWorldAxis(yAxis, deltaX * 0.005);
      globeGroup.rotateOnWorldAxis(xAxis, deltaY * 0.005);
      
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e) => {
      if (isDraggingGlobe) {
        isDraggingGlobe = false;
        canvas.releasePointerCapture(e.pointerId);
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(globeHitMesh);
        canvas.style.cursor = intersects.length > 0 ? 'grab' : 'default';
      }
    };

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(globeHitMesh);
      if (intersects.length > 0) {
        e.preventDefault(); // Stop mobile scroll when grabbing the globe
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });

    // ─── MOUSE PARALLAX (Subtle) ─────────────────────────────────────────────
    let mX = 0, mY = 0, tMX = 0, tMY = 0;
    const onMouseMove = (e) => {
      tMX = (e.clientX / window.innerWidth) - 0.5;
      tMY = (e.clientY / window.innerHeight) - 0.5;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // ─── ANIMATION LOOP ──────────────────────────────────────────────────────
    let rafId;
    let lastTime = performance.now();
    
    // Stable timeline state object outside the animation loop
    const introTimeline = {
      startTime: null,
      prefersReducedMotion: false
    };

    const animate = (time) => {
      rafId = requestAnimationFrame(animate);
      
      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;
      // Cap delta time to prevent massive jumps if tab is inactive
      const dt = Math.min(deltaTime, 0.1);

      // --- INTRO TIMELINE LOGIC ---
      if (introTimeline.startTime === null) {
        // Skip intro if reduced motion is requested
        introTimeline.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        introTimeline.startTime = time;
      }

      const introT = (time - introTimeline.startTime) / 1000;
      const isIntroComplete = introT > 4.5 || introTimeline.prefersReducedMotion;

      // Phase 1/2 (0.0 to 1.5s): Dark Open & PixleNova Identity
      // Phase 3 (1.5 to 3.5s): Globe Reveal
      // Phase 4 (3.5 to 5.0s): Orbit Reveal
      // Phase 5 (5.0s+): Hero Text Reveal

      let rimFade = 1.0;
      let coreFade = 1.0;
      let continentFade = 1.0;
      let orbit1Fade = 1.0;
      let orbit2Fade = 1.0;
      let orbit3Fade = 1.0;
      let satFade = 1.0;
      let pulse = 0;

      if (!isIntroComplete) {
         // Subtle atmosphere core (0.0s to 1.0s)
         coreFade = THREE.MathUtils.clamp(introT / 1.0, 0, 1);
         
         // Phase 3: Rim Reveal (1.0s to 1.6s)
         rimFade = THREE.MathUtils.clamp((introT - 1.0) / 0.6, 0, 1);
         
         // Phase 4: Continents/Data Activation (1.6s to 2.0s)
         continentFade = THREE.MathUtils.clamp((introT - 1.6) / 0.4, 0, 1);
         
         // Subtle activation pulse peak around 2.0s
         if (introT >= 1.8 && introT <= 2.3) {
            pulse = Math.sin(((introT - 1.8) / 0.5) * Math.PI) * 0.15; // 15% brightness boost
         }
         
         // Phase 5: Orbit System Activation (Staggered)
         orbit1Fade = THREE.MathUtils.clamp((introT - 2.0) / 0.4, 0, 1);
         orbit2Fade = THREE.MathUtils.clamp((introT - 2.2) / 0.4, 0, 1);
         orbit3Fade = THREE.MathUtils.clamp((introT - 2.4) / 0.4, 0, 1);
         
         // Satellites
         satFade = THREE.MathUtils.clamp((introT - 2.6) / 0.4, 0, 1);
      }

      // Apply the authoritative non-destructive modifiers
      rimMat.uniforms.introFade.value = rimFade + (pulse * 0.5);
      coreMat.opacity = 0.85 * coreFade + (pulse * 0.1);
      wireMat.uniforms.baseOpacity.value = 0.05 * continentFade;
      dataMat.uniforms.baseOpacity.value = Math.min(1.0 + pulse, 1.0 + pulse) * continentFade;

      // Cinematic, smooth continuous rotation independent of frame rate (25% faster)
      // Applied on world axes so it coexists flawlessly with user tumbling
      globeGroup.rotateOnWorldAxis(yAxis, 0.075 * dt);
      globeGroup.rotateOnWorldAxis(xAxis, 0.0036 * dt);

      // Slow, cinematic orbit rotation (locked to exact previous speeds)
      orbit1.rotation.z -= 0.030 * dt;
      orbit1.userData.phase -= 0.108 * dt;
      
      // Calculate exact phase for orbit 1 mapping to true curve coordinate
      let t1 = (orbit1.userData.phase / (Math.PI * 2)) % 1.0;
      if (t1 < 0) t1 += 1.0;
      const pos1 = curve1.getPoint(t1);
      sGlow1.position.copy(pos1);
      sCore1.position.copy(pos1);

      orbit2.rotation.z += 0.036 * dt;
      orbit2.userData.phase += 0.132 * dt;
      
      // Calculate exact phase for orbit 2 mapping to true curve coordinate
      let t2 = (orbit2.userData.phase / (Math.PI * 2)) % 1.0;
      if (t2 < 0) t2 += 1.0;
      const pos2 = curve2.getPoint(t2);
      sGlow2.position.copy(pos2);
      sCore2.position.copy(pos2);

      orbit3.rotation.z -= 0.030 * dt;
      orbit3.userData.phase -= 0.108 * dt;
      
      // Calculate exact phase for orbit 3 mapping to true curve coordinate
      let t3 = (orbit3.userData.phase / (Math.PI * 2)) % 1.0;
      if (t3 < 0) t3 += 1.0;
      const pos3 = curve3.getPoint(t3);
      sGlow3.position.copy(pos3);
      sCore3.position.copy(pos3);

      // Update uniforms for physical occlusion
      const earthCenterPos = new THREE.Vector3();
      group.getWorldPosition(earthCenterPos);
      const currentScale = baseScale * scrollMult;
      
      orbitUniforms.forEach(u => {
        if (u.earthCenter) u.earthCenter.value.copy(earthCenterPos);
        if (u.earthScale) u.earthScale.value = currentScale;
        
        if (u.isOrbit) {
          if (u.orbitIndex.value === 1) u.baseOpacity.value = u.originalOpacity.value * orbit1Fade;
          else if (u.orbitIndex.value === 2) u.baseOpacity.value = u.originalOpacity.value * orbit2Fade;
          else if (u.orbitIndex.value === 3) u.baseOpacity.value = u.originalOpacity.value * orbit3Fade;
        }
        if (u.isSat) u.baseOpacity.value = u.originalOpacity.value * satFade;
      });

      // Restrained parallax interpolation (Max ~10-15px equivalent)
      mX += (tMX - mX) * 0.02;
      mY += (tMY - mY) * 0.02;

      const finalScale = baseScale * scrollMult;
      group.scale.setScalar(finalScale);

      // Restrained parallax movement
      group.position.x = baseX + mX * 0.10;
      group.position.y = baseY + scrollDeltaY - mY * 0.10;

      group.rotation.y = mX * 0.12;
      group.rotation.x = mY * 0.12;

      renderer.render(scene, camera);
    };
    animate(performance.now());

    // ─── RESIZE ──────────────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      updateLayout();
    };
    window.addEventListener('resize', onResize, { passive: true });

    // ─── SCROLL ──────────────────────────────────────────────────────────────
    let scrollTick = false;
    const onScroll = () => {
      if (scrollTick) return;
      scrollTick = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const vh = window.innerHeight;
        const progress = Math.max(0, Math.min(1, (y - vh * 0.1) / (vh * 0.7)));
        scrollMult = 1.0 - 0.3 * progress;
        scrollDeltaY = -y * 0.00025;
        canvas.style.opacity = String(1 - progress);
        scrollTick = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ─── CLEANUP ─────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      toDispose.forEach(obj => obj.dispose());
      renderer.dispose();
    };
  }, []);

  return canvasRef;
}
