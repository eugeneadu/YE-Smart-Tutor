from database import engine, Base
from models import SavedQuiz

print("Creating saved_quizzes table...")
Base.metadata.create_all(bind=engine)
print("Done!")
