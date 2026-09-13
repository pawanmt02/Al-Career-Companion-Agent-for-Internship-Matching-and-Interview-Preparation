# AI Career Companion Agent

An AI-powered career companion that helps students and early-career developers find internships, improve their resumes, prepare for interviews, and manage applications from one workspace.

## What It Does

After creating an account, a user can:

1. Upload a PDF or DOCX resume for text extraction, structured profile parsing, and internship matching.
2. Review recommended internships using semantic similarity scores and apply to opportunities in the dashboard.
3. Generate an internship-specific cover letter and track application status.
4. Analyze a resume for ATS keywords, strengths, gaps, and improvement suggestions.
5. Generate role-specific interview questions, run a mock interview, and review answers.
6. Upload other documents and ask questions against their extracted, chunked text.
7. Use the career chatbot for resume, job-search, and interview guidance.

## Features

- User registration, login, JWT authentication, profile management, and password changes
- Resume upload, parsing, skill extraction, profile auto-fill, and persistence in SQLite
- Internship browsing, Sentence Transformer semantic matching, and application tracking
- Internship-specific cover-letter generation
- Resume ATS analysis and improvement feedback
- Interview question generation and mock interview practice
- Document upload, retrieval-based Q&A, and generated document questions
- Career chatbot with suggested prompts
- React interface with protected routes, lazy-loaded pages, animations, and toast feedback

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, SQLite, Uvicorn
- **AI/NLP:** Sentence Transformers, scikit-learn cosine similarity, retrieval-based document Q&A
- **Authentication:** JWT, bcrypt, OAuth2 bearer tokens
- **Document parsing:** PyMuPDF for PDF files and python-docx for Word files
- **Frontend:** React 18, Vite, React Router, Axios, Framer Motion, react-hot-toast

## Project Structure

```text
.
├── internship_rag_system.py   # FastAPI application, models, and API endpoints
├── tokenization_rag.py        # Tokenization and retrieval utilities
├── airesume.db                # Local SQLite database created on startup
├── LICENSE                    # MIT license
└── frontend/
	├── package.json           # Frontend scripts and dependencies
	└── src/
		├── api/               # Axios API client
		├── components/        # Shared UI and auth components
		├── context/           # Authentication state
		└── pages/             # Dashboard and feature pages
```

## Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- npm

## Quick Start

### 1. Start the backend

From the repository root, create and activate a virtual environment and install the Python dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install fastapi uvicorn sqlalchemy python-multipart "pydantic[email]" passlib bcrypt "python-jose[cryptography]" numpy scikit-learn sentence-transformers pymupdf python-docx
```

Start the API:

```powershell
uvicorn internship_rag_system:app --reload
```

The backend runs at `http://127.0.0.1:8000`. The SQLite database is created automatically as `airesume.db` on first startup.

### 2. Start the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in a browser. The frontend API client currently connects to `http://127.0.0.1:8000`.

Create a production frontend build with:

```powershell
npm run build
```

Preview the production build locally with:

```powershell
npm run preview
```

## API Documentation

With the backend running, interactive API documentation is available at:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

Main API groups include `/auth`, `/users`, `/internships`, `/applications`, `/resume`, `/mock-interview`, `/documents`, and `/chatbot`.

## Configuration

The backend reads these optional environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `JWT_SECRET_KEY` | Random key per process | Secret used to sign access tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Access-token lifetime |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated CORS origins |

For PowerShell:

```powershell
$env:JWT_SECRET_KEY = "replace-with-a-long-random-secret"
$env:ACCESS_TOKEN_EXPIRE_MINUTES = "60"
$env:ALLOWED_ORIGINS = "http://localhost:5173"
uvicorn internship_rag_system:app --reload
```

The frontend API URL is defined in `frontend/src/api/axiosClient.js`. Update it when the backend is hosted outside the local development environment.

## Upload Limits and Supported Files

- Resume and document uploads support PDF and DOCX files.
- The backend limits uploaded files to 5 MB.
- Uploaded content is parsed and stored for the authenticated user; do not upload confidential documents to an untrusted deployment.

## Troubleshooting

- **Frontend cannot reach the API:** Confirm Uvicorn is running on port `8000`, then check the URL in `frontend/src/api/axiosClient.js` and the backend `ALLOWED_ORIGINS` value.
- **Tokens stop working after a restart:** Set `JWT_SECRET_KEY`; without it, the development server generates a new signing key on startup.
- **Dependency installation is slow:** `sentence-transformers` downloads its embedding model the first time the matching service is used.
- **Port already in use:** Start Uvicorn or Vite on another port and update the frontend API/CORS configuration accordingly.

## Security Notes

Before deploying publicly, use a persistent secret from environment or secret management, restrict `ALLOWED_ORIGINS` to trusted domains, use HTTPS, and move SQLite to a production database if concurrent usage grows.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
