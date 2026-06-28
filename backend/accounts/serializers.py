from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    room_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    monthly_fee = serializers.DecimalField(
        write_only=True,
        required=False,
        max_digits=8,
        decimal_places=2,
        min_value=0,
    )

    class Meta:
        model = User
        fields = ('id', 'name', 'phone', 'email', 'password', 'room_number', 'monthly_fee')

    def create(self, validated_data):
        password = validated_data.pop('password')
        full_name = validated_data.pop('name', '')
        validated_data.pop('room_number', None)
        validated_data.pop('monthly_fee', None)
        first_name = full_name
        last_name = ''
        if ' ' in full_name:
            first_name, last_name = full_name.split(' ', 1)

        user = User(**validated_data, first_name=first_name, last_name=last_name, role='student')
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
