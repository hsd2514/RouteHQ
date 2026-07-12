from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db
from app.deps import require_role

router = APIRouter(prefix="/fuel-logs", tags=["fuel"])


@router.get("", response_model=list[schemas.FuelLogOut])
def list_fuel_logs(
    vehicle_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.FuelLog)
    if vehicle_id:
        query = query.filter(models.FuelLog.vehicle_id == vehicle_id)
    return query.order_by(models.FuelLog.id.desc()).all()


@router.post("", response_model=schemas.FuelLogOut, dependencies=[Depends(require_role("fleet_manager", "financial_analyst", "driver"))])
def create_fuel_log(payload: schemas.FuelLogCreate, db: Session = Depends(get_db)):
    log = models.FuelLog(**payload.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
