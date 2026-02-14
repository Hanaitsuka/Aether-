/**
 * DEMO APP - Main Integration Script
 * Connects PoseDetector, PostureCalibrator, and PostureMonitor
 */

// Initialize modules
const poseDetector = new PoseDetector();
const calibrator = new PostureCalibrator();
const monitor = new PostureMonitor(calibrator);

// State
let isCalibrating = false;
let isMonitoring = false;
let currentStrategy = 'both';

// DOM Elements
const videoElement = document.getElementById('videoElement');
const canvasElement = document.getElementById('canvasElement');
const ctx = canvasElement.getContext('2d');

// Buttons
const startCameraBtn = document.getElementById('startCameraBtn');
const stopCameraBtn = document.getElementById('stopCameraBtn');
const calibrateGoodBtn = document.getElementById('calibrateGoodBtn');
const calibrateSlouchBtn = document.getElementById('calibrateSlouchBtn');
const clearCalibrationBtn = document.getElementById('clearCalibrationBtn');
const startMonitoringBtn = document.getElementById('startMonitoringBtn');
const stopMonitoringBtn = document.getElementById('stopMonitoringBtn');
const resetSessionBtn = document.getElementById('resetSessionBtn');

// Alerts
const statusMessage = document.getElementById('statusMessage');
const calibrationAlert = document.getElementById('calibrationAlert');
const postureAlert = document.getElementById('postureAlert');
const calibrationProgress = document.getElementById('calibrationProgress');
const calibrationProgressFill = document.getElementById('calibrationProgressFill');

// Metrics Display
const postureStatus = document.getElementById('postureStatus');
const headShoulderRatio = document.getElementById('headShoulderRatio');
const shoulderAsymmetry = document.getElementById('shoulderAsymmetry');
const torsoAngle = document.getElementById('torsoAngle');
const neckAngle = document.getElementById('neckAngle');
const postureQuality = document.getElementById('postureQuality');
const totalAlerts = document.getElementById('totalAlerts');
const goodFrames = document.getElementById('goodFrames');
const slouchFrames = document.getElementById('slouchFrames');

// Strategy selector
const strategyRadios = document.querySelectorAll('input[name="strategy"]');
strategyRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    currentStrategy = e.target.value;
    console.log('Strategy changed to:', currentStrategy);
    if (isMonitoring) {
      monitor.stop();
      monitor.start(currentStrategy);
    }
  });
});

/**
 * Initialize app
 */
function init() {
  // Try to load existing calibration
  if (calibrator.loadCalibration()) {
    showAlert(calibrationAlert, 'success', '✅ Previous calibration loaded! You can start monitoring or recalibrate.');
    startMonitoringBtn.disabled = false;
  }

  // Set up event listeners
  startCameraBtn.addEventListener('click', startCamera);
  stopCameraBtn.addEventListener('click', stopCamera);
  calibrateGoodBtn.addEventListener('click', () => startCalibration('good'));
  calibrateSlouchBtn.addEventListener('click', () => startCalibration('slouched'));
  clearCalibrationBtn.addEventListener('click', clearCalibration);
  startMonitoringBtn.addEventListener('click', startMonitoring);
  stopMonitoringBtn.addEventListener('click', stopMonitoring);
  resetSessionBtn.addEventListener('click', resetSession);

  // Set up monitor callbacks
  monitor.onSlouch((data) => {
    showAlert(postureAlert, 'danger', `⚠️ Poor posture detected: ${data.reason}`);
    postureStatus.innerHTML = '<span class="status-indicator bad"></span>SLOUCHING';
  });

  monitor.onCorrection(() => {
    showAlert(postureAlert, 'success', '✅ Good posture restored!');
    postureStatus.innerHTML = '<span class="status-indicator good"></span>GOOD';
    
    // Auto-hide after 2 seconds
    setTimeout(() => {
      postureAlert.classList.remove('show');
    }, 2000);
  });

  monitor.onDrift((data) => {
    showAlert(postureAlert, 'warning', `📊 3-min drift check: ${data.reason}`);
  });

  console.log('✅ App initialized');
}

/**
 * Start camera
 */
async function startCamera() {
  showStatus('Initializing camera...', 'info');
  
  const success = await poseDetector.initialize('videoElement', 'canvasElement');
  
  if (!success) {
    showStatus('❌ Failed to initialize camera', 'danger');
    return;
  }

  await poseDetector.start(onPoseResults);
  
  showStatus('✅ Camera started', 'success');
  startCameraBtn.disabled = true;
  stopCameraBtn.disabled = false;
  calibrateGoodBtn.disabled = false;
}

/**
 * Stop camera
 */
function stopCamera() {
  poseDetector.stop();
  
  showStatus('🛑 Camera stopped', 'warning');
  startCameraBtn.disabled = false;
  stopCameraBtn.disabled = true;
  calibrateGoodBtn.disabled = true;
  calibrateSlouchBtn.disabled = true;
  
  if (isMonitoring) {
    stopMonitoring();
  }
}

/**
 * Handle pose detection results
 */
