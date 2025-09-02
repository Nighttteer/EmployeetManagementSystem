from django.apps import AppConfig


class HealthConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'health'
    verbose_name = '健康管理'

    def ready(self):
        """
        应用启动时的初始化操作
        """
        # 导入并注册信号处理器
        try:
            from . import signals
            signals.setup_signals()
        except ImportError:
            pass