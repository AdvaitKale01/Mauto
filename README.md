# Mauto 🚀
**Minimalist AI Email Assistant for macOS**

Mauto is a local AI agent that connects to your Gmail, syncs your Sent items, and uses a powerful local LLM (via MLX) to generate intelligent follow-up drafts. It features a modern, minimalist Material UI.

![Mauto UI](./ui/public/screenshot.png) *(You can add a screenshot here)*

## ✨ Features
- **Local AI Power**: Runs completely offline using Apple Silicon (MLX).
- **Gmail Sync**: Fetches and threads your sent emails locally.
- **Smart Follow-ups**: Generates context-aware follow-up drafts in seconds.
- **Material Minimalist UI**: Clean, distraction-free interface.
- **Privacy First**: Your emails and AI generation never leave your device (except to cache the open-source model weights).

## 🛠️ Technology Stack
- **Backend**: Python (FastAPI, SQLite, Google Auth)
- **AI Engine**: Apple MLX (`mlx-lm`) running `Qwen2.5-14B-Instruct`
- **Frontend**: React (Vite), TailwindCSS, Lucide Icons

## 🚀 Getting Started

### Prerequisites
- macOS with Apple Silicon (M1/M2/M3).
- Python 3.10+
- Node.js & npm via homebrew (`brew install node`)

### Installation

1.  **Clone & Setup Backend**
    ```bash
    # Install Python dependencies
    pip install -r requirements.txt
    ```

2.  **Setup Frontend**
    ```bash
    cd ui
    npm install
    cd ..
    ```

3.  **Google Credentials**
    - Create a project in [Google Cloud Console](https://console.cloud.google.com/).
    - Enable the **Gmail API**.
    - Create **OAuth 2.0 Client IDs** (Desktop App).
    - Download JSON and save as `credentials.json` in the root folder.

### Running Mauto

Use the included control script to handle everything:

```bash
# Start Backend & Frontend
./control.sh start

# Stop everything
./control.sh stop
```

Access the app at: **http://localhost:5173**

## 🏗️ Architecture
- `src/api.py`: FastAPI server handling storage and AI requests.
- `src/ai_engine.py`: MLX model loader and inference logic.
- `src/gmail_client.py`: Handles OAuth and email fetching.
- `emails.db`: Local SQLite database storing your data.
