# Signlink前端语句判断逻辑

## 文档概述

本文档详细说明了SignLink手语翻译系统中，前端如何处理后端返回的识别结果，并将其组合成完整语句的逻辑。

## 🎯 核心概念

### 识别模式
- **单帧独立识别**: 后端对每一帧图像独立进行识别，返回词汇或未检测状态
- **前端历史组合**: 前端本地维护识别历史，组合连续的识别结果形成句子
- **时间窗口**: 每100ms处理一帧，2秒手语演示约20帧

## 🔄 整体工作流程

```
前端摄像头 → 100ms间隔截帧 → Base64编码 → POST到后端
                                    ↓
后端识别 → 返回识别结果 → 前端接收 → 本地组合 → 形成句子
```

## 📊 详细处理逻辑

### 1️⃣ 前端发送逻辑

```javascript
// 每100ms截取并发送一帧
setInterval(async () => {
    if (!isTranslating) return;

    // 1. 截取当前帧
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg", 0.8);

    // 2. 发送到后端
    const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
    });

    // 3. 接收并处理结果
    const result = await response.json();
    processRecognitionResult(result);
}, 100);
```

### 2️⃣ 后端识别逻辑

后端对每帧独立处理，返回以下格式：

**有效识别结果**:
```json
{
    "success": true,
    "detected": true,
    "word": "hello",
    "confidence": 0.95,
    "annotated_image": "data:image/jpeg;base64,..."
}
```

**无效识别结果**:
```json
{
    "success": true,
    "detected": false,
    "message": "未检测到手势"
}
```

### 3️⃣ 前端处理识别结果

#### 核心状态管理

```javascript
class SentenceBuilder {
    constructor() {
        this.wordHistory = [];        // 已确认的词汇历史
        this.currentWord = null;      // 当前正在识别的词汇
        this.consecutiveCount = 0;    // 连续识别次数
        this.minConsecutive = 3;      // 最小连续次数阈值
    }

    processResult(result) {
        if (result.detected && result.success) {
            this.handleDetectedWord(result.word, result.confidence);
        } else {
            this.handleNoDetection();
        }
    }

    handleDetectedWord(word, confidence) {
        // 置信度过滤
        if (confidence < 0.8) {
            this.resetConsecutiveCount();
            return;
        }

        if (word === this.currentWord) {
            // 相同词汇，增加连续计数
            this.consecutiveCount++;
        } else {
            // 词汇发生变化
            this.commitCurrentWord();
            this.currentWord = word;
            this.consecutiveCount = 1;
        }

        // 检查是否达到确认阈值
        if (this.consecutiveCount >= this.minConsecutive) {
            this.commitCurrentWord();
        }
    }

    handleNoDetection() {
        // 未检测到手势，可能意味着手语演示结束
        if (this.consecutiveCount > 0) {
            this.consecutiveCount--;
            if (this.consecutiveCount === 0) {
                this.commitCurrentWord();
            }
        }
    }

    commitCurrentWord() {
        if (this.currentWord && this.consecutiveCount >= this.minConsecutive) {
            this.wordHistory.push(this.currentWord);
            console.log(`添加词汇: ${this.currentWord}`);
        }
        this.resetCurrentWord();
    }

    resetCurrentWord() {
        this.currentWord = null;
        this.consecutiveCount = 0;
    }

    getCurrentSentence() {
        return this.wordHistory.join(' ');
    }
}
```

## 📝 实际场景示例

### 场景: 演示"hello"手语 (2秒)

#### 时间轴与识别结果

| 时间(ms) | 帧号 | 识别结果 | 连续计数 | 状态 |
|----------|------|----------|----------|------|
| 0-100    | 1    | 未检测   | 0        | 准备阶段 |
| 100-200  | 2    | 未检测   | 0        | 准备阶段 |
| 200-300  | 3    | 未检测   | 0        | 准备阶段 |
| 300-400  | 4    | 未检测   | 0        | 准备阶段 |
| 400-500  | 5    | 未检测   | 0        | 准备阶段 |
| 500-600  | 6    | hello    | 1        | 开始检测 |
| 600-700  | 7    | hello    | 2        | 连续检测 |
| 700-800  | 8    | hello    | 3        | ✓ 确认添加 |
| 800-900  | 9    | hello    | 4        | 持续确认 |
| ...      | ...  | ...      | ...      | ... |
| 1500-1600| 16   | hello    | 4        | 持续确认 |
| 1600-1700| 17   | 未检测   | 3        | 减弱 |
| 1700-1800| 18   | 未检测   | 2        | 减弱 |
| 1800-1900| 19   | 未检测   | 1        | 减弱 |
| 1900-2000| 20   | 未检测   | 0        | 结束 |

**最终结果**: `wordHistory = ["hello"]`

### 场景: 演示"thank you" (4秒)

```
时间轴: 0----1----2----3----4(秒)
       [hello]   [thank you]
```

**识别过程**:
- 0-2秒: 识别"hello"，连续15次确认
- 2-4秒: 识别"thank you"，连续15次确认
- **最终句子**: "hello thank you"

## 🔑 关键实现要点

### 1️⃣ 连续检测机制
- **最小连续次数**: 设置`minConsecutive = 3`防止误识别
- **置信度过滤**: 只处理置信度 > 0.8的结果
- **词汇变化处理**: 新词汇出现时先确认旧词汇

### 2️⃣ 状态管理
```javascript
// 状态转换
状态1: 空闲状态
    ↓ (检测到词汇)
状态2: 词汇识别状态 (连续计数累加)
    ↓ (达到阈值)
状态3: 词汇确认状态 (添加到历史)
    ↓ (词汇变化或无检测)
状态1: 空闲状态
```

