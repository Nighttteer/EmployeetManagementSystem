from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'employer')
        return self.create_user(username, password, **extra_fields)

class User(AbstractUser):
    ROLE_CHOICES = (
        ('employee', '员工'),
        ('employer', '雇主'),
    )
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=30, blank=True)
    address = models.CharField(max_length=30, blank=True)
    department = models.CharField(max_length=30, blank=True)
    name = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=50, blank=True)
    hire_date = models.DateField(auto_now_add=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    objects = CustomUserManager()

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    class Meta:
        ordering = ['id']
