import * as CANNON from 'https://cdn.skypack.dev/cannon-es';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const canvasEl = document.querySelector('#canvas');
const scoreResult = document.querySelector('#score-result');
const rollBtn = document.querySelector('#roll-btn');
const nextRoundBtn = document.querySelector('#next-round-btn');
const kickTableBtn = document.querySelector('#kick-table-btn');
const roundNumber = document.querySelector('#round-number');
const targetScore = document.querySelector('#target-score');
const rerollsLeft = document.querySelector('#rerolls-left');
const moneyAmount = document.querySelector('#money-amount');
const roundSummary = document.querySelector('#round-summary');
const earningsContent = document.querySelector('#earnings-content');
const buyDiceBtn = document.querySelector('#buy-dice-btn');
const dicePrice = document.querySelector('#dice-price');
const buyRerollBtn = document.querySelector('#buy-reroll-btn');
const rerollPrice = document.querySelector('#reroll-price');
const buyDuckBtn = document.querySelector('#buy-duck-btn');
const comboInfo = document.querySelector('#combo-info');
const darkModeToggle = document.querySelector('#dark-mode-toggle');
const versionInfo = document.querySelector('#version-info');

let renderer, scene, camera, diceMesh, physicsWorld;
let raycaster, mouse;
let floorMesh;  // Store reference to floor
const lockSprites = [];

// Game state
const gameState = {
    round: 1,
    targetScore: 7,
    currentScore: 0,
    rerollsRemaining: 3,
    diceScores: [],
    lockedDice: new Set(),
    canRoll: true,
    roundComplete: false,
    hasRolled: false,  // Track if dice have been rolled yet
    money: 0,  // Player's money
    lastEarnings: 0,  // Track earnings from last round
    diceBaseCost: 10,  // Base cost for dice
    dicePurchased: 0,  // Track number of dice purchased
    rerollBaseCost: 5,  // Base cost for rerolls
    rerollsPurchased: 0,  // Track number of rerolls purchased
    diceRolling: false,  // Track if dice are currently rolling
    hasDuck: false  // Track if lucky duck has been acquired
};

// Target scores for each round (gets progressively harder)
const roundTargets = [7, 12, 18, 25, 33, 42, 52, 63, 75, 88];

const params = {
    numberOfDice: 2,
    segments: 40,
    edgeRadius: .07,
    notchRadius: .12,
    notchDepth: .1,
};

const diceArray = [];
let kickTableTimeout = null;  // Track timeout for showing kick button

// SVG icons for dark mode toggle
const moonSVG = `<svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
</svg>`;

const sunSVG = `<svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
    <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
    <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
    <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
</svg>`;

// Load dark mode preference BEFORE scene init
const savedDarkMode = localStorage.getItem('darkMode') === 'true';
if (savedDarkMode) {
    document.body.classList.add('dark-mode');
    darkModeToggle.innerHTML = sunSVG;
    // Flag to apply dark mode after scene init
    window.needsDarkModeInit = true;
}

// Display version info
if (versionInfo) {
    // Version from package.json and git commit
    const version = '1.0.0';
    const commit = '365362e'; // Will be updated with each deploy
    versionInfo.textContent = `v${version}-${commit}`;
}

initPhysics();
initScene();

window.addEventListener('resize', updateSceneSize);
window.addEventListener('dblclick', handleRoll);
rollBtn.addEventListener('click', handleRoll);
nextRoundBtn.addEventListener('click', nextRound);
kickTableBtn.addEventListener('click', kickTable);
if (buyDiceBtn) {
    buyDiceBtn.addEventListener('click', buyDice);
    console.log('Buy dice button listener added');
}
if (buyRerollBtn) {
    buyRerollBtn.addEventListener('click', buyReroll);
}
if (buyDuckBtn) {
    buyDuckBtn.addEventListener('click', buyDuck);
}
canvasEl.addEventListener('click', handleDiceClick);
canvasEl.addEventListener('mousemove', handleMouseMove);

// Dark mode toggle
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    darkModeToggle.innerHTML = isDarkMode ? sunSVG : moonSVG;
    localStorage.setItem('darkMode', isDarkMode);
    updateDiceMaterialsForDarkMode(isDarkMode);
});

