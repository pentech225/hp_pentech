/**
 * Matomoアクセス解析トラッキングコード
 *
 * CONFIG.MATOMO_URL が設定されている場合のみ、Matomoの計測タグを読み込みます。
 * Matomo未設置の間（MATOMO_URLが空文字）は何もしません。
 *
 * 使用方法：
 * 1. config.jsを先に読み込む
 * 2. このスクリプトを読み込む
 */

(function() {
    'use strict';

    if (typeof CONFIG === 'undefined') {
        console.error('CONFIGが読み込まれていません。config.jsを先に読み込んでください。');
        return;
    }

    if (!CONFIG.MATOMO_URL) {
        // Matomoがまだ設置されていないため何もしない
        return;
    }

    var _paq = window._paq = window._paq || [];
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);

    (function() {
        var u = CONFIG.MATOMO_URL;
        _paq.push(['setTrackerUrl', u + 'matomo.php']);
        _paq.push(['setSiteId', CONFIG.MATOMO_SITE_ID || '1']);
        var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
        g.async = true;
        g.src = u + 'matomo.js';
        s.parentNode.insertBefore(g, s);
    })();
})();
