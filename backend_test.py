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
        """Test retrieving jobs based on preferences"""
        print("\n=== Testing Jobs Retrieval API ===")
        response = requests.get(f"{API_URL}/jobs?user_id={TEST_USER_ID}")
        print(f"Response: {response.status_code} - {response.text}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("jobs", data)
        self.assertIn("count", data)
        
        print("✅ Jobs Retrieval API test passed")
    
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
        """Test AI resume customization endpoint"""
        print("\n=== Testing AI Resume Customization API ===")
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
        self.assertGreater(len(data["content"]), 50)  # Ensure we got a substantial response
        self.assertIn("metadata", data)
        self.assertEqual(data["metadata"]["job_title"], SAMPLE_JOB_TITLE)
        self.assertEqual(data["metadata"]["company"], SAMPLE_COMPANY)
        
        print("✅ AI Resume Customization API test passed")
    
    def test_11_ai_generate_cover_letter(self):
        """Test AI cover letter generation endpoint"""
        print("\n=== Testing AI Cover Letter Generation API ===")
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
        self.assertGreater(len(data["content"]), 50)  # Ensure we got a substantial response
        self.assertIn("metadata", data)
        self.assertEqual(data["metadata"]["job_title"], SAMPLE_JOB_TITLE)
        self.assertEqual(data["metadata"]["company"], SAMPLE_COMPANY)
        
        print("✅ AI Cover Letter Generation API test passed")
    
    def test_12_ai_analyze_job_match(self):
        """Test AI job match analysis endpoint"""
        print("\n=== Testing AI Job Match Analysis API ===")
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
        
        # Check if metadata contains expected fields
        metadata = data["metadata"]
        self.assertIn("match_score", metadata)
        self.assertIn("strengths", metadata)
        self.assertIn("gaps", metadata)
        self.assertIn("recommendations", metadata)
        self.assertIn("summary", metadata)
        
        print("✅ AI Job Match Analysis API test passed")
    
    def test_13_ai_apply_to_job(self):
        """Test AI job application endpoint"""
        print("\n=== Testing AI Job Application API ===")
        
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
        
        print("✅ AI Job Application API test passed")
    
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
        
        print("✅ User AI Content Retrieval API test passed")
    
    def test_15_sample_jobs_exist(self):
        """Test that sample jobs are created if none exist"""
        print("\n=== Testing Sample Jobs Creation ===")
        response = requests.get(f"{API_URL}/jobs?user_id={TEST_USER_ID}")
        print(f"Response: {response.status_code}")
        print(f"Jobs count: {response.json()['count']}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("jobs", data)
        self.assertGreater(data["count"], 0)  # Ensure we have at least one job
        
        # Check if the sample jobs have the expected structure
        job = data["jobs"][0]
        self.assertIn("job_id", job)
        self.assertIn("title", job)
        self.assertIn("company", job)
        self.assertIn("description", job)
        self.assertIn("requirements", job)
        
        print("✅ Sample Jobs Creation test passed")

if __name__ == "__main__":
    # Install reportlab if not already installed
    try:
        import reportlab
    except ImportError:
        print("Installing reportlab for PDF generation...")
        os.system("pip install reportlab")
    
    # Run the tests
    unittest.main(argv=['first-arg-is-ignored'], exit=False)