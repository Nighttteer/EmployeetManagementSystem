from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from product.models import Project, ProjectMember
from notification.models import Notification, NotificationRecipient
from datetime import date, timedelta

User = get_user_model()

class Command(BaseCommand):
    help = '创建测试数据'

    def handle(self, *args, **kwargs):
        self.stdout.write('开始创建测试数据...')
        
        # 清理现有数据
        User.objects.all().delete()
        Project.objects.all().delete()
        Notification.objects.all().delete()

        # 创建雇主用户
        employer = User.objects.create_user(
            username='boss1',
            password='123456',
            email='boss1@example.com',
            phone='13900139000',
            address='北京市朝阳区',
            department='管理部',
            role='employer'
        )

        # 创建员工用户
        employee_data = [
            ('emp1', '李小明', 'employee'),
            ('emp2', '王小红', 'employee'),
            ('emp3', '张小华', 'employee')
        ]

        employees = []
        for username, name, role in employee_data:
            user = User.objects.create_user(
                username=username,
                password='123456',
                email=f'{username}@example.com',
                role='employee',
                phone=f'138{len(employees):08d}',
                address='深圳市南山区',
                department='技术部'
            )
            employees.append(user)

        # 创建项目
        project_data = [
            ('项目A', 'active'),
            ('项目B', 'pending'),
            ('项目C', 'completed')
        ]

        for i, (name, status) in enumerate(project_data):
            project = Project.objects.create(
                ProjectName=name,
                StartDate=date.today(),
                EndDate=date.today() + timedelta(days=90),
                Status=status,
                manager=employees[1],  # 王经理作为项目经理
                employer=employer
            )
            
            # 添加项目成员
            for emp in employees:
                if emp != employees[1]:  # 除了项目经理
                    ProjectMember.objects.create(
                        project=project,
                        employee=emp,
                        role='开发者' if emp.role == 'developer' else '测试者'
                    )

        # 创建通知
        notification_data = [
            ('紧急会议通知', 'urgent'),
            ('项目进度报告', 'important'),
            ('系统维护通知', 'info')
        ]

        for message, type_ in notification_data:
            notification = Notification.objects.create(
                Message=message,
                NotificationType=type_,
                Sender=employer
            )
            
            # 添加所有用户为接收者
            for user in User.objects.all():
                if user != employer:
                    NotificationRecipient.objects.create(
                        notification=notification,
                        recipient=user
                    )

        self.stdout.write(self.style.SUCCESS('测试数据创建成功！')) 