function updateDiceMaterialsForDarkMode(isDarkMode) {
    console.log('updateDiceMaterialsForDarkMode called, isDarkMode:', isDarkMode);
    console.log('Scene exists:', !!scene, 'FloorMesh exists:', !!floorMesh);
    
    // Update lighting for dark mode
    if (scene) {
        const ambientLight = scene.children.find(child => child.type === 'AmbientLight');
        console.log('Ambient light found:', !!ambientLight);
        if (ambientLight) {
            ambientLight.intensity = isDarkMode ? 0.15 : 0.5;
            console.log('Ambient light intensity set to:', ambientLight.intensity);
        }
        
        // Update the floor material
        if (floorMesh) {
            console.log('Current floor material type:', floorMesh.material.type);
            if (isDarkMode) {
                // Switch to a standard material that can receive light
                if (!floorMesh.userData.darkMaterial) {
                    console.log('Creating new dark material');
                    floorMesh.userData.darkMaterial = new THREE.MeshStandardMaterial({
                        color: 0x0a0a0a,
                        roughness: 1,
                        metalness: 0,
                        transparent: true,
                        opacity: 0.5
                    });
                    floorMesh.userData.lightMaterial = floorMesh.material;
                }
                floorMesh.material = floorMesh.userData.darkMaterial;
                floorMesh.receiveShadow = true;
                console.log('Floor material switched to dark:', floorMesh.material.type);
            } else {
                // Switch back to shadow material
                if (floorMesh.userData.lightMaterial) {
                    floorMesh.material = floorMesh.userData.lightMaterial;
                    console.log('Floor material switched to light:', floorMesh.material.type);
                }
                floorMesh.receiveShadow = true;
            }
        } else {
            console.log('FloorMesh not found!');
        }
    } else {
        console.log('Scene not found!');
    }
    
    // Remove old glow lights
    const glowLights = scene.children.filter(child => child.userData.isGlowLight);
    console.log('Removing', glowLights.length, 'old glow lights');
    glowLights.forEach(light => scene.remove(light));
    
    console.log('Processing', diceArray.length, 'dice');
    diceArray.forEach((dice, index) => {
        if (dice && dice.mesh) {
            // Find the outer mesh (white part of dice)
            const outerMesh = dice.mesh.children.find(child => 
                child.material && child.material.color);
            
            if (outerMesh) {
                if (isDarkMode) {
                    // Keep dice normal but add subtle rim lighting
                    outerMesh.material.emissive = new THREE.Color(0x6699ff);
                    outerMesh.material.emissiveIntensity = 0.1;
                    
                    // Add a point light under each dice for glow effect
                    const glowLight = new THREE.PointLight(0x4488ff, 2, 8);
                    glowLight.position.copy(dice.mesh.position);
                    glowLight.position.y = 0;
                    glowLight.userData.isGlowLight = true;
                    glowLight.userData.diceIndex = index;
                    scene.add(glowLight);
                } else {
                    // Normal dice in light mode
                    outerMesh.material.emissive = new THREE.Color(0x000000);
                    outerMesh.material.emissiveIntensity = 0;
                }
            }
        }
    });
}

function initScene() {

    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas: canvasEl
    });
    renderer.shadowMap.enabled = true
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, .1, 300)
    camera.position.set(0, .5, 4).multiplyScalar(5);

    // Initialize raycaster for mouse picking
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    updateSceneSize();

    const ambientLight = new THREE.AmbientLight(0xffffff, .5);
    scene.add(ambientLight);
    const topLight = new THREE.PointLight(0xffffff, .5);
    topLight.position.set(10, 15, 0);
    topLight.castShadow = true;
    topLight.shadow.mapSize.width = 2048;
    topLight.shadow.mapSize.height = 2048;
    topLight.shadow.camera.near = 5;
    topLight.shadow.camera.far = 400;
    scene.add(topLight);
    
    createFloor();
    diceMesh = createDiceMesh();
    for (let i = 0; i < params.numberOfDice; i++) {
        diceArray.push(createDice(i));
        addDiceEvents(diceArray[i], i);
    }
    
    // Rubber ducky is loaded via store purchase
    // loadRubberDucky();
    
    // Position initial dice
    repositionAllDice();

    // Initialize game
    updateUI();
    // Don't throw dice on page load

    render();
    
    // Apply dark mode settings after render starts with a delay
    if (window.needsDarkModeInit) {
        setTimeout(() => {
            console.log('Applying dark mode on init');
            updateDiceMaterialsForDarkMode(true);
            // Force a re-render
            renderer.render(scene, camera);
        }, 500);
    }
}

function initPhysics() {
    physicsWorld = new CANNON.World({
        allowSleep: true,
        gravity: new CANNON.Vec3(0, -50, 0),
    })
    physicsWorld.defaultContactMaterial.restitution = .3;
}

function createFloor() {
    floorMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000),
        new THREE.ShadowMaterial({
            opacity: .1
        })
    )
    floorMesh.receiveShadow = true;
    floorMesh.position.y = -3;
    floorMesh.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI * .5);
    scene.add(floorMesh);

    const floorBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Plane(),
    });
    floorBody.position.copy(floorMesh.position);
    floorBody.quaternion.copy(floorMesh.quaternion);
    physicsWorld.addBody(floorBody);
    
    // Add invisible walls to keep dice on screen (especially for mobile)
    createInvisibleWalls();
}

function createInvisibleWalls() {
    // Calculate exact viewport boundaries based on camera FOV and aspect ratio
    const fov = camera.fov * Math.PI / 180; // Convert to radians
    const aspect = camera.aspect;
    
    // Camera position from position.set(0, .5, 4).multiplyScalar(5)
    const cameraZ = 20; // 4 * 5
    const cameraY = 2.5; // 0.5 * 5
    const floorY = -3;
    
    // Calculate distance from camera to the playing area
    // We need to consider both the vertical and horizontal distance
    const verticalDistance = Math.abs(cameraY - floorY);
    const totalDistance = Math.sqrt(cameraZ * cameraZ + verticalDistance * verticalDistance);
    
    // Calculate visible width at the dice playing area
    const visibleHeight = 2 * Math.tan(fov / 2) * totalDistance;
    const visibleWidth = visibleHeight * aspect;
    
    // Add safety margin to account for dice bouncing - looser walls for more play area
    const isMobile = window.innerWidth < 768;
    const margin = isMobile ? 0.85 : 0.9; // More room to play
    const wallDistance = (visibleWidth / 2) * margin;
    const wallHeight = 50; // Make walls tall enough
    const wallThickness = 1;
    
    // Clear any existing walls first
    clearInvisibleWalls();
    
    // Store wall references for later removal
    gameState.walls = [];
    
    // Left wall
    const leftWall = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight, 20)),
        position: new CANNON.Vec3(-wallDistance, 0, 0)
    });
    physicsWorld.addBody(leftWall);
    gameState.walls.push(leftWall);
    
    // Right wall
    const rightWall = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight, 20)),
        position: new CANNON.Vec3(wallDistance, 0, 0)
    });
    physicsWorld.addBody(rightWall);
    gameState.walls.push(rightWall);
    
    // Front wall (closer to camera)
    const frontWall = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Box(new CANNON.Vec3(wallDistance, wallHeight, wallThickness)),
        position: new CANNON.Vec3(0, 0, 10)
    });
    physicsWorld.addBody(frontWall);
    gameState.walls.push(frontWall);
    
    // Back wall (further from camera)
    const backWall = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Box(new CANNON.Vec3(wallDistance, wallHeight, wallThickness)),
        position: new CANNON.Vec3(0, 0, -10)
    });
    physicsWorld.addBody(backWall);
    gameState.walls.push(backWall);
}

