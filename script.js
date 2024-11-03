const emotions = ['happy', 'sad', 'angry', 'surprised', 'disgusted'];
let selectedMode = null;
let score = 0;
let timerInterval;

// Function to select mode
function selectMode(mode) {
    selectedMode = mode;
    document.getElementById('modeSelection').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('gameTitle').innerText = mode === 'liveDetection' ? 'Live Emotion Detection' : 'Emotion Detection Challenge';
    if (selectedMode === 'challenge') {
        startChallengeMode();
    } else {
        startLiveDetection();
    }
}

// Function to start live detection
async function startLiveDetection() {
    await loadFaceApiModels();
    const video = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;

    video.addEventListener('loadedmetadata', async () => {
        video.play();
        detectEmotion(video);
    });
}

// Function to load face-api models
async function loadFaceApiModels() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/models');
}

// Function to detect emotions from video
async function detectEmotion(video) {
    const results = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
    if (results) {
        const { expressions } = results;
        const emotion = getDominantEmotion(expressions);
        document.getElementById('emotion').innerText = emotion;
        if (selectedMode === 'challenge') {
            checkMatch(emotion);
        }
    }
    requestAnimationFrame(() => detectEmotion(video));
}

// Function to get the dominant emotion
function getDominantEmotion(expressions) {
    return Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
}

// Function to start the challenge mode
function startChallengeMode() {
    resetGame();
    setRandomTargetEmotion();
    startTimer();
}

// Function to set a random target emotion
function setRandomTargetEmotion() {
    const targetEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    document.getElementById('targetEmotion').style.display = 'block';
    document.getElementById('targetEmotion').querySelector('span').innerText = targetEmotion;
}

// Function to check if the detected emotion matches the target
function checkMatch(detectedEmotion) {
    const targetEmotion = document.getElementById('targetEmotion').querySelector('span').innerText;
    if (detectedEmotion === targetEmotion) {
        score++;
        document.getElementById('score').innerText = score;
        document.getElementById('scoreDisplay').style.display = 'block'; // Show score display
        // Flash effect on score increase
        document.getElementById('gameContainer').classList.add('flash');
        setTimeout(() => {
            document.getElementById('gameContainer').classList.remove('flash');
        }, 500);
        setRandomTargetEmotion();
    }
}

// Function to reset the game
function resetGame() {
    score = 0;
    document.getElementById('score').innerText = score;
    document.getElementById('targetEmotion').style.display = 'none';
    document.getElementById('timerDisplay').style.display = 'none';
}

// Function to start the timer
function startTimer() {
    let timeLeft = 30; // Set time for the challenge
    document.getElementById('timerDisplay').style.display = 'block';
    document.getElementById('timer').innerText = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert(`Time's up! Your score: ${score}`);
            resetGame();
        }
    }, 1000);
}

// Function to go back to mode selection
function goBack() {
    clearInterval(timerInterval);
    resetGame();
    document.getElementById('modeSelection').style.display = 'block';
    document.getElementById('gameContainer').style.display = 'none';
}

// Function to start bouncing emojis
function startBouncingEmojis() {
    const emojiContainer = document.getElementById('emojiContainer');
    const emojiCount = 20; // Number of emojis
    const emojis = ['😊', '😂', '🥺', '😡', '😲', '🤢']; // List of emojis to use

    for (let i = 0; i < emojiCount; i++) {
        const emoji = document.createElement('div');
        emoji.classList.add('emoji');
        emoji.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        emojiContainer.appendChild(emoji);
        
        const bounceSpeed = Math.random() * 2000 + 1000; // Random speed between 1s to 3s
        const amplitude = Math.random() * 50 + 20; // Random bounce amplitude between 20px to 70px
        const initialPosition = Math.random() * (window.innerHeight - 100); // Random initial vertical position
        
        emoji.style.position = 'absolute';
        emoji.style.top = `${initialPosition}px`;
        emoji.style.left = `${Math.random() * (window.innerWidth - 100)}px`;
        
        // Animate the emoji's bouncing
        setInterval(() => {
            emoji.animate(
                [
                    { transform: `translateY(0px)` },
                    { transform: `translateY(-${amplitude}px)` },
                    { transform: `translateY(0px)` }
                ],
                {
                    duration: bounceSpeed,
                    easing: 'ease-in-out',
                    iterations: Infinity,
                    direction: 'alternate'
                }
            );
        }, bounceSpeed);
    }
}

// Start the emoji bouncing effect when the page loads
window.onload = startBouncingEmojis;
