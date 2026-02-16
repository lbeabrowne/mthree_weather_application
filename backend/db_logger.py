import os
import pyodbc
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv()

SQL_SERVER = os.getenv("SQL_SERVER")       # e.g. "temp-project.database.windows.net"
SQL_DATABASE = os.getenv("SQL_DATABASE")   # e.g. "weatherdb"
SQL_USER = os.getenv("SQL_USER")           # e.g. "mthreeproject"
SQL_PASSWORD = os.getenv("SQL_PASSWORD")   # e.g. "m3m3MTHREE"


def user_log(city: str, temp_c: float | None) -> None:
    """
    Log a search into Azure SQL.

    Stores:
    - city name
    - temperature in °C (can be NULL)
    - timestamp (handled by DB default GETDATE())
    """

    # Build connection string
    conn_str = (
        "DRIVER={ODBC Driver 17 for SQL Server};"
        f"SERVER={SQL_SERVER};"
        f"DATABASE={SQL_DATABASE};"
        f"UID={SQL_USER};"
        f"PWD={SQL_PASSWORD};"
    )

    # Connect to DB
    connection = pyodbc.connect(conn_str, timeout=30)
    cursor = connection.cursor()

    # Create table if it does not exist yet
    cursor.execute(
        """
        IF NOT EXISTS (
            SELECT * FROM sysobjects 
            WHERE name='logHist' AND xtype='U'
        )
        BEGIN
            CREATE TABLE logHist (
                id INT IDENTITY PRIMARY KEY,
                city NVARCHAR(100),
                temp_c FLOAT,
                timestamp DATETIME DEFAULT GETDATE()
            )
        END
        """
    )
    connection.commit()

    # Insert a row for this search
    cursor.execute(
        "INSERT INTO logHist (city, temp_c) VALUES (?, ?)",
        (city, temp_c),
    )

    connection.commit()
    connection.close()