/**
 * 画像ギャラリー作成ツール - 認証機能
 * 
 * このファイルでは、ユーザー認証に関する機能を実装しています。
 * ローカルストレージを使用して簡易的な認証を行います。
 * 実際のプロダクションでは、サーバーサイドの認証システムを使用してください。
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM要素
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const usernameDisplay = document.getElementById('username-display');
    const loginModal = new bootstrap.Modal(document.getElementById('login-modal'));
    const signupModal = new bootstrap.Modal(document.getElementById('signup-modal'));
    const authRequiredModal = new bootstrap.Modal(document.getElementById('auth-required-modal'));
    
    // フォーム要素
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');
    
    // ボタン要素
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const signupSubmitBtn = document.getElementById('signup-submit-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const showLoginBtn = document.getElementById('show-login');
    const showSignupBtn = document.getElementById('show-signup');
    const goToLoginBtn = document.getElementById('go-to-login-btn');
    const goToSignupBtn = document.getElementById('go-to-signup-btn');
    
    // 機能ボタン（認証が必要な操作）
    const addImageBtn = document.getElementById('add-image-btn');
    const exportBtn = document.getElementById('export-btn');
    
    // 現在のユーザー情報
    let currentUser = null;
    
    // 初期化時に認証状態を確認
    checkAuthState();
    
    // ログインフォームの送信
    loginSubmitBtn.addEventListener('click', function() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password');
        const rememberMe = document.getElementById('remember-me').checked;
        
        if (!email || !password.value) {
            showError(loginError, 'メールアドレスとパスワードを入力してください');
            return;
        }
        
        // ユーザーを検索
        const users = JSON.parse(localStorage.getItem('gallery_users') || '[]');
        const user = users.find(u => u.email === email);
        
        if (!user || user.password !== password.value) {
            showError(loginError, 'メールアドレスまたはパスワードが正しくありません');
            return;
        }
        
        // ログイン成功
        loginUser(user, rememberMe);
        loginModal.hide();
        password.value = ''; // パスワードをクリア
        hideError(loginError);
    });
    
    // 登録フォームの送信
    signupSubmitBtn.addEventListener('click', function() {
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm').value;
        const terms = document.getElementById('terms').checked;
        
        // 入力チェック
        if (!username || !email || !password || !confirm) {
            showError(signupError, 'すべての項目を入力してください');
            return;
        }
        
        if (password !== confirm) {
            showError(signupError, 'パスワードが一致しません');
            return;
        }
        
        if (!terms) {
            showError(signupError, '利用規約とプライバシーポリシーに同意してください');
            return;
        }
        
        // メールアドレスの重複チェック
        const users = JSON.parse(localStorage.getItem('gallery_users') || '[]');
        if (users.some(u => u.email === email)) {
            showError(signupError, 'このメールアドレスは既に登録されています');
            return;
        }
        
        // ユーザー登録
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('gallery_users', JSON.stringify(users));
        
        // 自動ログイン
        loginUser(newUser, true);
        signupModal.hide();
        hideError(signupError);
        
        // フォームをリセット
        signupForm.reset();
        
        // 登録成功メッセージ
        alert('アカウント登録が完了しました！');
    });
    
    // ログアウト処理
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
        });
    }
    
    // モーダル切り替え
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            signupModal.hide();
            setTimeout(() => {
                loginModal.show();
            }, 500);
        });
    }
    
    if (showSignupBtn) {
        showSignupBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loginModal.hide();
            setTimeout(() => {
                signupModal.show();
            }, 500);
        });
    }
    
    // 認証必須モーダルからの遷移
    if (goToLoginBtn) {
        goToLoginBtn.addEventListener('click', function() {
            authRequiredModal.hide();
            setTimeout(() => {
                loginModal.show();
            }, 500);
        });
    }
    
    if (goToSignupBtn) {
        goToSignupBtn.addEventListener('click', function() {
            authRequiredModal.hide();
            setTimeout(() => {
                signupModal.show();
            }, 500);
        });
    }
    
    // 認証が必要な操作のイベントリスナー
    if (addImageBtn) {
        addImageBtn.addEventListener('click', function(e) {
            if (!currentUser) {
                e.preventDefault();
                e.stopPropagation();
                authRequiredModal.show();
            }
            // 認証済みの場合は通常の動作を継続
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', function(e) {
            if (!currentUser) {
                e.preventDefault();
                e.stopPropagation();
                authRequiredModal.show();
            }
            // 認証済みの場合は通常の動作を継続
        });
    }
    
    /**
     * 認証状態を確認する関数
     */
    function checkAuthState() {
        const authToken = localStorage.getItem('gallery_auth_token');
        const authUser = localStorage.getItem('gallery_auth_user');
        
        if (authToken && authUser) {
            try {
                currentUser = JSON.parse(authUser);
                updateUIForAuthenticatedUser();
            } catch (e) {
                console.error('認証情報の解析に失敗しました', e);
                logoutUser();
            }
        } else {
            updateUIForUnauthenticatedUser();
        }
    }
    
    /**
     * ユーザーをログインさせる関数
     */
    function loginUser(user, rememberMe) {
        // セキュリティのため、パスワードを除外したユーザー情報を保存
        const userInfo = {
            id: user.id,
            username: user.username,
            email: user.email
        };
        
        // 認証トークンを生成（実際のアプリでは適切な認証トークンを使用）
        const authToken = btoa(user.id + ':' + Date.now());
        
        currentUser = userInfo;
        
        if (rememberMe) {
            localStorage.setItem('gallery_auth_token', authToken);
            localStorage.setItem('gallery_auth_user', JSON.stringify(userInfo));
        } else {
            sessionStorage.setItem('gallery_auth_token', authToken);
            sessionStorage.setItem('gallery_auth_user', JSON.stringify(userInfo));
        }
        
        updateUIForAuthenticatedUser();
    }
    
    /**
     * ユーザーをログアウトさせる関数
     */
    function logoutUser() {
        currentUser = null;
        localStorage.removeItem('gallery_auth_token');
        localStorage.removeItem('gallery_auth_user');
        sessionStorage.removeItem('gallery_auth_token');
        sessionStorage.removeItem('gallery_auth_user');
        
        updateUIForUnauthenticatedUser();
    }
    
    /**
     * 認証済みユーザー向けのUI更新
     */
    function updateUIForAuthenticatedUser() {
        if (authButtons) authButtons.classList.add('d-none');
        if (userMenu) {
            userMenu.classList.remove('d-none');
            if (usernameDisplay && currentUser) {
                usernameDisplay.textContent = currentUser.username;
            }
        }
        
        // ギャラリー作者名を自動入力
        const galleryAuthor = document.getElementById('gallery-author');
        if (galleryAuthor && currentUser && !galleryAuthor.value) {
            galleryAuthor.value = currentUser.username;
        }
    }
    
    /**
     * 未認証ユーザー向けのUI更新
     */
    function updateUIForUnauthenticatedUser() {
        if (authButtons) authButtons.classList.remove('d-none');
        if (userMenu) userMenu.classList.add('d-none');
    }
    
    /**
     * エラーメッセージを表示する関数
     */
    function showError(element, message) {
        if (element) {
            element.textContent = message;
            element.classList.remove('d-none');
        }
    }
    
    /**
     * エラーメッセージを非表示にする関数
     */
    function hideError(element) {
        if (element) {
            element.classList.add('d-none');
        }
    }
    
    // アプリのメイン機能と連携するためのグローバル関数
    window.authService = {
        isAuthenticated: () => !!currentUser,
        getCurrentUser: () => currentUser,
        showAuthRequiredModal: () => authRequiredModal.show()
    };
});