// Vercel環境変数または直接設定から読み込み
const CONFIG = {
  SUPABASE_URL: process?.env?.NEXT_PUBLIC_SUPABASE_URL || "YOUR_SUPABASE_URL",
  SUPABASE_ANON_KEY:
    process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY",
};

// ブラウザ環境での対応
if (typeof window !== "undefined" && !CONFIG.SUPABASE_URL.startsWith("http")) {
  console.warn("Supabase設定が必要です。config.jsを確認してください。");
}
