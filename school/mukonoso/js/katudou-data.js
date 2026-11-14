/**
 * 活動の様子（html/katudou.html）のデータ
 *
 * 1回の活動 = 1行。新しい活動は、いちばん上に足してください（並び順はページ側で日付順に直します）。
 *
 *   date    : 'YYYY-MM-DD'（必須。日が分からなければ 'YYYY-MM' で月だけ表示。年度と月の表示はここから自動で決まる）
 *   title   : 活動名（必須）
 *   note    : 一言の説明（任意）
 *   status  : '' = 実施済み / '予定' / '中止' / 'お休み'（任意）
 *   link    : 詳細ページ・ブログ記事のURL（任意）
 *   youtube : YouTubeのURL（任意。https://youtu.be/xxxx でも https://www.youtube.com/watch?v=xxxx でも可）
 *   thumb   : サムネ画像のパス（任意。school/mukonoso/ からの相対パス）
 *
 * サムネの決まり方: thumb → YouTubeのサムネ（youtubeがあるとき自動）→ 教室の写真
 * 生徒の顔が写る写真・動画は、保護者の公開同意がある子だけにすること。
 */
const KATUDOU = [
  {
    date: '2026-12-20',
    title: 'クリスマス作品発表会',
    note: 'Scratchのクリスマスカードを発表し、3Dプリンタで作ったオーナメントをおうちの方へプレゼントします。',
    status: '予定'
  },
  {
    date: '2026-11-29',
    title: '3Dプリンタ体験会（第1回）',
    note: 'おうちの方と一緒に、3Dプリンタで小物を作ります。',
    status: '予定'
  },
  {
    date: '2026-09-22',
    title: 'あまがさきキッズプログラミングDAY',
    note: 'Scratchのプログラミング体験イベント（尼崎市教育委員会 後援）。',
    link: 'event/260922.html',
    thumb: 'event/img/260922武庫之荘後援イベント.png'
  },
  {
    date: '2026-05-03',
    title: '第2回 武庫っ子あつまれ！ゲームプログラミング大会',
    note: '生徒が作ったゲームで、地域の子どもたちと遊びました。',
    link: 'event/26_0503.html',
    thumb: 'event/img/260503武庫之荘後援イベント.png'
  },
  {
    date: '2026-03-15',
    title: '武庫っ子あつまれ！ゲームプログラミング大会',
    link: 'event/26_0315.html'
  },
  {
    date: '2026-02-01',
    title: '節分ゲーム大会（第6回ゲーム大会）',
    note: '生徒が作ったScratchゲームで遊ぶ大会。',
    thumb: 'images/event_26_0201_v2.png'
  },
  {
    date: '2025-08',   // 日が分からないときは 'YYYY-MM' で月だけ表示
    title: 'iTeen EXPO 2025',
    note: '全国のiTeen生が作品を発表するEXPOに参加しました。',
    youtube: 'https://youtu.be/piHBYikre_4'
  }
];
