# Worker

FastAPI service for work that does not belong in the web app: book and PDF rendering
(WeasyPrint), image processing and audio stitching (ffmpeg).

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
pytest -q
WORKER_TOKEN=dev uvicorn app.main:app --port 8080
```

Every endpoint except `/health` needs `Authorization: Bearer $WORKER_TOKEN`. Without a
configured token the worker refuses all requests.
