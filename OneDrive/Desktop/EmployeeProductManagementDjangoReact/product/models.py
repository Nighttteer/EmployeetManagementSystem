from django.db import models
from django.conf import settings

# Create your models here.

class Project(models.Model):
    ProjectID = models.AutoField(primary_key=True)
    ProjectName = models.CharField(max_length=100)
    StartDate = models.DateField()
    EndDate = models.DateField()
    Status = models.CharField(max_length=20, choices=[
        ('active', 'Active'),
        ('pending', 'Pending'),
        ('completed', 'Completed')
    ])
    # 项目经理（1:M）
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='managed_projects'
    )
    # 项目所属雇主（1:M）
    employer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employer_projects',
        limit_choices_to={'role': 'employer'}
    )
    # 项目成员（M:N）
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='ProjectMember',
        related_name='member_projects',
        limit_choices_to={'role': 'employee'}
    )

    def __str__(self):
        return self.ProjectName

    class Meta:
        ordering = ['-StartDate']

class ProjectMember(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'role': 'employee'})
    join_date = models.DateField(auto_now_add=True)
    role = models.CharField(max_length=30)

    class Meta:
        unique_together = ['project', 'employee']
