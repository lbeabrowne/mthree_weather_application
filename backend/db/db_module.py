# This is a module built for importing into the main script 
# Make sure you have "ODBC Driver 17 for SQL Server" installed (not v18). 
# Download link: 
# https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

import pyodbc

# It sends fetched JSON/dict data to Azure SQL DB (one-way, no return).
def user_log(result):

    connection = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=temp-project.database.windows.net;"
        "DATABASE=weatherdb;"
        "UID=mthreeproject;"
        "PWD=m3m3MTHREE;",
        timeout=30
    )
    cursor = connection.cursor()

    # create table if not exists (runs only once)
    cursor.execute("""
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
    """)

    connection.commit()

    # insert api data 
    cursor.execute(
        "INSERT INTO logHist (city, temp_c) VALUES (?, ?)",
        (result.get("city"), result.get("temperature"))
    )

    connection.commit()
    connection.close()

    # fully disconnect from DB server