function onPoseResults(results) {
  // Clear canvas
  ctx.save();
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Draw video frame
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
  
  // Draw pose landmarks if detected
  if (results.poseLandmarks) {
    drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
    drawLandmarks(ctx, results.poseLandmarks, {color: '#FF0000', lineWidth: 1});
  }
  
  ctx.restore();

  // Extract landmarks and calculate metrics
  const landmarks = PoseDetector.extractLandmarks(results);
  
  if (landmarks) {
    const metrics = PoseDetector.calculatePostureMetrics(landmarks);
    
    if (metrics) {
      updateMetricsDisplay(metrics);
      
      // If calibrating, add frame
      if (isCalibrating) {
        const progress = calibrator.addCalibrationFrame(metrics);
        if (progress) {
          updateCalibrationProgress(progress.progress);
          
          if (progress.progress >= 100) {
            finishCalibration();
          }
        }
      }
      
      // If monitoring, process frame
      if (isMonitoring) {
        monitor.processFrame(metrics);
        updateStatsDisplay();
      }
    }
  }
}

/**
 * Start calibration process
 */
function startCalibration(type) {
  isCalibrating = true;
  calibrator.startCalibration(type);
  
  calibrationProgress.style.display = 'block';
  calibrationProgressFill.style.width = '0%';
  calibrationProgressFill.textContent = '0%';
  
  const message = type === 'good' 
    ? '🧍 Hold your GOOD posture (back straight, shoulders relaxed)...'
    : '😰 Hold your SLOUCHED posture (hunch forward)...';
  
  showAlert(calibrationAlert, 'info', message);
  
  // Disable buttons during calibration
  calibrateGoodBtn.disabled = true;
  calibrateSlouchBtn.disabled = true;
}

/**
 * Update calibration progress
 */
function updateCalibrationProgress(progress) {
  calibrationProgressFill.style.width = progress + '%';
  calibrationProgressFill.textContent = Math.round(progress) + '%';
}

/**
 * Finish calibration
 */
function finishCalibration() {
  isCalibrating = false;
  
  const calibrationType = calibrator.currentPostureType;
  
  setTimeout(() => {
    calibrationProgress.style.display = 'none';
    
    if (calibrationType === 'good') {
      showAlert(calibrationAlert, 'success', '✅ Good posture calibrated! Now calibrate your slouched posture.');
      calibrateGoodBtn.disabled = false;
      calibrateSlouchBtn.disabled = false;
    } else {
      showAlert(calibrationAlert, 'success', '🎉 Calibration complete! You can now start monitoring.');
      calibrator.saveCalibration();
      calibrateGoodBtn.disabled = false;
      calibrateSlouchBtn.disabled = false;
      startMonitoringBtn.disabled = false;
    }
  }, 500);
}

/**
 * Clear calibration
 */
function clearCalibration() {
  if (confirm('Are you sure you want to clear calibration data?')) {
    calibrator.clearCalibration();
    showAlert(calibrationAlert, 'warning', '🗑️ Calibration cleared. Please recalibrate.');
    startMonitoringBtn.disabled = true;
    calibrateSlouchBtn.disabled = true;
  }
}

/**
 * Start posture monitoring
 */
function startMonitoring() {
  if (!calibrator.hasCalibration()) {
    showAlert(postureAlert, 'danger', '❌ Please complete calibration first!');
    return;
  }
  
  isMonitoring = true;
  monitor.start(currentStrategy);
  
  showAlert(postureAlert, 'info', `👁️ Monitoring started with ${currentStrategy} strategy`);
  
  startMonitoringBtn.disabled = true;
  stopMonitoringBtn.disabled = false;
  resetSessionBtn.disabled = false;
  postureStatus.innerHTML = '<span class="status-indicator good"></span>MONITORING';
}

/**
 * Stop posture monitoring
 */
function stopMonitoring() {
  isMonitoring = false;
  monitor.stop();
  
  showAlert(postureAlert, 'warning', '🛑 Monitoring stopped');
  
  startMonitoringBtn.disabled = false;
  stopMonitoringBtn.disabled = true;
  resetSessionBtn.disabled = true;
  postureStatus.innerHTML = '<span class="status-indicator warning"></span>STOPPED';
}

/**
 * Reset monitoring session
 */
function resetSession() {
  monitor.resetSession();
  showAlert(postureAlert, 'info', '🔄 Session reset - new baseline set');
}

/**
 * Update metrics display
 */
function updateMetricsDisplay(metrics) {
  headShoulderRatio.textContent = metrics.headShoulderRatio.toFixed(3);
  shoulderAsymmetry.textContent = metrics.shoulderAsymmetry.toFixed(3);
  torsoAngle.textContent = metrics.torsoAngle.toFixed(1) + '°';
  neckAngle.textContent = metrics.neckAngle.toFixed(1) + '°';
}

/**
 * Update statistics display
 */
function updateStatsDisplay() {
  const stats = monitor.getStats();
  
  postureQuality.textContent = stats.postureQualityScore;
  totalAlerts.textContent = stats.alerts;
  goodFrames.textContent = stats.goodFrames;
  slouchFrames.textContent = stats.slouchFrames;
}

/**
 * Show alert message
 */
function showAlert(element, type, message) {
  element.className = `alert alert-${type} show`;
  element.textContent = message;
}

/**
 * Show status message
 */
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `alert alert-${type}`;
  statusMessage.style.display = 'block';
  
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 3000);
}

// Initialize app on load
window.addEventListener('load', init);

console.log('🚀 Demo app loaded');
