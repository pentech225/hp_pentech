/**
 * ブログ記事データの共通モジュール。
 * html/blog/index.html（一覧ページ）と index.html（トップページの最新記事プレビュー）の両方から読み込む。
 * 記事の href / thumbnail は blog フォルダ（school/mukonoso/html/blog/）からの相対パスで統一しているため、
 * 呼び出し側でリンクを組み立てる際は、blog フォルダ以外から使う場合に "html/blog/" 等のプレフィックスを付けること。
 */
window.BlogData = (function () {
    // 静的記事（手動で作成した記事）。新しい記事はここに追加する（順不同、表示時に日付でソートされる）。
    const STATIC_ARTICLES = [
        { date: '2026.02.05', category: '教室長からのメッセージ', title: 'なぜ今、プログラミングなのか？<br>尼崎の子供たちを、未来の創造者に。', content: '<p style="font-weight: bold; color: var(--text); margin-bottom: 15px;">「うちの子、ゲームばかりして...」「将来が不安...」「何を習わせればいいの？」</p><p>親御さん、その不安、よく分かります。でも、その不安を<strong style="color: var(--accent);">希望に変える</strong>のが、プログラミング教育です。</p><p><strong>なぜ今、プログラミングなのか？</strong><br>10年後、20年後。AIが当たり前の時代。その時、<strong>「作る側」</strong>と<strong>「使う側」</strong>、どちらになりたいですか？</p><p>尼崎の子供たちには、<strong>「作る側」</strong>になってほしい。ゲームを遊ぶだけでなく、<strong>ゲームを作る</strong>。アプリを使うだけでなく、<strong>アプリを作る</strong>。そんな未来の創造者に。</p><p style="font-weight: bold; color: var(--primary); margin-top: 20px;">私たちは、尼崎の子供たちの可能性を、本気で信じています。</p>', href: 'why-programming-now.html', itemStyle: 'background: linear-gradient(135deg, #fff8e1 0%, var(--white) 100%);', titleStyle: 'color: var(--primary);', categoryStyle: 'background: var(--primary);', contentStyle: 'font-size: 1.05rem; line-height: 2;' },
        { date: '2026.02.09', category: 'イベント', title: '実学を学んでほしい', content: '皆さん、お世話になっております。プログラミング教室、教室長の彦阪です。何のためにプログラミングを教えるのか、実際に子供たちのためになっているのか、自問自答をしながら教室運営を行っております。<br>結論から申しますと、行動なくして成長なし、知識のインプットだけではなく、アウトプットを最大化するような教育を心がけたいと考えています。私自身も、中学生の時頑張って受験勉強したこと、大学生の時、あきらめずに部活に食らいついて努力したこと、すべて行動が会ったからこそ、人脈も経験も身についています。ただ、覚えるだけじゃない。そこに実学が伴うか。それを追及していきます。本教室は、生徒一人ひとりに合わせてカリキュラムを組んでおります。だから、安心して通っていただいております。', href: '26_0209_01.html' },
        { date: '2026.02.01', category: 'イベント', title: '節分ゲーム大会を開催しました！', content: '2月1日に第6回ゲーム大会を開催しました。生徒たちが作成したScratchゲームで遊び、大盛り上がりでした！参加してくださった皆様、ありがとうございました。次回のイベントもお楽しみに！', href: 'article-20260201.html' },
        { date: '2026.01.20', category: '授業レポート', title: '3Dプリンターでオリジナル作品を作成', content: '生徒たちがBlenderで3Dモデリングを学び、3Dプリンターで実際に作品を出力しました。自分のアイデアが形になる瞬間は、いつ見ても感動的です。次はどんな作品ができるか楽しみです！', href: 'article-20260120.html' },
        { date: '2026.01.15', category: 'プログラミングのコツ', title: 'Scratch検定対策のポイント', content: 'Scratch検定に向けて、生徒たちが一生懸命取り組んでいます。検定対策のポイントをまとめました。基本的な操作から応用まで、段階的に学習することで確実に力がつきます。', href: 'article-20260115.html' },
        { date: '2026.01.10', category: '教室の様子', title: '新年の目標を立てました', content: '新年を迎え、生徒たちと一緒に今年の目標を立てました。書初めも行いました。それぞれが「こんなゲームを作りたい」「この技術を学びたい」と具体的な目標を発表してくれました。一年間、一緒に頑張っていきましょう！', href: 'article-20260110.html' },
        { date: '2025.12.25', category: 'イベント', title: 'ハロウィンイベントを開催しました', content: 'お化けにまつわるイベントを開催しました。生徒たちが作成したScratchゲームで遊びました。参加してくださった皆様、ありがとうございました。次回のイベントもお楽しみに！', href: 'article-20251225.html' }
    ];

    // API記事と静的記事をマージし、日付降順（新しい順）でソートして返す
    async function getArticles() {
        let apiArticles = [];
        try {
            if (typeof CONFIG !== 'undefined' && CONFIG.BLOG_GOOGLE_APPS_SCRIPT_URL) {
                const url = CONFIG.BLOG_GOOGLE_APPS_SCRIPT_URL + '?action=getArticles';
                const response = await fetch(url);
                const data = await response.json();
                if (data.success && data.articles && data.articles.length > 0) {
                    apiArticles = data.articles.map(a => ({
                        date: a.date,
                        category: a.category,
                        title: a.title,
                        content: a.excerpt || '',
                        href: 'article-viewer.html?id=' + encodeURIComponent(a.id),
                        isApi: true,
                        id: a.id,
                        thumbnail: a.thumbnail || ''
                    }));
                }
            }
        } catch (err) {
            console.warn('APIからの記事取得に失敗しました（静的記事のみ表示）:', err);
        }

        const staticForMerge = STATIC_ARTICLES.map(a => ({ ...a, isApi: false }));
        const allArticles = [...apiArticles, ...staticForMerge].sort((a, b) => {
            const dateA = (a.date || '').replace(/\./g, '-');
            const dateB = (b.date || '').replace(/\./g, '-');
            return new Date(dateB) - new Date(dateA);
        });

        return allArticles;
    }

    return { getArticles };
})();
