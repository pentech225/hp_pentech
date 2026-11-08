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

/**
 * サイト内検索（右上の虫眼鏡）。2026-11-08 追加。
 * 目録は search-index.json（build-search-index.py で作る）。ボタンと検索窓はここで各ページに差し込む。
 */
(function () {
    const script = document.currentScript;
    if (!script) return;
    const base = new URL('../', script.src); // school/mukonoso/
    const indexUrl = new URL('search-index.json', base);
    const ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="15.5" y1="15.5" x2="21" y2="21" stroke="currentColor" stroke-width="2"/></svg>';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'site-search-btn';
    btn.setAttribute('aria-label', 'サイト内を検索');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = ICON;

    const panel = document.createElement('div');
    panel.className = 'site-search-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'サイト内検索');
    panel.innerHTML =
        '<div class="ss-inner">' +
        '<form class="ss-form" role="search">' + ICON +
        '<input type="search" class="ss-input" placeholder="サイト内を検索（例：料金、体験、Python）" aria-label="検索することば" autocomplete="off">' +
        '<button type="button" class="ss-close" aria-label="検索を閉じる">閉じる</button>' +
        '</form>' +
        '<p class="ss-status" aria-live="polite"></p>' +
        '<ol class="ss-results"></ol>' +
        '</div>';
    const backdrop = document.createElement('div');
    backdrop.className = 'site-search-backdrop';
    backdrop.hidden = true;

    document.body.appendChild(btn);
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    const input = panel.querySelector('.ss-input');
    const status = panel.querySelector('.ss-status');
    const list = panel.querySelector('.ss-results');
    let pages = null;
    let loading = null;

    function load() {
        if (pages) return Promise.resolve(pages);
        if (!loading) {
            loading = fetch(indexUrl).then(function (r) {
                if (!r.ok) throw new Error(r.status);
                return r.json();
            }).then(function (d) { pages = d; return d; });
        }
        return loading;
    }

    function esc(s) {
        return s.replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function snippet(p, terms) {
        const text = p.body || p.desc || '';
        const low = text.toLowerCase();
        let at = -1;
        for (const t of terms) { at = low.indexOf(t); if (at >= 0) break; }
        if (at < 0) return esc((p.desc || text).slice(0, 80));
        const start = Math.max(0, at - 30);
        let s = esc((start > 0 ? '…' : '') + text.slice(start, at + 60) + '…');
        for (const t of terms) {
            const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            s = s.replace(re, function (m) { return '<mark>' + m + '</mark>'; });
        }
        return s;
    }

    function search(q) {
        const terms = q.toLowerCase().split(/[\s　]+/).filter(Boolean);
        list.innerHTML = '';
        if (!terms.length) { status.textContent = ''; return; }
        const hits = [];
        for (const p of pages) {
            const title = p.title.toLowerCase();
            const all = (p.title + ' ' + p.desc + ' ' + p.body).toLowerCase();
            if (!terms.every(function (t) { return all.indexOf(t) >= 0; })) continue;
            let score = 0;
            for (const t of terms) {
                if (title.indexOf(t) >= 0) score += 10;
                if (p.desc.toLowerCase().indexOf(t) >= 0) score += 3;
                score += Math.min(5, all.split(t).length - 1);
            }
            hits.push({ p: p, score: score });
        }
        hits.sort(function (a, b) { return b.score - a.score; });
        status.textContent = hits.length ? hits.length + '件見つかりました' : '見つかりませんでした。ことばを変えてお試しください。';
        list.innerHTML = hits.slice(0, 20).map(function (h) {
            return '<li><a href="' + esc(new URL(h.p.url, base).href) + '"><strong>' + esc(h.p.title) +
                '</strong><span>' + snippet(h.p, terms) + '</span></a></li>';
        }).join('');
    }

    function setOpen(open) {
        panel.hidden = !open;
        backdrop.hidden = !open;
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
            input.focus();
            load().then(function () { if (input.value) search(input.value); })
                .catch(function () { status.textContent = '検索の準備ができませんでした。時間をおいてお試しください。'; });
        } else {
            btn.focus();
        }
    }

    btn.addEventListener('click', function () { setOpen(panel.hidden); });
    backdrop.addEventListener('click', function () { setOpen(false); });
    panel.querySelector('.ss-close').addEventListener('click', function () { setOpen(false); });
    panel.querySelector('.ss-form').addEventListener('submit', function (e) { e.preventDefault(); });
    let timer = null;
    input.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
            load().then(function () { search(input.value); });
        }, 150);
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !panel.hidden) setOpen(false);
    });
})();