function clearInvisibleWalls() {
    // Remove existing walls if any
    if (gameState.walls) {
        gameState.walls.forEach(wall => {
            physicsWorld.removeBody(wall);
        });
        gameState.walls = [];
    }
}

let duckBody = null; // Store physics body for the duck
let duckMesh = null; // Store the duck mesh for removal

function loadRubberDucky() {
    const loader = new GLTFLoader();
    loader.load(
        'src/duck.glb',
        function (gltf) {
            const duck = gltf.scene;
            duckMesh = duck; // Store reference globally
            
            // Scale and position the duck
            duck.scale.set(1.4, 1.4, 1.4); // Big duck!
            duck.position.set(2, 10, -5); // Start high above for drop effect
            duck.rotation.y = Math.PI; // Rotate 180 degrees to face left
            
            // Make it cast shadows
            duck.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            scene.add(duck);
            
            // Create physics body for the duck - smaller collision box to match visual better
            const duckShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1)); // Smaller collision box
            duckBody = new CANNON.Body({
                mass: 5,
                shape: duckShape,
                material: new CANNON.Material({
                    friction: 0.4,
                    restitution: 0.2 // Less bounce
                })
            });
            
            duckBody.position.set(2, 10, -5);
            duckBody.quaternion.setFromEuler(0, Math.PI, 0);
            physicsWorld.addBody(duckBody);
            
            // Update duck position in animation loop
            const updateDuck = () => {
                if (duckBody && duck) {
                    // Offset the visual mesh to sit properly on the ground
                    duck.position.x = duckBody.position.x;
                    duck.position.y = duckBody.position.y - 1; // Offset down since collision box center is higher
                    duck.position.z = duckBody.position.z;
                    duck.quaternion.copy(duckBody.quaternion);
                    
                    // Stop updating once it settles
                    if (Math.abs(duckBody.velocity.y) < 0.01 && duckBody.position.y < -1) {
                        return;
                    }
                    requestAnimationFrame(updateDuck);
                }
            };
            updateDuck();
            
            console.log('Rubber ducky dropped!');
        },
        function (progress) {
            console.log('Loading duck...', (progress.loaded / progress.total * 100) + '%');
        },
        function (error) {
            console.error('Error loading duck:', error);
        }
    );
}

function createDiceMesh() {
    const boxMaterialOuter = new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
    })
    const boxMaterialInner = new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0,
        metalness: 1,
        side: THREE.DoubleSide
    })

    const diceMesh = new THREE.Group();
    const innerMesh = new THREE.Mesh(createInnerGeometry(), boxMaterialInner);
    const outerMesh = new THREE.Mesh(createBoxGeometry(), boxMaterialOuter);
    outerMesh.castShadow = true;
    diceMesh.add(innerMesh, outerMesh);

    return diceMesh;
}

function createDice(index) {
    const mesh = diceMesh.clone();
    mesh.userData.diceIndex = index;
    scene.add(mesh);

    const body = new CANNON.Body({
        mass: 1,
        shape: new CANNON.Box(new CANNON.Vec3(.5, .5, .5)),
        sleepTimeLimit: .1
    });
    
    // Set initial position for dice (will be positioned properly later)
    body.position.set(0, 0, 0);
    mesh.position.copy(body.position);
    
    // Create lock sprite for this dice
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    context.font = 'bold 96px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('🔒', 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        opacity: 0.9
    });
    const lockSprite = new THREE.Sprite(spriteMaterial);
    lockSprite.scale.set(0.5, 0.5, 0.5);  // Make it smaller
    lockSprite.visible = false;
    lockSprite.raycast = () => {};  // Disable raycasting for the sprite
    scene.add(lockSprite);
    lockSprites[index] = lockSprite;
    
    physicsWorld.addBody(body);

    return {mesh, body, index};
}

