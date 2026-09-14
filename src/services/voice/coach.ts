import * as Speech from 'expo-speech';
import { FeedbackKey } from '@/domain/pose/feedback';
import { dict, format, speechLocale, useI18nStore } from '@/i18n';
import { useSettingsStore } from '@/store/useSettingsStore';

type Priority = 'low' | 'normal' | 'high';

/**
 * Voice coach with throttling so corrections do not stack up while the user moves.
 * - Each feedback key is repeated at most every `cooldownMs`.
 * - High-priority phrases (countdown, rest) interrupt anything queued.
 */
class VoiceCoach {
  private lastSpokenAt = new Map<string, number>();
  private lastAnyAt = 0;
  private cooldownMs = 3500;
  private minGapMs = 1200;

  private enabled(): boolean {
    return useSettingsStore.getState().voiceEnabled;
  }

  private locale(): string {
    return speechLocale(useI18nStore.getState().language);
  }

  speak(text: string, priority: Priority = 'normal', key = text): void {
    if (!this.enabled() || !text) return;
    const now = Date.now();
    if (priority !== 'high') {
      const last = this.lastSpokenAt.get(key) ?? 0;
      if (now - last < this.cooldownMs) return;
      if (now - this.lastAnyAt < this.minGapMs) return;
    } else {
      Speech.stop();
    }
    this.lastSpokenAt.set(key, now);
    this.lastAnyAt = now;
    Speech.speak(text, { language: this.locale(), rate: 1.0, pitch: 1.0 });
  }

  feedback(key: FeedbackKey): void {
    const t = dict();
    // Positive acknowledgements are low priority and short-cooldown; corrections are normal.
    if (key === 'good_rep' || key === 'perfect') {
      this.speak(t.feedback[key], 'low', key);
      return;
    }
    this.speak(t.feedback[key], 'normal', key);
  }

  countRep(n: number): void {
    if (!this.enabled()) return;
    // Numbers are spoken immediately (no cooldown) so every rep is acknowledged.
    Speech.stop();
    this.lastAnyAt = Date.now();
    Speech.speak(String(n), { language: this.locale(), rate: 1.15 });
  }

  restStart(seconds: number): void {
    this.speak(format(dict().voice.restStart, { seconds }), 'high', 'rest_start');
  }

  restEnd(): void {
    this.speak(dict().voice.restEnd, 'high', 'rest_end');
  }

  countdown(n: 3 | 2 | 1): void {
    const t = dict().voice;
    this.speak(n === 3 ? t.countdown3 : n === 2 ? t.countdown2 : t.countdown1, 'high', `cd${n}`);
  }

  go(): void {
    this.speak(dict().voice.go, 'high', 'go');
  }

  setDone(): void {
    this.speak(dict().voice.setDone, 'high', 'set_done');
  }

  workoutDone(): void {
    this.speak(dict().voice.workoutDone, 'high', 'workout_done');
  }

  stop(): void {
    Speech.stop();
  }
}

export const voiceCoach = new VoiceCoach();
