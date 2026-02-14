/**
 * POSTURE MONITOR MODULE
 * Real-time posture monitoring with two detection strategies
 */

class PostureMonitor {
  constructor(calibrator) {
    this.calibrator = calibrator;
    this.isMonitoring = false;
    this.detectionStrategy = 'both'; // 'ratio', 'drift', or 'both'
    
    // Drift detection
    this.sessionBaseline = null;
    this.driftCheckInterval = 3 * 60 * 1000; // 3 minutes in milliseconds
    this.lastDriftCheck = null;
    this.driftHistory = [];
    
    // Slouch detection
    this.slouchFrames = 0;
    this.requiredSlouchFrames = 30; // 3 seconds at 10fps
    this.isCurrentlySlouched = false;
    
    // Callbacks
    this.onSlouchDetected = null;
    this.onPostureCorrected = null;
    this.onDriftDetected = null;
    
    // Stats
    this.stats = {
      totalFrames: 0,
      slouchFrames: 0,
      goodFrames: 0,
      alerts: 0
    };
  }

  /**
   * Start monitoring posture
   */
  start(detectionStrategy = 'both') {
    this.isMonitoring = true;
    this.detectionStrategy = detectionStrategy;
    this.sessionBaseline = null;
    this.lastDriftCheck = Date.now();
    this.stats = { totalFrames: 0, slouchFrames: 0, goodFrames: 0, alerts: 0 };
    
    console.log(`👁️ Posture monitoring started (strategy: ${detectionStrategy})`);
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.isMonitoring = false;
    console.log('🛑 Posture monitoring stopped');
    console.log('📊 Session stats:', this.stats);
  }

  /**
   * Process a frame and check for poor posture
   */
  processFrame(metrics) {
    if (!this.isMonitoring || !metrics) return null;

    this.stats.totalFrames++;

    // Set session baseline on first frame
    if (!this.sessionBaseline) {
      this.sessionBaseline = { ...metrics };
      console.log('📍 Session baseline set:', this.sessionBaseline);
    }

    let result = {
      isSlouching: false,
      reason: null,
      metrics: metrics,
      detectionMethod: null
    };

    // STRATEGY 1: Ratio-based detection (compare to calibration)
    if (this.detectionStrategy === 'ratio' || this.detectionStrategy === 'both') {
      const ratioResult = this.checkRatioBasedPosture(metrics);
      if (ratioResult.isSlouching) {
        result = ratioResult;
      }
    }

    // STRATEGY 2: Drift detection (compare to session start)
    if (this.detectionStrategy === 'drift' || this.detectionStrategy === 'both') {
      const driftResult = this.checkDriftBasedPosture(metrics);
      if (driftResult.isDrifting) {
        // If not already slouching from ratio check, mark as drift alert
        if (!result.isSlouching) {
          result.isSlouching = true;
          result.reason = driftResult.reason;
          result.detectionMethod = 'drift';
        }
      }
    }

    // Track consecutive slouch frames
    if (result.isSlouching) {
      this.slouchFrames++;
      this.stats.slouchFrames++;
      
      // Trigger alert after consecutive slouch frames
      if (this.slouchFrames >= this.requiredSlouchFrames && !this.isCurrentlySlouched) {
        this.isCurrentlySlouched = true;
        this.stats.alerts++;
        
        if (this.onSlouchDetected) {
          this.onSlouchDetected({
            reason: result.reason,
            method: result.detectionMethod,
            metrics: result.metrics
          });
        }
      }
    } else {
      // Good posture detected
      this.stats.goodFrames++;
      
      if (this.slouchFrames > 0) {
        this.slouchFrames = 0;
      }
      
      if (this.isCurrentlySlouched) {
        this.isCurrentlySlouched = false;
        
        if (this.onPostureCorrected) {
          this.onPostureCorrected();
        }
      }
    }

    // Periodic drift check (every 3 minutes)
    const timeSinceLastCheck = Date.now() - this.lastDriftCheck;
    if (timeSinceLastCheck >= this.driftCheckInterval) {
      this.performPeriodicDriftCheck(metrics);
      this.lastDriftCheck = Date.now();
    }

    return result;
  }

