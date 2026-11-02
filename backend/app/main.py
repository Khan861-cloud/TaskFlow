import time

from app.core.logger import logger


from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware


from app.routers import tasks, auth, admin

app = FastAPI(title="Task Manager API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):

    start_time = time.perf_counter()

    logger.info("Incoming request: %s %s", request.method, request.url.path)

    try:
        response = await call_next(request)
        return response

    finally:
        process_time = time.perf_counter() - start_time

        logger.info(
            "Request finished: %s %s | Duration: %.4f seconds",
            request.method,
            request.url.path,
            process_time,
        )


app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(admin.router)


@app.get("/")
def home():
    return {"message": "Welcome to Task Manager API"}
