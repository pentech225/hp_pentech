/**
 * タイピングランド 生徒切り替えパネル
 *
 * 【代替手段】通常運用では open_typingland.bat + load.bat/save.bat（agent.js経由、
 * コンソール操作不要）を使う。これはload.bat/save.batが使えない環境向けの手動フォールバック。
 *
 * 使い方: タイピングランドのページ (https://typingland.higopage.com/play/) を開いた状態で、
 * このコードをブラウザのDevToolsコンソール（F12 → Console）に貼り付けてEnterを押す。
 * 画面右にプルダウン（生徒選択）と「読み込む」「保存する」ボタンが出る。
 *
 * このコードの最新版・コピー用ページは hp_pentech の案内ページ（README参照）に置いてある。
 *
 * セーブデータは Apps Script Web App (gas/Code.gs) 経由でスプレッドシートに保存される。
 *
 * 使い方の流れ:
 *   1. プルダウンで生徒を選び「読み込む」を押す
 *      → (直前に別の生徒が読み込まれていれば)今のセーブデータをその生徒の名前で保存してから、
 *        選んだ生徒のセーブデータを読み込んでゲームに反映し、ページを自動リロードする
 *   2. 交代せず同じ生徒が続けて遊ぶ日は、「保存する」ボタンでその場で保存できる（リロードなし）
 */
