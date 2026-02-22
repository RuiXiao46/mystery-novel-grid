# 推理小说生涯个人喜好表

一个基于 Next.js 的在线生成器，用于创建你的推理小说喜好表，支持自定义标题、豆瓣图书封面搜索、图片上传与导出。
![](img/推理小说生涯个人喜好表.jpg)
## 功能简介
- 生成推理小说喜好表
- 支持编辑格子标题和书名
- 支持豆瓣图书搜索并填充封面
- 支持本地上传封面并裁剪
- 支持导出高清图片
- 支持中英文界面切换

## 技术栈
- Next.js 14（App Router）
- TypeScript
- Tailwind CSS + Radix UI
- Canvas 绘制与导出
- IndexedDB 本地持久化

## 本地开发
1. 安装依赖
```bash
npm install
```

2. 启动开发服务
```bash
npm run dev
```

3. 打开浏览器访问
```text
http://localhost:3000
```

## 生产构建
```bash
npm run build
npm start
```

## 环境变量
在项目根目录新建 `.env.local`（不要提交到仓库）：

```bash
# 可选：Google Analytics
NEXT_PUBLIC_GA_ID=

# 可选：当本地网络访问豆瓣受限时使用
HTTPS_PROXY=http://127.0.0.1:7897
```

说明：
- 项目使用豆瓣图书搜索接口获取书名与封面。
- 如果本地网络可直接访问豆瓣，可不配置 `HTTPS_PROXY`。

## 测试与检查
```bash
npm run lint
npm run test:e2e
```

## 部署
推荐部署到 Vercel：
- 导入仓库
- 配置可选环境变量（如 `NEXT_PUBLIC_GA_ID`、`HTTPS_PROXY`）
- 一键部署

## 许可证
MIT，见 `LICENSE`。
