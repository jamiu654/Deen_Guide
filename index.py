from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os

app = Flask(__name__)
CORS(app)  # Allow frontend to call backend

# Configure OpenAI client (use environment variable in production)
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
# Do not instantiate the OpenAI client unless an API key is provided (avoids errors during import)
client = OpenAI(api_key=OPENAI_KEY) if OPENAI_KEY else None

@app.route("/chat", methods=["POST"]) 
def chat():
    data = request.get_json()
    user_message = data.get("message", "")
    
    if not user_message:
        return jsonify({"error": "No message provided"}), 400
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Be concise, friendly, and able to discuss a wide range of topics."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=500
        )

        bot_reply = response.choices[0].message.content
        return jsonify({"reply": bot_reply})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Bind to 0.0.0.0 so devices on your local network (e.g., phone) can access the dev server.
    # Note: Allow Python/port 5000 through your firewall.
    app.run(debug=True, host='0.0.0.0', port=5000)


@app.route("/story", methods=["POST"])
def story():
    """Generate a respectful full story for a given prophet name using the LLM API.
    Expects JSON: {"prophet": "Yusuf"}
    """
    data = request.get_json() or {}
    prophet = (data.get("prophet") or "").strip()

    if not prophet:
        return jsonify({"error": "No prophet name provided"}), 400

    # Prompt: ask the model to produce a respectful, well-sourced narration
    prompt = (
        f"Write a respectful, accurate, and concise full story of the life and key events "
        f"of the Prophet {prophet}. Rely on widely accepted accounts, avoid inventing unauthenticated "
        "details or speculative claims, and present lessons and an appropriate summary at the end. "
        "Keep the tone educational and suitable for a general audience."
    )

    # If no API key is available, return a small demo story so local testing works.
    if not OPENAI_KEY:
        demo = (
            f"(Demo) Story of Prophet {prophet}:\n"
            "He taught patience, trust in Allah, and steadfastness in worship. "
            "This short demo is for local testing — set OPENAI_API_KEY to generate full stories."
        )
        return jsonify({"story": demo})

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful, respectful assistant who writes clear educational summaries."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=900,
            temperature=0.7,
        )

        story_text = response.choices[0].message.content
        return jsonify({"story": story_text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
