/**
 * ITパスポート試験対策コース - 動画再生・進捗管理
 *
 * VIDEOS（videos.js）と個人アカウント（portal-common.js / auth-check.js）が
 * 先に読み込まれている前提で動作する。
 */

(function () {
    'use strict';

    // 90%以上見たら「1回見た」とみなす（サーバー側と同じ閾値）
    var WATCH_COMPLETE_RATIO = 0.9;
    // 再生中の保険保存の間隔（ミリ秒）
    var SAFETY_SAVE_INTERVAL_MS = 30000;
    // 再生中のクライアント側ポーリング間隔（ミリ秒）
    var POLL_INTERVAL_MS = 5000;

    var student = null;
    var players = {};          // videoId -> YT.Player
    var pollTimers = {};       // videoId -> setInterval id (client側の最大到達秒数の更新)
    var safetyTimers = {};     // videoId -> setInterval id (定期保存)
    var maxSeen = {};          // videoId -> 到達した最大秒数
    var durations = {};        // videoId -> 動画の長さ（秒）
    var watchCounts = {};      // videoId -> 視聴回数
    var ytApiReady = false;
    var pendingPlays = [];

    window.onYouTubeIframeAPIReady = function () {
        ytApiReady = true;
        pendingPlays.forEach(function (videoId) { createPlayer(videoId); });
        pendingPlays = [];
    };

    function formatTime(seconds) {
        seconds = Math.floor(seconds || 0);
        var m = Math.floor(seconds / 60);
        var s = seconds % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function badgeHtml(videoId) {
        var duration = durations[videoId] || 0;
        var seen = maxSeen[videoId] || 0;
        var percent = duration > 0 ? Math.min(100, Math.round((seen / duration) * 100)) : 0;
        var count = watchCounts[videoId] || 0;
        return (
            '<span class="progress-bar-track"><span class="progress-bar-fill" style="width:' + percent + '%;"></span></span>' +
            '<span>' + percent + '%見た・🔁' + count + '回</span>'
        );
    }

    function renderProgressBadge(videoId) {
        var el = document.getElementById('progress-' + videoId);
        if (el) el.innerHTML = badgeHtml(videoId);
    }

    function renderVideoGrid() {
        var grid = document.getElementById('video-grid');
        var sorted = VIDEOS.slice().sort(function (a, b) { return a.order - b.order; });

        grid.innerHTML = sorted.map(function (video) {
            return (
                '<div class="video-card" data-video-id="' + video.videoId + '">' +
                    '<div class="video-thumb-wrap" id="thumbwrap-' + video.videoId + '">' +
                        '<img class="video-thumb" src="https://img.youtube.com/vi/' + video.videoId + '/mqdefault.jpg" alt="">' +
                        '<button class="play-btn" data-video-id="' + video.videoId + '">▶ 再生</button>' +
                        '<div class="hw-tag" id="hwtag-' + video.videoId + '" style="display:none;">🏠 宿題</div>' +
                    '</div>' +
                    '<div class="video-info">' +
                        '<div class="video-title">' + video.title + '</div>' +
                        '<div class="video-progress" id="progress-' + video.videoId + '">読み込み中...</div>' +
                    '</div>' +
                '</div>'
            );
        }).join('');

        grid.querySelectorAll('.play-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                playVideo(btn.getAttribute('data-video-id'));
            });
        });
    }

    // YouTube APIの読み込みが遅い/ブロックされている場合に「読み込み中」で止まっていないか判定するまでの待ち時間
    var API_LOAD_TIMEOUT_MS = 8000;

    function playVideo(videoId) {
        var wrap = document.getElementById('thumbwrap-' + videoId);
        wrap.innerHTML = '<div class="yt-player" id="player-' + videoId + '"></div>' +
            '<div class="player-loading" id="loading-' + videoId + '">読み込み中...</div>';

        if (ytApiReady) {
            createPlayer(videoId);
        } else {
            pendingPlays.push(videoId);
            setTimeout(function () {
                if (!players[videoId]) {
                    showPlaybackError(videoId, '動画の読み込みに時間がかかっています。広告ブロッカーなどの影響かもしれません。');
                }
            }, API_LOAD_TIMEOUT_MS);
        }
    }

    // YouTube側のエラーコード一覧: https://developers.google.com/youtube/iframe_api_reference#onError
    var YT_ERROR_MESSAGES = {
        2: 'この動画は再生できません（動画IDが正しくないようです）。',
        5: 'この動画はこのブラウザでは再生できませんでした。',
        100: 'この動画が見つかりませんでした（削除または非公開になっている可能性があります）。',
        101: 'この動画は他のサイトへの埋め込み再生が許可されていません。',
        150: 'この動画は他のサイトへの埋め込み再生が許可されていません。'
    };

    function showPlaybackError(videoId, message) {
        var wrap = document.getElementById('thumbwrap-' + videoId);
        if (!wrap) return;
        wrap.innerHTML =
            '<div class="player-error">' +
                '<p>⚠️ ' + message + '</p>' +
                '<a href="https://www.youtube.com/watch?v=' + videoId + '" target="_blank" rel="noopener noreferrer">▶ YouTubeで直接見る</a>' +
            '</div>';
    }

    function createPlayer(videoId) {
        players[videoId] = new YT.Player('player-' + videoId, {
            width: '100%',
            height: '100%',
            videoId: videoId,
            playerVars: {
                rel: 0,
                origin: window.location.origin
            },
            events: {
                onReady: function (event) {
                    var loadingEl = document.getElementById('loading-' + videoId);
                    if (loadingEl) loadingEl.remove();
                    durations[videoId] = event.target.getDuration() || durations[videoId] || 0;
                },
                onStateChange: function (event) { onPlayerStateChange(videoId, event); },
                onError: function (event) {
                    var message = YT_ERROR_MESSAGES[event.data] || 'この動画の再生中にエラーが発生しました。';
                    showPlaybackError(videoId, message);
                }
            }
        });
    }

    function onPlayerStateChange(videoId, event) {
        if (event.data === YT.PlayerState.PLAYING) {
            startTracking(videoId);
        } else if (event.data === YT.PlayerState.PAUSED) {
            stopTracking(videoId);
            saveProgress(videoId);
        } else if (event.data === YT.PlayerState.ENDED) {
            stopTracking(videoId);
            var player = players[videoId];
            maxSeen[videoId] = Math.max(maxSeen[videoId] || 0, player.getDuration() || 0);
            saveProgress(videoId);
        }
    }

    function startTracking(videoId) {
        stopTracking(videoId);

        pollTimers[videoId] = setInterval(function () {
            var player = players[videoId];
            if (!player || typeof player.getCurrentTime !== 'function') return;
            var current = player.getCurrentTime() || 0;
            maxSeen[videoId] = Math.max(maxSeen[videoId] || 0, current);
            durations[videoId] = player.getDuration() || durations[videoId] || 0;
            renderProgressBadge(videoId);
        }, POLL_INTERVAL_MS);

        safetyTimers[videoId] = setInterval(function () {
            saveProgress(videoId);
        }, SAFETY_SAVE_INTERVAL_MS);
    }

    function stopTracking(videoId) {
        if (pollTimers[videoId]) { clearInterval(pollTimers[videoId]); delete pollTimers[videoId]; }
        if (safetyTimers[videoId]) { clearInterval(safetyTimers[videoId]); delete safetyTimers[videoId]; }
    }

    async function saveProgress(videoId) {
        if (!student) return;
        var current = maxSeen[videoId] || 0;
        var duration = durations[videoId] || 0;
        if (current <= 0) return;

        try {
            var result = await portalPostJson('saveProgress', {
                studentId: student.studentId,
                videoId: videoId,
                currentTimeSeconds: current,
                durationSeconds: duration
            });
            if (result.success && result.progress) {
                maxSeen[videoId] = result.progress.maxWatchedSeconds;
                durations[videoId] = result.progress.durationSeconds;
                watchCounts[videoId] = result.progress.watchCount;
                renderProgressBadge(videoId);
            }
        } catch (err) {
            // 通信エラーは無視（次の保存タイミングで再試行される）
        }
    }

    function saveProgressBeacon(videoId) {
        if (!student) return;
        var current = maxSeen[videoId] || 0;
        var duration = durations[videoId] || 0;
        if (current <= 0) return;

        try {
            fetch(CONFIG.PORTAL_GOOGLE_APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                keepalive: true,
                body: JSON.stringify({
                    type: 'saveProgress',
                    data: {
                        studentId: student.studentId,
                        videoId: videoId,
                        currentTimeSeconds: current,
                        durationSeconds: duration
                    }
                })
            });
        } catch (err) {
            // ページ離脱時のベストエフォート送信のため、失敗しても何もしない
        }
    }

    function renderHomeworkBanner(assignments) {
        var container = document.getElementById('homework-container');
        if (!assignments || assignments.length === 0) {
            container.innerHTML = '';
            return;
        }

        var videoById = {};
        VIDEOS.forEach(function (v) { videoById[v.videoId] = v; });

        var items = assignments
            .map(function (a) {
                var video = videoById[a.videoId];
                if (!video) return null;
                var due = a.dueDate ? '（期限: ' + a.dueDate + '）' : '';
                var note = a.note ? '　' + a.note : '';
                return (
                    '<div class="hw-item">📌 「' + video.title + '」を <strong>' +
                    formatTime(a.cutoffSeconds) + '</strong> まで見てきてね' + due + note + '</div>'
                );
            })
            .filter(Boolean);

        if (items.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML =
            '<div class="homework-banner"><div class="hw-title">🏠 今週の宿題</div>' + items.join('') + '</div>';

        assignments.forEach(function (a) {
            var tag = document.getElementById('hwtag-' + a.videoId);
            if (tag) tag.style.display = 'block';
        });
    }

    async function loadProgressAndAssignments() {
        try {
            var progressResult = await portalGetJson('getProgress', { studentId: student.studentId });
            if (progressResult.success) {
                progressResult.progress.forEach(function (p) {
                    maxSeen[p.videoId] = Number(p.maxWatchedSeconds) || 0;
                    durations[p.videoId] = Number(p.durationSeconds) || 0;
                    watchCounts[p.videoId] = Number(p.watchCount) || 0;
                });
            }
        } catch (err) {
            // 進捗の取得に失敗しても動画閲覧自体は継続できるようにする
        }

        VIDEOS.forEach(function (v) { renderProgressBadge(v.videoId); });

        try {
            var assignmentsResult = await portalGetJson('getAssignments', { studentId: student.studentId });
            if (assignmentsResult.success) {
                renderHomeworkBanner(assignmentsResult.assignments);
            }
        } catch (err) {
            // 宿題の取得に失敗しても致命的ではない
        }
    }

    function init() {
        student = getLoggedInStudent();
        if (!student) {
            // auth-check.js がログインモーダルを表示している途中。
            // ログイン完了後にページがリロードされ、この関数が再実行される。
            return;
        }

        renderVideoGrid();
        loadProgressAndAssignments();

        window.addEventListener('beforeunload', function () {
            Object.keys(players).forEach(function (videoId) {
                stopTracking(videoId);
                saveProgressBeacon(videoId);
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
