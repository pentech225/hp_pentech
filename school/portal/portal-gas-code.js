/**
 * 教室ポータル - 個人アカウント & ITパスポートコース進捗管理 Google Apps Script
 *
 * このファイルをGoogle Apps Scriptの【別プロジェクト】に貼り付けてデプロイしてください。
 * ブログ用GAS（blog-gas-code.js）や予約フォーム用GASとは完全に独立しています。
 *
 * デプロイ設定:
 *   - 実行ユーザー: 自分
 *   - アクセスできるユーザー: 全員（匿名を含む）
 *
 * デプロイ後にURLを config.js の PORTAL_GOOGLE_APPS_SCRIPT_URL に設定してください。
 * スプレッドシートは初回アクセス時に自動作成されるので、手動で作る必要はありません。
 */

// ============================================================
// CORSヘルパー
// ============================================================

function setCorsHeaders(output) {
  if (!output) output = ContentService.createTextOutput('');
  return output.setMimeType(ContentService.MimeType.JSON);
}

function jsonOutput(obj) {
  return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(obj)));
}

// ============================================================
// GET エントリーポイント（読み取り専用）
// ============================================================

function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === 'getProgress') {
      const studentId = e.parameter.studentId;
      if (!studentId) return jsonOutput({ success: false, error: 'studentIdパラメータが必要です' });
      return jsonOutput({ success: true, progress: getProgressForStudent(studentId) });

    } else if (action === 'getAssignments') {
      const studentId = e.parameter.studentId;
      const assignments = getAssignments(studentId);
      return jsonOutput({ success: true, assignments: assignments });

    } else if (action === 'getAllStudentProgress') {
      return jsonOutput({
        success: true,
        students: getAllStudents(),
        progress: getAllProgress()
      });

    } else if (action === 'getQuizAnswers') {
      const studentId = e.parameter.studentId;
      return jsonOutput({ success: true, answers: getQuizAnswers(studentId) });

    } else if (action === 'listDownloads') {
      const studentId = e.parameter.studentId || '';
      const displayName = e.parameter.displayName || '';
      return jsonOutput(listMyDownloads(studentId, displayName));

    } else if (action === 'listSharedDownloads') {
      const target = e.parameter.target || '';
      return jsonOutput(listSharedDownloads(target));

    } else {
      return jsonOutput({
        success: true,
        message: '教室ポータル 個人アカウント&進捗管理API が動作しています。',
        actions: {
          getProgress: '?action=getProgress&studentId=xxx で生徒の進捗を取得',
          getAssignments: '?action=getAssignments&studentId=xxx で宿題一覧を取得（studentId省略で全件）',
          getAllStudentProgress: '?action=getAllStudentProgress で全生徒の進捗をまとめて取得（先生用）',
          getQuizAnswers: '?action=getQuizAnswers&studentId=xxx で確認問題の解答記録を取得（studentId省略で全件）',
          listDownloads: '?action=listDownloads&studentId=xxx&displayName=xxx で自分のフォルダの中身一覧を取得',
          listSharedDownloads: '?action=listSharedDownloads&target=xxx で全員共通のダウンロード用フォルダの中身一覧を取得',
          uploadWork: 'POST type=uploadWork で生徒の作品ファイルをGoogleDriveに保存（POST専用）'
        }
      });
    }
  } catch (error) {
    return jsonOutput({ success: false, error: error.toString() });
  }
}

// ============================================================
// POST エントリーポイント（登録・ログイン・書き込み系）
// ============================================================

function doPost(e) {
  Logger.log('=== doPost ===');
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('リクエストデータが正しくありません');
    }

    const data = JSON.parse(e.postData.contents);
    Logger.log('受信: ' + JSON.stringify(data));

    if (data.type === 'register') {
      return handleRegister(data.data);
    } else if (data.type === 'login') {
      return handleLogin(data.data);
    } else if (data.type === 'saveProgress') {
      return handleSaveProgress(data.data);
    } else if (data.type === 'saveAssignment') {
      return handleSaveAssignment(data.data);
    } else if (data.type === 'deleteAssignment') {
      return handleDeleteAssignment(data.data);
    } else if (data.type === 'saveQuizAnswer') {
      return handleSaveQuizAnswer(data.data);
    } else if (data.type === 'uploadWork') {
      return handleUploadWork(data.data);
    } else {
      throw new Error('不明なリクエストタイプ: ' + data.type);
    }

  } catch (error) {
    Logger.log('❌ doPostエラー: ' + error.toString());
    return jsonOutput({ success: false, error: error.toString() });
  }
}

