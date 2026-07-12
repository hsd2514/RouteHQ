from datetime import date, timedelta


def test_dispatch_succeeds_within_capacity(client, auth_headers, make_vehicle, make_driver):
    headers = auth_headers()
    vehicle = make_vehicle(max_load_capacity=500)
    driver = make_driver()

    trip = client.post(
        "/trips",
        json={
            "source": "A",
            "destination": "B",
            "vehicle_id": vehicle.id,
            "driver_id": driver.id,
            "cargo_weight": 450,
            "planned_distance": 40,
        },
        headers=headers,
    ).json()

    resp = client.post(f"/trips/{trip['id']}/dispatch", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "dispatched"
    assert body["dispatched_at"] is not None


def test_dispatch_rejects_over_capacity(client, auth_headers, make_vehicle, make_driver):
    headers = auth_headers()
    vehicle = make_vehicle(max_load_capacity=500)
    driver = make_driver()

    trip = client.post(
        "/trips",
        json={
            "source": "A",
            "destination": "B",
            "vehicle_id": vehicle.id,
            "driver_id": driver.id,
            "cargo_weight": 600,
            "planned_distance": 10,
        },
        headers=headers,
    ).json()

    resp = client.post(f"/trips/{trip['id']}/dispatch", headers=headers)
    assert resp.status_code == 400
    assert "capacity" in resp.json()["detail"].lower()


def test_dispatch_rejects_vehicle_not_available(client, auth_headers, make_vehicle, make_driver):
    headers = auth_headers()
    vehicle = make_vehicle(status="in_shop")
    driver = make_driver()

    trip = client.post(
        "/trips",
        json={
            "source": "A", "destination": "B",
            "vehicle_id": vehicle.id, "driver_id": driver.id,
            "cargo_weight": 100, "planned_distance": 10,
        },
        headers=headers,
    ).json()

    resp = client.post(f"/trips/{trip['id']}/dispatch", headers=headers)
    assert resp.status_code == 400
    assert "not available" in resp.json()["detail"].lower()


def test_dispatch_rejects_driver_not_available(client, auth_headers, make_vehicle, make_driver):
    headers = auth_headers()
    vehicle = make_vehicle()
    driver = make_driver(status="suspended")

    trip = client.post(
        "/trips",
        json={
            "source": "A", "destination": "B",
            "vehicle_id": vehicle.id, "driver_id": driver.id,
            "cargo_weight": 100, "planned_distance": 10,
        },
        headers=headers,
    ).json()

    resp = client.post(f"/trips/{trip['id']}/dispatch", headers=headers)
    assert resp.status_code == 400
    assert "driver" in resp.json()["detail"].lower()


def test_dispatch_rejects_expired_license(client, auth_headers, make_vehicle, make_driver):
    headers = auth_headers()
    vehicle = make_vehicle()
    driver = make_driver(license_expiry=date.today() - timedelta(days=1))

    trip = client.post(
        "/trips",
        json={
            "source": "A", "destination": "B",
            "vehicle_id": vehicle.id, "driver_id": driver.id,
            "cargo_weight": 100, "planned_distance": 10,
        },
        headers=headers,
    ).json()

    resp = client.post(f"/trips/{trip['id']}/dispatch", headers=headers)
    assert resp.status_code == 400
    assert "license" in resp.json()["detail"].lower()


def test_dispatch_rejects_when_vehicle_already_on_trip(client, auth_headers, make_vehicle, make_driver):
    headers = auth_headers()
    vehicle = make_vehicle()
    driver1 = make_driver(license_number="DL-A")
    driver2 = make_driver(license_number="DL-B")

    trip1 = client.post(
        "/trips",
        json={"source": "A", "destination": "B", "vehicle_id": vehicle.id, "driver_id": driver1.id, "cargo_weight": 100, "planned_distance": 10},
        headers=headers,
    ).json()
    client.post(f"/trips/{trip1['id']}/dispatch", headers=headers)

    trip2 = client.post(
        "/trips",
        json={"source": "C", "destination": "D", "vehicle_id": vehicle.id, "driver_id": driver2.id, "cargo_weight": 50, "planned_distance": 5},
        headers=headers,
    ).json()
    resp = client.post(f"/trips/{trip2['id']}/dispatch", headers=headers)
    assert resp.status_code == 400


def test_complete_computes_fuel_efficiency_and_frees_resources(client, auth_headers, make_vehicle, make_driver):
    headers = auth_headers()
    vehicle = make_vehicle(odometer=1000)
    driver = make_driver()

    trip = client.post(
        "/trips",
        json={"source": "A", "destination": "B", "vehicle_id": vehicle.id, "driver_id": driver.id, "cargo_weight": 100, "planned_distance": 40},
        headers=headers,
    ).json()
    client.post(f"/trips/{trip['id']}/dispatch", headers=headers)

    resp = client.post(
        f"/trips/{trip['id']}/complete",
        json={"actual_distance": 42, "fuel_consumed": 6, "final_odometer": 1042},
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "completed"
    assert body["fuel_efficiency"] == 7.0

    vehicle_resp = client.get(f"/vehicles/{vehicle.id}", headers=headers).json()
    assert vehicle_resp["status"] == "available"
    assert vehicle_resp["odometer"] == 1042

    driver_resp = client.get(f"/drivers/{driver.id}", headers=headers).json()
    assert driver_resp["status"] == "available"


def test_complete_guards_divide_by_zero_fuel_efficiency(client, auth_headers, make_vehicle, make_driver):
    headers = auth_headers()
    vehicle = make_vehicle(odometer=0)
    driver = make_driver()

    trip = client.post(
        "/trips",
        json={"source": "A", "destination": "B", "vehicle_id": vehicle.id, "driver_id": driver.id, "cargo_weight": 100, "planned_distance": 10},
        headers=headers,
    ).json()
    client.post(f"/trips/{trip['id']}/dispatch", headers=headers)

    resp = client.post(
        f"/trips/{trip['id']}/complete",
        json={"actual_distance": 10, "fuel_consumed": 0, "final_odometer": 10},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["fuel_efficiency"] is None


def test_complete_rejects_odometer_less_than_current(client, auth_headers, make_vehicle, make_driver):
    headers = auth_headers()
    vehicle = make_vehicle(odometer=1000)
    driver = make_driver()

    trip = client.post(
        "/trips",
        json={"source": "A", "destination": "B", "vehicle_id": vehicle.id, "driver_id": driver.id, "cargo_weight": 100, "planned_distance": 10},
        headers=headers,
    ).json()
    client.post(f"/trips/{trip['id']}/dispatch", headers=headers)

    resp = client.post(
        f"/trips/{trip['id']}/complete",
        json={"actual_distance": 10, "fuel_consumed": 2, "final_odometer": 999},
        headers=headers,
    )
    assert resp.status_code == 400


def test_cancel_restores_vehicle_and_driver_when_dispatched(client, auth_headers, make_vehicle, make_driver):
    headers = auth_headers()
    vehicle = make_vehicle()
    driver = make_driver()

    trip = client.post(
        "/trips",
        json={"source": "A", "destination": "B", "vehicle_id": vehicle.id, "driver_id": driver.id, "cargo_weight": 100, "planned_distance": 10},
        headers=headers,
    ).json()
    client.post(f"/trips/{trip['id']}/dispatch", headers=headers)

    resp = client.post(f"/trips/{trip['id']}/cancel", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "cancelled"

    assert client.get(f"/vehicles/{vehicle.id}", headers=headers).json()["status"] == "available"
    assert client.get(f"/drivers/{driver.id}", headers=headers).json()["status"] == "available"


def test_cancel_rejects_from_completed_status(client, auth_headers, make_vehicle, make_driver):
    headers = auth_headers()
    vehicle = make_vehicle()
    driver = make_driver()

    trip = client.post(
        "/trips",
        json={"source": "A", "destination": "B", "vehicle_id": vehicle.id, "driver_id": driver.id, "cargo_weight": 100, "planned_distance": 10},
        headers=headers,
    ).json()
    client.post(f"/trips/{trip['id']}/dispatch", headers=headers)
    client.post(
        f"/trips/{trip['id']}/complete",
        json={"actual_distance": 10, "fuel_consumed": 2, "final_odometer": 10},
        headers=headers,
    )

    resp = client.post(f"/trips/{trip['id']}/cancel", headers=headers)
    assert resp.status_code == 400
