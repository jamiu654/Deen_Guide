import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FATWA_QUESTION_BANK } from "../data/fatwaQuestionBank";
import { PROPHETS_QUESTION_BANK } from "../data/prophetsQuestionBank";

const LEVEL_DIFFICULTIES = {
  1: ["easy"],
  2: ["easy", "medium"],
  3: ["easy", "medium", "hard"],
};

const BASE_QUESTIONS = [
  {
    category: "ramadan",
    difficulty: "easy",
    question: "Which month is fasting obligatory in?",
    options: ["Shawwal", "Ramadan", "Muharram", "Dhu al-Hijjah"],
    answer: 1,
    explanation:
      "Fasting is obligatory in Ramadan, the ninth month of the Islamic calendar. It is one of the Five Pillars of Islam.",
  },
  {
    category: "pillars",
    difficulty: "easy",
    question: "How many pillars of Islam are there?",
    options: ["3", "5", "7", "6"],
    answer: 1,
    explanation:
      "There are five pillars of Islam: faith, prayer, charity, fasting, and pilgrimage.",
  },
  {
    category: "quran",
    difficulty: "medium",
    question: "Which surah begins with 'Alif Lam Meem'?",
    options: ["Al-Baqarah", "Al-Imran", "Al-An'am", "Al-Kahf"],
    answer: 0,
    explanation:
      "Surah Al-Baqarah begins with the opening letters 'Alif Lam Meem,' and it is the longest surah in the Quran.",
  },
  {
    category: "history",
    difficulty: "easy",
    question: "In which city is the Kaaba located?",
    options: ["Madinah", "Makkah", "Jerusalem", "Taif"],
    answer: 1,
    explanation:
      "The Kaaba is in Makkah, and it is the holiest site in Islam toward which Muslims pray.",
  },
  {
    category: "prayer",
    difficulty: "easy",
    question: "Which prayer is performed before sunrise?",
    options: ["Fajr", "Dhuhr", "Maghrib", "Isha"],
    answer: 0,
    explanation:
      "Fajr is the dawn prayer and is performed before sunrise, making it the first daily prayer.",
  },
  {
    category: "prayer",
    difficulty: "hard",
    question: "Which prayer is performed just after sunset?",
    options: ["Asr", "Fajr", "Maghrib", "Isha"],
    answer: 2,
    explanation:
      "Maghrib is prayed just after sunset and is the fourth of the five daily prayers.",
  },
  {
    category: "faith",
    difficulty: "easy",
    question: "What is the first pillar of Islam?",
    options: ["Prayer", "Fasting", "Shahadah", "Zakat"],
    answer: 2,
    explanation:
      "The first pillar is the Shahadah, the testimony of faith: there is no god but Allah and Muhammad is His Messenger.",
  },
  {
    category: "charity",
    difficulty: "medium",
    question: "What is the obligatory charity for eligible Muslims called?",
    options: ["Sadaqah", "Khums", "Zakat", "Fidyah"],
    answer: 2,
    explanation:
      "Zakat is the obligatory charity due on savings and wealth above a threshold, and it purifies wealth.",
  },
  {
    category: "prophets",
    difficulty: "medium",
    question: "Who was the prophet who built the ark?",
    options: ["Isa", "Nuh", "Musa", "Yunus"],
    answer: 1,
    explanation:
      "Prophet Nuh was commanded by Allah to build the ark during a time of great flood and disbelief.",
  },
  {
    category: "quran",
    difficulty: "easy",
    question: "How many surahs are in the Quran?",
    options: ["99", "114", "120", "104"],
    answer: 1,
    explanation:
      "The Quran contains 114 surahs, beginning with Al-Fatihah and ending with An-Nas.",
  },
  {
    category: "hajj",
    difficulty: "hard",
    question:
      "What is the name of the sacred place where pilgrims stand in worship during Hajj?",
    options: ["Arafat", "Mina", "Muzdalifah", "Taif"],
    answer: 0,
    explanation:
      "Pilgrims stand at Arafat during the Hajj pilgrimage, and this day is central to the rite.",
  },
  {
    category: "seerah",
    difficulty: "easy",
    question: "In which city was the Prophet Muhammad peace be upon him born?",
    options: ["Madinah", "Taif", "Makkah", "Jerusalem"],
    answer: 2,
    explanation:
      "The Prophet Muhammad was born in Makkah, the city of the Kaaba and the beginning of his mission.",
  },
  ...FATWA_QUESTION_BANK,
  ...PROPHETS_QUESTION_BANK,
];

function buildQuizBank() {
  const totalQuestions = 12000;
  const bank = [];
  const seenQuestions = new Set();
  let index = 0;

  while (bank.length < totalQuestions) {
    const base = BASE_QUESTIONS[index % BASE_QUESTIONS.length];
    const repeatIndex = Math.floor(index / BASE_QUESTIONS.length);
    const variantText =
      repeatIndex === 0
        ? base.question
        : `${base.question} (${repeatIndex + 1})`;

    if (seenQuestions.has(variantText)) {
      index += 1;
      continue;
    }

    seenQuestions.add(variantText);
    bank.push({
      id: bank.length + 1,
      category: base.category,
      difficulty: base.difficulty,
      question: variantText,
      options: [...base.options],
      answer: base.answer,
      explanation: base.explanation,
    });

    index += 1;
  }

  return bank;
}

