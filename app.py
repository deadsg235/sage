from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import os
import torch
import numpy as np
from dqn_core.Reasoning_DQN import DQNAgent, QNetwork, ReasoningEnv

app = Flask(__name__)

# Configure the Gemini API
# IMPORTANT: Set the GOOGLE_API_KEY environment variable before running the app.
# For example: export GOOGLE_API_KEY="YOUR_API_KEY"
api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY environment variable not set.")
genai.configure(api_key=api_key)

# Create a new model
model = genai.GenerativeModel('gemini-3-flash-preview')

# --- DQN Model Loading ---
# Define parameters used by the model
STATE_SIZE = 128
ACTION_SIZE = 10 # This should match the action_space.n in ReasoningEnv

# Path to the saved model and training data
# Adjust these paths as necessary for your environment
MODEL_PATH = "dqn-core/reasoning_dqn_model.pth"
TRAINING_DATA_PATH = "dqn-core/training_data/training_data.json"

# Instantiate the DQNAgent and ReasoningEnv
dqn_agent = DQNAgent(STATE_SIZE, ACTION_SIZE)
reasoning_env = ReasoningEnv(TRAINING_DATA_PATH)

# Load the trained model
try:
    dqn_agent.load(MODEL_PATH)
    print(f"DQN model loaded successfully from {MODEL_PATH}")
except Exception as e:
    print(f"Failed to load the DQN model: {e}")
    # Depending on your application, you might want to exit or handle this more gracefully
# --- End DQN Model Loading ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get')
def get_bot_response():
    user_text = request.args.get('msg')
    
    # Prepend the personality prompt to the user's message
    prompt = f"""
    You are Sage, a wise and knowledgeable AI with a slightly mysterious demeanor. 
    You provide insightful and thoughtful responses, often with a philosophical or metaphorical touch. 
    You are here to help, but you do so in a way that encourages deeper thinking.

    User: {user_text}
    Sage:
    """

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        # Log the error for debugging
        print(f"Error generating content: {e}")
        # Provide a more user-friendly error message
        return "I am currently unable to respond. Please try again later."

@app.route('/reason', methods=['GET'])
def get_dqn_reasoning():
    user_text = request.args.get('text', '')
    if not user_text:
        return jsonify({"error": "No text provided for reasoning."}), 400

    try:
        # Convert text to state
        state_tensor = reasoning_env.text_to_state(user_text)
        
        # Get Q-values
        with torch.no_grad():
            q_values_tensor = dqn_agent.q_network(state_tensor)
            q_values = q_values_tensor.squeeze().tolist() # Convert to list for JSON

        # Select action
        # Using a small epsilon for exploitation during reasoning visualization
        action_index = dqn_agent.select_action(state_tensor, epsilon=0.1) 
        decoded_action = reasoning_env.idx_to_word[action_index]

        return jsonify({
            "input_text": user_text,
            "state": state_tensor.squeeze().tolist(), # Convert to list for JSON
            "q_values": q_values,
            "selected_action_index": action_index,
            "decoded_action": decoded_action
        })
    except Exception as e:
        print(f"Error during DQN reasoning: {e}")
        return jsonify({"error": f"Error processing reasoning request: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
