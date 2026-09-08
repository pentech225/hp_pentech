/**
 * タイピングランド 家庭用ブックマークレット生成（教室ポータル・個人アカウント連携）
 *
 * https://typingland.higopage.com/play/ はUnity WebGL製の外部サイトでソース非保有のため、
 * サーバー側API新設・iframe埋め込み等での自動連携はできない。唯一の介入手段が
 * 「javascript:」で始まるブックマークレットURI（ユーザーがそのページを開いた状態で
 * クリックすることで、そのページのコンテキストでJSを実行する仕組み）。
 *
 * ロジックは pj/tools/typingland_switch/agent.js の exportSave/importSave
 * （IndexedDBの/idbfs読み書き部分）をベースに、API呼び出し先を
 * 教室ポータルのloadTyping/saveTypingアクション（portal-gas-code.js）に差し替えたもの。
 *
 * 注意（PRD確定事項・2026-09-07）:
 * ブックマークレットのURIにはstudentIdとpasswordの両方を埋め込む。
 * このURLが他人に渡ると、その第三者は当該生徒になりすまして進捗を読み書きできてしまう
 * （CEOが利便性とのトレードオフとして明示的に許容した既知のリスク）。
 * そのためportal側の案内UIには「このリンクは他人と共有しないでください」の注意書きを添える。
 *
 * 使用方法: index.html から buildTypingBookmarkletHref(studentId, password, apiUrl) を呼び、
 * 戻り値の文字列をそのまま <a href="..."> に設定する。
 */

