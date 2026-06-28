from django.urls import path
from .views import LoginView, RegisterView, create_admin

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('create-admin/', create_admin, name='create-admin'),
]
