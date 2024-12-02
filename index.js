import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

let scene, renderer;
let cameraP1, cameraP2;
let paddle1, paddle2;

// Variables de score
let scoreP1 = 0;
let scoreP2 = 0;
const MAX_SCORE = 5;
let gameOver = false; // Indicateur de fin de jeu

function init() {
    // 1. Créer une scène
    scene = new THREE.Scene();

    // 2. Créer deux caméras (PerspectiveCamera)
    cameraP1 = new THREE.PerspectiveCamera(100, window.innerWidth / 2 / window.innerHeight, 0.1, 1000);
    cameraP1.position.set(-9, 5, 0); // Caméra joueur 1
    cameraP1.lookAt(0, 0, 0);

    cameraP2 = new THREE.PerspectiveCamera(100, window.innerWidth / 2 / window.innerHeight, 0.1, 1000);
    cameraP2.position.set(9, 5, 0); // Caméra joueur 2
    cameraP2.lookAt(0, 0, 0);

    // 3. Créer le renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Activer le test de scissor une seule fois
    renderer.setScissorTest(true);
    renderer.shadowMap.enabled = true;

    // Redimensionner les caméras si la fenêtre change
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);

        cameraP1.aspect = window.innerWidth / 2 / window.innerHeight;
        cameraP1.updateProjectionMatrix();

        cameraP2.aspect = window.innerWidth / 2 / window.innerHeight;
        cameraP2.updateProjectionMatrix();
    });

    // 4. Créer un terrain
    const terrainGeometry = new THREE.PlaneGeometry(20, 10); // Taille : 20x10
    const terrainMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        roughness: 1,
        metalness: 1
    });

    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2; // À plat
    terrain.position.set(0, -0.1, 0);
    terrain.receiveShadow = true;
    scene.add(terrain);

    // ===================================== 5. Ajouter une ligne centrale ==========================
    const lineGeometry = new THREE.PlaneGeometry(0.5, 9);
    const lineMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 1,
        metalness: 1,
        emissive: 0x404040
    });

    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.rotation.x = -Math.PI / 2;
    scene.add(line);

    // ==================================== 6. Ajouter une lumière ===============================
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 5);
    light.castShadow = true;
    scene.add(light);

    // ================================= 7. Créer les paddles =====================================
    const paddle1Geometry = new THREE.BoxGeometry(0.05, 3, 0.05);
    const paddle1Material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    paddle1 = new THREE.Mesh(paddle1Geometry, paddle1Material);
    paddle1.position.set(-8, 0, 0)
    paddle1.rotation.x = Math.PI / 2;
    paddle1.castShadow = true;
    scene.add(paddle1);

    // =============================Raquette du joueur 2 =====================================================
    const paddle2Geometry = new THREE.BoxGeometry(0.05, 3, 0.05);
    const paddle2Material = new THREE.MeshStandardMaterial({ color: 0x0000ff,
        roughness: 1,
        metalness: 1,
    });
    paddle2 = new THREE.Mesh(paddle2Geometry, paddle2Material);
    paddle2.position.set(8, 0, 0);
    paddle2.rotation.x = Math.PI / 2;
    paddle2.castShadow = true;
    scene.add(paddle2);

    // ===============================8. Ajouter les bordures =========================
    const borderGeometry = new THREE.BoxGeometry(20, 0.5, 0.5);
    const borderMaterial = new THREE.MeshBasicMaterial({ color: 0xAA0100,
        roughness: 1,
        metalness: 1,
        emissive: 0x404040
    });

    //======================================  Bordure supérieure ==================
    const topBorder = new THREE.Mesh(borderGeometry, borderMaterial);
    topBorder.position.set(0, 0.25, -4.5);
    topBorder.receiveShadow = true;
    scene.add(topBorder);

    // ======================================= Bordure inférieure ==================
    const bottomBorder = new THREE.Mesh(borderGeometry, borderMaterial.clone());
    bottomBorder.position.set(0, 0.25, 4.5);
    bottomBorder.receiveShadow = true;
    scene.add(bottomBorder);
}

