"""
URL configuration for chronic_disease_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def api_root(request):
    """API根端点，返回可用的API列表"""
    return Response({
        'message': '慢性病管理系统API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth/',
            'health': '/api/health/',
            'medication': '/api/medication/',
            'communication': '/api/communication/',
            'admin': '/admin/',
        },
        'documentation': '/api/docs/',
        'status': 'running'
    })


urlpatterns = [
    # 管理后台
    path('admin/', admin.site.urls),
    
    # API根端点
    path('api/', api_root, name='api_root'),
    
    # 各应用API路由
    path('api/auth/', include('accounts.urls')),
    path('api/user/', include('accounts.user_urls')),  # 使用专门的user路由配置
    path('api/health/', include('health.urls')),
    path('api/communication/', include('communication.urls')),
    path('api/medication/', include('medication.urls')),
]

# 开发环境静态文件和媒体文件服务
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
    # API文档（可选，需要安装drf-yasg或类似包）
    # from drf_yasg.views import get_schema_view
    # from drf_yasg import openapi
    # from rest_framework import permissions
    # 
    # schema_view = get_schema_view(
    #     openapi.Info(
    #         title="慢性病管理系统API",
    #         default_version='v1',
    #         description="完整的慢性病管理系统API文档",
    #     ),
    #     public=True,
    #     permission_classes=[permissions.AllowAny],
    # )
    # 
    # urlpatterns += [
    #     path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    #     path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    # ]
