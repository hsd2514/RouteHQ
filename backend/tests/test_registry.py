def test_duplicate_reg_number_rejected(client, auth_headers, make_vehicle):
    headers = auth_headers()
    make_vehicle(reg_number="GJ01AB9999")

    resp = client.post(
        "/vehicles",
        json={"reg_number": "GJ01AB9999", "name": "Dup", "type": "van", "max_load_capacity": 100},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "already exists" in resp.json()["detail"].lower()


def test_duplicate_license_number_rejected(client, auth_headers, make_driver):
    headers = auth_headers()
    make_driver(license_number="DL-DUPLICATE")

    resp = client.post(
        "/drivers",
        json={
            "name": "Dup Driver",
            "license_number": "DL-DUPLICATE",
            "license_category": "LMV",
            "license_expiry": "2030-01-01",
            "contact_number": "9000000001",
        },
        headers=headers,
    )
    assert resp.status_code == 400
    assert "already exists" in resp.json()["detail"].lower()


def test_retired_vehicle_excluded_from_available_filter(client, auth_headers, make_vehicle):
    headers = auth_headers()
    make_vehicle(reg_number="GJ01AB0001", status="retired")
    make_vehicle(reg_number="GJ01AB0002", status="available")

    resp = client.get("/vehicles?status=available", headers=headers)
    reg_numbers = [v["reg_number"] for v in resp.json()]
    assert "GJ01AB0001" not in reg_numbers
    assert "GJ01AB0002" in reg_numbers


def test_suspended_driver_excluded_from_assignable_filter(client, auth_headers, make_driver):
    headers = auth_headers()
    make_driver(license_number="DL-SUSPENDED", status="suspended")
    make_driver(license_number="DL-OK", status="available")

    resp = client.get("/drivers?assignable=true", headers=headers)
    license_numbers = [d["license_number"] for d in resp.json()]
    assert "DL-SUSPENDED" not in license_numbers
    assert "DL-OK" in license_numbers
