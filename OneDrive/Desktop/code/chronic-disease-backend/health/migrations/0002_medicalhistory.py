from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('health', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='MedicalHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200, verbose_name='标题')),
                ('content', models.TextField(verbose_name='内容')),
                ('history_type', models.CharField(choices=[('follow_up', 'Follow-up'), ('examination', 'Examination'), ('diagnosis', 'Diagnosis'), ('treatment', 'Treatment'), ('note', 'Note')], default='note', max_length=32, verbose_name='类型')),
                ('occurred_date', models.DateField(verbose_name='发生日期')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
                ('doctor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_medical_histories', to=settings.AUTH_USER_MODEL, verbose_name='创建医生')),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='medical_histories', to=settings.AUTH_USER_MODEL, verbose_name='患者')),
            ],
            options={
                'db_table': 'medical_history',
                'verbose_name': '病历记录',
                'verbose_name_plural': '病历记录',
                'ordering': ['-occurred_date', '-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='medicalhistory',
            index=models.Index(fields=['patient', 'occurred_date'], name='medical_his_patient__3dc988_idx'),
        ),
        migrations.AddIndex(
            model_name='medicalhistory',
            index=models.Index(fields=['history_type', 'occurred_date'], name='medical_his_history__2173a8_idx'),
        ),
    ]


