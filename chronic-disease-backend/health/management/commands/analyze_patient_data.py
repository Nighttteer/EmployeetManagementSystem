"""
患者数据分析命令
每3天自动分析患者数据并生成告警

使用方法:
python manage.py analyze_patient_data --doctor-id 1
python manage.py analyze_patient_data --all-doctors
"""
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from accounts.models import User
from health.alert_analysis_service import AlertAnalysisService


class Command(BaseCommand):
    help = '分析患者数据并生成智能告警'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--doctor-id',
            type=int,
            help='指定医生ID进行分析',
        )
        parser.add_argument(
            '--all-doctors',
            action='store_true',
            help='分析所有医生的患者数据',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=3,
            help='分析天数（默认3天）',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='输出详细信息',
        )
    
    def handle(self, *args, **options):
        """执行数据分析"""
        self.stdout.write(
            self.style.SUCCESS('🏥 启动患者数据智能分析系统...')
        )
        
        start_time = timezone.now()
        total_alerts = 0
        analyzed_doctors = 0
        
        try:
            # 创建分析服务实例
            alert_service = AlertAnalysisService()
            
            if options['doctor_id']:
                # 分析指定医生
                total_alerts = self._analyze_doctor(
                    alert_service, 
                    options['doctor_id'], 
                    options['verbose']
                )
                analyzed_doctors = 1
                
            elif options['all_doctors']:
                # 分析所有医生
                doctors = User.objects.filter(role='doctor', is_active=True)
                
                if not doctors.exists():
                    self.stdout.write(
                        self.style.WARNING('⚠️  系统中没有找到活跃的医生用户')
                    )
                    return
                
                self.stdout.write(f'📊 找到 {doctors.count()} 位医生，开始分析...')
                
                for doctor in doctors:
                    doctor_alerts = self._analyze_doctor(
                        alert_service, 
                        doctor.id, 
                        options['verbose']
                    )
                    total_alerts += doctor_alerts
                    analyzed_doctors += 1
                    
                    if options['verbose']:
                        self.stdout.write(f'   医生 {doctor.name}: 生成 {doctor_alerts} 个告警')
            
            else:
                raise CommandError('请指定 --doctor-id 或 --all-doctors 参数')
            
            # 输出总结
            end_time = timezone.now()
            duration = (end_time - start_time).total_seconds()
            
            self.stdout.write('\n' + '='*50)
            self.stdout.write(self.style.SUCCESS('✅ 数据分析完成！'))
            self.stdout.write(f'📈 分析医生数量: {analyzed_doctors}')
            self.stdout.write(f'🚨 生成告警总数: {total_alerts}')
            self.stdout.write(f'⏱️  分析耗时: {duration:.2f}秒')
            self.stdout.write(f'📅 分析时间: {start_time.strftime("%Y-%m-%d %H:%M:%S")}')
            self.stdout.write('='*50)
            
            # 数据源说明
            self.stdout.write('\n📋 数据来源说明:')
            self.stdout.write('   • 健康指标数据: HealthMetric表 (患者填写的血压、血糖等)')
            self.stdout.write('   • 用药记录数据: MedicationReminder表 (患者的用药打卡)')
            self.stdout.write('   • 医患关系数据: DoctorPatientRelation表 (确定患者归属)')
            self.stdout.write('   • 告警存储位置: Alert表 (生成的智能告警)')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ 分析过程出错: {str(e)}')
            )
            raise CommandError(f'数据分析失败: {str(e)}')
    
    def _analyze_doctor(self, alert_service, doctor_id, verbose=False):
        """分析单个医生的患者数据"""
        try:
            doctor = User.objects.get(id=doctor_id, role='doctor')
            
            if verbose:
                self.stdout.write(f'\n👨‍⚕️ 正在分析医生: {doctor.name} (ID: {doctor_id})')
            
            # 执行分析
            generated_alerts = alert_service.analyze_and_generate_alerts(doctor_id)
            
            if verbose:
                self.stdout.write(f'   📊 数据分析流程:')
                self.stdout.write(f'   1. 查询DoctorPatientRelation表获取患者列表')
                self.stdout.write(f'   2. 从HealthMetric表抓取最近3天数据')
                self.stdout.write(f'   3. 从MedicationReminder表分析用药依从性')
                self.stdout.write(f'   4. 检测数据趋势和异常模式')
                self.stdout.write(f'   5. 生成 {len(generated_alerts)} 个告警写入Alert表')
            
            return len(generated_alerts)
            
        except User.DoesNotExist:
            error_msg = f'未找到医生ID: {doctor_id}'
            self.stdout.write(self.style.ERROR(f'❌ {error_msg}'))
            if not verbose:
                raise CommandError(error_msg)
            return 0
        except Exception as e:
            error_msg = f'分析医生 {doctor_id} 数据失败: {str(e)}'
            self.stdout.write(self.style.ERROR(f'❌ {error_msg}'))
            if not verbose:
                raise CommandError(error_msg)
            return 0