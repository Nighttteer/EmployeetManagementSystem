"""
用药提醒模型单元测试
测试时间逻辑、提醒生成策略等核心功能
"""
import pytest
from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import datetime, date, time, timedelta
from unittest.mock import patch

from medication.models import Medication, MedicationPlan, MedicationReminder, MedicationStock
from accounts.models import User
from tests.factories import (
    UserFactory, PatientFactory, DoctorFactory,
    MedicationFactory, MedicationPlanFactory, ActiveMedicationPlanFactory,
    CompletedMedicationPlanFactory, MedicationReminderFactory, TakenReminderFactory,
    MissedReminderFactory, MedicationStockFactory, LowStockFactory, ExpiredStockFactory
)


class TestMedicationModel(TestCase):
    """药品模型测试"""
    
    def test_medication_creation_success(self):
        """测试药品成功创建"""
        # Arrange & Act
        medication = Medication.objects.create(
            name='阿司匹林',
            unit='mg',
            category='anticoagulant',
            instructions='餐后服用',
            generic_name='乙酰水杨酸',
            brand_name='拜阿司匹林',
            manufacturer='拜耳',
            specification='100mg/片'
        )
        
        # Assert
        self.assertEqual(medication.name, '阿司匹林')
        self.assertEqual(medication.unit, 'mg')
        self.assertEqual(medication.category, 'anticoagulant')
        self.assertEqual(medication.instructions, '餐后服用')
        self.assertTrue(medication.is_active)
        self.assertTrue(medication.is_prescription)
        self.assertIsNotNone(medication.created_at)
        self.assertIsNotNone(medication.updated_at)
    
    def test_medication_str_representation(self):
        """测试药品字符串表示"""
        # Arrange
        medication = MedicationFactory(name='阿司匹林', unit='mg')
        
        # Act & Assert
        expected_str = "阿司匹林 (mg)"
        self.assertEqual(str(medication), expected_str)
    
    def test_medication_categories(self):
        """测试药品分类"""
        categories = [
            'antihypertensive', 'hypoglycemic', 'lipid_lowering',
            'anticoagulant', 'diuretic', 'beta_blocker', 'ace_inhibitor', 'other'
        ]
        
        for category in categories:
            medication = MedicationFactory(category=category)
            self.assertEqual(medication.category, category)


