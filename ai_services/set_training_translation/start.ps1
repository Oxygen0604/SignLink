# 手语翻译系统 - PowerShell 启动脚本

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "       手语翻译系统 - 快速启动" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 检查虚拟环境是否存在
if (-Not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "❌ 虚拟环境不存在！" -ForegroundColor Red
    Write-Host "请先运行以下命令创建虚拟环境：" -ForegroundColor Yellow
    Write-Host "  python -m venv venv" -ForegroundColor Green
    Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor Green
    Write-Host "  pip install -r requirements.txt" -ForegroundColor Green
    Write-Host ""
    Read-Host "按回车键退出"
    exit 1
}

Write-Host "[1/2] 激活虚拟环境..." -ForegroundColor Yellow
try {
    & .\venv\Scripts\Activate.ps1
    Write-Host "✅ 虚拟环境已激活" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ 虚拟环境激活失败！" -ForegroundColor Red
    Write-Host "错误信息: $_" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

Write-Host "[2/2] 启动翻译服务器..." -ForegroundColor Yellow
Write-Host ""

# 检查模型文件是否存在
if (-Not (Test-Path "sign_language_model.h5")) {
    Write-Host "⚠️  警告: 模型文件不存在！" -ForegroundColor Yellow
    Write-Host "请先训练模型: python train_sign_language_model.py" -ForegroundColor Yellow
    Write-Host ""
}

# 启动服务器
python translation_server.py

Write-Host ""
Read-Host "按回车键退出"
