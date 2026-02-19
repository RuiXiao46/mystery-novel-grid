# 推理小说生涯个人喜好表

生成你的推理小说生涯个人喜好表，支持自定义格子、搜索封面、一键导出图片。

## 快速开始
```bash
git clone https://github.com/janethedev/movie-grid
cd movie-grid
npm install
```

启动开发服务：
```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

## 书籍搜索
本项目使用豆瓣图书搜索接口获取书名与封面图（不需要 API Key）。

如需代理访问，可在 `.env.local` 中配置：
```bash
HTTPS_PROXY=http://127.0.0.1:7897
```

## 部署
推荐使用 Vercel 部署。

如需 Google Analytics，可在部署平台设置：
- `NEXT_PUBLIC_GA_ID`

## 致谢
本项目基于开源项目进行改造，感谢原作者与社区贡献。

## 许可
MIT License，见 `LICENSE`。
