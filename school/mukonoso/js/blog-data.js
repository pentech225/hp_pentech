/**
 * ブログ記事データの共通モジュール。
 * html/blog/index.html（一覧ページ）と index.html（トップページの最新記事プレビュー）の両方から読み込む。
 * 記事の href / thumbnail は blog フォルダ（school/mukonoso/html/blog/）からの相対パスで統一しているため、
 * 呼び出し側でリンクを組み立てる際は、blog フォルダ以外から使う場合に "html/blog/" 等のプレフィックスを付けること。
 */
window.BlogData = (function () {
    // 静的記事（手動で作成した記事）。新しい記事はここに追加する（順不同、表示時に日付でソートされる）。
    const STATIC_ARTICLES = [
        { date: '2026.11.01', category: '教室長からのメッセージ', title: '子どもが伸び続けるのは「ちょうどいい課題」があるとき<br>チクセントミハイの「フローの階段」から考える、授業の役割', content: '人が夢中になるのは、課題の難しさと自分のスキルがつり合っているとき。難しすぎれば不安に、簡単すぎれば退屈になります。上達したら課題を一段上げ、不安なら課題を分けて支える。この「フローの階段」をもとに、授業の本当の役割は一人ひとりにちょうどいい課題を置き続けることだと考え、教室での課題の出し方の4つの基準を書きました。', href: '26_1101_03.html', thumbnail: 'img/261101_flow/261101_flow-kaidan.png' },
        { date: '2026.11.01', category: '教室長からのメッセージ', title: '「やりたくてたまらない」は、育てられる<br>子どもの中にある種を見つけて、育てるということ', content: 'やる気は大人が外から押し込むものではなく、種はもともとその子の中にある。自己決定理論（自律性・有能感・関係性）と自己効力感の研究をもとに、「掘る」「言葉にして返す」「本物を見せる」「小さく勝たせる」「環境を整える」という5つの関わり方と、大人こそわくわくしていたいという思いを書きました。', href: '26_1101_02.html' },
        { date: '2026.11.01', category: '教室長からのメッセージ', title: '道具を使いこなすと、見える世界が変わる<br>AIで動画を作って気づいた「問い」の変化', content: 'AIで動画を作るようになってから、ふだん流れてくる動画を見ても「どのAI動画生成ソフトか」「声はナレーションか音声合成か」「編集はどうしているか」と問いが立つようになりました。道具を使いこなすと質問が変わり、見る目が変わる。脳は使うほど変わるという研究とあわせて、子どもたちに「作る側」の目を持ってほしい理由を書きました。', href: '26_1101_01.html', thumbnail: 'img/261101_dougu/261101_grok_traveler.jpg' },
        { date: '2026.10.28', category: '教室長からのメッセージ', title: '居場所が多い子ほど、自分を好きになれる<br>白書のデータから考える「相談できる人」の大切さ', content: '内閣府「令和4年版 子供・若者白書」によると、居場所が0か所の若者で「今の自分が好きだ」と答えたのは1割、6か所ある若者では7割。居場所が多い若者ほど、チャレンジ精神や社会貢献意欲も高い傾向があります。一方で、地域やネットに「相談できる人」がいる若者は2割前後にとどまります。助けが必要になる前に相談できること、そして子どもたちが「相談される器」を持った大人に育つことの大切さを考えました。', href: '26_1028_01.html', thumbnail: 'img/261028_ibasho/261028_wakamonohakusho_ibasho-kazu.png' },
        { date: '2026.02.05', category: '教室長からのメッセージ', title: 'なぜ今、プログラミングなのか？<br>尼崎の子どもたちを、未来の創造者に。', content: '<p style="font-weight: bold; color: var(--text); margin-bottom: 15px;">「うちの子、ゲームばかりして...」「将来が不安...」「何を習わせればいいの？」</p><p>親御さん、その不安、よく分かります。でも、その不安を<strong style="color: var(--accent);">希望に変える</strong>のが、プログラミング教育です。</p><p><strong>なぜ今、プログラミングなのか？</strong><br>10年後、20年後。AIが当たり前の時代。その時、<strong>「作る側」</strong>と<strong>「使う側」</strong>、どちらになりたいですか？</p><p>尼崎の子どもたちには、<strong>「作る側」</strong>になってほしい。ゲームを遊ぶだけでなく、<strong>ゲームを作る</strong>。アプリを使うだけでなく、<strong>アプリを作る</strong>。そんな未来の創造者に。</p><p style="font-weight: bold; color: var(--primary); margin-top: 20px;">私たちは、尼崎の子どもたちの可能性を、本気で信じています。</p>', href: 'why-programming-now.html' },
        { date: '2026.02.09', category: 'イベント', title: '実学を学んでほしい', content: '皆様、お世話になっております。プログラミング教室、教室長の彦阪です。何のためにプログラミングを教えるのか、実際に子どもたちのためになっているのか、自問自答をしながら教室運営を行っております。<br>結論から申しますと、行動なくして成長なし、知識のインプットだけではなく、アウトプットを最大化するような教育を心がけたいと考えています。私自身も、中学生の時頑張って受験勉強したこと、大学生の時、あきらめずに部活に食らいついて努力したこと、すべて行動が会ったからこそ、人脈も経験も身についています。ただ、覚えるだけじゃない。そこに実学が伴うか。それを追及していきます。本教室は、生徒一人ひとりに合わせてカリキュラムを組んでおります。だから、安心して通っていただいております。', href: '26_0209_01.html' },
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
