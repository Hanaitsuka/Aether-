/**
 * CALIBRATED POSTURE MONITOR - THE PROPER VERSION!
 * Uses your personal calibration to detect slouching accurately
 */

class CalibratedPostureMonitor {
  constructor(calibrator) {
    this.calibrator = calibrator;
    this.isMonitoring = false;
    
    // Session tracking
    this.sessionStartTime = null;
    this.driftCheckInterval = 3 * 60 * 1000; // 3 minutes
    this.lastDriftCheck = null;
    
    // Slouch detection - BALANCED settings
    this.slouchFrames = 0;
    this.goodPostureFrames = 0;
    this.requiredSlouchFrames = 100; // 15 seconds at 10fps
    this.requiredGoodFrames = 10; // 2.5 seconds to dismiss alert
    this.isCurrentlySlouched = false;
    
    // Callbacks
    this.onSlouchDetected = null;
    this.onPostureCorrected = null;
    
    // Stats
    this.stats = {
      totalFrames: 0,
      slouchFrames: 0,
      goodFrames: 0,
      alerts: 0
    };

    console.log('📏 Calibrated Monitor initialized - needs calibration to work!');
  }

  /**
   * Start monitoring
   */
  start() {
    // Check if calibrated
    if (!this.calibrator.hasCalibration()) {
      console.error('❌ Cannot start monitoring - no calibration data!');
      return false;
    }

    this.isMonitoring = true;
    this.sessionStartTime = Date.now();
    this.lastDriftCheck = Date.now();
    this.slouchFrames = 0;
    this.goodPostureFrames = 0;
    this.isCurrentlySlouched = false;
    this.stats = {
      totalFrames: 0,
      slouchFrames: 0,
      goodFrames: 0,
      alerts: 0
    };
    
    console.log('👁️ Monitoring started with calibration - 15 second buffer active!');
    return true;
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.isMonitoring = false;
    console.log('🛑 Monitoring stopped');
  }

  /**
   * Process each frame
   */
  processFrame(metrics) {
    if (!this.isMonitoring || !metrics) return null;

    this.stats.totalFrames++;

    // Compare current posture to calibration
    const postureAnalysis = this.analyzePostureVsCalibration(metrics);

    if (postureAnalysis.isSlouching) {
      // SLOUCHING DETECTED
      this.slouchFrames++;
      this.goodPostureFrames = 0; // Reset good counter
      this.stats.slouchFrames++;
      
      // Alert after 15 seconds of slouching
      if (this.slouchFrames >= this.requiredSlouchFrames && !this.isCurrentlySlouched) {
        this.isCurrentlySlouched = true;
        this.stats.alerts++;
        
        console.log(`🚨 SLOUCH ALERT after ${(this.slouchFrames/10).toFixed(1)}s`);
        
        if (this.onSlouchDetected) {
          this.onSlouchDetected({
            reason: postureAnalysis.issues.join(', '),
            severity: postureAnalysis.severity,
            duration: this.slouchFrames / 10,
            deviation: postureAnalysis.totalDeviation
          });
        }
      }
    } else {
      // GOOD POSTURE DETECTED
      this.slouchFrames = 0; // Reset slouch counter
      this.goodPostureFrames++;
      this.stats.goodFrames++;
      
      // Dismiss alert after 2.5 seconds of good posture
      if (this.isCurrentlySlouched && this.goodPostureFrames >= this.requiredGoodFrames) {
        this.isCurrentlySlouched = false;
        
        console.log(`✅ POSTURE CORRECTED after ${(this.goodPostureFrames/10).toFixed(1)}s`);
        
        if (this.onPostureCorrected) {
          this.onPostureCorrected();
        }
      }
    }

    // 3-minute check
    const timeSinceLastCheck = Date.now() - this.lastDriftCheck;
    if (timeSinceLastCheck >= this.driftCheckInterval) {
      this.perform3MinCheck(postureAnalysis);
      this.lastDriftCheck = Date.now();
    }

    return postureAnalysis;
  }

