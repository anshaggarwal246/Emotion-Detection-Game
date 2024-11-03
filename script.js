let score = 0;
let gameInterval;
let selectedMode = '';
let timerInterval;

// Define possible emotions
const emotions = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'];

// Load face-api.js models
async function loadModels() {
    console.log("Loading models...");
    await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights/tiny_face_detector_model-weights_manifest.json');
    await faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights/face_expression_model-weights_manifest.json');
    console.log("Models loaded successfully!");
}

// Mode selection function
function selectMode(mode) {
    selectedMode = mode;
    document.getElementById('modeSelection').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';

    if (mode === 'liveDetection') {
        document.getElementById('gameTitle').textContent = 'Live Emotion Detection';
        score = 0; // Reset score for live detection
        document.getElementById('scoreDisplay').style.display = 'none'; // Hide score display
        document.getElementById('targetEmotion').style.display = 'none'; // Hide target emotion display
        document.getElementById('timerDisplay').style.display = 'none'; // Hide timer display
    } else if (mode === 'challenge') {
        document.getElementById('gameTitle').textContent = 'Emotion Detection Challenge';
        document.getElementById('scoreDisplay').style.display = 'inline'; // Show score display
        document.getElementById('targetEmotion').style.display = 'inline'; // Show target emotion display
        document.getElementById('timerDisplay').style.display = 'inline'; // Show timer display
    }
}

// Back function to return to mode selection
function goBack() {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    score = 0; // Reset score
    selectedMode = '';

    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('modeSelection').style.display = 'block';

    document.getElementById('emotion').textContent = 'N/A';
}

// Start the game
async function startGame() {
    await loadModels();

    const video = document.getElementById('video');
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then(stream => {
            video.srcObject = stream;
            video.play();
        })
        .catch(err => {
            console.error("Error accessing webcam:", err);
        });

    if (selectedMode === 'liveDetection') {
        startLiveDetectionLogic(video);
    } else if (selectedMode === 'challenge') {
        startChallengeLogic(video);
    }
}

// Live Detection mode logic
function startLiveDetectionLogic(video) {
    video.addEventListener('playing', () => {
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(video, displaySize);

        gameInterval = setInterval(async () => {
            const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
            if (detections) {
                const expressions = detections.expressions;
                const sortedEmotions = expressions.asSortedArray();
                const detectedEmotion = sortedEmotions[0].expression;
                document.getElementById('emotion').textContent = `${detectedEmotion} (${(sortedEmotions[0].probability * 100).toFixed(2)}%)`;
            }
        }, 2000);
    });
}

// Challenge mode logic
function startChallengeLogic(video) {
    let targetEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    document.getElementById('targetEmotion').querySelector('span').textContent = targetEmotion;
    document.getElementById('score').textContent = score;

    startTimer(30, document.getElementById('timer'));

    video.addEventListener('playing', () => {
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(video, displaySize);

        gameInterval = setInterval(async () => {
            const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
            if (detections) {
                const expressions = detections.expressions;
                const sortedEmotions = expressions.asSortedArray();
                const detectedEmotion = sortedEmotions[0].expression;
                document.getElementById('emotion').textContent = `${detectedEmotion} (${(sortedEmotions[0].probability * 100).toFixed(2)}%)`;

                // Check if detected emotion matches target emotion
                if (detectedEmotion === targetEmotion) {
                    score++;
                    document.getElementById('score').textContent = score;

                    // Change the target emotion after a successful match
                    targetEmotion = emotions[Math.floor(Math.random() * emotions.length)];
                    document.getElementById('targetEmotion').querySelector('span').textContent = targetEmotion;

                    // Flash effect for a successful match
                    flashEffect();
                }
            }
        }, 1000);
    });
}

// Start the timer
function startTimer(duration, display) {
    let timer = duration;
    display.textContent = timer;

    timerInterval = setInterval(() => {
        timer--;
        display.textContent = timer;

        if (timer <= 0) {
            clearInterval(timerInterval);
            clearInterval(gameInterval);
            alert(`Time's up! Your score is: ${score}`);
            goBack(); // Return to mode selection
        }
    }, 1000);
}

// Flash effect function
function flashEffect() {
    const container = document.querySelector('.container'); // Select the main container
    container.classList.add('flash'); // Add flash class to trigger the animation

    // Remove the class after the animation ends to allow it to be reapplied later
    setTimeout(() => {
        container.classList.remove('flash');
    }, 500); // Match the duration of the flash animation
}
