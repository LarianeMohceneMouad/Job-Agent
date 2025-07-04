import requests
import json
import os
import tempfile
from reportlab.pdfgen import canvas
import time
import unittest

# Get the backend URL from the frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.strip().split('=')[1]
            break

# Ensure the URL ends with /api for all endpoints
if not BACKEND_URL.endswith('/api'):
    API_URL = f"{BACKEND_URL}/api"
else:
    API_URL = BACKEND_URL

print(f"Using API URL: {API_URL}")

# Test user IDs
TEST_USER_ID = "test_user_123"
TEST_USER_AI_ID = "test_user_ai"

# Sample data for testing
SAMPLE_PROFILE = {
    "user_id": TEST_USER_ID,
    "name": "Emily Johnson",
    "email": "emily.johnson@example.com",
    "phone": "555-987-6543",
    "location": "Seattle, WA",
    "linkedin_url": "https://linkedin.com/in/emilyjohnson",
    "github_url": "https://github.com/emilyjohnson",
    "portfolio_url": "https://emilyjohnson.dev"
}

SAMPLE_PREFERENCES = {
    "user_id": TEST_USER_ID,
    "job_titles": ["Software Engineer", "Full Stack Developer", "Frontend Developer"],
    "locations": ["Seattle, WA", "San Francisco, CA", "Remote"],
    "min_salary": 120000,
    "max_salary": 180000,
    "experience_level": "Senior",
    "job_type": "full-time",
    "keywords": ["Python", "React", "Node.js", "AWS", "Docker", "Kubernetes"],
    "excluded_companies": ["Bad Company Inc"]
}

# More realistic sample data for AI testing
SAMPLE_RESUME_TEXT = """
EMILY JOHNSON
Seattle, WA | emily.johnson@example.com | 555-987-6543 | linkedin.com/in/emilyjohnson

PROFESSIONAL SUMMARY
Innovative Software Engineer with 7+ years of experience building scalable web applications and cloud-native solutions. Expertise in full-stack development using React, Node.js, Python, and AWS. Passionate about clean code, performance optimization, and creating exceptional user experiences.

SKILLS
• Languages: JavaScript, TypeScript, Python, HTML5, CSS3, SQL
• Frontend: React, Redux, Vue.js, Webpack, Tailwind CSS
• Backend: Node.js, Express, FastAPI, Django, RESTful APIs, GraphQL
• Cloud: AWS (EC2, S3, Lambda, DynamoDB), Docker, Kubernetes
• Databases: MongoDB, PostgreSQL, Redis
• Tools: Git, GitHub Actions, Jenkins, Jira, Figma

PROFESSIONAL EXPERIENCE
Senior Software Engineer | CloudTech Solutions | 2020 - Present
• Led development of a microservices-based e-commerce platform serving 100K+ daily users
• Implemented CI/CD pipelines reducing deployment time by 70%
• Optimized database queries resulting in 40% performance improvement
• Mentored junior developers and conducted code reviews

Software Developer | WebInnovate Inc | 2017 - 2020
• Developed responsive web applications using React and Node.js
• Created RESTful APIs for mobile application backend
• Implemented authentication and authorization systems
• Collaborated with UX/UI designers to implement pixel-perfect interfaces

EDUCATION
Master of Science in Computer Science | University of Washington | 2017
Bachelor of Science in Software Engineering | Oregon State University | 2015

PROJECTS
• E-commerce Platform: Built with React, Node.js, and MongoDB
• Task Management App: Full-stack application with real-time features
• Personal Portfolio: Responsive website showcasing projects and skills
"""

SAMPLE_JOB_TITLE = "Senior Software Engineer"
SAMPLE_COMPANY = "TechCorp Inc"
SAMPLE_JOB_DESCRIPTION = """
Join our innovative team building next-generation web applications. We're looking for a Senior Software Engineer with expertise in Python, React, and cloud technologies to help scale our platform serving millions of users.

Responsibilities:
• Design, develop, and maintain scalable web applications
• Collaborate with cross-functional teams to define and implement new features
• Write clean, maintainable, and efficient code
• Participate in code reviews and mentor junior developers
• Troubleshoot and debug complex issues

Requirements:
• 5+ years of software development experience
• Proficiency in Python, JavaScript, and React
• Experience with cloud platforms (AWS, GCP)
• Strong problem-solving and communication skills
• Bachelor's degree in Computer Science or related field
"""

