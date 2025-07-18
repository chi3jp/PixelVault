# PixelVault - オンラインギャラリー作成ツール

PixelVault は、AI で生成した画像を簡単に整理・共有できるオンラインギャラリー作成ツールです。Supabase を使用してデータを安全に保存し、Google アカウントでのログインに対応しています。

## 機能

- Google 認証によるログイン
- 画像のアップロードと管理
- ギャラリーの作成と公開
- カスタマイズ可能なレイアウトとテーマ
- 画像のプロンプト情報の保存
- 公開ギャラリーの閲覧

## セットアップ方法

1. Supabase アカウントを作成し、新しいプロジェクトを作成します。
2. Supabase プロジェクトの設定から、以下のテーブルを作成します：

### galleries テーブル

```sql
create table public.galleries (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  author_name text,
  user_id uuid references auth.users(id) not null,
  is_public boolean default false,
  layout text default 'grid',
  theme text default 'light',
  show_prompt boolean default true,
  show_date boolean default true,
  enable_lightbox boolean default true,
  enable_download boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### images テーブル

```sql
create table public.images (
  id uuid default gen_random_uuid() primary key,
  gallery_id uuid references public.galleries(id) on delete cascade not null,
  storage_path text not null,
  title text,
  description text,
  prompt text,
  tags text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

3. Supabase のストレージで `gallery_images` というバケットを作成し、公開アクセスを許可します。

4. Google 認証を有効にするには：

   - Supabase のダッシュボードから「Authentication」→「Providers」を選択
   - Google 認証を有効にし、Google Cloud Platform で作成した OAuth クライアント ID とシークレットを設定
   - リダイレクト URL を設定（例：`https://your-supabase-project.supabase.co/auth/v1/callback`）

5. `js/supabase.js` ファイルを編集し、Supabase の URL と匿名キーを設定します：

```javascript
const supabaseUrl = "YOUR_SUPABASE_URL"; // Supabaseプロジェクトの URL
const supabaseKey = "YOUR_SUPABASE_ANON_KEY"; // Supabaseプロジェクトの公開キー
```

## 使い方

1. Google アカウントでログインします。
2. ギャラリーのタイトル、説明、作者名などの基本情報を入力します。
3. 「画像追加」ボタンをクリックして、画像をアップロードします。
4. 各画像にタイトル、プロンプト、タグなどの情報を追加します。
5. レイアウトやテーマなどのギャラリー設定をカスタマイズします。
6. 「プレビュー」ボタンでギャラリーの表示を確認します。
7. 「エクスポート」ボタンで HTML ファイルとしてギャラリーをダウンロードします。
8. 「公開設定」をオンにすると、他のユーザーもギャラリーを閲覧できるようになります。

## 注意事項

- このツールはデモ用であり、実際の運用には適切なセキュリティ対策が必要です。
- 大量のデータを扱う場合は、適切なストレージ制限とデータベース設計を検討してください。
- 画像の著作権には十分注意し、適切な利用規約を設定してください。

## ライセンス

MIT ライセンス
