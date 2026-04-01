/**
 * PerformanceManager: 60fps game loop optimizer
 * Measures frame times and warns when exceeding 16.67ms budget
 */
export class PerformanceManager {
  constructor() {
    this.frameStart = 0;
    this.frameEnd = 0;
    this.frameTime = 0; // milliseconds
    this.fps = 60;
    this.frameCount = 0;
    this.lastSecond = performance.now();
    this.lastRafTs = 0;
    this.droppedFrames = 0;
    this.maxFrameTime = 16.67; // 60fps budget in ms
    // Keep disabled by default to avoid console overhead affecting FPS.
    this.enabled = false;
    this.history = []; // Last 60 frame times for analysis
    this.warningThreshold = 14; // Warn if frame takes > 14ms (leaving margin)
  }

  /**
   * Call at START of game loop frame
   */
  measureFrameStart() {
    if (!this.enabled) return;
    this.frameStart = performance.now();
  }

  /**
   * Call at END of game loop frame
   * Returns frame time in milliseconds
   */
  measureFrameEnd() {
    if (!this.enabled) return 0;
    this.frameEnd = performance.now();
    this.frameTime = this.frameEnd - this.frameStart;
    // This method tracks JS update cost only.
    // FPS cadence and dropped-frame accounting are handled by measureRafFrame().
    if (this.frameTime > this.warningThreshold && this.enabled) {
      console.debug(`⏱️ Update cost: ${this.frameTime.toFixed(2)}ms`);
    }

    return this.frameTime;
  }

  /**
   * Measure actual frame cadence from requestAnimationFrame timestamps.
   * This reports display-paced FPS, not just JS update cost.
   */
  measureRafFrame(rafTimestamp) {
    if (!this.enabled) return 0;
    if (!this.lastRafTs) {
      this.lastRafTs = rafTimestamp;
      return 0;
    }

    const delta = rafTimestamp - this.lastRafTs;
    this.lastRafTs = rafTimestamp;
    if (delta <= 0) return 0;

    this.frameCount++;
    this.history.push(delta);
    if (this.history.length > 60) this.history.shift();

    if (delta > this.maxFrameTime) {
      this.droppedFrames++;
    }

    if (rafTimestamp - this.lastSecond >= 1000) {
      const avgFrameTime = this.history.reduce((a, b) => a + b, 0) / this.history.length;
      // Clamp very high values caused by tiny samples or focus transitions.
      this.fps = Math.min(240, 1000 / avgFrameTime);
      this.lastSecond = rafTimestamp;
    }

    return delta;
  }

  /**
   * Get current frame time
   */
  getFrameTime() {
    return this.frameTime;
  }

  /**
   * Get average FPS
   */
  getFPS() {
    return this.fps;
  }

  /**
   * Get dropped frame count
   */
  getDroppedFrames() {
    return this.droppedFrames;
  }

  /**
   * Toggle logging
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  isEnabled() {
    return !!this.enabled;
  }

  /**
   * Reset stats
   */
  reset() {
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.history = [];
    this.lastRafTs = 0;
  }
}

export const performanceManager = new PerformanceManager();

// Optional runtime toggle for profiling sessions only.
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const flag = window.localStorage.getItem('mp_perf_debug');
    if (flag === '1' || flag === 'true') {
      performanceManager.setEnabled(true);
    }
  }
} catch (e) {
  // ignore storage access issues
}