// ============================================================
// アカウント登録・ログイン
// ============================================================

function handleRegister(payload) {
  const studentId = (payload && payload.studentId || '').trim();
  const password = (payload && payload.password || '').trim();
  const displayName = (payload && payload.displayName || '').trim() || studentId;

  if (!studentId || !password) {
    return jsonOutput({ success: false, error: 'IDとパスワードを入力してください' });
  }

  const spreadsheet = getOrCreateSpreadsheet();
  const sheet = getStudentsSheet(spreadsheet);

  const existing = findStudentRow(sheet, studentId);
  if (existing !== -1) {
    return jsonOutput({ success: false, error: 'そのIDはすでに使われています。別のIDを選んでください。' });
  }

  sheet.appendRow([studentId, password, displayName, new Date().toISOString()]);
  Logger.log('✅ 生徒を新規登録: ' + studentId);

  return jsonOutput({ success: true, student: { studentId: studentId, displayName: displayName } });
}

function handleLogin(payload) {
  const studentId = (payload && payload.studentId || '').trim();
  const password = (payload && payload.password || '').trim();

  if (!studentId || !password) {
    return jsonOutput({ success: false, error: 'IDとパスワードを入力してください' });
  }

  const spreadsheet = getOrCreateSpreadsheet();
  const sheet = getStudentsSheet(spreadsheet);

  const rowIndex = findStudentRow(sheet, studentId);
  if (rowIndex === -1) {
    return jsonOutput({ success: false, error: 'IDまたはパスワードが正しくありません' });
  }

  const row = sheet.getRange(rowIndex, 1, 1, STUDENTS_COLS).getValues()[0];
  const storedPassword = row[1];
  const displayName = row[2] || studentId;

  if (String(storedPassword) !== password) {
    return jsonOutput({ success: false, error: 'IDまたはパスワードが正しくありません' });
  }

  return jsonOutput({ success: true, student: { studentId: row[0], displayName: displayName } });
}

// ============================================================
// 進捗保存
// ============================================================

// 90%以上見たら「1回見た」とカウントする
var WATCH_COMPLETE_RATIO = 0.9;

function handleSaveProgress(payload) {
  const studentId = (payload && payload.studentId || '').trim();
  const videoId = (payload && payload.videoId || '').trim();
  const currentTimeSeconds = Number(payload && payload.currentTimeSeconds) || 0;
  const durationSeconds = Number(payload && payload.durationSeconds) || 0;

  if (!studentId || !videoId) {
    return jsonOutput({ success: false, error: 'studentIdとvideoIdが必要です' });
  }

  const spreadsheet = getOrCreateSpreadsheet();
  const sheet = getProgressSheet(spreadsheet);

  const rowIndex = findProgressRow(sheet, studentId, videoId);
  const now = new Date().toISOString();
  const threshold = durationSeconds > 0 ? durationSeconds * WATCH_COMPLETE_RATIO : Infinity;

  let newMax, newDuration, watchCount;

  if (rowIndex === -1) {
    watchCount = currentTimeSeconds >= threshold ? 1 : 0;
    newMax = currentTimeSeconds;
    newDuration = durationSeconds;
    sheet.appendRow([studentId, videoId, newMax, newDuration, watchCount, now]);
  } else {
    const row = sheet.getRange(rowIndex, 1, 1, PROGRESS_COLS).getValues()[0];
    const prevMax = Number(row[2]) || 0;
    const prevDuration = Number(row[3]) || durationSeconds;
    watchCount = Number(row[4]) || 0;
    const prevThreshold = prevDuration > 0 ? prevDuration * WATCH_COMPLETE_RATIO : Infinity;

    // 前回は閾値未満で、今回初めて閾値を超えた場合のみカウントアップ（重複カウント防止）
    if (prevMax < prevThreshold && currentTimeSeconds >= threshold) {
      watchCount += 1;
    }

    newMax = Math.max(prevMax, currentTimeSeconds);
    newDuration = durationSeconds || prevDuration;
    sheet.getRange(rowIndex, 1, 1, PROGRESS_COLS).setValues([[
      studentId, videoId, newMax, newDuration, watchCount, now
    ]]);
  }

  return jsonOutput({
    success: true,
    progress: {
      studentId: studentId,
      videoId: videoId,
      maxWatchedSeconds: newMax,
      durationSeconds: newDuration,
      watchCount: watchCount,
      lastWatchedAt: now
    }
  });
}

