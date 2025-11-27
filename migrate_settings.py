import sqlite3

def migrate_settings():
    conn = sqlite3.connect('backend/learning_app.db')
    cursor = conn.cursor()
    
    try:
        print("Attempting to create settings table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key VARCHAR PRIMARY KEY,
                value VARCHAR
            )
        """)
        print("Settings table created.")
        
        # Insert default PIN if not exists
        cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('parent_pin', '1234')")
        print("Default PIN initialized.")
        
    except sqlite3.OperationalError as e:
        print(f"Error: {e}")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate_settings()
