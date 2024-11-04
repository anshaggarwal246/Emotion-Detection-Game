let score = 0;
let gameInterval;
let selectedMode = '';
let timerInterval;

const emotions = ['neutral', 'happy 😄', 'sad 🥲', 'angry', 'fearful', 'disgusted', 'surprised'];

async function loadModels() {
    console.log("Loading models...");
    await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights/tiny_face_detector_model-weights_manifest.json');
    await faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights/face_expression_model-weights_manifest.json');
    console.log("Models loaded successfully!");
}

function selectMode(mode) {
    selectedMode = mode;
    document.getElementById('modeSelection').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';

    if (mode === 'liveDetection') {
        document.getElementById('gameTitle').textContent = 'Live Emotion Detection';
        score = 0;
        document.getElementById('scoreDisplay').style.display = 'none';
        document.getElementById('targetEmotion').style.display = 'none';
        document.getElementById('timerDisplay').style.display = 'none';
    } else if (mode === 'challenge') {
        document.getElementById('gameTitle').textContent = 'Emotion Detection Challenge';
        document.getElementById('scoreDisplay').style.display = 'inline';
        document.getElementById('targetEmotion').style.display = 'inline';
        document.getElementById('timerDisplay').style.display = 'inline';
    }
}

function goBack() {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    score = 0;
    selectedMode = '';

    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('modeSelection').style.display = 'block';

    document.getElementById('emotion').textContent = 'N/A';
}

async function startGame() {
    await loadModels();
    const video = document.getElementById('video');
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then(stream => {
            video.srcObject = stream;
            video.play();
        })
        .catch(err => console.error("Error accessing webcam:", err));

    if (selectedMode === 'liveDetection') startLiveDetectionLogic(video);
    else if (selectedMode === 'challenge') startChallengeLogic(video);
}

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

function startChallengeLogic(video) {
    video.addEventListener('playing', () => {
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(video, displaySize);

        let targetEmotion = emotions[Math.floor(Math.random() * emotions.length)];
        document.getElementById('targetEmotion').textContent = targetEmotion;
        score = 0;
        document.getElementById('score').textContent = score;
        let timeRemaining = 30;
        document.getElementById('timer').textContent = timeRemaining;

        gameInterval = setInterval(async () => {
            const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
            if (detections) {
                const expressions = detections.expressions;
                const sortedEmotions = expressions.asSortedArray();
                const detectedEmotion = sortedEmotions[0].expression;

                document.getElementById('emotion').textContent = `${detectedEmotion} (${(sortedEmotions[0].probability * 100).toFixed(2)}%)`;

                if (detectedEmotion === targetEmotion) {
                    score += 10;
                    document.getElementById('score').textContent = score;
                    document.getElementById('gameContainer').classList.add('flash');
                    setTimeout(() => document.getElementById('gameContainer').classList.remove('flash'), 500);

                    targetEmotion = emotions[Math.floor(Math.random() * emotions.length)];
                    document.getElementById('targetEmotion').textContent = targetEmotion;
                }
            }
        }, 2000);

        timerInterval = setInterval(() => {
            timeRemaining -= 1;
            document.getElementById('timer').textContent = timeRemaining;

            if (timeRemaining <= 0) {
                clearInterval(gameInterval);
                clearInterval(timerInterval);
                alert(`Game Over! Your score: ${score}`);
            }
        }, 1000);
    });
}
