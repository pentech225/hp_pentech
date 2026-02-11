/**
 * メール送信履歴管理
 */

// 送信履歴を保存
function saveEmailHistory(type, data) {
    try {
        // 既存の履歴を取得
        const history = getEmailHistory();
        
        // 新しい履歴エントリを作成
        const entry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            type: type, // 'reservation' または 'contact'
            data: data
        };
        
        // 履歴に追加（最新が先頭）
        history.unshift(entry);
        
        // 最大100件まで保持
        if (history.length > 100) {
            history.splice(100);
        }
        
        // ローカルストレージに保存
        localStorage.setItem('email_history', JSON.stringify(history));
        
        console.log('📧 メール送信履歴を保存しました:', entry);
        return true;
    } catch (error) {
        console.error('❌ メール送信履歴の保存に失敗しました:', error);
        return false;
    }
}

// 送信履歴を取得
function getEmailHistory() {
    try {
        const historyJson = localStorage.getItem('email_history');
        if (historyJson) {
            return JSON.parse(historyJson);
        }
        return [];
    } catch (error) {
        console.error('❌ メール送信履歴の取得に失敗しました:', error);
        return [];
    }
}

// 送信履歴をクリア
function clearEmailHistory() {
    try {
        localStorage.removeItem('email_history');
        console.log('📧 メール送信履歴をクリアしました');
        return true;
    } catch (error) {
        console.error('❌ メール送信履歴のクリアに失敗しました:', error);
        return false;
    }
}

// 送信履歴をフィルタリング
function filterEmailHistory(type, startDate, endDate) {
    let history = getEmailHistory();
    
    // タイプでフィルタ
    if (type && type !== 'all') {
        history = history.filter(entry => entry.type === type);
    }
    
    // 日付でフィルタ
    if (startDate) {
        const start = new Date(startDate);
        history = history.filter(entry => new Date(entry.timestamp) >= start);
    }
    
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // その日の終わりまで
        history = history.filter(entry => new Date(entry.timestamp) <= end);
    }
    
    return history;
}

// Google Sheetsから履歴を取得（永続化された履歴）
async function getEmailHistoryFromGoogleSheets() {
    try {
        if (!CONFIG || !CONFIG.GOOGLE_APPS_SCRIPT_URL) {
            console.warn('Google Apps Script URLが設定されていません');
            return [];
        }
        
        // GETリクエストで履歴を取得
        const historyUrl = CONFIG.GOOGLE_APPS_SCRIPT_URL + '?action=getHistory';
        const response = await fetch(historyUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.history) {
            console.log('📧 Google Sheetsから履歴を取得しました:', result.history.length, '件');
            return result.history;
        }
        
        return [];
    } catch (error) {
        console.error('❌ Google Sheetsからの履歴取得エラー:', error);
        return [];
    }
}

// ローカルストレージとGoogle Sheetsの履歴をマージ
async function getMergedEmailHistory() {
    try {
        // ローカルストレージから取得
        const localHistory = getEmailHistory();
        
        // Google Sheetsから取得
        const sheetsHistory = await getEmailHistoryFromGoogleSheets();
        
        // 重複を避けてマージ（IDまたはタイムスタンプで判定）
        const mergedHistory = [...localHistory];
        const localTimestamps = new Set(localHistory.map(h => h.timestamp));
        
        // Google Sheetsの履歴で、ローカルにないものだけ追加
        sheetsHistory.forEach(sheetEntry => {
            if (!localTimestamps.has(sheetEntry.timestamp)) {
                // Google Sheetsのデータ形式をローカル形式に変換
                mergedHistory.push({
                    id: sheetEntry.timestamp || Date.now().toString(),
                    timestamp: sheetEntry.timestamp,
                    type: sheetEntry.type,
                    data: sheetEntry.data
                });
            }
        });
        
        // タイムスタンプでソート（新しい順）
        mergedHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // 最大100件まで保持
        if (mergedHistory.length > 100) {
            return mergedHistory.slice(0, 100);
        }
        
        return mergedHistory;
    } catch (error) {
        console.error('❌ 履歴のマージエラー:', error);
        // エラー時はローカルストレージの履歴のみ返す
        return getEmailHistory();
    }
}

