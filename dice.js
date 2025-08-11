let scene, camera, renderer;
let dice = [];
let world;
let diceValues = [];
let isRolling = false;

const DICE_SIZE = 1;
const NUM_DICE = 5;

// Game State
const gameState = {
    ante: 1,
    blind: 'small', // small, big, boss
    targetScore: 300,
    currentScore: 0,
    handsLeft: 4,
    rollsLeft: 3,
    money: 10,
    selectedPattern: null,
    keptDice: [false, false, false, false, false],
    currentDiceValues: [0, 0, 0, 0, 0],
    engine: null
};

// Blind progression
const blindTargets = {
    1: { small: 300, big: 500, boss: 800 },
    2: { small: 800, big: 1200, boss: 1800 },
    3: { small: 1800, big: 2800, boss: 4000 },
    4: { small: 4000, big: 6000, boss: 9000 },
    5: { small: 9000, big: 14000, boss: 20000 },
    6: { small: 20000, big: 30000, boss: 45000 },
    7: { small: 45000, big: 70000, boss: 100000 },
    8: { small: 100000, big: 150000, boss: 220000 }
};

function init() {
    // Initialize game engine
    gameState.engine = new DiceEngine();
    
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x303030, 1, 100);

    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        100
    );
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x1a1a2e);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.radius = 4;
    directionalLight.shadow.blurSamples = 25;
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0xffd700, 0.3, 20);
    pointLight.position.set(-5, 8, -5);
    scene.add(pointLight);
    
    const pointLight2 = new THREE.PointLight(0x87ceeb, 0.2, 20);
    pointLight2.position.set(5, 8, -5);
    scene.add(pointLight2);

    initPhysics();
    createFloor();
    createWalls();
    createDice();
    initializeUI();
    updateGameDisplay();

    window.addEventListener('resize', onWindowResize);
}

function initPhysics() {
    world = new CANNON.World();
    world.gravity.set(0, -30, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
}

function createFeltTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#2a4d3a';
    ctx.fillRect(0, 0, 256, 256);
    
    for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const brightness = Math.random() * 30 - 15;
        ctx.fillStyle = `rgba(${42 + brightness}, ${77 + brightness}, ${58 + brightness}, 0.3)`;
        ctx.fillRect(x, y, 1, 1);
    }
    
    return canvas;
}

function createFloor() {
    const floorGeometry = new THREE.BoxGeometry(20, 0.1, 20);
    const floorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2a4d3a,
        shininess: 80,
        specular: 0x111111
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    floor.position.y = -0.05;
    scene.add(floor);
    
    const feltTexture = new THREE.CanvasTexture(createFeltTexture());
    feltTexture.wrapS = feltTexture.wrapT = THREE.RepeatWrapping;
    feltTexture.repeat.set(10, 10);
    floorMaterial.map = feltTexture;
    floorMaterial.bumpMap = feltTexture;
    floorMaterial.bumpScale = 0.02;

    const floorShape = new CANNON.Box(new CANNON.Vec3(10, 0.05, 10));
    const floorBody = new CANNON.Body({
        mass: 0,
        shape: floorShape,
        position: new CANNON.Vec3(0, -0.05, 0)
    });
    world.addBody(floorBody);
}

function createWalls() {
    const wallThickness = 0.5;
    const wallHeight = 5;
    const wallLength = 20;
    
    const wallMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x333333,
        transparent: true,
        opacity: 0.3
    });

    const walls = [
        { pos: [0, wallHeight/2, -10], rot: [0, 0, 0], size: [wallLength, wallHeight, wallThickness] },
        { pos: [0, wallHeight/2, 10], rot: [0, 0, 0], size: [wallLength, wallHeight, wallThickness] },
        { pos: [-10, wallHeight/2, 0], rot: [0, Math.PI/2, 0], size: [wallLength, wallHeight, wallThickness] },
        { pos: [10, wallHeight/2, 0], rot: [0, Math.PI/2, 0], size: [wallLength, wallHeight, wallThickness] }
    ];

    walls.forEach(wall => {
        const wallGeometry = new THREE.BoxGeometry(...wall.size);
        const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
        wallMesh.position.set(...wall.pos);
        wallMesh.rotation.set(...wall.rot);
        scene.add(wallMesh);

        const wallShape = new CANNON.Box(new CANNON.Vec3(wall.size[0]/2, wall.size[1]/2, wall.size[2]/2));
        const wallBody = new CANNON.Body({
            mass: 0,
            shape: wallShape,
            position: new CANNON.Vec3(...wall.pos)
        });
        wallBody.quaternion.setFromEuler(...wall.rot);
        world.addBody(wallBody);
    });
}