  /**
   * STRATEGY 1: Ratio-based posture detection
   * Compares current metrics to calibrated good/bad posture
   */
  checkRatioBasedPosture(currentMetrics) {
    const calibration = this.calibrator.getCalibrationData();
    
    if (!calibration || !calibration.goodPosture) {
      return { isSlouching: false, reason: 'No calibration data' };
    }

    const good = calibration.goodPosture;
    const bad = calibration.slouchedPosture;
    
    // Calculate how close current posture is to good vs bad
    let slouchIndicators = [];

    // 1. Head-shoulder ratio check (most important)
    const headShoulderDiff = Math.abs(currentMetrics.headShoulderRatio - good.headShoulderRatio);
    const headShoulderTolerance = good.headShoulderRatio * 0.15; // 15% tolerance
    
    if (headShoulderDiff > headShoulderTolerance) {
      slouchIndicators.push('forward head posture');
    }

    // 2. Shoulder asymmetry check
    if (currentMetrics.shoulderAsymmetry > good.shoulderAsymmetry * 1.5) {
      slouchIndicators.push('uneven shoulders');
    }

    // 3. Torso angle check
    const torsoAngleDiff = Math.abs(currentMetrics.torsoAngle - good.torsoAngle);
    if (torsoAngleDiff > 15) { // 15 degree tolerance
      slouchIndicators.push('poor spine alignment');
    }

    // 4. Forward lean check
    if (currentMetrics.forwardLean > good.forwardLean * 1.3) {
      slouchIndicators.push('leaning forward');
    }

    const isSlouching = slouchIndicators.length >= 2; // Need at least 2 indicators

    return {
      isSlouching,
      reason: isSlouching ? slouchIndicators.join(', ') : null,
      detectionMethod: 'ratio',
      indicators: slouchIndicators
    };
  }

  /**
   * STRATEGY 2: Drift-based posture detection
   * Detects gradual deterioration from session start
   */
  checkDriftBasedPosture(currentMetrics) {
    if (!this.sessionBaseline) {
      return { isDrifting: false };
    }

    const baseline = this.sessionBaseline;
    let driftIndicators = [];

    // Calculate percentage change from baseline
    const headShoulderDrift = 
      ((currentMetrics.headShoulderRatio - baseline.headShoulderRatio) / baseline.headShoulderRatio) * 100;
    
    const shoulderAsymmetryDrift = 
      ((currentMetrics.shoulderAsymmetry - baseline.shoulderAsymmetry) / (baseline.shoulderAsymmetry + 0.01)) * 100;
    
    const forwardLeanDrift = 
      ((currentMetrics.forwardLean - baseline.forwardLean) / (baseline.forwardLean + 0.01)) * 100;

    // Check for significant drift (>20% change)
    if (Math.abs(headShoulderDrift) > 20) {
      driftIndicators.push(`head position drifted ${headShoulderDrift.toFixed(1)}%`);
    }

    if (shoulderAsymmetryDrift > 25) {
      driftIndicators.push('shoulders became uneven');
    }

    if (forwardLeanDrift > 25) {
      driftIndicators.push('increased forward lean');
    }

    const isDrifting = driftIndicators.length >= 1;

    return {
      isDrifting,
      reason: isDrifting ? driftIndicators.join(', ') : null,
      driftPercentages: {
        headShoulder: headShoulderDrift,
        shoulderAsymmetry: shoulderAsymmetryDrift,
        forwardLean: forwardLeanDrift
      }
    };
  }

  /**
   * Periodic drift check (every 3 minutes)
   */
  performPeriodicDriftCheck(currentMetrics) {
    const driftResult = this.checkDriftBasedPosture(currentMetrics);
    
    this.driftHistory.push({
      timestamp: Date.now(),
      isDrifting: driftResult.isDrifting,
      reason: driftResult.reason,
      metrics: { ...currentMetrics }
    });

    // Keep only last 10 drift checks
    if (this.driftHistory.length > 10) {
      this.driftHistory.shift();
    }

    if (driftResult.isDrifting && this.onDriftDetected) {
      this.onDriftDetected({
        reason: driftResult.reason,
        driftPercentages: driftResult.driftPercentages,
        timestamp: Date.now()
      });
    }

    console.log('🔍 Periodic drift check:', driftResult);
  }

  /**
   * Set callback for slouch detection
   */
  onSlouch(callback) {
    this.onSlouchDetected = callback;
  }

  /**
   * Set callback for posture correction
   */
  onCorrection(callback) {
    this.onPostureCorrected = callback;
  }

  /**
   * Set callback for drift detection
   */
  onDrift(callback) {
    this.onDriftDetected = callback;
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    const postureQualityScore = this.stats.totalFrames > 0
      ? ((this.stats.goodFrames / this.stats.totalFrames) * 100).toFixed(1)
      : 0;

    return {
      ...this.stats,
      postureQualityScore: `${postureQualityScore}%`,
      currentState: this.isCurrentlySlouched ? 'slouched' : 'good',
      driftHistory: this.driftHistory
    };
  }

  /**
   * Reset session (useful when user takes a break and returns)
   */
  resetSession() {
    this.sessionBaseline = null;
    this.lastDriftCheck = Date.now();
    this.slouchFrames = 0;
    this.isCurrentlySlouched = false;
    console.log('🔄 Session reset');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PostureMonitor;
}
