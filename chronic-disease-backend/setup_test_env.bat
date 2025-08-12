@echo off
echo 🚀 设置慢病管理系统测试环境
echo =====================================

echo 1. 创建虚拟环境...
python -m venv venv

echo 2. 激活虚拟环境...
call venv\Scripts\activate.bat

echo 3. 升级pip...
python -m pip install --upgrade pip

echo 4. 安装测试依赖...
pip install -r requirements.txt

echo 5. 验证安装...
echo 检查 pytest 安装:
python -m pytest --version

echo 检查 Django 安装:
python -m django --version

echo ✅ 测试环境设置完成！
echo.
echo 🔧 使用方法:
echo   激活环境: venv\Scripts\activate.bat
echo   运行测试: python -m pytest tests/ -v
echo   覆盖率测试: python -m pytest --cov=. --cov-report=html
echo   性能测试: python -m locust -f locustfile.py --host=http://localhost:8000
echo   安全测试: python security_tests.py
echo.
pause
