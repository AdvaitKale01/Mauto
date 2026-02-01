#!/bin/bash

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$BASE_DIR/.mauto_pids"
VENV_ACTIVATE="$BASE_DIR/.venv/bin/activate"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

start() {
    if [ -f "$PID_FILE" ]; then
        echo -e "${RED}Mauto appears to be running (PIDs file exists). Run './control.sh stop' first.${NC}"
        exit 1
    fi

    echo -e "${BLUE}Starting Mauto...${NC}"

    # 1. Activate Venv
    if [ ! -f "$VENV_ACTIVATE" ]; then
        echo -e "${RED}Virtual environment not found at $VENV_ACTIVATE${NC}"
        exit 1
    fi
    source "$VENV_ACTIVATE"

    # 2. Start Backend
    echo -e "  - Starting Backend (FastAPI)..."
    nohup uvicorn src.api:app --host 0.0.0.0 --port 8000 > "$BASE_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo "    Started with PID $BACKEND_PID"

    # 3. Start Frontend
    echo -e "  - Starting Frontend (Vite)..."
    cd "$BASE_DIR/ui" || exit
    nohup npm run dev > "$BASE_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo "    Started with PID $FRONTEND_PID"
    cd "$BASE_DIR"

    # Save PIDs
    echo "$BACKEND_PID" > "$PID_FILE"
    echo "$FRONTEND_PID" >> "$PID_FILE"

    echo -e "${GREEN}Mauto is running!${NC}"
    echo -e "  - Backend: http://localhost:8000"
    echo -e "  - Frontend: http://localhost:5173"
    echo -e "To stop, run: ./control.sh stop"
}

stop() {
    if [ ! -f "$PID_FILE" ]; then
        echo -e "${RED}No running instance found (.mauto_pids missing).${NC}"
        return
    fi

    echo -e "${BLUE}Stopping Mauto...${NC}"
    
    while read -r pid; do
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid"
            echo "  - Killed PID $pid"
        else
            echo "  - PID $pid not found (already dead?)"
        fi
    done < "$PID_FILE"

    rm "$PID_FILE"
    echo -e "${GREEN}Stopped successfully.${NC}"
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        start
        ;;
    *)
        echo "Usage: $0 {start|stop|restart}"
        exit 1
        ;;
esac
