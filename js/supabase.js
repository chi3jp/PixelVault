// Supabaseクライアントの初期化
// config.jsから設定を読み込み（セキュリティのため）
const supabaseUrl = CONFIG.SUPABASE_URL;
const supabaseKey = CONFIG.SUPABASE_ANON_KEY;
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 認証状態の確認
async function checkAuth() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("認証エラー:", error.message);
    return null;
  }

  if (!session) {
    console.log("ログインしていません");
    return null;
  }

  return session.user;
}

// Googleログイン
async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/PixelVault/index.html",
    },
  });

  if (error) {
    console.error("Googleログインエラー:", error.message);
    return false;
  }

  return true;
}

// ログアウト
async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("ログアウトエラー:", error.message);
    return false;
  }

  return true;
}

// ギャラリーの作成
async function createGallery(title, description = "", coverImage = null) {
  const user = await checkAuth();
  if (!user) return { error: { message: "ログインが必要です" } };

  const { data, error } = await supabase
    .from("galleries")
    .insert([
      {
        title,
        description,
        cover_image: coverImage,
        user_id: user.id,
      },
    ])
    .select();

  return { data, error };
}

// ギャラリー一覧の取得
async function getGalleries() {
  const user = await checkAuth();
  if (!user) return { error: { message: "ログインが必要です" } };

  const { data, error } = await supabase
    .from("galleries")
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error };
}

// 特定のギャラリーの取得
async function getGallery(galleryId) {
  const { data, error } = await supabase
    .from("galleries")
    .select("*, images(*)")
    .eq("id", galleryId)
    .single();

  return { data, error };
}

// ギャラリーの更新
async function updateGallery(galleryId, updates) {
  const { data, error } = await supabase
    .from("galleries")
    .update(updates)
    .eq("id", galleryId)
    .select();

  return { data, error };
}

// ギャラリーの削除
async function deleteGallery(galleryId) {
  const { error } = await supabase
    .from("galleries")
    .delete()
    .eq("id", galleryId);

  return { error };
}

// 画像のアップロード
async function uploadImage(
  galleryId,
  file,
  title = "",
  description = "",
  prompt = ""
) {
  const user = await checkAuth();
  if (!user) return { error: { message: "ログインが必要です" } };

  // ファイル名を一意にするために現在時刻とランダム文字列を追加
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random()
    .toString(36)
    .substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `${user.id}/${galleryId}/${fileName}`;

  // ストレージにアップロード
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("gallery-images")
    .upload(filePath, file);

  if (uploadError) {
    return { error: uploadError };
  }

  // 公開URLを取得
  const {
    data: { publicUrl },
  } = supabase.storage.from("gallery-images").getPublicUrl(filePath);

  // データベースに画像情報を保存
  const { data, error } = await supabase
    .from("images")
    .insert([
      {
        gallery_id: galleryId,
        storage_path: filePath,
        title,
        description,
        prompt,
      },
    ])
    .select();

  if (error) {
    // エラーが発生した場合、アップロードした画像を削除
    await supabase.storage.from("gallery-images").remove([filePath]);
    return { error };
  }

  return { data: { ...data[0], url: publicUrl }, error: null };
}

// ギャラリー内の画像一覧を取得
async function getImages(galleryId) {
  const { data, error } = await supabase
    .from("images")
    .select("*")
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: false });

  if (error) {
    return { error };
  }

  // 公開URLを追加
  const imagesWithUrls = data.map((image) => {
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("gallery-images")
      .getPublicUrl(image.storage_path);

    return { ...image, url: publicUrl };
  });

  return { data: imagesWithUrls, error: null };
}

// 画像の削除
async function deleteImage(imageId) {
  // 画像情報を取得
  const { data: imageData, error: fetchError } = await supabase
    .from("images")
    .select("storage_path")
    .eq("id", imageId)
    .single();

  if (fetchError) {
    return { error: fetchError };
  }

  // ストレージから画像を削除
  const { error: storageError } = await supabase.storage
    .from("gallery-images")
    .remove([imageData.storage_path]);

  if (storageError) {
    return { error: storageError };
  }

  // データベースから画像情報を削除
  const { error } = await supabase.from("images").delete().eq("id", imageId);

  return { error };
}
