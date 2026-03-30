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
    this.frameCount++;
    this.history.push(this.frameTime);
    if (this.history.length > 60) this.history.shift();

    // Track dropped frames (anything > 16.67ms causes frame skips)
    if (this.frameTime > this.maxFrameTime) {
      this.droppedFrames++;
      if (this.enabled) {
        console.warn(`⚠️ FRAME DROP: ${this.frameTime.toFixed(2)}ms (${(1000 / this.frameTime).toFixed(1)} fps actual)`);
      }
    } else if (this.frameTime > this.warningThreshold && this.enabled) {
      console.debug(`⏱️ Frame: ${this.frameTime.toFixed(2)}ms`);
    }

    // Calculate FPS every second
    if (this.frameEnd - this.lastSecond >= 1000) {
      const avgFrameTime = this.history.reduce((a, b) => a + b, 0) / this.history.length;
      this.fps = 1000 / avgFrameTime;
      this.lastSecond = this.frameEnd;
      
      if (this.enabled && this.frameCount % 60 === 0) {
        console.log(`📊 Avg FPS: ${this.fps.toFixed(1)} | Dropped: ${this.droppedFrames} | Avg frame: ${avgFrameTime.toFixed(2)}ms`);
      }
    }

    return this.frameTime;
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