const QUIZ_BANK = buildQuizBank();
const ALL_CATEGORIES = [
  ...new Set(
    [...BASE_QUESTIONS, ...FATWA_QUESTION_BANK, ...PROPHETS_QUESTION_BANK].map(
      (item) => item.category,
    ),
  ),
];
const ALL_DIFFICULTIES = [
  ...new Set(
    [...BASE_QUESTIONS, ...FATWA_QUESTION_BANK, ...PROPHETS_QUESTION_BANK].map(
      (item) => item.difficulty,
    ),
  ),
];

export default function Quiz() {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
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
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [missedQuestions, setMissedQuestions] = useState([]);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timeLeft, setTimeLeft] = useState(15);
  const [answerFlash, setAnswerFlash] = useState(null);
  const [scorePulse, setScorePulse] = useState(false);
  const [leaderboard, setLeaderboard] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("quizLeaderboard") || "[]");
    } catch {
      return [];
    }
  });
  const audioContextRef = useRef(null);

  const filteredQuestions = useMemo(() => {
    return QUIZ_BANK.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const matchesDifficulty =
        difficulty === "all" || item.difficulty === difficulty;
      return matchesCategory && matchesDifficulty;
    });
  }, [category, difficulty]);

  const question = sessionQuestions[index] || null;
  const totalQuestions = sessionQuestions.length;

  useEffect(() => {
    localStorage.setItem("quizBest", String(best));
  }, [best]);

  useEffect(() => {
    try {
      localStorage.setItem("quizLeaderboard", JSON.stringify(leaderboard));
    } catch {
      // no-op
    }
  }, [leaderboard]);

  useEffect(() => {
    if (!started || !question || selected !== null) return undefined;

    if (timeLeft <= 0) {
      const expiredQuestion = question;
      setSelected(-1);
      setAnswerFlash("incorrect");
      setStreak(0);
      setMissedQuestions((current) => [
        ...current,
        {
          ...expiredQuestion,
          userAnswer: -1,
          correctAnswer: expiredQuestion.options[expiredQuestion.answer],
        },
      ]);
      setFeedback(
        `Time is up! The correct answer is ${expiredQuestion.options[expiredQuestion.answer]}. ${expiredQuestion.explanation}`,
      );
      if (soundEnabled) playSound("incorrect");
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [started, question, selected, timeLeft, soundEnabled]);

  const playSound = useCallback(
    (tone) => {
      if (!soundEnabled || typeof window === "undefined") return;

      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;

      const context = audioContextRef.current || new AudioCtor();
      audioContextRef.current = context;

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain);
      gain.connect(context.destination);

      const now = context.currentTime;
      oscillator.type = tone === "correct" ? "triangle" : "sawtooth";
      oscillator.frequency.setValueAtTime(tone === "correct" ? 660 : 180, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      oscillator.start(now);
      oscillator.stop(now + 0.3);
    },
    [soundEnabled],
  );

  const saveLeaderboardEntry = useCallback(
    (finalScore) => {
      const date = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const entry = {
        score: finalScore,
        name: "Player",
        level,
        date,
      };

      setLeaderboard((current) => {
        const next = [...current, entry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
        return next;
      });
    },
    [level],
  );

  const startQuiz = () => {
    if (!filteredQuestions.length) {
      setFeedback("Select a category or difficulty that has questions.");
      return;
    }

    const pool = [...filteredQuestions];
    const selectedRound = [];
    const seenIds = new Set();
    const targetCount = Math.min(25, pool.length);

    while (selectedRound.length < targetCount) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      const candidate = pool.splice(randomIndex, 1)[0];

      if (seenIds.has(candidate.id)) continue;
      seenIds.add(candidate.id);
      selectedRound.push(candidate);
    }

    setSessionQuestions(selectedRound);
    setStarted(true);
    setIndex(0);
    setScore(0);
    setStreak(0);
    setLevel(1);
    setSelected(null);
    setHintEliminated(null);
    setFeedback("");
    setMissedQuestions([]);
    setCelebrationVisible(false);
    setHintsLeft(2);
    setTimeLeft(15);
  };

  const finishQuiz = () => {
    const finalScore = score;
    const winState =
      finalScore >= Math.max(1, Math.ceil(totalQuestions * 0.7) * 10);

    setStarted(false);
    setCelebrationVisible(winState);
    setFeedback(
      winState
        ? `Alhamdulillah! You won with ${finalScore} points.`
        : `Quiz complete. Final score: ${finalScore}`,
    );

    if (finalScore > best) setBest(finalScore);
    saveLeaderboardEntry(finalScore);
  };

  const restartQuiz = () => startQuiz();

  const handleSelect = (optionIndex) => {
    if (!started || selected !== null || !question) return;
    setSelected(optionIndex);
    setAnswerFlash(optionIndex === question.answer ? "correct" : "incorrect");
    setScorePulse(true);

    if (optionIndex === question.answer) {
      const updatedScore = score + 10;
      setScore(updatedScore);
      setStreak((value) => value + 1);
      setLevel(Math.min(3, Math.max(1, Math.ceil(updatedScore / 30))));
      setFeedback(`Correct! ${question.explanation}`);
      if (soundEnabled) playSound("correct");
      window.setTimeout(() => setScorePulse(false), 320);
      return;
    }

    setStreak(0);
    setMissedQuestions((current) => [
      ...current,
      {
        ...question,
        userAnswer: optionIndex,
        correctAnswer: question.options[question.answer],
      },
    ]);
    setFeedback(
      `Wrong — the correct answer is ${question.options[question.answer]}. ${question.explanation}`,
    );
    if (soundEnabled) playSound("incorrect");
    window.setTimeout(() => setScorePulse(false), 320);
  };

  const nextQuestion = () => {
    setSelected(null);
    setAnswerFlash(null);
    setFeedback("");
    setHintEliminated(null);
    setTimeLeft(15);

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
      {celebrationVisible && (
        <div className="celebration-overlay">
          <div className="celebration-card glass">
            <div className="celebration-particles" aria-hidden="true">
              {Array.from({ length: 16 }).map((_, index) => (
                <span
                  key={`spark-${index}`}
                  style={{
                    left: `${(index * 17) % 100}%`,
                    animationDelay: `${(index % 6) * 0.1}s`,
                    ["--drift-x"]: `${index % 2 === 0 ? -30 : 30}px`,
                  }}
                />
              ))}
            </div>
            <div className="celebration-burst" aria-hidden="true">
              ✨ 🎉 🏆 ✨
            </div>
            <h3>Alhamdulillah! You won!</h3>
            <div className="reward-badge">⭐ Reward unlocked</div>
            <p>
              Final score: <strong>{score}</strong> / {totalQuestions * 10}
            </p>
            <button type="button" onClick={() => setCelebrationVisible(false)}>
              Keep learning
            </button>
          </div>
        </div>
      )}

      <div
        className="quiz-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 className="section-title">❓ Islamic Quiz Game</h2>
          <p>
            Test your knowledge across Quran, prayer, pillars, and daily Islamic
            practice.
          </p>
        </div>
        <div className="quiz-best">
          <span>Best Score</span>
          <strong
            id="quizBestDisplay"
            className={scorePulse ? "score-bump" : ""}
          >
            {best}
          </strong>
          <div className="level-pill">Level {level}</div>
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
          {ALL_CATEGORIES.map((cat) => (
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
          {ALL_DIFFICULTIES.map((level) => (
            <option key={level} value={level}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </option>
          ))}
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
          <input
            type="checkbox"
            id="soundEffectsToggle"
            checked={soundEnabled}
            onChange={() => setSoundEnabled((value) => !value)}
          />
          Sound effects
        </label>
      </div>

      <div
        className={`quiz-panel glass ${answerFlash ?? ""}`}
        style={{ marginTop: 12 }}
      >
        <div className="quiz-meta" style={{ display: "flex", gap: 12 }}>
          <span id="quizRound">
            Question {question ? index + 1 : 0} of {totalQuestions}
          </span>
          <span id="quizScore" className={scorePulse ? "score-bump" : ""}>
            Score: {score}
          </span>
          <span id="quizStreak">Streak: {streak}</span>
          <span className={`quiz-timer ${timeLeft <= 5 ? "warning" : ""}`}>
            ⏱ {timeLeft}s
          </span>
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
                key={`${question.id}-${i}`}
                onClick={() => handleSelect(i)}
                disabled={selected !== null || hintEliminated === i}
                className={
                  selected === i
                    ? i === question.answer
                      ? "active"
                      : "incorrect"
                    : hintEliminated === i
                      ? "hidden-option"
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

        {missedQuestions.length > 0 && !started && (
          <div className="missed-questions">
            <h4>Missed Questions & Explanations</h4>
            {missedQuestions.map((item) => (
              <div
                key={`${item.id}-${item.userAnswer}-${item.correctAnswer}`}
                className="missed-item"
              >
                <p className="missed-question">{item.question}</p>
                <p className="missed-answer">
                  {item.userAnswer === -1
                    ? `Time expired • Correct: ${item.options[item.answer]}`
                    : `Your answer: ${item.options[item.userAnswer]} • Correct: ${item.options[item.answer]}`}
                </p>
                <p className="missed-explanation">{item.explanation}</p>
              </div>
            ))}
          </div>
        )}

        {leaderboard.length > 0 && !started && (
          <div className="leaderboard-box">
            <h4>Local Leaderboard</h4>
            {leaderboard.map((entry, index) => (
              <div
                key={`${entry.name}-${entry.score}-${index}`}
                className="leaderboard-row"
              >
                <span>#{index + 1}</span>
                <strong>{entry.name}</strong>
                <span>{entry.score} pts</span>
                <small>{entry.date}</small>
              </div>
            ))}
          </div>
        )}

        <div
          className="quiz-actions"
          style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          <button
            id="hintQuizBtn"
            className="secondary"
            onClick={hint}
            disabled={hintsLeft <= 0 || !started}
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
