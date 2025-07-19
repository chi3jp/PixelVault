# PixelVault - AI 画像ギャラリー作成ツール

## セットアップ手順

### 1. 設定ファイルの作成

1. `config.example.js` を `config.js` にコピーしてください
2. `config.js` を開いて、以下の値を設定してください：

```javascript
const CONFIG = {
  SUPABASE_URL: "あなたのSupabaseプロジェクトURL",
  SUPABASE_ANON_KEY: "あなたのSupabaseの公開キー",
};
```

### 2. Supabase の設定

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. プロジェクトの設定から URL と公開キーを取得
3. `config.js` に設定

### 3. セキュリティについて

- `config.js` ファイルは `.gitignore` に含まれているため、Git にコミットされません
- 機密情報は絶対に GitHub にプッシュしないでください
- 本番環境では環境変数を使用することを推奨します

## 使用方法

1. ローカルサーバーを起動してアクセス
2. Google アカウントでログイン
3. ギャラリーを作成して画像をアップロード

## Vercel デプロイ手順

### 1. Vercel プロジェクト作成

1. [Vercel](https://vercel.com)で GitHub リポジトリを連携
2. プロジェクトをインポート

### 2. 環境変数設定

Vercel の設定画面で以下の環境変数を追加：

- `NEXT_PUBLIC_SUPABASE_URL`: あなたの Supabase プロジェクト URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: あなたの Supabase の公開キー

### 3. デプロイ

設定完了後、自動でデプロイされます。

## ローカル開発

ローカルで開発する場合は：

1. `config.js`を直接編集
2. 実際の Supabase 設定値を記入

## 注意事項

- 本番環境では環境変数を使用
- 機密情報は絶対に GitHub にコミットしない
