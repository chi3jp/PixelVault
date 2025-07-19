// 画像ギャラリー作成ツール用JavaScript

document.addEventListener("DOMContentLoaded", function () {
  // モーダル要素
  const imageModal = new bootstrap.Modal(
    document.getElementById("image-modal")
  );
  const previewModal = new bootstrap.Modal(
    document.getElementById("preview-modal")
  );

  // ボタン要素
  const addImageBtn = document.getElementById("add-image-btn");
  const saveImageBtn = document.getElementById("save-image-btn");
  const applySettingsBtn = document.getElementById("apply-settings-btn");
  const previewBtn = document.getElementById("preview-btn");
  const exportBtn = document.getElementById("export-btn");

  // 画像リスト要素
  const imageList = document.getElementById("image-list");

  // 認証状態の確認
  const isAuthenticated = window.authService
    ? window.authService.isAuthenticated()
    : false;
  const currentUser = window.authService
    ? window.authService.getCurrentUser()
    : null;

  // 画像データ
  let images = [];

  // サンプル画像データ（未ログイン時のみ表示）
  const sampleImages = [
    {
      id: 1,
      src: "https://via.placeholder.com/300x200?text=Sample+Image+1",
      title: "サンプル画像 1",
      prompt: "beautiful landscape, mountains, sunset, detailed",
      date: "2025-07-15",
      tags: ["風景", "山", "夕暮れ"],
    },
    {
      id: 2,
      src: "https://via.placeholder.com/300x200?text=Sample+Image+2",
      title: "サンプル画像 2",
      prompt: "cyberpunk city, neon lights, futuristic",
      date: "2025-07-14",
      tags: ["SF", "サイバーパンク", "都市"],
    },
  ];

  // ギャラリー設定
  let gallerySettings = {
    title: "My Midjourney Gallery",
    description: "",
    author: currentUser ? currentUser.username : "",
    layout: "grid",
    theme: "light",
    showPrompt: true,
    showDate: true,
    enableLightbox: true,
    enableDownload: false,
    isPublic: false,
  };

  // ローカルストレージからデータを読み込む
  function loadData() {
    // ユーザーごとのデータ保存のためのキーを作成
    const userKey = currentUser ? `user_${currentUser.id}_` : "";

    const storedImages = localStorage.getItem(
      `${userKey}midjourneyGalleryImages`
    );
    const storedSettings = localStorage.getItem(
      `${userKey}midjourneyGallerySettings`
    );

    if (storedImages) {
      images = JSON.parse(storedImages);
    } else if (!isAuthenticated) {
      // 未ログイン時はサンプル画像を表示
      images = [...sampleImages];
    }

    if (storedSettings) {
      gallerySettings = JSON.parse(storedSettings);
    } else if (currentUser) {
      // ログイン時は作者名を自動設定
      gallerySettings.author = currentUser.username;
    }

    updateSettingsForm();
    renderImageList();
  }

  // データをローカルストレージに保存
  function saveData() {
    // 未ログイン時は保存しない（サンプルモードとして動作）
    if (!isAuthenticated) {
      if (window.authService) {
        window.authService.showAuthRequiredModal();
      }
      return false;
    }

    // ユーザーごとのデータ保存のためのキーを作成
    const userKey = `user_${currentUser.id}_`;

    localStorage.setItem(
      `${userKey}midjourneyGalleryImages`,
      JSON.stringify(images)
    );
    localStorage.setItem(
      `${userKey}midjourneyGallerySettings`,
      JSON.stringify(gallerySettings)
    );
    return true;
  }

  // 設定フォームを更新
  function updateSettingsForm() {
    document.getElementById("gallery-title").value = gallerySettings.title;
    document.getElementById("gallery-description").value =
      gallerySettings.description;
    document.getElementById("gallery-author").value = gallerySettings.author;

    document.querySelector(
      `input[name="layout"][value="${gallerySettings.layout}"]`
    ).checked = true;
    document.getElementById("color-theme").value = gallerySettings.theme;

    document.getElementById("show-prompt").checked = gallerySettings.showPrompt;
    document.getElementById("show-date").checked = gallerySettings.showDate;
    document.getElementById("enable-lightbox").checked =
      gallerySettings.enableLightbox;
    document.getElementById("enable-download").checked =
      gallerySettings.enableDownload;

    // 公開設定
    const galleryPublicCheckbox = document.getElementById("gallery-public");
    if (galleryPublicCheckbox) {
      galleryPublicCheckbox.checked = gallerySettings.isPublic;

      // 未ログイン時は公開設定を無効化
      if (!isAuthenticated) {
        galleryPublicCheckbox.disabled = true;
        galleryPublicCheckbox.parentElement.querySelector("small").textContent =
          "ギャラリーを公開するにはログインが必要です";
      }
    }
  }

  // 設定を適用
  function applySettings() {
    // 未ログイン時は認証モーダルを表示
    if (!isAuthenticated && window.authService) {
      window.authService.showAuthRequiredModal();
      return;
    }

    gallerySettings.title = document.getElementById("gallery-title").value;
    gallerySettings.description = document.getElementById(
      "gallery-description"
    ).value;
    gallerySettings.author = document.getElementById("gallery-author").value;

    gallerySettings.layout = document.querySelector(
      'input[name="layout"]:checked'
    ).value;
    gallerySettings.theme = document.getElementById("color-theme").value;

    gallerySettings.showPrompt = document.getElementById("show-prompt").checked;
    gallerySettings.showDate = document.getElementById("show-date").checked;
    gallerySettings.enableLightbox =
      document.getElementById("enable-lightbox").checked;
    gallerySettings.enableDownload =
      document.getElementById("enable-download").checked;

    // 公開設定
    const galleryPublicCheckbox = document.getElementById("gallery-public");
    if (galleryPublicCheckbox) {
      gallerySettings.isPublic = galleryPublicCheckbox.checked;
    }

    if (saveData()) {
      alert("設定を適用しました");

      // 公開設定が有効な場合、共有リンクを表示
      if (gallerySettings.isPublic && isAuthenticated) {
        const shareUrl = `gallery.html?user=${currentUser.id}`;
        alert(
          `ギャラリーを公開しました！\n共有リンク: ${window.location.origin}/${shareUrl}`
        );
      }
    }
  }

  // 画像リストを表示
  function renderImageList() {
    imageList.innerHTML = "";

    images.forEach((image) => {
      const imageCol = document.createElement("div");
      imageCol.className = "col-md-6 col-lg-4 mb-3";
      imageCol.dataset.id = image.id;

      const imageCard = document.createElement("div");
      imageCard.className = "image-item card";

      const imagePreview = document.createElement("div");
      imagePreview.className = "image-preview";

      const img = document.createElement("img");
      img.src = image.src;
      img.className = "card-img-top";
      img.alt = image.title;

      const cardBody = document.createElement("div");
      cardBody.className = "card-body";

      const cardTitle = document.createElement("h5");
      cardTitle.className = "card-title";
      cardTitle.textContent = image.title;

      const cardText = document.createElement("p");
      cardText.className = "card-text small text-muted";
      cardText.textContent = image.prompt;

      const cardFooter = document.createElement("div");
      cardFooter.className = "card-footer d-flex justify-content-between";

      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-sm btn-outline-secondary edit-image-btn";
      editBtn.innerHTML = '<i class="bi bi-pencil"></i> 編集';
      editBtn.addEventListener("click", () => editImage(image.id));

      const removeBtn = document.createElement("button");
      removeBtn.className = "btn btn-sm btn-outline-danger remove-image-btn";
      removeBtn.innerHTML = '<i class="bi bi-trash"></i> 削除';
      removeBtn.addEventListener("click", () => removeImage(image.id));

      // 要素を組み立て
      imagePreview.appendChild(img);
      cardBody.appendChild(cardTitle);
      cardBody.appendChild(cardText);
      cardFooter.appendChild(editBtn);
      cardFooter.appendChild(removeBtn);

      imageCard.appendChild(imagePreview);
      imageCard.appendChild(cardBody);
      imageCard.appendChild(cardFooter);

      imageCol.appendChild(imageCard);
      imageList.appendChild(imageCol);
    });

    // ドラッグ&ドロップ機能を初期化
    initSortable();
  }

  // ドラッグ&ドロップ機能を初期化
  function initSortable() {
    new Sortable(imageList, {
      animation: 150,
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      onEnd: function (evt) {
        // 並び順を更新
        const newOrder = Array.from(imageList.children).map((item) =>
          parseInt(item.dataset.id)
        );

        // 画像配列を並べ替え
        const reorderedImages = [];
        newOrder.forEach((id) => {
          const image = images.find((img) => img.id === id);
          if (image) {
            reorderedImages.push(image);
          }
        });

        images = reorderedImages;
        saveData();
      },
    });
  }

  // 画像追加モーダルを表示
  function showAddImageModal() {
    document.getElementById("image-modal-title").textContent = "画像追加";
    document.getElementById("image-form").reset();
    document.getElementById("image-id").value = "";
    document.getElementById("image-preview-container").classList.add("d-none");

    // 今日の日付をデフォルトに
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("image-date").value = today;

    imageModal.show();
  }

  // 画像編集モーダルを表示
  function editImage(id) {
    const image = images.find((img) => img.id === id);
    if (!image) return;

    document.getElementById("image-modal-title").textContent = "画像編集";
    document.getElementById("image-id").value = image.id;
    document.getElementById("image-title").value = image.title;
    document.getElementById("image-prompt").value = image.prompt;
    document.getElementById("image-date").value = image.date;
    document.getElementById("image-tags").value = image.tags.join(", ");

    // 画像プレビュー
    document
      .getElementById("image-preview-container")
      .classList.remove("d-none");
    document.getElementById("image-preview").src = image.src;

    imageModal.show();
  }

  // 画像を保存
  async function saveImage() {
    const id = document.getElementById("image-id").value;
    const title = document.getElementById("image-title").value.trim();
    const prompt = document.getElementById("image-prompt").value.trim();
    const date = document.getElementById("image-date").value;
    const tagsText = document.getElementById("image-tags").value;

    // タグを配列に変換
    const tags = tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    // 画像ファイル
    const imageFile = document.getElementById("image-upload").files[0];

    if (!title) {
      alert("タイトルを入力してください");
      return;
    }

    // 認証チェック
    if (!isAuthenticated) {
      if (window.authService) {
        window.authService.showAuthRequiredModal();
      }
      return;
    }

    try {
      if (id) {
        // 既存画像の更新
        const index = images.findIndex((img) => img.id === parseInt(id));
        if (index !== -1) {
          // 画像ファイルがある場合のみ更新
          if (imageFile) {
            const reader = new FileReader();
            reader.onload = function (e) {
              images[index] = {
                ...images[index],
                src: e.target.result,
                title,
                prompt,
                date,
                tags,
              };

              if (saveData()) {
                renderImageList();
                imageModal.hide();
                showSuccessMessage("画像を更新しました");
              }
            };
            reader.readAsDataURL(imageFile);
          } else {
            // 画像ファイルがない場合はその他の情報のみ更新
            images[index] = {
              ...images[index],
              title,
              prompt,
              date,
              tags,
            };

            if (saveData()) {
              renderImageList();
              imageModal.hide();
              showSuccessMessage("画像情報を更新しました");
            }
          }
        }
      } else {
        // 新規画像の追加
        if (!imageFile) {
          alert("画像ファイルを選択してください");
          return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
          const newId =
            images.length > 0
              ? Math.max(...images.map((img) => img.id)) + 1
              : 1;

          images.push({
            id: newId,
            src: e.target.result,
            title,
            prompt,
            date,
            tags,
          });

          if (saveData()) {
            renderImageList();
            imageModal.hide();
            showSuccessMessage("画像を追加しました");
          }
        };
        reader.readAsDataURL(imageFile);
      }
    } catch (error) {
      console.error("画像保存エラー:", error);
      alert("画像の保存に失敗しました。もう一度お試しください。");
    }
  }

  // 成功メッセージを表示
  function showSuccessMessage(message) {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-success alert-dismissible fade show position-fixed";
    alertDiv.style.cssText =
      "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
    alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    document.body.appendChild(alertDiv);

    // 3秒後に自動で削除
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 3000);
  }

  // 画像を削除
  function removeImage(id) {
    if (!confirm("この画像を削除してもよろしいですか？")) {
      return;
    }

    const index = images.findIndex((img) => img.id === id);
    if (index !== -1) {
      images.splice(index, 1);
      saveData();
      renderImageList();
    }
  }

  // ギャラリーHTMLを生成
  function generateGalleryHTML() {
    const {
      title,
      description,
      author,
      layout,
      theme,
      showPrompt,
      showDate,
      enableLightbox,
      enableDownload,
    } = gallerySettings;

    let html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHTML(title)}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            ${
              theme === "dark"
                ? "background-color: #212529; color: #f8f9fa;"
                : "background-color: #ffffff; color: #212529;"
            }
            font-family: 'Helvetica Neue', Arial, sans-serif;
            padding-top: 2rem;
        }
        .gallery-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .gallery-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        ${
          theme === "colorful"
            ? `
        .gallery-header {
            background: linear-gradient(135deg, #ff7675 0%, #74b9ff 50%, #55efc4 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            padding: 1rem 0;
        }
        `
            : ""
        }
        ${
          theme === "minimal"
            ? `
        body {
            background-color: #f8f9fa;
        }
        .gallery-item {
            background-color: #ffffff;
            border: none;
            border-radius: 0;
        }
        `
            : ""
        }
        .gallery-item {
            margin-bottom: 1.5rem;
            ${
              theme === "dark"
                ? "background-color: #343a40; border-color: #495057;"
                : ""
            }
            ${
              theme === "colorful"
                ? "box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);"
                : ""
            }
        }
        .gallery-image {
            width: 100%;
            height: ${layout === "masonry" ? "auto" : "200px"};
            object-fit: cover;
            cursor: ${enableLightbox ? "pointer" : "default"};
        }
        .gallery-prompt {
            font-size: 0.85rem;
            ${theme === "dark" ? "color: #adb5bd;" : "color: #6c757d;"}
        }
        .gallery-date {
            font-size: 0.8rem;
            ${theme === "dark" ? "color: #adb5bd;" : "color: #6c757d;"}
        }
        .lightbox {
            display: none;
            position: fixed;
            z-index: 1000;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            align-items: center;
            justify-content: center;
        }
        .lightbox-content {
            max-width: 90%;
            max-height: 90%;
        }
        .lightbox-image {
            max-width: 100%;
            max-height: 90vh;
            object-fit: contain;
        }
        .lightbox-caption {
            color: white;
            text-align: center;
            padding: 1rem;
        }
        .lightbox-close {
            position: absolute;
            top: 20px;
            right: 20px;
            color: white;
            font-size: 2rem;
            cursor: pointer;
        }
        .download-btn {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background-color: rgba(255, 255, 255, 0.2);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
        }
        footer {
            text-align: center;
            padding: 2rem 0;
            ${theme === "dark" ? "color: #adb5bd;" : "color: #6c757d;"}
        }
    </style>
