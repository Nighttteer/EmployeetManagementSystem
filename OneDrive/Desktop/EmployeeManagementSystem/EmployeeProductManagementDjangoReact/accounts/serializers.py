from rest_framework import serializers
from .models import User
from product.models import Project, ProjectMember

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    projects = serializers.SerializerMethodField()
    managed_projects = serializers.SerializerMethodField()
    avatar = serializers.CharField(required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'role', 'phone', 'address', 'department',
                 'name', 'position', 'hire_date', 'is_superuser', 'projects', 'managed_projects','avatar')
        read_only_fields = ('hire_date', 'is_superuser')

    def validate(self, data):
        if not self.instance:
            if not data.get('username'):
                raise serializers.ValidationError({'username': 'Username is required for new users'})
            if not data.get('password'):
                raise serializers.ValidationError({'password': 'Password is required for new users'})
        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def get_projects(self, obj):
        if obj.role != 'employee':
            return []
        return [{
            'id': member.project.ProjectID,
            'name': member.project.ProjectName,
            'role': member.role,
            'status': member.project.Status
        } for member in ProjectMember.objects.filter(employee=obj)]

    def get_managed_projects(self, obj):
        if obj.role != 'employee':
            return []
        return [{
            'id': project.ProjectID,
            'name': project.ProjectName,
            'status': project.Status
        } for project in Project.objects.filter(manager=obj)]