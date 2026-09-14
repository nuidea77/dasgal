import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { DailyHealthTotals, health } from './index';

/**
 * Today's steps and active energy as the OS health app sees them — across every
 * app, not just Dasgal. Null while sync is off or nothing is readable.
 */
export function useHealthToday(): DailyHealthTotals | null {
  const enabled = useSettingsStore((s) => s.healthSyncEnabled);
  const [totals, setTotals] = useState<DailyHealthTotals | null>(null);

  useEffect(() => {
    if (!enabled) {
      setTotals(null);
      return;
    }
    let alive = true;
    void health.readDay(new Date()).then((t) => {
      if (alive) setTotals(t);
    });
    return () => {
      alive = false;
    };
  }, [enabled]);

  return totals;
}
