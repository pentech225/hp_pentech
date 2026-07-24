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

    } else {
      return jsonOutput({
        success: true,
        message: '教室ポータル 個人アカウント&進捗管理API が動作しています。',
        actions: {
          getProgress: '?action=getProgress&studentId=xxx で生徒の進捗を取得',
          getAssignments: '?action=getAssignments&studentId=xxx で宿題一覧を取得（studentId省略で全件）',
          getAllStudentProgress: '?action=getAllStudentProgress で全生徒の進捗をまとめて取得（先生用）'
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