function createBoxGeometry() {

    let boxGeometry = new THREE.BoxGeometry(1, 1, 1, params.segments, params.segments, params.segments);

    const positionAttr = boxGeometry.attributes.position;
    const subCubeHalfSize = .5 - params.edgeRadius;


    for (let i = 0; i < positionAttr.count; i++) {

        let position = new THREE.Vector3().fromBufferAttribute(positionAttr, i);

        const subCube = new THREE.Vector3(Math.sign(position.x), Math.sign(position.y), Math.sign(position.z)).multiplyScalar(subCubeHalfSize);
        const addition = new THREE.Vector3().subVectors(position, subCube);

        if (Math.abs(position.x) > subCubeHalfSize && Math.abs(position.y) > subCubeHalfSize && Math.abs(position.z) > subCubeHalfSize) {
            addition.normalize().multiplyScalar(params.edgeRadius);
            position = subCube.add(addition);
        } else if (Math.abs(position.x) > subCubeHalfSize && Math.abs(position.y) > subCubeHalfSize) {
            addition.z = 0;
            addition.normalize().multiplyScalar(params.edgeRadius);
            position.x = subCube.x + addition.x;
            position.y = subCube.y + addition.y;
        } else if (Math.abs(position.x) > subCubeHalfSize && Math.abs(position.z) > subCubeHalfSize) {
            addition.y = 0;
            addition.normalize().multiplyScalar(params.edgeRadius);
            position.x = subCube.x + addition.x;
            position.z = subCube.z + addition.z;
        } else if (Math.abs(position.y) > subCubeHalfSize && Math.abs(position.z) > subCubeHalfSize) {
            addition.x = 0;
            addition.normalize().multiplyScalar(params.edgeRadius);
            position.y = subCube.y + addition.y;
            position.z = subCube.z + addition.z;
        }

        const notchWave = (v) => {
            v = (1 / params.notchRadius) * v;
            v = Math.PI * Math.max(-1, Math.min(1, v));
            return params.notchDepth * (Math.cos(v) + 1.);
        }
        const notch = (pos) => notchWave(pos[0]) * notchWave(pos[1]);

        const offset = .23;

        if (position.y === .5) {
            position.y -= notch([position.x, position.z]);
        } else if (position.x === .5) {
            position.x -= notch([position.y + offset, position.z + offset]);
            position.x -= notch([position.y - offset, position.z - offset]);
        } else if (position.z === .5) {
            position.z -= notch([position.x - offset, position.y + offset]);
            position.z -= notch([position.x, position.y]);
            position.z -= notch([position.x + offset, position.y - offset]);
        } else if (position.z === -.5) {
            position.z += notch([position.x + offset, position.y + offset]);
            position.z += notch([position.x + offset, position.y - offset]);
            position.z += notch([position.x - offset, position.y + offset]);
            position.z += notch([position.x - offset, position.y - offset]);
        } else if (position.x === -.5) {
            position.x += notch([position.y + offset, position.z + offset]);
            position.x += notch([position.y + offset, position.z - offset]);
            position.x += notch([position.y, position.z]);
            position.x += notch([position.y - offset, position.z + offset]);
            position.x += notch([position.y - offset, position.z - offset]);
        } else if (position.y === -.5) {
            position.y += notch([position.x + offset, position.z + offset]);
            position.y += notch([position.x + offset, position.z]);
            position.y += notch([position.x + offset, position.z - offset]);
            position.y += notch([position.x - offset, position.z + offset]);
            position.y += notch([position.x - offset, position.z]);
            position.y += notch([position.x - offset, position.z - offset]);
        }

        positionAttr.setXYZ(i, position.x, position.y, position.z);
    }


    boxGeometry.deleteAttribute('normal');
    boxGeometry.deleteAttribute('uv');
    boxGeometry = BufferGeometryUtils.mergeVertices(boxGeometry);

    boxGeometry.computeVertexNormals();

    return boxGeometry;
}

function createInnerGeometry() {
    const baseGeometry = new THREE.PlaneGeometry(1 - 2 * params.edgeRadius, 1 - 2 * params.edgeRadius);
    const offset = .48;
    return BufferGeometryUtils.mergeBufferGeometries([
        baseGeometry.clone().translate(0, 0, offset),
        baseGeometry.clone().translate(0, 0, -offset),
        baseGeometry.clone().rotateX(.5 * Math.PI).translate(0, -offset, 0),
        baseGeometry.clone().rotateX(.5 * Math.PI).translate(0, offset, 0),
        baseGeometry.clone().rotateY(.5 * Math.PI).translate(-offset, 0, 0),
        baseGeometry.clone().rotateY(.5 * Math.PI).translate(offset, 0, 0),
    ], false);
}

function calculateComboBonuses(scores) {
    const bonuses = {
        doubles: 0,
        triples: 0,
        quads: 0,
        straight: 0,
        fullHouse: 0,
        total: 0,
        descriptions: []
    };
    
    // Filter out undefined scores (dice that haven't settled)
    const validScores = scores.filter(s => s !== undefined);
    if (validScores.length < 2) return bonuses;
    
    // Count occurrences of each value
    const counts = {};
    validScores.forEach(score => {
        counts[score] = (counts[score] || 0) + 1;
    });
    
    // Check for multiples
    Object.entries(counts).forEach(([value, count]) => {
        if (count === 2) {
            bonuses.doubles += 3; // +3 points for doubles
            bonuses.descriptions.push(`Pair of ${value}s (+3)`);
        } else if (count === 3) {
            bonuses.triples += 8; // +8 points for triples
            bonuses.descriptions.push(`Three ${value}s (+8)`);
        } else if (count === 4) {
            bonuses.quads += 15; // +15 points for quads
            bonuses.descriptions.push(`Four ${value}s (+15)`);
        } else if (count >= 5) {
            const bonus = 15 + (count - 4) * 10; // +15 for 4, +10 for each additional
            bonuses.quads += bonus;
            bonuses.descriptions.push(`${count}x ${value}s (+${bonus})`);
        }
    });
    
    // Check for full house (3 of one kind + 2 of another)
    const countValues = Object.values(counts);
    if (countValues.includes(3) && countValues.includes(2)) {
        bonuses.fullHouse = 12;
        bonuses.descriptions.push(`Full House (+12)`);
    }
    
    // Check for straights (consecutive numbers)
    const uniqueScores = [...new Set(validScores)].sort((a, b) => a - b);
    let straightLength = 1;
    let maxStraightLength = 1;
    
    for (let i = 1; i < uniqueScores.length; i++) {
        if (uniqueScores[i] === uniqueScores[i-1] + 1) {
            straightLength++;
            maxStraightLength = Math.max(maxStraightLength, straightLength);
        } else {
            straightLength = 1;
        }
    }
    
    // Award points for straights of 3 or more
    if (maxStraightLength >= 3) {
        const straightBonus = (maxStraightLength - 2) * 5; // 5 points per dice in straight beyond 2
        bonuses.straight = straightBonus;
        bonuses.descriptions.push(`Straight of ${maxStraightLength} (+${straightBonus})`);
    }
    
    // Calculate total
    bonuses.total = bonuses.doubles + bonuses.triples + bonuses.quads + bonuses.straight + bonuses.fullHouse;
    
    return bonuses;
}

