import { useCallback, useEffect, useState } from "react";

type RatingLog = Record<string, number[]>;

type RatingState = {
  groupId: string;
  log: RatingLog;
};

function storageKey(groupId: string) {
  return `exercise-ratings-${groupId}`;
}

function loadRatings(groupId: string): RatingLog {
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (raw) return JSON.parse(raw) as RatingLog;
  } catch {
    // ignore malformed storage
  }

  return {};
}

/** Tracks "how much did the kids like it" scores (1-3) per exercise, per group. */
export function useRatings(groupId: string) {
  const [state, setState] = useState<RatingState>(() => ({
    groupId,
    log: loadRatings(groupId),
  }));

  useEffect(() => {
    if (state.groupId !== groupId) {
      setState({
        groupId,
        log: loadRatings(groupId),
      });
    }
  }, [groupId, state.groupId]);

  useEffect(() => {
    if (state.groupId !== groupId) return;

    try {
      localStorage.setItem(storageKey(groupId), JSON.stringify(state.log));
    } catch {
      // storage unavailable; ignore
    }
  }, [groupId, state.groupId, state.log]);

  const log = state.groupId === groupId ? state.log : loadRatings(groupId);

  const rate = useCallback(
    (exerciseId: string, value: number) => {
      setState((prev) => {
        const currentLog =
          prev.groupId === groupId ? prev.log : loadRatings(groupId);

        return {
          groupId,
          log: {
            ...currentLog,
            [exerciseId]: [...(currentLog[exerciseId] ?? []), value],
          },
        };
      });
    },
    [groupId],
  );

  const stats = useCallback(
    (exerciseId: string) => {
      const values = log[exerciseId] ?? [];

      if (values.length === 0) {
        return {
          average: null as number | null,
          count: 0,
        };
      }

      const average = values.reduce((a, b) => a + b, 0) / values.length;

      return { average, count: values.length };
    },
    [log],
  );

  const lastRating = useCallback(
    (exerciseId: string) => {
      const values = log[exerciseId] ?? [];
      return values.length > 0 ? values[values.length - 1] : null;
    },
    [log],
  );

  return { rate, stats, lastRating };
}
