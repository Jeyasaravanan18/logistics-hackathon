import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

load_dotenv()

# We will use Postgres in Docker, but fallback to SQLite for local rapid dev if DB_URL is missing
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./hackathon.db")

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    # connect_args={"check_same_thread": False} if using sqlite
    **({"connect_args": {"check_same_thread": False}} if "sqlite" in DATABASE_URL else {})
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