function addDiceEvents(dice, index) {
    dice.body.addEventListener('sleep', (e) => {
        
        // Don't calculate score if dice haven't been rolled yet or if round is complete
        if (!gameState.hasRolled || gameState.roundComplete) {
            return;
        }

        dice.body.allowSleep = false;

        const euler = new CANNON.Vec3();
        e.target.quaternion.toEuler(euler);

        const eps = .1;
        let isZero = (angle) => Math.abs(angle) < eps;
        let isHalfPi = (angle) => Math.abs(angle - .5 * Math.PI) < eps;
        let isMinusHalfPi = (angle) => Math.abs(.5 * Math.PI + angle) < eps;
        let isPiOrMinusPi = (angle) => (Math.abs(Math.PI - angle) < eps || Math.abs(Math.PI + angle) < eps);

        let score = 0;
        if (isZero(euler.z)) {
            if (isZero(euler.x)) {
                score = 1;
            } else if (isHalfPi(euler.x)) {
                score = 4;
            } else if (isMinusHalfPi(euler.x)) {
                score = 3;
            } else if (isPiOrMinusPi(euler.x)) {
                score = 6;
            } else {
                // landed on edge => wait to fall on side and fire the event again
                dice.body.allowSleep = true;
                return;
            }
        } else if (isHalfPi(euler.z)) {
            score = 2;
        } else if (isMinusHalfPi(euler.z)) {
            score = 5;
        } else {
            // landed on edge => wait to fall on side and fire the event again
            dice.body.allowSleep = true;
            return;
        }

        gameState.diceScores[index] = score;
        updateScore();
    });
}

function updateScore() {
    // Calculate base score
    const baseTotal = gameState.diceScores.reduce((sum, score) => sum + (score || 0), 0);
    
    // Only calculate combo bonuses if dice have been rolled
    let total = baseTotal;
    if (gameState.hasRolled) {
        // Calculate combo bonuses
        const comboBonuses = calculateComboBonuses(gameState.diceScores);
        total = baseTotal + comboBonuses.total;
        gameState.currentCombos = comboBonuses; // Store for earnings display
        
        // Display score with bonus if applicable
        if (comboBonuses.total > 0) {
            scoreResult.textContent = `${total} (${baseTotal}+${comboBonuses.total})`;
            // Show combo info
            comboInfo.innerHTML = comboBonuses.descriptions.join(' • ');
        } else {
            scoreResult.textContent = total;
            comboInfo.innerHTML = '';
        }
    } else {
        // No combos before first roll
        scoreResult.textContent = total;
        comboInfo.innerHTML = '';
        gameState.currentCombos = null;
    }
    
    gameState.currentScore = total;
    
    // Check if all unlocked dice have settled
    const unlockedDiceCount = params.numberOfDice - gameState.lockedDice.size;
    const settledUnlockedDice = gameState.diceScores.filter((s, idx) => 
        s !== undefined && !gameState.lockedDice.has(idx)
    ).length;
    
    // Check if all expected dice have scores (locked dice keep their old scores)
    if (settledUnlockedDice >= unlockedDiceCount) {
        gameState.diceRolling = false;  // Dice have settled
        
        // Clear kick table timer and hide button, restore roll button
        if (kickTableTimeout) {
            clearTimeout(kickTableTimeout);
            kickTableTimeout = null;
        }
        kickTableBtn.style.display = 'none';
        rollBtn.style.display = 'block';
        
        updateUI();  // Re-enable button if appropriate
        checkRoundComplete();
    }
}

function checkRoundComplete() {
    if (gameState.currentScore >= gameState.targetScore) {
        // Round won!
        gameState.roundComplete = true;
        rollBtn.style.display = 'none';
        nextRoundBtn.style.display = 'block';
        gameState.canRoll = false;
        
        // Calculate earnings
        calculateEarnings();
        
        // Show round summary (earnings + store)
        roundSummary.style.display = 'flex';
        updateStoreUI();
        
        // Visual feedback for winning
        scoreResult.style.color = '#2e8b57';
    } else if (gameState.rerollsRemaining === 0) {
        // Game over
        gameState.canRoll = false;
        rollBtn.textContent = 'New Game';
        rollBtn.disabled = false;
        rollBtn.classList.add('game-over');
        scoreResult.style.color = '#d45f2e';
        
        // Change roll button click handler to restart game
        rollBtn.removeEventListener('click', handleRoll);
        rollBtn.addEventListener('click', restartGame);
    }
}

