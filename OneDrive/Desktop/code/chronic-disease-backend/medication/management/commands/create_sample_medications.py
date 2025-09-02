from django.core.management.base import BaseCommand
from medication.models import Medication


class Command(BaseCommand):
    help = '创建示例药品数据'

    def handle(self, *args, **options):
        medications_data = [
            # 降压药
            {
                'name': '氨氯地平片',
                'generic_name': 'Amlodipine',
                'unit': 'mg',
                'category': 'antihypertensive',
                'specification': '5mg/片',
                'instructions': '口服，每日一次，餐后服用',
                'contraindications': '对氨氯地平过敏者禁用',
                'side_effects': '可能引起头晕、水肿、面部潮红',
                'interactions': '与西柚汁同服可能增加副作用'
            },
            {
                'name': '厄贝沙坦片',
                'generic_name': 'Irbesartan',
                'unit': 'mg',
                'category': 'antihypertensive',
                'specification': '150mg/片',
                'instructions': '口服，每日一次，空腹或餐后服用均可',
                'contraindications': '妊娠期、哺乳期妇女禁用',
                'side_effects': '可能引起头晕、乏力、咳嗽',
                'interactions': '与利尿剂合用时需注意监测血压'
            },
            {
                'name': '硝苯地平缓释片',
                'generic_name': 'Nifedipine',
                'unit': 'mg',
                'category': 'antihypertensive',
                'specification': '30mg/片',
                'instructions': '口服，每日一次，不可咀嚼或掰开',
                'contraindications': '心源性休克、急性心梗患者禁用',
                'side_effects': '可能引起头痛、面部潮红、踝部水肿',
                'interactions': '与β受体阻滞剂同用需谨慎'
            },
            
            # 降糖药
            {
                'name': '二甲双胍片',
                'generic_name': 'Metformin',
                'unit': 'mg',
                'category': 'hypoglycemic',
                'specification': '500mg/片',
                'instructions': '餐中或餐后服用，减少胃肠道反应',
                'contraindications': '肾功能不全、肝功能异常者禁用',
                'side_effects': '可能引起恶心、腹泻、腹胀',
                'interactions': '与造影剂同用时需暂停使用'
            },
            {
                'name': '格列齐特缓释片',
                'generic_name': 'Gliclazide',
                'unit': 'mg',
                'category': 'hypoglycemic',
                'specification': '30mg/片',
                'instructions': '早餐时服用，不可咀嚼',
                'contraindications': '1型糖尿病、糖尿病酮症酸中毒禁用',
                'side_effects': '可能引起低血糖、体重增加',
                'interactions': '与酒精同用可能增加低血糖风险'
            },
            {
                'name': '阿卡波糖片',
                'generic_name': 'Acarbose',
                'unit': 'mg',
                'category': 'hypoglycemic',
                'specification': '50mg/片',
                'instructions': '与第一口主食同时咀嚼服用',
                'contraindications': '炎症性肠病、肠梗阻患者禁用',
                'side_effects': '可能引起腹胀、腹泻、排气增多',
                'interactions': '与消化酶制剂同用效果减弱'
            },
            
            # 降脂药
            {
                'name': '阿托伐他汀钙片',
                'generic_name': 'Atorvastatin',
                'unit': 'mg',
                'category': 'lipid_lowering',
                'specification': '20mg/片',
                'instructions': '每日一次，晚餐后服用',
                'contraindications': '活动性肝病、妊娠期妇女禁用',
                'side_effects': '可能引起肌肉疼痛、肝酶升高',
                'interactions': '与某些抗生素同用需监测肌酶'
            },
            {
                'name': '瑞舒伐他汀钙片',
                'generic_name': 'Rosuvastatin',
                'unit': 'mg',
                'category': 'lipid_lowering',
                'specification': '10mg/片',
                'instructions': '每日一次，任何时间服用',
                'contraindications': '活动性肝病、肌病患者禁用',
                'side_effects': '可能引起头痛、恶心、肌肉疼痛',
                'interactions': '与华法林同用需监测凝血功能'
            },
            
            # 抗凝药
            {
                'name': '阿司匹林肠溶片',
                'generic_name': 'Aspirin',
                'unit': 'mg',
                'category': 'anticoagulant',
                'specification': '100mg/片',
                'instructions': '餐后服用，不可咀嚼',
                'contraindications': '活动性溃疡、严重肝肾功能不全禁用',
                'side_effects': '可能引起胃肠道刺激、出血风险',
                'interactions': '与华法林同用需监测凝血功能'
            },
            {
                'name': '氯吡格雷片',
                'generic_name': 'Clopidogrel',
                'unit': 'mg',
                'category': 'anticoagulant',
                'specification': '75mg/片',
                'instructions': '每日一次，餐后服用',
                'contraindications': '活动性出血患者禁用',
                'side_effects': '可能引起出血、皮疹、腹泻',
                'interactions': '与质子泵抑制剂同用可能影响疗效'
            },
            
            # 利尿剂
            {
                'name': '氢氯噻嗪片',
                'generic_name': 'Hydrochlorothiazide',
                'unit': 'mg',
                'category': 'diuretic',
                'specification': '25mg/片',
                'instructions': '每日一次，晨起服用',
                'contraindications': '无尿、严重肾功能不全禁用',
                'side_effects': '可能引起低血钾、高尿酸血症',
                'interactions': '与地高辛同用需监测血钾'
            },
            {
                'name': '螺内酯片',
                'generic_name': 'Spironolactone',
                'unit': 'mg',
                'category': 'diuretic',
                'specification': '20mg/片',
                'instructions': '每日一次，餐后服用',
                'contraindications': '高钾血症、严重肾功能不全禁用',
                'side_effects': '可能引起高血钾、男性乳房发育',
                'interactions': 'ACEI类药物同用需监测血钾'
            }
        ]

        created_count = 0
        for med_data in medications_data:
            medication, created = Medication.objects.get_or_create(
                name=med_data['name'],
                defaults=med_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✅ 创建药品: {medication.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  药品已存在: {medication.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'\n🎉 完成！共创建了 {created_count} 个新药品')
        ) 