function createDiceFace(value) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');

    const gradient = context.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#f8f8f8');
    gradient.addColorStop(0.5, '#ffffff');
    gradient.addColorStop(1, '#f0f0f0');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);

    context.strokeStyle = '#e0e0e0';
    context.lineWidth = 4;
    context.strokeRect(16, 16, 480, 480);

    context.fillStyle = '#1a1a1a';
    const dotRadius = 35;
    const spacing = 120;
    const center = 256;

    const dotPositions = {
        1: [[center, center]],
        2: [[center - spacing, center - spacing], [center + spacing, center + spacing]],
        3: [[center - spacing, center - spacing], [center, center], [center + spacing, center + spacing]],
        4: [[center - spacing, center - spacing], [center + spacing, center - spacing],
            [center - spacing, center + spacing], [center + spacing, center + spacing]],
        5: [[center - spacing, center - spacing], [center + spacing, center - spacing],
            [center, center],
            [center - spacing, center + spacing], [center + spacing, center + spacing]],
        6: [[center - spacing, center - spacing], [center + spacing, center - spacing],
            [center - spacing, center], [center + spacing, center],
            [center - spacing, center + spacing], [center + spacing, center + spacing]]
    };

    const positions = dotPositions[value];
    positions.forEach(pos => {
        context.save();
        context.shadowColor = 'rgba(0, 0, 0, 0.3)';
        context.shadowBlur = 8;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        
        const dotGradient = context.createRadialGradient(
            pos[0] - dotRadius/3, pos[1] - dotRadius/3, 0,
            pos[0], pos[1], dotRadius
        );
        dotGradient.addColorStop(0, '#2a2a2a');
        dotGradient.addColorStop(0.7, '#1a1a1a');
        dotGradient.addColorStop(1, '#000000');
        context.fillStyle = dotGradient;
        
        context.beginPath();
        context.arc(pos[0], pos[1], dotRadius, 0, Math.PI * 2);
        context.fill();
        
        context.fillStyle = 'rgba(255, 255, 255, 0.1)';
        context.beginPath();
        context.arc(pos[0] - dotRadius/4, pos[1] - dotRadius/4, dotRadius/3, 0, Math.PI * 2);
        context.fill();
        
        context.restore();
    });
    
    context.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    context.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        context.strokeRect(12 + i * 4, 12 + i * 4, 488 - i * 8, 488 - i * 8);
    }

    return new THREE.CanvasTexture(canvas);
}

function createDice() {
    const diceGeometry = new THREE.BoxGeometry(DICE_SIZE, DICE_SIZE, DICE_SIZE);
    
    for (let i = 0; i < NUM_DICE; i++) {
        const materials = [];
        for (let j = 1; j <= 6; j++) {
            materials.push(new THREE.MeshPhongMaterial({
                map: createDiceFace(j),
                color: 0xffffff,
                shininess: 150,
                specular: 0x222222,
                bumpScale: 0.002
            }));
        }

        const diceMesh = new THREE.Mesh(diceGeometry, materials);
        diceMesh.castShadow = true;
        diceMesh.receiveShadow = true;
        
        const x = (i - NUM_DICE/2) * 1.5;
        diceMesh.position.set(x, 5, 0);
        
        scene.add(diceMesh);

        const diceShape = new CANNON.Box(new CANNON.Vec3(DICE_SIZE/2, DICE_SIZE/2, DICE_SIZE/2));
        const diceBody = new CANNON.Body({
            mass: 1,
            shape: diceShape,
            position: new CANNON.Vec3(x, 5, 0)
        });
        
        diceBody.linearDamping = 0.4;
        diceBody.angularDamping = 0.4;
        
        world.addBody(diceBody);

        dice.push({
            mesh: diceMesh,
            body: diceBody,
            index: i
        });
    }
}

function initializeUI() {
    // Roll button
    document.getElementById('rollBtn').addEventListener('click', rollDice);
    
    // Score button
    document.getElementById('scoreBtn').addEventListener('click', scoreHand);
    
    // Skip button
    document.getElementById('skipBtn').addEventListener('click', skipHand);
    
    // Dice indicators
    const indicators = document.querySelectorAll('.dice-indicator');
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => toggleDiceKeep(index));
    });
}

