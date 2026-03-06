import requests
import sys
import json
from datetime import datetime, timedelta

class BeautySalonAPITester:
    def __init__(self, base_url="https://salon-reserve-pro-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.passed_tests.append(name)
                print(f"✅ Passed - {name}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {"message": "No JSON response"}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                self.failed_tests.append({"test": name, "error": error_msg, "response": response.text[:200]})
                print(f"❌ Failed - {error_msg}")
                if response.text:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            error_msg = f"Error: {str(e)}"
            self.failed_tests.append({"test": name, "error": error_msg})
            print(f"❌ Failed - {error_msg}")
            return False, {}

    def test_seed_data(self):
        """Test seeding initial data"""
        return self.run_test("Seed Data", "POST", "api/seed", 200)

    def test_get_site_settings(self):
        """Test getting public site settings"""
        return self.run_test("Get Site Settings", "GET", "api/site-settings", 200)

    def test_get_services(self):
        """Test getting all services"""
        success, response = self.run_test("Get Services", "GET", "api/services", 200)
        if success and len(response) > 0:
            print(f"   Found {len(response)} services")
        return success, response

    def test_get_service_by_id(self, service_id):
        """Test getting a specific service"""
        return self.run_test(f"Get Service {service_id}", "GET", f"api/services/{service_id}", 200)

    def test_get_available_slots(self, date, service_id):
        """Test getting available time slots"""
        return self.run_test(f"Get Available Slots", "GET", f"api/available-slots/{date}?service_id={service_id}", 200)

    def test_create_appointment(self, appointment_data):
        """Test creating an appointment"""
        return self.run_test("Create Appointment", "POST", "api/appointments", 201, appointment_data)

    def test_admin_register(self, admin_data):
        """Test admin registration"""
        success, response = self.run_test("Admin Register", "POST", "api/admin/register", 200, admin_data)
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Admin registered and token acquired")
        return success, response

    def test_admin_login(self, login_data):
        """Test admin login"""
        success, response = self.run_test("Admin Login", "POST", "api/admin/login", 200, login_data)
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Admin logged in and token acquired")
        return success, response

    def test_get_dashboard_stats(self):
        """Test getting dashboard statistics (requires auth)"""
        return self.run_test("Get Dashboard Stats", "GET", "api/admin/stats", 200)

    def test_get_appointments(self):
        """Test getting all appointments (requires auth)"""
        return self.run_test("Get All Appointments", "GET", "api/admin/appointments", 200)

    def test_create_service(self, service_data):
        """Test creating a new service (requires auth)"""
        return self.run_test("Create Service", "POST", "api/admin/services", 200, service_data)

    def test_get_admin_site_settings(self):
        """Test getting admin site settings (requires auth)"""
        return self.run_test("Get Admin Site Settings", "GET", "api/admin/settings/site", 200)

    def test_get_smtp_settings(self):
        """Test getting SMTP settings (requires auth)"""
        return self.run_test("Get SMTP Settings", "GET", "api/admin/settings/smtp", 200)

    def print_summary(self):
        """Print test summary"""
        print(f"\n{'='*60}")
        print(f"📊 TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for failed in self.failed_tests:
                print(f"  - {failed['test']}: {failed['error']}")
        
        if self.passed_tests:
            print(f"\n✅ Passed Tests:")
            for passed in self.passed_tests:
                print(f"  - {passed}")

def main():
    """Run comprehensive API tests"""
    print("🚀 Starting Beauty Salon API Tests")
    print("=" * 60)
    
    tester = BeautySalonAPITester()
    
    # Test basic public endpoints
    print("\n📋 TESTING PUBLIC ENDPOINTS")
    print("-" * 40)
    
    # Seed data first
    tester.test_seed_data()
    
    # Test site settings
    tester.test_get_site_settings()
    
    # Test services
    success, services = tester.test_get_services()
    service_id = None
    if success and services and len(services) > 0:
        service_id = services[0]['id']
        tester.test_get_service_by_id(service_id)
    
    # Test available slots
    if service_id:
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        tester.test_get_available_slots(tomorrow, service_id)
    
    # Test appointment creation
    if service_id:
        appointment_data = {
            "client_name": "Test Client",
            "client_email": "test@example.com",
            "client_phone": "0123456789",
            "service_id": service_id,
            "date": tomorrow,
            "time": "10:00",
            "notes": "Test appointment"
        }
        tester.test_create_appointment(appointment_data)
    
    # Test admin registration/login
    print("\n🔐 TESTING ADMIN AUTH")
    print("-" * 40)
    
    admin_data = {
        "email": f"admin_{datetime.now().strftime('%H%M%S')}@test.com",
        "password": "TestAdmin123!",
        "name": "Test Admin"
    }
    
    tester.test_admin_register(admin_data)
    
    # Test admin endpoints (require auth)
    print("\n⚙️ TESTING ADMIN ENDPOINTS")
    print("-" * 40)
    
    if tester.token:
        tester.test_get_dashboard_stats()
        tester.test_get_appointments()
        tester.test_get_admin_site_settings()
        tester.test_get_smtp_settings()
        
        # Test service creation
        new_service_data = {
            "name": "Test Service",
            "category": "nails",
            "description": "A test service",
            "duration": 30,
            "price": 25.0
        }
        tester.test_create_service(new_service_data)
    else:
        print("⚠️ Skipping admin tests - no auth token")
    
    # Print summary
    tester.print_summary()
    
    return 0 if len(tester.failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())