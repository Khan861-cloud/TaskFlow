from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import sessionmaker

from app.database import Base
from test_database import test_engine

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


TEST_DATABASE_URL = (
    "postgresql+psycopg://localhost:12345678" "@localhost:5432/taskmanager_test"
)

test_engine = create_engine(TEST_DATABASE_URL)

TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, join_transaction_mode="create_savepoint"
)


def override_get_db():
    connection = test_engine.connect()
    transaction = connection.begin()

    db = TestingSessionLocal(bind=connection)

    try:
        yield db
    finally:
        db.close()
        transaction.rollback()
        connection.close()
