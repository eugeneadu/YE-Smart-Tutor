import sqlite3

def migrate():
    conn = sqlite3.connect('learning_app.db')
    cursor = conn.cursor()
    
    try:
        print("Attempting to add is_public_profile column...")
        cursor.execute("ALTER TABLE students ADD COLUMN is_public_profile BOOLEAN DEFAULT 0")
        conn.commit()
        print("Migration successful!")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("Column already exists. Skipping.")
        else:
            print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
