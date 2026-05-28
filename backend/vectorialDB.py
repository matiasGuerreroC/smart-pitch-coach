import os
from sqlalchemy import create_engine, Column, String, Integer, Text, Boolean, text
from sqlalchemy.orm import declarative_base, sessionmaker
from pgvector.sqlalchemy import Vector
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("Falta DATABASE_URL en el archivo .env")

# Conexión a Neon.tech con protección para bases de datos Serverless
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"keepalives": 1, "keepalives_idle": 30, "keepalives_interval": 10, "keepalives_count": 5}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Rubrica(Base):
    __tablename__ = "rubricas"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
    is_default = Column(Boolean, default=False) # Para saber si son las de ANID/Corfo o subidas por usuarios

class RubricaChunk(Base):
    __tablename__ = "rubrica_chunks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    rubric_id = Column(String)
    texto = Column(Text, nullable=False)
    embedding = Column(Vector(3072))

def init_db():
    # Enciende la extensión matemática de vectores en Neon
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()