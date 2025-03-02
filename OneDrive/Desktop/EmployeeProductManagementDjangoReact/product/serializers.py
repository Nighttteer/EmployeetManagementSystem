from rest_framework import serializers
from .models import Project, ProjectMember
from accounts.models import User

class ProjectMemberSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.username', read_only=True)
    
    class Meta:
        model = ProjectMember
        fields = ['employee', 'employee_name', 'role', 'join_date']
        read_only_fields = ['join_date']

class ProjectSerializer(serializers.ModelSerializer):
    employer_name = serializers.CharField(source='employer.user.username', read_only=True)
    manager_name = serializers.CharField(source='manager.user.username', read_only=True)
    members = ProjectMemberSerializer(source='projectmember_set', many=True, read_only=True)
    member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Project
        fields = ['ProjectID', 'ProjectName', 'StartDate', 'EndDate', 'Status',
                 'manager', 'manager_name', 'employer', 'employer_name',
                 'members', 'member_ids']
        read_only_fields = ['ProjectID']

    def create(self, validated_data):
        member_ids = validated_data.pop('member_ids', [])
        project = super().create(validated_data)
        
        # 创建项目成员关系
        for member_id in member_ids:
            ProjectMember.objects.create(
                project=project,
                employee_id=member_id,
                role='开发者'  # 可以根据需要设置不同的角色
            )
        
        return project

    def update(self, instance, validated_data):
        member_ids = validated_data.pop('member_ids', None)
        project = super().update(instance, validated_data)
        
        # 如果提供了新的成员列表，更新项目成员
        if member_ids is not None:
            # 删除现有的所有成员
            instance.projectmember_set.all().delete()
            
            # 添加新的成员
            for member_id in member_ids:
                ProjectMember.objects.create(
                    project=instance,
                    employee_id=member_id,
                    role='开发者'
                )
        
        return project

    def validate(self, data):
        if data['StartDate'] > data['EndDate']:
            raise serializers.ValidationError("结束日期必须晚于开始日期")
        return data