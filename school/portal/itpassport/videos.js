/**
 * ITパスポート試験対策コース - 動画リスト
 *
 * 「ITすきま教室」チャンネルのプレイリストから取得したものです。
 * https://www.youtube.com/@ITsukima
 * https://www.youtube.com/playlist?list=PLhThj1C8DuL1rPuW4n1dnMRbKbbg2bkHv
 *
 * order 1〜15（テクノロジ系）は上記プレイリストの先頭15件（旧・RSSフィード由来）。
 * order 16〜41（マネジメント系・ストラテジ系）は2026-09-12に同プレイリストの再生ページを
 * ブラウザで直接確認し、videoId・タイトルを実際のページから取得して追加したもの。
 * 動画を追加する場合はここに { videoId, title, order } を足すだけでOK。
 */

const VIDEOS = [
  { videoId: 'hsNKCU20vBU', title: '①【ITパスポート】受験メリット・取得方法／ITの国家試験とは？', order: 1 , explain: 'ITパスポート試験 テクノロジ系分野の学習内容まとめ\n\nハードウェアとソフトウェア\nハードウェア: 物理的に交換しない限り変更できない「硬い」部分です。ここからはコンピューターの5大装置などを学びます。\nソフトウェア: アップデートなどで振る舞いが変わる「柔らかい」部分です。OS、ミドルウェア、アプリケーションの役割などを学びます。\nネットワークとデータの仕組み\nネットワーク: コンピューター単体ではなく、システム同士がリクエストとレスポンスを通じて情報をやり取りする仕組みです。\nデータの表現: コンピューターは電圧の有無（1と0）で動いているため、2進数や16進数といった基数の基礎知識が必要です。\nプログラミング\nコンピューターに指示を出すための言語に関する内容で、近年のITパスポート試験では読解や穴埋め問題が重要視されています。\n人間が命令しやすい言語で記述したものを、CPUが直接理解できる0と1の「マシン言語」に変換する仕組みを学びます。\nITインフラと情報セキュリティ\nITインフラ: 企業におけるオンプレミス（自社運用）でのシステム管理や、クラウドサービスの活用について学習します。\nセキュリティ: 財産的価値のある情報を、盗難や不正アクセスから守るための方法を学びます。こうした攻撃は金銭を目的とすることが多い点にも触れられています。\nデータベースとデータ分析\nデータベース: 蓄積されたデータにアクセスして画面に表示したり、抽出・分析してビジネス判断やマーケティング（データサイエンス）に活用します。\nデータの粒度: 「情報・データ」という言葉は、商品の情報といった大きなまとまりを指すこともあれば、0と1のような細かな単位を指すこともあり、文脈によって扱う粒度が変わります。'},
  { videoId: 'inAhVU7-LXY', title: '②ITパスポート試験 出題範囲、テスト形式、IT国家試験の取得メリット', order: 2 },
  { videoId: 'lZsR_8Eugi4', title: '③ITすきま教室の使い方【ITパスポート,基本情報技術者,高校情報科】', order: 3 },
  { videoId: 'UxBUwPuepdI', title: '④ITパスポート試験 テクノロジ系分野の学習内容ダイジェスト', order: 4 },
  { videoId: '4TSLy0SyxtI', title: '⑤IPアドレスとは？サーバーとクライアント／ITパスポート・基本情報技術者・高校情報', order: 5 },
  { videoId: 'ciZm4KDwS7M', title: '⑥コンピューターの五大装置(ハードウェア)／ITパスポート・基本情報技術者試験・高校情報Ⅰ', order: 6 },
  { videoId: 'ZkArQb3mIQc', title: '⑦CPUのパーツの役割（コア、プロセッサ、クロック周波数、GPUとCPU、レジスタ）', order: 7 },
  { videoId: 'Dz3GkHczSQM', title: '⑧コンピューターの記憶装置（主記憶装置と補助記憶装置の違い、キャッシュメモリ、HDD、SSD）', order: 8 },
  { videoId: 'S-Xzi7oGxhQ', title: '⑨RAIDとは？ハードディスクの多重化・ハードウェア障害からの保護', order: 9 },
  { videoId: 'DJfC3iOmRZk', title: '⑩ソフトウェアを知ろう オープンソースソフトウェアの特徴・改良と再配布', order: 10 },
  { videoId: 'GfBmj9T09YQ', title: '⑪ITパスポート／出力装置・試験に向けた知識対策！（CAD/CAM、DPIなど）', order: 11 },
  { videoId: '-bF3t5oaRTk', title: '⑫ネットワーク通信とは【IPアドレス/サーバー/通信プロトコル】', order: 12 },
  { videoId: 'uBcTnwSGqDs', title: '⑬ドメインルール・IPアドレス枯渇化対策／ITパスポート・基本情報技術者・高校情報', order: 13 },
  { videoId: 'DV-zl0OnWto', title: '⑭ファイルディレクトリのパス指定問題・CUIとGUI', order: 14 },
  { videoId: 'nfTL64JxU-w', title: '⑮キャッシュ、クッキーの違いを解説！セッションとは？', order: 15 },

  // マネジメント系
  { videoId: '5T2lX99Old8', title: 'ITパスポート試験📝マネジメント系分野は何を「管理」する知識？', order: 16 },
  { videoId: 'AcXg58OA2wM', title: 'ITパスポート／マネジメント系⓪~システム開発プロセス全体像~', order: 17 },
  { videoId: 'GhgKMwpb8sE', title: 'ITパスポート／マネジメント系①~企画・プロジェクトマネジメント~', order: 18 },
  { videoId: 'vTOU1IOwPEc', title: 'ITパスポート／マネジメント系②~要件定義プロセス~', order: 19 },
  { videoId: 'I3R6Rucd6To', title: 'ITパスポート／マネジメント系③~システム開発プロセス~', order: 20 },
  { videoId: '5OwfiSXg6lY', title: '全部分かればスゴイ6選🎉システム開発技術の種類と特徴／ITパスポート・基本情報技術者・高校情報', order: 21 },
  { videoId: 'mP_J6N0Ac9w', title: 'ITパスポート／マネジメント系④~保守・運用プロセス~', order: 22 },
  { videoId: 'EPMv6wkJ32Q', title: 'RFIとRFPの違い？企業と技術の秘密を守るNDA🤫「調達」業務とは🧭／ITパスポート・基本情報技術者・高校情報', order: 23 },
  { videoId: '21kB9kesd_s', title: 'IPA試験頻出！リスクマネジメント、リスクアセスメント、リスク対応策を知ろう🐿️🤨／ITパスポート・基本情報技術者・高校情報', order: 24 },
  { videoId: '8Yz0L5ZSBFU', title: 'ITパスポート🔍システム監査人って、何する仕事？⚙️', order: 25 },

  // ストラテジ系
  { videoId: 'JnWp6TODlbM', title: 'ITパスポート試験📝ITの試験なのに、なぜ経営知識を問われるの？ストラテジ系分野', order: 26 },
  { videoId: 'zzb5Fe4JSSs', title: 'ストラテジ系・絶対おさえたいビジネス基礎用語／ITパスポート・基本情報技術者', order: 27 },
  { videoId: 'VAsDXCqvwsY', title: 'PPM/BSC/VCM/SCM…資本を拡大する企業分析／ITパスポート・基本情報技術者・高校情報', order: 28 },
  { videoId: 'nqFKAsF1n84', title: '🏢 ストラテジ系・他社協業の用語集／ITパスポート・基本情報技術者・高校情報', order: 29 },
  { videoId: 'PjZfP011cjM', title: '組織の成立ち👨‍👩‍👧‍👦職能別組織と事業部制組織／ITパスポート・基本情報技術者・高校情報', order: 30 },
  { videoId: 'ae49wasqJ8k', title: 'CSRとは？利益以外の会社の役割／ITパスポート・基本情報技術者・高校情報', order: 31 },
  { videoId: 'v3zTLgg6JyY', title: 'ビジネスの道しるべ！目標達成の指標／ITパスポート・基本情報技術者・高校情報', order: 32 },
  { videoId: 'ZJ9FmouyrIM', title: 'マーケティングとは？①／ITパスポート,基本情報技術者だけでないビジネスで使える知識◎', order: 33 },
  { videoId: 'GJ4jH2y1slA', title: 'マーケティングのフレームワーク基礎／ITパスポート・基本情報技術者・高校情報', order: 34 },
  { videoId: '7j88wfQoz1k', title: '知的財産権（著作権・産業財産権＞特許権・実用新案権・意匠権・商標権）／ITパスポート・基本情報技術者・高校情報', order: 35 },
  { videoId: '_KQnlZRNs_c', title: '個人情報を保護する法律／ITパスポート・基本情報技術者・高校情報', order: 36 },
  { videoId: 'kUp110N7YOg', title: '雇用契約・働く人に関わる法律🕵️‍♂️／ITパスポート・基本情報技術者・高校情報', order: 37 },
  { videoId: 'AStXoYqPAQA', title: '損益分岐点”売上高”を求めよう！／ITパスポート・基本情報技術者試験', order: 38 },
  { videoId: 'VJDuiWl6-C4', title: '損益計算書(P/L)から読み解く「利益率」求め方／ITパスポート・基本情報技術者・高校情報', order: 39 },
  { videoId: 'yZ-y2tqNg48', title: '貸借対照表(B/S)から読み解く「自己資本比率」求め方／ITパスポート・基本情報技術者・高校情報', order: 40 },
  { videoId: 'kB3IrAeqOgs', title: 'キャッシュフロー計算書(C/F)／ITパスポート・基本情報技術者', order: 41 }
];