class TestMedicationPlanModel(TestCase):
    """用药计划模型测试"""
    
    def setUp(self):
        """测试前准备"""
        self.patient = PatientFactory()
        self.doctor = DoctorFactory()
        self.medication = MedicationFactory()
        self.today = date.today()
    
    def test_medication_plan_creation_success(self):
        """测试用药计划成功创建"""
        # Arrange & Act
        plan = MedicationPlan.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            medication=self.medication,
            dosage=100.0,
            frequency='BID',
            time_of_day=['08:00', '20:00'],
            start_date=self.today,
            end_date=self.today + timedelta(days=30),
            duration_days=30,
            special_instructions='餐后服用',
            status='active'
        )
        
        # Assert
        self.assertEqual(plan.patient, self.patient)
        self.assertEqual(plan.doctor, self.doctor)
        self.assertEqual(plan.medication, self.medication)
        self.assertEqual(plan.dosage, 100.0)
        self.assertEqual(plan.frequency, 'BID')
        self.assertEqual(plan.time_of_day, ['08:00', '20:00'])
        self.assertEqual(plan.status, 'active')
        self.assertIsNotNone(plan.created_at)
    
    def test_medication_plan_is_active_property(self):
        """测试用药计划活跃状态判断"""
        # Test active plan within date range
        active_plan = MedicationPlanFactory(
            start_date=self.today - timedelta(days=5),
            end_date=self.today + timedelta(days=5),
            status='active'
        )
        self.assertTrue(active_plan.is_active)
        
        # Test plan not yet started
        future_plan = MedicationPlanFactory(
            start_date=self.today + timedelta(days=5),
            end_date=self.today + timedelta(days=15),
            status='active'
        )
        self.assertFalse(future_plan.is_active)
        
        # Test expired plan
        expired_plan = MedicationPlanFactory(
            start_date=self.today - timedelta(days=15),
            end_date=self.today - timedelta(days=5),
            status='active'
        )
        self.assertFalse(expired_plan.is_active)
        
        # Test stopped plan
        stopped_plan = MedicationPlanFactory(
            start_date=self.today - timedelta(days=5),
            end_date=self.today + timedelta(days=5),
            status='stopped'
        )
        self.assertFalse(stopped_plan.is_active)
        
        # Test plan with no end date (ongoing)
        ongoing_plan = MedicationPlanFactory(
            start_date=self.today - timedelta(days=5),
            end_date=None,
            status='active'
        )
        self.assertTrue(ongoing_plan.is_active)
    
    def test_get_daily_doses_method(self):
        """测试每日剂量数计算"""
        # Test different frequencies
        test_cases = [
            ('QD', 1),   # Once daily
            ('BID', 2),  # Twice daily
            ('TID', 3),  # Three times daily
            ('QID', 4),  # Four times daily
            ('Q12H', 2), # Every 12 hours
            ('Q8H', 3),  # Every 8 hours
            ('Q6H', 4),  # Every 6 hours
            ('PRN', 0),  # As needed
        ]
        
        for frequency, expected_doses in test_cases:
            plan = MedicationPlanFactory(frequency=frequency)
            self.assertEqual(plan.get_daily_doses(), expected_doses)
        
        # Test unknown frequency defaults to 1
        plan = MedicationPlanFactory(frequency='UNKNOWN')
        self.assertEqual(plan.get_daily_doses(), 1)
    
    def test_medication_plan_str_representation(self):
        """测试用药计划字符串表示"""
        # Arrange
        plan = MedicationPlanFactory(
            patient__name='张三',
            medication__name='阿司匹林',
            frequency='BID'
        )
        
        # Act & Assert
        expected_str = "张三 - 阿司匹林 - 每日两次"
        self.assertEqual(str(plan), expected_str)
    
    def test_medication_plan_time_validation(self):
        """测试用药计划时间验证"""
        # Test valid time format
        plan = MedicationPlanFactory(time_of_day=['08:00', '20:00'])
        self.assertEqual(plan.time_of_day, ['08:00', '20:00'])
        
        # Test single time
        plan = MedicationPlanFactory(time_of_day=['12:00'])
        self.assertEqual(plan.time_of_day, ['12:00'])
        
        # Test empty list (valid for PRN medications)
        plan = MedicationPlanFactory(time_of_day=[])
        self.assertEqual(plan.time_of_day, [])


