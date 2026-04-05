# Score Tracer

React + Vite 的分數紀錄與分析工具，可新增分數、備註與紀錄時間，並查看趨勢圖、分數分布與歷史紀錄。

## Local Development

```bash
npm install
npm run dev
```

## GitHub Pages Deployment

這個專案已經設定好 GitHub Pages 自動部署流程。

1. 把專案推到 GitHub 的 `main` 分支。
2. 到 GitHub repository 的 `Settings` -> `Pages`。
3. 在 `Build and deployment` 的 `Source` 選擇 `GitHub Actions`。
4. 之後每次 push 到 `main`，GitHub Actions 都會自動重新部署。

### Base Path

- 在 GitHub Actions 裡，Vite 會自動使用 repository 名稱作為 base path。
- 目前你的遠端倉庫是 `score_tracer`，所以正式網址會是：

`https://gloria0336.github.io/score_tracer/`

- 本機開發時則仍然使用 `/`，不影響 `npm run dev`。