function calculateEarnings() {
    let earnings = 0;
    let detailsHtml = '<table class="earnings-table">';
    
    // Base earnings: difference between score and target
    const baseEarnings = gameState.currentScore - gameState.targetScore;
    earnings += baseEarnings;
    const pointText = baseEarnings === 1 ? 'Extra Point' : 'Extra Points';
    detailsHtml += `<tr><td>${baseEarnings} ${pointText}</td><td class="earning-positive">+$${baseEarnings}</td></tr>`;
    
    // Perfect roll bonus: exactly hit the target
    if (gameState.currentScore === gameState.targetScore) {
        earnings += 10;
        detailsHtml += `<tr><td>Perfect Roll</td><td class="earning-positive">+$10</td></tr>`;
    }
    
    // Efficiency bonus: $2 per unused reroll
    const unusedRerolls = gameState.rerollsRemaining;
    if (unusedRerolls > 0) {
        const efficiencyBonus = unusedRerolls * 2;
        earnings += efficiencyBonus;
        detailsHtml += `<tr><td>${unusedRerolls} Unused Rerolls</td><td class="earning-positive">+$${efficiencyBonus}</td></tr>`;
    }
    
    // Total row
    detailsHtml += `<tr class="total-row"><td><strong>Total Earnings</strong></td><td class="earning-total"><strong>+$${earnings}</strong></td></tr>`;
    detailsHtml += '</table>';
    
    // Update money
    gameState.lastEarnings = earnings;
    gameState.money += earnings;
    moneyAmount.textContent = `$${gameState.money}`;
    
    // Keep score display as is
    scoreResult.textContent = gameState.currentScore;
    scoreResult.style.color = '#2e8b57';
    
    // Show earnings breakdown
    earningsContent.innerHTML = detailsHtml;
}


function handleRoll() {
    if (!gameState.canRoll || gameState.rerollsRemaining <= 0 || gameState.diceRolling) return;
    
    gameState.rerollsRemaining--;
    gameState.diceRolling = true;
    updateUI();
    throwDice();
}

function nextRound() {
    gameState.round++;
    gameState.targetScore = roundTargets[Math.min(gameState.round - 1, roundTargets.length - 1)];
    gameState.rerollsRemaining = 3 + gameState.rerollsPurchased;
    gameState.currentScore = 0;
    gameState.diceScores = [];
    gameState.lockedDice.clear();
    gameState.canRoll = true;
    gameState.roundComplete = false;
    gameState.diceRolling = false;
    gameState.currentCombos = null;
    gameState.hasRolled = false;  // Reset hasRolled for new round
    // Keep the duck between rounds - don't reset hasDuck
    
    // Reset UI
    rollBtn.style.display = 'block';
    nextRoundBtn.style.display = 'none';
    rollBtn.disabled = false;
    rollBtn.textContent = 'Roll Dice';
    scoreResult.style.color = '#d45f2e';
    roundSummary.style.display = 'none';  // Hide round summary
    comboInfo.innerHTML = '';  // Clear combo info
    
    // Update dice visuals and clear all locks
    diceArray.forEach((dice, index) => {
        if (dice && dice.mesh) {  // Check if dice exists
            updateDiceAppearance(dice, false);
            if (lockSprites[dice.index]) {
                lockSprites[dice.index].visible = false;
            }
            
            // Reset dice to starting position without rolling
            const startX = (index - (params.numberOfDice - 1) / 2) * 2;
            dice.body.velocity.setZero();
            dice.body.angularVelocity.setZero();
            dice.body.position.set(startX, 1, 0);
            dice.body.quaternion.set(0, 0, 0, 1);
            dice.mesh.position.copy(dice.body.position);
            dice.mesh.quaternion.copy(dice.body.quaternion);
            dice.body.wakeUp();
            dice.body.allowSleep = true;
        }
    });
    
    updateUI();
    // Don't throw dice on next round
}

function restartGame() {
    // Reset game state to round 1
    gameState.round = 1;
    gameState.targetScore = roundTargets[0];
    gameState.rerollsRemaining = 3 + gameState.rerollsPurchased;
    gameState.currentScore = 0;
    gameState.diceScores = [];
    gameState.lockedDice.clear();
    gameState.canRoll = true;
    gameState.roundComplete = false;
    gameState.hasRolled = false;  // Reset hasRolled flag
    gameState.money = 0;  // Reset money on game restart
    gameState.lastEarnings = 0;
    gameState.dicePurchased = 0;  // Reset dice purchases
    gameState.rerollsPurchased = 0;  // Reset reroll purchases
    gameState.diceRolling = false;  // Reset rolling flag
    gameState.currentCombos = null;  // Reset combos
    gameState.hasDuck = false;  // Reset duck ownership
    
    // Remove rubber ducky if it exists
    if (duckMesh) {
        scene.remove(duckMesh);
        duckMesh = null;
    }
    if (duckBody) {
        physicsWorld.removeBody(duckBody);
        duckBody = null;
    }
    
    // Re-enable duck button for new game
    if (buyDuckBtn) {
        buyDuckBtn.textContent = 'Get';
        buyDuckBtn.disabled = false;
    }
    
    // Remove extra dice if any were purchased
    while (params.numberOfDice > 2) {
        const diceToRemove = diceArray.pop();
        if (diceToRemove) {
            scene.remove(diceToRemove.mesh);
            physicsWorld.removeBody(diceToRemove.body);
            if (lockSprites[diceToRemove.index]) {
                scene.remove(lockSprites[diceToRemove.index]);
                delete lockSprites[diceToRemove.index];
            }
        }
        params.numberOfDice--;
    }
    
    // Reset UI
    rollBtn.classList.remove('game-over');
    rollBtn.textContent = 'Roll Dice';
    rollBtn.disabled = false;
    scoreResult.style.color = '#d45f2e';
    roundSummary.style.display = 'none';  // Hide round summary
    comboInfo.innerHTML = '';  // Clear combo info
    
    // Restore original click handler
    rollBtn.removeEventListener('click', restartGame);
    rollBtn.addEventListener('click', handleRoll);
    
    // Reset dice to starting positions without rolling
    diceArray.forEach((dice, index) => {
        updateDiceAppearance(dice, false);
        if (lockSprites[dice.index]) {
            lockSprites[dice.index].visible = false;
        }
        
        // Reset dice to starting position exactly like initial creation
        const startX = (index - (params.numberOfDice - 1) / 2) * 2;
        dice.body.velocity.setZero();
        dice.body.angularVelocity.setZero();
        dice.body.position.set(startX, 0, 0);
        dice.body.quaternion.set(0, 0, 0, 1);
        dice.mesh.position.copy(dice.body.position);
        dice.mesh.quaternion.copy(dice.body.quaternion);
        
        // Wake up the body so it falls naturally
        dice.body.wakeUp();
        dice.body.allowSleep = true;
    });
    
    updateUI();
    // Don't throw dice on restart
}