function buildTypingBookmarkletHref(studentId, password, apiUrl) {
  const source =
    '(function(){\n' +
    '  var API_URL = ' + JSON.stringify(String(apiUrl)) + ';\n' +
    '  var STUDENT_ID = ' + JSON.stringify(String(studentId)) + ';\n' +
    '  var PASSWORD = ' + JSON.stringify(String(password)) + ';\n' +
    '  var REMINDER_INTERVAL_MS = 5 * 60 * 1000;\n' +
    '\n' +
    '  function openGameDB(name) {\n' +
    '    return new Promise(function (res, rej) {\n' +
    '      var r = indexedDB.open(name);\n' +
    '      r.onsuccess = function () { res(r.result); };\n' +
    '      r.onerror = function () { rej(r.error); };\n' +
    '    });\n' +
    '  }\n' +
    '\n' +
    '  function u8ToB64(u8) {\n' +
    '    var s = "";\n' +
    '    for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);\n' +
    '    return btoa(s);\n' +
    '  }\n' +
    '\n' +
    '  function b64ToU8(b64) {\n' +
    '    var bin = atob(b64);\n' +
    '    var u8 = new Uint8Array(bin.length);\n' +
    '    for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);\n' +
    '    return u8;\n' +
    '  }\n' +
    '\n' +
    '  function cursorAll(store) {\n' +
    '    return new Promise(function (res, rej) {\n' +
    '      var out = [];\n' +
    '      var req = store.openCursor();\n' +
    '      req.onsuccess = function (e) {\n' +
    '        var c = e.target.result;\n' +
    '        if (c) { out.push({ key: c.primaryKey, value: c.value }); c.continue(); }\n' +
    '        else res(out);\n' +
    '      };\n' +
    '      req.onerror = function () { rej(req.error); };\n' +
    '    });\n' +
    '  }\n' +
    '\n' +
    '  async function exportSave() {\n' +
    '    var db = await openGameDB("/idbfs");\n' +
    '    var tx = db.transaction("FILE_DATA", "readonly");\n' +
    '    var pairs = await cursorAll(tx.objectStore("FILE_DATA"));\n' +
    '    var entries = pairs.map(function (p) {\n' +
    '      var relPath = p.key.replace(/^\\/idbfs\\/[^/]+/, "");\n' +
    '      var v = p.value;\n' +
    '      var contents = null;\n' +
    '      if (v.contents) {\n' +
    '        var u8 = v.contents instanceof Uint8Array ? v.contents : new Uint8Array(v.contents);\n' +
    '        contents = u8ToB64(u8);\n' +
    '      }\n' +
    '      return { relPath: relPath, mode: v.mode, contents: contents };\n' +
    '    });\n' +
    '    return { app: "typingland", version: 1, exportedAt: new Date().toISOString(), entries: entries };\n' +
    '  }\n' +
    '\n' +
    '  async function importSave(payload) {\n' +
    '    if (!payload || payload.app !== "typingland" || !Array.isArray(payload.entries)) return false;\n' +
    '    var fileEntries = payload.entries.filter(function (e) { return e.contents; });\n' +
    '    if (fileEntries.length === 0) return false;\n' +
    '\n' +
    '    var db = await openGameDB("/idbfs");\n' +
    '    var tx1 = db.transaction("FILE_DATA", "readonly");\n' +
    '    var pairs = await cursorAll(tx1.objectStore("FILE_DATA"));\n' +
    '    var rootEntry = pairs.find(function (p) { return /^\\/idbfs\\/[^/]+$/.test(p.key); });\n' +
    '    if (!rootEntry) return false;\n' +
    '    var hash = rootEntry.key.split("/")[2];\n' +
    '\n' +
    '    var tx2 = db.transaction("FILE_DATA", "readwrite");\n' +
    '    var store2 = tx2.objectStore("FILE_DATA");\n' +
    '    for (var i = 0; i < fileEntries.length; i++) {\n' +
    '      var entry = fileEntries[i];\n' +
    '      var destKey = "/idbfs/" + hash + entry.relPath;\n' +
    '      var value = { mode: entry.mode, contents: b64ToU8(entry.contents), timestamp: new Date() };\n' +
    '      await new Promise(function (res, rej) {\n' +
    '        var req = store2.put(value, destKey);\n' +
    '        req.onsuccess = function () { res(); };\n' +
    '        req.onerror = function () { rej(req.error); };\n' +
    '      });\n' +
    '    }\n' +
    '    return true;\n' +
    '  }\n' +
    '\n' +
    '  async function apiLoad() {\n' +
    '    var res = await fetch(API_URL + "?action=loadTyping&studentId=" + encodeURIComponent(STUDENT_ID));\n' +
    '    var json = await res.json();\n' +
    '    if (!json.success) throw new Error(json.error || "ロードに失敗しました");\n' +
    '    return json.data;\n' +
    '  }\n' +
    '\n' +
    '  async function apiSave(saveData) {\n' +
    '    var res = await fetch(API_URL, {\n' +
    '      method: "POST",\n' +
    '      headers: { "Content-Type": "text/plain" },\n' +
    '      body: JSON.stringify({ type: "saveTyping", data: { studentId: STUDENT_ID, password: PASSWORD, data: saveData } })\n' +
    '    });\n' +
    '    var json = await res.json();\n' +
    '    if (!json.success) throw new Error(json.error || "保存に失敗しました");\n' +
    '    return json;\n' +
    '  }\n' +
    '\n' +
    '  function startReminder() {\n' +
    '    if (window.__tlReminderTimer) clearInterval(window.__tlReminderTimer);\n' +
    '    window.__tlReminderTimer = setInterval(function () {\n' +
    '      if (!document.getElementById("tl-home-panel")) { clearInterval(window.__tlReminderTimer); return; }\n' +
    '      alert("保存を忘れずに！終わったら「保存する」ボタンを押してね。");\n' +
    '    }, REMINDER_INTERVAL_MS);\n' +
    '  }\n' +
    '\n' +
    '  function showPanel() {\n' +
    '    var old = document.getElementById("tl-home-panel");\n' +
    '    if (old) old.remove();\n' +
    '\n' +
    '    var panel = document.createElement("div");\n' +
    '    panel.id = "tl-home-panel";\n' +
    '    panel.style.cssText = "position:fixed;top:0;right:0;z-index:2147483647;background:#fff;border:2px solid #333;padding:12px;font-family:sans-serif;width:240px;box-shadow:-2px 0 8px rgba(0,0,0,.3);";\n' +
    '\n' +
    '    var title = document.createElement("div");\n' +
    '    title.textContent = "タイピングランド（" + STUDENT_ID + "）";\n' +
    '    title.style.cssText = "font-weight:bold;margin-bottom:8px;";\n' +
    '    panel.appendChild(title);\n' +
    '\n' +
    '    var note = document.createElement("div");\n' +
    '    note.textContent = "⚠ 遊び終わったら必ず「保存する」を押してね！";\n' +
    '    note.style.cssText = "color:#c0392b;font-size:12px;margin-bottom:10px;";\n' +
    '    panel.appendChild(note);\n' +
    '\n' +
    '    var loadBtn = document.createElement("button");\n' +
    '    loadBtn.textContent = "続きからはじめる（ロード）";\n' +
    '    loadBtn.style.cssText = "display:block;width:100%;margin-bottom:6px;padding:8px;cursor:pointer;";\n' +
    '    loadBtn.onclick = async function () {\n' +
    '      loadBtn.disabled = true;\n' +
    '      loadBtn.textContent = "読み込み中...";\n' +
    '      try {\n' +
    '        var data = await apiLoad();\n' +
    '        if (data) await importSave(data);\n' +
    '        location.reload();\n' +
    '      } catch (e) {\n' +
    '        alert("ロードに失敗しました: " + e.message);\n' +
    '        loadBtn.disabled = false;\n' +
    '        loadBtn.textContent = "続きからはじめる（ロード）";\n' +
    '      }\n' +
    '    };\n' +
    '    panel.appendChild(loadBtn);\n' +
    '\n' +
    '    var saveBtn = document.createElement("button");\n' +
    '    saveBtn.textContent = "保存する";\n' +
    '    saveBtn.style.cssText = "display:block;width:100%;padding:8px;cursor:pointer;background:#e6ffe6;";\n' +
    '    saveBtn.onclick = async function () {\n' +
    '      saveBtn.disabled = true;\n' +
    '      saveBtn.textContent = "保存中...";\n' +
    '      try {\n' +
    '        var data = await exportSave();\n' +
    '        await apiSave(data);\n' +
    '        saveBtn.textContent = "保存しました！";\n' +
    '        setTimeout(function () { saveBtn.textContent = "保存する"; saveBtn.disabled = false; }, 1500);\n' +
    '      } catch (e) {\n' +
    '        alert("保存に失敗しました: " + e.message);\n' +
    '        saveBtn.textContent = "保存する";\n' +
    '        saveBtn.disabled = false;\n' +
    '      }\n' +
    '    };\n' +
    '    panel.appendChild(saveBtn);\n' +
    '\n' +
    '    var closeBtn = document.createElement("button");\n' +
    '    closeBtn.textContent = "閉じる";\n' +
    '    closeBtn.style.cssText = "display:block;width:100%;margin-top:6px;padding:6px;cursor:pointer;background:#f0f0f0;";\n' +
    '    closeBtn.onclick = function () {\n' +
    '      panel.remove();\n' +
    '      if (window.__tlReminderTimer) clearInterval(window.__tlReminderTimer);\n' +
    '    };\n' +
    '    panel.appendChild(closeBtn);\n' +
    '\n' +
    '    document.body.appendChild(panel);\n' +
    '    startReminder();\n' +
    '  }\n' +
    '\n' +
    '  try {\n' +
    '    if (!("indexedDB" in window)) {\n' +
    '      alert("このページはタイピングランドではないようです。タイピングランドのページを開いた状態でこのブックマークを押してください。");\n' +
    '    } else {\n' +
    '      showPanel();\n' +
    '    }\n' +
    '  } catch (e) {\n' +
    '    alert("エラーが発生しました: " + e.message);\n' +
    '  }\n' +
    '})();';

  return 'javascript:' + encodeURIComponent(source);
}
