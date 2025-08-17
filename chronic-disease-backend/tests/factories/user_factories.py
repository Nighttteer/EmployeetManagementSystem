"""
用户相关数据工厂
"""
import factory
from factory.django import DjangoModelFactory
from faker import Faker
from django.contrib.auth import get_user_model

fake = Faker('zh_CN')
User = get_user_model()

class UserFactory(DjangoModelFactory):
    """基础用户工厂"""
    class Meta:
        model = User
        skip_postgeneration_save = True
    
    username = factory.Sequence(lambda n: f"user{n:04d}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@test.com")
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')
    name = factory.Faker('name', locale='zh_CN')
    phone = factory.Sequence(lambda n: f"+861380013{n:04d}")
    age = factory.Faker('random_int', min=18, max=80)
    gender = factory.Faker('random_element', elements=['male', 'female'])
    
    is_active = True
    is_verified = True

class AdminFactory(UserFactory):
    """管理员工厂"""
    role = 'admin'
    is_staff = True
    is_superuser = True
    username = factory.Sequence(lambda n: f"admin{n:04d}")

class DoctorFactory(UserFactory):
    """医生工厂"""
    role = 'doctor'
    username = factory.Sequence(lambda n: f"doctor{n:04d}")
    
    # 医生特有字段
    license_number = factory.Sequence(lambda n: f"DOC-2024-{n:04d}")
    department = factory.Faker('random_element', elements=[
        '心内科', '内分泌科', '神经内科', '呼吸科', '消化科', '肾内科'
    ])
    title = factory.Faker('random_element', elements=[
        '住院医师', '主治医师', '副主任医师', '主任医师'
    ])
    specialization = factory.Faker('random_element', elements=[
        '高血压管理', '糖尿病治疗', '心血管疾病', '慢性病管理', '老年医学'
    ])

class PatientFactory(UserFactory):
    """患者工厂"""
    role = 'patient'
    username = factory.Sequence(lambda n: f"patient{n:04d}")
    
    # 患者特有字段
    height = factory.Faker('random_int', min=150, max=190)
    blood_type = factory.Faker('random_element', elements=['A', 'B', 'AB', 'O'])
    smoking_status = factory.Faker('random_element', elements=[
        '从不吸烟', '已戒烟', '偶尔吸烟', '经常吸烟'
    ])
    
    @factory.post_generation
    def chronic_diseases(self, create, extracted, **kwargs):
        """生成慢性疾病列表"""
        if not create:
            return
        
        if extracted is not None:
            self.chronic_diseases = extracted
        else:
            # 随机生成0-3种慢性疾病
            diseases = ['hypertension', 'diabetes', 'heart_disease', 'asthma', 'arthritis']
            import random
            num_diseases = random.randint(0, 3)
            self.chronic_diseases = random.sample(diseases, num_diseases) if num_diseases > 0 else []
        # 不需要手动save，Factory会处理

class HealthyPatientFactory(PatientFactory):
    """健康患者工厂（无慢性疾病）"""
    chronic_diseases = []

class ChronicPatientFactory(PatientFactory):
    """慢性病患者工厂"""
    chronic_diseases = ['hypertension', 'diabetes']