  /**
   * Analyze posture by comparing to calibrated good/bad posture
   */
  analyzePostureVsCalibration(currentMetrics) {
    const calibration = this.calibrator.getCalibrationData();
    const goodPosture = calibration.goodPosture;
    const badPosture = calibration.slouchedPosture;

    let issues = [];
    let totalDeviation = 0;

    // === 1. HEAD-SHOULDER RATIO ===
    // Compare to good posture baseline
    const headShoulderDiff = Math.abs(
      currentMetrics.headShoulderRatio - goodPosture.headShoulderRatio
    );
    const headShoulderThreshold = goodPosture.headShoulderRatio * 0.20; // 20% tolerance

    if (headShoulderDiff > headShoulderThreshold) {
      issues.push('forward head posture');
      totalDeviation += (headShoulderDiff / headShoulderThreshold) * 30;
    }

    // === 2. SHOULDER ASYMMETRY ===
    const shoulderAsymDiff = Math.abs(
      currentMetrics.shoulderAsymmetry - goodPosture.shoulderAsymmetry
    );
    const shoulderThreshold = goodPosture.shoulderAsymmetry + 0.05; // Allow 5% more asymmetry

    if (currentMetrics.shoulderAsymmetry > shoulderThreshold) {
      issues.push('uneven shoulders');
      totalDeviation += (shoulderAsymDiff / (shoulderThreshold + 0.01)) * 20;
    }

    // === 3. TORSO ANGLE ===
    const torsoAngleDiff = Math.abs(currentMetrics.torsoAngle - goodPosture.torsoAngle);
    const torsoThreshold = 18; // Allow 18 degrees of deviation

    if (torsoAngleDiff > torsoThreshold) {
      issues.push('hunched spine');
      totalDeviation += (torsoAngleDiff / torsoThreshold) * 25;
    }

    // === 4. NECK ANGLE ===
    const neckAngleDiff = Math.abs(currentMetrics.neckAngle - goodPosture.neckAngle);
    const neckThreshold = 20; // Allow 20 degrees of neck movement

    if (neckAngleDiff > neckThreshold) {
      issues.push('head tilted down');
      totalDeviation += (neckAngleDiff / neckThreshold) * 20;
    }

    // === 5. FORWARD LEAN ===
    const forwardLeanDiff = Math.abs(currentMetrics.forwardLean - goodPosture.forwardLean);
    const leanThreshold = goodPosture.forwardLean * 0.30; // 30% tolerance

    if (forwardLeanDiff > leanThreshold) {
      issues.push('leaning into screen');
      totalDeviation += (forwardLeanDiff / (leanThreshold + 0.01)) * 15;
    }

    // === OVERALL ASSESSMENT ===
    // Need at least 2 issues OR total deviation > 35
    const isSlouching = (issues.length >= 2) || (totalDeviation > 35);

    // Calculate severity
    let severity = 'mild';
    if (totalDeviation > 60) severity = 'severe';
    else if (totalDeviation > 40) severity = 'moderate';

    return {
      isSlouching,
      issues,
      severity,
      totalDeviation: totalDeviation.toFixed(1),
      currentMetrics: {
        headShoulder: currentMetrics.headShoulderRatio.toFixed(3),
        shoulders: currentMetrics.shoulderAsymmetry.toFixed(3),
        torso: currentMetrics.torsoAngle.toFixed(1) + '°',
        neck: currentMetrics.neckAngle.toFixed(1) + '°',
        lean: currentMetrics.forwardLean.toFixed(3)
      }
    };
  }

  /**
   * 3-minute check
   */
  perform3MinCheck(analysis) {
    console.log('🔍 3-min posture check:', {
      status: analysis.isSlouching ? 'SLOUCHING' : 'GOOD',
      issues: analysis.issues,
      deviation: analysis.totalDeviation
    });
  }

  /**
   * Set callbacks
   */
  onSlouch(callback) {
    this.onSlouchDetected = callback;
  }

  onCorrection(callback) {
    this.onPostureCorrected = callback;
  }

  /**
   * Get stats
   */
  getStats() {
    const sessionDuration = this.sessionStartTime 
      ? Math.floor((Date.now() - this.sessionStartTime) / 1000 / 60) 
      : 0;

    const postureQuality = this.stats.totalFrames > 0
      ? ((this.stats.goodFrames / this.stats.totalFrames) * 100).toFixed(1)
      : 0;

    return {
      sessionDuration: `${sessionDuration} minutes`,
      postureQuality: `${postureQuality}%`,
      totalAlerts: this.stats.alerts,
      currentState: this.isCurrentlySlouched ? 'SLOUCHED' : 'GOOD'
    };
  }

  /**
   * Reset session
   */
  resetSession() {
    this.lastDriftCheck = Date.now();
    this.slouchFrames = 0;
    this.goodPostureFrames = 0;
    this.isCurrentlySlouched = false;
    console.log('🔄 Session reset');
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalibratedPostureMonitor;
}

/**
 * ========================================
 * CUSTOMIZATION GUIDE:
 * ========================================
 * 
 * SLOUCH DETECTION TIMING:
 * Line 22: requiredSlouchFrames = 150 (15 seconds)
 *   - Change to 100 for 10 seconds
 *   - Change to 200 for 20 seconds
 * 
 * ALERT DISMISSAL:
 * Line 23: requiredGoodFrames = 25 (2.5 seconds)
 *   - Change to 20 for 2 seconds (easier)
 *   - Change to 30 for 3 seconds (stricter)
 * 
 * SENSITIVITY:
 * Line 137: headShoulderThreshold (20% tolerance)
 *   - Lower = stricter (e.g., 0.15 = 15%)
 *   - Higher = more forgiving (e.g., 0.25 = 25%)
 * 
 * Line 161: torsoThreshold = 18 degrees
 *   - Lower = stricter (e.g., 15)
 *   - Higher = more forgiving (e.g., 22)
 * 
 * Line 195: isSlouching criteria
 *   - Currently: 2 issues OR deviation > 35
 *   - Stricter: 2 issues OR deviation > 30
 *   - More forgiving: 2 issues AND deviation > 40
 */
