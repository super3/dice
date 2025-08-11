import * as CANNON from 'https://cdn.skypack.dev/cannon-es';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const canvasEl = document.querySelector('#canvas');
const scoreResult = document.querySelector('#score-result');
const rollBtn = document.querySelector('#roll-btn');
const nextRoundBtn = document.querySelector('#next-round-btn');
const roundNumber = document.querySelector('#round-number');
const targetScore = document.querySelector('#target-score');
const rerollsLeft = document.querySelector('#rerolls-left');
const moneyAmount = document.querySelector('#money-amount');
const roundSummary = document.querySelector('#round-summary');
const earningsContent = document.querySelector('#earnings-content');
const buyDiceBtn = document.querySelector('#buy-dice-btn');
const dicePrice = document.querySelector('#dice-price');

let renderer, scene, camera, diceMesh, physicsWorld;
let raycaster, mouse;
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
    diceRolling: false  // Track if dice are currently rolling
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

initPhysics();
initScene();

window.addEventListener('resize', updateSceneSize);
window.addEventListener('dblclick', handleRoll);
rollBtn.addEventListener('click', handleRoll);
nextRoundBtn.addEventListener('click', nextRound);
if (buyDiceBtn) {
    buyDiceBtn.addEventListener('click', buyDice);
    console.log('Buy dice button listener added');
} else {
    console.error('Buy dice button not found!');
}
canvasEl.addEventListener('click', handleDiceClick);
canvasEl.addEventListener('mousemove', handleMouseMove);

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
    
    // Position initial dice
    repositionAllDice();

    // Initialize game
    updateUI();
    // Don't throw dice on page load

    render();
}

function initPhysics() {
    physicsWorld = new CANNON.World({
        allowSleep: true,
        gravity: new CANNON.Vec3(0, -50, 0),
    })
    physicsWorld.defaultContactMaterial.restitution = .3;
}

function createFloor() {
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000),
        new THREE.ShadowMaterial({
            opacity: .1
        })
    )
    floor.receiveShadow = true;
    floor.position.y = -3;
    floor.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI * .5);
    scene.add(floor);

    const floorBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Plane(),
    });
    floorBody.position.copy(floor.position);
    floorBody.quaternion.copy(floor.quaternion);
    physicsWorld.addBody(floorBody);
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

function addDiceEvents(dice, index) {
    dice.body.addEventListener('sleep', (e) => {
        
        // Don't calculate score if dice haven't been rolled yet
        if (!gameState.hasRolled) {
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
    const total = gameState.diceScores.reduce((sum, score) => sum + (score || 0), 0);
    gameState.currentScore = total;
    scoreResult.textContent = total;
    
    // Check if all unlocked dice have settled
    const unlockedDiceCount = params.numberOfDice - gameState.lockedDice.size;
    const settledUnlockedDice = gameState.diceScores.filter((s, idx) => 
        s !== undefined && !gameState.lockedDice.has(idx)
    ).length;
    
    // Check if all expected dice have scores (locked dice keep their old scores)
    if (settledUnlockedDice >= unlockedDiceCount) {
        gameState.diceRolling = false;  // Dice have settled
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
    detailsHtml += `<tr><td>Base (${gameState.currentScore} - ${gameState.targetScore})</td><td class="earning-positive">+$${baseEarnings}</td></tr>`;
    
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
    detailsHtml += `<tr class="total-row"><td><strong>Total</strong></td><td class="earning-total"><strong>+$${earnings}</strong></td></tr>`;
    detailsHtml += '</table>';
    
    // Update money
    gameState.lastEarnings = earnings;
    gameState.money += earnings;
    moneyAmount.textContent = `$${gameState.money}`;
    
    // Show earnings in score result area
    scoreResult.textContent = `${gameState.currentScore} (+$${earnings})`;
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
    gameState.rerollsRemaining = 3;
    gameState.currentScore = 0;
    gameState.diceScores = [];
    gameState.lockedDice.clear();
    gameState.canRoll = true;
    gameState.roundComplete = false;
    gameState.diceRolling = false;
    
    // Reset UI
    rollBtn.style.display = 'block';
    nextRoundBtn.style.display = 'none';
    rollBtn.disabled = false;
    rollBtn.textContent = 'Roll Dice';
    scoreResult.style.color = '#d45f2e';
    roundSummary.style.display = 'none';  // Hide round summary
    
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
    gameState.rerollsRemaining = 3;
    gameState.currentScore = 0;
    gameState.diceScores = [];
    gameState.lockedDice.clear();
    gameState.canRoll = true;
    gameState.roundComplete = false;
    gameState.hasRolled = false;  // Reset hasRolled flag
    gameState.money = 0;  // Reset money on game restart
    gameState.lastEarnings = 0;
    gameState.dicePurchased = 0;  // Reset dice purchases
    gameState.diceRolling = false;  // Reset rolling flag
    
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
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

function updateSceneSize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function getDicePrice() {
    // Price increases with each purchase: 10, 15, 25, 40, 60, 85...
    return Math.floor(gameState.diceBaseCost * Math.pow(1.5, gameState.dicePurchased));
}

function updateStoreUI() {
    const price = getDicePrice();
    dicePrice.textContent = `$${price}`;
    
    // Disable buy button if can't afford
    buyDiceBtn.disabled = gameState.money < price;
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

function repositionAllDice() {
    diceArray.forEach((dice, index) => {
        if (dice && dice.mesh) {
            const startX = (index - (params.numberOfDice - 1) / 2) * 2;
            dice.body.position.x = startX;
            dice.mesh.position.x = startX;
        }
    });
}

function throwDice() {
    gameState.hasRolled = true;  // Mark that dice have been rolled
    
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

            d.body.position = new CANNON.Vec3(6, dIdx * 1.5 + 3, 0);
            d.mesh.position.copy(d.body.position);

            d.mesh.rotation.set(2 * Math.PI * Math.random(), 0, 2 * Math.PI * Math.random())
            d.body.quaternion.copy(d.mesh.quaternion);

            const force = 3 + 5 * Math.random();
            d.body.applyImpulse(
                new CANNON.Vec3(-force, force, 0),
                new CANNON.Vec3(0, 0, .2)
            );

            d.body.allowSleep = true;
        }
    });
}