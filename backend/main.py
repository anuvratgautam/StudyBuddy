# backend/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from .agent import run_agent
from .pdf_handler import (
    add_document,
    list_documents,
    clear_user_database,
    delete_document_by_name,
    cleanup_old_documents,
)
import shutil
import os
import traceback

# optional DB imports
try:
    from .db import init_db, engine
    from .models import UploadLog
    DB_AVAILABLE = True
except Exception:
    DB_AVAILABLE = False

app = FastAPI(title="Student Helper API")

# ---- CORS (allow frontend origins during development) ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ---------------------------------------------------------

TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp_files")
os.makedirs(TEMP_DIR, exist_ok=True)

class Query(BaseModel):
    question: str

class Answer(BaseModel):
    answer: str
    tool_used: Optional[str] = None  # tool used by the agent

@app.on_event("startup")
async def startup_event():
    # initialize DB if available
    if DB_AVAILABLE:
        init_db()
    # cleanup old documents from vector DB
    cleanup_old_documents(days_limit=30)

@app.get("/")
def home():
    return {"message": "Student Helper API Running"}

@app.post("/ask", response_model=Answer)
def ask_question(
    query: Query,
    x_user_id: Optional[str] = Header("default_user", alias="X-User-ID"),
):
    try:
        # run_agent now returns a dict like {"answer": "...", "tool_used": "..."}
        response_data = run_agent(query.question, user_id=x_user_id)
        return response_data
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    x_user_id: Optional[str] = Header("default_user", alias="X-User-ID"),
):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    file_path = os.path.join(TEMP_DIR, file.filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result_message = add_document(file.filename, user_id=x_user_id)

        if "Error" in result_message:
            raise HTTPException(status_code=500, detail=result_message)

        # Log upload to SQLite if DB available
        if DB_AVAILABLE:
            try:
                from sqlmodel import Session
                with Session(engine) as session:
                    log = UploadLog(user_id=x_user_id, filename=file.filename)
                    session.add(log)
                    session.commit()
            except Exception as ex:
                # don't fail the upload because logging failed; print a warning
                print("Warning: could not write upload log to DB:", ex)

        return {"message": result_message}
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error: {e}")
    finally:
        await file.close()

# --- DOCUMENT MANAGEMENT ---

@app.get("/documents")
def get_my_documents(x_user_id: Optional[str] = Header("default_user", alias="X-User-ID")):
    files = list_documents(user_id=x_user_id)
    return {"user": x_user_id, "count": len(files), "documents": files}

@app.delete("/documents/{filename}")
def delete_specific_document(
    filename: str,
    x_user_id: Optional[str] = Header("default_user", alias="X-User-ID"),
):
    result = delete_document_by_name(filename, user_id=x_user_id)
    if "not found" in result:
        raise HTTPException(status_code=404, detail=result)
    return {"message": result}

@app.delete("/documents")
def delete_all_my_documents(x_user_id: Optional[str] = Header("default_user", alias="X-User-ID")):
    result = clear_user_database(user_id=x_user_id)
    return {"message": result}
