/**
 * 画像ギャラリー作成ツール - ギャラリー一覧表示機能
 */

document.addEventListener("DOMContentLoaded", function () {
  // DOM要素
  const galleryContainer = document.getElementById("gallery-container");
  const noGalleriesMessage = document.getElementById("no-galleries");
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");
  const gridViewBtn = document.getElementById("grid-view-btn");
  const listViewBtn = document.getElementById("list-view-btn");

  // 認証状態の確認
  const isAuthenticated = window.authService
    ? window.authService.isAuthenticated()
    : false;
  const currentUser = window.authService
    ? window.authService.getCurrentUser()
    : null;

  // 公開ギャラリーのリスト
  let publicGalleries = [];

  // 初期化
  loadPublicGalleries();

  // 検索機能
  if (searchBtn) {
    searchBtn.addEventListener("click", function () {
      filterGalleries(searchInput.value);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("keyup", function (e) {
      if (e.key === "Enter") {
        filterGalleries(searchInput.value);
      }
    });
  }

  // 表示切り替え
  if (gridViewBtn) {
    gridViewBtn.addEventListener("click", function () {
      setViewMode("grid");
    });
  }

  if (listViewBtn) {
    listViewBtn.addEventListener("click", function () {
      setViewMode("list");
    });
  }

  /**
   * 公開ギャラリーを読み込む
   */
  async function loadPublicGalleries() {
    try {
      // まず、ローカルストレージから公開ギャラリーを取得
      const allGalleries = [];

      // ローカルストレージのキーを取得
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        // ギャラリー設定のキーを検索
        if (key.includes("midjourneyGallerySettings")) {
          try {
            const settings = JSON.parse(localStorage.getItem(key));
            const userId = key.split("user_")[1]?.split("_")[0];

            // 公開設定が有効なギャラリーのみ追加
            if (settings.isPublic) {
              // 画像データを取得
              const imagesKey = key.replace("Settings", "Images");
              const images = JSON.parse(
                localStorage.getItem(imagesKey) || "[]"
              );

              allGalleries.push({
                id: userId || "anonymous",
                settings: settings,
                imageCount: images.length,
                previewImage:
                  images.length > 0
                    ? images[0].src
                    : "https://via.placeholder.com/300x200?text=No+Images",
              });
            }
          } catch (e) {
            console.error("ギャラリーデータの解析に失敗しました", e);
          }
        }
      }

      // Supabaseからも公開ギャラリーを取得（将来の拡張用）
      try {
        // 現在のテーブル構造に合わせて、imagesテーブルから公開ギャラリーを取得
        const { data: images, error } = await supabase
          .from("images")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && images && images.length > 0) {
          // ユーザーごとにグループ化
          const userGalleries = {};

          images.forEach((image) => {
            if (!userGalleries[image.user_id]) {
              userGalleries[image.user_id] = {
                id: image.user_id,
                settings: {
                  title: `${image.user_id}のギャラリー`,
                  description: "Supabaseに保存された画像コレクション",
                  author: "ユーザー",
                  isPublic: true,
                },
                images: [],
                imageCount: 0,
                previewImage:
                  "https://via.placeholder.com/300x200?text=No+Images",
              };
            }

            // 公開URLを取得
            const {
              data: { publicUrl },
            } = supabase.storage
              .from("gallery-images")
              .getPublicUrl(image.storage_path);

            userGalleries[image.user_id].images.push({
              ...image,
              url: publicUrl,
            });
            userGalleries[image.user_id].imageCount++;

            // 最初の画像をプレビューに設定
            if (userGalleries[image.user_id].imageCount === 1) {
              userGalleries[image.user_id].previewImage = publicUrl;
            }
          });

          // Supabaseのギャラリーを追加
          Object.values(userGalleries).forEach((gallery) => {
            allGalleries.push(gallery);
          });
        }
      } catch (supabaseError) {
        console.log(
          "Supabaseからのデータ取得をスキップ:",
          supabaseError.message
        );
      }

      publicGalleries = allGalleries;
    } catch (error) {
      console.error("ギャラリーの読み込みに失敗しました:", error);

      // エラー時はローカルストレージからフォールバック
      const allGalleries = [];

      // ローカルストレージのキーを取得
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        // ギャラリー設定のキーを検索
        if (key.includes("midjourneyGallerySettings")) {
          try {
            const settings = JSON.parse(localStorage.getItem(key));
            const userId = key.split("user_")[1]?.split("_")[0];

            // 公開設定が有効なギャラリーのみ追加
            if (settings.isPublic) {
              // 画像データを取得
              const imagesKey = key.replace("Settings", "Images");
              const images = JSON.parse(
                localStorage.getItem(imagesKey) || "[]"
              );

              allGalleries.push({
                id: userId || "anonymous",
                settings: settings,
                imageCount: images.length,
                previewImage:
                  images.length > 0
                    ? images[0].src
                    : "https://via.placeholder.com/300x200?text=No+Images",
              });
            }
          } catch (e) {
            console.error("ギャラリーデータの解析に失敗しました", e);
          }
        }
      }

      publicGalleries = allGalleries;
    }

    // サンプルギャラリーを追加
    const sampleGalleries = [
      {
        id: "sample_1",
        userId: null,
        settings: {
          title: "美しい風景ギャラリー",
          description: "山や海の美しい風景写真のコレクションです。",
          author: "山田太郎",
          isPublic: true,
        },
        imageCount: 2,
        previewImage:
          "https://via.placeholder.com/300x200?text=Mountain+Sunset",
      },
      {
        id: "sample_2",
        userId: null,
        settings: {
          title: "SF世界のイメージ",
          description: "未来都市やサイバーパンクの世界観を表現した画像集です。",
          author: "佐藤花子",
          isPublic: true,
        },
        imageCount: 2,
        previewImage: "https://via.placeholder.com/300x200?text=Cyberpunk+City",
      },
    ];

    publicGalleries = [...publicGalleries, ...sampleGalleries];
    renderGalleries(publicGalleries);
  }

  /**
   * ギャラリーをフィルタリングする
   */
  function filterGalleries(query) {
    if (!query) {
      renderGalleries(publicGalleries);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = publicGalleries.filter((gallery) => {
      return (
        gallery.settings.title.toLowerCase().includes(lowerQuery) ||
        gallery.settings.description.toLowerCase().includes(lowerQuery) ||
        gallery.settings.author.toLowerCase().includes(lowerQuery)
      );
    });

    renderGalleries(filtered);
  }

  /**
   * ギャラリーを表示する
   */
  function renderGalleries(galleries) {
    if (!galleryContainer) return;

    galleryContainer.innerHTML = "";

    if (galleries.length === 0) {
      if (noGalleriesMessage) {
        noGalleriesMessage.classList.remove("d-none");
      }
      return;
    }

    if (noGalleriesMessage) {
      noGalleriesMessage.classList.add("d-none");
    }

    // 表示モードを取得
    const viewMode = localStorage.getItem("galleryViewMode") || "grid";

    galleries.forEach((gallery) => {
      const galleryElement = document.createElement("div");

      if (viewMode === "grid") {
        galleryElement.className = "col-md-6 col-lg-4 mb-4";
        galleryElement.innerHTML = `
                    <div class="card h-100">
                        <img src="${
                          gallery.previewImage
                        }" class="card-img-top" alt="${
          gallery.settings.title
        }" style="height: 200px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title">${
                              gallery.settings.title
                            }</h5>
                            <p class="card-text">${
                              gallery.settings.description || "説明はありません"
                            }</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">作者: ${
                                  gallery.settings.author || "匿名"
                                }</small>
                                <small class="text-muted">画像: ${
                                  gallery.imageCount
                                }枚</small>
                            </div>
                        </div>
                        <div class="card-footer">
                            <a href="gallery-view.html?${
                              gallery.id.startsWith("sample_")
                                ? `sample=${gallery.id.split("_")[1]}`
                                : gallery.userId
                                ? `user=${gallery.userId}`
                                : `id=${gallery.id}`
                            }" class="btn btn-primary w-100">閲覧する</a>
                        </div>
                    </div>
                `;
      } else {
        galleryElement.className = "col-12 mb-3";
        galleryElement.innerHTML = `
                    <div class="card">
                        <div class="row g-0">
                            <div class="col-md-4">
                                <img src="${
                                  gallery.previewImage
                                }" class="img-fluid rounded-start" alt="${
          gallery.settings.title
        }" style="height: 100%; object-fit: cover;">
                            </div>
                            <div class="col-md-8">
                                <div class="card-body">
                                    <h5 class="card-title">${
                                      gallery.settings.title
                                    }</h5>
                                    <p class="card-text">${
                                      gallery.settings.description ||
                                      "説明はありません"
                                    }</p>
                                    <p class="card-text">
                                        <small class="text-muted">作者: ${
                                          gallery.settings.author || "匿名"
                                        }</small><br>
                                        <small class="text-muted">画像: ${
                                          gallery.imageCount
                                        }枚</small>
                                    </p>
                                    <a href="gallery-view.html?${
                                      gallery.userId
                                        ? `user=${gallery.userId}`
                                        : `id=${gallery.id}`
                                    }" class="btn btn-primary">閲覧する</a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
      }

      galleryContainer.appendChild(galleryElement);
    });
  }

  /**
   * 表示モードを設定する
   */
  function setViewMode(mode) {
    localStorage.setItem("galleryViewMode", mode);

    if (mode === "grid") {
      gridViewBtn.classList.add("active");
      listViewBtn.classList.remove("active");
    } else {
      gridViewBtn.classList.remove("active");
      listViewBtn.classList.add("active");
    }

    renderGalleries(publicGalleries);
  }
});
