import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
import psycopg2

load_dotenv()

# Get DATABASE_URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback to individual environment variables for local development
    DB_USER = os.getenv("DB_USER")
    DB_HOST = os.getenv("DB_HOST")
    DB_NAME = os.getenv("DB_NAME")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_PORT = os.getenv("DB_PORT")
    DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Convert DATABASE_URL to asyncpg format if needed
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    DATABASE_URL,
    echo=True,
)

async_session_factory = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    """
    Dependency function that yields DB sessions
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def connect_to_database():
    """
    Initialize database connection
    """
    try:
        async with engine.begin() as conn:
            print("Connected to PostgreSQL Database")
            
        return True
    except Exception as e:
        print(f"Error connecting to PostgreSQL Database: {e}")
        return False

def get_db_connection():
    """
    Get a direct PostgreSQL connection for raw SQL queries
    
    Returns:
        psycopg2.connection: A connection to the PostgreSQL database
    """
    try:
        # Convert DATABASE_URL to psycopg2 format
        db_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        conn = psycopg2.connect(db_url)
        return conn
    except Exception as e:
        print(f"Error connecting to PostgreSQL Database directly: {e}")
        raise