/**
 * iTeen 武庫之荘校 - ブログ記事管理 Google Apps Script
 *
 * このファイルをGoogle Apps Scriptの【別プロジェクト】に貼り付けてデプロイしてください。
 * 予約フォーム用GAS（google-apps-script-code.js）とは完全に独立しています。
 *
 * デプロイ設定:
 *   - 実行ユーザー: 自分
 *   - アクセスできるユーザー: 全員（匿名を含む）
 *
 * デプロイ後にURLを config.js の BLOG_GOOGLE_APPS_SCRIPT_URL に設定してください。
 */

// ============================================================
// CORSヘルパー
// ============================================================

function setCorsHeaders(output) {
  if (!output) output = ContentService.createTextOutput('');
  return output.setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// GET エントリーポイント
// ============================================================

function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === 'getArticles') {
      const articles = getArticlesFromSheets();
      return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
        success: true,
        articles: articles
      })));

    } else if (action === 'getArticle') {
      const id = e.parameter.id;
      if (!id) {
        return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'idパラメータが必要です'
        })));
      }
      const article = getArticleById(id);
      if (!article) {
        return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: '記事が見つかりません'
        })));
      }
      return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
        success: true,
        article: article
      })));

    } else {
      return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'iTeen ブログ記事API が動作しています。',
        actions: {
          getArticles: '?action=getArticles でブログ記事一覧を取得',
          getArticle:  '?action=getArticle&id=xxx で記事詳細を取得'
        }
      })));
    }
  } catch (error) {
    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })));
  }
}

// ============================================================
// POST エントリーポイント
// ============================================================

function doPost(e) {
  Logger.log('=== doPost ===');
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('リクエストデータが正しくありません');
    }

    const data = JSON.parse(e.postData.contents);
    Logger.log('受信: ' + JSON.stringify(data));

    if (data.type === 'publish_article') {
      return handleArticlePublish(data.data);
    } else if (data.type === 'save_article') {
      return handleArticleSave(data.data);
    } else {
      throw new Error('不明なリクエストタイプ: ' + data.type);
    }

  } catch (error) {
    Logger.log('❌ doPostエラー: ' + error.toString());
    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })));
  }
}

// ============================================================
// 記事投稿（公開フラグあり）
// ============================================================

function handleArticlePublish(articleData) {
  try {
    if (!articleData.title || !articleData.date || !articleData.category || !articleData.html) {
      throw new Error('記事データが不完全です（タイトル・日付・カテゴリ・本文が必要）');
    }

    // Google Sheets に保存
    const articleId = saveArticleToSheets(articleData);
    Logger.log('✅ 記事をSheetsに保存: ' + articleId);

    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: '記事を投稿しました',
      id: articleId
    })));

  } catch (error) {
    Logger.log('❌ 記事投稿エラー: ' + error.toString());
    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })));
  }
}

// ============================================================
// 記事下書き保存
// ============================================================

function handleArticleSave(articleData) {
  try {
    if (!articleData.title || !articleData.date || !articleData.category || !articleData.html) {
      throw new Error('記事データが不完全です（タイトル・日付・カテゴリ・本文が必要）');
    }

    const articleId = saveArticleToSheets(articleData);
    Logger.log('✅ 記事を保存: ' + articleId);

    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: '記事を保存しました',
      id: articleId
    })));

  } catch (error) {
    Logger.log('❌ 記事保存エラー: ' + error.toString());
    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })));
  }
}

// ============================================================
// Google Sheets 操作
// ============================================================

function getOrCreateSpreadsheet() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheetId = properties.getProperty('BLOG_SPREADSHEET_ID');

  let spreadsheet;
  if (!spreadsheetId) {
    // 初回: スプレッドシートを自動作成
    spreadsheet = SpreadsheetApp.create('iTeen 武庫之荘校 - ブログ記事管理');
    spreadsheetId = spreadsheet.getId();
    properties.setProperty('BLOG_SPREADSHEET_ID', spreadsheetId);
    Logger.log('✅ ブログ用スプレッドシートを新規作成: ' + spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  }
  return spreadsheet;
}

function getBlogSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName('BlogArticles');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('BlogArticles');
    sheet.appendRow(['id', 'timestamp', 'title', 'date', 'category', 'html', 'filename', 'excerpt']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#E0E0E0');
  }
  return sheet;
}

function saveArticleToSheets(articleData) {
  const spreadsheet = getOrCreateSpreadsheet();
  const sheet = getBlogSheet(spreadsheet);

  const id = 'art_' + Date.now();
  const timestamp = new Date().toISOString();
  const excerpt = (articleData.html || '').replace(/<[^>]+>/g, '').substring(0, 200);

  sheet.appendRow([
    id,
    timestamp,
    articleData.title    || '',
    articleData.date     || '',
    articleData.category || '',
    articleData.html     || '',
    articleData.filename || '',
    excerpt
  ]);

  Logger.log('✅ BlogArticlesシートに保存: ' + id);
  return id;
}

function getArticlesFromSheets() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const spreadsheetId = properties.getProperty('BLOG_SPREADSHEET_ID');
    if (!spreadsheetId) return [];

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName('BlogArticles');
    if (!sheet) return [];

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    // lastRow - 1 = データ行数（ヘッダー行を除く）
    const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
    const articles = data
      .map(function(row) {
        return {
          id:        row[0],
          timestamp: row[1],
          title:     row[2],
          date:      row[3],
          category:  row[4],
          html:      row[5],
          filename:  row[6],
          excerpt:   row[7]
        };
      })
      .filter(function(a) { return a.id && a.title; }); // 空行を除外

    // 日付の新しい順
    articles.sort(function(a, b) {
      return new Date((b.date || '').replace(/\./g, '-')) -
             new Date((a.date || '').replace(/\./g, '-'));
    });

    return articles;
  } catch (error) {
    Logger.log('❌ getArticlesFromSheetsエラー: ' + error.toString());
    return [];
  }
}

function getArticleById(id) {
  const articles = getArticlesFromSheets();
  return articles.find(function(a) { return a.id === id; }) || null;
}
