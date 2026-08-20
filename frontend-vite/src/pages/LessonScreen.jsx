import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCurriculum } from "../context/useCurriculum";

const STEPS = ["learn", "practice", "test"];

export default function LessonScreen() {
  const { lessonId, moduleId } = useParams();
  const navigate = useNavigate();
  const { curriculumTree, completeLesson } = useCurriculum();
  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState(null);

  const allLessons = curriculumTree.levels.flatMap((level) =>
    level.modules.flatMap((mod) => mod.lessons),
  );

  const targetModule = curriculumTree.levels
    .flatMap((level) => level.modules)
    .find((mod) => mod.id === moduleId);

  const resolvedLesson =
    allLessons.find((lesson) => lesson.id === lessonId) ??
    targetModule?.lessons[0] ??
    null;

  useEffect(() => {
    if (moduleId && !lessonId && targetModule?.lessons[0]) {
      navigate(`/learn/lesson/${targetModule.lessons[0].id}`, {
        replace: true,
      });
    }
  }, [moduleId, lessonId, navigate, targetModule]);

  if (!resolvedLesson) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0F1E] px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-[#232C4D] bg-[#111830] p-6 text-center shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#B99A4E]">
            Lesson unavailable
          </p>
          <h1 className="mt-3 font-serif text-2xl">
            This module is coming soon.
          </h1>
          <button
            onClick={() => navigate("/learn")}
            className="mt-5 rounded-full bg-[#E8C468] px-5 py-2 text-xs font-bold text-[#0A0F1E]"
          >
            Back to Learn
          </button>
        </div>
      </div>
    );
  }

  const lesson = resolvedLesson;
  const step = STEPS[stepIndex];
  const question = lesson.quiz?.[0];

  function handleAnswer(option) {
    setSelected(option);
    if (option === question.answer) {
      completeLesson(lesson.id, { xp: lesson.xp, correctOnFirstTry: true });
    }
  }

  const isLastStep = stepIndex === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <div className="mx-auto max-w-5xl px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate("/learn")}
            className="rounded-full border border-[#2A3558] bg-[#111830] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#DCE6FF]"
          >
            ← Back
          </button>
          <span className="rounded-full border border-[#2A3558] bg-[#111830] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B99A4E]">
            Lesson flow
          </span>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-[#232C4D] bg-[#0D1428] shadow-[0_0_0_1px_rgba(14,20,35,0.8)]">
          <div className="bg-gradient-to-r from-[#060A14] via-[#0B1220] to-[#121b33] px-5 pt-5 pb-4 sm:px-6">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#B99A4E]">
              Level 1 · Arabic Foundations
            </p>
            <h1 className="mt-2 font-serif text-xl sm:text-2xl">
              {lesson.title}
            </h1>
          </div>

          <div className="px-5 pb-6 pt-4 sm:px-6">
            <div className="mb-4 flex gap-1">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full ${
                    i < stepIndex
                      ? "bg-[#3FBF9F]"
                      : i === stepIndex
                        ? "bg-[#E8C468]"
                        : "bg-[#232C4D]"
                  }`}
                />
              ))}
            </div>
            <div className="mb-6 flex justify-between text-[9px] font-bold uppercase tracking-[0.16em] text-[#8B93B0]">
              <span>Learn</span>
              <span>Practice</span>
              <span>Test</span>
            </div>

            {step === "learn" && (
              <div className="rounded-3xl border border-[#232C4D] bg-[#111830] p-6 text-center shadow-lg shadow-[#070c17]/20">
                <p className="text-6xl font-serif text-white sm:text-7xl">
                  {lesson.arabic}
                </p>
                <p className="mt-4 text-base font-bold text-white">
                  {lesson.title}
                </p>
                <p className="mt-2 text-lg text-[#8B93B0] tracking-[0.22em]">
                  {lesson.forms.join("  ")}
                </p>
                <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#E8C468] px-4 py-2 text-xs font-bold text-[#0A0F1E]">
                  ▶ Listen
                </button>
              </div>
            )}

            {step === "practice" && (
              <div className="rounded-3xl border border-[#232C4D] bg-[#111830] p-5 sm:p-6">
                <p className="mb-4 text-sm text-[#8B93B0]">
                  Trace or repeat the sound out loud, then continue.
                </p>
                <div className="rounded-2xl border border-[#1E2745] bg-[#0D1428] p-6 text-center">
                  <p className="text-5xl font-serif text-white sm:text-6xl">
                    {lesson.arabic}
                  </p>
                </div>
              </div>
            )}

            {step === "test" && question && (
              <div className="rounded-3xl border border-[#232C4D] bg-[#111830] p-4 sm:p-5">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#E8C468]">
                  {question.prompt}
                </p>
                <div className="flex flex-col gap-2.5">
                  {question.options.map((opt) => {
                    const isSelected = selected === opt;
                    const isCorrect = selected && opt === question.answer;

                    return (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(opt)}
                        className={`rounded-2xl border px-4 py-3 text-left text-lg font-serif transition ${
                          isCorrect
                            ? "border-[#3FBF9F] bg-[#0F2418] text-[#DFFBEE]"
                            : isSelected
                              ? "border-[#E8C468] bg-[#2A2410] text-[#F4D58D]"
                              : "border-[#1E2745] bg-[#0D1428] text-white"
                        }`}
                      >
                        {opt} {isCorrect && "✓"}
                      </button>
                    );
                  })}
                </div>
                {selected === question.answer && (
                  <div className="mt-4 rounded-2xl border border-[#E8C468] bg-[#2A2410] px-3 py-2 text-xs font-bold text-[#E8C468]">
                    ⭐ +{lesson.xp} XP — added to your review queue.
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                disabled={stepIndex === 0}
                onClick={() => setStepIndex((i) => i - 1)}
                className="rounded-full border border-[#2A3558] bg-[#111830] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8B93B0] disabled:cursor-not-allowed disabled:opacity-30"
              >
                Back
              </button>

              {isLastStep ? (
                <button
                  disabled={selected !== question?.answer}
                  onClick={() => navigate("/learn")}
                  className="rounded-full bg-[#3FBF9F] px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#04231C] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Finish Lesson
                </button>
              ) : (
                <button
                  onClick={() => setStepIndex((i) => i + 1)}
                  className="rounded-full bg-[#E8C468] px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0A0F1E]"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