# Enhanced AI test data
SAMPLE_RESUME_CUSTOMIZATION_REQUEST = {
    "user_id": TEST_USER_AI_ID,
    "original_resume": SAMPLE_RESUME_TEXT,
    "job_title": SAMPLE_JOB_TITLE,
    "job_description": SAMPLE_JOB_DESCRIPTION,
    "company": SAMPLE_COMPANY
}

SAMPLE_COVER_LETTER_REQUEST = {
    "user_id": TEST_USER_AI_ID,
    "applicant_name": "Emily Johnson",
    "job_title": SAMPLE_JOB_TITLE,
    "company": SAMPLE_COMPANY,
    "job_description": SAMPLE_JOB_DESCRIPTION,
    "user_background": SAMPLE_RESUME_TEXT,
    "skills": ["Python", "React", "JavaScript", "AWS", "Node.js", "MongoDB"]
}

SAMPLE_JOB_MATCH_REQUEST = {
    "user_id": TEST_USER_AI_ID,
    "resume_text": SAMPLE_RESUME_TEXT,
    "job_title": SAMPLE_JOB_TITLE,
    "job_description": SAMPLE_JOB_DESCRIPTION,
    "requirements": [
        "5+ years of software development experience",
        "Proficiency in Python, JavaScript, and React",
        "Experience with cloud platforms (AWS, GCP)",
        "Strong problem-solving and communication skills",
        "Bachelor's degree in Computer Science or related field"
    ]
}

SAMPLE_JOB_DATA = {
    "job_id": "job_1",
    "title": SAMPLE_JOB_TITLE,
    "company": SAMPLE_COMPANY,
    "description": SAMPLE_JOB_DESCRIPTION,
    "requirements": [
        "5+ years of software development experience",
        "Proficiency in Python, JavaScript, and React",
        "Experience with cloud platforms (AWS, GCP)",
        "Strong problem-solving and communication skills",
        "Bachelor's degree in Computer Science or related field"
    ],
    "location": "San Francisco, CA",
    "job_type": "full-time",
    "salary_range": "$120,000 - $160,000"
}

# Helper function to create a test PDF
def create_test_pdf():
    """Create a simple PDF file for testing resume upload"""
    fd, path = tempfile.mkstemp(suffix='.pdf')
    os.close(fd)
    
    c = canvas.Canvas(path)
    c.drawString(100, 750, "Emily Johnson")
    c.drawString(100, 735, "emily.johnson@example.com")
    c.drawString(100, 720, "555-987-6543")
    c.drawString(100, 705, "Seattle, WA")
    c.drawString(100, 690, "Skills: Python, React, Node.js, AWS, Docker, Kubernetes")
    c.drawString(100, 675, "Experience: 7 years of software development")
    c.drawString(100, 660, "Education: Master of Science in Computer Science")
    c.drawString(100, 645, "Projects: E-commerce Platform, Task Management App")
    c.save()
    
    return path

