/**
 * ITパスポート試験対策コース - 確認問題（4択クイズ）
 *
 * 動画の一覧の間に挟んで表示する問題をここに追加していく。
 *
 * afterOrder: videos.js の動画の order の直後にこの問題を表示する。
 *             0 を指定すると、一番最初（動画リストの先頭）に表示される。
 * choices:    { key, text } の配列。4択なら4件。
 * answerKey:  正解の choices[].key。
 *
 * 例: order:1 の動画の直後に出したい場合は afterOrder: 1 にする。
 *     同じ afterOrder に複数の問題を書けば、まとめて連続で表示される。
 */

const QUIZZES = [
  {
    id: 'q1',
    afterOrder: 1,
    question: '動物が写っている大量の画像から犬や猫などの特長を自動的に抽出して、動物の種類を識別できるようにするAIの技術はどれか。',
    choices: [
      { key: 'ア', text: 'e-ラーニング' },
      { key: 'イ', text: 'アクティブラーニング' },
      { key: 'ウ', text: 'アダプティブラーニング' },
      { key: 'エ', text: 'ディープラーニング' }
    ],
    answerKey: 'エ'
  }
];