// ============================================================
// 宿題（割り当て）
// ============================================================

function handleSaveAssignment(payload) {
  const videoId = (payload && payload.videoId || '').trim();
  const cutoffSeconds = Number(payload && payload.cutoffSeconds) || 0;
  const targetStudentId = (payload && payload.targetStudentId || 'ALL').trim() || 'ALL';
  const note = (payload && payload.note || '').trim();
  const dueDate = (payload && payload.dueDate || '').trim();

  if (!videoId) {
    return jsonOutput({ success: false, error: 'videoIdが必要です' });
  }

  const spreadsheet = getOrCreateSpreadsheet();
  const sheet = getAssignmentsSheet(spreadsheet);

  const assignmentId = 'hw_' + Date.now();
  sheet.appendRow([assignmentId, videoId, cutoffSeconds, targetStudentId, note, new Date().toISOString(), dueDate]);

  return jsonOutput({ success: true, assignmentId: assignmentId });
}

function handleDeleteAssignment(payload) {
  const assignmentId = (payload && payload.assignmentId || '').trim();
  if (!assignmentId) {
    return jsonOutput({ success: false, error: 'assignmentIdが必要です' });
  }

  const spreadsheet = getOrCreateSpreadsheet();
  const sheet = getAssignmentsSheet(spreadsheet);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonOutput({ success: false, error: '宿題が見つかりません' });

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const idx = ids.findIndex(function (r) { return r[0] === assignmentId; });
  if (idx === -1) return jsonOutput({ success: false, error: '宿題が見つかりません' });

  sheet.deleteRow(idx + 2);
  return jsonOutput({ success: true });
}

function getAssignments(studentId) {
  const spreadsheet = getOrCreateSpreadsheet();
  const sheet = getAssignmentsSheet(spreadsheet);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, ASSIGNMENTS_COLS).getValues();
  let assignments = data
    .map(function (row) {
      return {
        assignmentId: row[0],
        videoId: row[1],
        cutoffSeconds: row[2],
        targetStudentId: row[3],
        note: row[4],
        assignedAt: row[5],
        dueDate: row[6]
      };
    })
    .filter(function (a) { return a.assignmentId; });

  if (studentId) {
    assignments = assignments.filter(function (a) {
      return a.targetStudentId === 'ALL' || String(a.targetStudentId).toLowerCase() === String(studentId).toLowerCase();
    });
  }

  return assignments;
}

// ============================================================
// 確認問題（4択クイズ）の解答記録
// ============================================================

function handleSaveQuizAnswer(payload) {
  const studentId = (payload && payload.studentId || '').trim();
  const quizId = (payload && payload.quizId || '').trim();
  const chosenKey = (payload && payload.chosenKey || '').trim();
  const correct = !!(payload && payload.correct);

  if (!studentId || !quizId || !chosenKey) {
    return jsonOutput({ success: false, error: 'studentId, quizId, chosenKeyが必要です' });
  }

  const spreadsheet = getOrCreateSpreadsheet();
  const sheet = getQuizAnswersSheet(spreadsheet);
  const now = new Date().toISOString();

  // 解答するたびに1行追加する（履歴として残す。同じ問題を何度解いても上書きしない）
  sheet.appendRow([studentId, quizId, chosenKey, correct, now]);

  return jsonOutput({
    success: true,
    answer: { studentId: studentId, quizId: quizId, chosenKey: chosenKey, correct: correct, answeredAt: now }
  });
}