function render() {
    // =============================Vue gauche pour cameraP1 ======================
    renderer.setViewport(0, 0, window.innerWidth / 2 - 10, window.innerHeight);
    renderer.setScissor(0, 0, window.innerWidth / 2, window.innerHeight);
    renderer.render(scene, cameraP1);
    
    // ============================ Vue droite pour cameraP2 ==================================
    renderer.setViewport(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
    renderer.setScissor(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
    renderer.render(scene, cameraP2);
}

let paddle1x = 0;
let paddle2x = 0;

function animate() {
    requestAnimationFrame(animate);
    
    if (!gameOver) {
        paddle1x = Math.max(-4.5, Math.min(4.5, paddle1x));
        paddle2x = Math.max(-4.5, Math.min(4.5, paddle2x));

        // Mettre à jour les positions des raquettes
        paddle1.position.set(-8, 0, paddle1x);
        paddle2.position.set(8, 0, paddle2x);

        updateBall();
    }
    
    render();
}

window.addEventListener("keydown", (event) => {
    if (gameOver) return; // Ne pas permettre de déplacer les paddles si le jeu est terminé

    switch (event.key) {
        case "d": paddle1x += 0.5; break; // Joueur 1 monte
        case "a": paddle1x -= 0.5; break; // Joueur 1 descend
        case "ArrowLeft": paddle2x += 0.5; break; // Joueur 2 vers la gauche
        case "ArrowRight": paddle2x -= 0.5; break; // Joueur 2 vers la droite
    }
});

let ball;
let ballSpeed = 0.1;
let ballDirection = { x: Math.random() > 0.5 ? 1 : -1, y: Math.random() > 0.5 ? 1 : -1 };

function createBall() {
    const ballGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(0, 0.5, 0);
    ball.castShadow = true;
    ball.receiveShadow = true;
    scene.add(ball);
}

function resetBall() {
    ball.position.set(0, 0.5, 0);
    ballSpeed = 0.1;
    ballDirection = { x: Math.random() > 0.5 ? 1 : -1, y: Math.random() > 0.5 ? 1 : -1 };
}

function updateBall() {
    if (gameOver) return; // Ne rien faire si le jeu est terminé

    ball.position.x += ballDirection.x * ballSpeed;
    ball.position.z += ballDirection.y * ballSpeed;

    if (ball.position.z >= 4.5 || ball.position.z <= -4.5) {
        ballDirection.y *= -1;
    }

    if (ball.position.x <= -7.9 && Math.abs(ball.position.z - paddle1.position.z) <= 1.5) {
        ballDirection.x *= -1;
        ballSpeed += 0.01;
    }

    if (ball.position.x >= 7.9 && Math.abs(ball.position.z - paddle2.position.z) <= 1.5) {
        ballDirection.x *= -1;
        ballSpeed += 0.01;
    }

    // Mise à jour du score
    if (ball.position.x > 9) {
        scoreP1 += 1; // Joueur 1 marque
        updateScoreDisplay();
        resetBall();
        checkGameOver();
    }

    if (ball.position.x < -9) {
        scoreP2 += 1; // Joueur 2 marque
        updateScoreDisplay();
        resetBall();
        checkGameOver();
    }
}

function checkGameOver() {
    if (scoreP1 >= MAX_SCORE) {
        endGame('Joueur 1 a gagné !');
    } else if (scoreP2 >= MAX_SCORE) {
        endGame('Joueur 2 a gagné !');
    }
}

function endGame(message) {
    gameOver = true;
    // Afficher le message de victoire
    const messageElement = document.createElement('div');
    messageElement.id = 'gameOver';
    messageElement.style.position = 'absolute';
    messageElement.style.top = '50%';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translate(-50%, -50%)';
    messageElement.style.padding = '20px';
    messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    messageElement.style.color = 'white';
    messageElement.style.fontSize = '32px';
    messageElement.style.fontFamily = 'Arial, sans-serif';
    messageElement.style.textAlign = 'center';
    messageElement.style.borderRadius = '10px';
    messageElement.style.zIndex = '2';
    messageElement.textContent = message;

    // Optionnel : Ajouter un bouton pour redémarrer le jeu
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Rejouer';
    restartButton.style.marginTop = '20px';
    restartButton.style.padding = '10px 20px';
    restartButton.style.fontSize = '16px';
    restartButton.style.cursor = 'pointer';
    restartButton.onclick = () => {
        location.reload(); // Recharge la page pour redémarrer le jeu
    };

    messageElement.appendChild(restartButton);
    document.body.appendChild(messageElement);
}

function updateScoreDisplay() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = `Joueur 1: ${scoreP1} | Joueur 2: ${scoreP2}`;
    }
}

init();
createBall();
updateScoreDisplay(); // Initialiser l'affichage des scores
animate();
