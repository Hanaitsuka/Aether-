/**
 * BALANCED POSTURE MONITOR
 * Detects sustained bad posture while allowing natural movement
 */

class BalancedPostureMonitor {
  constructor(calibrator) {
    this.calibrator = calibrator;
    this.isMonitoring = false;
    
    // Session tracking
    this.sessionBaseline = null;
    this.driftCheckInterval = 3 * 60 * 1000; // 3 minutes
    this.lastDriftCheck = null;
    
    // RELAXED slouch detection - 15 SECOND THRESHOLD!
    this.slouchFrames = 0;
    this.goodPostureFrames = 0;
    this.requiredSlouchFrames = 60; // 15 seconds at 10fps - PLENTY of breathing room!
    this.requiredGoodFrames = 12; // Need 3 seconds of good posture to dismiss alert
    this.isCurrentlySlouched = false;
    
    // Callbacks
    this.onSlouchDetected = null;
    this.onPostureCorrected = null;
    
    // Stats
    this.stats = {
      totalFrames: 0,
      slouchFrames: 0,
      goodFrames: 0,
      alerts: 0,
      sessionStartTime: null
    };

    console.log('🎯 Balanced Monitor initialized: 15-second slouch threshold');
  }

  /**
   * Start monitoring
   */
  start() {
    this.isMonitoring = true;
    this.sessionBaseline = null;
    this.lastDriftCheck = Date.now();
    this.stats.sessionStartTime = Date.now();
    this.slouchFrames = 0;
    this.goodPostureFrames = 0;
    this.isCurrentlySlouched = false;
    
    console.log('👁️ Monitoring started - you have 15 seconds of slouch time before alert!');
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

    // Set baseline on first frame
    if (!this.sessionBaseline) {
      this.sessionBaseline = { ...metrics };
      console.log('📍 Baseline set - you can move naturally!');
      return { isSlouching: false, reason: 'Setting baseline' };
    }

    // Check if currently slouching
    const slouchResult = this.detectSlouch(metrics);

    if (slouchResult.isSlouching) {
      // SLOUCHING DETECTED
      this.slouchFrames++;
      this.goodPostureFrames = 0; // Reset good posture counter
      this.stats.slouchFrames++;
      
      // Only alert after 15 CONSECUTIVE seconds of slouching
      if (this.slouchFrames >= this.requiredSlouchFrames && !this.isCurrentlySlouched) {
        this.isCurrentlySlouched = true;
        this.stats.alerts++;
        
        console.log(`🚨 SUSTAINED SLOUCH DETECTED after ${this.slouchFrames/10} seconds`);
        
        if (this.onSlouchDetected) {
          this.onSlouchDetected({
            reason: slouchResult.reason,
            severity: slouchResult.severity,
            duration: this.slouchFrames / 10,
            metrics: metrics
          });
        }
      }
    } else {
      // GOOD POSTURE DETECTED
      this.slouchFrames = 0; // Reset slouch counter
      this.goodPostureFrames++;
      this.stats.goodFrames++;
      
      // If alert is showing, need 3 seconds of good posture to dismiss
      if (this.isCurrentlySlouched && this.goodPostureFrames >= this.requiredGoodFrames) {
        this.isCurrentlySlouched = false;
        
        console.log(`✅ POSTURE CORRECTED after ${this.goodPostureFrames/10} seconds of good posture`);
        
        if (this.onPostureCorrected) {
          this.onPostureCorrected();
        }
      }
    }

    // 3-minute drift check
    const timeSinceLastCheck = Date.now() - this.lastDriftCheck;
    if (timeSinceLastCheck >= this.driftCheckInterval) {
      this.performDriftCheck(metrics);
      this.lastDriftCheck = Date.now();
    }

    return slouchResult;
  }