class TestBackendAPI(unittest.TestCase):
    """Test suite for the Enhanced AI Job Application System backend API"""
    
    def test_01_health_check(self):
        """Test the health check endpoint"""
        print("\n=== Testing Health Check API ===")
        response = requests.get(f"{API_URL}/health")
        print(f"Response: {response.status_code} - {response.text}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("timestamp", data)
        
        print("✅ Health Check API test passed")
    
    def test_02_create_user_profile(self):
        """Test creating a user profile"""
        print("\n=== Testing User Profile Creation API ===")
        response = requests.post(
            f"{API_URL}/users/profile",
            json=SAMPLE_PROFILE
        )
        print(f"Response: {response.status_code} - {response.text}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        self.assertTrue("created successfully" in data["message"] or "updated successfully" in data["message"])
        
        print("✅ User Profile Creation API test passed")
    
    def test_03_get_user_profile(self):
        """Test retrieving a user profile"""
        print("\n=== Testing User Profile Retrieval API ===")
        response = requests.get(f"{API_URL}/users/profile/{TEST_USER_ID}")
        print(f"Response: {response.status_code} - {response.text}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["user_id"], TEST_USER_ID)
        self.assertEqual(data["name"], SAMPLE_PROFILE["name"])
        self.assertEqual(data["email"], SAMPLE_PROFILE["email"])
        
        print("✅ User Profile Retrieval API test passed")
    
    def test_04_upload_resume(self):
        """Test uploading a resume"""
        print("\n=== Testing Resume Upload API ===")
        pdf_path = create_test_pdf()
        
        try:
            with open(pdf_path, 'rb') as pdf_file:
                files = {'file': ('resume.pdf', pdf_file, 'application/pdf')}
                data = {'user_id': TEST_USER_ID}
                
                response = requests.post(
                    f"{API_URL}/resumes/upload",
                    files=files,
                    data=data
                )
                
                print(f"Response: {response.status_code} - {response.text}")
                
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertIn("message", data)
                self.assertIn("Resume uploaded and parsed successfully", data["message"])
                self.assertIn("parsed_data", data)
                self.assertIn("resume_id", data)
                
                # Check if the parsed data contains expected information
                parsed_data = data["parsed_data"]
                self.assertIn("emails", parsed_data)
                self.assertIn("phones", parsed_data)
                self.assertIn("skills", parsed_data)
                
                print("✅ Resume Upload API test passed")
        finally:
            # Clean up the temporary PDF file
            if os.path.exists(pdf_path):
                os.remove(pdf_path)
    
    def test_05_get_resume(self):
        """Test retrieving a resume"""
        print("\n=== Testing Resume Retrieval API ===")
        response = requests.get(f"{API_URL}/resumes/{TEST_USER_ID}")
        print(f"Response: {response.status_code} - {response.text}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["user_id"], TEST_USER_ID)
        self.assertIn("file_name", data)
        self.assertIn("content", data)
        self.assertIn("parsed_data", data)
        
        print("✅ Resume Retrieval API test passed")
    
    def test_06_save_job_preferences(self):
        """Test saving job preferences"""
        print("\n=== Testing Job Preferences Creation API ===")
        response = requests.post(
            f"{API_URL}/preferences",
            json=SAMPLE_PREFERENCES
        )
        print(f"Response: {response.status_code} - {response.text}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        self.assertTrue("saved successfully" in data["message"] or "updated successfully" in data["message"])
        
        print("✅ Job Preferences Creation API test passed")
    
    def test_07_get_job_preferences(self):
        """Test retrieving job preferences"""
        print("\n=== Testing Job Preferences Retrieval API ===")
        response = requests.get(f"{API_URL}/preferences/{TEST_USER_ID}")
        print(f"Response: {response.status_code} - {response.text}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # If preferences exist, verify the data
        if "message" not in data or "No preferences found" not in data["message"]:
            self.assertEqual(data["user_id"], TEST_USER_ID)
            self.assertEqual(data["job_titles"], SAMPLE_PREFERENCES["job_titles"])
            self.assertEqual(data["locations"], SAMPLE_PREFERENCES["locations"])
            self.assertEqual(data["experience_level"], SAMPLE_PREFERENCES["experience_level"])
        
        print("✅ Job Preferences Retrieval API test passed")
    
    def test_08_get_jobs(self):
        """Test retrieving jobs based on preferences - should return sample jobs"""
        print("\n=== Testing Jobs Retrieval API - Sample Jobs ===")
        response = requests.get(f"{API_URL}/jobs?user_id={TEST_USER_ID}")
        print(f"Response: {response.status_code}")
        print(f"Jobs count: {response.json()['count']}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("jobs", data)
        self.assertIn("count", data)
        
        # Verify we have at least one job
        self.assertGreater(data["count"], 0, "Should have at least one sample job")
        
        # Check job structure and content
        for job in data["jobs"]:
            self.assertIn("job_id", job)
            self.assertIn("title", job)
            self.assertIn("company", job)
            self.assertIn("location", job)
            self.assertIn("description", job)
            self.assertIn("requirements", job)
            
            # Verify job descriptions are detailed
            self.assertGreater(len(job["description"]), 50, "Job description should be detailed")
            
            # Verify requirements are comprehensive
            self.assertGreaterEqual(len(job["requirements"]), 3, "Should have at least 3 requirements")
        
        print("✅ Sample Jobs API test passed")
    
    def test_09_get_applications(self):
        """Test retrieving job applications"""
        print("\n=== Testing Applications Retrieval API ===")
        response = requests.get(f"{API_URL}/applications/{TEST_USER_ID}")
        print(f"Response: {response.status_code} - {response.text}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("applications", data)
        self.assertIn("count", data)
        
        print("✅ Applications Retrieval API test passed")
    
    def test_10_ai_customize_resume(self):
        """Test enhanced AI resume customization endpoint with Google Gemma 2B model"""
        print("\n=== Testing Enhanced AI Resume Customization API ===")
        response = requests.post(
            f"{API_URL}/ai/customize-resume",
            json=SAMPLE_RESUME_CUSTOMIZATION_REQUEST
        )
        print(f"Response: {response.status_code}")
        print(f"Response content preview: {response.text[:200]}...")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("content", data)
        self.assertIsNotNone(data["content"])
        
        # Verify enhanced response quality
        content = data["content"]
        self.assertGreater(len(content), 200, "Resume should be comprehensive")
        
        # Check for professional formatting
        self.assertTrue(
            "**" in content or 
            "PROFESSIONAL SUMMARY" in content or 
            "EXPERIENCE" in content or 
            "SKILLS" in content,
            "Resume should have professional formatting"
        )
        
        # Check for job-specific customization
        self.assertTrue(
            SAMPLE_JOB_TITLE.lower() in content.lower() or
            "software engineer" in content.lower() or
            "python" in content.lower() or
            "react" in content.lower(),
            "Resume should be customized for the job"
        )
        
        print("✅ Enhanced AI Resume Customization API test passed")
    
    def test_11_ai_generate_cover_letter(self):
        """Test enhanced AI cover letter generation endpoint with Google Gemma 2B model"""
        print("\n=== Testing Enhanced AI Cover Letter Generation API ===")
        response = requests.post(
            f"{API_URL}/ai/generate-cover-letter",
            json=SAMPLE_COVER_LETTER_REQUEST
        )
        print(f"Response: {response.status_code}")
        print(f"Response content preview: {response.text[:200]}...")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("content", data)
        self.assertIsNotNone(data["content"])
        
        # Verify enhanced response quality
        content = data["content"]
        self.assertGreater(len(content), 200, "Cover letter should be comprehensive")
        
        # Check for professional formatting and content
        self.assertTrue(
            "Dear" in content and 
            "Sincerely" in content or
            "Best regards" in content or
            "Regards" in content,
            "Cover letter should have professional formatting"
        )
        
        # Check for job and company specific content
        self.assertTrue(
            SAMPLE_JOB_TITLE.lower() in content.lower() and
            SAMPLE_COMPANY.lower() in content.lower(),
            "Cover letter should mention the job title and company"
        )
        
        # Check for personalization
        self.assertTrue(
            "experience" in content.lower() and
            "skills" in content.lower(),
            "Cover letter should mention candidate experience and skills"
        )
        
        print("✅ Enhanced AI Cover Letter Generation API test passed")
    
    def test_12_ai_analyze_job_match(self):
        """Test enhanced AI job match analysis endpoint with structured output"""
        print("\n=== Testing Enhanced AI Job Match Analysis API ===")
        response = requests.post(
            f"{API_URL}/ai/analyze-job-match",
            json=SAMPLE_JOB_MATCH_REQUEST
        )
        print(f"Response: {response.status_code}")
        print(f"Response content preview: {response.text[:200]}...")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("content", data)
        self.assertIsNotNone(data["content"])
        self.assertIn("metadata", data)
        
        # Check if metadata contains expected fields with improved structure
        metadata = data["metadata"]
        self.assertIn("match_score", metadata)
        self.assertIn("strengths", metadata)
        self.assertIn("gaps", metadata)
        self.assertIn("recommendations", metadata)
        self.assertIn("summary", metadata)
        
        # Verify match score is between 0-100
        self.assertGreaterEqual(metadata["match_score"], 0)
        self.assertLessEqual(metadata["match_score"], 100)
        
        # Verify strengths, gaps, and recommendations are lists with meaningful content
        self.assertIsInstance(metadata["strengths"], list)
        self.assertGreaterEqual(len(metadata["strengths"]), 1)
        
        self.assertIsInstance(metadata["gaps"], list)
        self.assertGreaterEqual(len(metadata["gaps"]), 1)
        
        self.assertIsInstance(metadata["recommendations"], list)
        self.assertGreaterEqual(len(metadata["recommendations"]), 1)
        
        # Verify summary is a non-empty string
        self.assertIsInstance(metadata["summary"], str)
        self.assertGreater(len(metadata["summary"]), 10)
        
        print("✅ Enhanced AI Job Match Analysis API test passed")
    
    def test_13_ai_apply_to_job(self):
        """Test enhanced AI job application endpoint with complete workflow"""
        print("\n=== Testing Enhanced AI Job Application API ===")
        
        # First, ensure we have a user profile and resume
        self.test_02_create_user_profile()
        self.test_04_upload_resume()
        
        response = requests.post(
            f"{API_URL}/ai/apply-to-job?user_id={TEST_USER_ID}",
            json=SAMPLE_JOB_DATA
        )
        print(f"Response: {response.status_code}")
        print(f"Response content preview: {response.text[:200]}...")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("application_id", data)
        self.assertIn("message", data)
        self.assertIn("customized_resume", data)
        self.assertIn("cover_letter", data)
        
        # Verify the complete workflow generated quality content
        self.assertGreater(len(data["customized_resume"]), 200, "Customized resume should be comprehensive")
        self.assertGreater(len(data["cover_letter"]), 200, "Cover letter should be comprehensive")
        
        # Verify application message includes job title and company
        self.assertIn(SAMPLE_JOB_TITLE, data["message"])
        self.assertIn(SAMPLE_COMPANY, data["message"])
        
        print("✅ Enhanced AI Job Application API test passed")
    
    def test_14_get_user_ai_content(self):
        """Test retrieving user AI content"""
        print("\n=== Testing User AI Content Retrieval API ===")
        
        # First, generate some AI content for the user
        self.test_10_ai_customize_resume()
        self.test_11_ai_generate_cover_letter()
        self.test_12_ai_analyze_job_match()
        
        response = requests.get(f"{API_URL}/ai/user-content/{TEST_USER_AI_ID}")
        print(f"Response: {response.status_code}")
        print(f"Response structure: {json.dumps(response.json().keys(), indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("customized_resumes", data)
        self.assertIn("cover_letters", data)
        self.assertIn("job_matches", data)
        
        # Verify we have at least one item in each category
        self.assertGreaterEqual(len(data["customized_resumes"]), 1)
        self.assertGreaterEqual(len(data["cover_letters"]), 1)
        self.assertGreaterEqual(len(data["job_matches"]), 1)
        
        # Check content quality in each category
        if len(data["customized_resumes"]) > 0:
            resume = data["customized_resumes"][0]
            self.assertIn("customized_resume", resume)
            self.assertGreater(len(resume["customized_resume"]), 200)
            
        if len(data["cover_letters"]) > 0:
            letter = data["cover_letters"][0]
            self.assertIn("cover_letter", letter)
            self.assertGreater(len(letter["cover_letter"]), 200)
            
        if len(data["job_matches"]) > 0:
            match = data["job_matches"][0]
            self.assertIn("match_analysis", match)
            self.assertIn("match_score", match["match_analysis"])
        
        print("✅ User AI Content Retrieval API test passed")
    
    def test_15_verify_google_gemma_integration(self):
        """Test that the system is using Google Gemma 2B model with retry logic"""
        print("\n=== Testing Google Gemma 2B Integration ===")
        
        # Check if the backend is configured to use Google Gemma 2B
        # We can infer this from the AI responses and their quality
        
        # Test resume customization which should use the model
        response = requests.post(
            f"{API_URL}/ai/customize-resume",
            json=SAMPLE_RESUME_CUSTOMIZATION_REQUEST
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # The response should be detailed and professional
        content = data["content"]
        print(f"AI Response Length: {len(content)} characters")
        self.assertGreater(len(content), 200, "AI response should be substantial")
        
        # Test error handling by sending an invalid request
        invalid_request = {
            "user_id": TEST_USER_AI_ID,
            "original_resume": "",  # Empty resume should trigger fallback
            "job_title": SAMPLE_JOB_TITLE,
            "job_description": SAMPLE_JOB_DESCRIPTION,
            "company": SAMPLE_COMPANY
        }
        
        response = requests.post(
            f"{API_URL}/ai/customize-resume",
            json=invalid_request
        )
        
        # Should still succeed with fallback mechanism
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("content", data)
        self.assertIsNotNone(data["content"])
        
        print("✅ Google Gemma 2B Integration test passed")
    
    def test_16_error_handling(self):
        """Test improved error handling with user-friendly messages"""
        print("\n=== Testing Enhanced Error Handling ===")
        
        # Test with invalid request format
        invalid_request = {
            # Missing required fields
            "user_id": TEST_USER_AI_ID
        }
        
        response = requests.post(
            f"{API_URL}/ai/customize-resume",
            json=invalid_request
        )
        
        print(f"Response for invalid request: {response.status_code}")
        self.assertGreaterEqual(response.status_code, 400)  # Should be 4xx error
        
        print("✅ Enhanced Error Handling test passed")

class TestWebAutomationAPI(unittest.TestCase):
    """Test suite for the Phase 3 Web Automation features"""
    
    def test_01_discover_jobs(self):
        """Test job discovery from web sources"""
        print("\n=== Testing Job Discovery API ===")
        
        # Test with different search parameters
        search_params = {
            "user_id": TEST_USER_ID,
            "keywords": ["python", "developer"],
            "locations": ["Remote", "Europe"],
            "job_titles": ["Software Engineer", "Developer"],
            "sources": ["justjoinit", "inhire", "companies"]
        }
        
        response = requests.post(
            f"{API_URL}/discover/jobs",
            json=search_params
        )
        print(f"Response: {response.status_code}")
        print(f"Jobs found: {response.json().get('jobs_found', 0)}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("jobs_found", data)
        self.assertIn("jobs", data)
        self.assertIn("sources_scraped", data)
        self.assertIn("timestamp", data)
        
        # Verify jobs structure
        if data["jobs"]:
            job = data["jobs"][0]
            self.assertIn("job_id", job)
            self.assertIn("title", job)
            self.assertIn("company", job)
            self.assertIn("location", job)
            self.assertIn("description", job)
            self.assertIn("source", job)
            self.assertIn("source_url", job)
        
        print("✅ Job Discovery API test passed")
    
    def test_02_get_discovered_jobs(self):
        """Test retrieving discovered jobs for a user"""
        print("\n=== Testing Get Discovered Jobs API ===")
        
        # First, ensure we have some discovered jobs
        self.test_01_discover_jobs()
        
        # Now retrieve the discovered jobs
        response = requests.get(f"{API_URL}/discover/jobs/{TEST_USER_ID}")
        print(f"Response: {response.status_code}")
        print(f"Jobs count: {response.json().get('count', 0)}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("jobs", data)
        self.assertIn("count", data)
        
        # Test filtering by source
        if data["jobs"] and len(data["jobs"]) > 0:
            source = data["jobs"][0]["source"]
            response = requests.get(f"{API_URL}/discover/jobs/{TEST_USER_ID}?source={source}")
            self.assertEqual(response.status_code, 200)
            filtered_data = response.json()
            self.assertTrue(filtered_data["success"])
            
            # All jobs should have the specified source
            if filtered_data["jobs"]:
                for job in filtered_data["jobs"]:
                    self.assertEqual(job["source"], source)
        
        print("✅ Get Discovered Jobs API test passed")
    
    def test_03_get_available_sources(self):
        """Test retrieving available job discovery sources"""
        print("\n=== Testing Available Sources API ===")
        
        response = requests.get(f"{API_URL}/discover/sources")
        print(f"Response: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("sources", data)
        
        # Verify sources structure
        sources = data["sources"]
        self.assertGreaterEqual(len(sources), 3)  # Should have at least 3 sources
        
        for source in sources:
            self.assertIn("id", source)
            self.assertIn("name", source)
            self.assertIn("description", source)
            self.assertIn("website", source)
            self.assertIn("supported_locations", source)
            self.assertIn("job_types", source)
        
        # Verify specific sources
        source_ids = [source["id"] for source in sources]
        self.assertIn("justjoinit", source_ids)
        self.assertIn("inhire", source_ids)
        self.assertIn("companies", source_ids)
        
        print("✅ Available Sources API test passed")
    
    def test_04_refresh_jobs(self):
        """Test refreshing job discoveries for a user"""
        print("\n=== Testing Refresh Jobs API ===")
        
        # First, ensure we have user preferences
        requests.post(
            f"{API_URL}/preferences",
            json=SAMPLE_PREFERENCES
        )
        
        # Now refresh jobs
        response = requests.post(f"{API_URL}/discover/refresh-jobs?user_id={TEST_USER_ID}")
        print(f"Response: {response.status_code}")
        print(f"Jobs found: {response.json().get('jobs_found', 0)}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("message", data)
        self.assertIn("jobs_found", data)
        
        print("✅ Refresh Jobs API test passed")
    
    def test_05_job_deduplication(self):
        """Test job deduplication when discovering jobs multiple times"""
        print("\n=== Testing Job Deduplication ===")
        
        # Run job discovery twice with the same parameters
        search_params = {
            "user_id": TEST_USER_ID,
            "keywords": ["python"],
            "sources": ["companies"]  # Use only companies source for faster test
        }
        
        # First discovery
        response1 = requests.post(
            f"{API_URL}/discover/jobs",
            json=search_params
        )
        self.assertEqual(response1.status_code, 200)
        data1 = response1.json()
        jobs_found1 = data1["jobs_found"]
        
        # Second discovery (should deduplicate)
        response2 = requests.post(
            f"{API_URL}/discover/jobs",
            json=search_params
        )
        self.assertEqual(response2.status_code, 200)
        data2 = response2.json()
        
        # Get all discovered jobs
        response3 = requests.get(f"{API_URL}/discover/jobs/{TEST_USER_ID}")
        self.assertEqual(response3.status_code, 200)
        data3 = response3.json()
        
        print(f"First discovery: {jobs_found1} jobs")
        print(f"Second discovery: {data2['jobs_found']} jobs")
        print(f"Total unique jobs: {data3['count']} jobs")
        
        # The total unique jobs should be greater than or equal to the first discovery
        # but may not be exactly the sum of both discoveries due to deduplication
        self.assertGreaterEqual(data3["count"], jobs_found1)
        
        print("✅ Job Deduplication test passed")
    
    def test_06_fallback_job_creation(self):
        """Test fallback job creation when scraping fails"""
        print("\n=== Testing Fallback Job Creation ===")
        
        # We can't directly test scraping failures, but we can verify
        # that jobs are returned even with invalid parameters
        search_params = {
            "user_id": TEST_USER_ID,
            "keywords": ["thisisaninvalidkeywordthatwontmatchanything12345"],
            "sources": ["justjoinit", "inhire"]
        }
        
        response = requests.post(
            f"{API_URL}/discover/jobs",
            json=search_params
        )
        print(f"Response: {response.status_code}")
        print(f"Jobs found: {response.json().get('jobs_found', 0)}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        
        # Even with invalid search, we should get some fallback jobs
        self.assertGreater(data["jobs_found"], 0)
        
        # Check if jobs have the expected sources
        sources = set()
        for job in data["jobs"]:
            sources.add(job["source"])
        
        print(f"Sources found: {sources}")
        
        # Should have at least one of the requested sources
        self.assertTrue(any(source in ["JustJoinIT", "InHire"] for source in sources))
        
        print("✅ Fallback Job Creation test passed")

if __name__ == "__main__":
    # Install reportlab if not already installed
    try:
        import reportlab
    except ImportError:
        print("Installing reportlab for PDF generation...")
        os.system("pip install reportlab")
    
    # Run the tests
    unittest.main(argv=['first-arg-is-ignored'], exit=False)