/**
 * スキル街道 - Google Apps Script（生徒進捗管理）
 *
 * このファイルをGoogle Apps Scriptの【新規・別プロジェクト】に貼り付けてデプロイしてください。
 * 予約フォーム用GAS（google-apps-script-code.js）・ブログ管理用GAS（blog-gas-code.js）とは
 * 完全に独立したプロジェクトとして新設します（生徒PIN・進捗という性質の異なるデータを
 * 無関係な既存フォーム処理と混在させないため）。
 *
 * デプロイ設定:
 *   - 実行ユーザー: 自分
 *   - アクセスできるユーザー: 全員（匿名を含む）
 *
 * 事前準備（重要・デプロイ手順書 SKILL_TRAIL_DEPLOY.md も参照）:
 *   - スクリプトプロパティに `SKILL_TRAIL_STAFF_PASSWORD` を設定すること
 *     （設定するまで講師モードの承認・差し戻しは常に失敗する＝フェイルクローズ）
 *
 * セキュリティ上の注意（絶対に変更しないこと）:
 *   - PIN・講師パスワードはレスポンスに一切含めない
 *   - PIN・講師パスワードは Logger.log / console.log に平文で出力しない
 *   - 生徒の書き込み系（request_review）は毎回 PIN を再検証する
 *   - 講師の書き込み系（approve_node / reject_node / staff_progress_all）は
 *     毎回 Script Properties の SKILL_TRAIL_STAFF_PASSWORD と再検証する
 */

// ============================================================
// 定数
// ============================================================

var SHEET_STUDENTS = "Students";
var SHEET_PROGRESS = "Progress";

// スクラッチ街道 16ノードの並び順（固定）。titleやiconはフロントエンド側の定数として保持し、
// GAS側はID順序と「次のノード解放」処理にのみ使用する。
var NODE_ORDER = [
  "e1", "e2", "e3", "e4", "e-clear",
  "b1", "b2", "b3", "b-clear",
  "si1", "si2", "si-clear",
  "g1", "g2", "g3", "g-clear"
];
var REGION_ID = "scratch";

var STUDENTS_HEADER = ["student_id", "school_id", "display_name", "pin", "active", "created_at"];
var PROGRESS_HEADER = ["student_id", "school_id", "region_id", "node_id", "status", "approved_by", "approved_at", "updated_at"];

// Students列インデックス（1始まり）
var SCOL = { student_id: 1, school_id: 2, display_name: 3, pin: 4, active: 5, created_at: 6 };
// Progress列インデックス（1始まり）
var PCOL = { student_id: 1, school_id: 2, region_id: 3, node_id: 4, status: 5, approved_by: 6, approved_at: 7, updated_at: 8 };

// ============================================================
// CORS / エントリーポイント
// ============================================================

function setCorsHeaders(output) {
  if (!output) output = ContentService.createTextOutput("");
  try {
    return output.setMimeType(ContentService.MimeType.JSON).setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
  } catch (e) {
    return output.setMimeType(ContentService.MimeType.JSON);
  }
}

function doOptions() {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "3600"
    });
}

function jsonOutput(obj) {
  return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(obj)));
}

// doGet: 生徒一覧取得のみ（PIN不要・公開情報のみ）
function doGet(e) {
  try {
    var action = e && e.parameter ? e.parameter.action : null;
    if (action === "students") {
      var schoolId = e.parameter.school_id;
      if (!schoolId) return jsonOutput({ success: false, error: "INVALID_PARAMS" });
      var students = getActiveStudents(schoolId).map(function (s) {
        return { student_id: s.student_id, display_name: s.display_name };
      });
      return jsonOutput({ success: true, students: students });
    }
    return jsonOutput({ success: true, message: "スキル街道 API は正常に動作しています。" });
  } catch (err) {
    Logger.log("doGet error: " + err.toString());
    return jsonOutput({ success: false, error: "SERVER_ERROR" });
  }
}

