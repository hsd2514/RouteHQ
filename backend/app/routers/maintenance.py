from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db
from app.deps import require_role

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


@router.get("", response_model=list[schemas.MaintenanceOut])
def list_maintenance(
    vehicle_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.MaintenanceLog)
    if vehicle_id:
        query = query.filter(models.MaintenanceLog.vehicle_id == vehicle_id)
    return query.order_by(models.MaintenanceLog.id.desc()).all()


@router.post("", response_model=schemas.MaintenanceOut, dependencies=[Depends(require_role("fleet_manager"))])
def create_maintenance(payload: schemas.MaintenanceCreate, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=400, detail="Vehicle not found")

    if vehicle.status == "on_trip":
        raise HTTPException(status_code=400, detail="Cannot service a vehicle that is currently on trip")

    log = models.MaintenanceLog(**payload.model_dump())
    db.add(log)
    vehicle.status = "in_shop"

    db.commit()
    db.refresh(log)
    return log


@router.post("/{log_id}/close", response_model=schemas.MaintenanceOut, dependencies=[Depends(require_role("fleet_manager"))])
def close_maintenance(log_id: int, db: Session = Depends(get_db)):
    log = db.query(models.MaintenanceLog).filter(models.MaintenanceLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Maintenance log not found")

    if log.status != "active":
        raise HTTPException(status_code=400, detail="Maintenance log is already closed")

    log.status = "closed"
    log.closed_at = datetime.utcnow()

    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == log.vehicle_id).first()
    if vehicle.status != "retired":
        vehicle.status = "available"

    db.commit()
    db.refresh(log)
    return log
