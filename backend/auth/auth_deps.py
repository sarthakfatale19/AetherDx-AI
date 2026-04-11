import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

# NextAuth configuration
NEXTAUTH_SECRET = os.getenv("NEXTAUTH_SECRET", "fallback_secret_for_local_dev_only")
ALGORITHM = "HS256" # Default for NextAuth with secret

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Decodes and verifies the NextAuth JWT from the Authorization header.
    Expects 'Bearer <token>'
    """
    token = credentials.credentials
    try:
        # Note: NextAuth by default uses a slightly different JWT structure (JWE)
        # but if we are passing a plain signed JWT from frontend, this works.
        # If the frontend passes the raw session token cookie, we might need a different approach.
        payload = jwt.decode(token, NEXTAUTH_SECRET, algorithms=[ALGORITHM])
        
        user_id = payload.get("id")
        role = payload.get("role")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return {
            "id": user_id,
            "role": role,
            "email": payload.get("email")
        }
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def require_role(allowed_roles: list):
    """
    Dependency factor for role-based access control.
    """
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have enough permissions to access this resource"
            )
        return user
    return role_checker