// doPost: ログイン・進捗更新（本文JSON、typeで分岐）
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("リクエストデータが正しくありません");
    }
    var data = JSON.parse(e.postData.contents);
    // 注意: dataにはPIN/講師パスワードが含まれ得るため、dataそのものをログ出力しないこと
    Logger.log("doPost type=" + data.type);

    switch (data.type) {
      case "login": return handleLogin(data);
      case "request_review": return handleRequestReview(data);
      case "staff_login": return handleStaffLogin(data);
      case "staff_progress_all": return handleStaffProgressAll(data);
      case "approve_node": return handleApproveNode(data);
      case "reject_node": return handleRejectNode(data);
      default: return jsonOutput({ success: false, error: "UNKNOWN_TYPE" });
    }
  } catch (err) {
    Logger.log("doPost error: " + err.toString());
    return jsonOutput({ success: false, error: "SERVER_ERROR" });
  }
}

// ============================================================
// ハンドラ
// ============================================================

function handleLogin(data) {
  var schoolId = data.school_id, studentId = data.student_id, pin = data.pin;
  if (!schoolId || !studentId || !pin) return jsonOutput({ success: false, error: "INVALID_PARAMS" });

  var student = findActiveStudent(schoolId, studentId);
  if (!student) return jsonOutput({ success: false, error: "STUDENT_NOT_FOUND" });
  if (String(student.pin) !== String(pin)) return jsonOutput({ success: false, error: "PIN_MISMATCH" });

  var progress = getOrInitProgress(schoolId, studentId);
  return jsonOutput({ success: true, display_name: student.display_name, progress: progress.map(toClientProgress) });
}

function handleRequestReview(data) {
  var schoolId = data.school_id, studentId = data.student_id, pin = data.pin, regionId = data.region_id, nodeId = data.node_id;
  if (!schoolId || !studentId || !pin || !regionId || !nodeId) return jsonOutput({ success: false, error: "INVALID_PARAMS" });
  if (regionId !== REGION_ID || NODE_ORDER.indexOf(nodeId) === -1) return jsonOutput({ success: false, error: "INVALID_PARAMS" });

  var student = findActiveStudent(schoolId, studentId);
  if (!student) return jsonOutput({ success: false, error: "STUDENT_NOT_FOUND" });
  if (String(student.pin) !== String(pin)) return jsonOutput({ success: false, error: "PIN_MISMATCH" });

  var sheet = getProgressSheet();
  var rowInfo = findProgressRow(sheet, schoolId, studentId, regionId, nodeId);
  if (!rowInfo || rowInfo.status !== "current") {
    return jsonOutput({ success: false, error: "INVALID_STATE" });
  }
  updateProgressStatus(sheet, rowInfo.row, "pending", {});

  var progress = getStudentProgressRows(schoolId, studentId);
  return jsonOutput({ success: true, progress: progress.map(toClientProgress) });
}

function handleStaffLogin(data) {
  if (!verifyStaffPassword(data.staff_password)) return jsonOutput({ success: false, error: "STAFF_PASSWORD_MISMATCH" });
  return jsonOutput({ success: true });
}

function handleStaffProgressAll(data) {
  if (!verifyStaffPassword(data.staff_password)) return jsonOutput({ success: false, error: "STAFF_PASSWORD_MISMATCH" });
  var schoolId = data.school_id;
  if (!schoolId) return jsonOutput({ success: false, error: "INVALID_PARAMS" });

  var students = getActiveStudents(schoolId);
  var progressSheet = getProgressSheet();
  var allProgress = getAllProgressRows(progressSheet, schoolId);

  var result = students.map(function (s) {
    var rows = allProgress.filter(function (p) { return p.student_id === s.student_id; });
    return {
      student_id: s.student_id,
      display_name: s.display_name,
      progress: rows.map(function (p) {
        return { region_id: p.region_id, node_id: p.node_id, status: p.status, updated_at: p.updated_at };
      })
    };
  });
  return jsonOutput({ success: true, students: result });
}

