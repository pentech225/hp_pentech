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

// テスト関数: saveEmailHistory関数の動作確認
function testSaveEmailHistory() {
    console.log('🧪 saveEmailHistory関数のテストを開始します...');
    
    // テストデータ1: 予約フォーム
    const testData1 = {
        child_name: 'テスト太郎',
        phone: '09012345678',
        email: 'test@example.com',
        school_type: '小学生',
        grade: '小学3年生',
        date: '2026/2/25 (水)',
        time: '8:10',
        message: 'テストメッセージ'
    };
    
    // テストデータ2: お問い合わせフォーム
    const testData2 = {
        email: 'contact@example.com',
        phone: '09087654321',
        message: 'お問い合わせテスト'
    };
    
    try {
        // テスト1: 予約フォームの履歴を保存
        console.log('📝 テスト1: 予約フォームの履歴を保存');
        const result1 = saveEmailHistory('reservation', testData1);
        console.log('結果:', result1 ? '✅ 成功' : '❌ 失敗');
        
        // テスト2: お問い合わせフォームの履歴を保存
        console.log('📝 テスト2: お問い合わせフォームの履歴を保存');
        const result2 = saveEmailHistory('contact', testData2);
        console.log('結果:', result2 ? '✅ 成功' : '❌ 失敗');
        
        // テスト3: 履歴を取得して確認
        console.log('📝 テスト3: 履歴を取得して確認');
        const history = getEmailHistory();
        console.log('履歴件数:', history.length);
        console.log('履歴内容:', history);
        
        // テスト4: 最新の履歴を確認
        if (history.length > 0) {
            console.log('📝 テスト4: 最新の履歴を確認');
            const latest = history[0];
            console.log('最新の履歴:', latest);
            console.log('ID:', latest.id);
            console.log('タイムスタンプ:', latest.timestamp);
            console.log('タイプ:', latest.type);
            console.log('データ:', latest.data);
        }
        
        // テスト5: ローカルストレージを直接確認
        console.log('📝 テスト5: ローカルストレージを直接確認');
        const stored = localStorage.getItem('email_history');
        console.log('ローカルストレージの内容:', stored);
        if (stored) {
            const parsed = JSON.parse(stored);
            console.log('パース後の内容:', parsed);
            console.log('件数:', parsed.length);
        }
        
        console.log('✅ テスト完了');
        return {
            success: true,
            test1: result1,
            test2: result2,
            historyCount: history.length,
            history: history
        };
    } catch (error) {
        console.error('❌ テストエラー:', error);
        return {
            success: false,
            error: error.toString()
        };
    }
}

// テスト関数: 履歴のクリアと再保存のテスト
function testClearAndSave() {
    console.log('🧪 履歴のクリアと再保存のテストを開始します...');
    
    try {
        // 現在の履歴を確認
        const beforeClear = getEmailHistory();
        console.log('クリア前の履歴件数:', beforeClear.length);
        
        // 履歴をクリア
        console.log('📝 履歴をクリア');
        const clearResult = clearEmailHistory();
        console.log('結果:', clearResult ? '✅ 成功' : '❌ 失敗');
        
        // クリア後の履歴を確認
        const afterClear = getEmailHistory();
        console.log('クリア後の履歴件数:', afterClear.length);
        
        // 新しい履歴を保存
        console.log('📝 新しい履歴を保存');
        const testData = {
            child_name: 'クリア後テスト',
            phone: '09011111111',
            email: 'cleartest@example.com',
            school_type: '中学生',
            grade: '中学1年生',
            date: '2026/2/26 (木)',
            time: '10:30',
            message: 'クリア後のテスト'
        };
        const saveResult = saveEmailHistory('reservation', testData);
        console.log('結果:', saveResult ? '✅ 成功' : '❌ 失敗');
        
        // 保存後の履歴を確認
        const afterSave = getEmailHistory();
        console.log('保存後の履歴件数:', afterSave.length);
        console.log('保存後の履歴:', afterSave);
        
        console.log('✅ テスト完了');
        return {
            success: true,
            beforeClear: beforeClear.length,
            afterClear: afterClear.length,
            afterSave: afterSave.length,
            clearResult: clearResult,
            saveResult: saveResult
        };
    } catch (error) {
        console.error('❌ テストエラー:', error);
        return {
            success: false,
            error: error.toString()
        };
    }
}

