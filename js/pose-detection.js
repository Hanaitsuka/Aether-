/**
 * POSE DETECTION MODULE
 * Handles MediaPipe Pose initialization and landmark processing
 */

class PoseDetector {
  constructor() {
    this.pose = null;
    this.camera = null;
    this.isInitialized = false;
    this.onResultsCallback = null;
    this.videoElement = null;
    this.canvasElement = null;
  }

  /**
   * Initialize MediaPipe Pose
   */
  async initialize(videoElementId, canvasElementId) {
    try {
      this.videoElement = document.getElementById(videoElementId);
      this.canvasElement = document.getElementById(canvasElementId);

      if (!this.videoElement || !this.canvasElement) {
        throw new Error('Video or canvas element not found');
      }

      // Initialize MediaPipe Pose
      this.pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      // Configure pose detection
      this.pose.setOptions({
        modelComplexity: 1, // 0=lite, 1=full, 2=heavy (use 1 for balance)
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      // Set up results callback
      this.pose.onResults((results) => {
        if (this.onResultsCallback) {
          this.onResultsCallback(results);
        }
      });

      // Initialize camera
      this.camera = new Camera(this.videoElement, {
        onFrame: async () => {
          await this.pose.send({ image: this.videoElement });
        },
        width: 640,
        height: 480
      });

      this.isInitialized = true;
      console.log('✅ PoseDetector initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize PoseDetector:', error);
      return false;
    }
  }

  /**
   * Start pose detection
   */
  async start(onResults) {
    if (!this.isInitialized) {
      console.error('PoseDetector not initialized. Call initialize() first.');
      return false;
    }

    this.onResultsCallback = onResults;
    await this.camera.start();
    console.log('📹 Camera started');
    return true;
  }

  /**
   * Stop pose detection
   */
  stop() {
    if (this.camera) {
      this.camera.stop();
      console.log('🛑 Camera stopped');
    }
  }

  /**
   * Extract key landmarks from MediaPipe results
   */
  static extractLandmarks(results) {
    if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
      return null;
    }

    const landmarks = results.poseLandmarks;
    
    // Key landmarks we care about (MediaPipe Pose landmark indices)
    return {
      nose: landmarks[0],
      leftShoulder: landmarks[11],
      rightShoulder: landmarks[12],
      leftHip: landmarks[23],
      rightHip: landmarks[24],
      leftEar: landmarks[7],
      rightEar: landmarks[8]
    };
  }

  /**
   * Calculate distance between two landmarks
   */
  static calculateDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = point1.z - point2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculate angle between three points (in degrees)
   */
  static calculateAngle(point1, point2, point3) {
    const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) -
                    Math.atan2(point1.y - point2.y, point1.x - point2.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    
    return angle;
  }

  /**
   * Get midpoint between two landmarks
   */
  static getMidpoint(point1, point2) {
    return {
      x: (point1.x + point2.x) / 2,
      y: (point1.y + point2.y) / 2,
      z: (point1.z + point2.z) / 2
    };
  }

  /**
   * Calculate posture metrics (ratios that are camera-angle independent)
   */
  static calculatePostureMetrics(landmarks) {
    if (!landmarks) return null;

    try {
      const shoulderMidpoint = this.getMidpoint(landmarks.leftShoulder, landmarks.rightShoulder);
      const hipMidpoint = this.getMidpoint(landmarks.leftHip, landmarks.rightHip);
      const earMidpoint = this.getMidpoint(landmarks.leftEar, landmarks.rightEar);
      
      // 1. Shoulder width (reference for ratios)
      const shoulderWidth = this.calculateDistance(landmarks.leftShoulder, landmarks.rightShoulder);
      
      // 2. Head-to-shoulder ratio (forward head posture detection)
      // When slouching, head drifts forward relative to shoulders
      const headToShoulderDistance = this.calculateDistance(earMidpoint, shoulderMidpoint);
      const headShoulderRatio = headToShoulderDistance / shoulderWidth;
      
      // 3. Shoulder asymmetry (leaning to one side)
      const shoulderHeightDiff = Math.abs(landmarks.leftShoulder.y - landmarks.rightShoulder.y);
      const shoulderAsymmetry = shoulderHeightDiff / shoulderWidth;
      
      // 4. Torso angle (spine alignment)
      const torsoAngle = this.calculateAngle(shoulderMidpoint, hipMidpoint, {
        x: hipMidpoint.x,
        y: hipMidpoint.y + 0.1,
        z: hipMidpoint.z
      });
      
      // 5. Neck angle (head tilt)
      const neckAngle = this.calculateAngle(shoulderMidpoint, earMidpoint, landmarks.nose);
      
      // 6. Forward lean (z-axis depth)
      const forwardLean = Math.abs(shoulderMidpoint.z - hipMidpoint.z);

      return {
        headShoulderRatio,      // Primary slouch indicator
        shoulderAsymmetry,      // Side lean indicator
        torsoAngle,             // Spine alignment
        neckAngle,              // Head position
        forwardLean,            // Forward/backward lean
        shoulderWidth,          // Reference measurement
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return null;
    }
  }

  /**
   * Check lighting quality (useful for calibration phase)
   */
  static checkLightingQuality(landmarks) {
    if (!landmarks) return { quality: 'poor', message: 'No pose detected' };
    
    // MediaPipe provides visibility scores for landmarks
    const avgVisibility = Object.values(landmarks)
      .reduce((sum, landmark) => sum + (landmark.visibility || 0), 0) / Object.keys(landmarks).length;
    
    if (avgVisibility > 0.8) {
      return { quality: 'good', message: 'Lighting is good' };
    } else if (avgVisibility > 0.6) {
      return { quality: 'medium', message: 'Lighting could be better' };
    } else {
      return { quality: 'poor', message: 'Poor lighting detected' };
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PoseDetector;
}
