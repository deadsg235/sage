# SAGE Chat Visualizer

This project implements a chat-based visualizer for the SAGE avatar. It's built using Flask for the backend and integrates with Google's Generative AI (Gemini API) for conversational capabilities. The frontend provides a simple chat interface where users can interact with Sage.

## Project Idea

The core idea behind the SAGE Chat Visualizer is to create an interactive experience where users can communicate with an AI-powered avatar named Sage. This initial application focuses on establishing the foundational chat capabilities and visual representation of Sage. Future iterations are planned to integrate a Deep Q-Network (DQN) core, allowing Sage to learn and adapt its responses based on interactions, making the conversation more dynamic and personalized.

## Features

*   **Chat Interface:** A user-friendly web interface for real-time chat with Sage.
*   **Sage Avatar:** Visual representation of the Sage avatar (`sage.png`).
*   **AI-Powered Responses:** Integration with Google's Generative AI (Gemini API) to provide intelligent and contextually relevant responses.
*   **Python-based Backend:** Built with Flask, offering a lightweight and flexible web framework.

## Setup and Installation

To set up and run the SAGE Chat Visualizer locally, follow these steps:

### 1. Clone the Repository

```bash
git clone <repository_url>
cd sage
```

*(Note: Replace `<repository_url>` with the actual URL of your repository if applicable. For this task, assume the project is already in the current directory.)*

### 2. Set up a Virtual Environment (Recommended)

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Obtain Google Generative AI API Key

To enable the AI chat capabilities, you need a Google Generative AI API key:

1.  Go to the Google AI Studio website: [https://aistudio.google.com/](https://aistudio.google.com/)
2.  Sign in with your Google account.
3.  Create a new project or select an existing one.
4.  In the left navigation panel, click on 'Get API key'.
5.  Click 'Create API key in new project' or 'Create API key' to generate your API key.
6.  Copy the generated API key.

### 5. Set the API Key as an Environment Variable

Before running the application, set your API key as an environment variable named `GOOGLE_API_KEY`.

**On Linux/macOS:**

```bash
export GOOGLE_API_KEY="YOUR_API_KEY"
```

**On Windows (Command Prompt):**

```bash
set GOOGLE_API_KEY="YOUR_API_KEY"
```

**On Windows (PowerShell):**

```powershell
$env:GOOGLE_API_KEY="YOUR_API_KEY"
```

*(Note: Replace `YOUR_API_KEY` with the actual API key you obtained.)*

### 6. Run the Application

```bash
python3 app.py
```

The application will start, and you can access it in your web browser at `http://127.0.0.1:5000/`.

## Project Structure

```
sage/
├── app.py                  # Flask application logic
├── requirements.txt        # Python dependencies
├── templates/
│   └── index.html          # HTML template for the chat interface
└── static/
    ├── images/
    │   └── sage.png        # Sage avatar image
    ├── style.css           # CSS for styling the chat interface
    └── chat.js             # JavaScript for frontend chat logic
```

## Future Enhancements

*   **DQN Core Integration:** Integrate a Deep Q-Network to allow Sage to learn and improve its conversational abilities over time.
*   **Enhanced UI/UX:** Further refine the user interface and user experience.
*   **Conversation History:** Implement persistence for chat history.
*   **Voice Interface:** Add speech-to-text and text-to-speech capabilities.
