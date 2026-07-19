/**
 * Google Analytics 4 (gtag.js) 計測タグ
 * 測定ID: G-3MVR6JLTY4
 *
 * サイト全体（www.pentech.info配下の全セクション）で共通利用。
 * 各ページの<head>から `<script src="/ga4-tracking.js"></script>` で読み込む。
 */
(function() {
    'use strict';

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-3MVR6JLTY4';
    document.head.appendChild(s);

    gtag('js', new Date());
    gtag('config', 'G-3MVR6JLTY4');
})();
