import { useEffect, useMemo, useState } from "react";

const QUIZ_BANK = [
  {
    id: 1,
    category: "ramadan",
    difficulty: "easy",
    question: "Which month is fasting obligatory in?",
    options: ["Shawwal", "Ramadan", "Muharram", "Dhu al-Hijjah"],
    answer: 1,
  },
  {
    id: 2,
    category: "pillars",
    difficulty: "easy",
    question: "How many pillars of Islam are there?",
    options: ["3", "5", "7", "6"],
    answer: 1,
  },
  {
    id: 3,
    category: "quran",
    difficulty: "medium",
    question: "Which surah begins with 'Alif Lam Meem'?",
    options: ["Al-Baqarah", "Al-Imran", "Al-An'am", "Al-Kahf"],
    answer: 0,
  },
  {
    id: 4,
    category: "history",
    difficulty: "easy",
    question: "In which city is the Kaaba located?",
    options: ["Madinah", "Makkah", "Jerusalem", "Taif"],
    answer: 1,
  },
  {
    id: 5,
    category: "prayer",
    difficulty: "easy",
    question: "Which prayer is performed before sunrise?",
    options: ["Fajr", "Dhuhr", "Maghrib", "Isha"],
    answer: 0,
  },
  {
    id: 6,
    category: "qid",
    difficulty: "hard",
    question: "Which prayer is performed just after sunset?",
    options: ["Asr", "Fajr", "Maghrib", "Isha"],
    answer: 2,
  },
];

export default function Quiz() {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [best, setBest] = useState(() => {
    const savedBest = parseInt(localStorage.getItem("quizBest") || "0", 10);
    return savedBest;
  });
  const [hintsLeft, setHintsLeft] = useState(2);
  const [hintEliminated, setHintEliminated] = useState(null);
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  const filteredQuestions = useMemo(() => {
    return QUIZ_BANK.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const matchesDifficulty =
        difficulty === "all" || item.difficulty === difficulty;
      return matchesCategory && matchesDifficulty;
    });
  }, [category, difficulty]);

  const question = filteredQuestions[index] || null;
  const totalQuestions = filteredQuestions.length;

  useEffect(() => {
    localStorage.setItem("quizBest", String(best));
  }, [best]);

  const startQuiz = () => {
    if (!totalQuestions) {
      setFeedback("Select a category or difficulty that has questions.");
      return;
    }
    setStarted(true);
    setIndex(0);
    setScore(0);
    setStreak(0);
    setSelected(null);
    setHintEliminated(null);
    setFeedback("");
  };

  const finishQuiz = () => {
    setStarted(false);
    setFeedback(`Quiz complete. Final score: ${score}`);
    if (score > best) setBest(score);
  };

  const restartQuiz = () => startQuiz();

  const handleSelect = (optionIndex) => {
    if (!started || selected !== null || !question) return;
    setSelected(optionIndex);
    if (optionIndex === question.answer) {
      setScore((value) => value + 10);
      setStreak((value) => value + 1);
      setFeedback("Correct! Keep going.");
    } else {
      setStreak(0);
      setFeedback(
        `Wrong — correct answer: ${question.options[question.answer]}`,
      );
    }
  };

  const nextQuestion = () => {
    setSelected(null);
    setFeedback("");
    setHintEliminated(null);
    if (index + 1 < totalQuestions) {
      setIndex((value) => value + 1);
      return;
    }
    finishQuiz();
  };

  const hint = () => {
    if (!started || hintsLeft <= 0 || !question || selected !== null) return;
    const wrongOptions = question.options
      .map((_, idx) => idx)
      .filter((idx) => idx !== question.answer);
    const eliminated =
      wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    setHintEliminated(eliminated);
    setHintsLeft((value) => value - 1);
    setFeedback("Hint: one wrong option has been removed.");
  };

  const endQuiz = () => {
    finishQuiz();
  };

  const resetBest = () => {
    localStorage.removeItem("quizBest");
    setBest(0);
  };

  return (
    <section className="page card glass" id="quiz">
      <div
        className="quiz-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 className="section-title">? Islamic Quiz Game</h2>
          <p>
            Test your knowledge across Quran, prayer, pillars, and daily Islamic
            practice.
          </p>
        </div>
        <div className="quiz-best">
          <span>Best Score</span>
          <strong id="quizBestDisplay">{best}</strong>
        </div>
      </div>

      <div
        className="quiz-controls"
        style={{
          marginTop: 12,
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <select
          id="quizCategory"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="all">All Categories</option>
          {[...new Set(QUIZ_BANK.map((item) => item.category))].map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        <select
          id="quizDifficulty"
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value)}
        >
          <option value="all">All Difficulties</option>
          {[...new Set(QUIZ_BANK.map((item) => item.difficulty))].map(
            (level) => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ),
          )}
        </select>
        <button id="startQuizBtn" onClick={startQuiz}>
          {started ? "Restart" : "Start Quiz"}
        </button>
        <label
          style={{
            fontSize: ".9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          <input type="checkbox" id="soundEffectsToggle" defaultChecked />
          Sound effects
        </label>
      </div>

      <div className="quiz-panel glass" style={{ marginTop: 12 }}>
        <div className="quiz-meta" style={{ display: "flex", gap: 12 }}>
          <span id="quizRound">
            Question {question ? index + 1 : 0} of {totalQuestions}
          </span>
          <span id="quizScore">Score: {score}</span>
          <span id="quizStreak">Streak: {streak}</span>
        </div>

        <div
          className="quiz-progress"
          style={{
            height: 8,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 8,
            marginTop: 8,
          }}
        >
          <div
            id="quizProgressFill"
            style={{
              width: `${totalQuestions ? ((index + (selected !== null ? 1 : 0)) / totalQuestions) * 100 : 0}%`,
              height: "100%",
              background: "linear-gradient(90deg,#fcd34d,#10b981)",
              borderRadius: 8,
            }}
          />
        </div>

        <h3 id="quizQuestion" style={{ marginTop: 12 }}>
          {question ? question.question : "No questions available."}
        </h3>
        <div className="quiz-options" id="quizOptions">
          {question ? (
            question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={selected !== null || hintEliminated === i}
                className={
                  selected === i
                    ? i === question.answer
                      ? "active"
                      : "incorrect"
                    : ""
                }
              >
                {opt}
              </button>
            ))
          ) : (
            <div style={{ color: "#cbd5e1" }}>
              No questions match this selection.
            </div>
          )}
        </div>

        <div
          className="quiz-feedback"
          id="quizFeedback"
          style={{ marginTop: 10 }}
        >
          {feedback}
        </div>
        <div
          className="quiz-actions"
          style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          <button
            id="hintQuizBtn"
            className="secondary"
            onClick={hint}
            disabled={hintsLeft <= 0}
          >
            Hint ({hintsLeft})
          </button>
          <button
            id="skipQuizBtn"
            className="secondary"
            onClick={nextQuestion}
            disabled={!started}
          >
            Skip
          </button>
          <button
            id="nextQuizBtn"
            className="secondary"
            onClick={nextQuestion}
            disabled={selected === null && started}
          >
            Next Question
          </button>
          <button
            id="restartQuizBtn"
            className="secondary"
            onClick={restartQuiz}
          >
            Restart
          </button>
          <button
            id="endQuizBtn"
            className="secondary"
            onClick={endQuiz}
            disabled={!started}
          >
            End Quiz
          </button>
          <button id="resetQuizBestBtn" className="danger" onClick={resetBest}>
            Reset Best
          </button>
        </div>
      </div>
    </section>
  );
}
