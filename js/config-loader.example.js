// 環境変数から設定を動的に読み込む
// このファイルをconfig-loader.jsにコピーして実際の値を設定してください
(function () {
  // 実際のSupabase設定値を入力
  const supabaseUrl = "YOUR_SUPABASE_URL";
  const supabaseKey = "YOUR_SUPABASE_ANON_KEY";

  // グローバルCONFIGオブジェクトを作成
  window.CONFIG = {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseKey,
  };
})();
