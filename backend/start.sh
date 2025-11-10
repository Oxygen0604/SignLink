#!/bin/bash

# SignLink 后端服务启动脚本

echo "==============================================="
echo "SignLink 手语翻译后端服务"
echo "==============================================="

# 检查Python版本
python_version=$(python3 --version 2>&1)
if [ $? -ne 0 ]; then
    echo "❌ 错误: 未找到Python3，请先安装Python 3.8+"
    exit 1
fi
echo "✅ $python_version"

# 检查虚拟环境
if [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  警告: 未检测到虚拟环境，建议在虚拟环境中运行"
    read -p "是否继续？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 安装依赖
echo ""
echo "📦 正在安装Python依赖..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"

# 检查AI模型文件
echo ""
echo "🔍 检查AI模型文件..."
MODEL_PATH="../ai_services/set_training_translation/sign_language_model.h5"
LABELS_PATH="../ai_services/set_training_translation/sign_language_labels.json"

if [ ! -f "$MODEL_PATH" ]; then
    echo "⚠️  警告: 模型文件不存在: $MODEL_PATH"
    echo "请先运行模型训练脚本: python train_sign_language_model.py"
else
    echo "✅ 模型文件存在"
fi

if [ ! -f "$LABELS_PATH" ]; then
    echo "⚠️  警告: 标签文件不存在: $LABELS_PATH"
else
    echo "✅ 标签文件存在"
fi

# 启动服务
echo ""
echo "🚀 正在启动后端服务..."
echo "服务地址: http://localhost:8000"
echo "API文档: http://localhost:8000/docs"
echo "按 Ctrl+C 停止服务"
echo ""

# 启动uvicorn
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