</head>
<body>
    <div class="gallery-container">
        <header class="gallery-header">
            <h1>${escapeHTML(title)}</h1>
            ${
              description
                ? `<p class="lead">${escapeHTML(description)}</p>`
                : ""
            }
            ${author ? `<p>by ${escapeHTML(author)}</p>` : ""}
        </header>

        <div class="row ${layout === "masonry" ? "masonry-grid" : ""}">`;

    // 画像アイテム
    images.forEach((image) => {
      html += `
            <div class="col-md-6 col-lg-4">
                <div class="card gallery-item">
                    <img src="${
                      image.src
                    }" class="gallery-image" alt="${escapeHTML(
        image.title
      )}" data-title="${escapeHTML(image.title)}" data-prompt="${escapeHTML(
        image.prompt
      )}">
                    <div class="card-body">
                        <h5 class="card-title">${escapeHTML(image.title)}</h5>
                        ${
                          showPrompt && image.prompt
                            ? `<p class="gallery-prompt">${escapeHTML(
                                image.prompt
                              )}</p>`
                            : ""
                        }
                        ${
                          showDate && image.date
                            ? `<p class="gallery-date">${formatDate(
                                image.date
                              )}</p>`
                            : ""
                        }
                    </div>
                </div>
            </div>`;
    });

    html += `
        </div>
    </div>

    ${
      enableLightbox
        ? `
    <div class="lightbox" id="lightbox">
        <span class="lightbox-close">&times;</span>
        <div class="lightbox-content">
            <img class="lightbox-image" id="lightbox-image" src="">
            <div class="lightbox-caption" id="lightbox-caption"></div>
            ${
              enableDownload
                ? `<button class="download-btn" id="download-btn">ダウンロード</button>`
                : ""
            }
        </div>
    </div>
    `
        : ""
    }

    <footer>
        <p>Created with Midjourney Gallery Creator</p>
        ${
          author
            ? `<p>&copy; ${new Date().getFullYear()} ${escapeHTML(author)}</p>`
            : ""
        }
    </footer>

    <script>
        ${
          enableLightbox
            ? `
        // ライトボックス機能
        document.addEventListener('DOMContentLoaded', function() {
            const lightbox = document.getElementById('lightbox');
            const lightboxImage = document.getElementById('lightbox-image');
            const lightboxCaption = document.getElementById('lightbox-caption');
            const lightboxClose = document.querySelector('.lightbox-close');
            ${
              enableDownload
                ? `const downloadBtn = document.getElementById('download-btn');`
                : ""
            }
            
            // 画像クリックでライトボックス表示
            document.querySelectorAll('.gallery-image').forEach(image => {
                image.addEventListener('click', function() {
                    lightboxImage.src = this.src;
                    
                    const title = this.getAttribute('data-title');
                    const prompt = this.getAttribute('data-prompt');
                    
                    let caption = title;
                    ${
                      showPrompt
                        ? `if (prompt) { caption += '<br><small>' + prompt + '</small>'; }`
                        : ""
                    }
                    
                    lightboxCaption.innerHTML = caption;
                    lightbox.style.display = 'flex';
                    
                    ${
                      enableDownload
                        ? `
                    // ダウンロードボタン
                    downloadBtn.onclick = function() {
                        const link = document.createElement('a');
                        link.href = lightboxImage.src;
                        link.download = title || 'midjourney-image';
                        link.click();
                    };
                    `
                        : ""
                    }
                });
            });
            
            // ライトボックスを閉じる
            lightboxClose.addEventListener('click', function() {
                lightbox.style.display = 'none';
            });
            
            // 背景クリックでも閉じる
            lightbox.addEventListener('click', function(e) {
                if (e.target === lightbox) {
                    lightbox.style.display = 'none';
                }
            });
        });
        `
            : ""
        }
        
        ${
          layout === "masonry"
            ? `
        // マソンリーレイアウト
        document.addEventListener('DOMContentLoaded', function() {
            const masonryGrid = document.querySelector('.masonry-grid');
            const items = masonryGrid.querySelectorAll('.gallery-item');
            
            // 画像読み込み完了後にレイアウト調整
            let loadedImages = 0;
            const totalImages = items.length;
            
            items.forEach(item => {
                const img = item.querySelector('img');
                if (img.complete) {
                    loadedImages++;
                    if (loadedImages === totalImages) {
                        adjustMasonry();
                    }
                } else {
                    img.addEventListener('load', function() {
                        loadedImages++;
                        if (loadedImages === totalImages) {
                            adjustMasonry();
                        }
                    });
                }
            });
            
            function adjustMasonry() {
                // 簡易的なマソンリーレイアウト
                let rowHeight = 0;
                let rowItems = [];
                
                items.forEach(item => {
                    const img = item.querySelector('img');
                    const ratio = img.naturalWidth / img.naturalHeight;
                    const height = 200;
                    const width = height * ratio;
                    
                    img.style.height = height + 'px';
                    img.style.width = width + 'px';
                });
            }
        });
        `
            : ""
        }
        
        ${
          layout === "carousel"
            ? `
        // カルーセルレイアウト
        document.addEventListener('DOMContentLoaded', function() {
            // カルーセル機能を実装
        });
        `
            : ""
        }
    </script>