class TestMedicationReminderModel(TestCase):
    """用药提醒模型测试"""
    
    def setUp(self):
        """测试前准备"""
        self.plan = ActiveMedicationPlanFactory()
        self.now = timezone.now()
    
    def test_medication_reminder_creation_success(self):
        """测试用药提醒成功创建"""
        # Arrange & Act
        reminder = MedicationReminder.objects.create(
            plan=self.plan,
            reminder_time=self.now,
            scheduled_time=time(8, 0),  # 08:00
            status='pending',
            dosage_taken=None,
            notes='早餐后服用'
        )
        
        # Assert
        self.assertEqual(reminder.plan, self.plan)
        self.assertEqual(reminder.reminder_time, self.now)
        self.assertEqual(reminder.scheduled_time, time(8, 0))
        self.assertEqual(reminder.status, 'pending')
        self.assertIsNone(reminder.dosage_taken)
        self.assertEqual(reminder.notes, '早餐后服用')
        self.assertIsNotNone(reminder.created_at)
    
    def test_medication_reminder_status_workflow(self):
        """测试用药提醒状态流转"""
        # Create pending reminder
        reminder = MedicationReminderFactory(status='pending')
        self.assertEqual(reminder.status, 'pending')
        
        # Mark as taken
        reminder.status = 'taken'
        reminder.confirm_time = timezone.now()
        reminder.dosage_taken = reminder.plan.dosage
        reminder.save()
        
        self.assertEqual(reminder.status, 'taken')
        self.assertIsNotNone(reminder.confirm_time)
        self.assertEqual(reminder.dosage_taken, reminder.plan.dosage)
        
        # Test missed status
        missed_reminder = MedicationReminderFactory(status='missed')
        self.assertEqual(missed_reminder.status, 'missed')
        
        # Test skipped status
        skipped_reminder = MedicationReminderFactory(status='skipped')
        self.assertEqual(skipped_reminder.status, 'skipped')
    
    def test_medication_reminder_is_overdue_property(self):
        """测试用药提醒超时判断"""
        # Test pending reminder within time window
        recent_reminder = MedicationReminderFactory(
            reminder_time=self.now - timedelta(minutes=15),
            status='pending'
        )
        self.assertFalse(recent_reminder.is_overdue)
        
        # Test pending reminder past 30 minutes
        overdue_reminder = MedicationReminderFactory(
            reminder_time=self.now - timedelta(minutes=45),
            status='pending'
        )
        self.assertTrue(overdue_reminder.is_overdue)
        
        # Test taken reminder (should not be overdue regardless of time)
        taken_reminder = MedicationReminderFactory(
            reminder_time=self.now - timedelta(hours=2),
            status='taken'
        )
        self.assertFalse(taken_reminder.is_overdue)
        
        # Test missed reminder (should not be overdue)
        missed_reminder = MedicationReminderFactory(
            reminder_time=self.now - timedelta(hours=1),
            status='missed'
        )
        self.assertFalse(missed_reminder.is_overdue)
    
    def test_medication_reminder_str_representation(self):
        """测试用药提醒字符串表示"""
        # Arrange
        reminder_time = datetime(2024, 1, 15, 8, 0, 0, tzinfo=timezone.get_current_timezone())
        reminder = MedicationReminderFactory(
            plan__patient__name='张三',
            plan__medication__name='阿司匹林',
            reminder_time=reminder_time
        )
        
        # Act & Assert
        expected_str = "张三 - 阿司匹林 - 2024-01-15 08:00"
        self.assertEqual(str(reminder), expected_str)
    
    @patch('django.utils.timezone.now')
    def test_medication_reminder_time_logic(self, mock_now):
        """测试用药提醒时间逻辑（使用Mock当前时间）"""
        # Mock current time
        mock_time = datetime(2024, 1, 15, 9, 0, 0, tzinfo=timezone.get_current_timezone())
        mock_now.return_value = mock_time
        
        # Test reminder scheduled for 8:30 AM (30 minutes ago)
        reminder_time = datetime(2024, 1, 15, 8, 30, 0, tzinfo=timezone.get_current_timezone())
        reminder = MedicationReminderFactory(
            reminder_time=reminder_time,
            status='pending'
        )
        
        # Should not be overdue yet (exactly 30 minutes)
        self.assertFalse(reminder.is_overdue)
        
        # Test reminder scheduled for 8:29 AM (31 minutes ago)
        overdue_reminder_time = datetime(2024, 1, 15, 8, 29, 0, tzinfo=timezone.get_current_timezone())
        overdue_reminder = MedicationReminderFactory(
            reminder_time=overdue_reminder_time,
            status='pending'
        )
        
        # Should be overdue (more than 30 minutes)
        self.assertTrue(overdue_reminder.is_overdue)


