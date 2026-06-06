# Deen_Guide
A guide for your deen

## Local development

- Install dependencies:

```bash
python -m pip install -r requirements.txt
```

- Set your OpenAI-compatible API key in the environment (example for PowerShell):

```powershell
$env:OPENAI_API_KEY = "your_api_key_here"
```

- Run the Flask server:

```bash
python index.py
```

The app provides a POST endpoint `/story` which accepts JSON `{ "prophet": "Yusuf" }` and returns a generated full story. Ensure your API key has access to the LLM you intend to use.

## Deploying the frontend to GitHub Pages

- GitHub Pages only serves static sites. The UI in this repo is static HTML/CSS/JS and can be hosted on Pages, but the Python backend (`index.py`) cannot run on Pages.
- Recommended approach: host the frontend on GitHub Pages and host the backend (the `/story` API) on a separate service (Vercel Serverless, Render, Railway, Cloud Run, etc.).

Steps to deploy frontend to Pages:

1. Commit and push your repo to GitHub (e.g. origin/main).
2. In the repository Settings → Pages, set the source to the `main` branch and root (`/`).
3. (Optional) Add a custom domain or use the default `https://<your-username>.github.io/<repo>/` URL.

Configuring the frontend to call your backend:

- After hosting your backend at e.g. `https://api.example.com`, edit `index.html` and set the `meta` tag:

```html
<meta name="backend-url" content="https://api.example.com">
```

- The frontend will then POST to `https://api.example.com/story` when users tap "Read more".

If you prefer an all-in-one hosted solution, consider deploying the whole project (frontend + Flask backend) to a platform that supports Python apps (Render, Railway, Fly.io) instead of GitHub Pages.

## Make the app installable on mobile (PWA)

This project already includes a Web App Manifest (`manifest.webmanifest`) and a Service Worker (`sw.js`). To ensure a smooth "installable" experience on phones:

- Host the frontend over HTTPS (GitHub Pages provides HTTPS).
- Ensure `manifest.webmanifest` is reachable at the root and referenced from `index.html` (already present).
- Use high-resolution icons and a maskable icon (the repo includes `icons/app-icon-192.png`, `icons/app-icon-512.png`, and `icons/maskable-icon.svg`).
- For Android/Chrome: the browser will show an install prompt automatically when criteria are met; the app includes an install button that triggers the native prompt.
- For iOS/Safari: add-to-home-screen is manual — open the site in Safari and choose Share → Add to Home Screen. The app includes an iOS hint banner to guide users.

Tips:
- Test using Lighthouse (in Chrome DevTools Audits) and ensure the PWA checklist passes.
- If hosting on GitHub Pages, set the `meta[name="backend-url"]` in `index.html` to point to your running `/story` API.
- For full offline behavior, verify your Service Worker is registered and caching the app shell (done by `sw.js`).
