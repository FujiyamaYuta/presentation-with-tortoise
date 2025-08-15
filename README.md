# プレゼンツール Chrome拡張機能

このプロジェクトは、プレゼンテーションの時間管理とスライド進行を支援するChrome拡張機能です。

## ファイル構成

```
presentation-with-tortoise/
├── manifest.json          # 拡張機能の設定ファイル
├── popup.html             # ポップアップUI
├── popup.js               # ポップアップのロジック
├── content.js             # コンテンツスクリプト
├── background.js          # バックグラウンドスクリプト
├── icons/                 # アイコンフォルダ
│   ├── icon.svg          # SVGアイコン
│   ├── icon16.png        # 16x16 PNGアイコン
│   ├── icon48.png        # 48x48 PNGアイコン
│   └── icon128.png       # 128x128 PNGアイコン
├── convert-icons.js       # アイコン変換スクリプト
└── README.md             # このファイル
```

## セットアップ手順

### 1. アイコンの生成

```bash
npm install
npm run build-icons
```

または

```bash
node convert-icons.js
```

これにより、`icons/` フォルダに必要なPNGアイコンファイルが生成されます。

### 2. Chrome拡張機能として読み込み

1. Chromeブラウザで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このプロジェクトのフォルダを選択

## 機能

### プレゼンテーション管理
- **スライド数設定**: プレゼンテーションのスライド数を設定
- **時間設定**: プレゼンテーションの総時間を分単位で設定
- **リアルタイムタイマー**: 残り時間を分:秒形式で表示
- **スライド進行管理**: 現在のスライドと残りスライド数を表示
- **プログレスバー**: 時間とスライド進行の視覚的表示

### 永続化機能
- **localStorage対応**: 設定値が自動保存され、再度開いた時に復元
- **設定のリセット**: 保存された設定をクリア可能

### タイマー機能
- **一時停止/再開**: プレゼン中に一時停止と再開が可能
- **自動停止**: 設定時間に達すると自動で停止
- **視覚的フィードバック**: 残り時間と進行状況をリアルタイム表示

## カスタマイズ

### 権限の追加
`manifest.json` の `permissions` 配列に必要な権限を追加：

```json
"permissions": [
  "activeTab",
  "storage",
  "notifications",  // 通知権限
  "tabs"           // タブ操作権限
]
```

### 新しい機能の追加
1. `popup.html` にUI要素を追加
2. `popup.js` にイベントハンドラーを追加
3. `content.js` にメッセージハンドラーを追加
4. 必要に応じて `background.js` にバックグラウンド処理を追加

## 開発のヒント

### デバッグ
- ポップアップ: 拡張機能アイコンを右クリック → 「ポップアップを検証」
- コンテンツスクリプト: 通常のページの開発者ツールで確認
- バックグラウンド: `chrome://extensions/` → 拡張機能の「詳細」→ 「バックグラウンドページを検証」

### よく使うAPI
- `chrome.tabs.query()`: タブ情報の取得
- `chrome.tabs.sendMessage()`: コンテンツスクリプトへのメッセージ送信
- `chrome.storage.local.get/set()`: データの保存・取得
- `chrome.runtime.sendMessage()`: バックグラウンドスクリプトへのメッセージ送信

## トラブルシューティング

### 拡張機能が読み込まれない
- `manifest.json` の構文エラーを確認
- 必要なファイルが存在することを確認
- Chromeの開発者ツールでエラーメッセージを確認

### コンテンツスクリプトが動作しない
- `manifest.json` の `content_scripts` 設定を確認
- ページの読み込み完了を待つ
- コンソールでエラーメッセージを確認

## 参考リンク

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Overview](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Extensions API Reference](https://developer.chrome.com/docs/extensions/reference/)
