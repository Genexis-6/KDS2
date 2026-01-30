from app.routes.subjects.subject_endpoint import subject_endpoint
from app.routes.students.student_endpoint import student_endpoint
from app.routes.question_endpoint.timer_endpoint import timer_endpoint
from app.routes.question_endpoint.question_endpoint import question_endpoint
from app.routes.question_endpoint.score_endpoint import score_endpoint
from .auth.auth import auth

from .class_available.class_endpoint import room

def register_all_routes(app):
    app.include_router(auth)
    app.include_router(subject_endpoint)
    app.include_router(timer_endpoint)
    app.include_router(student_endpoint)
    app.include_router(question_endpoint)
    app.include_router(score_endpoint)
    app.include_router(room)