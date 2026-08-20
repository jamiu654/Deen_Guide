import { useNavigate } from "react-router-dom";
import { useCurriculum } from "../context/useCurriculum";

/**
 * Drop-in strip used on Hadith Collection, Digital Tasbih, and the
 * Dashboard's "Continue Learning" card. Purely presentational + a
 * navigate call — it doesn't know which host screen it's on.
 *
 * Usage on Hadith Collection page:
 *   <LessonStrip
 *     icon="🎯"
 *     title="Today's Hadith Lesson: Intention"
 *     subtitle="Read → Understand → Quiz"
 *     lessonId="hadith-intention-01"
 *     xp={15}
 *     to="/learn/lesson/hadith-intention-01"
 *   />
 */
export default function LessonStrip({
  icon,
  title,
  subtitle,
  lessonId,
  xp,
  to,
}) {
  const navigate = useNavigate();
  const { isLessonComplete } = useCurriculum();
  const done = lessonId ? isLessonComplete(lessonId) : false;

  return (
    <button
      onClick={() => navigate(to)}
      className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 mb-4 text-left transition
        border ${
          done
            ? "bg-[#0F2418] border-[#245139]"
            : "bg-[#111830] border-[#232C4D] hover:border-[#B99A4E]"
        }`}
    >
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-bold truncate ${done ? "text-[#8FE0B8]" : "text-[#E8C468]"}`}
        >
          {title}
        </p>
        <p className="text-[10px] text-[#8B93B0] mt-0.5">
          {subtitle}
          {xp ? ` · +${xp} XP` : ""}
        </p>
      </div>
      <span
        className={`text-sm font-bold ${done ? "text-[#8FE0B8]" : "text-[#E8C468]"}`}
      >
        {done ? "✓" : "→"}
      </span>
    </button>
  );
}
