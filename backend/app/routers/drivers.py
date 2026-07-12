from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db
from app.deps import require_role

router = APIRouter(prefix="/drivers", tags=["drivers"])


@router.get("", response_model=list[schemas.DriverOut])
def list_drivers(
    status: str | None = None,
    assignable: bool | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Driver)
    if status:
        query = query.filter(models.Driver.status == status)
    if assignable:
        query = query.filter(
            models.Driver.status == "available",
            models.Driver.license_expiry >= date.today(),
        )
    return query.order_by(models.Driver.id).all()


@router.get("/expiring", response_model=list[schemas.DriverOut])
def expiring_licenses(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cutoff = date.today() + timedelta(days=days)
    return (
        db.query(models.Driver)
        .filter(models.Driver.license_expiry <= cutoff)
        .order_by(models.Driver.license_expiry)
        .all()
    )


@router.post("", response_model=schemas.DriverOut, dependencies=[Depends(require_role("fleet_manager", "safety_officer"))])
def create_driver(payload: schemas.DriverCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Driver).filter(models.Driver.license_number == payload.license_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="A driver with this license number already exists")

    driver = models.Driver(**payload.model_dump())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


@router.get("/{driver_id}", response_model=schemas.DriverOut)
def get_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver


@router.patch("/{driver_id}", response_model=schemas.DriverOut, dependencies=[Depends(require_role("fleet_manager", "safety_officer"))])
def update_driver(driver_id: int, payload: schemas.DriverUpdate, db: Session = Depends(get_db)):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(driver, field, value)

    db.commit()
    db.refresh(driver)
    return driver


@router.delete("/{driver_id}", dependencies=[Depends(require_role("fleet_manager", "safety_officer"))])
def delete_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    db.delete(driver)
    db.commit()
    return {"detail": "Driver deleted"}
