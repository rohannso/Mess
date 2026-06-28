from django.contrib.auth import authenticate, get_user_model
from django.apps import apps
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import JsonResponse

from .serializers import LoginSerializer, RegisterSerializer

User = get_user_model()


def build_user_payload(user):
    payload = {
        'id': user.id,
        'name': user.get_full_name(),
        'email': user.email,
        'role': user.role,
    }

    if user.role == 'student':
        Student = apps.get_model('students', 'Student')
        student = Student.objects.filter(user=user).first()
        if student is not None:
            payload['student_id'] = student.id

    return payload


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            Student = apps.get_model('students', 'Student')
            Student.objects.get_or_create(
                user=user,
                defaults={
                    'room_number': serializer.validated_data.get('room_number', ''),
                    'monthly_fee': 0,
                },
            )

            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': build_user_payload(user),
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(email=serializer.validated_data['email'], password=serializer.validated_data['password'])
            if user is not None:
                refresh = RefreshToken.for_user(user)
                return Response(
                    {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                        'user': build_user_payload(user),
                    }
                )
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


def create_admin(request):
    User = get_user_model()
    if not User.objects.filter(email='admin@example.com').exists():
        User.objects.create_superuser(
            email='rohanso14@gmail.com',
            password='Rohannso@14',
            phone='0000000000',
        )
        return JsonResponse({'status': 'Superuser created'})
    return JsonResponse({'status': 'Already exists'})
