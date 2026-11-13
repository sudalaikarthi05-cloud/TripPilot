import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import mountainRefImg from '../assets/mountain-bus-reference.jpg';
import './Bus3DScene.css';

/**
 * Bus3DScene: Realistic cinematic 3D tourist bus on a winding mountain road during golden sunset,
 * matching the user's reference image with snow-capped mountains, winding S-curve road, and luxury coach.
 *
 * @param {string} stage - 'form' | 'welcome' | 'toCenter' | 'toRight' | 'completed'
 */
const Bus3DScene = ({ stage = 'form' }) => {
  const mountRef = useRef(null);
  const [webglSupported, setWebglSupported] = useState(true);

  // Keep latest stage in ref so animation loop can access it smoothly without re-mounting
  const stageRef = useRef(stage);
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    // 1. Verify WebGL support
    try {
      const testCanvas = document.createElement('canvas');
      const gl =
        testCanvas.getContext('webgl') ||
        testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 2. Scene, Camera, Renderer
    const scene = new THREE.Scene();

    // Load the mountain road reference image as high-resolution photographic backdrop
    const textureLoader = new THREE.TextureLoader();
    const bgTexture = textureLoader.load(mountainRefImg);
    bgTexture.colorSpace = THREE.SRGBColorSpace;
    scene.background = bgTexture;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    // Initial camera: Focused into the front windshield of the coach bus
    camera.position.set(0, 2.5, 10.5);
    camera.lookAt(0, 2.2, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Lighting matching the golden morning/sunset light from the left
    const ambientLight = new THREE.AmbientLight(0xffeedd, 1.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffaa44, 3.2);
    sunLight.position.set(-40, 30, -30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Warm bounce light from the mountain slopes
    const groundBounce = new THREE.DirectionalLight(0xddaa77, 1.0);
    groundBounce.position.set(20, -10, 20);
    scene.add(groundBounce);

    // 4. Materials (Luxury Metallic Touring Coach matching the reference)
    const busBodyMat = new THREE.MeshStandardMaterial({
      color: 0xa4acb4, // Metallic silver/platinum finish from the reference image
      metalness: 0.85,
      roughness: 0.18,
    });

    const busGoldMat = new THREE.MeshStandardMaterial({
      color: 0xc69239, // TripPilot warm gold accent livery
      metalness: 0.9,
      roughness: 0.22,
    });

    const busRoofMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde2, // Metallic pearl roof
      metalness: 0.6,
      roughness: 0.25,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x14222a,
      metalness: 0.95,
      roughness: 0.05,
      transparent: true,
      opacity: 0.72,
    });

    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.1,
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc, // Bright alloy wheels
      metalness: 0.95,
      roughness: 0.15,
    });

    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xfffae0,
      emissive: 0xfffae0,
      emissiveIntensity: 0.4,
    });

    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xff2222,
      emissive: 0xff1111,
      emissiveIntensity: 1.2,
    });

    const interiorLeatherMat = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 0.75,
    });

    // 5. Create Realistic Coach Bus Group
    const busGroup = new THREE.Group();
    busGroup.position.set(0, 1.45, 0);
    scene.add(busGroup);

    // Main Coach Chassis
    const bodyGeo = new THREE.BoxGeometry(3.3, 2.75, 10.2);
    const bodyMesh = new THREE.Mesh(bodyGeo, busBodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bodyMesh.position.y = 1.38;
    busGroup.add(bodyMesh);

    // Aerodynamic Curved Roof Cap
    const roofGeo = new THREE.BoxGeometry(3.2, 0.45, 9.8);
    const roofMesh = new THREE.Mesh(roofGeo, busRoofMat);
    roofMesh.position.set(0, 2.85, 0);
    busGroup.add(roofMesh);

    // Roof AC Pod (matching reference)
    const acGeo = new THREE.BoxGeometry(1.6, 0.35, 3.2);
    const acMesh = new THREE.Mesh(acGeo, busRoofMat);
    acMesh.position.set(0, 3.2, -0.6);
    busGroup.add(acMesh);

    // TripPilot Gold Livery Stripes
    const stripeGeo = new THREE.BoxGeometry(3.34, 0.22, 10.24);
    const stripeMesh = new THREE.Mesh(stripeGeo, busGoldMat);
    stripeMesh.position.set(0, 0.8, 0);
    busGroup.add(stripeMesh);

    const stripe2Geo = new THREE.BoxGeometry(3.33, 0.12, 10.22);
    const stripe2Mesh = new THREE.Mesh(stripe2Geo, busGoldMat);
    stripe2Mesh.position.set(0, 2.5, 0);
    busGroup.add(stripe2Mesh);

    // Large Panoramic Front Windshield
    const windshieldGeo = new THREE.BoxGeometry(3.15, 1.45, 0.12);
    const windshieldMesh = new THREE.Mesh(windshieldGeo, glassMat);
    windshieldMesh.position.set(0, 1.9, 5.12);
    windshieldMesh.rotation.x = -0.15;
    busGroup.add(windshieldMesh);

    // Destination LED Sign above windshield
    const createSignTexture = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 96;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#111513';
      ctx.fillRect(0, 0, c.width, c.height);

      ctx.fillStyle = '#C69239';
      ctx.font = 'bold 36px "Cinzel", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#E0A842';
      ctx.shadowBlur = 10;
      ctx.fillText('✈ TRIPPILOT EXPRESS', 256, 36);

      ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#FAF8F5';
      ctx.fillText('✦ LUXURY MOUNTAIN TOUR ✦', 256, 72);

      return new THREE.CanvasTexture(c);
    };

    const signTexture = createSignTexture();
    const signMat = new THREE.MeshBasicMaterial({ map: signTexture });
    const signGeo = new THREE.PlaneGeometry(2.6, 0.55);
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, 2.7, 5.14);
    busGroup.add(signMesh);

    // Driver Dashboard & Cabin Interior
    const dashGeo = new THREE.BoxGeometry(2.8, 0.45, 1.2);
    const dashMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.8 });
    const dashMesh = new THREE.Mesh(dashGeo, dashMat);
    dashMesh.position.set(0, 1.05, 4.4);
    busGroup.add(dashMesh);

    const wheelTorusGeo = new THREE.TorusGeometry(0.28, 0.04, 8, 24);
    const steeringWheel = new THREE.Mesh(wheelTorusGeo, dashMat);
    steeringWheel.position.set(0.85, 1.35, 4.2);
    steeringWheel.rotation.x = Math.PI / 4;
    busGroup.add(steeringWheel);

    // Passenger Seats visible through glass
    for (let r = 0; r < 4; r++) {
      const zRow = 2.8 - r * 1.5;
      const seatLeft = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.5), interiorLeatherMat);
      seatLeft.position.set(-0.95, 1.45, zRow);
      busGroup.add(seatLeft);

      const seatRight = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.5), interiorLeatherMat);
      seatRight.position.set(0.95, 1.45, zRow);
      busGroup.add(seatRight);
    }

    const cabinLight = new THREE.PointLight(0xffdfaa, 1.8, 8);
    cabinLight.position.set(0, 2.2, 2.0);
    busGroup.add(cabinLight);

    // Chrome Bumper & Front Grille
    const grilleGeo = new THREE.BoxGeometry(2.5, 0.65, 0.15);
    const grilleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });
    const grilleMesh = new THREE.Mesh(grilleGeo, grilleMat);
    grilleMesh.position.set(0, 0.55, 5.13);
    busGroup.add(grilleMesh);

    const bumperGeo = new THREE.BoxGeometry(3.32, 0.35, 0.25);
    const bumperMesh = new THREE.Mesh(bumperGeo, busGoldMat);
    bumperMesh.position.set(0, 0.2, 5.16);
    busGroup.add(bumperMesh);

    // Dual Headlights
    const headlightGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16);
    headlightGeo.rotateX(Math.PI / 2);

    const leftHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    leftHeadlight.position.set(1.22, 0.65, 5.16);
    busGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    rightHeadlight.position.set(-1.22, 0.65, 5.16);
    busGroup.add(rightHeadlight);

    // Xenon Beams
    const leftBeam = new THREE.SpotLight(0xfffae8, 0.1, 45, Math.PI / 5, 0.35, 1);
    leftBeam.position.set(1.22, 0.65, 5.2);
    const leftTarget = new THREE.Object3D();
    leftTarget.position.set(1.22, 0, 35);
    scene.add(leftTarget);
    leftBeam.target = leftTarget;
    busGroup.add(leftBeam);

    const rightBeam = new THREE.SpotLight(0xfffae8, 0.1, 45, Math.PI / 5, 0.35, 1);
    rightBeam.position.set(-1.22, 0.65, 5.2);
    const rightTarget = new THREE.Object3D();
    rightTarget.position.set(-1.22, 0, 35);
    scene.add(rightTarget);
    rightBeam.target = rightTarget;
    busGroup.add(rightBeam);

    // Side Windows
    const sideWindowGeo = new THREE.BoxGeometry(0.08, 1.15, 8.8);
    const leftWindowMesh = new THREE.Mesh(sideWindowGeo, glassMat);
    leftWindowMesh.position.set(1.66, 1.88, -0.3);
    busGroup.add(leftWindowMesh);

    const rightWindowMesh = new THREE.Mesh(sideWindowGeo, glassMat);
    rightWindowMesh.position.set(-1.66, 1.88, -0.3);
    busGroup.add(rightWindowMesh);

    // Rear Window & Taillights
    const rearWindowGeo = new THREE.BoxGeometry(2.8, 1.0, 0.08);
    const rearWindowMesh = new THREE.Mesh(rearWindowGeo, glassMat);
    rearWindowMesh.position.set(0, 1.88, -5.12);
    busGroup.add(rearWindowMesh);

    const taillightGeo = new THREE.BoxGeometry(0.35, 0.4, 0.08);
    const leftTaillight = new THREE.Mesh(taillightGeo, taillightMat);
    leftTaillight.position.set(1.28, 0.9, -5.14);
    busGroup.add(leftTaillight);

    const rightTaillight = new THREE.Mesh(taillightGeo, taillightMat);
    rightTaillight.position.set(-1.28, 0.9, -5.14);
    busGroup.add(rightTaillight);

    // Side Mirrors
    const mirrorStemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45);
    mirrorStemGeo.rotateZ(Math.PI / 3);
    const mirrorHousingGeo = new THREE.BoxGeometry(0.2, 0.45, 0.15);

    const leftMirrorGroup = new THREE.Group();
    leftMirrorGroup.position.set(1.8, 1.85, 4.6);
    leftMirrorGroup.add(new THREE.Mesh(mirrorStemGeo, busGoldMat));
    const leftHousing = new THREE.Mesh(mirrorHousingGeo, busBodyMat);
    leftHousing.position.set(0.2, 0.1, 0.05);
    leftMirrorGroup.add(leftHousing);
    busGroup.add(leftMirrorGroup);

    const rightMirrorGroup = new THREE.Group();
    rightMirrorGroup.position.set(-1.8, 1.85, 4.6);
    const rStem = new THREE.Mesh(mirrorStemGeo, busGoldMat);
    rStem.rotation.y = Math.PI;
    rightMirrorGroup.add(rStem);
    const rightHousing = new THREE.Mesh(mirrorHousingGeo, busBodyMat);
    rightHousing.position.set(-0.2, 0.1, 0.05);
    rightMirrorGroup.add(rightHousing);
    busGroup.add(rightMirrorGroup);

    // 6. Wheels (6 wheels for coach)
    const wheels = [];
    const createWheel = (x, z) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(x, -0.72, z);

      const tireGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.5, 24);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.castShadow = true;
      wheelGroup.add(tire);

      const rimGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.52, 16);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheelGroup.add(rim);

      const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.56, 12);
      hubGeo.rotateZ(Math.PI / 2);
      const hub = new THREE.Mesh(hubGeo, busGoldMat);
      wheelGroup.add(hub);

      busGroup.add(wheelGroup);
      wheels.push(wheelGroup);
    };

    createWheel(1.52, 3.4);
    createWheel(-1.52, 3.4);
    createWheel(1.52, -2.4);
    createWheel(-1.52, -2.4);
    createWheel(1.52, -3.7);
    createWheel(-1.52, -3.7);

    // 7. Mountain Road Surface beneath the bus
    const roadGroup = new THREE.Group();
    scene.add(roadGroup);

    const roadGeo = new THREE.PlaneGeometry(14, 280);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x3a4248, // Mountain asphalt matching reference road
      roughness: 0.8,
      metalness: 0.1,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0, 0);
    roadMesh.receiveShadow = true;
    roadGroup.add(roadMesh);

    // White dashed road markings matching reference road
    const stripeCount = 28;
    const roadStripes = [];
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const laneDashGeo = new THREE.PlaneGeometry(0.3, 3.2);
    laneDashGeo.rotateX(-Math.PI / 2);

    for (let i = 0; i < stripeCount; i++) {
      const dash = new THREE.Mesh(laneDashGeo, stripeMat);
      dash.position.set(0, 0.02, (i - stripeCount / 2) * 10);
      roadGroup.add(dash);
      roadStripes.push(dash);
    }

    // Roadside Guardrails matching reference road
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x7c858b,
      metalness: 0.7,
      roughness: 0.4,
    });
    const rails = [];
    for (let i = 0; i < 24; i++) {
      const zPos = (i - 12) * 11;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.85), railMat);
      post.position.set(7.1, 0.42, zPos);
      roadGroup.add(post);
      rails.push(post);

      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 11), railMat);
      beam.position.set(7.1, 0.65, zPos);
      roadGroup.add(beam);
      rails.push(beam);
    }

    // 8. Animation Loop & State Transitions
    let animationFrameId;
    const clock = new THREE.Clock();

    let currentSpeed = 16.0;
    let targetSpeed = 16.0;

    const targetBusPos = new THREE.Vector3(0, 1.45, 0);
    const targetBusRot = new THREE.Euler(0, 0, 0);

    const targetCamPos = new THREE.Vector3(0, 2.5, 10.5);
    const targetCamLook = new THREE.Vector3(0, 2.2, 0);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();
      const currentStage = stageRef.current;

      // STAGE-BASED POSITIONING & CAMERA DIRECTING
      if (currentStage === 'form') {
        // Form inside the bus:
        // Bus in center, facing viewer, camera focused inside front windshield
        targetBusPos.set(0, 1.45, 0);
        targetBusRot.set(0, 0, 0);

        targetCamPos.set(0, 2.45, 9.8);
        targetCamLook.set(0, 2.15, 0);

        targetSpeed = 14.0;
        headlightMat.emissiveIntensity = 0.4;
        leftBeam.intensity = 0.1;
        rightBeam.intensity = 0.1;
      } else if (currentStage === 'welcome') {
        // Step 1: Form disappears, "Welcome to TripPilot" glows
        targetBusPos.set(0, 1.45, 0);
        targetBusRot.set(0, 0, 0);

        targetCamPos.set(0, 3.2, 12.5);
        targetCamLook.set(0, 2.1, 0);

        targetSpeed = 16.0;
        headlightMat.emissiveIntensity = 1.0;
      } else if (currentStage === 'toCenter') {
        // Step 2: Bus in exact center, headlights on, camera zooms out
        targetBusPos.set(0, 1.45, 0);
        targetBusRot.set(0, 0, 0);

        targetCamPos.set(0, 4.4, 16.5);
        targetCamLook.set(0, 2.0, 0);

        targetSpeed = 32.0;
        headlightMat.emissiveIntensity = 3.5;
        leftBeam.intensity = 7;
        rightBeam.intensity = 7;
      } else if (currentStage === 'toRight' || currentStage === 'completed') {
        // Step 3 & 4: Bus moves from center toward the RIGHT side of the screen
        targetBusPos.set(24.0, 1.45, -8.0);
        targetBusRot.set(0, 0.28, -0.03);

        targetCamPos.set(4.5, 4.6, 17.5);
        targetCamLook.set(2.0, 2.0, 0);

        targetSpeed = 85.0; // High speed cruise
        headlightMat.emissiveIntensity = 4.0;
        leftBeam.intensity = 8;
        rightBeam.intensity = 8;
      }

      // Smooth interpolation
      const lerpFactor = delta * 2.2;
      busGroup.position.lerp(targetBusPos, lerpFactor);
      busGroup.rotation.y += (targetBusRot.y - busGroup.rotation.y) * lerpFactor;
      busGroup.rotation.z += (targetBusRot.z - busGroup.rotation.z) * lerpFactor;

      camera.position.lerp(targetCamPos, delta * 2.0);
      camera.lookAt(targetCamLook);

      currentSpeed += (targetSpeed - currentSpeed) * (delta * 3.0);

      // Suspension rumble
      const bounce = Math.sin(time * 8) * 0.025 + Math.cos(time * 12) * 0.015;
      busGroup.position.y = 1.45 + bounce;

      // Rotate wheels synchronized with speed
      const wheelRotation = (currentSpeed / 0.72) * delta;
      wheels.forEach((w) => {
        w.rotation.x += wheelRotation;
      });

      // Move road dashed markings & rails towards -Z
      const moveDistance = currentSpeed * delta;
      roadStripes.forEach((stripe) => {
        stripe.position.z -= moveDistance;
        if (stripe.position.z < -130) stripe.position.z += 260;
      });

      rails.forEach((rail) => {
        rail.position.z -= moveDistance;
        if (rail.position.z < -130) rail.position.z += 260;
      });

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 10. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
      bgTexture.dispose();
      bodyGeo.dispose();
      busBodyMat.dispose();
      busGoldMat.dispose();
      busRoofMat.dispose();
      glassMat.dispose();
      tireMat.dispose();
      rimMat.dispose();
      headlightMat.dispose();
      taillightMat.dispose();
      signTexture.dispose();
      signMat.dispose();
      dashGeo.dispose();
      dashMat.dispose();
      wheelTorusGeo.dispose();
      interiorLeatherMat.dispose();
      grilleGeo.dispose();
      grilleMat.dispose();
      bumperGeo.dispose();
      roadGeo.dispose();
      roadMat.dispose();
      laneDashGeo.dispose();
      stripeMat.dispose();
      railMat.dispose();
    };
  }, []);

  if (!webglSupported) {
    return (
      <div className="bus3d-fallback">
        <div className="fallback-sunset-sky" style={{ backgroundImage: `url(${mountainRefImg})` }}>
          <div className="fallback-sun"></div>
          <div className="fallback-road">
            <div className={`fallback-bus ${stage === 'toRight' ? 'fallback-exit-right' : ''}`}>
              <span className="fallback-bus-logo">TripPilot Express</span>
              <div className="fallback-wheels">
                <div className="fallback-wheel left"></div>
                <div className="fallback-wheel right"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bus3d-viewport" ref={mountRef}>
      <div className="bus3d-vignette-overlay" />
    </div>
  );
};

export default Bus3DScene;
