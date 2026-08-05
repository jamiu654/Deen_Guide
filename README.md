# Deen_Guide

A guide for your deen, now converted to a React frontend and Django backend using API endpoints.

## Local development

### Backend

1. Change into the backend folder:

```bash
cd backend
```

2. Install Python dependencies:

```bash
python -m pip install -r requirements.txt
```

3. Set your OpenAI API key in the environment:

```powershell
$env:OPENAI_API_KEY = "your_api_key_here"
```

4. Run the Django development server:

```bash
python manage.py runserver 8000
```

5. The backend API will be available at `http://localhost:8000/api/chat/` and `http://localhost:8000/api/story/`.

### Frontend

1. Change into the Vite frontend folder:

```bash
cd frontend-vite
```

2. Install Node dependencies:

```bash
npm install
```

3. Start the Vite development server:

```bash
npm run dev -- --host 127.0.0.1
```

4. Open the app in your browser at `http://localhost:5173`.

### Environment configuration

To use a different backend URL in the Vite app, create a `.env` file inside `frontend-vite/` with:

```env
VITE_API_BASE=http://localhost:8000
```

## Project structure

- `backend/` - Django API service
- `frontend-vite/` - active Vite React SPA
- `frontend/` - legacy CRA copy kept for reference; the Vite app is now the main frontend path

## Deployment notes

- Deploy `backend/` as a Python app; use the provided `backend/Dockerfile`.
- Deploy `frontend-vite/` as a static Vite site after building with `npm run build`.
- Configure CORS or environment variables so the frontend app can access the Django backend.

## API endpoints

- `POST /api/chat/` expects `{ "message": "..." }` and returns `{ "reply": "..." }`
- `POST /api/story/` expects `{ "prophet": "Yusuf" }` and returns `{ "story": "..." }`
