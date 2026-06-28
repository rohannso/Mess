from django.urls import path

from .views import AttendanceByStudentView, AttendanceListCreateView, AttendanceMeView, MealRateView

urlpatterns = [
    path('', AttendanceListCreateView.as_view(), name='attendance-list-create'),
    path('rates/', MealRateView.as_view(), name='meal-rates'),
    path('student/<int:student_id>/', AttendanceByStudentView.as_view(), name='attendance-by-student'),
    path('me/', AttendanceMeView.as_view(), name='attendance-me'),
]
