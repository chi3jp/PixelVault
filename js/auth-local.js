/**
 * ローカル開発用認証機能
 */

document.addEventListener("DOMContentLoaded", function () {
  // ローカル開発環境の場合のみ実行（設定が読み込まれるまで少し待つ）
  setTimeout(() => {
    console.log("ローカル認証機能初期化開始");
    console.log("CONFIG:", CONFIG);
    console.log("IS_LOCAL_DEV:", CONFIG?.IS_LOCAL_DEV);

    // ローカル開発環境でない場合は終了
    if (!CONFIG || !CONFIG.IS_LOCAL_DEV) {
      console.log("ローカル開発環境ではないため、ローカル認証機能をスキップ");
      return;
    }

    // Google認証ボタンを置き換え
    const googleLoginBtn = document.getElementById("google-login-btn");

    if (googleLoginBtn) {
      // 元のイベントリスナーを削除して新しいものを追加
      googleLoginBtn.replaceWith(googleLoginBtn.cloneNode(true));
      const newGoogleLoginBtn = document.getElementById("google-login-btn");

      newGoogleLoginBtn.addEventListener("click", function () {
        showLocalLoginModal();
      });
    }

    // ローカル開発用ログインモーダルを作成
    createLocalLoginModal();

    console.log("ローカル認証機能初期化完了");
  }, 500); // 500ms待機してから実行

  /**
   * ローカル開発用ログインモーダルを表示
   */
  function showLocalLoginModal() {
    const modal = new bootstrap.Modal(
      document.getElementById("local-login-modal")
    );
    modal.show();
  }

  /**
   * ローカル開発用ログインモーダルを作成
   */
  function createLocalLoginModal() {
    const modalHTML = `
      <div class="modal fade" id="local-login-modal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">ローカル開発用ログイン</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                ローカル開発環境では、テスト用のユーザーでログインできます。
              </div>
              <div class="mb-3">
                <label class="form-label">テストユーザーを選択:</label>
                <div class="list-group">
                  <button type="button" class="list-group-item list-group-item-action" onclick="loginAsTestUser('user1')">
                    <div class="d-flex w-100 justify-content-between">
                      <h6 class="mb-1">山田太郎</h6>
                      <small>user1</small>
                    </div>
                    <p class="mb-1">test1@example.com</p>
                  </button>
                  <button type="button" class="list-group-item list-group-item-action" onclick="loginAsTestUser('user2')">
                    <div class="d-flex w-100 justify-content-between">
                      <h6 class="mb-1">佐藤花子</h6>
                      <small>user2</small>
                    </div>
                    <p class="mb-1">test2@example.com</p>
                  </button>
                  <button type="button" class="list-group-item list-group-item-action" onclick="loginAsTestUser('user3')">
                    <div class="d-flex w-100 justify-content-between">
                      <h6 class="mb-1">田中次郎</h6>
                      <small>user3</small>
                    </div>
                    <p class="mb-1">test3@example.com</p>
                  </button>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">キャンセル</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  /**
   * テストユーザーとしてログイン
   */
  window.loginAsTestUser = function (userId) {
    const testUsers = {
      user1: {
        id: "test-user-1",
        username: "山田太郎",
        email: "test1@example.com",
      },
      user2: {
        id: "test-user-2",
        username: "佐藤花子",
        email: "test2@example.com",
      },
      user3: {
        id: "test-user-3",
        username: "田中次郎",
        email: "test3@example.com",
      },
    };

    const user = testUsers[userId];
    if (!user) return;

    // 認証情報をローカルストレージに保存
    localStorage.setItem("gallery_auth_token", user.id);
    localStorage.setItem("gallery_auth_user", JSON.stringify(user));

    // UIを更新
    updateUIForAuthenticatedUser(user);

    // モーダルを閉じる
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("local-login-modal")
    );
    modal.hide();

    // ページをリロード
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  /**
   * 認証済みユーザー向けのUI更新
   */
  function updateUIForAuthenticatedUser(user) {
    const authButtons = document.getElementById("auth-buttons");
    const userMenu = document.getElementById("user-menu");
    const usernameDisplay = document.getElementById("username-display");

    if (authButtons) authButtons.classList.add("d-none");
    if (userMenu) {
      userMenu.classList.remove("d-none");
      if (usernameDisplay && user) {
        usernameDisplay.textContent = user.username;
      }
    }

    // ギャラリー作者名を自動入力
    const galleryAuthor = document.getElementById("gallery-author");
    if (galleryAuthor && user && !galleryAuthor.value) {
      galleryAuthor.value = user.username;
    }

    // グローバルオブジェクトに認証情報を設定
    window.authService = {
      isAuthenticated: () => true,
      getCurrentUser: () => user,
      showAuthRequiredModal: () => {},
    };
  }

  // ログアウト機能の追加
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();

      // ローカルストレージをクリア
      localStorage.removeItem("gallery_auth_token");
      localStorage.removeItem("gallery_auth_user");

      // ページをリロード
      window.location.reload();
    });
  }
});
