@echo off
echo ========================================
echo 手语翻译系统 - 快速启动脚本
echo ========================================
echo.

echo [1/3] 检查 Python 环境...
python --version
if %errorlevel% neq 0 (
    echo 错误：未找到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)

echo.
echo [2/3] 安装依赖包...
pip install -r requirements.txt

echo.
echo [3/3] 环境配置完成！
echo.
echo ========================================
echo 使用指南：
echo ========================================
echo 1. 数据采集：直接在浏览器中打开 data_collection.html
echo 2. 模型训练：运行命令 python train_sign_language_model.py
echo 3. 实时翻译：
echo    - 运行命令 python translation_server.py
echo    - 在浏览器中打开 realtime_translation.html
echo ========================================
echo.
pause
