from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app import models
from app.auth import hash_password


def run_seed(db: Session) -> None:
    if db.query(models.User).count() > 0:
        return

    today = date.today()

    users = [
        models.User(name="Fleet Manager", email="fleet@transitops.com", password_hash=hash_password("password123"), role="fleet_manager"),
        models.User(name="Driver User", email="driver@transitops.com", password_hash=hash_password("password123"), role="driver"),
        models.User(name="Safety Officer", email="safety@transitops.com", password_hash=hash_password("password123"), role="safety_officer"),
        models.User(name="Financial Analyst", email="finance@transitops.com", password_hash=hash_password("password123"), role="financial_analyst"),
    ]
    db.add_all(users)

    vehicles = [
        models.Vehicle(reg_number="GJ01AB4521", name="Van-05", type="van", max_load_capacity=500, odometer=74000, acquisition_cost=620000, status="available", region="Gandhinagar"),
        models.Vehicle(reg_number="GJ01AB9981", name="Truck-11", type="truck", max_load_capacity=5000, odometer=182000, acquisition_cost=2450000, status="available", region="Ahmedabad"),
        models.Vehicle(reg_number="GJ01AB1120", name="Mini-03", type="mini", max_load_capacity=1000, odometer=66000, acquisition_cost=410000, status="in_shop", region="Vatva"),
        models.Vehicle(reg_number="GJ01AB0087", name="Van-09", type="van", max_load_capacity=750, odometer=241900, acquisition_cost=590000, status="retired", region="Sanand"),
        models.Vehicle(reg_number="GJ01AB2244", name="Truck-04", type="truck", max_load_capacity=4000, odometer=95000, acquisition_cost=2100000, status="available", region="Mansa"),
        models.Vehicle(reg_number="GJ01AB3390", name="Van-12", type="van", max_load_capacity=600, odometer=41000, acquisition_cost=580000, status="available", region="Kalol"),
    ]
    db.add_all(vehicles)
    db.flush()

    drivers = [
        models.Driver(name="Alex", license_number="DL-88213", license_category="LMV", license_expiry=today + timedelta(days=365), contact_number="9876500001", safety_score=96, status="available"),
        models.Driver(name="John", license_number="DL-44120", license_category="HMV", license_expiry=today - timedelta(days=30), contact_number="9822000002", safety_score=81, status="suspended"),
        models.Driver(name="Priya", license_number="DL-77031", license_category="LMV", license_expiry=today + timedelta(days=200), contact_number="9911000003", safety_score=99, status="available"),
        models.Driver(name="Suresh", license_number="DL-90045", license_category="HMV", license_expiry=today + timedelta(days=15), contact_number="9744000004", safety_score=88, status="available"),
        models.Driver(name="Meera", license_number="DL-55678", license_category="LMV", license_expiry=today + timedelta(days=400), contact_number="9900000005", safety_score=92, status="off_duty"),
    ]
    db.add_all(drivers)
    db.flush()

    van05 = vehicles[0]
    truck11 = vehicles[1]
    mini03 = vehicles[2]
    truck04 = vehicles[4]

    alex = drivers[0]
    priya = drivers[2]
    suresh = drivers[3]

    trips = [
        models.Trip(source="Gandhinagar Depot", destination="Ahmedabad Hub", vehicle_id=truck11.id, driver_id=priya.id, cargo_weight=3000, planned_distance=38, actual_distance=40, fuel_consumed=8, fuel_efficiency=5.0, revenue=32000, status="completed", dispatched_at=datetime.utcnow() - timedelta(days=2), completed_at=datetime.utcnow() - timedelta(days=1)),
        models.Trip(source="Vatva Industrial Area", destination="Sanand Warehouse", vehicle_id=truck04.id, driver_id=suresh.id, cargo_weight=2000, planned_distance=25, status="draft"),
        models.Trip(source="Mansa", destination="Kalol Depot", vehicle_id=van05.id, driver_id=alex.id, cargo_weight=300, planned_distance=32, status="cancelled"),
    ]
    db.add_all(trips)

    maintenance_logs = [
        models.MaintenanceLog(vehicle_id=mini03.id, issue_description="Tyre Replace", cost=6200, status="active"),
        models.MaintenanceLog(vehicle_id=truck11.id, issue_description="Engine Repair", cost=18000, status="closed", closed_at=datetime.utcnow() - timedelta(days=5)),
    ]
    db.add_all(maintenance_logs)

    fuel_logs = [
        models.FuelLog(vehicle_id=van05.id, liters=42, cost=3150, date=today - timedelta(days=7)),
        models.FuelLog(vehicle_id=truck11.id, liters=110, cost=8400, date=today - timedelta(days=6)),
        models.FuelLog(vehicle_id=mini03.id, liters=28, cost=2050, date=today - timedelta(days=6)),
    ]
    db.add_all(fuel_logs)

    expenses = [
        models.Expense(vehicle_id=van05.id, type="toll", amount=120, date=today - timedelta(days=7)),
        models.Expense(vehicle_id=truck11.id, type="toll", amount=340, date=today - timedelta(days=6)),
        models.Expense(vehicle_id=truck11.id, type="other", amount=150, date=today - timedelta(days=6)),
    ]
    db.add_all(expenses)

    db.commit()
