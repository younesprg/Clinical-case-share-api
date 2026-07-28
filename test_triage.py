import requests

# 1. Login
res = requests.post("http://localhost:8000/api/auth/login", data={"username": "testuser", "password": "password"})
if res.status_code != 200:
    print("Login failed:", res.status_code, res.text)
    # Let's try to register first
    res = requests.post("http://localhost:8000/api/auth/register", json={"email": "test@test.com", "password": "password", "name": "Test User", "role": "patient"})
    if res.status_code == 200:
        res = requests.post("http://localhost:8000/api/auth/login", data={"username": "test@test.com", "password": "password"})
    else:
        print("Register failed:", res.text)

if "access_token" in res.json():
    token = res.json()["access_token"]
    # 2. Chat
    chat_res = requests.post("http://localhost:8000/api/triage/chat", json={"message": "Başım ağrıyor", "session_id": None}, headers={"Authorization": f"Bearer {token}"})
    print("Chat response:", chat_res.status_code)
    print(chat_res.text)
else:
    print("No token")
