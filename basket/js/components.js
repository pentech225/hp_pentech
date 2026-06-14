(function () {
  const root = (typeof window.ROOT !== 'undefined') ? window.ROOT : '';
  const path = window.location.pathname.replace(/\\/g, '/');
  const reportsActive = path.includes('reports');

  const header = `<header>
  <div class="header-inner">
    <a href="${root}index.html" class="logo">
      <span class="logo-ball">🏀</span>
      むこたまバスケット
    </a>
    <nav>
      <a href="${root}index.html#info">基本情報</a>
      <a href="${root}index.html#schedule">スケジュール</a>
      <a href="${root}index.html#activities">メニュー</a>
      <a href="${root}reports.html"${reportsActive ? ' class="active"' : ''}>活動報告</a>
      <a href="${root}index.html#apply">申し込み</a>
    </nav>
  </div>
</header>`;

  const footer = `<footer>
  <div class="footer-contact">むこたまバスケット</div>
  <p>連絡先：彦阪吉海 <a href="tel:07023278083">070-2327-8083</a></p>
  <p><a href="mailto:mukotama7@gmail.com">mukotama7@gmail.com</a></p>
  <p style="margin-top:16px;">&copy; 2026 むこたまバスケット</p>
</footer>`;

  const headerEl = document.getElementById('site-header');
  if (headerEl) headerEl.outerHTML = header;

  const footerEl = document.getElementById('site-footer');
  if (footerEl) footerEl.outerHTML = footer;
})();
