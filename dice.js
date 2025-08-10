let scene, camera, renderer;
let dice = [];
let world;
let diceValues = [];
let isRolling = false;

const DICE_SIZE = 1;
const NUM_DICE = 5;

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x202020, 1, 100);

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
    renderer.setClearColor(0x202020);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    initPhysics();
    createFloor();
    createWalls();
    createDice();

    document.getElementById('rollBtn').addEventListener('click', rollDice);
    document.getElementById('resetBtn').addEventListener('click', resetDice);

    window.addEventListener('resize', onWindowResize);
}

function initPhysics() {
    world = new CANNON.World();
    world.gravity.set(0, -30, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
}

function createFloor() {
    const floorGeometry = new THREE.BoxGeometry(20, 0.1, 20);
    const floorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x444444,
        shininess: 100
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    floor.position.y = -0.05;
    scene.add(floor);

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
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, 256, 256);

    context.strokeStyle = '#000000';
    context.lineWidth = 8;
    context.strokeRect(8, 8, 240, 240);

    context.fillStyle = '#000000';
    const dotRadius = 20;
    const spacing = 64;
    const center = 128;

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
        context.beginPath();
        context.arc(pos[0], pos[1], dotRadius, 0, Math.PI * 2);
        context.fill();
    });

    return new THREE.CanvasTexture(canvas);
}

function createDice() {
    const diceGeometry = new THREE.BoxGeometry(DICE_SIZE, DICE_SIZE, DICE_SIZE);
    
    for (let i = 0; i < NUM_DICE; i++) {
        const materials = [];
        for (let j = 1; j <= 6; j++) {
            materials.push(new THREE.MeshPhongMaterial({
                map: createDiceFace(j),
                color: 0xffffff
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
            body: diceBody
        });
    }
}

function rollDice() {
    if (isRolling) return;
    
    isRolling = true;
    document.getElementById('results').style.display = 'none';
    
    dice.forEach((die, index) => {
        const x = (index - NUM_DICE/2) * 1.5 + (Math.random() - 0.5) * 0.5;
        const y = 5 + Math.random() * 2;
        const z = (Math.random() - 0.5) * 2;
        
        die.body.position.set(x, y, z);
        die.body.velocity.set(
            (Math.random() - 0.5) * 10,
            Math.random() * 5,
            (Math.random() - 0.5) * 10
        );
        die.body.angularVelocity.set(
            Math.random() * 20 - 10,
            Math.random() * 20 - 10,
            Math.random() * 20 - 10
        );
    });

    setTimeout(() => {
        checkDiceValues();
    }, 3000);
}

function resetDice() {
    isRolling = false;
    document.getElementById('results').style.display = 'none';
    
    dice.forEach((die, index) => {
        const x = (index - NUM_DICE/2) * 1.5;
        die.body.position.set(x, 2, 0);
        die.body.velocity.set(0, 0, 0);
        die.body.angularVelocity.set(0, 0, 0);
        die.body.quaternion.set(0, 0, 0, 1);
    });
}

function checkDiceValues() {
    diceValues = [];
    let total = 0;
    
    dice.forEach(die => {
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
        total += value;
    });
    
    document.getElementById('total').textContent = total;
    document.getElementById('results').style.display = 'block';
    isRolling = false;
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