from django.urls import path

from .views import CurrentStudentView, StudentDetailView, StudentListCreateView

urlpatterns = [
    path('', StudentListCreateView.as_view(), name='student-list-create'),
    path('me/', CurrentStudentView.as_view(), name='student-current'),
    path('<int:pk>/', StudentDetailView.as_view(), name='student-detail'),
]
