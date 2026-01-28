# 🌾 Harvest Tutor Backend (Production)

This is the cleanup-up, production-ready backend for Harvest Tutor.

## 🚀 How to Deploy on Render

1.  **Create Web Service** on Render.
2.  **Repo**: `Harverst-Tutor`.
3.  **Root Directory**: `backend` (⚠️ Crucial!)
4.  **Runtime**: Python 3
5.  **Build Command**: `pip install -r requirements.txt`
6.  **Start Command**: `uvicorn backend_server:app --host 0.0.0.0 --port 10000`
7.  **Environment Variables**:
    - `API_KEY`: Your Gemini API Key
    - `PYTHON_VERSION`: `3.9.18`

## 🧪 Local Testing

1.  Go to backend folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Run Server:
    ```bash
    uvicorn backend_server:app --reload --port 8000
    ```

## 🏗️ Structure
- `backend_server.py`: Stable FastAPI server
- `models/`: Teachable Machine models
- `requirements.txt`: Render-compatible dependencies
