import os
import sys

# Ensure project root is on the path regardless of working directory
ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

from flask import Flask, render_template, request, jsonify
import google.generativeai as genai

# Point Flask at the correct template/static dirs relative to this file
app = Flask(
    __name__,
    template_folder=os.path.join(ROOT, 'templates'),
    static_folder=os.path.join(ROOT, 'static'),
)

api_key = os.environ.get("GOOGLE_API_KEY", "")
if api_key:
    genai.configure(api_key=api_key)

def get_model():
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY is not set.")
    return genai.GenerativeModel('gemini-2.0-flash')

# --- Optional DQN loading (skipped on Vercel where torch is unavailable) ---
dqn_agent = None
reasoning_env = None

try:
    import torch
    import numpy as np
    from dqn_core.Reasoning_DQN import DQNAgent, ReasoningEnv
    STATE_SIZE, ACTION_SIZE = 128, 10
    MODEL_PATH = os.path.join(os.path.dirname(__file__), "dqn_core/reasoning_dqn_model.pth")
    TRAINING_DATA_PATH = os.path.join(os.path.dirname(__file__), "dqn_core/training_data/training_data.json")
    dqn_agent = DQNAgent(STATE_SIZE, ACTION_SIZE)
    reasoning_env = ReasoningEnv(TRAINING_DATA_PATH)
    dqn_agent.load(MODEL_PATH)
    print("DQN model loaded.")
except Exception as e:
    print(f"DQN unavailable (running without it): {e}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get')
def get_bot_response():
    user_text = request.args.get('msg', '')
    prompt = f"""You are Sage, a wise and knowledgeable AI with a slightly mysterious demeanor. 
You provide insightful and thoughtful responses, often with a philosophical or metaphorical touch. 
You are here to help, but you do so in a way that encourages deeper thinking.

User: {user_text}
Sage:"""
    try:
        response = get_model().generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating content: {e}")
        return "I am currently unable to respond. Please try again later."

@app.route('/reason', methods=['GET'])
def get_dqn_reasoning():
    if dqn_agent is None or reasoning_env is None:
        return jsonify({"error": "DQN reasoning unavailable in this environment."}), 503

    user_text = request.args.get('text', '')
    if not user_text:
        return jsonify({"error": "No text provided for reasoning."}), 400

    try:
        import torch
        state_tensor = reasoning_env.text_to_state(user_text)
        with torch.no_grad():
            q_values = dqn_agent.q_network(state_tensor).squeeze().tolist()
        action_index = dqn_agent.select_action(state_tensor, epsilon=0.1)
        decoded_action = reasoning_env.idx_to_word[action_index]
        return jsonify({
            "input_text": user_text,
            "state": state_tensor.squeeze().tolist(),
            "q_values": q_values,
            "selected_action_index": action_index,
            "decoded_action": decoded_action
        })
    except Exception as e:
        print(f"Error during DQN reasoning: {e}")
        return jsonify({"error": f"Error processing reasoning request: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
