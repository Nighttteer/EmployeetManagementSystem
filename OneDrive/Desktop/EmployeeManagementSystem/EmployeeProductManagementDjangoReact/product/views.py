from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Project, ProjectMember
from .serializers import ProjectSerializer, ProjectMemberSerializer
import logging
from django.db import models
from rest_framework.exceptions import PermissionDenied

logger = logging.getLogger(__name__)

# Create your views here.

class IsEmployerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow all users to perform read operations
        if request.method in permissions.SAFE_METHODS:
            return True
        # Only allow employers to perform write operations
        return request.user.role == 'employer'

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsEmployerOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'employer':
            # Employers can see all projects they created
            return Project.objects.filter(employer=user)
        elif user.role == 'employee':
            # Employees can see projects they participate in or manage
            return Project.objects.filter(
                models.Q(members=user) |
                models.Q(manager=user)
            ).distinct()
        return Project.objects.none()

    def perform_create(self, serializer):
        serializer.save(employer=self.request.user)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        project = self.get_object()
        employee_id = request.data.get('employee')
        role = request.data.get('role', 'developer')

        try:
            ProjectMember.objects.create(
                project=project,
                employee_id=employee_id,
                role=role
            )
            return Response({'status': 'member added'})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    def perform_update(self, serializer):
        logger.info(f"Updating project with data: {self.request.data}")
        serializer.save()