function updateUI() {
    roundNumber.textContent = gameState.round;
    targetScore.textContent = gameState.targetScore;
    rerollsLeft.textContent = gameState.rerollsRemaining;
    scoreResult.textContent = gameState.currentScore;
    moneyAmount.textContent = `$${gameState.money}`;
    
    // Disable button if: no rerolls left, dice are rolling, or can't roll
    if ((gameState.rerollsRemaining === 0 && !gameState.roundComplete) || 
        gameState.diceRolling || 
        !gameState.canRoll) {
        rollBtn.disabled = true;
    } else {
        rollBtn.disabled = false;
    }
}

function handleMouseMove(event) {
    const rect = canvasEl.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function handleDiceClick(event) {
    const rect = canvasEl.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
        // Find the dice that was clicked
        let clickedDice = null;
        for (let intersect of intersects) {
            let obj = intersect.object;
            while (obj.parent && !obj.userData.diceIndex !== undefined) {
                if (obj.userData.diceIndex !== undefined) {
                    clickedDice = diceArray[obj.userData.diceIndex];
                    break;
                }
                obj = obj.parent;
            }
            if (clickedDice) break;
        }
        
        if (clickedDice) {
            toggleDiceLock(clickedDice);
        }
    }
}

function toggleDiceLock(dice) {
    if (gameState.lockedDice.has(dice.index)) {
        gameState.lockedDice.delete(dice.index);
        updateDiceAppearance(dice, false);
    } else {
        gameState.lockedDice.add(dice.index);
        updateDiceAppearance(dice, true);
    }
}

function updateDiceAppearance(dice, locked) {
    // Show/hide lock sprite
    if (lockSprites[dice.index]) {
        lockSprites[dice.index].visible = locked;
    }
    
    // Optional: still add subtle color change
    const outerMesh = dice.mesh.children.find(child => child.material && child.material.color);
    if (outerMesh) {
        if (locked) {
            outerMesh.material.color.setHex(0xdddddd); // Slightly darker when locked
        } else {
            outerMesh.material.color.setHex(0xeeeeee); // Normal white
            outerMesh.material.emissive = new THREE.Color(0x000000);
            outerMesh.material.emissiveIntensity = 0;
        }
    }
}