function getQuizAnswers(studentId) {
  const spreadsheet = getOrCreateSpreadsheet();
  const sheet = getQuizAnswersSheet(spreadsheet);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, QUIZ_ANSWERS_COLS).getValues();
  let answers = data
    .map(function (row) {
      return {
        studentId: row[0],
        quizId: row[1],
        chosenKey: row[2],
        correct: row[3] === true || row[3] === 'TRUE',
        answeredAt: row[4]
      };
    })
    .filter(function (a) { return a.studentId; });

  if (studentId) {
    answers = answers.filter(function (a) {
      return String(a.studentId).toLowerCase() === String(studentId).toLowerCase();
    });
  }

  return answers;
}

// ============================================================
// ダウンロード一覧の取得（ログイン中の生徒自身のフォルダの中身）
// ============================================================

function listFolderFiles(folder) {
  const files = [];
  const it = folder.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    files.push({
      id: f.getId(),
      name: f.getName(),
      size: f.getSize(),
      mimeType: f.getMimeType(),
      updatedAt: f.getLastUpdated().toISOString()
    });
  }
  return files;
}

// 「教室ポータル 生徒提出物」内の、自分のID（表示名）フォルダの中身を返す。
// 提出物のアップロード先と同じフォルダなので、先生がここに個別のファイルを置けば
// その生徒だけがダウンロードできる、という使い方もできる。
function listMyDownloads(studentId, displayName) {
  if (!studentId) {
    return { success: false, error: 'studentIdが必要です' };
  }

  try {
    const rootFolder = getOrCreateSubmissionsRootFolder();
    const studentFolder = getOrCreateStudentFolder(rootFolder, studentId, displayName || studentId);

    const files = listFolderFiles(studentFolder);
    files.sort(function (a, b) { return b.updatedAt.localeCompare(a.updatedAt); });
    return { success: true, files: files };
  } catch (error) {
    Logger.log('❌ listMyDownloadsエラー: ' + error.toString());
    return { success: false, error: '一覧の取得に失敗しました: ' + error.toString() };
  }
}

// ============================================================
// ダウンロード一覧の取得（全員共通のダウンロード用フォルダの中身）
// ============================================================

// ページ側から指定できる target と、対応するGoogleDriveフォルダIDの対応表。
// 任意のフォルダIDを外部から直接指定させないよう、ここに登録したものだけ許可する。
// VRoid Studioインストーラーなど、全員に同じファイルを配りたいときはここに追加する。
var SHARED_DOWNLOAD_FOLDERS = {
  vroid: '1JyRzVO37Vgxa_UJfRk1Wjv_WshX-XaVt'
};

function listSharedDownloads(target) {
  const folderId = SHARED_DOWNLOAD_FOLDERS[target];
  if (!folderId) {
    return { success: false, error: '不明なダウンロード先です' };
  }

  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = listFolderFiles(folder);
    files.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return { success: true, files: files };
  } catch (error) {
    Logger.log('❌ listSharedDownloadsエラー: ' + error.toString());
    return { success: false, error: '一覧の取得に失敗しました: ' + error.toString() };
  }
}

// ============================================================
// 作品ファイルの提出（GoogleDriveへアップロード）
// ============================================================

// GAS単一リクエストの上限を考慮したサイズ制限（base64換算で約15MB＝元ファイル約10MB）
var MAX_UPLOAD_BASE64_LENGTH = 15 * 1024 * 1024;

