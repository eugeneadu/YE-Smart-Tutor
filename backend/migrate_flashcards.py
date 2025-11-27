import sqlite3

def migrate():
    conn = sqlite3.connect('learning_app.db')
    cursor = conn.cursor()
    
    try:
        print("Attempting to create flashcards table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS flashcards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER,
                topic TEXT,
                front TEXT,
                back TEXT,
                ease_factor FLOAT DEFAULT 2.5,
                interval INTEGER DEFAULT 0,
                next_review TIMESTAMP,
                review_count INTEGER DEFAULT 0,
                FOREIGN KEY(student_id) REFERENCES students(id)
            )
        """)
        conn.commit()
        print("Migration successful! Flashcards table created.")
    except sqlite3.OperationalError as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
