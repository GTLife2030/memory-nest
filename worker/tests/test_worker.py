import io

import pytest
from fastapi.testclient import TestClient
from pypdf import PdfReader

from app.main import app, render_smoke

client = TestClient(app)


@pytest.fixture(autouse=True)
def token(monkeypatch):
    monkeypatch.setenv("WORKER_TOKEN", "test-token")


def test_health_is_open_and_reports_ffmpeg():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "ffmpeg" in response.json()


def test_render_requires_the_worker_token():
    assert client.post("/render/smoke", json={}).status_code == 401
    assert client.post("/render/smoke", json={}, headers={"Authorization": "Bearer wrong"}).status_code == 401


def test_render_fails_closed_without_configured_token(monkeypatch):
    monkeypatch.delenv("WORKER_TOKEN")
    assert client.post("/render/smoke", json={}, headers={"Authorization": "Bearer "}).status_code == 401


def test_smoke_render_returns_a_one_page_a5_pdf_with_the_text():
    response = client.post(
        "/render/smoke",
        json={"title": "Truus vertelt", "paragraph": "Om vier uur 's ochtends rook het huis naar brood."},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    reader = PdfReader(io.BytesIO(response.content))
    assert len(reader.pages) == 1
    page = reader.pages[0]
    assert round(float(page.mediabox.width) / 72 * 25.4) == 148
    assert round(float(page.mediabox.height) / 72 * 25.4) == 210
    text = page.extract_text()
    assert "Truus vertelt" in text and "brood" in text


def test_user_text_is_escaped_and_cannot_load_resources():
    pdf = render_smoke('<img src="file:///etc/passwd">', "<script>alert(1)</script> & meer")
    text = PdfReader(io.BytesIO(pdf)).pages[0].extract_text()
    assert "<script>" in text and "& meer" in text and "root:" not in text


def test_overlong_input_is_rejected():
    response = client.post(
        "/render/smoke", json={"title": "x" * 500}, headers={"Authorization": "Bearer test-token"}
    )
    assert response.status_code == 422
