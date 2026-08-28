import os
import re
import tempfile
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

# --- Database & Auth Imports ---
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from passlib.context import CryptContext
from jose import JWTError, jwt

# Try importing PDF and Word readers
try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    import docx
except ImportError:
    docx = None

# ==============================================================================
# 1. APP INITIALIZATION & SECURITY CONFIG
# ==============================================================================
app = FastAPI(
    title="AI Resume Agent",
    version="5.0.0",
    description="Secure User Management, AI Resume Parsing, Profile Auto-Fill & Cover Letter Generation."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Config
SECRET_KEY = "super_secret_assignment_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Database Config (SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite:///./airesume.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ==============================================================================
class DBUser(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    full_name       = Column(String, index=True)
    email           = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class DBResume(Base):
    __tablename__ = "resumes"
    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id"))
    filename       = Column(String)
    extracted_data = Column(JSON)

# NEW: User profile table — auto-populated from resume
class DBUserProfile(Base):
    __tablename__ = "user_profiles"
    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id"), unique=True)
    phone          = Column(String, nullable=True)
    summary        = Column(Text, nullable=True)
    skills         = Column(JSON, nullable=True)
    education      = Column(Text, nullable=True)
    experience     = Column(Text, nullable=True)
    projects       = Column(Text, nullable=True)
    certifications = Column(Text, nullable=True)
    resume_email   = Column(String, nullable=True)  # email extracted from resume

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==============================================================================
# 3. SCHEMAS & AUTH UTILS
# ==============================================================================
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(max_length=72)

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    class Config:
        from_attributes = True

class UserProfileDataResponse(BaseModel):
    phone: Optional[str]          = None
    summary: Optional[str]        = None
    skills: Optional[List[str]]   = None
    education: Optional[str]      = None
    experience: Optional[str]     = None
    projects: Optional[str]       = None
    certifications: Optional[str] = None
    resume_email: Optional[str]   = None
    class Config:
        from_attributes = True

class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(max_length=72)

class Token(BaseModel):
    access_token: str
    token_type: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password[:72], hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password[:72])

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=60))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(DBUser).filter(DBUser.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# ==============================================================================
# 4. USER MANAGEMENT APIs
# ==============================================================================
@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, tags=["Authentication"])
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(DBUser).filter(DBUser.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    new_user = DBUser(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/auth/login", response_model=Token, tags=["Authentication"])
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.put("/auth/change-password", tags=["Authentication"])
def change_password(passwords: PasswordChange, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    if not verify_password(passwords.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    current_user.hashed_password = get_password_hash(passwords.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@app.get("/users/profile", response_model=UserResponse, tags=["User Management"])
def get_user_profile(current_user: DBUser = Depends(get_current_user)):
    return current_user

# NEW: Get resume-extracted profile data
@app.get("/users/profile/resume-data", response_model=UserProfileDataResponse, tags=["User Management"])
def get_resume_profile_data(db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    profile = db.query(DBUserProfile).filter(DBUserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No resume data found. Please upload a resume first.")
    return profile

@app.delete("/users/profile", status_code=status.HTTP_204_NO_CONTENT, tags=["User Management"])
def delete_user_account(db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    # Also delete profile data
    db.query(DBUserProfile).filter(DBUserProfile.user_id == current_user.id).delete()
    db.delete(current_user)
    db.commit()

# ==============================================================================
# 4b. INTERNSHIP APIs
# ==============================================================================
INTERNSHIP_DATABASE = [
    {
        "id": "INT-001", "title": "Generative AI Research Intern", "company": "NexusAI Labs",
        "work_mode": "Remote", "duration": "6 Months",
        "required_skills": ["Python", "PyTorch", "Hugging Face", "LLMs", "RAG", "LangChain"],
        "description": "Work on cutting-edge generative AI research, fine-tuning large language models and building RAG pipelines.",
        "location": "Remote (India)"
    },
    {
        "id": "INT-002", "title": "Backend Engineering Intern", "company": "CloudScale Systems",
        "work_mode": "Hybrid", "duration": "3 Months",
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "REST APIs", "Docker"],
        "description": "Build and maintain scalable REST APIs for cloud-based products used by thousands of users.",
        "location": "Bengaluru, India"
    },
    {
        "id": "INT-003", "title": "Data Science & Analytics Intern", "company": "FinMetrics Global",
        "work_mode": "On-site", "duration": "6 Months",
        "required_skills": ["Python", "Pandas", "SQL", "Scikit-Learn", "Data Visualization"],
        "description": "Analyse financial datasets, build predictive models and create interactive dashboards for business intelligence.",
        "location": "Mumbai, India"
    },
    {
        "id": "INT-004", "title": "Full-Stack Web Developer Intern", "company": "DevCraft Studios",
        "work_mode": "Hybrid", "duration": "4 Months",
        "required_skills": ["React.js", "Node.js", "JavaScript", "HTML", "CSS", "REST APIs"],
        "description": "Build responsive, full-stack web applications for clients in e-commerce, edtech, and SaaS sectors.",
        "location": "Pune, India"
    },
    {
        "id": "INT-005", "title": "Machine Learning Engineer Intern", "company": "VisionTech AI",
        "work_mode": "Remote", "duration": "6 Months",
        "required_skills": ["Python", "Scikit-Learn", "PyTorch", "Pandas", "SQL", "Data Visualization"],
        "description": "Design, train and deploy computer vision and NLP models to production pipelines.",
        "location": "Remote (India)"
    },
    {
        "id": "INT-006", "title": "Cloud Infrastructure Intern", "company": "AeroCloud Solutions",
        "work_mode": "Hybrid", "duration": "3 Months",
        "required_skills": ["AWS", "Docker", "Python", "REST APIs", "PostgreSQL"],
        "description": "Assist in designing and deploying cloud-native microservices on AWS using Docker and Kubernetes.",
        "location": "Hyderabad, India"
    },
    {
        "id": "INT-007", "title": "Frontend React Developer Intern", "company": "PixelForge Labs",
        "work_mode": "Remote", "duration": "3 Months",
        "required_skills": ["React.js", "TypeScript", "JavaScript", "HTML", "CSS"],
        "description": "Create pixel-perfect, animated UI components for a suite of B2B SaaS products used globally.",
        "location": "Remote (India)"
    },
    {
        "id": "INT-008", "title": "Cybersecurity Analyst Intern", "company": "SecureNet India",
        "work_mode": "On-site", "duration": "6 Months",
        "required_skills": ["Python", "SQL", "REST APIs", "Docker"],
        "description": "Monitor network threats, perform vulnerability assessments and assist in incident response for enterprise clients.",
        "location": "Delhi, India"
    },
    {
        "id": "INT-009", "title": "Data Engineering Intern", "company": "StreamBase Technologies",
        "work_mode": "Hybrid", "duration": "6 Months",
        "required_skills": ["Python", "SQL", "PostgreSQL", "Pandas", "Docker", "AWS"],
        "description": "Build and optimise ETL pipelines that process millions of events per day using Apache Spark and Kafka.",
        "location": "Bengaluru, India"
    },
    {
        "id": "INT-010", "title": "NLP & Chatbot Development Intern", "company": "LinguaBot AI",
        "work_mode": "Remote", "duration": "4 Months",
        "required_skills": ["Python", "LangChain", "LLMs", "Hugging Face", "REST APIs", "FastAPI"],
        "description": "Build intelligent conversational AI chatbots for customer support using LangChain and fine-tuned LLMs.",
        "location": "Remote (India)"
    },
    {
        "id": "INT-011", "title": "Business Intelligence Intern", "company": "InsightFlow Analytics",
        "work_mode": "On-site", "duration": "3 Months",
        "required_skills": ["SQL", "Power BI", "Python", "Pandas", "Data Visualization", "Excel"],
        "description": "Design BI dashboards, write complex SQL queries and present data-driven insights to business stakeholders.",
        "location": "Chennai, India"
    },
    {
        "id": "INT-012", "title": "Android App Development Intern", "company": "MobileFirst Labs",
        "work_mode": "Hybrid", "duration": "4 Months",
        "required_skills": ["Java", "Python", "REST APIs", "SQL"],
        "description": "Develop and publish Android applications, integrate backend APIs and improve app performance.",
        "location": "Gurugram, India"
    },
    {
        "id": "INT-013", "title": "DevOps & Automation Intern", "company": "PipelineX Corp",
        "work_mode": "Remote", "duration": "6 Months",
        "required_skills": ["Docker", "AWS", "Python", "REST APIs", "PostgreSQL"],
        "description": "Automate CI/CD pipelines, manage cloud infrastructure and improve deployment reliability using Docker and AWS.",
        "location": "Remote (India)"
    },
    {
        "id": "INT-014", "title": "Streamlit & Data App Intern", "company": "DataViz Studio",
        "work_mode": "Remote", "duration": "3 Months",
        "required_skills": ["Python", "Streamlit", "Pandas", "SQL", "Data Visualization"],
        "description": "Build interactive data exploration tools and internal analytics dashboards using Streamlit and Python.",
        "location": "Remote (India)"
    },
    {
        "id": "INT-015", "title": "AI Product Research Intern", "company": "FutureStack Ventures",
        "work_mode": "Hybrid", "duration": "6 Months",
        "required_skills": ["Python", "LLMs", "RAG", "FastAPI", "React.js", "REST APIs"],
        "description": "Research and prototype AI-powered product features including semantic search, recommendation systems and AI assistants.",
        "location": "Bengaluru, India"
    },
]

@app.get("/internships", tags=["Internships"])
def list_internships():
    return {"internships": INTERNSHIP_DATABASE, "total": len(INTERNSHIP_DATABASE)}

@app.get("/internships/{internship_id}", tags=["Internships"])
def get_internship(internship_id: str):
    job = next((j for j in INTERNSHIP_DATABASE if j["id"] == internship_id), None)
    if not job:
        raise HTTPException(status_code=404, detail=f"Internship '{internship_id}' not found")
    return job

# Generate cover letter for an internship (no email)
@app.post("/internships/{internship_id}/cover-letter", tags=["Internships"])
def generate_cover_letter_for_internship(
    internship_id: str,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    """Generate a personalised cover letter based on the user's resume profile."""
    job = next((j for j in INTERNSHIP_DATABASE if j["id"] == internship_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Internship not found")

    profile = db.query(DBUserProfile).filter(DBUserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=400,
            detail="Please upload your resume first so we can generate a personalised cover letter."
        )

    cover_letter = generate_cover_letter(current_user, profile, job)
    return {
        "status": "success",
        "internship": job["title"],
        "company": job["company"],
        "cover_letter": cover_letter,
    }

# ==============================================================================
# 5. RAG & PARSING UTILS
# ==============================================================================
class InternshipVectorStore:
    def __init__(self):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.documents = [f"{j['title']} {' '.join(j['required_skills'])}" for j in INTERNSHIP_DATABASE]
        self.embeddings = self.model.encode(self.documents)

    def search(self, query_text: str, top_k: int = 3):
        query_vector = self.model.encode([query_text])
        similarities = cosine_similarity(query_vector, self.embeddings)[0]
        top_indices = np.argsort(similarities)[::-1][:top_k]
        return [{"job": INTERNSHIP_DATABASE[idx], "similarity_score": round(float(similarities[idx]), 4)} for idx in top_indices]

vector_store = InternshipVectorStore()

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    if filename.endswith(".pdf") and fitz:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        return "\n".join([page.get_text() for page in doc])
    elif filename.endswith(".docx") and docx:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        doc = docx.Document(tmp_path)
        os.unlink(tmp_path)
        return "\n".join([para.text for para in doc.paragraphs])
    return file_bytes.decode("utf-8", errors="ignore")

class ComprehensiveResumeParser:
    @staticmethod
    def extract_section(raw_text: str, target_headers: List[str]) -> Optional[str]:
        lines = raw_text.split('\n')
        section_blocks = []
        in_section = False
        major_headers = ["EDUCATION", "PROJECTS", "TECHNICAL SKILLS", "CERTIFICATIONS",
                         "LANGUAGES", "WORK EXPERIENCE", "EXPERIENCE", "SUMMARY",
                         "PROFESSIONAL SUMMARY", "SKILLS", "INTERNSHIP", "INTERNSHIPS"]
        for line in lines:
            clean_line = line.strip()
            if not clean_line:
                continue
            if clean_line.upper() in target_headers:
                in_section = True
                section_blocks.append(clean_line)
                continue
            if in_section and clean_line.upper() in major_headers and clean_line.upper() not in target_headers:
                break
            if in_section:
                section_blocks.append(clean_line)
        return "\n".join(section_blocks[1:]).strip() if section_blocks else None

    @staticmethod
    def parse_full_resume(raw_text: str) -> Dict[str, Any]:
        email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", raw_text)
        # Clean simple phone regex — works for Indian & international numbers
        phone_match = re.search(r"[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{2,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}", raw_text)
        master_skills_list = [
            # AI / ML
            "Python", "PyTorch", "TensorFlow", "Hugging Face", "LLMs", "RAG", "LangChain",
            "Scikit-Learn", "Keras", "OpenCV", "NLTK", "Transformers",
            # Backend / APIs
            "FastAPI", "Django", "Flask", "REST APIs", "GraphQL", "Node.js", "Express.js",
            "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite",
            # DevOps / Cloud
            "Docker", "AWS", "Kubernetes", "GCP", "Azure", "Linux",
            # Frontend / Web
            "React.js", "JavaScript", "TypeScript", "HTML", "CSS", "Vue.js", "Next.js",
            "Tailwind", "Bootstrap", "Redux",
            # Data
            "Pandas", "SQL", "NumPy", "Data Visualization", "Streamlit", "Power BI",
            "Tableau", "Excel", "Spark", "Hadoop",
            # Other languages
            "Java", "PHP", "Go", "Rust", "Kotlin", "Swift",
        ]
        def safe_skill_search(skill, text):
            try:
                return bool(re.search(re.escape(skill), text, re.IGNORECASE))
            except re.error:
                return False
        found_skills = [s for s in master_skills_list if safe_skill_search(s, raw_text)]
        return {
            "contact_info": {
                "email": email_match.group(0) if email_match else None,
                "phone_number": phone_match.group(0) if phone_match else None
            },
            "summary":        ComprehensiveResumeParser.extract_section(raw_text, ["SUMMARY", "PROFESSIONAL SUMMARY"]),
            "education":      ComprehensiveResumeParser.extract_section(raw_text, ["EDUCATION"]),
            "internships":    ComprehensiveResumeParser.extract_section(raw_text, ["INTERNSHIP", "INTERNSHIPS", "WORK EXPERIENCE", "EXPERIENCE"]),
            "projects":       ComprehensiveResumeParser.extract_section(raw_text, ["PROJECTS"]),
            "certifications": ComprehensiveResumeParser.extract_section(raw_text, ["CERTIFICATIONS"]),
            "extracted_skills": found_skills
        }

# ==============================================================================
# 6. COVER LETTER GENERATOR
# ==============================================================================
def generate_cover_letter(user: DBUser, profile: DBUserProfile, job: dict) -> str:
    today = datetime.now().strftime("%d %B %Y")
    skills_str = ", ".join((profile.skills or [])[:6]) or "a diverse technical skill set"
    top_skills = ", ".join((profile.skills or [])[:3]) or "Python, data analysis, and software development"

    # Pick 1-2 lines from experience if available
    exp_snippet = ""
    if profile.experience:
        lines = [l.strip() for l in profile.experience.split("\n") if l.strip()]
        exp_snippet = lines[0] if lines else ""

    cover = f"""{today}

Hiring Manager
{job['company']}

Dear Hiring Manager,

I am writing to express my sincere interest in the {job['title']} position at {job['company']}. \
As a motivated and technically skilled candidate with hands-on experience in {top_skills}, \
I am confident that I can make a meaningful contribution to your team.

Throughout my academic and professional journey, I have developed strong proficiency in {skills_str}. \
{"Notably, " + exp_snippet + "." if exp_snippet else "I have applied these skills across multiple real-world projects and internships."} \
This background aligns closely with the requirements for the {job['title']} role, \
particularly the emphasis on {", ".join(job.get("required_skills", [])[:4])}.

I am especially drawn to {job['company']} because of its commitment to innovation and excellence. \
The {job['work_mode']} work model and {job['duration']} duration make this an ideal opportunity \
for me to contribute meaningfully while growing both technically and professionally.

{"My educational background, summarised as: " + profile.education.split(chr(10))[0] + ", has equipped me with a strong theoretical foundation to complement my practical skills." if profile.education else ""}

I am enthusiastic about the possibility of joining {job['company']} and would welcome the opportunity \
to discuss how my background, skills, and passion align with your team's goals.

Thank you sincerely for considering my application. I look forward to hearing from you.

Warm regards,
{user.full_name}
{user.email}
{profile.phone or ""}
"""
    return cover.strip()




# ==============================================================================
# 8. RESUME PARSING API (now also auto-fills user profile)
# ==============================================================================
@app.post("/resume/parse", tags=["Resume Parsing"])
async def upload_and_parse_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    try:
        # 1. Read & extract text
        file_bytes = await file.read()
        raw_text   = extract_text_from_file(file_bytes, file.filename)

        # 2. Parse
        parsed_data = ComprehensiveResumeParser.parse_full_resume(raw_text)

        # 3. RAG matching
        rag_query = f"Skills: {', '.join(parsed_data['extracted_skills'])} Context: {raw_text[:500]}"
        retrieved_matches = vector_store.search(rag_query, top_k=5)

        evaluated_matches = []
        candidate_skills_lower = set(s.lower() for s in parsed_data["extracted_skills"])
        for match in retrieved_matches:
            job = match["job"]
            req_skills = job.get("required_skills", [])
            matching_req = [s for s in req_skills if s.lower() in candidate_skills_lower]
            evaluated_matches.append({
                "job_id":          job["id"],
                "title":           job["title"],
                "company":         job["company"],
                "work_mode":       job.get("work_mode", ""),
                "duration":        job.get("duration", ""),
                "location":        job.get("location", ""),
                "description":     job.get("description", ""),
                "matched_skills":  matching_req,
                "composite_score": match["similarity_score"]
            })

        # 4. AUTO-FILL user profile from parsed resume data
        existing_profile = db.query(DBUserProfile).filter(DBUserProfile.user_id == current_user.id).first()
        profile_data = {
            "phone":          parsed_data["contact_info"].get("phone_number"),
            "summary":        parsed_data.get("summary"),
            "skills":         parsed_data.get("extracted_skills", []),
            "education":      parsed_data.get("education"),
            "experience":     parsed_data.get("internships"),
            "projects":       parsed_data.get("projects"),
            "certifications": parsed_data.get("certifications"),
            "resume_email":   parsed_data["contact_info"].get("email"),
        }
        if existing_profile:
            for key, val in profile_data.items():
                setattr(existing_profile, key, val)
        else:
            db.add(DBUserProfile(user_id=current_user.id, **profile_data))
        db.commit()

        # 5. Save full resume record
        full_response_data = {"parsed_resume": parsed_data, "rag_matches": evaluated_matches}
        db_resume = DBResume(user_id=current_user.id, filename=file.filename, extracted_data=full_response_data)
        db.add(db_resume)
        db.commit()
        db.refresh(db_resume)

        return {
            "status":             "success",
            "message":            "Successfully parsed, matched, profile updated, and saved to database.",
            "database_resume_id": db_resume.id,
            "data":               full_response_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))