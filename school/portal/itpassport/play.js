/**
 * ITパスポート試験対策コース - プレイページ（動画再生・演習・自動遷移）
 *
 * VIDEOS/QUIZZES（videos.js/quizzes.js）、クイズ共通ロジック（quiz-common.js）、
 * 個人アカウント（portal-common.js / auth-check.js）が先に読み込まれている前提で動作する。
 */

(function () {
    'use strict';

    // 90%以上見たら「1回見た」とみなす（サーバー側と同じ閾値）
    var WATCH_COMPLETE_RATIO = 0.9;
    // 再生中の保険保存の間隔（ミリ秒）
    var SAFETY_SAVE_INTERVAL_MS = 30000;
    // 再生中のクライアント側ポーリング間隔（ミリ秒）
    var POLL_INTERVAL_MS = 5000;
    // YouTube APIの読み込みが遅い/ブロックされている場合のタイムアウト
    var API_LOAD_TIMEOUT_MS = 8000;
    // 演習回答後、次の動画へ自動遷移するまでの待ち時間（結果表示を見せるため）
    var ADVANCE_DELAY_MS = 1200;

    // YouTube側のエラーコード一覧: https://developers.google.com/youtube/iframe_api_reference#onError
    var YT_ERROR_MESSAGES = {
        2: 'この動画は再生できません（動画IDが正しくないようです）。',
        5: 'この動画はこのブラウザでは再生できませんでした。',
        100: 'この動画が見つかりませんでした（削除または非公開になっている可能性があります）。',
        101: 'この動画は他のサイトへの埋め込み再生が許可されていません。',
        150: 'この動画は他のサイトへの埋め込み再生が許可されていません。'
    };

    var student = null;
    var sorted = [];
    var currentVideo = null;
    var currentIndex = -1;

    var player = null;
    var pollTimer = null;
    var safetyTimer = null;
    var maxSeen = 0;
    var duration = 0;
    var watchCount = 0;
    var ytApiReady = false;
    var pendingPlay = false;
    var videoEnded = false;

    window.onYouTubeIframeAPIReady = function () {
        ytApiReady = true;
        if (pendingPlay) {
            pendingPlay = false;
            createPlayer();
        }
    };

    function formatTime(seconds) {
        seconds = Math.floor(seconds || 0);
        var m = Math.floor(seconds / 60);
        var s = seconds % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function badgeHtml() {
        var percent = duration > 0 ? Math.min(100, Math.round((maxSeen / duration) * 100)) : 0;
        return (
            '<span class="progress-bar-track"><span class="progress-bar-fill" style="width:' + percent + '%;"></span></span>' +
            '<span>' + percent + '%見た・🔁' + watchCount + '回</span>'
        );
    }

    function renderProgressBadge() {
        var el = document.getElementById('progress-badge');
        if (el) el.innerHTML = badgeHtml();
    }

    function resolveCurrentVideo() {
        sorted = VIDEOS.slice().sort(function (a, b) { return a.order - b.order; });
        if (sorted.length === 0) {
            location.replace('index.html');
            return false;
        }

        var params = new URLSearchParams(location.search);
        var orderParam = Number(params.get('order'));
        var index = sorted.findIndex(function (v) { return v.order === orderParam; });

        if (!Number.isFinite(orderParam) || index === -1) {
            location.replace('play.html?order=' + sorted[0].order);
            return false;
        }

        currentIndex = index;
        currentVideo = sorted[index];
        return true;
    }

    function renderChrome() {
        document.title = '📘 ' + currentVideo.title + ' | PenTech';
        document.getElementById('video-position').textContent =
            (currentIndex + 1) + ' / ' + sorted.length;
        document.getElementById('video-title').textContent = currentVideo.title;
        document.getElementById('video-thumb').src =
            'https://img.youtube.com/vi/' + currentVideo.videoId + '/mqdefault.jpg';

        var explainSection = document.getElementById('explain-section');
        var explainText = document.getElementById('explain-text');
        if (currentVideo.explain) {
            explainText.textContent = currentVideo.explain;
            explainSection.style.display = 'block';
        } else {
            explainSection.style.display = 'none';
        }
    }

    function renderPrevNext() {
        var prevBtn = document.getElementById('prev-btn');
        var nextBtn = document.getElementById('next-btn');
        var prev = sorted[currentIndex - 1];
        var next = sorted[currentIndex + 1];

        if (prev) {
            prevBtn.href = 'play.html?order=' + prev.order;
            prevBtn.classList.remove('disabled');
        } else {
            prevBtn.removeAttribute('href');
            prevBtn.classList.add('disabled');
        }

        if (next) {
            nextBtn.href = 'play.html?order=' + next.order;
            nextBtn.classList.remove('disabled');
        } else {
            nextBtn.removeAttribute('href');
            nextBtn.classList.add('disabled');
        }
    }

    function quizzesForCurrentVideo() {
        return (typeof QUIZZES !== 'undefined' ? QUIZZES : []).filter(function (q) {
            return q.afterOrder === currentVideo.order;
        });
    }

    function renderQuizSection() {
        var section = document.getElementById('quiz-section');
        var quizzes = quizzesForCurrentVideo();
        section.innerHTML = quizzes.map(quizCardHtml).join('');

        section.querySelectorAll('.quiz-choice-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                handleQuizAnswer(btn, student, onQuizAnswered);
            });
        });
    }

    function onQuizAnswered() {
        checkAdvance();
    }

    function checkAdvance() {
        var quizzes = quizzesForCurrentVideo();
        var allAnswered = quizzes.every(function (q) { return isQuizAnswered(q.id); });
        if (videoEnded && allAnswered) autoAdvance();
    }

    function autoAdvance() {
        var next = sorted[currentIndex + 1];
        if (next) {
            setTimeout(function () {
                location.href = 'play.html?order=' + next.order;
            }, ADVANCE_DELAY_MS);
        } else {
            document.getElementById('course-complete').style.display = 'block';
        }
    }

    function playVideo() {
        var wrap = document.getElementById('player-wrap');
        wrap.innerHTML = '<div class="yt-player" id="player"></div>' +
            '<div class="player-loading" id="player-loading">読み込み中...</div>';

        if (ytApiReady) {
            createPlayer();
        } else {
            pendingPlay = true;
            setTimeout(function () {
                if (!player) {
                    showPlaybackError('動画の読み込みに時間がかかっています。広告ブロッカーなどの影響かもしれません。');
                }
            }, API_LOAD_TIMEOUT_MS);
        }
    }

    function showPlaybackError(message) {
        var wrap = document.getElementById('player-wrap');
        if (!wrap) return;
        wrap.innerHTML =
            '<div class="player-error">' +
                '<p>⚠️ ' + message + '</p>' +
                '<a href="https://www.youtube.com/watch?v=' + currentVideo.videoId + '" target="_blank" rel="noopener noreferrer">▶ YouTubeで直接見る</a>' +
            '</div>';
    }

    function createPlayer() {
        player = new YT.Player('player', {
            width: '100%',
            height: '100%',
            videoId: currentVideo.videoId,
            playerVars: {
                rel: 0,
                origin: window.location.origin
            },
            events: {
                onReady: function (event) {
                    var loadingEl = document.getElementById('player-loading');
                    if (loadingEl) loadingEl.remove();
                    duration = event.target.getDuration() || duration || 0;
                },
                onStateChange: onPlayerStateChange,
                onError: function (event) {
                    var message = YT_ERROR_MESSAGES[event.data] || 'この動画の再生中にエラーが発生しました。';
                    showPlaybackError(message);
                }
            }
        });
    }

    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            startTracking();
        } else if (event.data === YT.PlayerState.PAUSED) {
            stopTracking();
            saveProgress();
        } else if (event.data === YT.PlayerState.ENDED) {
            stopTracking();
            maxSeen = Math.max(maxSeen, player.getDuration() || 0);
            saveProgress();
            videoEnded = true;
            checkAdvance();
        }
    }

    function startTracking() {
        stopTracking();

        pollTimer = setInterval(function () {
            if (!player || typeof player.getCurrentTime !== 'function') return;
            var current = player.getCurrentTime() || 0;
            maxSeen = Math.max(maxSeen, current);
            duration = player.getDuration() || duration || 0;
            renderProgressBadge();
        }, POLL_INTERVAL_MS);

        safetyTimer = setInterval(function () {
            saveProgress();
        }, SAFETY_SAVE_INTERVAL_MS);
    }

    function stopTracking() {
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
        if (safetyTimer) { clearInterval(safetyTimer); safetyTimer = null; }
    }

    async function saveProgress() {
        if (!student) return;
        if (maxSeen <= 0) return;

        try {
            var result = await portalPostJson('saveProgress', {
                studentId: student.studentId,
                videoId: currentVideo.videoId,
                currentTimeSeconds: maxSeen,
                durationSeconds: duration
            });
            if (result.success && result.progress) {
                maxSeen = result.progress.maxWatchedSeconds;
                duration = result.progress.durationSeconds;
                watchCount = result.progress.watchCount;
                renderProgressBadge();
            }
        } catch (err) {
            // 通信エラーは無視（次の保存タイミングで再試行される）
        }
    }

    function saveProgressBeacon() {
        if (!student) return;
        if (maxSeen <= 0) return;

        try {
            fetch(CONFIG.PORTAL_GOOGLE_APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                keepalive: true,
                body: JSON.stringify({
                    type: 'saveProgress',
                    data: {
                        studentId: student.studentId,
                        videoId: currentVideo.videoId,
                        currentTimeSeconds: maxSeen,
                        durationSeconds: duration
                    }
                })
            });
        } catch (err) {
            // ページ離脱時のベストエフォート送信のため、失敗しても何もしない
        }
    }

    async function loadProgressAndAssignments() {
        try {
            var progressResult = await portalGetJson('getProgress', { studentId: student.studentId });
            if (progressResult.success) {
                var mine = progressResult.progress.filter(function (p) { return p.videoId === currentVideo.videoId; })[0];
                if (mine) {
                    maxSeen = Number(mine.maxWatchedSeconds) || 0;
                    duration = Number(mine.durationSeconds) || 0;
                    watchCount = Number(mine.watchCount) || 0;
                }
            }
        } catch (err) {
            // 進捗の取得に失敗しても動画閲覧自体は継続できるようにする
        }

        renderProgressBadge();

        try {
            var assignmentsResult = await portalGetJson('getAssignments', { studentId: student.studentId });
            if (assignmentsResult.success) {
                var assigned = assignmentsResult.assignments.some(function (a) { return a.videoId === currentVideo.videoId; });
                document.getElementById('hw-tag').style.display = assigned ? 'block' : 'none';
            }
        } catch (err) {
            // 宿題の取得に失敗しても致命的ではない
        }

        await loadQuizAnswers(student);
    }

    function init() {
        student = getLoggedInStudent();
        if (!student) {
            // auth-check.js がログインモーダルを表示している途中。
            // ログイン完了後にページがリロードされ、この関数が再実行される。
            return;
        }

        if (!resolveCurrentVideo()) return;

        renderChrome();
        renderPrevNext();
        renderQuizSection();
        loadProgressAndAssignments();

        document.getElementById('play-btn').addEventListener('click', playVideo);

        window.addEventListener('beforeunload', function () {
            stopTracking();
            saveProgressBeacon();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
