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
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "555-123-4567",
    "location": "New York, NY",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "github_url": "https://github.com/johndoe",
    "portfolio_url": "https://johndoe.dev"
}

SAMPLE_PREFERENCES = {
    "user_id": TEST_USER_ID,
    "job_titles": ["Software Engineer", "Full Stack Developer"],
    "locations": ["New York, NY", "Remote"],
    "min_salary": 100000,
    "max_salary": 150000,
    "experience_level": "Mid-level",
    "job_type": "full-time",
    "keywords": ["Python", "React", "FastAPI", "MongoDB"],
    "excluded_companies": ["Bad Company Inc"]
}

# Helper function to create a test PDF
def create_test_pdf():
    """Create a simple PDF file for testing resume upload"""
    fd, path = tempfile.mkstemp(suffix='.pdf')
    os.close(fd)
    
    c = canvas.Canvas(path)
    c.drawString(100, 750, "John Doe")
    c.drawString(100, 735, "john.doe@example.com")
    c.drawString(100, 720, "555-123-4567")
    c.drawString(100, 705, "New York, NY")
    c.drawString(100, 690, "Skills: Python, React, FastAPI, MongoDB")
    c.drawString(100, 675, "Experience: 5 years of software development")
    c.save()
    
    return path

class TestBackendAPI(unittest.TestCase):
    """Test suite for the AI Job Application System backend API"""
    
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

if __name__ == "__main__":
    # Install reportlab if not already installed
    try:
        import reportlab
    except ImportError:
        print("Installing reportlab for PDF generation...")
        os.system("pip install reportlab")
    
    # Run the tests
    unittest.main(argv=['first-arg-is-ignored'], exit=False)