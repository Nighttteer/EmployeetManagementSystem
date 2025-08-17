"""
Django测试专用设置
从主设置继承，并覆盖测试相关配置
"""
from .settings import *

# 测试数据库设置
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',  # 使用内存数据库，速度更快
        'TEST': {
            'NAME': ':memory:',
        },
    }
}

# 测试时使用简化的迁移
# MIGRATION_MODULES = DisableMigrations()  # 暂时禁用以解决测试问题

# 测试时禁用缓存
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# 简化密码哈希以加速测试
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# 禁用日志输出
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'root': {
        'handlers': ['null'],
    },
}

# 测试时禁用邮件发送
EMAIL_BACKEND = 'django.core.mail.backends.dummy.EmailBackend'

# 媒体文件设置
MEDIA_ROOT = '/tmp/test_media'
MEDIA_URL = '/test_media/'

# 静态文件设置
STATIC_ROOT = '/tmp/test_static'

# 禁用调试模式
DEBUG = False

# 测试时允许所有主机
ALLOWED_HOSTS = ['*']

# 简化中间件
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

# 测试时的REST框架设置
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'TEST_REQUEST_DEFAULT_FORMAT': 'json',
    'DEFAULT_PAGINATION_CLASS': None,  # 测试时禁用分页
}

# JWT设置（简化）
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

# 测试时禁用Celery
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# 时区设置
USE_TZ = True
TIME_ZONE = 'Asia/Shanghai'

print("测试设置已加载")
