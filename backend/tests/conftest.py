from datetime import date, timedelta

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app import models
from app.auth import hash_password

# Separate database from the dev DB so tests never touch seeded data.
# Assumes the same Postgres container used for local dev (see backend/.env.example);
# override with TEST_DATABASE_URL if your setup differs.
import os

MAINTENANCE_DB_URL = os.getenv(
    "TEST_MAINTENANCE_DB_URL", "postgresql+psycopg2://postgres:postgres@127.0.0.1:5433/postgres"
)
TEST_DB_NAME = "transitops_test"
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", f"postgresql+psycopg2://postgres:postgres@127.0.0.1:5433/{TEST_DB_NAME}"
)


def _ensure_test_database_exists():
    maintenance_engine = create_engine(MAINTENANCE_DB_URL, isolation_level="AUTOCOMMIT")
    with maintenance_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": TEST_DB_NAME}
        ).first()
        if not exists:
            conn.execute(text(f"CREATE DATABASE {TEST_DB_NAME}"))
    maintenance_engine.dispose()


@pytest.fixture(scope="session")
def test_engine():
    _ensure_test_database_exists()
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def db(test_engine):
    """A DB session bound to the test database, with all tables truncated
    before each test so tests never see leftover state from one another."""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = TestingSessionLocal()
    for table in reversed(Base.metadata.sorted_tables):
        session.execute(table.delete())
    session.commit()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(db, client):
    """Creates a fleet_manager user directly in the test DB and returns
    Authorization headers for it, bypassing signup so tests don't depend
    on signup behaving correctly."""

    def _make(role="fleet_manager", email="manager@test.com"):
        user = models.User(
            name="Test Manager",
            email=email,
            password_hash=hash_password("password123"),
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        resp = client.post("/auth/login", json={"email": email, "password": "password123"})
        token = resp.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return _make


@pytest.fixture()
def make_vehicle(db):
    def _make(reg_number="GJ01AB0001", max_load_capacity=500.0, status="available", odometer=0.0):
        vehicle = models.Vehicle(
            reg_number=reg_number,
            name="Test Vehicle",
            type="van",
            max_load_capacity=max_load_capacity,
            odometer=odometer,
            status=status,
        )
        db.add(vehicle)
        db.commit()
        db.refresh(vehicle)
        return vehicle

    return _make


@pytest.fixture()
def make_driver(db):
    def _make(license_number="DL-0001", status="available", license_expiry=None):
        driver = models.Driver(
            name="Test Driver",
            license_number=license_number,
            license_category="LMV",
            license_expiry=license_expiry or (date.today() + timedelta(days=365)),
            contact_number="9000000000",
            status=status,
        )
        db.add(driver)
        db.commit()
        db.refresh(driver)
        return driver

    return _make
