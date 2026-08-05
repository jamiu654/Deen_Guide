import { useEffect, useRef, useState } from "react";

const knowledgeBase = {
  wudu: {
    keywords: ["wudu", "ablution", "wash", "clean", "wudhu"],
    response: `**How to Perform Wudu:**

1. **Niyyah** — Make the intention in your heart
2. **Wash hands** — Three times up to the wrists
3. **Rinse mouth** — Three times
4. **Cleanse nose** — Three times
5. **Wash face** — Three times, from hairline to chin
6. **Wash arms** — Right then left, up to elbows, three times
7. **Wipe head** — Once, from front to back
8. **Wipe ears** — Once, inside and behind
9. **Wash feet** — Right then left, up to ankles, three times`,
  },
  pillars: {
    keywords: ["pillars", "arkan", "five", "islam", "foundation"],
    response: `**The Five Pillars of Islam:**

1. **Shahadah** — Declaration of faith
2. **Salah** — Praying five times daily
3. **Zakah** — Giving charity to the poor
4. **Sawm** — Fasting in Ramadan
5. **Hajj** — Pilgrimage to Makkah (if able)`,
  },
  prayer: {
    keywords: ["prayer", "salah", "namaz", "sujood", "rakah"],
    response: `**Daily Prayers (Salah):**

• **Fajr** — 2 rak'ahs (dawn)
• **Dhuhr** — 4 rak'ahs (noon)
• **Asr** — 4 rak'ahs (afternoon)
• **Maghrib** — 3 rak'ahs (sunset)
• **Isha** — 4 rak'ahs (night)`,
  },
  fasting: {
    keywords: ["fast", "ramadan", "sawm", "roza", "fasting"],
    response: `**Fasting (Sawm) in Ramadan:**

• Abstain from food, drink, and marital relations from dawn to sunset
• Make intention (niyyah) before dawn each day
• Break fast with dates and water (Sunnah)
• Exemptions: illness, travel, pregnancy, old age

*"O you who believe! Fasting is prescribed for you..."* (2:183)`,
  },
  zakat: {
    keywords: ["zakat", "charity", "sadaqah", "donate", "poor"],
    response: `**Zakat (Obligatory Charity):**

• **Rate:** 2.5% of savings held for one lunar year
• **Nisab:** Minimum threshold (~$400-500 USD)
• **Recipients:** 8 categories including the poor, needy, debtors

*"The example of those who spend their wealth in the way of Allah is like a seed which grows seven spikes"* (2:261)`,
  },
  hajj: {
    keywords: ["hajj", "umrah", "pilgrimage", "makkah", "kaaba"],
    response: `**Hajj & Umrah:**

**Hajj** (Major Pilgrimage):
• Performed in Dhul-Hijjah (12th month)
• Obligatory once in a lifetime if able
• Rituals: Ihram, Tawaf, Sa'i, Arafat, Rami, Qurbani

**Umrah** (Minor Pilgrimage):
• Can be performed anytime
• Rituals: Ihram, Tawaf, Sa'i, Halq/Taqsir`,
  },
  greeting: {
    keywords: ["hello", "hi", "hey", "assalam", "salaam", "salam"],
    response: `**Wa Alaikum Assalam wa Rahmatullahi wa Barakatuh!**

Peace, mercy, and blessings of Allah be upon you too. How may I assist you today?`,
  },
};

const quickPrompts = [
  { id: "wudu", text: "How do I perform wudu?" },
  { id: "prayer", text: "Tell me about prayer" },
  { id: "fasting", text: "How does fasting work?" },
  { id: "zakat", text: "What is zakat?" },
  { id: "hajj", text: "Tell me about hajj" },
];

function findResponse(message) {
  const normalized = message.toLowerCase();
  for (const key in knowledgeBase) {
    if (
      knowledgeBase[key].keywords.some((keyword) =>
        normalized.includes(keyword),
      )
    ) {
      return knowledgeBase[key].response;
    }
  }
  return `I'm not sure about that. I can help with:\n\n• **Wudu** (ablution)\n• **Five Pillars** of Islam\n• **Prayer** (Salah)\n• **Fasting** (Ramadan)\n• **Zakat** (charity)\n• **Hajj** and Umrah\n\nPlease ask about one of these.`;
}

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Assalamu Alaikum! I can help you with questions about Wudu, the Five Pillars, Prayer, Fasting, Zakat, Hajj, and more. What would you like to know?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const submitMessage = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMessage = { sender: "user", text: trimmed };
    setMessages((current) => [...current, userMessage]);
    setInputValue("");

    window.setTimeout(() => {
      const botMessage = { sender: "bot", text: findResponse(trimmed) };
      setMessages((current) => [...current, botMessage]);
    }, 300);
  };

  const handleQuickPrompt = (text) => {
    setInputValue(text);
    window.setTimeout(submitMessage, 0);
  };

  return (
    <section className="page card glass" id="chat">
      <div className="section-box glass">
        <h2 className="section-title">💬 Islamic Assistant</h2>
        <div className="chat-window" ref={chatRef}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.sender === "user" ? "user-message" : "bot-message"}`}
              dangerouslySetInnerHTML={{
                __html: message.text.replace(/\n/g, "<br>"),
              }}
            />
          ))}
        </div>

        <div className="chat-input" style={{ marginTop: "20px" }}>
          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitMessage();
            }}
            placeholder="Ask about Wudu, Pillars, Prayer..."
          />
          <button type="button" className="secondary" onClick={submitMessage}>
            Send
          </button>
        </div>

        <div
          style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10 }}
        >
          {quickPrompts.map((prompt) => (
            <button
              key={prompt.id}
              className="secondary"
              type="button"
              onClick={() => handleQuickPrompt(prompt.text)}
            >
              {prompt.text}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