function handleUploadWork(payload) {
  const studentId = (payload && payload.studentId || '').trim();
  const displayName = (payload && payload.displayName || '').trim() || studentId;
  const fileName = (payload && payload.fileName || '').trim();
  const mimeType = (payload && payload.mimeType || 'application/octet-stream').trim();
  const base64 = payload && payload.base64;
  const title = (payload && payload.title || '').trim();

  if (!studentId || !fileName || !base64) {
    return jsonOutput({ success: false, error: 'studentId, fileName, ファイルデータが必要です' });
  }
  if (String(base64).length > MAX_UPLOAD_BASE64_LENGTH) {
    return jsonOutput({ success: false, error: 'ファイルサイズが大きすぎます（10MBまで）' });
  }

  try {
    const rootFolder = getOrCreateSubmissionsRootFolder();
    const studentFolder = getOrCreateStudentFolder(rootFolder, studentId, displayName);
    const uniqueFileName = getUniqueFileName(studentFolder, fileName);

    const bytes = Utilities.base64Decode(base64);
    const blob = Utilities.newBlob(bytes, mimeType, uniqueFileName);
    const file = studentFolder.createFile(blob);

    const spreadsheet = getOrCreateSpreadsheet();
    const sheet = getSubmissionsSheet(spreadsheet);
    const now = new Date().toISOString();
    sheet.appendRow([studentId, displayName, title, uniqueFileName, file.getUrl(), now]);

    Logger.log('✅ 作品ファイルを保存: ' + studentId + ' / ' + uniqueFileName);

    return jsonOutput({ success: true, url: file.getUrl(), fileName: uniqueFileName });
  } catch (error) {
    Logger.log('❌ アップロードエラー: ' + error.toString());
    return jsonOutput({ success: false, error: 'アップロードに失敗しました: ' + error.toString() });
  }
}

// 同じフォルダ内に同名ファイルがある場合、上書きせず "_v1", "_v2"... を付けて重複を避ける
function getUniqueFileName(folder, fileName) {
  if (!folder.getFilesByName(fileName).hasNext()) return fileName;

  const dotIndex = fileName.lastIndexOf('.');
  const base = dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
  const ext = dotIndex > 0 ? fileName.substring(dotIndex) : '';

  let candidate;
  let n = 1;
  do {
    candidate = base + '_v' + n + ext;
    n++;
  } while (folder.getFilesByName(candidate).hasNext());

  return candidate;
}

function getOrCreateSubmissionsRootFolder() {
  const properties = PropertiesService.getScriptProperties();
  const folderId = properties.getProperty('SUBMISSIONS_FOLDER_ID');

  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (e) {
      // 手動で削除された場合などは作り直す
    }
  }

  const folder = DriveApp.createFolder('教室ポータル 生徒提出物');
  properties.setProperty('SUBMISSIONS_FOLDER_ID', folder.getId());
  Logger.log('✅ 提出物用フォルダを新規作成: ' + folder.getId());
  return folder;
}

function getOrCreateStudentFolder(rootFolder, studentId, displayName) {
  const folderName = studentId + '（' + displayName + '）';
  const existing = rootFolder.getFoldersByName(folderName);
  if (existing.hasNext()) return existing.next();
  return rootFolder.createFolder(folderName);
}

// カラム定義: A=studentId, B=displayName, C=title, D=fileName, E=url, F=uploadedAt
var SUBMISSIONS_COLS = 6;

function getSubmissionsSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName('Submissions');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Submissions');
    sheet.appendRow(['studentId', 'displayName', 'title', 'fileName', 'url', 'uploadedAt']);
    sheet.getRange(1, 1, 1, SUBMISSIONS_COLS).setFontWeight('bold').setBackground('#E0E0E0');
  }
  return sheet;
}

// ============================================================
// 進捗の取得（生徒用・先生用）
// ============================================================

function getProgressForStudent(studentId) {
  const spreadsheet = getOrCreateSpreadsheet();
  const sheet = getProgressSheet(spreadsheet);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, PROGRESS_COLS).getValues();
  return data
    .filter(function (row) { return String(row[0]).toLowerCase() === String(studentId).toLowerCase(); })
    .map(function (row) {
      return {
        studentId: row[0],
        videoId: row[1],
        maxWatchedSeconds: row[2],
        durationSeconds: row[3],
        watchCount: row[4],
        lastWatchedAt: row[5]
      };
    });
}

