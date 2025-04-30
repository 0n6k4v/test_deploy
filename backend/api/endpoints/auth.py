from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta

from config.database import get_db
from schemas.user import LoginRequest, Token
from services.user_service import authenticate_user
from core.auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(tags=["authentication"])


@router.post("/auth/login", response_model=Token)
async def login_for_access_token(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token with expiration time
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    # Return token and user info
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        user_system_id=user.user_id,
        email=user.email,
        firstname=user.firstname,
        lastname=user.lastname,
        role=user.role,
        department=user.department
    )


@router.post("/auth/token", response_model=Token)
async def login_with_form(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """Endpoint for OAuth2 password flow (used by Swagger UI)"""
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        user_system_id=user.user_id,
        email=user.email,
        firstname=user.firstname,
        lastname=user.lastname,
        role=user.role,
        department=user.department
    )