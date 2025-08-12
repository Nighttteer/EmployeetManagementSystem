@echo off
echo 🧪 运行慢病管理系统完整测试套件
echo =====================================

REM 检查虚拟环境是否存在
if not exist "venv\Scripts\activate.bat" (
    echo ❌ 虚拟环境不存在，请先运行 setup_test_env.bat
    pause
    exit /b 1
)

REM 激活虚拟环境
call venv\Scripts\activate.bat

echo 📋 开始测试执行...
echo.

echo 1️⃣ 运行单元测试...
python -m pytest tests/unit/ -v --tb=short
if %errorlevel% neq 0 (
    echo ❌ 单元测试失败
    goto :error
)

echo.
echo 2️⃣ 运行集成测试...
python -m pytest tests/integration/ -v --tb=short
if %errorlevel% neq 0 (
    echo ❌ 集成测试失败
    goto :error
)

echo.
echo 3️⃣ 生成覆盖率报告...
python -m pytest --cov=. --cov-report=html --cov-report=term-missing --cov-fail-under=70
if %errorlevel% neq 0 (
    echo ⚠️ 覆盖率未达到70%%标准，但测试继续
)

echo.
echo 4️⃣ 运行安全测试...
python security_tests.py
if %errorlevel% neq 0 (
    echo ⚠️ 安全测试发现问题，请查看报告
)

echo.
echo 5️⃣ 代码质量检查...
echo 运行 Bandit 安全检查...
python -m bandit -r . -f json -o bandit_report.json 2>nul
if %errorlevel% neq 0 (
    echo ⚠️ Bandit 检查发现安全问题，请查看 bandit_report.json
)

echo 运行 Safety 依赖检查...
python -m safety check --json --output safety_report.json 2>nul
if %errorlevel% neq 0 (
    echo ⚠️ Safety 检查发现依赖安全问题，请查看 safety_report.json
)

echo.
echo ✅ 测试套件执行完成！
echo.
echo 📊 测试报告位置:
echo   - HTML覆盖率报告: htmlcov\index.html
echo   - 安全测试报告: security_test_report.json
echo   - Bandit报告: bandit_report.json
echo   - Safety报告: safety_report.json
echo.
echo 🚀 启动性能测试 (可选):
echo   python -m locust -f locustfile.py --host=http://localhost:8000
echo.
goto :end

:error
echo.
echo ❌ 测试执行中断，请检查错误信息
pause
exit /b 1

:end
pause
