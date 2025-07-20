-- Supabase データベース設定用SQL
-- このファイルはSupabase SQLエディタで実行してください

-- galleries テーブルの作成（既存の場合はスキップ）
CREATE TABLE IF NOT EXISTS galleries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    author_name TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    settings JSONB,
    cover_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- images テーブルの作成（既存の場合はスキップ）
CREATE TABLE IF NOT EXISTS images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    prompt TEXT,
    tags TEXT,
    storage_path TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_galleries_user_id ON galleries(user_id);
CREATE INDEX IF NOT EXISTS idx_galleries_is_public ON galleries(is_public);
CREATE INDEX IF NOT EXISTS idx_galleries_created_at ON galleries(created_at);
CREATE INDEX IF NOT EXISTS idx_images_gallery_id ON images(gallery_id);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);

-- RLS (Row Level Security) の有効化
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- galleries テーブルのRLSポリシー
-- 公開ギャラリーは誰でも閲覧可能
CREATE POLICY "Public galleries are viewable by everyone" ON galleries
    FOR SELECT USING (is_public = true);

-- 自分のギャラリーは全操作可能
CREATE POLICY "Users can view own galleries" ON galleries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own galleries" ON galleries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own galleries" ON galleries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own galleries" ON galleries
    FOR DELETE USING (auth.uid() = user_id);

-- images テーブルのRLSポリシー
-- 公開ギャラリーの画像は誰でも閲覧可能
CREATE POLICY "Public gallery images are viewable by everyone" ON images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM galleries 
            WHERE galleries.id = images.gallery_id 
            AND galleries.is_public = true
        )
    );

-- 自分の画像は全操作可能
CREATE POLICY "Users can view own images" ON images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images" ON images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own images" ON images
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own images" ON images
    FOR DELETE USING (auth.uid() = user_id);

-- ストレージバケットの作成（既存の場合はスキップ）
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO NOTHING;

-- ストレージのRLSポリシー
-- 認証済みユーザーは自分のフォルダにアップロード可能
CREATE POLICY "Users can upload to own folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'gallery-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- 認証済みユーザーは自分のファイルを更新可能
CREATE POLICY "Users can update own files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'gallery-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- 認証済みユーザーは自分のファイルを削除可能
CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'gallery-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- 公開ファイルは誰でも閲覧可能
CREATE POLICY "Public files are viewable by everyone" ON storage.objects
    FOR SELECT USING (bucket_id = 'gallery-images');

-- 更新日時を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの作成
CREATE TRIGGER update_galleries_updated_at BEFORE UPDATE ON galleries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();