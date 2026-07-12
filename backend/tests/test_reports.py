def test_vehicle_cost_report_computes_revenue_and_roi(client, auth_headers, make_vehicle, make_driver, db):
    headers = auth_headers()
    vehicle = make_vehicle(odometer=1000)
    vehicle.acquisition_cost = 100000
    db.commit()
    driver = make_driver()

    trip = client.post(
        "/trips",
        json={"source": "A", "destination": "B", "vehicle_id": vehicle.id, "driver_id": driver.id, "cargo_weight": 100, "planned_distance": 50},
        headers=headers,
    ).json()
    client.post(f"/trips/{trip['id']}/dispatch", headers=headers)
    client.post(
        f"/trips/{trip['id']}/complete",
        json={"actual_distance": 50, "fuel_consumed": 10, "final_odometer": 1050, "revenue": 5000},
        headers=headers,
    )
    client.post(
        "/maintenance",
        json={"vehicle_id": vehicle.id, "issue_description": "Service", "cost": 1000},
        headers=headers,
    )
    client.post(
        "/fuel-logs",
        json={"vehicle_id": vehicle.id, "liters": 10, "cost": 800, "date": "2026-01-01"},
        headers=headers,
    )

    resp = client.get("/reports/vehicle-costs", headers=headers)
    row = next(r for r in resp.json() if r["vehicle_id"] == vehicle.id)

    assert row["total_revenue"] == 5000
    assert row["total_fuel_cost"] == 800
    assert row["total_maintenance_cost"] == 1000
    # ROI = (revenue - (maintenance + fuel)) / acquisition_cost = (5000 - 1800) / 100000
    assert row["roi"] == round((5000 - 1800) / 100000, 4)


def test_vehicle_cost_report_roi_null_when_no_acquisition_cost(client, auth_headers, make_vehicle, db):
    headers = auth_headers()
    vehicle = make_vehicle()
    vehicle.acquisition_cost = 0
    db.commit()

    resp = client.get("/reports/vehicle-costs", headers=headers)
    row = next(r for r in resp.json() if r["vehicle_id"] == vehicle.id)
    assert row["roi"] is None


def test_trip_complete_defaults_revenue_to_zero_when_omitted(client, auth_headers, make_vehicle, make_driver):
    headers = auth_headers()
    vehicle = make_vehicle()
    driver = make_driver()

    trip = client.post(
        "/trips",
        json={"source": "A", "destination": "B", "vehicle_id": vehicle.id, "driver_id": driver.id, "cargo_weight": 50, "planned_distance": 10},
        headers=headers,
    ).json()
    client.post(f"/trips/{trip['id']}/dispatch", headers=headers)

    resp = client.post(
        f"/trips/{trip['id']}/complete",
        json={"actual_distance": 10, "fuel_consumed": 2, "final_odometer": 10},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["revenue"] == 0
