from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo import MongoClient
from bson import ObjectId
import os
from datetime import datetime
import uuid
import json
from typing import Optional, List
import PyPDF2
import io
import re
from pydantic import BaseModel

app = FastAPI(title="AI Job Application System", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client.job_application_db

# Collections
users_collection = db.users
resumes_collection = db.resumes
jobs_collection = db.jobs
applications_collection = db.applications

# Pydantic models
class UserProfile(BaseModel):
    user_id: str
    name: str
    email: str
    phone: str
    location: str
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    created_at: datetime = datetime.now()

class JobPreferences(BaseModel):
    user_id: str
    job_titles: List[str]
    locations: List[str]
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    experience_level: str
    job_type: str  # full-time, part-time, contract, remote
    keywords: List[str]
    excluded_companies: List[str] = []

class ResumeData(BaseModel):
    user_id: str
    file_name: str
    content: str
    parsed_data: dict
    created_at: datetime = datetime.now()

class JobListing(BaseModel):
    job_id: str
    title: str
    company: str
    location: str
    description: str
    requirements: List[str]
    salary_range: Optional[str] = None
    job_type: str
    source_url: str
    posted_date: datetime
    scraped_at: datetime = datetime.now()

class JobApplication(BaseModel):
    application_id: str
    user_id: str
    job_id: str
    status: str  # pending, submitted, interview, rejected, accepted
    customized_resume: str
    cover_letter: str
    applied_at: datetime = datetime.now()

# Utility functions
def parse_pdf_resume(file_content: bytes) -> str:
    """Extract text from PDF resume"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing PDF: {str(e)}")

def extract_resume_info(text: str) -> dict:
    """Extract structured information from resume text"""
    # Basic regex patterns for common resume information
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    phone_pattern = r'\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b'
    
    emails = re.findall(email_pattern, text)
    phones = re.findall(phone_pattern, text)
    
    # Extract skills (this is a simplified approach)
    skills_keywords = [
        'python', 'javascript', 'java', 'react', 'node.js', 'sql', 'mongodb',
        'aws', 'docker', 'kubernetes', 'git', 'machine learning', 'data analysis',
        'project management', 'leadership', 'communication', 'teamwork'
    ]
    
    found_skills = []
    text_lower = text.lower()
    for skill in skills_keywords:
        if skill in text_lower:
            found_skills.append(skill)
    
    return {
        'emails': emails,
        'phones': phones,
        'skills': found_skills,
        'raw_text': text
    }

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

@app.post("/api/users/profile")
async def create_user_profile(profile: UserProfile):
    """Create or update user profile"""
    try:
        profile_dict = profile.dict()
        profile_dict['created_at'] = datetime.now()
        
        # Check if user exists
        existing_user = users_collection.find_one({"user_id": profile.user_id})
        if existing_user:
            users_collection.update_one(
                {"user_id": profile.user_id},
                {"$set": profile_dict}
            )
            return {"message": "Profile updated successfully"}
        else:
            users_collection.insert_one(profile_dict)
            return {"message": "Profile created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/profile/{user_id}")
async def get_user_profile(user_id: str):
    """Get user profile"""
    try:
        user = users_collection.find_one({"user_id": user_id})
        if user:
            user['_id'] = str(user['_id'])
            return user
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resumes/upload")
async def upload_resume(file: UploadFile = File(...), user_id: str = Form(...)):
    """Upload and parse resume"""
    try:
        if file.content_type != 'application/pdf':
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Read file content
        file_content = await file.read()
        
        # Parse PDF
        text_content = parse_pdf_resume(file_content)
        
        # Extract information
        parsed_data = extract_resume_info(text_content)
        
        # Save to database
        resume_data = {
            'user_id': user_id,
            'file_name': file.filename,
            'content': text_content,
            'parsed_data': parsed_data,
            'created_at': datetime.now()
        }
        
        # Remove existing resume for this user
        resumes_collection.delete_many({"user_id": user_id})
        
        # Insert new resume
        result = resumes_collection.insert_one(resume_data)
        
        return {
            "message": "Resume uploaded and parsed successfully",
            "resume_id": str(result.inserted_id),
            "parsed_data": parsed_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/resumes/{user_id}")
async def get_resume(user_id: str):
    """Get user's resume"""
    try:
        resume = resumes_collection.find_one({"user_id": user_id})
        if resume:
            resume['_id'] = str(resume['_id'])
            return resume
        else:
            raise HTTPException(status_code=404, detail="Resume not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/preferences")
async def save_job_preferences(preferences: JobPreferences):
    """Save job preferences"""
    try:
        pref_dict = preferences.dict()
        
        # Check if preferences exist
        existing_prefs = db.preferences.find_one({"user_id": preferences.user_id})
        if existing_prefs:
            db.preferences.update_one(
                {"user_id": preferences.user_id},
                {"$set": pref_dict}
            )
            return {"message": "Preferences updated successfully"}
        else:
            db.preferences.insert_one(pref_dict)
            return {"message": "Preferences saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/preferences/{user_id}")
async def get_job_preferences(user_id: str):
    """Get job preferences"""
    try:
        preferences = db.preferences.find_one({"user_id": user_id})
        if preferences:
            preferences['_id'] = str(preferences['_id'])
            return preferences
        else:
            return {"message": "No preferences found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/jobs")
async def get_jobs(user_id: str):
    """Get jobs for user based on preferences"""
    try:
        # Get user preferences
        preferences = db.preferences.find_one({"user_id": user_id})
        if not preferences:
            return {"jobs": [], "message": "No preferences set"}
        
        # Build query based on preferences
        query = {}
        if preferences.get('job_titles'):
            query['title'] = {"$regex": "|".join(preferences['job_titles']), "$options": "i"}
        if preferences.get('locations'):
            query['location'] = {"$regex": "|".join(preferences['locations']), "$options": "i"}
        
        jobs = list(jobs_collection.find(query).limit(50))
        for job in jobs:
            job['_id'] = str(job['_id'])
        
        return {"jobs": jobs, "count": len(jobs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/applications/{user_id}")
async def get_applications(user_id: str):
    """Get user's job applications"""
    try:
        applications = list(applications_collection.find({"user_id": user_id}))
        for app in applications:
            app['_id'] = str(app['_id'])
        return {"applications": applications, "count": len(applications)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)