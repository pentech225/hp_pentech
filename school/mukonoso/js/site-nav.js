/**
 * サイト共通ナビゲーションの開閉（モバイル・タブレットのドロワー）。
 * マークアップは各ページの <aside class="site-sidebar"> と <header class="site-topbar">、見た目は css/layout.css。
 * PC（1024px以上）ではサイドバーが常に表示されるので、このスクリプトは何もしない。
 */
(function () {
    const sidebar = document.getElementById('site-sidebar');
    const toggle = document.getElementById('sb-toggle');
    const overlay = document.getElementById('sb-overlay');
    if (!sidebar || !toggle || !overlay) return;

    const desktop = window.matchMedia('(min-width: 1024px)');

    function setOpen(open) {
        sidebar.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
        overlay.hidden = !open;
        document.documentElement.classList.toggle('sb-locked', open);
        if (open) {
            const first = sidebar.querySelector('a');
            if (first) first.focus();
        }
    }

    toggle.addEventListener('click', function () {
        setOpen(!sidebar.classList.contains('is-open'));
    });
    overlay.addEventListener('click', function () {
        setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && sidebar.classList.contains('is-open')) {
            setOpen(false);
            toggle.focus();
        }
    });
    // ページ内リンク（#news など）を押したらドロワーを閉じる
    sidebar.addEventListener('click', function (e) {
        if (e.target.closest('a') && !desktop.matches) setOpen(false);
    });
    // PC幅に戻ったら開閉状態をリセット
    desktop.addEventListener('change', function () {
        setOpen(false);
    });
})();
