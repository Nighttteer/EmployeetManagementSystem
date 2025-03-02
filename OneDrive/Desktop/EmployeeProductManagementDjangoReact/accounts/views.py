from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from .serializers import UserSerializer
from .models import User
import logging

logger = logging.getLogger(__name__)

class AuthViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['login', 'create']:
            return [AllowAny()]
        return super().get_permissions()

    def list(self, request, *args, **kwargs):
        role = request.data.get('role')
        queryset = User.objects
        if role:
            queryset = queryset.filter(role=role)
        users = queryset.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        logger.info(f"Login attempt for user: {username}")
        
        user = authenticate(username=username, password=password)
        logger.info(f"Authentication result for {username}: {'success' if user else 'failed'}")
        
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            serializer = UserSerializer(user)
            data = serializer.data
            data.update({
                'token': token.key,
                'is_superuser': user.is_superuser,
                'role': user.role,
                'username': user.username
            })
            logger.info(f"Login successful for user: {username}")
            return Response(data)
            
        logger.warning(f"Invalid credentials for user: {username}")
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['put'])
    def change_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get('new_password')
        
        if new_password:
            user.set_password(new_password)
            user.save()
            return Response({'status': 'password changed'})
        return Response({'error': 'new password required'}, status=400)

    @action(detail=False, methods=['get'])
    def profile(self, request):
        user = request.user
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        logger.info(f"Creating user with data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        logger.info(f"Updating user with data: {request.data}")
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def upload_avatar(self, request, pk=None):
        user = request.user
        avatar = request.FILES.get('avatar')
        
        if not avatar:
            return Response({'error': '请选择要上传的头像'}, status=400)
            
        user.avatar = avatar
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)