class TestMedicationReminderGeneration(TestCase):
    """用药提醒生成策略测试"""
    
    def setUp(self):
        """测试前准备"""
        self.patient = PatientFactory()
        self.doctor = DoctorFactory()
        self.medication = MedicationFactory()
        self.today = date.today()
    
    def test_daily_reminder_generation_strategy(self):
        """测试每日提醒生成策略"""
        # Create a BID (twice daily) plan
        plan = MedicationPlanFactory(
            patient=self.patient,
            doctor=self.doctor,
            medication=self.medication,
            frequency='BID',
            time_of_day=['08:00', '20:00'],
            start_date=self.today,
            end_date=self.today + timedelta(days=7),
            status='active'
        )
        
        # Manually create reminders for testing (in real app, this would be done by a task)
        reminder_times = []
        for day_offset in range(7):  # 7 days
            current_date = self.today + timedelta(days=day_offset)
            for time_str in plan.time_of_day:
                hour, minute = map(int, time_str.split(':'))
                reminder_datetime = timezone.make_aware(
                    datetime.combine(current_date, time(hour, minute))
                )
                reminder_times.append(reminder_datetime)
        
        # Create reminder objects
        reminders = []
        for i, reminder_time in enumerate(reminder_times):
            reminder = MedicationReminderFactory(
                plan=plan,
                reminder_time=reminder_time,
                scheduled_time=reminder_time.time(),
                status='pending'
            )
            reminders.append(reminder)
        
        # Assert
        self.assertEqual(len(reminders), 14)  # 7 days * 2 times per day
        
        # Verify timing distribution
        morning_reminders = [r for r in reminders if r.scheduled_time.hour == 8]
        evening_reminders = [r for r in reminders if r.scheduled_time.hour == 20]
        
        self.assertEqual(len(morning_reminders), 7)
        self.assertEqual(len(evening_reminders), 7)
    
    def test_tid_reminder_generation_strategy(self):
        """测试TID（三次每日）提醒生成策略"""
        # Create a TID plan
        plan = MedicationPlanFactory(
            frequency='TID',
            time_of_day=['08:00', '14:00', '20:00'],
            start_date=self.today,
            end_date=self.today + timedelta(days=3),
            status='active'
        )
        
        # Generate expected daily doses
        daily_doses = plan.get_daily_doses()
        self.assertEqual(daily_doses, 3)
        
        # Verify time slots
        expected_times = ['08:00', '14:00', '20:00']
        self.assertEqual(plan.time_of_day, expected_times)
    
    def test_prn_reminder_strategy(self):
        """测试PRN（按需）用药策略"""
        # Create a PRN plan
        plan = MedicationPlanFactory(
            frequency='PRN',
            time_of_day=[],  # No fixed times for PRN
            start_date=self.today,
            status='active'
        )
        
        # PRN should have 0 daily doses (no scheduled reminders)
        daily_doses = plan.get_daily_doses()
        self.assertEqual(daily_doses, 0)
        
        # PRN reminders are created manually by patients when needed
        prn_reminder = MedicationReminderFactory(
            plan=plan,
            reminder_time=timezone.now(),
            status='taken',  # Immediately marked as taken
            notes='按需服用，头痛时'
        )
        
        self.assertEqual(prn_reminder.plan, plan)
        self.assertEqual(prn_reminder.status, 'taken')
        self.assertIn('按需', prn_reminder.notes)