function toggleDiceKeep(index) {
    if (gameState.rollsLeft === 3) return; // Can't keep dice before first roll
    
    gameState.keptDice[index] = !gameState.keptDice[index];
    updateDiceIndicators();
}

function updateDiceIndicators() {
    const indicators = document.querySelectorAll('.dice-indicator');
    indicators.forEach((indicator, index) => {
        indicator.textContent = gameState.currentDiceValues[index] || '?';
        if (gameState.keptDice[index]) {
            indicator.classList.add('kept');
        } else {
            indicator.classList.remove('kept');
        }
    });
}

function rollDice() {
    if (isRolling || gameState.rollsLeft <= 0) return;
    
    isRolling = true;
    gameState.rollsLeft--;
    
    document.getElementById('rollBtn').disabled = true;
    document.getElementById('controls').classList.add('rolling');
    
    // Only roll dice that aren't kept
    dice.forEach((die, index) => {
        if (!gameState.keptDice[index]) {
            const x = (index - NUM_DICE/2) * 1.5 + (Math.random() - 0.5) * 0.5;
            const y = 6 + Math.random() * 3;
            const z = (Math.random() - 0.5) * 2;
            
            die.body.position.set(x, y, z);
            die.body.velocity.set(
                (Math.random() - 0.5) * 15,
                Math.random() * 10 + 5,
                (Math.random() - 0.5) * 15
            );
            die.body.angularVelocity.set(
                Math.random() * 30 - 15,
                Math.random() * 30 - 15,
                Math.random() * 30 - 15
            );
        }
    });

    setTimeout(() => {
        document.getElementById('controls').classList.remove('rolling');
    }, 500);

    setTimeout(() => {
        checkDiceValues();
        updateUI();
        document.getElementById('rollBtn').disabled = false;
    }, 2000);
}

function checkDiceValues() {
    diceValues = [];
    
    dice.forEach((die, index) => {
        const euler = new CANNON.Vec3();
        die.body.quaternion.toEuler(euler);
        
        const eps = 0.1;
        let value = 1;
        
        const quaternion = new THREE.Quaternion(
            die.body.quaternion.x,
            die.body.quaternion.y,
            die.body.quaternion.z,
            die.body.quaternion.w
        );
        const upVector = new THREE.Vector3(0, 1, 0);
        upVector.applyQuaternion(quaternion);
        
        if (Math.abs(upVector.y - 1) < eps) value = 2;
        else if (Math.abs(upVector.y + 1) < eps) value = 5;
        else if (Math.abs(upVector.x - 1) < eps) value = 4;
        else if (Math.abs(upVector.x + 1) < eps) value = 3;
        else if (Math.abs(upVector.z - 1) < eps) value = 1;
        else if (Math.abs(upVector.z + 1) < eps) value = 6;
        
        diceValues.push(value);
        gameState.currentDiceValues[index] = value;
    });
    
    isRolling = false;
    detectPatterns();
}

function detectPatterns() {
    const patterns = gameState.engine.detectAllPatterns(gameState.currentDiceValues);
    displayPatterns(patterns);
}

function displayPatterns(patterns) {
    const patternList = document.getElementById('patternList');
    
    if (!patterns || patterns.length === 0) {
        patternList.innerHTML = '<div style="color: #888; text-align: center;">Roll the dice!</div>';
        return;
    }
    
    // Sort patterns by score
    patterns.sort((a, b) => b.totalScore - a.totalScore);
    
    patternList.innerHTML = patterns.map((pattern, index) => `
        <div class="pattern-item" onclick="selectPattern(${index})">
            <div class="pattern-name">${pattern.displayName}</div>
            <div class="pattern-desc">${pattern.description}</div>
            <div class="pattern-score">
                <span class="pattern-calc">${pattern.chips} × ${pattern.mult}</span>
                <span class="pattern-total">${pattern.totalScore}</span>
            </div>
        </div>
    `).join('');
    
    // Store patterns for selection
    window.currentPatterns = patterns;
}

