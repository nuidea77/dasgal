import { FeedbackKey } from './feedback';
import { Pose } from './types';

export type Phase = 'rest' | 'active' | 'unknown';

export interface AnalysisResult {
  phase: Phase;
  /** True on the single frame where a repetition was completed. */
  repCounted: boolean;
  reps: number;
  /** Form corrections that apply to this frame (may be empty). */
  feedback: FeedbackKey[];
  /** Primary metric (e.g. knee angle) — useful for debugging/overlay. */
  metric: number | null;
  /** Quality (0..1) of the most recently completed rep. */
  lastRepQuality: number;
  /** Accumulated hold time for isometric exercises, in seconds. */
  holdSeconds: number;
}

export interface ExerciseAnalyzer {
  process(pose: Pose | null): AnalysisResult;
  reset(): void;
}

export type FormCheck = {
  /** When the check applies. */
  when: 'always' | 'active' | 'rest';
  check: (pose: Pose) => FeedbackKey | null;
};

export interface AngleRepConfig {
  /** Returns the primary metric or null when the required joints are not visible enough. */
  metric: (pose: Pose) => number | null;
  /** Direction in which the metric moves when the athlete goes into the active position. */
  activeDirection: 'decreasing' | 'increasing';
  /** Metric crosses this value → athlete is in the active (bottom) position. */
  activeThreshold: number;
  /** Metric returns past this value → rep completes. */
  restThreshold: number;
  /** Optional: a dip that gets past this (but not the active threshold) is a "partial rep". */
  partialThreshold?: number;
  partialFeedback?: FeedbackKey;
  /** Ignore reps faster than this (ms) – guards against jitter. */
  minRepDurationMs?: number;
  /** If the athlete stays active longer than this (ms) we say "slow down"/"hold steady" is not needed; used to flag pauses. */
  formChecks?: FormCheck[];
  /** Number of consecutive frames the metric must satisfy a threshold before a transition. */
  confirmFrames?: number;
}

const EMPTY: AnalysisResult = {
  phase: 'unknown',
  repCounted: false,
  reps: 0,
  feedback: ['low_visibility'],
  metric: null,
  lastRepQuality: 0,
  holdSeconds: 0,
};

/**
 * Generic hysteresis based repetition counter.
 *
 * A rep is: rest → (metric passes activeThreshold) → active → (metric passes restThreshold) → rest.
 * Two thresholds create a dead-band so noisy landmarks cannot toggle the phase.
 */
export class AngleRepCounter implements ExerciseAnalyzer {
  private phase: Phase = 'unknown';
  private reps = 0;
  private lastRepQuality = 0;
  private activeSince = 0;
  private lastRepAt = 0;
  private extreme: number | null = null; // deepest metric value in the current cycle
  private dip: number | null = null; // deepest value while below rest but not yet active
  private confirmCounter = 0;
  private activeWarnings = new Set<FeedbackKey>();

  constructor(private readonly cfg: AngleRepConfig) {}

  reset(): void {
    this.phase = 'unknown';
    this.reps = 0;
    this.lastRepQuality = 0;
    this.activeSince = 0;
    this.lastRepAt = 0;
    this.extreme = null;
    this.dip = null;
    this.confirmCounter = 0;
    this.activeWarnings.clear();
  }

  private isPast(value: number, threshold: number): boolean {
    return this.cfg.activeDirection === 'decreasing' ? value <= threshold : value >= threshold;
  }

  private isBefore(value: number, threshold: number): boolean {
    return this.cfg.activeDirection === 'decreasing' ? value >= threshold : value <= threshold;
  }

  private deeper(a: number, b: number): number {
    return this.cfg.activeDirection === 'decreasing' ? Math.min(a, b) : Math.max(a, b);
  }

