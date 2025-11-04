@echo off
chcp 65001 >nul
echo ============================================================
echo 手语翻译系统 - 快速启动
echo ============================================================
echo.

echo [1/2] 激活虚拟环境...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ 虚拟环境激活失败！
    echo 请先运行 setup.bat 安装环境
    pause
    exit /b 1
)

echo ✅ 虚拟环境已激活
echo.

echo [2/2] 启动翻译服务器...
python translation_server.py

pause
