# Score Tracer

React + Vite 的分數紀錄與分析工具，可新增分數、備註與紀錄時間，並查看趨勢圖、分數分布與歷史紀錄。

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to `gh-pages`

這個專案已經改成 `gh-pages` 分支發布模式，有兩種用法：

### 1. 本機手動發布

```bash
npm run deploy
```

這會先執行 build，再把 `dist` 內容推到 `gh-pages` 分支。

### 2. GitHub 自動發布

- 專案已包含 [`.github/workflows/deploy-gh-pages.yml`](./.github/workflows/deploy-gh-pages.yml)
- 每次 push 到 `main`，GitHub Actions 都會自動 build、test，然後更新 `gh-pages` 分支

## GitHub Pages Setting

在 GitHub repository 的 `Settings -> Pages`：

- `Source` 選 `Deploy from a branch`
- `Branch` 選 `gh-pages`
- Folder 選 `/ (root)`

設定完成後，網站網址會是：

`https://gloria0336.github.io/score_tracer/`

## Base Path

- Vite 會自動使用 repository 名稱 `score_tracer` 作為正式部署的 base path
- 本機 `npm run dev` 仍然維持正常開發模式
