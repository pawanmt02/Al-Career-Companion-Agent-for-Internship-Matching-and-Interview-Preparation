# AI Career Companion Agent

An AI-powered career companion for internship matching, resume analysis, application tracking, cover-letter generation, document Q&A, and interview preparation.

## Features

- User registration, login, JWT authentication, and password changes
- Resume upload and structured profile extraction
- Internship browsing, semantic matching, and application tracking
- AI-generated internship cover letters
- Resume analysis with improvement feedback
- Interview question generation and mock interview practice
- Document upload with chunked question answering
- Career chatbot with suggested prompts
- React interface with animated page transitions and protected routes

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, SQLite
- **AI/NLP:** Sentence Transformers, scikit-learn cosine similarity
- **Authentication:** JWT, bcrypt
- **Document parsing:** PyMuPDF and python-docx
- **Frontend:** React 18, Vite, React Router, Axios, Framer Motion

## Project Structure

```text
.
├── internship_rag_system.py   # FastAPI application and API endpoints
├── tokenization_rag.py        # RAG/tokenization utilities
├── airesume.db                # Local SQLite database created by the backend
└── frontend/                  # React + Vite application
```

## Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- npm

## Backend Setup

Create and activate a virtual environment, then install the backend dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install fastapi uvicorn sqlalchemy python-multipart pydantic[email] passlib bcrypt python-jose[cryptography] numpy scikit-learn sentence-transformers pymupdf python-docx
```

Start the API from the repository root:

```powershell
uvicorn internship_rag_system:app --reload
```

The API runs at `http://127.0.0.1:8000`.

Interactive API documentation is available at:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

The SQLite database is created automatically as `airesume.db` on first startup.

## Frontend Setup

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and connects to the backend at `http://127.0.0.1:8000`.

To create a production build:

```powershell
npm run build
```

## Configuration Notes

The current development configuration stores the SQLite database locally and uses a development JWT secret in `internship_rag_system.py`. Set a strong secret and move credentials to environment variables before deploying this application publicly.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
