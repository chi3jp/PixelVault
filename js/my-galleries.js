/**
 * マイギャラリー管理機能
 */

document.addEventListener("DOMContentLoaded", function () {
  // DOM要素
  const myGalleriesContainer = document.getElementById(
    "my-galleries-container"
  );
  const noGalleries = document.getElementById("no-galleries");
  const authRequired = document.getElementById("auth-required");
  const createGalleryBtn = document.getElementById("create-gallery-btn");
  const createFirstGalleryBtn = document.getElementById(
    "create-first-gallery-btn"
  );
  const loginPromptBtn = document.getElementById("login-prompt-btn");

  // モーダル要素
  const galleryModal = new bootstrap.Modal(
    document.getElementById("gallery-modal")
  );
  const galleryModalTitle = document.getElementById("gallery-modal-title");
  const saveGalleryBtn = document.getElementById("save-gallery-btn");

  // 認証状態の確認
  let isAuthenticated = false;
  let currentUser = null;

  // ギャラリーデータ
  let myGalleries = [];

  // 初期化（複数回チェックして確実に認証状態を確認）
  function initializeWithRetry() {
    let retryCount = 0;
    const maxRetries = 5;

    function tryInit() {
      console.log(`初期化試行 ${retryCount + 1}/${maxRetries}`);

      // 認証状態を即座に確認
      const authToken = localStorage.getItem("gallery_auth_token");
      const authUser = localStorage.getItem("gallery_auth_user");

      if (authToken && authUser) {
        console.log("認証情報発見、初期化実行");
        checkAuthAndLoadGalleries();
        return;
      }

      // authServiceが利用可能かチェック
      if (window.authService && window.authService.isAuthenticated()) {
        console.log("authService認証確認、初期化実行");
        checkAuthAndLoadGalleries();
        return;
      }

      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`認証情報未確認、${200 * retryCount}ms後に再試行`);
        setTimeout(tryInit, 200 * retryCount);
      } else {
        console.log("最大試行回数に達しました、未認証として処理");
        checkAuthAndLoadGalleries();
      }
    }

    tryInit();
  }

  initializeWithRetry();

  // イベントリスナー
  if (createGalleryBtn) {
    createGalleryBtn.addEventListener("click", showCreateGalleryModal);
  }

  if (createFirstGalleryBtn) {
    createFirstGalleryBtn.addEventListener("click", showCreateGalleryModal);
  }

  if (loginPromptBtn) {
    loginPromptBtn.addEventListener("click", function () {
      // Google認証を実行
      if (window.signInWithGoogle) {
        window.signInWithGoogle();
      }
    });
  }

  if (saveGalleryBtn) {
    saveGalleryBtn.addEventListener("click", saveGallery);
  }

  /**
   * 認証状態を確認してギャラリーを読み込み
   */
  async function checkAuthAndLoadGalleries() {
    console.log("認証状態確認開始");

    // ローカルストレージから直接認証状態を確認
    const authToken = localStorage.getItem("gallery_auth_token");
    const authUser = localStorage.getItem("gallery_auth_user");

    console.log("ローカルストレージ確認:", {
      hasToken: !!authToken,
      hasUser: !!authUser,
      token: authToken,
      user: authUser,
    });

    // まずローカルストレージから確認
    if (authToken && authUser) {
      try {
        currentUser = JSON.parse(authUser);
        isAuthenticated = true;
        console.log("ローカルストレージから認証済みユーザー:", currentUser);
      } catch (e) {
        console.error("認証情報の解析に失敗:", e);
        isAuthenticated = false;
        currentUser = null;
      }
    } else {
      isAuthenticated = false;
      currentUser = null;
    }

    // authServiceからも確認（上書きしない）
    if (!isAuthenticated && window.authService) {
      const serviceAuth = window.authService.isAuthenticated();
      const serviceUser = window.authService.getCurrentUser();
      console.log("authService確認:", { serviceAuth, serviceUser });

      if (serviceAuth && serviceUser) {
        isAuthenticated = true;
        currentUser = serviceUser;
        console.log("authServiceから認証済みユーザー:", currentUser);
      }
    }

    console.log("最終認証状態:", { isAuthenticated, currentUser });

    if (!isAuthenticated || !currentUser) {
      console.log("認証されていないため、ログイン画面を表示");
      showAuthRequired();
      return;
    }

    console.log("認証済み、ギャラリー読み込み開始");
    hideAuthRequired();
    await loadMyGalleries();
  }

  /**
   * 認証が必要な表示を表示
   */
  function showAuthRequired() {
    console.log("認証が必要な画面を表示");
    if (authRequired) {
      authRequired.classList.remove("d-none");
    }
    if (myGalleriesContainer) {
      myGalleriesContainer.classList.add("d-none");
    }
    if (noGalleries) {
      noGalleries.classList.add("d-none");
    }
    if (createGalleryBtn) {
      createGalleryBtn.classList.add("d-none");
    }
  }

  /**
   * 認証が必要な表示を非表示
   */
  function hideAuthRequired() {
    console.log("認証済み画面を表示");
    if (authRequired) {
      authRequired.classList.add("d-none");
    }
    if (myGalleriesContainer) {
      myGalleriesContainer.classList.remove("d-none");
    }
    if (createGalleryBtn) {
      createGalleryBtn.classList.remove("d-none");
    }
  }

  /**
   * マイギャラリーを読み込み
   */
  async function loadMyGalleries() {
    try {
      // Supabaseからギャラリーを取得
      const { data: galleries, error } = await supabase
        .from("galleries")
        .select("*, images(count)")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("ギャラリー取得エラー:", error);
        throw error;
      }

      myGalleries = galleries || [];
    } catch (error) {
      console.error("Supabaseからの読み込みに失敗:", error);
      // フォールバック: ローカルストレージから読み込み
      loadFromLocalStorage();
    }

    renderMyGalleries();
  }

  /**
   * ローカルストレージから読み込み
   */
  function loadFromLocalStorage() {
    const userKey = `user_${currentUser.id}_`;
    const galleries = [];

    // ローカルストレージのキーを検索
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (
        key &&
        key.startsWith(userKey) &&
        key.includes("midjourneyGallerySettings")
      ) {
        try {
          const settings = JSON.parse(localStorage.getItem(key));
          const imagesKey = key.replace("Settings", "Images");
          const images = JSON.parse(localStorage.getItem(imagesKey) || "[]");

          galleries.push({
            id: key
              .replace(userKey, "")
              .replace("midjourneyGallerySettings", ""),
            title: settings.title,
            description: settings.description,
            is_public: settings.isPublic,
            created_at: new Date().toISOString(),
            images: images.map(() => ({})), // 画像数をカウント用
          });
        } catch (e) {
          console.error("ローカルデータの解析エラー:", e);
        }
      }
    }

    myGalleries = galleries;
  }

  /**
   * マイギャラリーを表示
   */
  function renderMyGalleries() {
    if (!myGalleriesContainer) return;

    myGalleriesContainer.innerHTML = "";

    if (myGalleries.length === 0) {
      if (noGalleries) {
        noGalleries.classList.remove("d-none");
      }
      return;
    }

    if (noGalleries) {
      noGalleries.classList.add("d-none");
    }

    myGalleries.forEach((gallery) => {
      const galleryCard = createGalleryCard(gallery);
      myGalleriesContainer.appendChild(galleryCard);
    });
  }

  /**
   * ギャラリーカードを作成
   */
  function createGalleryCard(gallery) {
    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-4 mb-4";

    const imageCount = gallery.images ? gallery.images.length : 0;
    const statusBadge = gallery.is_public
      ? '<span class="badge bg-success">公開中</span>'
      : '<span class="badge bg-secondary">非公開</span>';

    col.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title">${gallery.title}</h5>
                        ${statusBadge}
                    </div>
                    <p class="card-text">${
                      gallery.description || "説明なし"
                    }</p>
                    <p class="card-text">
                        <small class="text-muted">画像: ${imageCount}枚</small><br>
                        <small class="text-muted">作成日: ${formatDate(
                          gallery.created_at
                        )}</small>
                    </p>
                </div>
                <div class="card-footer">
                    <div class="btn-group w-100" role="group">
                        <a href="index.html?gallery=${
                          gallery.id
                        }" class="btn btn-primary">編集</a>
                        <button class="btn btn-outline-secondary" onclick="editGallery('${
                          gallery.id
                        }')">設定</button>
                        ${
                          gallery.is_public
                            ? `<a href="gallery-view.html?id=${gallery.id}" class="btn btn-outline-success">表示</a>`
                            : '<button class="btn btn-outline-secondary" disabled>非公開</button>'
                        }
                        <button class="btn btn-outline-danger" onclick="deleteGallery('${
                          gallery.id
                        }')">削除</button>
                    </div>
                </div>
            </div>
        `;

    return col;
  }

  /**
   * ギャラリー作成モーダルを表示
   */
  function showCreateGalleryModal() {
    galleryModalTitle.textContent = "新しいギャラリー";
    document.getElementById("gallery-id").value = "";
    document.getElementById("gallery-title").value = "";
    document.getElementById("gallery-description").value = "";
    document.getElementById("gallery-public").checked = false;

    galleryModal.show();
  }

  /**
   * ギャラリーを保存
   */
  async function saveGallery() {
    const id = document.getElementById("gallery-id").value;
    const title = document.getElementById("gallery-title").value.trim();
    const description = document
      .getElementById("gallery-description")
      .value.trim();
    const isPublic = document.getElementById("gallery-public").checked;

    if (!title) {
      alert("タイトルを入力してください");
      return;
    }

    try {
      if (id) {
        // 更新
        const { error } = await supabase
          .from("galleries")
          .update({
            title,
            description,
            is_public: isPublic,
          })
          .eq("id", id);

        if (error) throw error;
      } else {
        // 新規作成
        const { error } = await supabase.from("galleries").insert([
          {
            title,
            description,
            is_public: isPublic,
            user_id: currentUser.id,
            author_name: currentUser.username,
          },
        ]);

        if (error) throw error;
      }

      galleryModal.hide();
      await loadMyGalleries();
    } catch (error) {
      console.error("ギャラリー保存エラー:", error);
      alert("ギャラリーの保存に失敗しました");
    }
  }

  /**
   * 日付をフォーマット
   */
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP");
  }

  // グローバル関数
  window.editGallery = function (galleryId) {
    const gallery = myGalleries.find((g) => g.id === galleryId);
    if (!gallery) return;

    galleryModalTitle.textContent = "ギャラリー設定";
    document.getElementById("gallery-id").value = gallery.id;
    document.getElementById("gallery-title").value = gallery.title;
    document.getElementById("gallery-description").value =
      gallery.description || "";
    document.getElementById("gallery-public").checked = gallery.is_public;

    galleryModal.show();
  };

  window.deleteGallery = async function (galleryId) {
    if (
      !confirm(
        "このギャラリーを削除してもよろしいですか？\n※画像も全て削除されます。"
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("galleries")
        .delete()
        .eq("id", galleryId);

      if (error) throw error;

      await loadMyGalleries();
    } catch (error) {
      console.error("ギャラリー削除エラー:", error);
      alert("ギャラリーの削除に失敗しました");
    }
  };
});
