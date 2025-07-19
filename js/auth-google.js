/**
 * Google認証機能を実装するファイル
 */

document.addEventListener("DOMContentLoaded", function () {
  // Google認証ボタン
  const googleLoginBtn = document.getElementById("google-login-btn");

  // 認証状態の確認
  checkAuthState();

  // Google認証ボタンのイベントリスナー
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", async function () {
      try {
        await signInWithGoogle();
      } catch (error) {
        console.error("Google認証エラー:", error);
        alert("Google認証に失敗しました。もう一度お試しください。");
      }
    });
  }

  /**
   * 認証状態を確認する関数
   */
  async function checkAuthState() {
    try {
      const user = await supabase.auth.getUser();

      if (user && user.data && user.data.user) {
        // ユーザー情報を取得
        const userData = user.data.user;

        // ユーザー情報をローカルストレージに保存
        const userInfo = {
          id: userData.id,
          username:
            userData.user_metadata?.full_name || userData.email.split("@")[0],
          email: userData.email,
        };

        // 認証状態を更新
        localStorage.setItem("gallery_auth_token", userData.id);
        localStorage.setItem("gallery_auth_user", JSON.stringify(userInfo));

        // UI更新
        updateUIForAuthenticatedUser(userInfo);
      } else {
        // 未認証状態
        updateUIForUnauthenticatedUser();
      }
    } catch (error) {
      console.error("認証状態の確認に失敗しました:", error);
      updateUIForUnauthenticatedUser();
    }
  }

  /**
   * Google認証を行う関数
   */
  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/",
      },
    });

    if (error) {
      console.error("Google認証エラー:", error);
      throw error;
    }

    return data;
  }

  /**
   * ログアウト処理
   */
  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("ログアウトエラー:", error);
        throw error;
      }

      // ローカルストレージからユーザー情報を削除
      localStorage.removeItem("gallery_auth_token");
      localStorage.removeItem("gallery_auth_user");
      sessionStorage.removeItem("gallery_auth_token");
      sessionStorage.removeItem("gallery_auth_user");

      // UI更新
      updateUIForUnauthenticatedUser();

      // ページをリロード
      window.location.reload();
    } catch (error) {
      console.error("ログアウトに失敗しました:", error);
      alert("ログアウトに失敗しました。もう一度お試しください。");
    }
  }

  /**
   * 認証済みユーザー向けのUI更新
   */
  function updateUIForAuthenticatedUser(user) {
    const authButtons = document.getElementById("auth-buttons");
    const userMenu = document.getElementById("user-menu");
    const usernameDisplay = document.getElementById("username-display");
    const logoutBtn = document.getElementById("logout-btn");

    if (authButtons) authButtons.classList.add("d-none");
    if (userMenu) {
      userMenu.classList.remove("d-none");
      if (usernameDisplay && user) {
        usernameDisplay.textContent = user.username;
      }
    }

    // ログアウトボタンのイベントリスナー
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        signOut();
      });
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

  /**
   * 未認証ユーザー向けのUI更新
   */
  function updateUIForUnauthenticatedUser() {
    const authButtons = document.getElementById("auth-buttons");
    const userMenu = document.getElementById("user-menu");

    if (authButtons) authButtons.classList.remove("d-none");
    if (userMenu) userMenu.classList.add("d-none");

    // グローバルオブジェクトに認証情報を設定
    window.authService = {
      isAuthenticated: () => false,
      getCurrentUser: () => null,
      showAuthRequiredModal: () => {
        const authRequiredModal = new bootstrap.Modal(
          document.getElementById("auth-required-modal")
        );
        authRequiredModal.show();
      },
    };
  }
});

// アカウント設定機能
document.addEventListener("DOMContentLoaded", function () {
  const accountSettingsModal = document.getElementById(
    "account-settings-modal"
  );
  const saveAccountSettingsBtn = document.getElementById(
    "save-account-settings-btn"
  );

  // アカウント設定モーダルが開かれた時
  if (accountSettingsModal) {
    accountSettingsModal.addEventListener("show.bs.modal", function () {
      loadAccountSettings();
    });
  }

  // アカウント設定保存ボタン
  if (saveAccountSettingsBtn) {
    saveAccountSettingsBtn.addEventListener("click", saveAccountSettings);
  }

  // アカウント設定を読み込み
  function loadAccountSettings() {
    const currentUser = window.authService
      ? window.authService.getCurrentUser()
      : null;
    if (currentUser) {
      document.getElementById("display-name").value =
        currentUser.username || "";
      document.getElementById("user-email").value = currentUser.email || "";
    }
  }

  // アカウント設定を保存
  async function saveAccountSettings() {
    const displayName = document.getElementById("display-name").value.trim();
    const successAlert = document.getElementById("settings-success");
    const errorAlert = document.getElementById("settings-error");

    // アラートをリセット
    successAlert.classList.add("d-none");
    errorAlert.classList.add("d-none");

    if (!displayName) {
      errorAlert.textContent = "表示名を入力してください";
      errorAlert.classList.remove("d-none");
      return;
    }

    try {
      // ローカルストレージのユーザー情報を更新
      const currentUser = window.authService
        ? window.authService.getCurrentUser()
        : null;
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          username: displayName,
        };

        localStorage.setItem("gallery_auth_user", JSON.stringify(updatedUser));

        // UIを更新
        const usernameDisplay = document.getElementById("username-display");
        if (usernameDisplay) {
          usernameDisplay.textContent = displayName;
        }

        // ギャラリー作者名も更新
        const galleryAuthor = document.getElementById("gallery-author");
        if (galleryAuthor) {
          galleryAuthor.value = displayName;
        }

        // グローバルオブジェクトを更新
        if (window.authService) {
          window.authService.getCurrentUser = () => updatedUser;
        }

        successAlert.classList.remove("d-none");

        // 2秒後にモーダルを閉じる
        setTimeout(() => {
          const modal = bootstrap.Modal.getInstance(accountSettingsModal);
          if (modal) {
            modal.hide();
          }
        }, 2000);
      }
    } catch (error) {
      console.error("アカウント設定保存エラー:", error);
      errorAlert.textContent = "設定の保存に失敗しました";
      errorAlert.classList.remove("d-none");
    }
  }
});
