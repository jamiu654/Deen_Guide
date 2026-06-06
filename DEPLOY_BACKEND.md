Backend deployment guide
========================

This file lists simple deployment options for the Flask backend (`index.py`) that provides the `/story` API.

1) Render (recommended quick option)
-----------------------------------
- Create a new Web Service on Render and connect your GitHub repository.
- Build command: leave empty (Render will run pip install automatically) or set to `pip install -r requirements.txt`.
- Start command: `gunicorn index:app --bind 0.0.0.0:$PORT`
- Environment variables: set `OPENAI_API_KEY` to your API key.

2) Railway
----------
- Create a new project, link your GitHub repo, and choose 'Python' (or Docker if you prefer).
- Use the same start command: `gunicorn index:app --bind 0.0.0.0:$PORT`.
- Add `OPENAI_API_KEY` as an environment variable in Railway settings.

3) Cloud Run (Google Cloud)
---------------------------
- Build the Dockerfile included in this repo and push the image to Container Registry.
- Deploy to Cloud Run exposing port 8080. Set `OPENAI_API_KEY` environment variable.

4) Quick local run (for testing)
--------------------------------
```bash
python -m pip install -r requirements.txt
set OPENAI_API_KEY=your_key_here  # Windows CMD
# or PowerShell: $env:OPENAI_API_KEY = "your_key_here"
python index.py
```

After deployment
----------------
- Note the public URL (e.g. `https://your-app.onrender.com`) and set `meta[name="backend-url"]` in `index.html` to that URL so the frontend on GitHub Pages will call the hosted API.
