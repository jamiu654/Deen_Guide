import { useEffect, useState, useCallback } from "react";
import curriculumTree from "../data/curriculumTree.json";
import { CurriculumContext } from "./CurriculumContext";
const STORAGE_KEY = "deenguide_curriculum_progress_v1";

// Shape persisted to localStorage:
// {
//   xp: number,
//   streakCount: number,
//   lastActiveDate: "2026-08-18",
//   completedLessons: { [lessonId]: { completedAt, correctOnFirstTry } },
//   reviewQueue: { [lessonId]: nextReviewISODate },
//   lastPosition: { levelId, moduleId, lessonId } | null
// }

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    return { ...defaultProgress(), ...JSON.parse(raw) };
  } catch {
    return defaultProgress();
  }
}

function defaultProgress() {
  return {
    xp: 0,
    streakCount: 0,
    lastActiveDate: null,
    completedLessons: {},
    reviewQueue: {},
    lastPosition: null,
  };
}

// Spaced repetition intervals in days, per the plan: 10min -> 1d -> 3d -> 7d -> 30d
const REVIEW_INTERVALS_DAYS = [1, 3, 7, 30];

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function CurriculumProvider({ children }) {
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  // Call once on app mount to update streak based on today's date
  useEffect(() => {
    const today = new Date().toDateString();
    setProgress((prev) => {
      if (prev.lastActiveDate === today) return prev;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = prev.lastActiveDate === yesterday.toDateString();
      return {
        ...prev,
        lastActiveDate: today,
        streakCount: wasYesterday
          ? prev.streakCount + 1
          : prev.lastActiveDate
            ? 1
            : prev.streakCount,
      };
    });
  }, []);

  const completeLesson = useCallback(
    (lessonId, { xp = 10, correctOnFirstTry = true } = {}) => {
      setProgress((prev) => ({
        ...prev,
        xp: prev.xp + xp,
        completedLessons: {
          ...prev.completedLessons,
          [lessonId]: {
            completedAt: new Date().toISOString(),
            correctOnFirstTry,
          },
        },
        reviewQueue: {
          ...prev.reviewQueue,
          [lessonId]: addDays(new Date(), REVIEW_INTERVALS_DAYS[0]),
        },
      }));
    },
    [],
  );

  const advanceReview = useCallback((lessonId) => {
    setProgress((prev) => {
      const current = prev.reviewQueue[lessonId];
      const idx = REVIEW_INTERVALS_DAYS.findIndex(
        (d) =>
          addDays(prev.completedLessons[lessonId]?.completedAt, d) === current,
      );
      const nextIdx = Math.min(idx + 1, REVIEW_INTERVALS_DAYS.length - 1);
      return {
        ...prev,
        reviewQueue: {
          ...prev.reviewQueue,
          [lessonId]: addDays(new Date(), REVIEW_INTERVALS_DAYS[nextIdx]),
        },
      };
    });
  }, []);

  const setLastPosition = useCallback((position) => {
    setProgress((prev) => ({ ...prev, lastPosition: position }));
  }, []);

  // Derived helpers
  const isLessonComplete = (lessonId) =>
    Boolean(progress.completedLessons[lessonId]);

  const getModuleProgress = (moduleId) => {
    const mod = curriculumTree.levels
      .flatMap((l) => l.modules)
      .find((m) => m.id === moduleId);
    if (!mod || mod.lessons.length === 0) return 0;
    const done = mod.lessons.filter((l) => isLessonComplete(l.id)).length;
    return Math.round((done / mod.lessons.length) * 100);
  };

  const getLevelProgress = (levelId) => {
    const level = curriculumTree.levels.find((l) => l.id === levelId);
    if (!level) return 0;
    const allLessons = level.modules.flatMap((m) => m.lessons);
    if (allLessons.length === 0) return 0;
    const done = allLessons.filter((l) => isLessonComplete(l.id)).length;
    return Math.round((done / allLessons.length) * 100);
  };

  const dueForReview = () => {
    const now = new Date();
    return Object.entries(progress.reviewQueue)
      .filter(([, dueDate]) => new Date(dueDate) <= now)
      .map(([lessonId]) => lessonId);
  };

  const value = {
    progress,
    completeLesson,
    advanceReview,
    setLastPosition,
    isLessonComplete,
    getModuleProgress,
    getLevelProgress,
    dueForReview,
    curriculumTree,
  };

  return (
    <CurriculumContext.Provider value={value}>
      {children}
    </CurriculumContext.Provider>
  );
}
