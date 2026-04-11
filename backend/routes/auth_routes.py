from fastapi import APIRouter, HTTPException, Request, Response, status, Cookie
from typing import Optional
from models.auth_models import (
    GatewayTokenRequest, GatewayTokenResponse,
    LoginInitRequest, LoginInitResponse,
    LoginVerifyRequest, LoginVerifyResponse,
    RefreshResponse
)
from services.auth_service import auth_service

router = APIRouter(tags=["ABDM Authentication"])

@router.post("/auth/v1/gateway/token", response_model=GatewayTokenResponse)
async def fetch_gateway_token(request: GatewayTokenRequest):
    try:
        data = auth_service.generate_gateway_token(request.clientId, request.clientSecret)
        return GatewayTokenResponse(**data)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/auth/v1/patient/login/init", response_model=LoginInitResponse)
async def login_init(payload: LoginInitRequest, request: Request):
    ip_address = request.client.host if request.client else "unknown"
    try:
        data = auth_service.init_login(payload.authMode, payload.identifier, ip_address)
        return LoginInitResponse(**data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/auth/v1/patient/login/verify", response_model=LoginVerifyResponse)
async def login_verify(payload: LoginVerifyRequest, response: Response):
    try:
        data, refresh_token = auth_service.verify_login(payload.transactionId, payload.otp)
        
        # Set HttpOnly cookie for Refresh Token
        response.set_cookie(
            key="aetherdx_refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,     # True in production (HTTPS)
            samesite="lax",
            max_age=7 * 24 * 60 * 60 # 7 days
        )
        
        return LoginVerifyResponse(**data)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/auth/v1/session/refresh", response_model=RefreshResponse)
async def session_refresh(response: Response, aetherdx_refresh_token: Optional[str] = Cookie(None)):
    if not aetherdx_refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")
        
    try:
        data, new_refresh_token = auth_service.refresh_session(aetherdx_refresh_token)
        
        response.set_cookie(
            key="aetherdx_refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=7 * 24 * 60 * 60
        )
        return RefreshResponse(**data)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
