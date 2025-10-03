# GigChain.io Documentation

Welcome to the GigChain.io documentation. This repo contains a FastAPI backend and a React (Vite) frontend for AI-powered contract generation, wallet validation, and multi-agent chat.

## Running locally

- Backend (FastAPI):
  - Ensure dependencies: `pip install -r requirements.txt`
  - Start server: `python main.py` (defaults to port 5000)
  - Health check: `curl http://localhost:5000/health`
  - Interactive docs: open `http://localhost:5000/docs`

- Frontend (Vite): see `frontend/README` if present, or run with your preferred flow. The app points to API base `http://localhost:5000` by default via `VITE_API_URL`.

## Documentation index

- Backend
  - API Reference: [backend/api.md](backend/api.md)
  - Public Functions and Modules: [backend/functions.md](backend/functions.md)

- Frontend
  - React Components and Utilities: [frontend/components.md](frontend/components.md)

- Examples
  - Quickstart and cURL/JS snippets: [examples.md](examples.md)

## Conventions

- Base URL: `http://localhost:5000`
- JSON requests use `Content-Type: application/json`
- All times are ISO-8601 unless specified
- Error payloads include `error` or FastAPI `detail`

## Repository map

- Backend (FastAPI): `main.py`
- Agents and AI logic: `agents.py`, `contract_ai.py`, `chat_ai.py`
- Template security: `security/template_security.py`
- Frontend (React): `frontend/src/*.jsx`

