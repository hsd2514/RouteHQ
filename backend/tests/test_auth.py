import re


def test_signup_creates_user_and_returns_token(client):
    resp = client.post(
        "/auth/signup",
        json={"name": "New User", "email": "newuser@test.com", "password": "password123", "role": "fleet_manager"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["user"]["email"] == "newuser@test.com"
    assert body["access_token"]


def test_signup_rejects_invalid_role(client):
    resp = client.post(
        "/auth/signup",
        json={"name": "New User", "email": "bad@test.com", "password": "password123", "role": "superadmin"},
    )
    assert resp.status_code == 400


def test_signup_rejects_duplicate_email(client):
    payload = {"name": "A", "email": "dup@test.com", "password": "password123", "role": "driver"}
    client.post("/auth/signup", json=payload)
    resp = client.post("/auth/signup", json=payload)
    assert resp.status_code == 400


def test_login_rejects_wrong_password(client):
    client.post(
        "/auth/signup",
        json={"name": "A", "email": "wrongpw@test.com", "password": "password123", "role": "driver"},
    )
    resp = client.post("/auth/login", json={"email": "wrongpw@test.com", "password": "nope"})
    assert resp.status_code == 401


def test_forgot_password_does_not_reveal_whether_email_exists(client):
    client.post("/auth/signup", json={"name": "A", "email": "exists@test.com", "password": "password123", "role": "driver"})

    resp_exists = client.post("/auth/forgot-password", json={"email": "exists@test.com"})
    resp_missing = client.post("/auth/forgot-password", json={"email": "doesnotexist@test.com"})

    assert resp_exists.status_code == 200
    assert resp_missing.status_code == 200
    assert resp_exists.json() == resp_missing.json()


def test_reset_password_flow_end_to_end(client, capsys):
    client.post("/auth/signup", json={"name": "A", "email": "reset@test.com", "password": "password123", "role": "driver"})

    client.post("/auth/forgot-password", json={"email": "reset@test.com"})
    captured = capsys.readouterr()
    match = re.search(r"token=(\S+)", captured.out)
    assert match, "Expected the simulated email log to contain a reset token"
    token = match.group(1)

    resp = client.post("/auth/reset-password", json={"token": token, "new_password": "newpassword456"})
    assert resp.status_code == 200

    old_login = client.post("/auth/login", json={"email": "reset@test.com", "password": "password123"})
    assert old_login.status_code == 401

    new_login = client.post("/auth/login", json={"email": "reset@test.com", "password": "newpassword456"})
    assert new_login.status_code == 200


def test_reset_token_is_single_use(client, capsys):
    client.post("/auth/signup", json={"name": "A", "email": "replay@test.com", "password": "password123", "role": "driver"})

    client.post("/auth/forgot-password", json={"email": "replay@test.com"})
    token = re.search(r"token=(\S+)", capsys.readouterr().out).group(1)

    first = client.post("/auth/reset-password", json={"token": token, "new_password": "firstpass1"})
    assert first.status_code == 200

    replay = client.post("/auth/reset-password", json={"token": token, "new_password": "secondpass2"})
    assert replay.status_code == 400


def test_reset_password_rejects_login_token_used_as_reset_token(client):
    client.post("/auth/signup", json={"name": "A", "email": "typeconfusion@test.com", "password": "password123", "role": "driver"})
    login = client.post("/auth/login", json={"email": "typeconfusion@test.com", "password": "password123"})
    access_token = login.json()["access_token"]

    resp = client.post("/auth/reset-password", json={"token": access_token, "new_password": "hijacked"})
    assert resp.status_code == 400
