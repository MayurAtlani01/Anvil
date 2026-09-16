# Anvil Backend API

Robust, high-performance, and beginner-readable backend powering the **Anvil Chrome Extension**. Built with **Python 3.13, FastAPI, PostgreSQL, SQLAlchemy, and Pydantic**.

---

## 🌟 Architecture & Features

- **FastAPI Core**: Async REST API with automatic OpenAPI Swagger documentation (`/docs`) and schema validation.
- **Three Mode Isolation**:
  - **Reading Mode**: Notes, Annotations/Highlights, Text-to-Speech tracking, Article summarization, and dictionary definitions.
  - **Exam Mode**: Previous Year Questions (PYQs), Formula Repository with symbol definitions, and Revision Notes.
  - **Interview Mode**: Practice tracks (DSA, System Design, Core Tech, Behavioral), Interactive Mock Sessions, Scoring, and Resume Analysis.
- **Unified Subsystems**:
  - **SuperMemo SM-2 Spaced Repetition**: Flashcards review queue and interval calculation.
  - **Bookmarks**: Mode-differentiated unified bookmarks.
  - **Study Analytics**: Real duration tracking, active streaks, and mastery stats.
- **Security & Auth**:
  - Password hashing with `bcrypt` (compatible with Python 3.13 without deprecated `crypt` dependencies).
  - JWT Bearer authentication (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`).
  - Optional auth support so extension users can operate in guest mode or synced account mode.
- **AI Abstraction**: Clean provider interface (`gemini` / `openai`). When an external API key is unconfigured, endpoints return a clean HTTP 503 rather than fake/mock data.
- **Zero Mock Data Policy**: Empty database states return empty arrays (`[]`), adhering strictly to real persistent application state.

---

## 🚀 Quick Start

### 1. Create and Activate Virtual Environment

```powershell
# From the backend/ directory
python -m venv .venv

# Activate on Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

### 2. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```powershell
cp .env.example .env
```

Edit `.env` to configure your PostgreSQL connection string:

```ini
# PostgreSQL (Default)
DATABASE_URL=postgresql+psycopg://postgres:your_password@localhost:5432/anvil_db

# Or SQLite for quick local development
# DATABASE_URL=sqlite:///./anvil.db

# JWT Security
SECRET_KEY=your-secure-secret-key-at-least-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Allowed CORS Origins
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,chrome-extension://*

# AI Provider (Optional: leave empty if not using external LLM)
AI_API_KEY=
AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-flash
```

### 4. PostgreSQL Database Setup

Create the database in PostgreSQL if it doesn't already exist:

```sql
CREATE DATABASE anvil_db;
```

SQLAlchemy automatically creates all tables on server startup.

### 5. Run the Server

```powershell
uvicorn app.main:app --reload --port 8000
```

The server starts at `http://localhost:8000`.

---

## 📖 API Documentation & Swagger

Once the server is running, visit:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI Schema**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🧪 Testing

Run the automated pytest suite:

```powershell
pytest -v
```

The test suite validates:
- Health and status endpoints
- User registration, login, and JWT protected routes
- Full CRUD for bookmarks, notes, annotations, and flashcards
- SM-2 spaced repetition interval computation
- Mode isolation (ensuring exam resources never mix with interview resources)
- Clean HTTP 503 handling when AI keys are unconfigured (Zero mock data)

---

## 🔌 Connecting to the Anvil Chrome Extension

1. Open the Anvil Side Panel in Chrome.
2. Click the **Settings** gear icon in the top header.
3. In **Backend API URL**, enter:
   ```
   http://localhost:8000
   ```
4. Click **Save Settings**.
5. All notes, bookmarks, flashcards, questions, and progress now sync directly to your local FastAPI backend and database!
