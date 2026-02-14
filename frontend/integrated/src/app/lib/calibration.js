/**
 * CALIBRATION MODULE
 * Handles one-time calibration and quick reference checks
 */

class PostureCalibrator {
  constructor() {
    this.calibrationData = null;
    this.isCalibrating = false;
    this.calibrationFrames = [];
    this.requiredFrames = 60; // 60 frames (~2 seconds at 30fps)
  }

  /**
   * Start calibration process for good posture
   */
  startCalibration(posturType = 'good') {
    this.isCalibrating = true;
    this.calibrationFrames = [];
    this.currentPostureType = posturType;
    console.log(`🎯 Starting ${posturType} posture calibration...`);
  }

  /**
   * Add a frame during calibration
   */
  addCalibrationFrame(metrics) {
    if (!this.isCalibrating || !metrics) return;

    this.calibrationFrames.push(metrics);
    
    const progress = (this.calibrationFrames.length / this.requiredFrames) * 100;
    
    if (this.calibrationFrames.length >= this.requiredFrames) {
      this.completeCalibration();
    }
    
    return {
      progress,
      framesCollected: this.calibrationFrames.length,
      framesRequired: this.requiredFrames
    };
  }

  /**
   * Complete calibration and calculate average metrics
   */
  completeCalibration() {
    if (this.calibrationFrames.length === 0) {
      console.error('No calibration frames collected');
      return null;
    }

    // Calculate average of all metrics
    const avgMetrics = {
      headShoulderRatio: 0,
      shoulderAsymmetry: 0,
      torsoAngle: 0,
      neckAngle: 0,
      forwardLean: 0
    };

    this.calibrationFrames.forEach(frame => {
      avgMetrics.headShoulderRatio += frame.headShoulderRatio;
      avgMetrics.shoulderAsymmetry += frame.shoulderAsymmetry;
      avgMetrics.torsoAngle += frame.torsoAngle;
      avgMetrics.neckAngle += frame.neckAngle;
      avgMetrics.forwardLean += frame.forwardLean;
    });

    const frameCount = this.calibrationFrames.length;
    Object.keys(avgMetrics).forEach(key => {
      avgMetrics[key] /= frameCount;
    });

    // Initialize calibration data if needed
    if (!this.calibrationData) {
      this.calibrationData = {
        goodPosture: null,
        slouchedPosture: null,
        calibratedAt: Date.now()
      };
    }

    // Store calibration
    this.calibrationData[this.currentPostureType + 'Posture'] = avgMetrics;
    
    this.isCalibrating = false;
    console.log(`✅ ${this.currentPostureType} posture calibration complete:`, avgMetrics);
    
    return avgMetrics;
  }

  /**
   * Perform quick 5-second reference check at session start
   */
  async performQuickReference(onProgress) {
    return new Promise((resolve) => {
      const referenceFrames = [];
      const requiredFrames = 50; // ~5 seconds at 10fps
      let frameCount = 0;

      const collectFrame = (metrics) => {
        if (!metrics) return;
        
        referenceFrames.push(metrics);
        frameCount++;

        if (onProgress) {
          onProgress({
            progress: (frameCount / requiredFrames) * 100,
            framesCollected: frameCount,
            message: 'Hold your comfortable posture...'
          });
        }

        if (frameCount >= requiredFrames) {
          // Calculate average
          const avgMetrics = this.calculateAverageMetrics(referenceFrames);
          
          // Check if recalibration needed
          const needsRecalibration = this.checkIfRecalibrationNeeded(avgMetrics);
          
          resolve({
            referenceMetrics: avgMetrics,
            needsRecalibration: needsRecalibration.needed,
            reason: needsRecalibration.reason,
            adjustedBaseline: needsRecalibration.needed ? null : avgMetrics
          });
        }
      };

      // Return the collector function
      resolve({ collector: collectFrame });
    });
  }

  /**
   * Calculate average metrics from array of frames
   */
  calculateAverageMetrics(frames) {
    const avgMetrics = {
      headShoulderRatio: 0,
      shoulderAsymmetry: 0,
      torsoAngle: 0,
      neckAngle: 0,
      forwardLean: 0
    };

    frames.forEach(frame => {
      Object.keys(avgMetrics).forEach(key => {
        avgMetrics[key] += frame[key];
      });
    });

    const frameCount = frames.length;
    Object.keys(avgMetrics).forEach(key => {
      avgMetrics[key] /= frameCount;
    });

    return avgMetrics;
  }

  /**
   * Check if recalibration is needed (15% tolerance)
   */
  checkIfRecalibrationNeeded(currentMetrics) {
    if (!this.calibrationData || !this.calibrationData.goodPosture) {
      return { needed: true, reason: 'No calibration data found' };
    }

    const tolerance = 0.15; // 15% variance allowed
    const calibrated = this.calibrationData.goodPosture;

    for (let metric in currentMetrics) {
      const deviation = Math.abs(
        (currentMetrics[metric] - calibrated[metric]) / calibrated[metric]
      );

      if (deviation > tolerance) {
        return {
          needed: true,
          reason: `${metric} deviation: ${(deviation * 100).toFixed(1)}%`
        };
      }
    }

    return { needed: false, reason: 'Within acceptable range' };
  }

  /**
   * Save calibration to localStorage
   */
  saveCalibration(userId = 'default') {
    if (!this.calibrationData) {
      console.error('No calibration data to save');
      return false;
    }

    try {
      const dataToSave = {
        ...this.calibrationData,
        userId,
        savedAt: Date.now()
      };

      localStorage.setItem('postureCalibration', JSON.stringify(dataToSave));
      console.log('💾 Calibration saved to localStorage');
      return true;
    } catch (error) {
      console.error('Failed to save calibration:', error);
      return false;
    }
  }

  /**
   * Load calibration from localStorage
   */
  loadCalibration(userId = 'default') {
    try {
      const saved = localStorage.getItem('postureCalibration');
      if (!saved) {
        console.log('No saved calibration found');
        return false;
      }

      const data = JSON.parse(saved);
      
      if (data.userId !== userId) {
        console.log('Calibration belongs to different user');
        return false;
      }

      this.calibrationData = data;
      console.log('✅ Calibration loaded from localStorage');
      return true;
    } catch (error) {
      console.error('Failed to load calibration:', error);
      return false;
    }
  }

  /**
   * Check if calibration exists
   */
  hasCalibration() {
    return this.calibrationData && 
           this.calibrationData.goodPosture && 
           this.calibrationData.slouchedPosture;
  }

  /**
   * Get calibration data
   */
  getCalibrationData() {
    return this.calibrationData;
  }

  /**
   * Clear calibration
   */
  clearCalibration() {
    this.calibrationData = null;
    localStorage.removeItem('postureCalibration');
    console.log('🗑️ Calibration cleared');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PostureCalibrator;
}
