"""Backend API tests for Word→Excel converter (SQLAlchemy + JWT)."""
import io
import os
import pytest
import requests
from docx import Document
from openpyxl import load_workbook

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # read from frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"


def make_docx(title="Doc Title", author="Alice", h1="Intro", h2="Details", body="Hello world."):
    doc = Document()
    doc.core_properties.title = title
    doc.core_properties.author = author
    doc.add_paragraph(title, style="Title")
    doc.add_paragraph(h1, style="Heading 1")
    doc.add_paragraph(body)
    doc.add_paragraph(h2, style="Heading 2")
    doc.add_paragraph("Second body paragraph under H2.")
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.read()


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{API}/auth/login", json={"username": "admin", "password": "admin123"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and data["user"]["username"] == "admin"
    return data["token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# --- Auth ---
class TestAuth:
    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"username": "admin", "password": "wrong"})
        assert r.status_code == 401

    def test_me_unauthenticated(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_authenticated(self, auth_headers):
        r = requests.get(f"{API}/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["username"] == "admin"


# --- Convert / Jobs ---
class TestConvert:
    def test_convert_requires_auth(self):
        r = requests.post(f"{API}/convert", files=[("files", ("a.docx", make_docx(), "application/octet-stream"))])
        assert r.status_code == 401

    def test_convert_single_docx(self, auth_headers):
        content = make_docx(title="T1", author="Bob", h1="H1A", h2="H2A", body="Some body text ABC.")
        files = [("files", ("t1.docx", content, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))]
        r = requests.post(f"{API}/convert", files=files, headers=auth_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["file_count"] == 1
        assert data["row_count"] >= 4
        assert "t1.docx" in data["filenames"]
        # verify heading context forward-fill
        preview = data["preview"]
        body_rows = [p for p in preview if p["Body Text"] == "Some body text ABC."]
        assert body_rows, "body text not found"
        br = body_rows[0]
        assert br["Title"] == "T1"
        assert br["Heading 1"] == "H1A"
        assert br["author"] == "Bob"
        assert br["File Name"] == "t1.docx"
        # second body paragraph under H2 should have Heading 2 populated
        second = [p for p in preview if p["Body Text"] == "Second body paragraph under H2."]
        assert second and second[0]["Heading 2"] == "H2A"
        # store for next test
        pytest.job_id = data["job_id"]

    def test_convert_mixed_valid_and_invalid(self, auth_headers):
        files = [
            ("files", ("good.docx", make_docx(body="Good"), "application/octet-stream")),
            ("files", ("bad.txt", b"not a docx", "text/plain")),
        ]
        r = requests.post(f"{API}/convert", files=files, headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["file_count"] == 1
        assert any(e["filename"] == "bad.txt" for e in data["errors"])

    def test_convert_all_invalid_returns_400(self, auth_headers):
        files = [("files", ("bad.txt", b"nope", "text/plain"))]
        r = requests.post(f"{API}/convert", files=files, headers=auth_headers)
        assert r.status_code == 400


@pytest.fixture(scope="module")
def existing_job_id(auth_headers):
    content = make_docx(body="fixture body")
    r = requests.post(f"{API}/convert", files=[("files", ("fx.docx", content, "application/octet-stream"))], headers=auth_headers)
    assert r.status_code == 200
    return r.json()["job_id"]


class TestJobs:
    def test_list_jobs(self, auth_headers, existing_job_id):
        r = requests.get(f"{API}/jobs", headers=auth_headers)
        assert r.status_code == 200
        jobs = r.json()
        assert isinstance(jobs, list) and len(jobs) >= 1

    def test_get_job(self, auth_headers, existing_job_id):
        r = requests.get(f"{API}/jobs/{existing_job_id}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["job_id"] == existing_job_id

    def test_download_excel(self, auth_headers, existing_job_id):
        job_id = existing_job_id
        r = requests.get(f"{API}/jobs/{job_id}/download", headers=auth_headers)
        assert r.status_code == 200
        assert "spreadsheetml" in r.headers.get("Content-Type", "")
        wb = load_workbook(io.BytesIO(r.content))
        ws = wb.active
        headers_row = [c.value for c in ws[1]]
        for expected in ["File Name", "Document Title", "Author", "Title", "Heading 1", "Heading 2", "Style", "Body Text"]:
            assert expected in headers_row, f"missing {expected} in {headers_row}"
        assert "Summary" in wb.sheetnames

    def test_delete_job(self, auth_headers):
        # create a fresh job then delete
        content = make_docx(body="to-delete")
        r = requests.post(f"{API}/convert", files=[("files", ("del.docx", content, "application/octet-stream"))], headers=auth_headers)
        jid = r.json()["job_id"]
        r = requests.delete(f"{API}/jobs/{jid}", headers=auth_headers)
        assert r.status_code == 200
        r = requests.get(f"{API}/jobs/{jid}", headers=auth_headers)
        assert r.status_code == 404