  process(pose: Pose | null): AnalysisResult {
    if (!pose) return { ...EMPTY, reps: this.reps, lastRepQuality: this.lastRepQuality };
    const metric = this.cfg.metric(pose);
    if (metric === null) {
      return { ...EMPTY, reps: this.reps, lastRepQuality: this.lastRepQuality, phase: this.phase };
    }

    const confirm = this.cfg.confirmFrames ?? 2;
    const minDuration = this.cfg.minRepDurationMs ?? 400;
    const feedback: FeedbackKey[] = [];
    let repCounted = false;

    if (this.phase === 'unknown') {
      // Wait until we see the rest position before counting anything.
      if (this.isBefore(metric, this.cfg.restThreshold)) {
        this.confirmCounter += 1;
        if (this.confirmCounter >= confirm) {
          this.phase = 'rest';
          this.confirmCounter = 0;
        }
      } else {
        this.confirmCounter = 0;
      }
    } else if (this.phase === 'rest') {
      if (this.isPast(metric, this.cfg.activeThreshold)) {
        this.confirmCounter += 1;
        if (this.confirmCounter >= confirm) {
          this.phase = 'active';
          this.activeSince = pose.timestamp;
          this.extreme = metric;
          this.dip = null;
          this.confirmCounter = 0;
          this.activeWarnings.clear();
        }
      } else {
        this.confirmCounter = 0;
        // Track partial movement: went past rest but not deep enough.
        if (!this.isBefore(metric, this.cfg.restThreshold)) {
          this.dip = this.dip === null ? metric : this.deeper(this.dip, metric);
        } else if (this.dip !== null) {
          // Came back up without reaching active → partial rep.
          const partial = this.cfg.partialThreshold;
          if (partial !== undefined && this.isPast(this.dip, partial) && this.cfg.partialFeedback) {
            feedback.push(this.cfg.partialFeedback);
          }
          this.dip = null;
        }
      }
    } else if (this.phase === 'active') {
      this.extreme = this.extreme === null ? metric : this.deeper(this.extreme, metric);
      if (this.isBefore(metric, this.cfg.restThreshold)) {
        this.confirmCounter += 1;
        if (this.confirmCounter >= confirm) {
          this.confirmCounter = 0;
          this.phase = 'rest';
          const duration = pose.timestamp - this.activeSince;
          if (duration >= minDuration && pose.timestamp - this.lastRepAt >= minDuration) {
            this.reps += 1;
            this.lastRepAt = pose.timestamp;
            repCounted = true;
            this.lastRepQuality = this.computeQuality();
            feedback.push(this.lastRepQuality >= 0.9 ? 'perfect' : 'good_rep');
          }
          this.extreme = null;
        }
      } else {
        this.confirmCounter = 0;
      }
    }

    // Form checks.
    for (const fc of this.cfg.formChecks ?? []) {
      if (fc.when !== 'always' && fc.when !== this.phase) continue;
      const key = fc.check(pose);
      if (key) {
        feedback.push(key);
        if (this.phase === 'active') this.activeWarnings.add(key);
      }
    }

    return {
      phase: this.phase,
      repCounted,
      reps: this.reps,
      feedback,
      metric,
      lastRepQuality: this.lastRepQuality,
      holdSeconds: 0,
    };
  }

  private computeQuality(): number {
    // Depth beyond the active threshold scales 0.7..1.0; each form warning costs 0.15.
    let q = 0.85;
    if (this.extreme !== null) {
      const range = Math.abs(this.cfg.restThreshold - this.cfg.activeThreshold) || 1;
      const beyond = Math.abs(this.extreme - this.cfg.activeThreshold) / range;
      q = 0.85 + Math.min(0.15, beyond * 0.6);
    }
    q -= this.activeWarnings.size * 0.15;
    return Math.max(0, Math.min(1, q));
  }
}

export interface HoldConfig {
  /** Returns true when the athlete is in the correct isometric position, null if not visible. */
  inPosition: (pose: Pose) => boolean | null;
  formChecks?: FormCheck[];
  /** Grace period (ms) a broken position is tolerated before the hold pauses. */
  graceMs?: number;
}

/** Isometric hold timer (plank, wall sit). Counts seconds only while form is correct. */
export class HoldAnalyzer implements ExerciseAnalyzer {
  private holdMs = 0;
  private lastTs: number | null = null;
  private brokenSince: number | null = null;
  private phase: Phase = 'unknown';

  constructor(private readonly cfg: HoldConfig) {}

  reset(): void {
    this.holdMs = 0;
    this.lastTs = null;
    this.brokenSince = null;
    this.phase = 'unknown';
  }

  process(pose: Pose | null): AnalysisResult {
    const base: AnalysisResult = {
      phase: this.phase,
      repCounted: false,
      reps: 0,
      feedback: [],
      metric: null,
      lastRepQuality: 1,
      holdSeconds: this.holdMs / 1000,
    };
    if (!pose) {
      this.lastTs = null;
      return { ...base, feedback: ['low_visibility'] };
    }
    const ok = this.cfg.inPosition(pose);
    if (ok === null) {
      this.lastTs = null;
      return { ...base, feedback: ['low_visibility'] };
    }
    const feedback: FeedbackKey[] = [];
    for (const fc of this.cfg.formChecks ?? []) {
      const key = fc.check(pose);
      if (key) feedback.push(key);
    }
    const grace = this.cfg.graceMs ?? 700;
    if (ok) {
      this.brokenSince = null;
      this.phase = 'active';
      if (this.lastTs !== null) this.holdMs += Math.max(0, pose.timestamp - this.lastTs);
    } else {
      if (this.brokenSince === null) this.brokenSince = pose.timestamp;
      if (pose.timestamp - this.brokenSince > grace) {
        this.phase = 'rest';
        if (feedback.length === 0) feedback.push('hold_steady');
      } else if (this.lastTs !== null) {
        this.holdMs += Math.max(0, pose.timestamp - this.lastTs);
      }
    }
    this.lastTs = pose.timestamp;
    return { ...base, phase: this.phase, feedback, holdSeconds: this.holdMs / 1000 };
  }
}