class TestMedicationStockModel(TestCase):
    """药品库存模型测试"""
    
    def setUp(self):
        """测试前准备"""
        self.patient = PatientFactory()
        self.medication = MedicationFactory()
        self.today = date.today()
    
    def test_medication_stock_creation_success(self):
        """测试药品库存成功创建"""
        # Arrange & Act
        stock = MedicationStock.objects.create(
            patient=self.patient,
            medication=self.medication,
            current_quantity=50,
            unit='片',
            expiry_date=self.today + timedelta(days=365),
            batch_number='BATCH001',
            low_stock_threshold=10,
            purchase_date=self.today,
            purchase_price=25.50
        )
        
        # Assert
        self.assertEqual(stock.patient, self.patient)
        self.assertEqual(stock.medication, self.medication)
        self.assertEqual(stock.current_quantity, 50)
        self.assertEqual(stock.unit, '片')
        self.assertEqual(stock.low_stock_threshold, 10)
        self.assertEqual(float(stock.purchase_price), 25.50)
        self.assertIsNotNone(stock.created_at)
    
    def test_medication_stock_is_low_stock_property(self):
        """测试低库存判断"""
        # Test stock above threshold
        normal_stock = MedicationStockFactory(
            current_quantity=20,
            low_stock_threshold=10
        )
        self.assertFalse(normal_stock.is_low_stock)
        
        # Test stock at threshold
        threshold_stock = MedicationStockFactory(
            current_quantity=10,
            low_stock_threshold=10
        )
        self.assertTrue(threshold_stock.is_low_stock)
        
        # Test stock below threshold
        low_stock = MedicationStockFactory(
            current_quantity=5,
            low_stock_threshold=10
        )
        self.assertTrue(low_stock.is_low_stock)
    
    def test_medication_stock_is_expired_property(self):
        """测试过期判断"""
        # Test non-expired stock
        valid_stock = MedicationStockFactory(
            expiry_date=self.today + timedelta(days=30)
        )
        self.assertFalse(valid_stock.is_expired)
        
        # Test expired stock
        expired_stock = MedicationStockFactory(
            expiry_date=self.today - timedelta(days=1)
        )
        self.assertTrue(expired_stock.is_expired)
        
        # Test stock expiring today (according to model logic, today is NOT expired)
        today_expiry_stock = MedicationStockFactory(
            expiry_date=self.today
        )
        self.assertFalse(today_expiry_stock.is_expired)  # 今天过期不算过期
        
        # Test stock with no expiry date
        no_expiry_stock = MedicationStockFactory(expiry_date=None)
        self.assertFalse(no_expiry_stock.is_expired)
    
    def test_medication_stock_str_representation(self):
        """测试药品库存字符串表示"""
        # Arrange
        stock = MedicationStockFactory(
            patient__name='张三',
            medication__name='阿司匹林',
            current_quantity=30,
            unit='片'
        )
        
        # Act & Assert
        expected_str = "张三 - 阿司匹林 - 库存:30片"
        self.assertEqual(str(stock), expected_str)
    
    def test_medication_stock_unique_constraint(self):
        """测试患者-药品唯一约束"""
        # Create first stock record
        stock1 = MedicationStockFactory(
            patient=self.patient,
            medication=self.medication
        )
        
        # Try to create duplicate stock record
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            MedicationStock.objects.create(
                patient=self.patient,
                medication=self.medication,
                current_quantity=10,
                unit='片'
            )