  /**
   * BALANCED slouch detection - allows natural movement!
   */
  detectSlouch(currentMetrics) {
    const baseline = this.sessionBaseline;
    let slouchIndicators = [];
    let totalDeviation = 0;

    // 1. HEAD-SHOULDER RATIO - relaxed threshold
    const headShoulderChange = 
      ((currentMetrics.headShoulderRatio - baseline.headShoulderRatio) / baseline.headShoulderRatio) * 100;
    
    // RELAXED: Only alert if head drifted forward by more than 25% (was 12% - way too strict!)
    if (headShoulderChange > 25) {
      slouchIndicators.push(`head forward`);
      totalDeviation += headShoulderChange;
    }

    // 2. SHOULDER ASYMMETRY - very relaxed
    const shoulderAsymmetryChange = 
      ((currentMetrics.shoulderAsymmetry - baseline.shoulderAsymmetry) / (baseline.shoulderAsymmetry + 0.01)) * 100;
    
    // RELAXED: Only care if really leaning to one side
    if (shoulderAsymmetryChange > 40) {
      slouchIndicators.push('leaning heavily to one side');
      totalDeviation += shoulderAsymmetryChange / 2;
    }

    // 3. TORSO ANGLE - relaxed
    const torsoAngleChange = Math.abs(currentMetrics.torsoAngle - baseline.torsoAngle);
    
    // RELAXED: Allow up to 20 degrees of spine movement
    if (torsoAngleChange > 20) {
      slouchIndicators.push('hunched over');
      totalDeviation += torsoAngleChange;
    }

    // 4. FORWARD LEAN - relaxed
    const forwardLeanChange = 
      ((currentMetrics.forwardLean - baseline.forwardLean) / (baseline.forwardLean + 0.01)) * 100;
    
    // RELAXED: Only alert if really leaning into screen
    if (forwardLeanChange > 35) {
      slouchIndicators.push('leaning into screen');
      totalDeviation += forwardLeanChange;
    }

    // 5. NECK ANGLE - relaxed
    const neckAngleChange = Math.abs(currentMetrics.neckAngle - baseline.neckAngle);
    
    // RELAXED: Allow significant head movement
    if (neckAngleChange > 25) {
      slouchIndicators.push('head tilted down');
      totalDeviation += neckAngleChange;
    }

    // RELAXED CRITERIA: Need 2 indicators AND significant total deviation
    // This prevents false positives from small movements
    const isSlouching = slouchIndicators.length >= 2 && totalDeviation > 40;

    // Calculate severity
    let severity = 'mild';
    if (totalDeviation > 80) severity = 'severe';
    else if (totalDeviation > 60) severity = 'moderate';

    return {
      isSlouching,
      reason: isSlouching ? slouchIndicators.join(', ') : null,
      severity,
      deviation: totalDeviation,
      slouchFrameCount: this.slouchFrames,
      goodFrameCount: this.goodPostureFrames
    };
  }

  /**
   * 3-minute periodic check
   */
  performDriftCheck(currentMetrics) {
    const driftResult = this.detectSlouch(currentMetrics);
    
    console.log('🔍 3-min check:', {
      isDrifting: driftResult.isSlouching,
      severity: driftResult.severity,
      deviation: driftResult.deviation.toFixed(1) + '%'
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
    const sessionDuration = this.stats.sessionStartTime 
      ? Math.floor((Date.now() - this.stats.sessionStartTime) / 1000 / 60) 
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
    this.sessionBaseline = null;
    this.lastDriftCheck = Date.now();
    this.slouchFrames = 0;
    this.goodPostureFrames = 0;
    this.isCurrentlySlouched = false;
    console.log('🔄 Session reset');
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BalancedPostureMonitor;
}

/**
 * CUSTOMIZATION GUIDE FOR YOU AND YOUR FRIEND:
 * 
 * To make it MORE strict (catch slouching faster):
 * - Line 22: Change 150 to smaller number (e.g., 100 = 10 seconds)
 * - Line 68: Change 25 to smaller number (e.g., 20 = 20% head drift)
 * - Line 142: Change 40 to smaller number (e.g., 30 = less total deviation needed)
 * 
 * To make it LESS strict (more forgiving):
 * - Line 22: Change 150 to bigger number (e.g., 200 = 20 seconds)
 * - Line 68: Change 25 to bigger number (e.g., 30 = 30% head drift allowed)
 * - Line 142: Change 40 to bigger number (e.g., 50 = more total deviation needed)
 * 
 * Key numbers to tweak:
 * - requiredSlouchFrames (line 22): How many seconds of slouching before alert
 * - requiredGoodFrames (line 23): How many seconds of good posture to dismiss alert
 * - Head threshold (line 68): Most important - controls head-forward detection
 * - Total deviation (line 142): Overall sensitivity
 */
