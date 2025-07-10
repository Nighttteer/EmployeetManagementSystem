#!/usr/bin/env python3
"""
创建测试用户数据
"""
import os
import sys
import django
from datetime import datetime, timedelta
import random

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User
from health.models import DoctorPatientRelation

def create_test_users():
    """创建测试用户数据"""
    print("🔧 创建测试用户数据...")
    
    # 创建多个测试医生
    doctors_data = [
        {
            "username": "doctor001",
            "email": "doctor1@test.com",
            "password": "testpass123",
            "name": "李医生",
            "role": "doctor",
            "phone": "+8613800138001",
            "age": 35,
            "gender": "female",
            "license_number": "DOC20241201001",
            "department": "内科",
            "title": "主治医师",
            "specialization": "心血管疾病、糖尿病"
        },
        {
            "username": "doctor002", 
            "email": "doctor2@test.com",
            "password": "testpass123",
            "name": "王医生",
            "role": "doctor",
            "phone": "+8613800138021",
            "age": 42,
            "gender": "male",
            "license_number": "DOC20241201002",
            "department": "心血管科",
            "title": "副主任医师",
            "specialization": "冠心病、高血压"
        },
        {
            "username": "doctor003",
            "email": "doctor3@test.com", 
            "password": "testpass123",
            "name": "张医生",
            "role": "doctor",
            "phone": "+8613800138022",
            "age": 38,
            "gender": "female",
            "license_number": "DOC20241201003",
            "department": "内分泌科",
            "title": "主治医师",
            "specialization": "糖尿病、甲状腺疾病"
        }
    ]
    
    created_doctors = []
    for doctor_data in doctors_data:
        # 如果用户已存在，先删除
        if User.objects.filter(phone=doctor_data['phone']).exists():
            User.objects.filter(phone=doctor_data['phone']).delete()
            print(f"   已删除现有医生用户: {doctor_data['phone']}")
        
        doctor = User.objects.create_user(
            username=doctor_data['username'],
            email=doctor_data['email'],
            password=doctor_data['password'],
            name=doctor_data['name'],
            role=doctor_data['role'],
            phone=doctor_data['phone'],
            age=doctor_data['age'],
            gender=doctor_data['gender'],
            license_number=doctor_data['license_number'],
            department=doctor_data['department'],
            title=doctor_data['title'],
            specialization=doctor_data['specialization']
        )
        created_doctors.append(doctor)
        print(f"   ✅ 创建医生用户: {doctor.name} ({doctor.phone})")
    
    # 创建更多测试患者（包括已分配和未分配的）
    patients_data = [
        # 已分配医生的患者（前8个）
        {
            "username": "patient001",
            "email": "patient1@test.com",
            "password": "testpass123",
            "name": "张三",
            "role": "patient",
            "phone": "+8613800138000",
            "age": 45,
            "gender": "male",
            "height": 175.0,
            "blood_type": "A+",
            "bio": "高血压患者，需要定期监测血压",
            "assigned_doctor": 0,  # 分配给第一个医生
        },
        {
            "username": "patient002",
            "email": "patient2@test.com",
            "password": "testpass123",
            "name": "李四",
            "role": "patient",
            "phone": "+8613800138002",
            "age": 52,
            "gender": "female",
            "height": 162.0,
            "blood_type": "B+",
            "bio": "糖尿病患者，需要控制血糖和饮食",
            "assigned_doctor": 0,  # 分配给第一个医生
        },
        {
            "username": "patient003",
            "email": "patient3@test.com",
            "password": "testpass123",
            "name": "王五",
            "role": "patient",
            "phone": "+8613800138003",
            "age": 38,
            "gender": "male",
            "height": 178.0,
            "blood_type": "O+",
            "bio": "心脏病患者，需要定期检查心电图",
            "assigned_doctor": 1,  # 分配给第二个医生
        },
        {
            "username": "patient004",
            "email": "patient4@test.com",
            "password": "testpass123",
            "name": "赵六",
            "role": "patient",
            "phone": "+8613800138004",
            "age": 61,
            "gender": "female",
            "height": 158.0,
            "blood_type": "AB+",
            "bio": "高血压和糖尿病并发症，需要密切监测",
            "assigned_doctor": 1,  # 分配给第二个医生
        },
        {
            "username": "patient005",
            "email": "patient5@test.com",
            "password": "testpass123",
            "name": "刘七",
            "role": "patient",
            "phone": "+8613800138005",
            "age": 33,
            "gender": "male",
            "height": 172.0,
            "blood_type": "A-",
            "bio": "肥胖症患者，需要控制体重",
            "assigned_doctor": 2,  # 分配给第三个医生
        },
        {
            "username": "patient006",
            "email": "patient6@test.com",
            "password": "testpass123",
            "name": "陈八",
            "role": "patient",
            "phone": "+8613800138006",
            "age": 47,
            "gender": "female",
            "height": 165.0,
            "blood_type": "B-",
            "bio": "高血脂患者，需要控制胆固醇",
            "assigned_doctor": 2,  # 分配给第三个医生
        },
        {
            "username": "patient007",
            "email": "patient7@test.com",
            "password": "testpass123",
            "name": "孙九",
            "role": "patient",
            "phone": "+8613800138007",
            "age": 56,
            "gender": "male",
            "height": 168.0,
            "blood_type": "O-",
            "bio": "慢性肾病患者，需要限制蛋白质摄入",
            "assigned_doctor": 0,  # 分配给第一个医生
        },
        {
            "username": "patient008",
            "email": "patient8@test.com",
            "password": "testpass123",
            "name": "周十",
            "role": "patient",
            "phone": "+8613800138008",
            "age": 29,
            "gender": "female",
            "height": 160.0,
            "blood_type": "AB-",
            "bio": "甲状腺功能减退患者，需要定期检查",
            "assigned_doctor": 1,  # 分配给第二个医生
        },
        
        # 未分配医生的患者（新增的）
        {
            "username": "patient009",
            "email": "patient9@test.com",
            "password": "testpass123",
            "name": "吴小明",
            "role": "patient",
            "phone": "+8613800138009",
            "age": 28,
            "gender": "male",
            "height": 170.0,
            "blood_type": "A+",
            "bio": "焦虑症患者，偶有失眠",
            "assigned_doctor": None,  # 未分配
        },
        {
            "username": "patient010",
            "email": "patient10@test.com",
            "password": "testpass123",
            "name": "郑小华",
            "role": "patient",
            "phone": "+8613800138010",
            "age": 65,
            "gender": "female",
            "height": 155.0,
            "blood_type": "O+",
            "bio": "骨质疏松患者，需要补钙",
            "assigned_doctor": None,  # 未分配
        },
        {
            "username": "patient011",
            "email": "patient11@test.com",
            "password": "testpass123",
            "name": "马强",
            "role": "patient",
            "phone": "+8613800138011",
            "age": 40,
            "gender": "male",
            "height": 180.0,
            "blood_type": "B+",
            "bio": "高血压初期，需要生活方式调整",
            "assigned_doctor": None,  # 未分配
        },
        {
            "username": "patient012",
            "email": "patient12@test.com",
            "password": "testpass123",
            "name": "林美丽",
            "role": "patient",
            "phone": "+8613800138012",
            "age": 35,
            "gender": "female",
            "height": 163.0,
            "blood_type": "AB-",
            "bio": "妊娠期糖尿病康复中",
            "assigned_doctor": None,  # 未分配
        },
        {
            "username": "patient013",
            "email": "patient13@test.com",
            "password": "testpass123",
            "name": "何志远",
            "role": "patient",
            "phone": "+8613800138013",
            "age": 50,
            "gender": "male",
            "height": 174.0,
            "blood_type": "A-",
            "bio": "慢性胃炎患者，需要饮食控制",
            "assigned_doctor": None,  # 未分配
        },
        {
            "username": "patient014",
            "email": "patient14@test.com",
            "password": "testpass123",
            "name": "黄丽娜",
            "role": "patient",
            "phone": "+8613800138014",
            "age": 43,
            "gender": "female",
            "height": 159.0,
            "blood_type": "B-",
            "bio": "更年期综合征，情绪波动较大",
            "assigned_doctor": None,  # 未分配
        },
        {
            "username": "patient015",
            "email": "patient15@test.com",
            "password": "testpass123",
            "name": "刘建国",
            "role": "patient",
            "phone": "+8613800138015",
            "age": 58,
            "gender": "male",
            "height": 167.0,
            "blood_type": "O-",
            "bio": "慢性支气管炎，需要戒烟",
            "assigned_doctor": None,  # 未分配
        },
        {
            "username": "patient016",
            "email": "patient16@test.com",
            "password": "testpass123",
            "name": "田小红",
            "role": "patient",
            "phone": "+8613800138016",
            "age": 32,
            "gender": "female",
            "height": 161.0,
            "blood_type": "A+",
            "bio": "偏头痛患者，压力大时发作",
            "assigned_doctor": None,  # 未分配
        },
    ]
    
    created_patients = []
    # 创建患者
    for patient_data in patients_data:
        # 如果用户已存在，先删除
        if User.objects.filter(phone=patient_data['phone']).exists():
            User.objects.filter(phone=patient_data['phone']).delete()
            print(f"   已删除现有患者用户: {patient_data['phone']}")
        
        assigned_doctor = patient_data.pop('assigned_doctor', None)
        
        patient = User.objects.create_user(
            username=patient_data['username'],
            email=patient_data['email'],
            password=patient_data['password'],
            name=patient_data['name'],
            role=patient_data['role'],
            phone=patient_data['phone'],
            age=patient_data['age'],
            gender=patient_data['gender'],
            height=patient_data['height'],
            blood_type=patient_data['blood_type'],
            bio=patient_data['bio'],
        )
        
        # 设置最后登录时间
        patient.last_login = datetime.now() - timedelta(days=random.randint(1, 30))
        patient.save()
        
        created_patients.append((patient, assigned_doctor))
        status = "（未分配医生）" if assigned_doctor is None else f"（分配给{created_doctors[assigned_doctor].name}）"
        print(f"   ✅ 创建患者用户: {patient.name} ({patient.phone}) {status}")
    
    # 创建医患关系
    print("\n🔗 创建医患关系...")
    for patient, doctor_index in created_patients:
        if doctor_index is not None:
            doctor = created_doctors[doctor_index]
            
            # 删除可能存在的旧关系
            DoctorPatientRelation.objects.filter(
                doctor=doctor,
                patient=patient
            ).delete()
            
            # 创建新的医患关系
            relation = DoctorPatientRelation.objects.create(
                doctor=doctor,
                patient=patient,
                is_primary=True,
                status='active',
                notes=f'测试数据 - {patient.name}由{doctor.name}管理'
            )
            print(f"   ✅ 绑定关系: {doctor.name} → {patient.name}")
    
    print("\n📊 测试用户数据创建完成!")
    print("=" * 60)
    print("🔐 登录信息:")
    print("   医生账号:")
    for doctor in created_doctors:
        print(f"     {doctor.name}: {doctor.phone} / testpass123")
    
    assigned_count = sum(1 for _, assigned in created_patients if assigned is not None)
    unassigned_count = sum(1 for _, assigned in created_patients if assigned is None)
    
    print(f"\n   患者账号: 共 {len(created_patients)} 个")
    print(f"     已分配医生: {assigned_count} 个")
    print(f"     未分配医生: {unassigned_count} 个（可用于测试添加患者功能）")
    print("\n   测试建议:")
    print("     1. 使用李医生账号登录测试现有患者管理")
    print("     2. 使用王医生或张医生账号测试添加未分配患者")
    print("     3. 患者登录密码统一为: testpass123")
    print("=" * 60)

if __name__ == '__main__':
    create_test_users() 