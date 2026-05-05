/**
 * 紙のアンケート（Google Document）を生成するスクリプト
 *
 * 【使い方】
 * 1. Google Apps Script (script.google.com) を開く
 * 2. このコードを貼り付けて実行（createQuestionnaire）
 * 3. ログに表示されるURLを開いてGoogle Docを確認
 * 4. 印刷 → A4 / 余白「狭い」推奨
 */

function createQuestionnaire() {
  const doc = DocumentApp.create('プログラミング体験会アンケート 2026/5/3 武庫西生涯学習プラザ');
  const body = doc.getBody();
  body.clear();

  // ページ余白を狭く（pt単位）
  body.setMarginTop(36);
  body.setMarginBottom(36);
  body.setMarginLeft(54);
  body.setMarginRight(54);

  // ======== ヘッダー部 ========

  const titlePara = body.appendParagraph('プログラミング体験会 アンケート');
  titlePara.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  titlePara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  titlePara.editAsText().setFontSize(18).setBold(true);

  const subPara = body.appendParagraph('2026年5月3日（日）　武庫西生涯学習プラザ');
  subPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  subPara.editAsText().setFontSize(11).setBold(false);

  const orgPara = body.appendParagraph('主催：iTeen 子どものためのICT教育普及促進委員会');
  orgPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  orgPara.editAsText().setFontSize(10).setItalic(true);

  body.appendParagraph('').editAsText().setFontSize(4); // 小スペース

  const thankPara = body.appendParagraph('本日はご参加いただきまして、誠にありがとうございます。ご意見をお聞かせください。');
  thankPara.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
  thankPara.editAsText().setFontSize(10);

  appendDivider(body);

  // ======== Q1：お名前 ========

  appendQuestion(body, '１．お子さんのお名前をご記入ください。');
  appendWritingLine(body);

  // ======== Q2：満足度 ========

  appendQuestion(body, '２．今日の体験はいかがでしたか？　当てはまる数字に○をつけてください。');

  const scalePara = body.appendParagraph(
    '　　１（つまらなかった）　　　２　　　　　３（ふつう）　　　　　４　　　　　５（とても楽しかった）'
  );
  scalePara.editAsText().setFontSize(11);

  const circlePara = body.appendParagraph('　　　　　１　　　　　　　　　　２　　　　　　　　　　３　　　　　　　　　　４　　　　　　　　　　５');
  circlePara.editAsText().setFontSize(16).setBold(true);

  // ======== Q3：継続意欲 ========

  appendQuestion(body, '３．お子さんの様子を見て、プログラミングを継続して学ばせたいと思いましたか？');
  appendCheckOptions(body, ['ぜひそう思った', '少し思った', '今は考えていない']);

  // ======== Q4：今後の参加意向 ========

  appendQuestion(body, '４．今後も同様のイベントに参加したいですか？また、案内を受け取りますか？');
  appendCheckOptions(body, ['ぜひ参加したい・案内を受け取りたい', '興味があれば参加したい', '今のところ予定はない']);

  // ======== Q5：LINE登録 ========

  appendQuestion(body, '５．公式LINEにご登録いただけましたか？');
  appendCheckOptions(body, ['はい（登録済み）', 'いいえ', 'これからする']);

  // ======== Q6：写真・動画掲載可否 ========

  appendQuestion(body, '６．お子さんの写真・動画のSNS等への掲載についてお教えください。');
  appendCheckOptions(body, ['OK（顔出し可）', 'OK（後ろ姿のみ）', 'NG（掲載不可）']);

  // ======== Q7：自由記述 ========

  appendQuestion(body, '７．ご自由にお書きください（ご感想・ご要望など）');
  appendWritingLine(body);
  appendWritingLine(body);
  appendWritingLine(body);

  appendDivider(body);

  // フッター
  const footerPara = body.appendParagraph('ご協力ありがとうございました。アンケートはスタッフにお渡しください。');
  footerPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  footerPara.editAsText().setFontSize(9).setItalic(true);

  doc.saveAndClose();

  const url = doc.getUrl();
  Logger.log('✅ アンケートが作成されました。');
  Logger.log('📄 URL: ' + url);

  // 完了通知をポップアップで表示
  SpreadsheetApp.getUi && SpreadsheetApp.getUi().alert('作成完了！\n' + url);

  return url;
}

// ---- ヘルパー関数 ----

function appendQuestion(body, text) {
  const p = body.appendParagraph(text);
  p.editAsText().setFontSize(11).setBold(true);
  p.setSpacingBefore(12);
  p.setSpacingAfter(4);
}

function appendCheckOptions(body, options) {
  options.forEach(opt => {
    const p = body.appendParagraph('　□　' + opt);
    p.editAsText().setFontSize(11).setBold(false);
    p.setSpacingBefore(2);
    p.setSpacingAfter(2);
  });
}

function appendWritingLine(body) {
  // 記述用の下線行（全角スペースで幅を確保）
  const line = body.appendParagraph('　');
  line.editAsText().setFontSize(11);
  line.setSpacingBefore(6);
  line.setSpacingAfter(6);
  // 下線スタイル
  const style = {};
  style[DocumentApp.Attribute.UNDERLINE] = true;
  // 下線付きスペースで記入欄を表現
  const underlinePara = body.appendParagraph(
    '　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　'
  );
  underlinePara.editAsText().setFontSize(11).setUnderline(true);
  underlinePara.setSpacingBefore(2);
  underlinePara.setSpacingAfter(8);
  // 余分なparagraphを削除
  line.removeFromParent();
}

function appendDivider(body) {
  const p = body.appendParagraph('─────────────────────────────────────────────────────────');
  p.editAsText().setFontSize(8).setForegroundColor('#999999');
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  p.setSpacingBefore(6);
  p.setSpacingAfter(6);
}
