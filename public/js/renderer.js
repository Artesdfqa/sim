// ============================================================
// 3D RENDERER - Three.js Supermarket World
// ============================================================

class SupermarketRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.clock = new THREE.Clock();
    this.objects = {};
    this.customers = [];
    this.dayTime = 0.5; // 0-1 cycle

    // FPS controls
    this.keys = {};
    this.mouseX = 0; this.mouseY = 0;
    this.yaw = 0; this.pitch = 0;
    this.isPointerLocked = false;
    this.moveSpeed = 5;

    this.setupScene();
    this.setupLights();
    this.setupControls();
    this.buildStore();
    this.animate();
  }

  setupScene() {
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 20, 50);

    // Camera starting position - inside store
    this.camera.position.set(0, 1.7, 8);
    this.camera.lookAt(0, 1.7, 0);
  }

  setupLights() {
    // Ambient
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    // Sun/sky directional
    this.sunLight = new THREE.DirectionalLight(0xfff5e0, 1.0);
    this.sunLight.position.set(10, 20, 5);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.camera.left = -20;
    this.sunLight.shadow.camera.right = 20;
    this.sunLight.shadow.camera.top = 20;
    this.sunLight.shadow.camera.bottom = -20;
    this.scene.add(this.sunLight);

    // Store ceiling lights (point lights)
    this.storeLights = [];
    const positions = [[-4,3.8,-2], [0,3.8,-2], [4,3.8,-2], [-4,3.8,2], [0,3.8,2], [4,3.8,2]];
    positions.forEach(([x,y,z]) => {
      const light = new THREE.PointLight(0xfff8e7, 0.8, 8);
      light.position.set(x, y, z);
      light.castShadow = true;
      this.scene.add(light);
      this.storeLights.push(light);

      // Light fixture geometry
      const fixtureGeo = new THREE.BoxGeometry(0.8, 0.05, 0.3);
      const fixtureMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff8e7, emissiveIntensity: 0.5 });
      const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
      fixture.position.set(x, 3.95, z);
      this.scene.add(fixture);
    });
  }

  setupControls() {
    document.addEventListener('keydown', e => { this.keys[e.code] = true; });
    document.addEventListener('keyup', e => { this.keys[e.code] = false; });

    this.canvas.addEventListener('click', () => {
      if (!this.isPointerLocked) this.canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.canvas;
    });

    document.addEventListener('mousemove', e => {
      if (this.isPointerLocked) {
        this.yaw -= e.movementX * 0.002;
        this.pitch -= e.movementY * 0.002;
        this.pitch = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.pitch));
      }
    });
  }

  createMaterial(color, roughness=0.8, metalness=0) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness });
  }

  buildStore() {
    // === FLOOR ===
    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = this.createMaterial(0xE8E0D5, 0.9);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Floor tiles pattern
    const tileGeo = new THREE.PlaneGeometry(1, 1);
    const tileMat = new THREE.MeshStandardMaterial({ color: 0xD0C8BC, roughness:0.95 });
    for (let x = -9; x <= 9; x += 2) {
      for (let z = -9; z <= 9; z += 2) {
        const tile = new THREE.Mesh(tileGeo, tileMat);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(x, 0.001, z);
        this.scene.add(tile);
      }
    }

    // === CEILING ===
    const ceilGeo = new THREE.PlaneGeometry(12, 12);
    const ceilMat = this.createMaterial(0xF5F0EB, 0.95);
    const ceil = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, 4, 0);
    this.scene.add(ceil);

    // === WALLS ===
    this.buildWalls();

    // === SHELVING UNITS ===
    this.buildShelves();

    // === CHECKOUT COUNTER ===
    this.buildCheckout();

    // === EXTERIOR ===
    this.buildExterior();

    // === ENTRANCE ===
    this.buildEntrance();

    // Products on shelves (will be updated by game)
    this.shelfProducts = [];
  }

  buildWalls() {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xF0EBE3, roughness: 0.9 });
    const wallConfigs = [
      // [width, height, x, z, rotY]
      [12, 4, 0, -6, 0],       // back wall
      [12, 4, -6, 0, Math.PI/2], // left wall
      [12, 4, 6, 0, -Math.PI/2],  // right wall
    ];

    wallConfigs.forEach(([w,h,x,z,ry]) => {
      const geo = new THREE.BoxGeometry(w, h, 0.15);
      const wall = new THREE.Mesh(geo, wallMat);
      wall.position.set(x, 2, z);
      wall.rotation.y = ry;
      wall.receiveShadow = true;
      wall.castShadow = true;
      this.scene.add(wall);
    });

    // Front wall with door
    const fWallL = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 0.15), wallMat);
    fWallL.position.set(-4.5, 2, 6);
    this.scene.add(fWallL);
    const fWallR = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 0.15), wallMat);
    fWallR.position.set(4.5, 2, 6);
    this.scene.add(fWallR);
    const fWallTop = new THREE.Mesh(new THREE.BoxGeometry(6, 1.5, 0.15), wallMat);
    fWallTop.position.set(0, 3.25, 6);
    this.scene.add(fWallTop);

    // Wainscoting / baseboard
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0xD4CFC8, roughness: 0.8 });
    const bbConfigs = [
      [12, 0, -5.93], [12, 0, 5.93], [12, -5.93, 0, true], [12, 5.93, 0, true]
    ];
    bbConfigs.forEach(([len, px, pz, rotated]) => {
      const geo = new THREE.BoxGeometry(rotated ? 0.1 : len, 0.15, rotated ? len : 0.1);
      const bb = new THREE.Mesh(geo, baseboardMat);
      bb.position.set(px, 0.075, pz);
      this.scene.add(bb);
    });
  }

  buildShelves() {
    this.shelfUnits = [];
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.7, metalness: 0.1 });
    const shelfPlateMat = new THREE.MeshStandardMaterial({ color: 0xC4A882, roughness: 0.6 });

    const shelfConfigs = [
      // [x, z, rotY, rows, label]
      [-4, -3, 0, 3, 'grocery'],
      [-4, 0, 0, 3, 'dairy'],
      [-4, 3, 0, 3, 'drinks'],
      [0, -3, 0, 3, 'produce'],
      [0, 0, 0, 3, 'snacks'],
      [4, -3, 0, 3, 'hygiene'],
    ];

    shelfConfigs.forEach(([x, z, ry, rows, label], idx) => {
      const group = new THREE.Group();

      // Back panel
      const back = new THREE.Mesh(new THREE.BoxGeometry(2, 2.2, 0.08), shelfMat);
      back.position.set(0, 1.1, -0.46);
      back.castShadow = true;
      group.add(back);

      // Side panels
      [-1, 1].forEach(side => {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.2, 0.95), shelfMat);
        panel.position.set(side, 1.1, 0);
        group.add(panel);
      });

      // Shelf plates
      for (let r = 0; r < rows; r++) {
        const y = 0.4 + r * 0.7;
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(2, 0.04, 0.9), shelfPlateMat);
        shelf.position.set(0, y, 0);
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        group.add(shelf);
      }

      // Price tag rail
      for (let r = 0; r < rows; r++) {
        const y = 0.35 + r * 0.7;
        const rail = new THREE.Mesh(new THREE.BoxGeometry(2, 0.06, 0.03), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.5 }));
        rail.position.set(0, y, 0.435);
        group.add(rail);
      }

      group.position.set(x, 0, z);
      group.rotation.y = ry;
      this.scene.add(group);
      this.shelfUnits.push({ group, label, x, z });
    });
  }

  buildCheckout() {
    const counterMat = this.createMaterial(0x5D4037, 0.7, 0.2);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x90CAF9, transparent: true, opacity: 0.3, roughness: 0.1 });

    // Counter body
    const counter = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 0.8), counterMat);
    counter.position.set(4, 0.5, 4.5);
    counter.castShadow = true;
    this.scene.add(counter);

    // Counter top
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.05, 0.9), this.createMaterial(0x795548, 0.5, 0.3));
    top.position.set(4, 1.02, 4.5);
    this.scene.add(top);

    // Screen (monitor)
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.05), new THREE.MeshStandardMaterial({ color: 0x1a1a2e, emissive: 0x3498db, emissiveIntensity: 0.3 }));
    screen.position.set(4.2, 1.35, 4.2);
    this.scene.add(screen);

    // Cash register
    const register = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.25), this.createMaterial(0x333333, 0.6, 0.4));
    register.position.set(3.6, 1.1, 4.3);
    this.scene.add(register);

    // Divider glass panel
    const divider = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 0.03), glassMat);
    divider.position.set(4, 1.35, 4.1);
    this.scene.add(divider);

    // Signage above checkout
    const signGeo = new THREE.BoxGeometry(2, 0.4, 0.05);
    const signMat = new THREE.MeshStandardMaterial({ color: 0x2196F3, emissive: 0x1565C0, emissiveIntensity: 0.5 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(4, 3.0, 4.5);
    this.scene.add(sign);
  }

  buildExterior() {
    // Street / sidewalk outside
    const sidewalkGeo = new THREE.PlaneGeometry(30, 10);
    const sidewalkMat = this.createMaterial(0xB0A090, 0.95);
    const sidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    sidewalk.rotation.x = -Math.PI / 2;
    sidewalk.position.set(0, -0.01, 12);
    this.scene.add(sidewalk);

    // Building exterior front
    const extMat = this.createMaterial(0xD2C4B0, 0.9);
    const extWall = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 0.3), extMat);
    extWall.position.set(0, 3, 6.15);
    this.scene.add(extWall);

    // Store sign
    const signBg = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 0.1), new THREE.MeshStandardMaterial({ color: 0xFF5722, emissive: 0xE64A19, emissiveIntensity: 0.6 }));
    signBg.position.set(0, 5.5, 6.2);
    this.scene.add(signBg);

    // Parking lot markings
    for (let i = -4; i <= 4; i += 3) {
      const marking = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.1), new THREE.MeshStandardMaterial({ color: 0xFFFFFF }));
      marking.rotation.x = -Math.PI / 2;
      marking.position.set(i, 0, 15);
      this.scene.add(marking);
    }

    // Street lamp
    this.addStreetLamp(5, 10);
    this.addStreetLamp(-5, 10);

    // Trees
    this.addTree(-8, 12);
    this.addTree(8, 12);
    this.addTree(-10, 8);
  }

  addStreetLamp(x, z) {
    const poleMat = this.createMaterial(0x444444, 0.8, 0.5);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 4, 8), poleMat);
    pole.position.set(x, 2, z);
    this.scene.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.05), poleMat);
    arm.position.set(x + 0.4, 4.1, z);
    this.scene.add(arm);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshStandardMaterial({ color: 0xFFF9C4, emissive: 0xFFD54F, emissiveIntensity: 0.8 }));
    head.position.set(x + 0.8, 4.1, z);
    this.scene.add(head);
    const lampLight = new THREE.PointLight(0xFFF0A0, 1.5, 8);
    lampLight.position.set(x + 0.8, 4.1, z);
    this.scene.add(lampLight);
    this.storeLights.push(lampLight);
  }

  addTree(x, z) {
    const trunkMat = this.createMaterial(0x5D4037, 0.9);
    const leavesMat = this.createMaterial(0x2E7D32, 0.8);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.5, 8), trunkMat);
    trunk.position.set(x, 0.75, z);
    this.scene.add(trunk);
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), leavesMat);
    leaves.position.set(x, 2.2, z);
    this.scene.add(leaves);
    const leaves2 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), new THREE.MeshStandardMaterial({ color: 0x388E3C, roughness: 0.9 }));
    leaves2.position.set(x + 0.3, 2.7, z - 0.2);
    this.scene.add(leaves2);
  }

  buildEntrance() {
    // Door frame
    const frameMat = this.createMaterial(0xCFD8DC, 0.6, 0.3);
    const doorGeo = new THREE.BoxGeometry(0.1, 2.5, 1.5);
    [-0.75, 0.75].forEach(x => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3, 0.1), frameMat);
      frame.position.set(x, 1.5, 6);
      this.scene.add(frame);
    });
    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.1), frameMat);
    topFrame.position.set(0, 3, 6);
    this.scene.add(topFrame);

    // Door mats
    const matGeo = new THREE.BoxGeometry(1.4, 0.02, 0.8);
    const matMaterial = new THREE.MeshStandardMaterial({ color: 0x3E2723, roughness: 1.0 });
    const mat = new THREE.Mesh(matGeo, matMaterial);
    mat.position.set(0, 0.01, 6.4);
    this.scene.add(mat);
  }

  addProductToShelf(productId, amount, shelfIndex) {
    if (shelfIndex >= this.shelfUnits.length) return;
    const unit = this.shelfUnits[shelfIndex];
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    // Place simple box products on shelf
    const colors = { grocery: 0xFFF8DC, dairy: 0xF5F5DC, drinks: 0xE3F2FD, produce: 0xE8F5E9, snacks: 0xFFF3E0, hygiene: 0xE8EAF6 };
    const color = colors[product.shelf] || 0xFFFFFF;

    const num = Math.min(amount, 6);
    for (let i = 0; i < num; i++) {
      const geo = new THREE.BoxGeometry(0.18, 0.25, 0.18);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
      const box = new THREE.Mesh(geo, mat);
      const row = Math.floor(i / 3);
      const col = i % 3;
      box.position.set(unit.x - 0.35 + col * 0.35, 0.55 + row * 0.7, unit.z - 0.15);
      box.castShadow = true;
      this.scene.add(box);
      this.shelfProducts.push(box);
    }
  }

  spawnCustomer() {
    // Simple customer representation
    const bodyMat = new THREE.MeshStandardMaterial({ color: Math.random() > 0.5 ? 0x3F51B5 : 0xE91E63, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xFFCBA4, roughness: 0.9 });

    const group = new THREE.Group();
    // Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.0, 8), bodyMat);
    body.position.y = 0.5;
    group.add(body);
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), skinMat);
    head.position.y = 1.2;
    group.add(head);
    // Arms
    [-0.22, 0.22].forEach(x => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6), bodyMat);
      arm.rotation.z = x > 0 ? 0.3 : -0.3;
      arm.position.set(x, 0.7, 0);
      group.add(arm);
    });

    // Random start position near entrance
    group.position.set((Math.random() - 0.5) * 1.5, 0, 5.5);
    this.scene.add(group);

    // Waypoints: entrance -> random shelf -> checkout -> exit
    const waypoints = [
      new THREE.Vector3((Math.random() - 0.5) * 6, 0, Math.random() * 4 - 5),
      new THREE.Vector3((Math.random() - 0.5) * 4, 0, Math.random() * 2 - 1),
      new THREE.Vector3(4, 0, 4),  // checkout
      new THREE.Vector3((Math.random() - 0.5) * 2, 0, 8),  // exit
    ];

    this.customers.push({ group, waypoints, waypointIdx: 0, speed: 1 + Math.random() * 0.5, life: 300 });
  }

  updateCustomers(dt) {
    for (let i = this.customers.length - 1; i >= 0; i--) {
      const c = this.customers[i];
      c.life -= dt * 60;
      if (c.life <= 0) {
        this.scene.remove(c.group);
        this.customers.splice(i, 1);
        continue;
      }

      const target = c.waypoints[c.waypointIdx];
      const dist = c.group.position.distanceTo(target);
      if (dist < 0.3) {
        c.waypointIdx = Math.min(c.waypointIdx + 1, c.waypoints.length - 1);
      } else {
        const dir = target.clone().sub(c.group.position).normalize();
        c.group.position.addScaledVector(dir, c.speed * dt);
        c.group.lookAt(target);
      }

      // Slight bobbing
      c.group.children[0].position.y = 0.5 + Math.sin(Date.now() * 0.01 * c.speed) * 0.02;
    }
  }

  updateDayNight(hour) {
    const t = hour / 24;
    // Dawn: 5-7, Day: 7-18, Dusk: 18-20, Night: 20-5
    let skyColor, sunIntensity, ambientIntensity;
    if (t < 0.2) { // Night
      skyColor = new THREE.Color(0x0a0a2a);
      sunIntensity = 0.05;
      ambientIntensity = 0.1;
    } else if (t < 0.3) { // Dawn
      skyColor = new THREE.Color(0xFFB74D).lerp(new THREE.Color(0x87CEEB), (t - 0.2) / 0.1);
      sunIntensity = 0.3 + (t - 0.2) * 7;
      ambientIntensity = 0.2 + (t - 0.2) * 2;
    } else if (t < 0.75) { // Day
      skyColor = new THREE.Color(0x87CEEB);
      sunIntensity = 1.0;
      ambientIntensity = 0.4;
    } else if (t < 0.85) { // Dusk
      skyColor = new THREE.Color(0xFF7043);
      sunIntensity = 0.5 - (t - 0.75) * 5;
      ambientIntensity = 0.2;
    } else { // Night
      skyColor = new THREE.Color(0x0a0a2a);
      sunIntensity = 0.05;
      ambientIntensity = 0.1;
    }
    this.scene.background = skyColor;
    this.scene.fog.color = skyColor;
    this.sunLight.intensity = sunIntensity;
    this.ambientLight.intensity = ambientIntensity;

    // Sun position
    const angle = (t - 0.5) * Math.PI * 2;
    this.sunLight.position.set(Math.cos(angle) * 20, Math.abs(Math.sin(angle)) * 20 + 2, 5);

    // Street lamps on at night
    const lampsOn = t < 0.3 || t > 0.75;
    this.storeLights.slice(-4).forEach(l => { l.intensity = lampsOn ? 1.5 : 0; });
  }

  updateMovement(dt) {
    const direction = new THREE.Vector3();
    const right = new THREE.Vector3();
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, this.yaw, 0));
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    if (this.keys['KeyW'] || this.keys['ArrowUp']) direction.add(forward);
    if (this.keys['KeyS'] || this.keys['ArrowDown']) direction.sub(forward);
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) direction.sub(right);
    if (this.keys['KeyD'] || this.keys['ArrowRight']) direction.add(right);

    if (direction.lengthSq() > 0) {
      direction.normalize().multiplyScalar(this.moveSpeed * dt);
      this.camera.position.add(direction);
      // Clamp inside store + outside
      this.camera.position.x = Math.max(-5.5, Math.min(5.5, this.camera.position.x));
      this.camera.position.z = Math.max(-5.5, Math.min(16, this.camera.position.z));
      this.camera.position.y = 1.7; // fixed height
    }

    // Apply look
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  updateShelfDisplay(inventory) {
    // Remove old product meshes
    this.shelfProducts.forEach(m => this.scene.remove(m));
    this.shelfProducts = [];

    // Re-add based on current inventory
    const shelfMap = { grocery: 0, dairy: 1, drinks: 2, produce: 3, snacks: 4, hygiene: 5 };
    PRODUCTS.forEach(p => {
      const inv = inventory[p.id];
      if (!inv || inv.shelfStock <= 0) return;
      const shelfIdx = shelfMap[p.shelf] ?? 0;
      this.addProductToShelf(p.id, Math.ceil(inv.shelfStock / 5), shelfIdx);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.updateMovement(dt);
    this.updateCustomers(dt);

    // Subtle floating particles (dust)
    this.renderer.render(this.scene, this.camera);
  }

  onResize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}

window.SupermarketRenderer = SupermarketRenderer;
