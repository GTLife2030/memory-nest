"""Memory Nest worker: book/PDF rendering, image processing and audio stitching.

Phase 0 is a skeleton: a health check and a smoke render that proves WeasyPrint and the book
typeface work in the deployed image. Real templates arrive in phase 3.
"""

from __future__ import annotations

import hmac
import os
import shutil

from fastapi import Depends, FastAPI, Header, HTTPException, Response
from pydantic import BaseModel, Field
from weasyprint import HTML

app = FastAPI(title="Memory Nest worker", docs_url=None, redoc_url=None, openapi_url=None)


def require_token(authorization: str | None = Header(default=None)) -> None:
    """Every endpoint except /health requires the shared worker token.

    The worker fails closed: without WORKER_TOKEN configured it refuses all render requests.
    """
    expected = os.environ.get("WORKER_TOKEN", "")
    supplied = (authorization or "").removeprefix("Bearer ").strip()
    if not expected or not hmac.compare_digest(supplied.encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="unauthorized")


class SmokeRequest(BaseModel):
    title: str = Field(default="Truus vertelt", max_length=120)
    paragraph: str = Field(
        default="Mijn vader had een bakkerij aan de Heuvel in Tilburg.", max_length=2000
    )


SMOKE_TEMPLATE = """<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><style>
@page {{ size: 148mm 210mm; margin: 22mm 18mm; @bottom-center {{ content: counter(page); font-size: 9pt; }} }}
body {{ font-family: "EB Garamond", "Literata", Georgia, serif; font-size: 12pt; line-height: 1.5;
       color: #2E2A26; hyphens: auto; }}
h1 {{ font-weight: 500; font-size: 26pt; margin: 30mm 0 12mm; }}
</style></head><body><h1>{title}</h1><p>{paragraph}</p></body></html>"""


def escape(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def render_smoke(title: str, paragraph: str) -> bytes:
    html = SMOKE_TEMPLATE.format(title=escape(title), paragraph=escape(paragraph))
    # No base_url and no URL fetcher access: user text can never make the renderer load a file or URL.
    return HTML(string=html, url_fetcher=_deny_fetch).write_pdf()


def _deny_fetch(url: str, *args, **kwargs):
    raise ValueError(f"external resources are not allowed in renders: {url}")


@app.get("/health")
def health() -> dict[str, object]:
    return {"status": "ok", "ffmpeg": shutil.which("ffmpeg") is not None}


@app.post("/render/smoke", dependencies=[Depends(require_token)])
def smoke(request: SmokeRequest) -> Response:
    return Response(content=render_smoke(request.title, request.paragraph), media_type="application/pdf")
