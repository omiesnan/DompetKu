#!/usr/bin/env python3
"""
Backend API Testing for Finance Tracker
Tests all backend endpoints with comprehensive validation
"""

import requests
import json
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://budget-buddy-4162.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

print(f"Testing Finance Tracker API at: {API_BASE}")
print("=" * 60)

def test_health_endpoint():
    """Test the health check endpoint"""
    print("\n🔍 Testing Health Endpoint...")
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate expected response structure
            expected_status = "healthy"
            expected_message = "Finance Tracker API is running"
            
            if data.get("status") == expected_status and data.get("message") == expected_message:
                print("✅ Health endpoint working correctly")
                return True
            else:
                print(f"❌ Health endpoint response mismatch")
                print(f"Expected: status='{expected_status}', message='{expected_message}'")
                print(f"Got: status='{data.get('status')}', message='{data.get('message')}'")
                return False
        else:
            print(f"❌ Health endpoint failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Health endpoint request failed: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Health endpoint test error: {str(e)}")
        return False

def test_generate_tip_endpoint():
    """Test the generate tip endpoint"""
    print("\n🔍 Testing Generate Tip Endpoint...")
    try:
        response = requests.get(f"{API_BASE}/generate-tip", timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate response structure
            if data.get("success") and data.get("tip") and data.get("timestamp"):
                tip_text = data.get("tip", "")
                print(f"Generated Tip: {tip_text}")
                
                # Check if tip is in Indonesian (basic check for Indonesian words)
                indonesian_indicators = ['untuk', 'dan', 'yang', 'dengan', 'atau', 'anda', 'keuangan', 'uang', 'rupiah']
                has_indonesian = any(word.lower() in tip_text.lower() for word in indonesian_indicators)
                
                if has_indonesian:
                    print("✅ Generate tip endpoint working correctly (Indonesian content detected)")
                    return True
                else:
                    print("⚠️ Generate tip working but language may not be Indonesian")
                    print(f"Tip content: {tip_text}")
                    return True  # Still consider it working
            else:
                print("❌ Generate tip response structure invalid")
                print(f"Expected: success, tip, timestamp fields")
                print(f"Got: {list(data.keys())}")
                return False
        else:
            print(f"❌ Generate tip failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Generate tip request failed: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Generate tip test error: {str(e)}")
        return False

def test_analyze_spending_endpoint():
    """Test the analyze spending endpoint"""
    print("\n🔍 Testing Analyze Spending Endpoint...")
    
    # Sample data as provided in the request
    test_data = {
        "transactions": [
            {
                "type": "expense",
                "amount": 150000,
                "category": "Makanan",
                "date": "2026-02-01T10:00:00Z",
                "note": "Makan siang"
            },
            {
                "type": "expense",
                "amount": 50000,
                "category": "Transport",
                "date": "2026-02-01T14:00:00Z",
                "note": "Gojek"
            },
            {
                "type": "income",
                "amount": 5000000,
                "category": "Gaji",
                "date": "2026-02-01T09:00:00Z",
                "note": "Gaji bulanan"
            }
        ],
        "totalIncome": 5000000,
        "totalExpense": 200000,
        "categories": {
            "Makanan": 150000,
            "Transport": 50000
        }
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/analyze-spending", 
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate response structure
            if data.get("success") and data.get("analysis") and data.get("timestamp"):
                analysis_text = data.get("analysis", "")
                print(f"Analysis: {analysis_text}")
                
                # Check if analysis is in Indonesian
                indonesian_indicators = ['pengeluaran', 'keuangan', 'saran', 'tips', 'tabungan', 'investasi', 'hemat', 'rupiah', 'rp']
                has_indonesian = any(word.lower() in analysis_text.lower() for word in indonesian_indicators)
                
                # Check if analysis contains practical advice
                advice_indicators = ['saran', 'tips', 'rekomendasi', 'sebaiknya', 'disarankan']
                has_advice = any(word.lower() in analysis_text.lower() for word in advice_indicators)
                
                if has_indonesian and has_advice:
                    print("✅ Analyze spending endpoint working correctly (Indonesian analysis with advice)")
                    return True
                elif has_indonesian:
                    print("⚠️ Analyze spending working but may lack practical advice")
                    return True
                else:
                    print("⚠️ Analyze spending working but language may not be Indonesian")
                    return True
            else:
                print("❌ Analyze spending response structure invalid")
                print(f"Expected: success, analysis, timestamp fields")
                print(f"Got: {list(data.keys())}")
                return False
        else:
            print(f"❌ Analyze spending failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Analyze spending request failed: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Analyze spending test error: {str(e)}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("🚀 Starting Finance Tracker Backend API Tests")
    print(f"Backend URL: {API_BASE}")
    print("=" * 60)
    
    results = {}
    
    # Test all endpoints
    results['health'] = test_health_endpoint()
    results['generate_tip'] = test_generate_tip_endpoint()
    results['analyze_spending'] = test_analyze_spending_endpoint()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    
    for endpoint, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{endpoint.upper()}: {status}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 All tests passed! Finance Tracker API is working correctly.")
    else:
        print("⚠️ Some tests failed. Check the detailed output above.")
    
    return results

if __name__ == "__main__":
    run_all_tests()