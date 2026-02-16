# Run this py script to review all existing search logs stored in Azure SQL DB
import pyodbc

try:
    connection = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=temp-project.database.windows.net;"
        "DATABASE=weatherdb;"
        "UID=mthreeproject;"
        "PWD=m3m3MTHREE;",
        timeout=30
    )

    cursor = connection.cursor()

   
    # Print top 5 most searched cities
    
    cursor.execute("""
        SELECT TOP 5 city, COUNT(*) AS search_count
        FROM logHist
        GROUP BY city
        ORDER BY search_count DESC
    """)
    top_cities = cursor.fetchall()
    print("\n=== Top 5 Most Searched Cities ===\n")
    for row in top_cities:
        print(f"{row[0]} | {row[1]} searches")  
    
    # Print all logs
   
    cursor.execute("SELECT * FROM logHist ORDER BY timestamp DESC")
    print("\n Logs - Users' browsing history \n")

    columns = [column[0] for column in cursor.description]
    rows = cursor.fetchall()
    for row in rows:
        line = " | ".join(f"{col} | {val}" for col, val in zip(columns, row))
        print(line)

    cursor.close()
    connection.close()
    print("\nConnection closed.")

except pyodbc.Error as ex:
    print("\nException:", ex)
    print("Closing program...")
    try:
        cursor.close()
    except:
        pass
    try:
        connection.close()
    except:
        pass
    exit()