function selectPattern(index) {
    gameState.selectedPattern = window.currentPatterns[index];
    
    // Update UI to show selection
    document.querySelectorAll('.pattern-item').forEach((item, i) => {
        if (i === index) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

function scoreHand() {
    if (!gameState.selectedPattern) {
        alert('Please select a scoring pattern!');
        return;
    }
    
    // Add score
    gameState.currentScore += gameState.selectedPattern.totalScore;
    
    // Check if target reached
    if (gameState.currentScore >= gameState.targetScore) {
        nextBlind();
    } else {
        nextHand();
    }
}

function skipHand() {
    gameState.money += 2;
    nextHand();
}

function nextHand() {
    gameState.handsLeft--;
    
    if (gameState.handsLeft <= 0) {
        // Game over - didn't reach target
        alert(`Game Over! You scored ${gameState.currentScore} but needed ${gameState.targetScore}`);
        resetGame();
    } else {
        // Reset for next hand
        gameState.rollsLeft = 3;
        gameState.keptDice = [false, false, false, false, false];
        gameState.currentDiceValues = [0, 0, 0, 0, 0];
        gameState.selectedPattern = null;
        
        resetDicePositions();
        updateUI();
    }
}

function nextBlind() {
    // Progress to next blind
    if (gameState.blind === 'small') {
        gameState.blind = 'big';
    } else if (gameState.blind === 'big') {
        gameState.blind = 'boss';
    } else {
        // Completed ante, move to next
        gameState.ante++;
        gameState.blind = 'small';
        gameState.money += 10; // Ante completion bonus
    }
    
    // Reset for next blind
    gameState.targetScore = blindTargets[gameState.ante][gameState.blind];
    gameState.currentScore = 0;
    gameState.handsLeft = 4;
    gameState.rollsLeft = 3;
    gameState.keptDice = [false, false, false, false, false];
    gameState.currentDiceValues = [0, 0, 0, 0, 0];
    gameState.selectedPattern = null;
    
    resetDicePositions();
    updateUI();
    
    if (gameState.ante > 8) {
        alert('Congratulations! You beat all 8 Antes!');
        resetGame();
    }
}

function resetGame() {
    gameState.ante = 1;
    gameState.blind = 'small';
    gameState.targetScore = 300;
    gameState.currentScore = 0;
    gameState.handsLeft = 4;
    gameState.rollsLeft = 3;
    gameState.money = 10;
    gameState.selectedPattern = null;
    gameState.keptDice = [false, false, false, false, false];
    gameState.currentDiceValues = [0, 0, 0, 0, 0];
    
    resetDicePositions();
    updateUI();
}

function resetDicePositions() {
    dice.forEach((die, index) => {
        const x = (index - NUM_DICE/2) * 1.5;
        die.body.position.set(x, 2, 0);
        die.body.velocity.set(0, 0, 0);
        die.body.angularVelocity.set(0, 0, 0);
        die.body.quaternion.set(0, 0, 0, 1);
    });
}

function updateUI() {
    updateGameDisplay();
    updateDiceIndicators();
    updateControls();
}

function updateGameDisplay() {
    // Update ante/blind display
    document.querySelector('.ante-label').textContent = `Ante ${gameState.ante}`;
    document.querySelector('.ante-value').textContent = 
        gameState.blind === 'small' ? 'Small Blind' :
        gameState.blind === 'big' ? 'Big Blind' : 'Boss Blind';
    
    // Update scores
    document.getElementById('targetScore').textContent = gameState.targetScore;
    document.getElementById('currentScore').textContent = gameState.currentScore;
    
    // Update progress bar
    const progress = Math.min(100, (gameState.currentScore / gameState.targetScore) * 100);
    document.getElementById('scoreBar').style.width = `${progress}%`;
    
    // Update stats
    document.getElementById('handsLeft').textContent = `${gameState.handsLeft}/4`;
    document.getElementById('money').textContent = `$${gameState.money}`;
    document.getElementById('rollsLeft').textContent = gameState.rollsLeft;
}

function updateControls() {
    const rollBtn = document.getElementById('rollBtn');
    const scoreBtn = document.getElementById('scoreBtn');
    const skipBtn = document.getElementById('skipBtn');
    
    if (gameState.rollsLeft > 0) {
        rollBtn.style.display = 'block';
        rollBtn.classList.toggle('pulse', gameState.rollsLeft === 3);
        scoreBtn.style.display = 'none';
        skipBtn.style.display = 'none';
    } else {
        rollBtn.style.display = 'none';
        scoreBtn.style.display = 'block';
        skipBtn.style.display = 'block';
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    world.step(1/60);
    
    dice.forEach(die => {
        die.mesh.position.copy(die.body.position);
        die.mesh.quaternion.copy(die.body.quaternion);
    });
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
animate();