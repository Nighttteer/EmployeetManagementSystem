"""
定时任务：生成智能异常提醒
可以通过Django管理命令或定时任务调用
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from health.alert_analysis_service import AlertAnalysisService
from accounts.models import User


class Command(BaseCommand):
    help = '生成医生端智能异常提醒'

    def add_arguments(self, parser):
        parser.add_argument(
            '--doctor-id',
            type=int,
            help='指定医生ID，不指定则为所有医生生成提醒',
        )
        parser.add_argument(
            '--patient-id',
            type=int,
            help='指定病人ID，需要同时指定医生ID',
        )

    def handle(self, *args, **options):
        doctor_id = options.get('doctor_id')
        patient_id = options.get('patient_id')

        self.stdout.write(
            self.style.SUCCESS(f'开始生成智能异常提醒... {timezone.now()}')
        )

        try:
            # 创建分析服务实例
            analysis_service = AlertAnalysisService()
            
            if doctor_id:
                # 为特定医生的所有患者生成提醒
                alerts = analysis_service.analyze_and_generate_alerts(doctor_id)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'为医生ID {doctor_id} 的所有病人生成了 {len(alerts)} 条提醒'
                    )
                )
                
            else:
                # 为所有医生生成提醒
                doctors = User.objects.filter(role='doctor', is_active=True)
                total_alerts = 0
                
                for doctor in doctors:
                    alerts = analysis_service.analyze_and_generate_alerts(doctor.id)
                    total_alerts += len(alerts)
                    self.stdout.write(
                        f'为医生 {doctor.name} 生成了 {len(alerts)} 条提醒'
                    )
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'总共为 {doctors.count()} 位医生生成了 {total_alerts} 条智能提醒'
                    )
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'生成智能提醒时出错: {e}')
            )

        self.stdout.write(
            self.style.SUCCESS(f'智能异常提醒生成完成! {timezone.now()}')
        )