def test_create_maintenance_sets_vehicle_in_shop(client, auth_headers, make_vehicle):
    headers = auth_headers()
    vehicle = make_vehicle()

    resp = client.post(
        "/maintenance",
        json={"vehicle_id": vehicle.id, "issue_description": "Oil change", "cost": 1500},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "active"

    assert client.get(f"/vehicles/{vehicle.id}", headers=headers).json()["status"] == "in_shop"


def test_create_maintenance_rejects_vehicle_on_trip(client, auth_headers, make_vehicle):
    headers = auth_headers()
    vehicle = make_vehicle(status="on_trip")

    resp = client.post(
        "/maintenance",
        json={"vehicle_id": vehicle.id, "issue_description": "Oil change", "cost": 0},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "on trip" in resp.json()["detail"].lower()


def test_close_maintenance_restores_available(client, auth_headers, make_vehicle):
    headers = auth_headers()
    vehicle = make_vehicle()

    log = client.post(
        "/maintenance",
        json={"vehicle_id": vehicle.id, "issue_description": "Brakes", "cost": 500},
        headers=headers,
    ).json()

    resp = client.post(f"/maintenance/{log['id']}/close", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "closed"
    assert client.get(f"/vehicles/{vehicle.id}", headers=headers).json()["status"] == "available"


def test_close_maintenance_does_not_reactivate_retired_vehicle(client, auth_headers, make_vehicle, db):
    headers = auth_headers()
    vehicle = make_vehicle()

    log = client.post(
        "/maintenance",
        json={"vehicle_id": vehicle.id, "issue_description": "Engine", "cost": 500},
        headers=headers,
    ).json()

    # Vehicle is retired while still in the shop (e.g. decommissioned mid-service)
    client.patch(f"/vehicles/{vehicle.id}", json={"status": "retired"}, headers=headers)

    resp = client.post(f"/maintenance/{log['id']}/close", headers=headers)
    assert resp.status_code == 200
    assert client.get(f"/vehicles/{vehicle.id}", headers=headers).json()["status"] == "retired"
