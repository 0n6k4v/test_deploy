from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from config.database import get_db
from schemas.user import UserCreate, UserResponse, UserBrief, UserUpdate
from services.user_service import create_user, get_all_users, get_user_by_id, update_user, delete_user

router = APIRouter()


@router.post("/users/create", response_model=UserBrief, status_code=status.HTTP_201_CREATED)
async def create_new_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new user with the provided information
    """
    db_user = await create_user(db=db, user=user)
    return UserBrief(
        id=db_user.id,
        user_code=db_user.user_code,
        email=db_user.email
    )


@router.get("/users/list", response_model=List[UserResponse])
async def get_users(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """
    Get all users with their role information
    """
    users = await get_all_users(db, skip=skip, limit=limit)
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get a user by ID
    """
    return await get_user_by_id(db, user_id=user_id)


@router.put("/users/{user_id}", response_model=UserBrief)
async def update_user_info(user_id: int, user_update: UserUpdate, db: AsyncSession = Depends(get_db)):
    """
    Update a user's information
    """
    db_user = await update_user(db=db, user_id=user_id, user_update=user_update)
    return UserBrief(
        id=db_user.id,
        user_code=db_user.user_code,
        email=db_user.email
    )


@router.delete("/users/{user_id}")
async def remove_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Delete a user
    """
    result = await delete_user(db=db, user_id=user_id)
    return result