### 3️⃣ 去重策略
- **时间窗口**: 避免短时间内重复添加相同词汇
- **连续性检查**: 只有连续识别才能确认
- **历史记录**: 已确认的词汇不会重复添加

### 4️⃣ 异常处理
```javascript
processResult(result) {
    try {
        if (!result.success) {
            console.error('识别失败:', result.message);
            return;
        }

        if (result.detected) {
            // 处理有效识别
            this.handleDetectedWord(result.word, result.confidence);
        } else {
            // 处理无效识别
            this.handleNoDetection();
        }

        // 更新UI显示
        this.updateDisplay();
    } catch (error) {
        console.error('处理识别结果时出错:', error);
    }
}
```

## 🎨 UI展示建议

### 1️⃣ 实时状态显示
```javascript
updateDisplay() {
    // 显示当前识别的词汇
    if (this.currentWord) {
        currentWordElement.textContent = this.currentWord;
        confidenceElement.textContent = `${this.consecutiveCount}/${this.minConsecutive}`;
    }

    // 显示已确认的句子
    sentenceElement.textContent = this.getCurrentSentence();

    // 显示历史记录
    historyElement.innerHTML = this.wordHistory
        .map(word => `<span class="word">${word}</span>`)
        .join(' ');
}
```

### 2️⃣ 用户反馈
- **当前词汇**: 高亮显示正在识别的词汇
- **进度指示**: 显示连续识别进度 (如: 3/3)
- **确认动画**: 词汇确认时的视觉反馈
- **句子展示**: 实时更新完整句子

### 3️⃣ 样式示例
```css
.word {
    display: inline-block;
    padding: 4px 8px;
    margin: 2px;
    background: #e0e0e0;
    border-radius: 4px;
}

.word.current {
    background: #4CAF50;
    color: white;
    animation: pulse 0.5s;
}

.word.confirmed {
    background: #2196F3;
    color: white;
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}
```

## 📋 最佳实践

### ✅ 推荐做法
1. **使用类或模块**: 封装句子构建逻辑
2. **配置参数化**: 将阈值、间隔等设为可配置
3. **日志记录**: 记录识别过程便于调试
4. **用户控制**: 提供开始/停止翻译的按钮
5. **错误恢复**: 处理网络错误、识别失败等情况

### ❌ 避免做法
1. **不要每帧都添加**: 必须使用连续检测机制
2. **不要忽略置信度**: 低置信度的结果可能是误识别
3. **不要实时显示未确认词汇**: 避免频繁的UI更新
4. **不要硬编码阈值**: 允许用户调整识别灵敏度

## 🛠️ 完整实现示例

```javascript
class SignLanguageTranslator {
    constructor() {
        this.sentenceBuilder = new SentenceBuilder();
        this.isTranslating = false;
        this.translationInterval = null;
    }

    start() {
        if (this.isTranslating) return;

        this.isTranslating = true;
        this.translationInterval = setInterval(async () => {
            try {
                const frame = this.captureFrame();
                const result = await this.predictFrame(frame);
                this.sentenceBuilder.processResult(result);
                this.updateUI();
            } catch (error) {
                console.error('翻译过程出错:', error);
            }
        }, 100);
    }

    stop() {
        this.isTranslating = false;
        if (this.translationInterval) {
            clearInterval(this.translationInterval);
            this.translationInterval = null;
        }
    }

    async predictFrame(frame) {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: frame }),
        });
        return await response.json();
    }

    captureFrame() {
        // 实现帧捕获逻辑
        return canvas.toDataURL('image/jpeg', 0.8);
    }

    updateUI() {
        // 更新UI显示
        document.getElementById('current-sentence').textContent =
            this.sentenceBuilder.getCurrentSentence();
    }

    getWordHistory() {
        return this.sentenceBuilder.wordHistory;
    }

    clearHistory() {
        this.sentenceBuilder.wordHistory = [];
        this.updateUI();
    }
}

// 使用示例
const translator = new SignLanguageTranslator();
translator.start();
```

## 📈 性能优化

### 1️⃣ 防抖处理
- **减少API调用**: 如果上一帧刚处理过，可延迟下一帧
- **批量处理**: 累积多帧后一次性处理
- **智能跳过**: 检测到静止状态时减少频率

### 2️⃣ 内存管理
- **限制历史长度**: 避免无限增长
- **及时清理**: 已确认的词汇可标记为已完成
- **资源释放**: 停止时清理所有资源

## 🔍 调试建议

### 1️⃣ 详细日志
```javascript
processResult(result) {
    console.log(`[${new Date().toISOString()}]`, {
        detected: result.detected,
        word: result.word,
        confidence: result.confidence,
        consecutiveCount: this.consecutiveCount,
        currentWord: this.currentWord
    });
}
```

### 2️⃣ 可视化调试
- **实时图表**: 显示识别置信度曲线
- **状态指示器**: 显示当前状态和连续计数
- **历史记录查看器**: 可查看所有历史词汇

## 📚 总结

### 核心原则
1. **单帧独立识别**: 后端每帧独立处理
2. **前端智能组合**: 使用连续检测机制
3. **置信度过滤**: 只处理高置信度结果
4. **历史管理**: 维护已确认的词汇历史

### 关键参数
- **时间间隔**: 100ms
- **最小连续次数**: 3次
- **置信度阈值**: 0.8
- **2秒手语**: 约20帧

### 最终目标
将离散的帧级识别结果智能组合成完整、准确的手语句子，为用户提供流畅的自然语言交互体验。

---

**文档版本**: v1.0
**创建日期**: 2024-11-10
**作者**: SignLink开发团队
