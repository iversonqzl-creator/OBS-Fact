# PRD — Word → Excel Batch Converter

## Original Problem Statement
Web app on a cloud server (complete project, not a demo) for a few users to upload Word files (up to 200) and output an Excel file that splits Word parts (Titles, Heading 1, Heading 2) into different columns. Data stored on a SQL server.

## User Choices
- Database: SQL (implemented with SQLAlchemy; SQLite locally, portable to PostgreSQL/MySQL via `DATABASE_URL` on deploy).
- Auth: Simple username/password login (JWT bearer token).
- Output: Upload many Word files → ONE combined Excel with a File Name column.
- Extraction: Capture body/paragraph text AND document core properties.

## Architecture
- Backend: FastAPI + SQLAlchemy (SQLite), python-docx (parse), openpyxl (Excel). JWT auth (bcrypt + PyJWT).
- Frontend: React + Tailwind + shadcn, framer-motion, sonner. Swiss/high-contrast theme (Klein blue primary), Work Sans + IBM Plex Sans, light/dark mode.
- Models: `User`, `ConversionJob` (stores extracted rows as JSON; Excel regenerated on download).

## Personas
- Small team of internal users converting document batches into structured spreadsheets.

## Implemented (2026-07-20)
- Username/password login, admin seeding (admin/admin123), protected routes, logout.
- Drag-and-drop + browse multi-file uploader (max 200 .docx).
- **WANO Field Note extraction (spec-matched to user's real files):**
  - Title from SharePoint `Word-Title` customXml prop (fallback: first Heading 1).
  - Scope = paragraph after the SCOPE heading.
  - Facts under OBSERVATIONS: level-0 = main (1,2,3…), level-1 = sub (1.a,1.b…), renumbered per file.
  - `@keyword@area` stripped from body; body gets `#{Reviewer}-{FileNo}_{Fact#}` suffix.
  - Sub-facts inherit parent Keyword/Area.
  - Team Area = custom `Area`; Reviewer = `Area`+`UserCode`; FileNo from customXml.
  - Excel columns: Fact# | Facts | Title | Scope | File Name | Keyword | Area | Team Area | Reviewer (sheet "Facts").
- Combined Excel download; job history (list, re-download, delete).
- **Verified: generated Excel is an exact value-match to the user's expected Package.xlsx (0 mismatches, live API e2e).**

## Backlog
- P1: Column mapping fine-tuning once user shares real sample Word + expected Excel.
- P1: 401 axios interceptor for auto-logout on token expiry.
- P2: User management UI (add/remove users) for admins.
- P2: Client-side pre-filter of non-.docx; optional .doc → .docx conversion.
- P2: Per-file Excel + zip download option.

## Next Tasks
- Await user's sample Word + expected Excel to align exact column structure.
