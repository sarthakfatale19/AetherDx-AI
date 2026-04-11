from pydantic import BaseModel
from typing import Optional, Dict, Any

class GatewayTokenRequest(BaseModel):
    clientId: str
    clientSecret: str

class GatewayTokenResponse(BaseModel):
    accessToken: str
    expiresIn: int
    tokenType: str

class LoginInitRequest(BaseModel):
    authMode: str
    identifier: str

class LoginInitResponse(BaseModel):
    transactionId: str
    message: str

class LoginVerifyRequest(BaseModel):
    transactionId: str
    otp: str

class UserProfile(BaseModel):
    abhaAddress: str
    name: str

class LoginVerifyResponse(BaseModel):
    accessToken: str
    expiresIn: int
    user: UserProfile

class RefreshResponse(BaseModel):
    accessToken: str
    expiresIn: int
