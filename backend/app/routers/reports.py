import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/reports", tags=["reports"])


def _build_vehicle_cost_rows(db: Session) -> list[schemas.VehicleCostRow]:
    vehicles = db.query(models.Vehicle).all()
    rows: list[schemas.VehicleCostRow] = []

    for vehicle in vehicles:
        fuel_logs = db.query(models.FuelLog).filter(models.FuelLog.vehicle_id == vehicle.id).all()
        maintenance = db.query(models.MaintenanceLog).filter(models.MaintenanceLog.vehicle_id == vehicle.id).all()
        expenses = db.query(models.Expense).filter(models.Expense.vehicle_id == vehicle.id).all()
        trips = db.query(models.Trip).filter(models.Trip.vehicle_id == vehicle.id).all()
        completed_trips = [t for t in trips if t.status == "completed" and t.fuel_efficiency is not None]

        total_fuel_cost = sum(f.cost for f in fuel_logs)
        total_maintenance_cost = sum(m.cost for m in maintenance)
        total_expenses = sum(e.amount for e in expenses)

        avg_fuel_efficiency = (
            sum(t.fuel_efficiency for t in completed_trips) / len(completed_trips)
            if completed_trips
            else None
        )

        rows.append(
            schemas.VehicleCostRow(
                vehicle_id=vehicle.id,
                reg_number=vehicle.reg_number,
                name=vehicle.name,
                total_fuel_cost=total_fuel_cost,
                total_maintenance_cost=total_maintenance_cost,
                total_expenses=total_expenses,
                operational_cost=total_fuel_cost + total_maintenance_cost + total_expenses,
                avg_fuel_efficiency=round(avg_fuel_efficiency, 2) if avg_fuel_efficiency else None,
                trip_count=len(trips),
            )
        )

    return rows


@router.get("/vehicle-costs", response_model=list[schemas.VehicleCostRow])
def vehicle_costs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return _build_vehicle_cost_rows(db)


@router.get("/vehicle-costs/csv")
def vehicle_costs_csv(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rows = _build_vehicle_cost_rows(db)

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "vehicle_id", "reg_number", "name", "total_fuel_cost",
        "total_maintenance_cost", "total_expenses", "operational_cost",
        "avg_fuel_efficiency", "trip_count",
    ])
    for row in rows:
        writer.writerow([
            row.vehicle_id, row.reg_number, row.name, row.total_fuel_cost,
            row.total_maintenance_cost, row.total_expenses, row.operational_cost,
            row.avg_fuel_efficiency, row.trip_count,
        ])
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vehicle-costs.csv"},
    )
