from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db
from app.deps import require_role

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("", response_model=list[schemas.VehicleOut])
def list_vehicles(
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Vehicle)
    if status:
        query = query.filter(models.Vehicle.status == status)
    return query.order_by(models.Vehicle.id).all()


@router.post("", response_model=schemas.VehicleOut, dependencies=[Depends(require_role("fleet_manager"))])
def create_vehicle(payload: schemas.VehicleCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Vehicle).filter(models.Vehicle.reg_number == payload.reg_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="A vehicle with this registration number already exists")

    vehicle = models.Vehicle(**payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("/{vehicle_id}", response_model=schemas.VehicleOut)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.patch("/{vehicle_id}", response_model=schemas.VehicleOut, dependencies=[Depends(require_role("fleet_manager"))])
def update_vehicle(vehicle_id: int, payload: schemas.VehicleUpdate, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(vehicle, field, value)

    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", dependencies=[Depends(require_role("fleet_manager"))])
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(vehicle)
    db.commit()
    return {"detail": "Vehicle deleted"}


@router.get("/{vehicle_id}/history")
def vehicle_history(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    trips = db.query(models.Trip).filter(models.Trip.vehicle_id == vehicle_id).order_by(models.Trip.created_at.desc()).all()
    maintenance = db.query(models.MaintenanceLog).filter(models.MaintenanceLog.vehicle_id == vehicle_id).order_by(models.MaintenanceLog.created_at.desc()).all()
    fuel_logs = db.query(models.FuelLog).filter(models.FuelLog.vehicle_id == vehicle_id).all()
    expenses = db.query(models.Expense).filter(models.Expense.vehicle_id == vehicle_id).all()

    total_cost = (
        sum(m.cost for m in maintenance)
        + sum(f.cost for f in fuel_logs)
        + sum(e.amount for e in expenses)
    )

    return {
        "vehicle": schemas.VehicleOut.model_validate(vehicle),
        "trips": [schemas.TripOut.model_validate(t) for t in trips],
        "maintenance": [schemas.MaintenanceOut.model_validate(m) for m in maintenance],
        "total_cost": total_cost,
    }
