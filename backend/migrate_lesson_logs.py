from database import engine, Base
from models import LessonLog

print("Creating lesson_logs table...")
Base.metadata.create_all(bind=engine)
print("Done!")
