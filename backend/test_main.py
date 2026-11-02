def test_task_crud_workflow(client):
    # 1. CREATE
    create_response = client.post(
        "/api/tasks/",
        json={
            "title": "Learn FastAPI",
            "description": "Practice CRUD testing",
            "completed": False,
        },
    )

    assert create_response.status_code == 201

    task = create_response.json()
    task_id = task["id"]

    assert task["title"] == "Learn FastAPI"

    # 2. READ
    read_response = client.get(f"/api/tasks/{task_id}")

    assert read_response.status_code == 200
    assert read_response.json()["title"] == "Learn FastAPI"

    # 3. UPDATE
    update_response = client.patch(f"/api/tasks/{task_id}", json={"completed": True})

    assert update_response.status_code == 200
    assert update_response.json()["completed"] is True

    # 4. DELETE
    delete_response = client.delete(f"/api/tasks/{task_id}")

    assert delete_response.status_code in (200, 204)

    # 5. VERIFY DELETION
    final_response = client.get(f"/api/tasks/{task_id}")

    assert final_response.status_code == 404