function handleApproveNode(data) {
  if (!verifyStaffPassword(data.staff_password)) return jsonOutput({ success: false, error: "STAFF_PASSWORD_MISMATCH" });
  var schoolId = data.school_id, studentId = data.student_id, regionId = data.region_id, nodeId = data.node_id;
  var approvedBy = data.approved_by || "";
  if (!schoolId || !studentId || !regionId || !nodeId) return jsonOutput({ success: false, error: "INVALID_PARAMS" });
  if (regionId !== REGION_ID || NODE_ORDER.indexOf(nodeId) === -1) return jsonOutput({ success: false, error: "INVALID_PARAMS" });

  var sheet = getProgressSheet();
  var rowInfo = findProgressRow(sheet, schoolId, studentId, regionId, nodeId);
  if (!rowInfo || (rowInfo.status !== "pending" && rowInfo.status !== "current")) {
    return jsonOutput({ success: false, error: "INVALID_STATE" });
  }

  var now = new Date().toISOString();
  updateProgressStatus(sheet, rowInfo.row, "done", { approved_by: approvedBy, approved_at: now });

  // 次のノードを解放
  var idx = NODE_ORDER.indexOf(nodeId);
  if (idx >= 0 && idx + 1 < NODE_ORDER.length) {
    var nextId = NODE_ORDER[idx + 1];
    var nextRow = findProgressRow(sheet, schoolId, studentId, regionId, nextId);
    if (nextRow && nextRow.status === "locked") {
      updateProgressStatus(sheet, nextRow.row, "current", {});
    }
  }

  var progress = getStudentProgressRows(schoolId, studentId);
  return jsonOutput({ success: true, progress: progress.map(toClientProgress) });
}

function handleRejectNode(data) {
  if (!verifyStaffPassword(data.staff_password)) return jsonOutput({ success: false, error: "STAFF_PASSWORD_MISMATCH" });
  var schoolId = data.school_id, studentId = data.student_id, regionId = data.region_id, nodeId = data.node_id;
  if (!schoolId || !studentId || !regionId || !nodeId) return jsonOutput({ success: false, error: "INVALID_PARAMS" });

  var sheet = getProgressSheet();
  var rowInfo = findProgressRow(sheet, schoolId, studentId, regionId, nodeId);
  if (!rowInfo || rowInfo.status !== "pending") {
    return jsonOutput({ success: false, error: "INVALID_STATE" });
  }
  updateProgressStatus(sheet, rowInfo.row, "current", {});

  // コメントは列を増やさずログにのみ残す（PRD仕様どおり。PIN/講師パスワードではないためログ可）
  if (data.comment) {
    Logger.log("reject comment: student=" + studentId + " node=" + nodeId + " comment=" + data.comment);
  }

  var progress = getStudentProgressRows(schoolId, studentId);
  return jsonOutput({ success: true, progress: progress.map(toClientProgress) });
}

function toClientProgress(p) {
  return { region_id: p.region_id, node_id: p.node_id, status: p.status };
}

// ============================================================
// 認証
// ============================================================

function verifyStaffPassword(pw) {
  if (!pw) return false;
  var stored = PropertiesService.getScriptProperties().getProperty("SKILL_TRAIL_STAFF_PASSWORD");
  if (!stored) return false; // 未設定ならフェイルクローズ（書き込み不可）
  return pw === stored;
}

// ============================================================
// スプレッドシート操作
// ============================================================

function getOrCreateSpreadsheet() {
  var properties = PropertiesService.getScriptProperties();
  var spreadsheetId = properties.getProperty("SKILL_TRAIL_SPREADSHEET_ID");
  var spreadsheet;
  if (!spreadsheetId) {
    spreadsheet = SpreadsheetApp.create("スキル街道 - 生徒進捗管理");
    spreadsheetId = spreadsheet.getId();
    properties.setProperty("SKILL_TRAIL_SPREADSHEET_ID", spreadsheetId);
    Logger.log("新規スプレッドシートを作成: " + spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  }
  return spreadsheet;
}

function getStudentsSheet() {
  var ss = getOrCreateSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_STUDENTS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_STUDENTS);
    sheet.appendRow(STUDENTS_HEADER);
    sheet.getRange(1, 1, 1, STUDENTS_HEADER.length).setFontWeight("bold").setBackground("#E0E0E0");
  }
  return sheet;
}

function getProgressSheet() {
  var ss = getOrCreateSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_PROGRESS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_PROGRESS);
    sheet.appendRow(PROGRESS_HEADER);
    sheet.getRange(1, 1, 1, PROGRESS_HEADER.length).setFontWeight("bold").setBackground("#E0E0E0");
  }
  return sheet;
}

function readAllRows(sheet, colCount) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, colCount).getValues();
}

function isActiveFlag(v) {
  return v === true || String(v).trim().toUpperCase() === "TRUE";
}

// ---- Students ----

