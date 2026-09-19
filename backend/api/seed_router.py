from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.db.database import get_db, Base, engine
from backend.db.seed import seed_database

router = APIRouter(prefix="/seed", tags=["Seed"])

@router.post("/reset")
def reset_and_seed_database():
    """Drops tables and re-seeds initial institutional memory records."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    seed_database(db)
    return {"success": True, "message": "Database reset and seeded with initial demo data."}
