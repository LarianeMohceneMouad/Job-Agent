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
from huggingface_hub import InferenceClient

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

# Hugging Face client
HUGGINGFACE_API_TOKEN = os.environ.get('HUGGINGFACE_API_TOKEN')
if HUGGINGFACE_API_TOKEN:
    hf_client = InferenceClient(
        model="mistralai/Mistral-7B-Instruct-v0.1",
        token=HUGGINGFACE_API_TOKEN
    )
else:
    hf_client = None

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

# AI Request/Response Models
class ResumeCustomizationRequest(BaseModel):
    user_id: str
    original_resume: str
    job_title: str
    job_description: str
    company: str

class CoverLetterRequest(BaseModel):
    user_id: str
    applicant_name: str
    job_title: str
    company: str
    job_description: str
    user_background: str
    skills: List[str]

class JobMatchRequest(BaseModel):
    user_id: str
    resume_text: str
    job_title: str
    job_description: str
    requirements: List[str]

class AIResponse(BaseModel):
    success: bool
    content: str
    metadata: Optional[dict] = None

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

# AI Service Functions
async def generate_ai_content(prompt: str, max_tokens: int = 512, temperature: float = 0.7) -> str:
    """Generate content using Hugging Face Mistral model"""
    if not hf_client:
        raise HTTPException(status_code=500, detail="Hugging Face client not initialized")
    
    try:
        response = hf_client.text_generation(
            prompt=prompt,
            max_new_tokens=max_tokens,
            temperature=temperature,
            top_p=0.9,
            return_full_text=False
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

async def customize_resume_for_job(original_resume: str, job_title: str, job_description: str, company: str) -> str:
    """Customize resume for specific job using AI"""
    prompt = f"""
As a professional resume writer, customize the following resume for a {job_title} position at {company}.

Original Resume:
{original_resume}

Job Description:
{job_description}

Instructions:
1. Highlight relevant skills and experience that match the job requirements
2. Adjust the professional summary to align with the role
3. Reorder sections to emphasize most relevant qualifications
4. Use keywords from the job description naturally
5. Maintain professional formatting and tone
6. Keep all factual information accurate

Customized Resume:
"""
    
    return await generate_ai_content(prompt, max_tokens=800, temperature=0.6)

async def generate_cover_letter(applicant_name: str, job_title: str, company: str, job_description: str, user_background: str, skills: List[str]) -> str:
    """Generate personalized cover letter using AI"""
    skills_text = ", ".join(skills)
    
    prompt = f"""
Write a professional cover letter for {applicant_name} applying for the {job_title} position at {company}.

Applicant Background:
{user_background}

Key Skills: {skills_text}

Job Description:
{job_description}

Requirements:
1. Professional and engaging tone
2. Highlight 2-3 most relevant experiences
3. Show enthusiasm for the company and role
4. Include specific examples of achievements
5. Keep it concise (3-4 paragraphs)
6. End with a strong call to action

Cover Letter:
"""
    
    return await generate_ai_content(prompt, max_tokens=600, temperature=0.7)

async def analyze_job_match(resume_text: str, job_title: str, job_description: str, requirements: List[str]) -> dict:
    """Analyze how well a candidate matches a job using AI"""
    requirements_text = "\n".join([f"- {req}" for req in requirements])
    
    prompt = f"""
Analyze the job match between this candidate and the job position. Provide a detailed assessment.

Candidate Resume:
{resume_text}

Job Title: {job_title}

Job Description:
{job_description}

Key Requirements:
{requirements_text}

Please provide:
1. Match Score (0-100): Overall compatibility percentage
2. Strengths: Top 3 areas where candidate excels
3. Gaps: Areas where candidate may need improvement
4. Recommendations: Specific advice for the candidate
5. Summary: Brief overall assessment

Format your response as JSON with these exact keys: match_score, strengths, gaps, recommendations, summary
"""
    
    response = await generate_ai_content(prompt, max_tokens=500, temperature=0.5)
    
    # Try to parse as JSON, fallback to text if needed
    try:
        import json
        return json.loads(response)
    except:
        return {
            "match_score": 0,
            "strengths": [],
            "gaps": [],
            "recommendations": [],
            "summary": response
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

# AI-Powered Endpoints
@app.post("/api/ai/customize-resume")
async def ai_customize_resume(request: ResumeCustomizationRequest):
    """Customize resume for specific job using AI"""
    try:
        customized_resume = await customize_resume_for_job(
            request.original_resume,
            request.job_title,
            request.job_description,
            request.company
        )
        
        # Save customized resume to database
        resume_data = {
            'user_id': request.user_id,
            'original_resume': request.original_resume,
            'job_title': request.job_title,
            'company': request.company,
            'customized_resume': customized_resume,
            'created_at': datetime.now()
        }
        
        db.customized_resumes.insert_one(resume_data)
        
        return AIResponse(
            success=True,
            content=customized_resume,
            metadata={
                'job_title': request.job_title,
                'company': request.company
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/generate-cover-letter")
async def ai_generate_cover_letter(request: CoverLetterRequest):
    """Generate personalized cover letter using AI"""
    try:
        cover_letter = await generate_cover_letter(
            request.applicant_name,
            request.job_title,
            request.company,
            request.job_description,
            request.user_background,
            request.skills
        )
        
        # Save cover letter to database
        letter_data = {
            'user_id': request.user_id,
            'job_title': request.job_title,
            'company': request.company,
            'cover_letter': cover_letter,
            'created_at': datetime.now()
        }
        
        db.cover_letters.insert_one(letter_data)
        
        return AIResponse(
            success=True,
            content=cover_letter,
            metadata={
                'job_title': request.job_title,
                'company': request.company
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/analyze-job-match")
async def ai_analyze_job_match(request: JobMatchRequest):
    """Analyze job compatibility using AI"""
    try:
        match_analysis = await analyze_job_match(
            request.resume_text,
            request.job_title,
            request.job_description,
            request.requirements
        )
        
        # Save analysis to database
        analysis_data = {
            'user_id': request.user_id,
            'job_title': request.job_title,
            'match_analysis': match_analysis,
            'created_at': datetime.now()
        }
        
        db.job_matches.insert_one(analysis_data)
        
        return AIResponse(
            success=True,
            content=json.dumps(match_analysis),
            metadata=match_analysis
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai/user-content/{user_id}")
async def get_user_ai_content(user_id: str):
    """Get all AI-generated content for a user"""
    try:
        customized_resumes = list(db.customized_resumes.find({"user_id": user_id}))
        cover_letters = list(db.cover_letters.find({"user_id": user_id}))
        job_matches = list(db.job_matches.find({"user_id": user_id}))
        
        # Convert ObjectId to string
        for item in customized_resumes + cover_letters + job_matches:
            item['_id'] = str(item['_id'])
        
        return {
            "customized_resumes": customized_resumes,
            "cover_letters": cover_letters,
            "job_matches": job_matches
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/apply-to-job")
async def ai_apply_to_job(user_id: str, job_data: dict):
    """Apply to job with AI-generated content"""
    try:
        # Get user's resume
        user_resume = resumes_collection.find_one({"user_id": user_id})
        if not user_resume:
            raise HTTPException(status_code=404, detail="User resume not found")
        
        # Get user profile
        user_profile = users_collection.find_one({"user_id": user_id})
        if not user_profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Generate customized resume
        customized_resume = await customize_resume_for_job(
            user_resume['content'],
            job_data.get('title', ''),
            job_data.get('description', ''),
            job_data.get('company', '')
        )
        
        # Generate cover letter
        cover_letter = await generate_cover_letter(
            user_profile.get('name', ''),
            job_data.get('title', ''),
            job_data.get('company', ''),
            job_data.get('description', ''),
            user_resume['content'],
            user_resume['parsed_data'].get('skills', [])
        )
        
        # Create job application record
        application_id = str(uuid.uuid4())
        application_data = {
            'application_id': application_id,
            'user_id': user_id,
            'job_id': job_data.get('job_id', str(uuid.uuid4())),
            'job_title': job_data.get('title', ''),
            'company': job_data.get('company', ''),
            'status': 'pending',
            'customized_resume': customized_resume,
            'cover_letter': cover_letter,
            'applied_at': datetime.now(),
            'job_data': job_data
        }
        
        applications_collection.insert_one(application_data)
        
        return {
            "success": True,
            "application_id": application_id,
            "message": f"Successfully applied to {job_data.get('title')} at {job_data.get('company')}",
            "customized_resume": customized_resume,
            "cover_letter": cover_letter
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)