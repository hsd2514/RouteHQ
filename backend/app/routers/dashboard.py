from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpis", response_model=schemas.DashboardKpis)
def get_kpis(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    vehicles = db.query(models.Vehicle).all()
    drivers = db.query(models.Driver).all()
    trips = db.query(models.Trip).all()

    active_vehicles = [v for v in vehicles if v.status != "retired"]
    on_trip_vehicles = [v for v in active_vehicles if v.status == "on_trip"]

    fleet_utilization = (
        len(on_trip_vehicles) / len(active_vehicles) * 100 if active_vehicles else 0.0
    )

    return schemas.DashboardKpis(
        active_vehicles=len(active_vehicles),
        available_vehicles=sum(1 for v in vehicles if v.status == "available"),
        in_maintenance=sum(1 for v in vehicles if v.status == "in_shop"),
        active_trips=sum(1 for t in trips if t.status == "dispatched"),
        pending_trips=sum(1 for t in trips if t.status == "draft"),
        drivers_on_duty=sum(1 for d in drivers if d.status in ("available", "on_trip")),
        fleet_utilization=round(fleet_utilization, 2),
    )
