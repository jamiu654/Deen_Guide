from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os

app = Flask(__name__)
CORS(app)  # Allow frontend to call backend

# Set your API key (use environment variable in production)
openai.api_key = os.getenv("OPENAI_API_KEY", "your-key-here")

@app.route("/chat", methods=["POST"]) 
def chat():
    data = request.get_json()
    user_message = data.get("message", "")
    
    if not user_message:
        return jsonify({"error": "No message provided"}), 400
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Be concise, friendly, and able to discuss a wide range of topics."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=500
        )

        bot_reply = response["choices"][0]["message"]["content"]
        return jsonify({"reply": bot_reply})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Bind to 0.0.0.0 so devices on your local network (e.g., phone) can access the dev server.
    # Note: Allow Python/port 5000 through your firewall.
    app.run(debug=True, host='0.0.0.0', port=5000)