(async function () {
  // デプロイ後に発行される Apps Script Web App のURLに置き換える（gas/Code.gs参照）
  const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxWyxrswpWUZqIVr57_Y_IoTFYgEXnOxs82puI4kaQi17jBDoMgrLy4koKdDUxErU4s/exec';
  const CURRENT_STUDENT_KEY = 'typingland_current_student';

  // ---- Apps Script Web App 経由でのセーブデータ読み書き ----
  async function apiList() {
    const res = await fetch(WEBAPP_URL + '?action=list');
    return res.json();
  }

  async function apiLoad(name) {
    const res = await fetch(WEBAPP_URL + '?action=load&name=' + encodeURIComponent(name));
    return res.json();
  }

  async function apiSave(name, data) {
    // Content-Type: application/json だとpreflight(OPTIONS)が発生しGAS側で処理できないため、
    // text/plainとして送りサーバー側(doPost)でJSON.parseする
    await fetch(WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'save', name, data }),
    });
  }

  // ---- タイピングランド(Unity WebGL)のセーブデータ(idbfs)読み書き ----
  // ※ 2026-08-10のセッションで実サイト検証済みのロジックを流用
  function openGameDB(name) {
    return new Promise((res, rej) => {
      const r = indexedDB.open(name);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }

  function u8ToB64(u8) {
    let s = '';
    for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    return btoa(s);
  }

  function b64ToU8(b64) {
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return u8;
  }

  function cursorAll(store) {
    return new Promise((res, rej) => {
      const out = [];
      const req = store.openCursor();
      req.onsuccess = (e) => {
        const c = e.target.result;
        if (c) {
          out.push({ key: c.primaryKey, value: c.value });
          c.continue();
        } else {
          res(out);
        }
      };
      req.onerror = () => rej(req.error);
    });
  }

  async function exportSave() {
    const db = await openGameDB('/idbfs');
    const tx = db.transaction('FILE_DATA', 'readonly');
    const pairs = await cursorAll(tx.objectStore('FILE_DATA'));
    const entries = pairs.map((p) => {
      const relPath = p.key.replace(/^\/idbfs\/[^/]+/, '');
      const v = p.value;
      let contents = null;
      if (v.contents) {
        const u8 = v.contents instanceof Uint8Array ? v.contents : new Uint8Array(v.contents);
        contents = u8ToB64(u8);
      }
      return { relPath, mode: v.mode, contents };
    });
    return { app: 'typingland', version: 1, exportedAt: new Date().toISOString(), entries };
  }

  async function importSave(payload) {
    if (!payload || payload.app !== 'typingland' || !Array.isArray(payload.entries)) return false;
    const fileEntries = payload.entries.filter((e) => e.contents);
    if (fileEntries.length === 0) return false;

    const db = await openGameDB('/idbfs');
    const tx1 = db.transaction('FILE_DATA', 'readonly');
    const pairs = await cursorAll(tx1.objectStore('FILE_DATA'));
    const rootEntry = pairs.find((p) => /^\/idbfs\/[^/]+$/.test(p.key));
    if (!rootEntry) return false;
    const hash = rootEntry.key.split('/')[2];

    const tx2 = db.transaction('FILE_DATA', 'readwrite');
    const store2 = tx2.objectStore('FILE_DATA');
    for (const entry of fileEntries) {
      const destKey = '/idbfs/' + hash + entry.relPath;
      const value = { mode: entry.mode, contents: b64ToU8(entry.contents), timestamp: new Date() };
      await new Promise((res, rej) => {
        const req = store2.put(value, destKey);
        req.onsuccess = () => res();
        req.onerror = () => rej(req.error);
      });
    }
    return true;
  }

  // 新規生徒(まだ保存データがない)の場合、前の生徒のセーブが残らないよう
  // 中身(contents持ち)のエントリだけ空にする
  async function clearSave() {
    const db = await openGameDB('/idbfs');
    const tx1 = db.transaction('FILE_DATA', 'readonly');
    const pairs = await cursorAll(tx1.objectStore('FILE_DATA'));
    const tx2 = db.transaction('FILE_DATA', 'readwrite');
    const store2 = tx2.objectStore('FILE_DATA');
    for (const p of pairs) {
      if (p.value && p.value.contents) {
        await new Promise((res, rej) => {
          const req = store2.delete(p.key);
          req.onsuccess = () => res();
          req.onerror = () => rej(req.error);
        });
      }
    }
  }

  function formatLastUpdated(isoString) {
    if (!isoString) return '未保存';
    const d = new Date(isoString);
    return d.toLocaleString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' 更新';
  }

  // ---- UIパネル ----
  async function main() {
    const { roster: names, lastUpdated: lastUpdatedByName } = await apiList();
    const currentStudent = localStorage.getItem(CURRENT_STUDENT_KEY) || null;

    const old = document.getElementById('tl-switch-panel');
    if (old) old.remove();

    const panel = document.createElement('div');
    panel.id = 'tl-switch-panel';
    panel.style.cssText =
      'position:fixed;top:0;right:0;z-index:2147483647;background:#fff;border:2px solid #333;' +
      'padding:10px;max-height:100vh;overflow:auto;font-family:sans-serif;width:220px;box-shadow:-2px 0 8px rgba(0,0,0,.3);';

    const title = document.createElement('div');
    title.textContent = '生徒を選択' + (currentStudent ? '\n(現在: ' + currentStudent + ')' : '');
    title.style.cssText = 'font-weight:bold;margin-bottom:8px;white-space:pre-line;';
    panel.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '閉じる';
    closeBtn.style.cssText = 'width:100%;margin-bottom:8px;padding:4px;';
    closeBtn.onclick = () => panel.remove();
    panel.appendChild(closeBtn);

    const select = document.createElement('select');
    select.style.cssText = 'width:100%;margin-bottom:4px;padding:6px;font-size:14px;';
    names.forEach((name) => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      if (name === currentStudent) opt.selected = true;
      select.appendChild(opt);
    });
    panel.appendChild(select);

    const lastUpdatedLabel = document.createElement('div');
    lastUpdatedLabel.style.cssText = 'font-size:12px;color:#666;margin-bottom:8px;';
    lastUpdatedLabel.textContent = select.value ? formatLastUpdated(lastUpdatedByName[select.value]) : '';
    panel.appendChild(lastUpdatedLabel);

    select.onchange = () => {
      lastUpdatedLabel.textContent = formatLastUpdated(lastUpdatedByName[select.value]);
    };

    const loadBtn = document.createElement('button');
    loadBtn.textContent = '読み込む';
    loadBtn.style.cssText =
      'width:100%;margin-bottom:8px;padding:8px;font-weight:bold;background:#cfe8ff;cursor:pointer;';
    loadBtn.onclick = async () => {
      const name = select.value;
      if (!name) {
        alert('生徒を選んでください');
        return;
      }
      const original = loadBtn.textContent;
      loadBtn.disabled = true;
      loadBtn.textContent = '切替中...';
      try {
        if (currentStudent && currentStudent !== name) {
          const currentData = await exportSave();
          await apiSave(currentStudent, currentData);
        }
        const newData = await apiLoad(name);
        if (newData) {
          await importSave(newData);
        } else {
          await clearSave();
        }
        localStorage.setItem(CURRENT_STUDENT_KEY, name);
        location.reload();
      } catch (e) {
        alert('切り替えに失敗しました: ' + e.message);
        loadBtn.disabled = false;
        loadBtn.textContent = original;
      }
    };
    panel.appendChild(loadBtn);

    // 1人だけ遊んでいて交代しない場合のための、今のデータだけを保存するボタン
    // (プルダウンの選択に関わらず、実際に今読み込まれている生徒=currentStudentに保存する)
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '保存する';
    saveBtn.style.cssText =
      'width:100%;padding:8px;font-weight:bold;background:#e6ffe6;cursor:pointer;';
    saveBtn.onclick = async () => {
      if (!currentStudent) {
        alert('先に「読み込む」で生徒を選んでください');
        return;
      }
      const original = saveBtn.textContent;
      saveBtn.disabled = true;
      saveBtn.textContent = '保存中...';
      try {
        const data = await exportSave();
        await apiSave(currentStudent, data);
        lastUpdatedByName[currentStudent] = data.exportedAt;
        if (select.value === currentStudent) {
          lastUpdatedLabel.textContent = formatLastUpdated(data.exportedAt);
        }
        saveBtn.textContent = '保存しました！';
        setTimeout(() => {
          saveBtn.textContent = original;
          saveBtn.disabled = false;
        }, 1500);
      } catch (e) {
        alert('保存に失敗しました: ' + e.message);
        saveBtn.textContent = original;
        saveBtn.disabled = false;
      }
    };
    panel.appendChild(saveBtn);

    document.body.appendChild(panel);
  }

  await main();
})();