function render() {
    physicsWorld.fixedStep();

    for (const dice of diceArray) {
        dice.mesh.position.copy(dice.body.position)
        dice.mesh.quaternion.copy(dice.body.quaternion)
        
        // Update lock sprite position to face closest to camera
        if (lockSprites[dice.index] && lockSprites[dice.index].visible) {
            // Get dice position and camera direction
            const dicePos = dice.body.position;
            const cameraDir = new THREE.Vector3();
            camera.getWorldDirection(cameraDir);
            
            // Position lock further from dice to avoid intersection
            // when dice is rotated at an angle
            const distance = 0.85; // Further out to clear rotated corners
            lockSprites[dice.index].position.set(
                dicePos.x - cameraDir.x * distance,
                dicePos.y - cameraDir.y * distance,
                dicePos.z - cameraDir.z * distance
            );
            
            // Make sprite always face the camera
            lockSprites[dice.index].lookAt(camera.position);
        }
        
        // Update glow light position if in dark mode
        if (document.body.classList.contains('dark-mode')) {
            const glowLight = scene.children.find(child => 
                child.userData.isGlowLight && child.userData.diceIndex === dice.index);
            if (glowLight) {
                glowLight.position.x = dice.body.position.x;
                glowLight.position.y = dice.body.position.y;
                glowLight.position.z = dice.body.position.z;
            }
        }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

function updateSceneSize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Recreate walls with new viewport dimensions
    if (physicsWorld) {
        createInvisibleWalls();
    }
}

function getDicePrice() {
    // First dice is $5, then: 10, 15, 25, 40, 60...
    if (gameState.dicePurchased === 0) {
        return 5;
    }
    return Math.floor(gameState.diceBaseCost * Math.pow(1.5, gameState.dicePurchased - 1));
}

function getRerollPrice() {
    // Reroll prices: 5, 7, 10, 15, 22...
    return Math.floor(gameState.rerollBaseCost * Math.pow(1.4, gameState.rerollsPurchased));
}

function updateStoreUI() {
    const diceP = getDicePrice();
    dicePrice.textContent = `$${diceP}`;
    
    const rerollP = getRerollPrice();
    if (rerollPrice) {
        rerollPrice.textContent = `$${rerollP}`;
    }
    
    // Disable buy buttons if can't afford
    buyDiceBtn.disabled = gameState.money < diceP;
    if (buyRerollBtn) {
        buyRerollBtn.disabled = gameState.money < rerollP;
    }
}

function buyDice() {
    const price = getDicePrice();
    console.log('Buy dice clicked. Price:', price, 'Money:', gameState.money);
    
    if (gameState.money >= price) {
        // Deduct money
        gameState.money -= price;
        gameState.dicePurchased++;
        
        // Add new dice
        const newIndex = params.numberOfDice;
        
        // Create and add the new dice (pass index before incrementing numberOfDice)
        const newDice = createDice(newIndex);
        diceArray.push(newDice);
        addDiceEvents(newDice, newIndex);
        
        // Apply dark mode glow if in dark mode
        if (document.body.classList.contains('dark-mode')) {
            const outerMesh = newDice.mesh.children.find(child => 
                child.material && child.material.color);
            if (outerMesh) {
                outerMesh.material.emissive = new THREE.Color(0x6699ff);
                outerMesh.material.emissiveIntensity = 0.1;
                
                // Add glow light for new dice
                const glowLight = new THREE.PointLight(0x4488ff, 2, 8);
                glowLight.position.copy(newDice.mesh.position);
                glowLight.position.y = 0;
                glowLight.userData.isGlowLight = true;
                glowLight.userData.diceIndex = newIndex;
                scene.add(glowLight);
            }
        }
        
        // Now increment the number of dice
        params.numberOfDice++;
        
        // Reposition all dice to keep them centered
        repositionAllDice();
        
        // Update UI
        moneyAmount.textContent = `$${gameState.money}`;
        updateStoreUI();
        
        console.log('Dice purchased! Total dice:', params.numberOfDice);
    }
}

function buyReroll() {
    const price = getRerollPrice();
    
    if (gameState.money >= price) {
        // Deduct money
        gameState.money -= price;
        gameState.rerollsPurchased++;
        
        // Update UI to show new permanent reroll count
        const totalRerolls = 3 + gameState.rerollsPurchased;
        
        moneyAmount.textContent = `$${gameState.money}`;
        updateStoreUI();
        
        console.log(`Reroll purchased! Now ${totalRerolls} rerolls per round (permanently)`);
    }
}

function buyDuck() {
    if (!gameState.hasDuck) {
        // It's free!
        gameState.hasDuck = true;
        
        // Load the duck
        loadRubberDucky();
        
        // Disable the button
        if (buyDuckBtn) {
            buyDuckBtn.disabled = true;
        }
        
        console.log('Rubber ducky acquired!');
    }
}

function repositionAllDice() {
    // Temporarily disable hasRolled to prevent score calculation
    const wasRolled = gameState.hasRolled;
    gameState.hasRolled = false;
    
    diceArray.forEach((dice, index) => {
        if (dice && dice.mesh) {
            const startX = (index - (params.numberOfDice - 1) / 2) * 2;
            dice.body.position.x = startX;
            dice.mesh.position.x = startX;
        }
    });
    
    // Restore hasRolled state after repositioning
    setTimeout(() => {
        gameState.hasRolled = wasRolled;
    }, 100);
}

function kickTable() {
    console.log('Kicking the table!');
    
    // Apply a random upward and sideways force to all dice
    diceArray.forEach((dice) => {
        if (dice && dice.body) {
            // Wake up the dice first
            dice.body.allowSleep = false;
            dice.body.wakeUp();
            
            // Random kick force - gentle nudge
            const kickForce = new CANNON.Vec3(
                (Math.random() - 0.5) * 5,   // Random X force
                Math.random() * 5 + 3,        // Upward Y force (gentle bump)
                (Math.random() - 0.5) * 5    // Random Z force
            );
            dice.body.applyImpulse(kickForce, dice.body.position);
            
            // Allow sleep again after a moment
            setTimeout(() => {
                if (dice.body) {
                    dice.body.allowSleep = true;
                }
            }, 100);
        }
    });
    
    // Hide the kick button and show roll button again
    kickTableBtn.style.display = 'none';
    rollBtn.style.display = 'block';
    
    if (kickTableTimeout) {
        clearTimeout(kickTableTimeout);
    }
    startKickTableTimer();
}

function startKickTableTimer() {
    // Show "Kick the Table" button after 3 seconds if dice are still rolling
    kickTableTimeout = setTimeout(() => {
        if (gameState.diceRolling) {
            kickTableBtn.style.display = 'block';
            rollBtn.style.display = 'none';  // Hide roll button while kick is available
        }
    }, 3000);
}

function throwDice() {
    gameState.hasRolled = true;  // Mark that dice have been rolled
    gameState.diceRolling = true; // Mark dice as currently rolling
    
    // Start the kick table timer
    startKickTableTimer();
    
    // Keep scores for locked dice
    const oldScores = [...gameState.diceScores];
    gameState.diceScores = [];
    gameState.lockedDice.forEach(idx => {
        if (oldScores[idx] !== undefined) {
            gameState.diceScores[idx] = oldScores[idx];
        }
    });
    
    updateScore();  // Update score to show locked dice scores

    diceArray.forEach((d, dIdx) => {
        // Only roll dice that aren't locked
        if (!gameState.lockedDice.has(dIdx)) {
            d.body.velocity.setZero();
            d.body.angularVelocity.setZero();

            // Adjust spawn position based on screen width - more centered on mobile
            const isMobile = window.innerWidth < 768;
            const spawnX = isMobile ? 0 : 3; // Center on mobile, slightly right on desktop
            const spawnY = dIdx * 1.5 + 3;
            
            d.body.position = new CANNON.Vec3(spawnX, spawnY, 0);
            d.mesh.position.copy(d.body.position);

            d.mesh.rotation.set(2 * Math.PI * Math.random(), 0, 2 * Math.PI * Math.random())
            d.body.quaternion.copy(d.mesh.quaternion);

            // Adjust force based on spawn position
            const force = isMobile ? (4 + 3 * Math.random()) : (3 + 5 * Math.random());
            const forceDirection = isMobile ? 
                new CANNON.Vec3(-1 + Math.random() * 2, force, -1 + Math.random() * 2) : // More spread on mobile
                new CANNON.Vec3(-force, force, 0); // Original direction on desktop
            
            d.body.applyImpulse(
                forceDirection,
                new CANNON.Vec3(0, 0, .2)
            );

            d.body.allowSleep = true;
        }
    });
}