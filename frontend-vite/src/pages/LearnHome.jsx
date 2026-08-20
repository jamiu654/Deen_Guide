import { useNavigate } from "react-router-dom";
import { useCurriculum } from "../context/useCurriculum";

export default function LearnHome() {
  const navigate = useNavigate();
  const { curriculumTree, progress, getLevelProgress, getModuleProgress } =
    useCurriculum();

  const currentPhase = 1;

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <div className="mx-auto max-w-5xl px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="text-[11px] font-bold tracking-[0.22em] text-[#B99A4E] uppercase">
            Your Journey
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl">Learn</h1>
            <span className="rounded-full border border-[#2A3558] bg-[#111830] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A8B2D2]">
              Phase {currentPhase}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#232C4D] bg-[#111830] px-3 py-3 shadow-[0_0_0_1px_rgba(12,17,31,0.9)]">
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B93B0]">
                XP
              </p>
              <p className="mt-2 text-lg font-bold text-[#F7F2E8]">
                {progress.xp}
              </p>
            </div>
            <div className="rounded-2xl border border-[#232C4D] bg-[#111830] px-3 py-3 shadow-[0_0_0_1px_rgba(12,17,31,0.9)]">
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B93B0]">
                Streak
              </p>
              <p className="mt-2 text-lg font-bold text-[#F7F2E8]">
                🔥 {progress.streakCount} days
              </p>
            </div>
            <div className="rounded-2xl border border-[#232C4D] bg-[#111830] px-3 py-3 shadow-[0_0_0_1px_rgba(12,17,31,0.9)] sm:col-span-1 col-span-2">
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B93B0]">
                Focus
              </p>
              <p className="mt-2 text-sm font-semibold text-[#E8C468]">
                Arabic Reading
              </p>
            </div>
          </div>
        </header>

        {curriculumTree.levels.map((level) => {
          const locked = level.phase > currentPhase;
          const pct = getLevelProgress(level.id);

          return (
            <section key={level.id} className="mb-5">
              <div
                className={`rounded-3xl border p-4 shadow-lg shadow-[#070c17]/30 transition-all duration-200 ${
                  locked
                    ? "border-[#1A2038] bg-[#0D1122] opacity-60"
                    : "border-[#232C4D] bg-[#111830]"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-white sm:text-base">
                    {level.emoji} {level.title}
                  </p>
                  {locked && (
                    <span className="rounded-full border border-[#2B3352] bg-[#0A1020] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8B93B0]">
                      🔒 Coming later
                    </span>
                  )}
                </div>

                {!locked && (
                  <>
                    <div className="mb-4 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[#8B93B0]">
                      <span>Progress</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-[#1E2745]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#E8C468] to-[#F4D58D]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {level.modules.map((mod) => {
                        const hasLessons = mod.lessons.length > 0;
                        const moduleProgress = hasLessons
                          ? getModuleProgress(mod.id)
                          : 0;

                        return (
                          <button
                            key={mod.id}
                            disabled={!hasLessons}
                            onClick={() =>
                              navigate(`/learn/lesson/${mod.lessons[0]?.id}`)
                            }
                            className="flex items-center justify-between gap-3 rounded-2xl border border-[#1E2745] bg-[#0D1428] px-3 py-3 text-left transition hover:border-[#B99A4E] hover:bg-[#101b34] disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <div className="min-w-0">
                              <span className="block text-xs font-semibold text-white sm:text-sm">
                                {mod.title}
                              </span>
                              <span className="mt-1 block text-[10px] uppercase tracking-[0.16em] text-[#8B93B0]">
                                {hasLessons
                                  ? `${moduleProgress}% complete`
                                  : "Coming soon"}
                              </span>
                            </div>
                            <span className="shrink-0 rounded-full border border-[#26314E] bg-[#101a31] px-2 py-1 text-[10px] font-bold text-[#E8C468]">
                              {hasLessons
                                ? moduleProgress === 100
                                  ? "✓"
                                  : "→"
                                : "Soon"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