function getActiveStudents(schoolId) {
  var sheet = getStudentsSheet();
  var rows = readAllRows(sheet, STUDENTS_HEADER.length);
  return rows
    .filter(function (r) {
      return String(r[SCOL.school_id - 1]) === String(schoolId) && isActiveFlag(r[SCOL.active - 1]);
    })
    .map(function (r) {
      return {
        student_id: String(r[SCOL.student_id - 1]),
        school_id: String(r[SCOL.school_id - 1]),
        display_name: String(r[SCOL.display_name - 1]),
        pin: String(r[SCOL.pin - 1])
      };
    });
}

function findActiveStudent(schoolId, studentId) {
  var list = getActiveStudents(schoolId);
  var found = list.filter(function (s) { return s.student_id === String(studentId); });
  return found.length ? found[0] : null;
}

// ---- Progress ----

function getAllProgressRows(sheet, schoolId) {
  var rows = readAllRows(sheet, PROGRESS_HEADER.length);
  return rows
    .filter(function (r) { return String(r[PCOL.school_id - 1]) === String(schoolId); })
    .map(function (r, i) {
      return {
        row: i + 2, // ヘッダー分オフセットは呼び出し側で別途計算するため参考値
        student_id: String(r[PCOL.student_id - 1]),
        school_id: String(r[PCOL.school_id - 1]),
        region_id: String(r[PCOL.region_id - 1]),
        node_id: String(r[PCOL.node_id - 1]),
        status: String(r[PCOL.status - 1]),
        approved_by: String(r[PCOL.approved_by - 1] || ""),
        approved_at: r[PCOL.approved_at - 1] ? String(r[PCOL.approved_at - 1]) : "",
        updated_at: r[PCOL.updated_at - 1] ? String(r[PCOL.updated_at - 1]) : ""
      };
    });
}

function getStudentProgressRows(schoolId, studentId) {
  var sheet = getProgressSheet();
  var rows = readAllRows(sheet, PROGRESS_HEADER.length);
  var result = [];
  rows.forEach(function (r, i) {
    if (String(r[PCOL.school_id - 1]) === String(schoolId) && String(r[PCOL.student_id - 1]) === String(studentId)) {
      result.push({
        row: i + 2,
        region_id: String(r[PCOL.region_id - 1]),
        node_id: String(r[PCOL.node_id - 1]),
        status: String(r[PCOL.status - 1])
      });
    }
  });
  return result;
}

function findProgressRow(sheet, schoolId, studentId, regionId, nodeId) {
  var rows = readAllRows(sheet, PROGRESS_HEADER.length);
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r[PCOL.school_id - 1]) === String(schoolId) &&
      String(r[PCOL.student_id - 1]) === String(studentId) &&
      String(r[PCOL.region_id - 1]) === String(regionId) &&
      String(r[PCOL.node_id - 1]) === String(nodeId)) {
      return { row: i + 2, status: String(r[PCOL.status - 1]) };
    }
  }
  return null;
}

function updateProgressStatus(sheet, row, status, extra) {
  var now = new Date().toISOString();
  sheet.getRange(row, PCOL.status).setValue(status);
  sheet.getRange(row, PCOL.updated_at).setValue(now);
  if (extra && extra.approved_by !== undefined) sheet.getRange(row, PCOL.approved_by).setValue(extra.approved_by);
  if (extra && extra.approved_at !== undefined) sheet.getRange(row, PCOL.approved_at).setValue(extra.approved_at);
}

// 初回ログイン時、進捗行が存在しなければ16ノード分を自動生成する
// 初期状態: e1=current、それ以外の15ノードはlocked
function getOrInitProgress(schoolId, studentId) {
  var sheet = getProgressSheet();
  var existing = getStudentProgressRows(schoolId, studentId);
  var existingForRegion = existing.filter(function (p) { return p.region_id === REGION_ID; });
  if (existingForRegion.length > 0) return existingForRegion;

  var now = new Date().toISOString();
  var newRows = NODE_ORDER.map(function (nodeId, i) {
    return [studentId, schoolId, REGION_ID, nodeId, i === 0 ? "current" : "locked", "", "", now];
  });
  var startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, newRows.length, PROGRESS_HEADER.length).setValues(newRows);

  return NODE_ORDER.map(function (nodeId, i) {
    return { region_id: REGION_ID, node_id: nodeId, status: i === 0 ? "current" : "locked" };
  });
}
