/**
 * ギャラリー表示機能
 */

document.addEventListener("DOMContentLoaded", function () {
  // URL パラメータを取得
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("user");
  const galleryId = urlParams.get("id");

  // DOM要素
  const loading = document.getElementById("loading");
  const errorMessage = document.getElementById("error-message");
  const errorText = document.getElementById("error-text");
  const galleryContent = document.getElementById("gallery-content");
  const galleryTitle = document.getElementById("gallery-title");
  const galleryDescription = document.getElementById("gallery-description");
  const galleryAuthor = document.getElementById("gallery-author");
  const galleryImages = document.getElementById("gallery-images");
  const noImages = document.getElementById("no-images");

  // ライトボックス要素
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxClose = document.querySelector(".lightbox-close");
  const downloadBtn = document.getElementById("download-btn");

  // ギャラリー設定
  let gallerySettings = {};

  // 初期化
  const sampleId = urlParams.get("sample");

  if (sampleId) {
    loadSampleGallery(sampleId);
  } else if (userId) {
    loadGalleryByUser(userId);
  } else if (galleryId) {
    loadGalleryById(galleryId);
  } else {
    showError("ギャラリーIDまたはユーザーIDが指定されていません。");
  }

  /**
   * ユーザーIDでギャラリーを読み込み
   */
  async function loadGalleryByUser(userId) {
    try {
      // Supabaseから公開ギャラリーを取得
      const { data: galleries, error: galleryError } = await supabase
        .from("galleries")
        .select("*, images(*)")
        .eq("user_id", userId)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (galleryError) {
        console.error("ギャラリー取得エラー:", galleryError);
        throw galleryError;
      }

      if (!galleries || galleries.length === 0) {
        // Supabaseにデータがない場合、ローカルストレージから取得
        loadGalleryFromLocalStorage(userId);
        return;
      }

      const gallery = galleries[0];

      // ギャラリー設定を復元
      if (gallery.settings) {
        try {
          gallerySettings = JSON.parse(gallery.settings);
        } catch (e) {
          console.error("設定の解析に失敗:", e);
          gallerySettings = {
            title: gallery.title,
            description: gallery.description,
            author: gallery.author_name,
            showPrompt: true,
            showDate: true,
            enableLightbox: true,
            enableDownload: false,
            theme: "light",
          };
        }
      }

      // 画像データを整形
      const images = gallery.images.map((img) => {
        const {
          data: { publicUrl },
        } = supabase.storage
          .from("gallery-images")
          .getPublicUrl(img.storage_path);

        return {
          id: img.id,
          src: publicUrl,
          title: img.title,
          prompt: img.prompt || img.description,
          date: img.created_at ? img.created_at.split("T")[0] : "",
          tags: img.tags ? img.tags.split(",").map((tag) => tag.trim()) : [],
        };
      });

      displayGallery(gallerySettings, images);
    } catch (error) {
      console.error("ギャラリー読み込みエラー:", error);
      // エラーの場合、ローカルストレージから読み込みを試行
      loadGalleryFromLocalStorage(userId);
    }
  }

  /**
   * ギャラリーIDでギャラリーを読み込み
   */
  async function loadGalleryById(galleryId) {
    try {
      const { data: gallery, error } = await supabase
        .from("galleries")
        .select("*, images(*)")
        .eq("id", galleryId)
        .eq("is_public", true)
        .single();

      if (error) {
        console.error("ギャラリー取得エラー:", error);
        throw error;
      }

      if (!gallery) {
        showError("指定されたギャラリーが見つかりません。");
        return;
      }

      // ギャラリー設定を復元
      if (gallery.settings) {
        try {
          gallerySettings = JSON.parse(gallery.settings);
        } catch (e) {
          gallerySettings = {
            title: gallery.title,
            description: gallery.description,
            author: gallery.author_name,
            showPrompt: true,
            showDate: true,
            enableLightbox: true,
            enableDownload: false,
            theme: "light",
          };
        }
      }

      // 画像データを整形
      const images = gallery.images.map((img) => {
        const {
          data: { publicUrl },
        } = supabase.storage
          .from("gallery-images")
          .getPublicUrl(img.storage_path);

        return {
          id: img.id,
          src: publicUrl,
          title: img.title,
          prompt: img.prompt || img.description,
          date: img.created_at ? img.created_at.split("T")[0] : "",
          tags: img.tags ? img.tags.split(",").map((tag) => tag.trim()) : [],
        };
      });

      displayGallery(gallerySettings, images);
    } catch (error) {
      console.error("ギャラリー読み込みエラー:", error);
      showError("ギャラリーの読み込みに失敗しました。");
    }
  }

  /**
   * ローカルストレージからギャラリーを読み込み
   */
  function loadGalleryFromLocalStorage(userId) {
    try {
      const settingsKey = `user_${userId}_midjourneyGallerySettings`;
      const imagesKey = `user_${userId}_midjourneyGalleryImages`;

      const storedSettings = localStorage.getItem(settingsKey);
      const storedImages = localStorage.getItem(imagesKey);

      if (!storedSettings) {
        showError("指定されたギャラリーが見つかりません。");
        return;
      }

      gallerySettings = JSON.parse(storedSettings);
      const images = storedImages ? JSON.parse(storedImages) : [];

      // 公開設定を確認
      if (!gallerySettings.isPublic) {
        showError("このギャラリーは非公開に設定されています。");
        return;
      }

      displayGallery(gallerySettings, images);
    } catch (error) {
      console.error("ローカルストレージ読み込みエラー:", error);
      showError("ギャラリーの読み込みに失敗しました。");
    }
  }

  /**
   * ギャラリーを表示
   */
  function displayGallery(settings, images) {
    // ローディングを非表示
    loading.classList.add("d-none");

    // ギャラリーコンテンツを表示
    galleryContent.classList.remove("d-none");

    // ヘッダー情報を設定
    galleryTitle.textContent = settings.title || "ギャラリー";
    galleryDescription.textContent = settings.description || "";
    galleryAuthor.textContent = settings.author ? `by ${settings.author}` : "";

    // テーマを適用
    applyTheme(settings.theme || "light");

    // 画像を表示
    if (images && images.length > 0) {
      renderImages(images, settings);
    } else {
      noImages.classList.remove("d-none");
    }

    // ライトボックス機能を初期化
    if (settings.enableLightbox) {
      initLightbox(settings);
    }
  }

  /**
   * 画像を表示
   */
  function renderImages(images, settings) {
    galleryImages.innerHTML = "";

    images.forEach((image) => {
      const imageCol = document.createElement("div");
      imageCol.className = getColumnClass(settings.layout);

      const imageCard = document.createElement("div");
      imageCard.className = "card gallery-item mb-4";

      const img = document.createElement("img");
      img.src = image.src;
      img.className = "card-img-top gallery-image";
      img.alt = image.title;
      img.style.height = settings.layout === "masonry" ? "auto" : "200px";
      img.style.objectFit = "cover";

      if (settings.enableLightbox) {
        img.style.cursor = "pointer";
        img.dataset.title = image.title;
        img.dataset.prompt = image.prompt || "";
        img.dataset.date = image.date || "";
      }

      const cardBody = document.createElement("div");
      cardBody.className = "card-body";

      const cardTitle = document.createElement("h5");
      cardTitle.className = "card-title";
      cardTitle.textContent = image.title;

      cardBody.appendChild(cardTitle);

      // プロンプト表示
      if (settings.showPrompt && image.prompt) {
        const promptText = document.createElement("p");
        promptText.className = "card-text gallery-prompt";
        promptText.textContent = image.prompt;
        cardBody.appendChild(promptText);
      }

      // 日付表示
      if (settings.showDate && image.date) {
        const dateText = document.createElement("p");
        dateText.className = "card-text gallery-date";
        dateText.innerHTML = `<small class="text-muted">${formatDate(
          image.date
        )}</small>`;
        cardBody.appendChild(dateText);
      }

      imageCard.appendChild(img);
      imageCard.appendChild(cardBody);
      imageCol.appendChild(imageCard);
      galleryImages.appendChild(imageCol);
    });
  }

  /**
   * レイアウトに応じたカラムクラスを取得
   */
  function getColumnClass(layout) {
    switch (layout) {
      case "masonry":
        return "col-md-6 col-lg-4";
      case "carousel":
        return "col-12";
      default: // grid
        return "col-md-6 col-lg-4";
    }
  }

  /**
   * テーマを適用
   */
  function applyTheme(theme) {
    const body = document.body;

    // 既存のテーマクラスを削除
    body.classList.remove("theme-dark", "theme-colorful", "theme-minimal");

    // 新しいテーマクラスを追加
    if (theme !== "light") {
      body.classList.add(`theme-${theme}`);
    }
  }

  /**
   * ライトボックス機能を初期化
   */
  function initLightbox(settings) {
    const galleryImages = document.querySelectorAll(".gallery-image");

    galleryImages.forEach((img) => {
      img.addEventListener("click", function () {
        lightboxImage.src = this.src;

        const title = this.dataset.title;
        const prompt = this.dataset.prompt;
        const date = this.dataset.date;

        let caption = title;
        if (settings.showPrompt && prompt) {
          caption += `<br><small class="text-muted">${prompt}</small>`;
        }
        if (settings.showDate && date) {
          caption += `<br><small class="text-muted">${formatDate(
            date
          )}</small>`;
        }

        lightboxCaption.innerHTML = caption;
        lightbox.style.display = "flex";

        // ダウンロードボタン
        if (settings.enableDownload) {
          downloadBtn.classList.remove("d-none");
          downloadBtn.onclick = function () {
            const link = document.createElement("a");
            link.href = lightboxImage.src;
            link.download = title || "image";
            link.click();
          };
        } else {
          downloadBtn.classList.add("d-none");
        }
      });
    });

    // ライトボックスを閉じる
    lightboxClose.addEventListener("click", function () {
      lightbox.style.display = "none";
    });

    // 背景クリックでも閉じる
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) {
        lightbox.style.display = "none";
      }
    });
  }

  /**
   * 日付をフォーマット
   */
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP");
  }

  /**
   * サンプルギャラリーを読み込み
   */
  function loadSampleGallery(sampleId) {
    const sampleGalleries = {
      1: {
        title: "美しい風景ギャラリー",
        description: "山や海の美しい風景写真のコレクションです。",
        author: "山田太郎",
        theme: "nature",
        showPrompt: true,
        showDate: true,
        enableLightbox: true,
        enableDownload: false,
      },
      2: {
        title: "SF世界のイメージ",
        description: "未来都市やサイバーパンクの世界観を表現した画像集です。",
        author: "佐藤花子",
        theme: "neon",
        showPrompt: true,
        showDate: true,
        enableLightbox: true,
        enableDownload: false,
      },
    };

    const sampleImages = {
      1: [
        {
          id: 1,
          src: "https://via.placeholder.com/400x300?text=Mountain+Sunset",
          title: "夕暮れの山",
          prompt:
            "beautiful mountain landscape at sunset, golden hour lighting",
          date: "2025-01-15",
        },
        {
          id: 2,
          src: "https://via.placeholder.com/400x300?text=Ocean+View",
          title: "海の景色",
          prompt: "peaceful ocean view with waves, blue sky and clouds",
          date: "2025-01-14",
        },
      ],
      2: [
        {
          id: 1,
          src: "https://via.placeholder.com/400x300?text=Cyberpunk+City",
          title: "サイバーパンク都市",
          prompt: "futuristic cyberpunk city with neon lights at night",
          date: "2025-01-13",
        },
        {
          id: 2,
          src: "https://via.placeholder.com/400x300?text=Robot+Future",
          title: "ロボットの未来",
          prompt: "advanced robot in futuristic setting, sci-fi atmosphere",
          date: "2025-01-12",
        },
      ],
    };

    const gallery = sampleGalleries[sampleId];
    const images = sampleImages[sampleId];

    if (gallery && images) {
      gallerySettings = gallery;
      displayGallery(gallery, images);
    } else {
      showError("サンプルギャラリーが見つかりません。");
    }
  }

  /**
   * エラーを表示
   */
  function showError(message) {
    loading.classList.add("d-none");
    errorText.textContent = message;
    errorMessage.classList.remove("d-none");
  }
});
