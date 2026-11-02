import os

from locust import HttpUser, task, between


class TaskManagerUser(HttpUser):

    wait_time = between(1, 3)

    def on_start(self):
        email = os.getenv("LOCUST_EMAIL")
        password = os.getenv("LOCUST_PASSWORD")

        if not email or not password:
            raise RuntimeError("Set LOCUST_EMAIL and LOCUST_PASSWORD")

        response = self.client.post(
            "/api/auth/token", data={"username": email, "password": password}
        )

        if response.status_code != 200:
            raise RuntimeError("Login failed")

        token = response.json()["access_token"]

        self.headers = {"Authorization": f"Bearer {token}"}

    @task
    def get_tasks(self):
        self.client.get("/api/tasks/", headers=self.headers)