# 使用pytest的测试用例
@pytest.mark.django_db
class TestMedicationWithPytest:
    """使用pytest的用药相关测试"""
    
    def test_medication_factory_creation(self):
        """测试使用Factory创建药品"""
        # Act
        medication = MedicationFactory()
        
        # Assert
        assert medication.id is not None
        assert medication.name is not None
        assert medication.unit is not None
        assert medication.is_active is True
    
    def test_medication_plan_factory_creation(self):
        """测试用药计划Factory"""
        # Act
        plan = MedicationPlanFactory()
        
        # Assert
        assert plan.id is not None
        assert plan.patient is not None
        assert plan.doctor is not None
        assert plan.medication is not None
        assert plan.dosage > 0
        assert plan.frequency is not None
    
    def test_active_medication_plan_factory(self):
        """测试活跃用药计划Factory"""
        # Act
        plan = ActiveMedicationPlanFactory()
        
        # Assert
        assert plan.status == 'active'
        assert plan.is_active is True
    
    def test_completed_medication_plan_factory(self):
        """测试已完成用药计划Factory"""
        # Act
        plan = CompletedMedicationPlanFactory()
        
        # Assert
        assert plan.status == 'completed'
        assert plan.is_active is False
    
    def test_medication_reminder_factory_creation(self):
        """测试用药提醒Factory"""
        # Act
        reminder = MedicationReminderFactory()
        
        # Assert
        assert reminder.id is not None
        assert reminder.plan is not None
        assert reminder.reminder_time is not None
        assert reminder.scheduled_time is not None
    
    def test_taken_reminder_factory(self):
        """测试已服用提醒Factory"""
        # Act
        reminder = TakenReminderFactory()
        
        # Assert
        assert reminder.status == 'taken'
        assert reminder.confirm_time is not None
        assert reminder.dosage_taken is not None
    
    def test_missed_reminder_factory(self):
        """测试错过提醒Factory"""
        # Act
        reminder = MissedReminderFactory()
        
        # Assert
        assert reminder.status == 'missed'
    
    @pytest.mark.parametrize("frequency,expected_doses", [
        ('QD', 1),
        ('BID', 2),
        ('TID', 3),
        ('QID', 4),
        ('Q12H', 2),
        ('Q8H', 3),
        ('Q6H', 4),
        ('PRN', 0),
    ])
    def test_daily_doses_calculation_parametrized(self, frequency, expected_doses):
        """参数化测试每日剂量计算"""
        # Act
        plan = MedicationPlanFactory(frequency=frequency)
        
        # Assert
        assert plan.get_daily_doses() == expected_doses
    
    @pytest.mark.parametrize("status,should_be_active", [
        ('active', True),
        ('completed', False),
        ('stopped', False),
        ('paused', False),
    ])
    def test_medication_plan_status_parametrized(self, status, should_be_active):
        """参数化测试用药计划状态"""
        # Arrange
        today = date.today()
        
        # Act
        plan = MedicationPlanFactory(
            status=status,
            start_date=today - timedelta(days=1),
            end_date=today + timedelta(days=1)
        )
        
        # Assert
        if status == 'active':
            assert plan.is_active == should_be_active
        else:
            assert plan.is_active is False
    
    @pytest.mark.parametrize("minutes_ago,should_be_overdue", [
        (15, False),  # 15 minutes ago - not overdue
        (29, False),  # 29 minutes ago - not overdue yet
        (31, True),   # 31 minutes ago - overdue
        (60, True),   # 1 hour ago - overdue
    ])
    def test_reminder_overdue_logic_parametrized(self, minutes_ago, should_be_overdue):
        """参数化测试提醒超时逻辑"""
        # Arrange
        reminder_time = timezone.now() - timedelta(minutes=minutes_ago)
        
        # Act
        reminder = MedicationReminderFactory(
            reminder_time=reminder_time,
            status='pending'
        )
        
        # Assert
        assert reminder.is_overdue == should_be_overdue
    
    def test_medication_stock_factory_creation(self):
        """测试药品库存Factory"""
        # Act
        stock = MedicationStockFactory()
        
        # Assert
        assert stock.id is not None
        assert stock.patient is not None
        assert stock.medication is not None
        assert stock.current_quantity > 0
    
    def test_low_stock_factory(self):
        """测试低库存Factory"""
        # Act
        stock = LowStockFactory()
        
        # Assert
        assert stock.is_low_stock is True
        assert stock.current_quantity <= stock.low_stock_threshold
    
    def test_expired_stock_factory(self):
        """测试过期库存Factory"""
        # Act
        stock = ExpiredStockFactory()
        
        # Assert
        assert stock.is_expired is True
        assert stock.expiry_date <= date.today()
    
    def test_medication_adherence_calculation(self):
        """测试用药依从性计算"""
        # Arrange
        plan = ActiveMedicationPlanFactory()
        
        # Create mix of taken and missed reminders
        taken_reminders = TakenReminderFactory.create_batch(8, plan=plan)
        missed_reminders = MissedReminderFactory.create_batch(2, plan=plan)
        
        # Act
        total_reminders = len(taken_reminders) + len(missed_reminders)
        taken_count = len(taken_reminders)
        adherence_rate = (taken_count / total_reminders) * 100
        
        # Assert
        assert total_reminders == 10
        assert taken_count == 8
        assert adherence_rate == 80.0
    
    def test_medication_plan_time_series(self):
        """测试用药计划时间序列"""
        # Arrange
        patient = PatientFactory()
        base_date = date.today()
        
        # Act - 创建一周的用药计划
        plans = []
        for i in range(7):
            plan = MedicationPlanFactory(
                patient=patient,
                start_date=base_date + timedelta(days=i),
                end_date=base_date + timedelta(days=i+7)
            )
            plans.append(plan)
        
        # Assert
        assert len(plans) == 7
        
        # 验证时间序列排序
        patient_plans = patient.medication_plans.all()
        # 应该按创建时间倒序排列
        assert list(patient_plans) == sorted(plans, key=lambda p: p.created_at, reverse=True)
