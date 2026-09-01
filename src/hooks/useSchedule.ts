import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getWindowDays,
  toISODate,
  SchedulePayload,
  DaySlots,
  DAY_KEY_PREFIX,
  LUNCH_CONFIG_KEY,
  LunchConfigByWeekday,
  LunchConfig,
  WINDOW_SIZE,
  DEFAULT_LUNCH,
} from "../lib/schedule";
import { loadDay, saveDay, loadLunchConfig, saveLunchConfig } from "../lib/storage";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Owns the five-day window currently on screen and the per-weekday lunch
 * configuration. The window is centred on the selected date, so it can start
 * mid-week and can include weekends; bookings are stored per calendar date.
 */
export function useSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday);
  const [lunchConfig, setLunchConfig] = useState<LunchConfigByWeekday>(() =>
    loadLunchConfig()
  );

  const days = useMemo(() => getWindowDays(selectedDate), [selectedDate]);
  const dayKeys = useMemo(() => days.map(toISODate), [days]);
  // Stable primitive for effect deps — `days` is a fresh array each render.
  const windowId = dayKeys.join("|");

  const [payload, setPayload] = useState<SchedulePayload>({});

  // Load the visible dates whenever the window moves.
  useEffect(() => {
    const next: SchedulePayload = {};
    for (const iso of windowId.split("|")) {
      next[iso] = loadDay(iso);
    }
    setPayload(next);
  }, [windowId]);

  // Cross-tab sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === LUNCH_CONFIG_KEY) {
        setLunchConfig(loadLunchConfig());
      } else if (e.key.startsWith(DAY_KEY_PREFIX)) {
        const iso = e.key.slice(DAY_KEY_PREFIX.length);
        if (windowId.split("|").includes(iso)) {
          setPayload((prev) => ({ ...prev, [iso]: loadDay(iso) }));
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [windowId]);

  const setCell = useCallback((dateISO: string, slotIndex: number, value: string) => {
    setPayload((prev) => {
      const day: DaySlots = { ...(prev[dateISO] ?? {}) };
      const trimmed = value.trim();
      if (trimmed) {
        day[slotIndex] = trimmed;
      } else {
        delete day[slotIndex];
      }
      saveDay(dateISO, day);
      return { ...prev, [dateISO]: day };
    });
  }, []);

  const setManyCells = useCallback(
    (entries: Array<[dateISO: string, slotIndex: number]>, value: string) => {
      setPayload((prev) => {
        const next: SchedulePayload = { ...prev };
        const trimmed = value.trim();
        const touched = new Set<string>();
        for (const [dateISO, slotIndex] of entries) {
          const day: DaySlots = { ...(next[dateISO] ?? {}) };
          if (trimmed) {
            day[slotIndex] = trimmed;
          } else {
            delete day[slotIndex];
          }
          next[dateISO] = day;
          touched.add(dateISO);
        }
        touched.forEach((iso) => saveDay(iso, next[iso]));
        return next;
      });
    },
    []
  );

  const setLunchForWeekday = useCallback(
    (weekday: number, config: LunchConfig | null) => {
      setLunchConfig((prev) => {
        const next: LunchConfigByWeekday = { ...prev };
        if (config === null) {
          delete next[weekday];
        } else {
          next[weekday] = config;
        }
        saveLunchConfig(next);
        return next;
      });
    },
    []
  );

  const getLunch = useCallback(
    (date: Date) => lunchConfig[date.getDay()] ?? DEFAULT_LUNCH,
    [lunchConfig]
  );

  const goToDate = useCallback((date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
  }, []);

  // Steps by a full window so the days just scrolled past are not skipped.
  const shiftWindow = useCallback((direction: -1 | 1) => {
    setSelectedDate((d) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() + direction * WINDOW_SIZE);
      return nd;
    });
  }, []);

  const goToPrevious = useCallback(() => shiftWindow(-1), [shiftWindow]);
  const goToNext = useCallback(() => shiftWindow(1), [shiftWindow]);
  const goToToday = useCallback(() => setSelectedDate(startOfToday()), []);

  return {
    selectedDate,
    days,
    dayKeys,
    payload,
    lunchConfig,
    setCell,
    setManyCells,
    setLunchForWeekday,
    getLunch,
    goToDate,
    goToPrevious,
    goToNext,
    goToToday,
  };
}
