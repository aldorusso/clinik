#!/usr/bin/env python3

import sys
import os
import asyncio
import httpx
import json

async def test_login_and_appointments():
    """Test login and appointments API access"""
    
    base_url = "http://localhost:8002"
    
    async with httpx.AsyncClient() as client:
        # Test login
        print("🔐 Testing login...")
        login_data = {
            "username": "mgclinic@gmail.com",
            "password": "mgclinic123"
        }
        
        login_response = await client.post(
            f"{base_url}/api/v1/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"Login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            access_token = login_result.get("access_token")
            print(f"✅ Login successful! Token: {access_token[:20]}...")
            
            # Test appointments API
            print("\n📅 Testing appointments API...")
            headers = {"Authorization": f"Bearer {access_token}"}
            
            # Test without dates
            appointments_response = await client.get(
                f"{base_url}/api/v1/appointments/?page_size=5&order_by=scheduled_at&order_direction=asc",
                headers=headers
            )
            
            print(f"Appointments (no dates) status: {appointments_response.status_code}")
            if appointments_response.status_code == 200:
                appointments = appointments_response.json()
                print(f"✅ Found {len(appointments)} appointments")
                for apt in appointments[:3]:
                    print(f"  - {apt.get('patient_name')} ({apt.get('scheduled_at')})")
            else:
                print(f"❌ Appointments error: {appointments_response.text}")
            
            # Test with dates
            appointments_with_dates = await client.get(
                f"{base_url}/api/v1/appointments/?page_size=5&date_from=2025-12-15&date_to=2025-12-20&order_by=scheduled_at&order_direction=asc",
                headers=headers
            )
            
            print(f"\nAppointments (with dates) status: {appointments_with_dates.status_code}")
            if appointments_with_dates.status_code == 200:
                appointments = appointments_with_dates.json()
                print(f"✅ Found {len(appointments)} appointments with date filter")
            else:
                print(f"❌ Appointments with dates error: {appointments_with_dates.text}")
                
        else:
            print(f"❌ Login failed: {login_response.text}")

if __name__ == "__main__":
    asyncio.run(test_login_and_appointments())