</body>
</html>`;

    return html;
  }

  // HTMLエスケープ
  function escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 日付フォーマット
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP");
  }

  // ギャラリープレビュー
  function previewGallery() {
    const html = generateGalleryHTML();
    const previewFrame = document.getElementById("preview-frame");

    previewModal.show();

    // iframeにHTMLを書き込み
    setTimeout(() => {
      const frameDoc =
        previewFrame.contentDocument || previewFrame.contentWindow.document;
      frameDoc.open();
      frameDoc.write(html);
      frameDoc.close();
    }, 500);
  }

  // ギャラリーエクスポート
  function exportGallery() {
    const html = generateGalleryHTML();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "midjourney-gallery.html";
    link.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }

  // 画像アップロードプレビュー
  document
    .getElementById("image-upload")
    .addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.match("image.*")) {
        alert("画像ファイルを選択してください");
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        document
          .getElementById("image-preview-container")
          .classList.remove("d-none");
        document.getElementById("image-preview").src = e.target.result;
      };
      reader.readAsDataURL(file);
    });

  // イベントリスナーの設定
  addImageBtn.addEventListener("click", showAddImageModal);
  saveImageBtn.addEventListener("click", saveImage);
  applySettingsBtn.addEventListener("click", applySettings);
  previewBtn.addEventListener("click", previewGallery);
  exportBtn.addEventListener("click", exportGallery);

  // 初期データ読み込み
  loadData();
});

// ギャラリー設定を適用
function applySettings() {
  // フォームから値を取得
  gallerySettings.title =
    document.getElementById("gallery-title").value.trim() ||
    "My Midjourney Gallery";
  gallerySettings.description = document
    .getElementById("gallery-description")
    .value.trim();
  gallerySettings.author = document
    .getElementById("gallery-author")
    .value.trim();
  gallerySettings.layout = document.querySelector(
    'input[name="layout"]:checked'
  ).value;
  gallerySettings.theme = document.getElementById("color-theme").value;
  gallerySettings.showPrompt = document.getElementById("show-prompt").checked;
  gallerySettings.showDate = document.getElementById("show-date").checked;
  gallerySettings.enableLightbox =
    document.getElementById("enable-lightbox").checked;
  gallerySettings.enableDownload =
    document.getElementById("enable-download").checked;
  gallerySettings.isPublic = document.getElementById("gallery-public").checked;

  // データを保存
  if (saveData()) {
    showSuccessMessage("設定を保存しました");
  }
}

// 成功メッセージを表示
function showSuccessMessage(message) {
  const alertDiv = document.createElement("div");
  alertDiv.className =
    "alert alert-success alert-dismissible fade show position-fixed";
  alertDiv.style.cssText =
    "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
  alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
  document.body.appendChild(alertDiv);

  // 3秒後に自動で削除
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.parentNode.removeChild(alertDiv);
    }
  }, 3000);
}
