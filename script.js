let score = 0;
let gameInterval;
let selectedMode = '';
let timerInterval;
let isVideoPlaying = false; // Flag to track video playback

const emotions = ['neutral', 'happy 😄', 'sad 🥲', 'angry', 'fearful', 'disgusted', 'surprised'];
let ageStable = false; // Flag to keep the age constant once stabilized

// Load models function
async function loadModels() {
    console.log("Loading models...");
    await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights/tiny_face_detector_model-weights_manifest.json');
    await faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights/face_expression_model-weights_manifest.json');
    await faceapi.nets.ageGenderNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights/age_gender_model-weights_manifest.json');
    console.log("Models loaded successfully!");
}

// Mode selection function
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
        document.getElementById('ageGenderDisplay').style.display = 'none';
    } else if (mode === 'challenge') {
        document.getElementById('gameTitle').textContent = 'Emotion Detection Challenge';
        document.getElementById('scoreDisplay').style.display = 'inline';
        document.getElementById('targetEmotion').style.display = 'inline';
        document.getElementById('timerDisplay').style.display = 'inline';
        document.getElementById('ageGenderDisplay').style.display = 'none';
    } else if (mode === 'ageGenderDetection') {
        document.getElementById('gameTitle').textContent = 'Age & Gender Detection';
        document.getElementById('scoreDisplay').style.display = 'none';
        document.getElementById('targetEmotion').style.display = 'none';
        document.getElementById('timerDisplay').style.display = 'none';
        document.getElementById('ageGenderDisplay').style.display = 'block';
    }
    document.getElementById('emotion').style.display = 'block'; // Show emotion for all modes
}

// Go back function
function goBack() {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    score = 0;
    selectedMode = '';
    isVideoPlaying = false;
    ageStable = false; // Reset age stability flag

    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('modeSelection').style.display = 'block';

    document.getElementById('emotion').textContent = 'N/A';
    document.getElementById('age').textContent = 'N/A';
    document.getElementById('gender').textContent = 'N/A';
}

// Start game function
async function startGame() {
    await loadModels();
    const video = document.getElementById('video');

    // If video is already playing, pause it first
    if (isVideoPlaying) {
        video.pause();
        video.srcObject = null;
    }

    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then(stream => {
            video.srcObject = stream;
            video.play();
            isVideoPlaying = true;
        })
        .catch(err => console.error("Error accessing webcam:", err));

    // Start the selected mode
    if (selectedMode === 'liveDetection') startLiveDetectionLogic(video);
    else if (selectedMode === 'challenge') startChallengeLogic(video);
    else if (selectedMode === 'ageGenderDetection') startAgeGenderDetectionLogic(video);
}

// Start live detection logic function
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

// Start challenge logic function
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
                    score++;
                    document.getElementById('score').textContent = score;
                    targetEmotion = emotions[Math.floor(Math.random() * emotions.length)];
                    document.getElementById('targetEmotion').textContent = targetEmotion;
                }
            }
        }, 2000);

        timerInterval = setInterval(() => {
            timeRemaining--;
            document.getElementById('timer').textContent = timeRemaining;
            if (timeRemaining <= 0) {
                clearInterval(gameInterval);
                clearInterval(timerInterval);
                alert(`Time's up! Your score is: ${score}`);
                goBack();
            }
        }, 1000);
    });
}

// Start age & gender detection logic function with stabilized average for age
async function startAgeGenderDetectionLogic(video) {
    video.addEventListener('playing', () => {
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(video, displaySize);

        let ageSamples = [];
        const maxSamples = 10; // Number of samples for stability
        const stabilityThreshold = 1.5; // Stability threshold to consider age stable
        ageStable = false;

        gameInterval = setInterval(async () => {
            if (ageStable) return; // Stop if age is already stable

            const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withAgeAndGender().withFaceExpressions();
            if (detections) {
                const { age, gender } = detections;
                const expressions = detections.expressions;
                const sortedEmotions = expressions.asSortedArray();
                const detectedEmotion = sortedEmotions[0].expression;

                // Display detected emotion
                document.getElementById('emotion').textContent = `${detectedEmotion} (${(sortedEmotions[0].probability * 100).toFixed(2)}%)`;

                // Add new age to samples, limit array to maxSamples
                ageSamples.push(age);
                if (ageSamples.length > maxSamples) {
                    ageSamples.shift();
                }

                // Calculate weighted average of age samples
                const weightedAverageAge = ageSamples.reduce((acc, curr, index) => acc + curr * (index + 1), 0) /
                                            ageSamples.reduce((acc, _, index) => acc + (index + 1), 0);

                // Check if the age has stabilized
                if (ageSamples.length >= maxSamples) {
                    const variance = ageSamples.reduce((acc, a) => acc + Math.pow(a - weightedAverageAge, 2), 0) / ageSamples.length;
                    if (variance < stabilityThreshold) {
                        ageStable = true;
                    }
                }

                // Update displayed age if not yet stable
                if (!ageStable) {
                    document.getElementById('age').textContent = weightedAverageAge.toFixed(0);
                }
                document.getElementById('gender').textContent = gender.charAt(0).toUpperCase() + gender.slice(1);
                document.getElementById('ageGenderDisplay').style.display = 'block';
            }
        }, 2000);
    });
}