function getAllProgress() {
  const spreadsheet = getOrCreateSpreadsheet();
  const sheet = getProgressSheet(spreadsheet);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, PROGRESS_COLS).getValues();
  return data.map(function (row) {
    return {
      studentId: row[0],
      videoId: row[1],
      maxWatchedSeconds: row[2],
      durationSeconds: row[3],
      watchCount: row[4],
      lastWatchedAt: row[5]
    };
  });
}

function getAllStudents() {
  const spreadsheet = getOrCreateSpreadsheet();
  const sheet = getStudentsSheet(spreadsheet);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, STUDENTS_COLS).getValues();
  return data
    .filter(function (row) { return row[0]; })
    .map(function (row) {
      return { studentId: row[0], displayName: row[2] || row[0], createdAt: row[3] };
    });
}

// ============================================================
// Google Sheets 操作（自動作成・共通ヘルパー）
// ============================================================

function getOrCreateSpreadsheet() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheetId = properties.getProperty('PORTAL_SPREADSHEET_ID');

  let spreadsheet;
  if (!spreadsheetId) {
    // 初回: スプレッドシートを自動作成
    spreadsheet = SpreadsheetApp.create('教室ポータル - 生徒アカウント&進捗管理');
    spreadsheetId = spreadsheet.getId();
    properties.setProperty('PORTAL_SPREADSHEET_ID', spreadsheetId);
    Logger.log('✅ ポータル用スプレッドシートを新規作成: ' + spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  }
  return spreadsheet;
}

// カラム定義: A=studentId, B=password, C=displayName, D=createdAt
var STUDENTS_COLS = 4;

function getStudentsSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName('Students');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Students');
    sheet.appendRow(['studentId', 'password', 'displayName', 'createdAt']);
    sheet.getRange(1, 1, 1, STUDENTS_COLS).setFontWeight('bold').setBackground('#E0E0E0');
  }
  return sheet;
}

function findStudentRow(sheet, studentId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const idx = ids.findIndex(function (r) { return String(r[0]).toLowerCase() === String(studentId).toLowerCase(); });
  return idx === -1 ? -1 : idx + 2; // 0-indexed + ヘッダー行分
}

// カラム定義: A=studentId, B=videoId, C=maxWatchedSeconds, D=durationSeconds, E=watchCount, F=lastWatchedAt
var PROGRESS_COLS = 6;

function getProgressSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName('Progress');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Progress');
    sheet.appendRow(['studentId', 'videoId', 'maxWatchedSeconds', 'durationSeconds', 'watchCount', 'lastWatchedAt']);
    sheet.getRange(1, 1, 1, PROGRESS_COLS).setFontWeight('bold').setBackground('#E0E0E0');
  }
  return sheet;
}

function findProgressRow(sheet, studentId, videoId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  const idx = rows.findIndex(function (r) {
    return String(r[0]).toLowerCase() === String(studentId).toLowerCase() && r[1] === videoId;
  });
  return idx === -1 ? -1 : idx + 2;
}

// カラム定義: A=assignmentId, B=videoId, C=cutoffSeconds, D=targetStudentId, E=note, F=assignedAt, G=dueDate
var ASSIGNMENTS_COLS = 7;

function getAssignmentsSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName('Assignments');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Assignments');
    sheet.appendRow(['assignmentId', 'videoId', 'cutoffSeconds', 'targetStudentId', 'note', 'assignedAt', 'dueDate']);
    sheet.getRange(1, 1, 1, ASSIGNMENTS_COLS).setFontWeight('bold').setBackground('#E0E0E0');
  }
  return sheet;
}

// カラム定義: A=studentId, B=quizId, C=chosenKey, D=correct, E=answeredAt
var QUIZ_ANSWERS_COLS = 5;

function getQuizAnswersSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName('QuizAnswers');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('QuizAnswers');
    sheet.appendRow(['studentId', 'quizId', 'chosenKey', 'correct', 'answeredAt']);
    sheet.getRange(1, 1, 1, QUIZ_ANSWERS_COLS).setFontWeight('bold').setBackground('#E0E0E0');
  }
  return sheet;
}
