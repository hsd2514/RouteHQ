from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db
from app.deps import require_role

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("", response_model=list[schemas.TripOut])
def list_trips(
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Trip)
    if status:
        query = query.filter(models.Trip.status == status)
    return query.order_by(models.Trip.id.desc()).all()


@router.get("/{trip_id}", response_model=schemas.TripOut)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.post("", response_model=schemas.TripOut, dependencies=[Depends(require_role("fleet_manager", "driver"))])
def create_trip(payload: schemas.TripCreate, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=400, detail="Vehicle not found")

    driver = db.query(models.Driver).filter(models.Driver.id == payload.driver_id).first()
    if not driver:
        raise HTTPException(status_code=400, detail="Driver not found")

    trip = models.Trip(**payload.model_dump())
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.post("/{trip_id}/dispatch", response_model=schemas.TripOut, dependencies=[Depends(require_role("fleet_manager", "driver"))])
def dispatch_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip.status != "draft":
        raise HTTPException(status_code=400, detail=f"Trip cannot be dispatched from status '{trip.status}'")

    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == trip.vehicle_id).first()
    if vehicle.status != "available":
        raise HTTPException(status_code=400, detail=f"Vehicle {vehicle.reg_number} is not available (status: {vehicle.status})")

    driver = db.query(models.Driver).filter(models.Driver.id == trip.driver_id).first()
    if driver.status != "available":
        raise HTTPException(status_code=400, detail=f"Driver {driver.name} is not available (status: {driver.status})")

    if driver.license_expiry < date.today():
        raise HTTPException(status_code=400, detail=f"Driver {driver.name}'s license expired on {driver.license_expiry}")

    if trip.cargo_weight > vehicle.max_load_capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Cargo weight {trip.cargo_weight}kg exceeds vehicle capacity of {vehicle.max_load_capacity}kg",
        )

    trip.status = "dispatched"
    trip.dispatched_at = datetime.utcnow()
    vehicle.status = "on_trip"
    driver.status = "on_trip"

    db.commit()
    db.refresh(trip)
    return trip


@router.post("/{trip_id}/complete", response_model=schemas.TripOut, dependencies=[Depends(require_role("fleet_manager", "driver"))])
def complete_trip(trip_id: int, payload: schemas.TripCompleteIn, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip.status != "dispatched":
        raise HTTPException(status_code=400, detail=f"Trip cannot be completed from status '{trip.status}'")

    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == trip.vehicle_id).first()
    driver = db.query(models.Driver).filter(models.Driver.id == trip.driver_id).first()

    if payload.final_odometer < vehicle.odometer:
        raise HTTPException(
            status_code=400,
            detail=f"Final odometer ({payload.final_odometer}) cannot be less than current odometer ({vehicle.odometer})",
        )

    trip.actual_distance = payload.actual_distance
    trip.fuel_consumed = payload.fuel_consumed
    trip.fuel_efficiency = (
        payload.actual_distance / payload.fuel_consumed if payload.fuel_consumed else None
    )
    trip.status = "completed"
    trip.completed_at = datetime.utcnow()

    vehicle.odometer = payload.final_odometer
    vehicle.status = "available"
    driver.status = "available"

    db.commit()
    db.refresh(trip)
    return trip


@router.post("/{trip_id}/cancel", response_model=schemas.TripOut, dependencies=[Depends(require_role("fleet_manager", "driver"))])
def cancel_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip.status not in ("draft", "dispatched"):
        raise HTTPException(status_code=400, detail=f"Trip cannot be cancelled from status '{trip.status}'")

    if trip.status == "dispatched":
        vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == trip.vehicle_id).first()
        driver = db.query(models.Driver).filter(models.Driver.id == trip.driver_id).first()
        vehicle.status = "available"
        driver.status = "available"

    trip.status = "cancelled"

    db.commit()
    db.refresh(trip)
    return trip
