def test_register_and_login_flow(client):
    # 1. Register new user
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": "learner@anvil.study",
            "password": "SecurePassword123!",
            "full_name": "Anvil Scholar",
        },
    )
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    assert user_data["email"] == "learner@anvil.study"
    assert user_data["full_name"] == "Anvil Scholar"
    assert "hashed_password" not in user_data

    # 2. Reject duplicate registration
    dup_res = client.post(
        "/api/auth/register",
        json={
            "email": "learner@anvil.study",
            "password": "AnotherPassword456!",
        },
    )
    assert dup_res.status_code == 400

    # 3. Login with correct credentials
    login_res = client.post(
        "/api/auth/login",
        json={
            "email": "learner@anvil.study",
            "password": "SecurePassword123!",
        },
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    token = token_data["access_token"]

    # 4. Login with wrong password fails
    wrong_login = client.post(
        "/api/auth/login",
        json={
            "email": "learner@anvil.study",
            "password": "WrongPassword!",
        },
    )
    assert wrong_login.status_code == 401

    # 5. Access /api/auth/me with valid token
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "learner@anvil.study"

    # 6. Access /api/auth/me without token fails
    unauth_res = client.get("/api/auth/me")
    assert unauth_res.status_code == 401
