import jwt
import uuid
import datetime
import os
from typing import Optional, Dict

JWT_SECRET = os.getenv("JWT_SECRET", "super-secure-aetherdx-secret-key-replace-in-prod")
GATEWAY_MOCK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-abdm-gateway-token"

# In-memory mock replacing Redis for local testing
_MOCK_REDIS_CACHE: Dict[str, dict] = {}

class AuthService:
    def __init__(self):
        pass
        
    def generate_gateway_token(self, client_id: str, client_secret: str):
        if not client_id or not client_secret:
            raise ValueError("Invalid client credentials")
        return {
            "accessToken": GATEWAY_MOCK_TOKEN,
            "expiresIn": 3600,
            "tokenType": "Bearer"
        }
        
    def init_login(self, auth_mode: str, identifier: str, ip_address: str):
        # Rate limit simulation could go here
        txn_id = f"txn-{uuid.uuid4()}"
        
        # Store in mock redis
        _MOCK_REDIS_CACHE[txn_id] = {
            "identifier": identifier,
            "ip": ip_address,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        
        return {
            "transactionId": txn_id,
            "message": f"OTP sent to mobile linked with {identifier}"
        }
        
    def verify_login(self, txn_id: str, otp: str):
        if txn_id not in _MOCK_REDIS_CACHE:
            raise ValueError("Invalid or expired transactionId")
            
        if otp != "123456": # Mock OTP validation
            raise ValueError("Invalid OTP")
            
        session_data = _MOCK_REDIS_CACHE.pop(txn_id)
        identifier = session_data["identifier"]
        
        access_token, refresh_token = self._generate_tokens(identifier)
        
        return {
            "accessToken": access_token,
            "expiresIn": 900,
            "user": {
                "abhaAddress": identifier,
                "name": "Patient User" # Mock demo profile lookup
            }
        }, refresh_token

    def refresh_session(self, refresh_token: str):
        try:
            payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=["HS256"])
            identifier = payload.get("sub")
            if payload.get("type") != "refresh":
                raise ValueError("Invalid token type")
                
            access_token, new_refresh = self._generate_tokens(identifier)
            return {
                "accessToken": access_token,
                "expiresIn": 900
            }, new_refresh
        except Exception:
            raise ValueError("Invalid or expired refresh token")
            
    def _generate_tokens(self, identifier: str):
        now = datetime.datetime.now(datetime.timezone.utc)
        access_payload = {
            "sub": identifier,
            "type": "access",
            "exp": now + datetime.timedelta(minutes=15),
            "iat": now
        }
        refresh_payload = {
            "sub": identifier,
            "type": "refresh",
            "exp": now + datetime.timedelta(days=7),
            "iat": now
        }
        access_token = jwt.encode(access_payload, JWT_SECRET, algorithm="HS256")
        refresh_token = jwt.encode(refresh_payload, JWT_SECRET, algorithm="HS256")
        
        return access_token, refresh_token

auth_service = AuthService()
