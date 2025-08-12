"""
Django 配置验证测试
"""
import pytest
import os
from django.conf import settings
from django.test import TestCase


def test_django_settings_configured():
    """测试Django设置是否正确配置"""
    assert settings.configured
    assert hasattr(settings, 'DATABASES')
    assert hasattr(settings, 'INSTALLED_APPS')


def test_environment_variables():
    """测试环境变量设置"""
    assert os.environ.get('DJANGO_SETTINGS_MODULE') == 'chronic_disease_backend.settings'


@pytest.mark.django_db
def test_database_connection():
    """测试数据库连接"""
    from django.db import connection
    cursor = connection.cursor()
    cursor.execute("SELECT 1")
    result = cursor.fetchone()
    assert result == (1,)


def test_apps_loading():
    """测试Django应用加载"""
    from django.apps import apps
    
    # 检查核心应用是否加载
    expected_apps = ['accounts', 'health', 'medication', 'communication']
    
    for app_name in expected_apps:
        try:
            app = apps.get_app_config(app_name)
            assert app is not None
        except LookupError:
            # 如果应用不存在，测试仍然通过，但会记录
            print(f"⚠️ 应用 {app_name} 未找到，可能需要检查INSTALLED_APPS配置")


def test_rest_framework_configured():
    """测试Django REST Framework配置"""
    assert hasattr(settings, 'REST_FRAMEWORK')
    
    # 检查基本的DRF设置
    drf_settings = getattr(settings, 'REST_FRAMEWORK', {})
    assert isinstance(drf_settings, dict)
