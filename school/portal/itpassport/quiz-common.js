/**
 * ITパスポート試験対策コース - 確認問題（クイズ）共通ロジック
 *
 * QUIZZES（quizzes.js）が先に読み込まれている前提で動作する。
 * index.html（一覧内インラインクイズ）と play.html（視聴後の演習）の両方から利用する。
 */

var answeredQuizzes = {};  // quizId -> true（このページ読み込み中に解答済みか）

function quizCardHtml(quiz) {
    var choicesHtml = quiz.choices.map(function (choice) {
        return (
            '<button class="quiz-choice-btn" data-quiz-id="' + quiz.id + '" data-key="' + choice.key + '">' +
                choice.key + '　' + choice.text +
            '</button>'
        );
    }).join('');

    return (
        '<div class="quiz-card" id="quiz-' + quiz.id + '">' +
            '<div class="quiz-label">📝 確認問題</div>' +
            '<div class="quiz-question">' + quiz.question + '</div>' +
            '<div class="quiz-choices">' + choicesHtml + '</div>' +
            '<div class="quiz-result" id="quiz-result-' + quiz.id + '"></div>' +
        '</div>'
    );
}

function isQuizAnswered(quizId) {
    return !!answeredQuizzes[quizId];
}

function applyQuizAnswerState(quizId, chosenKey, isCorrect) {
    var quiz = QUIZZES.filter(function (q) { return q.id === quizId; })[0];
    var card = document.getElementById('quiz-' + quizId);
    if (!quiz || !card) return;

    var resultEl = document.getElementById('quiz-result-' + quizId);
    var buttons = card.querySelectorAll('.quiz-choice-btn');

    buttons.forEach(function (b) {
        b.disabled = true;
        if (b.getAttribute('data-key') === quiz.answerKey) {
            b.classList.add('correct');
        } else if (b.getAttribute('data-key') === chosenKey) {
            b.classList.add('incorrect');
        }
    });

    resultEl.textContent = isCorrect
        ? '⭕ 正解！'
        : '❌ 不正解。正解は「' + quiz.answerKey + '　' + (quiz.choices.filter(function (c) { return c.key === quiz.answerKey; })[0] || {}).text + '」でした。';
    resultEl.className = 'quiz-result ' + (isCorrect ? 'correct' : 'incorrect');

    answeredQuizzes[quizId] = true;
}

async function handleQuizAnswer(button, student, onAnswered) {
    var quizId = button.getAttribute('data-quiz-id');
    var chosenKey = button.getAttribute('data-key');
    var quiz = QUIZZES.filter(function (q) { return q.id === quizId; })[0];
    if (!quiz || answeredQuizzes[quizId]) return;

    var isCorrect = chosenKey === quiz.answerKey;
    applyQuizAnswerState(quizId, chosenKey, isCorrect);

    if (student) {
        try {
            await portalPostJson('saveQuizAnswer', {
                studentId: student.studentId,
                quizId: quizId,
                chosenKey: chosenKey,
                correct: isCorrect
            });
        } catch (err) {
            // 通信エラーが起きても解答自体はその場で表示済みなので無視する
        }
    }

    if (typeof onAnswered === 'function') onAnswered(quizId, isCorrect);
}

async function loadQuizAnswers(student) {
    try {
        var result = await portalGetJson('getQuizAnswers', { studentId: student.studentId });
        if (!result.success) return;
        // 解答は appendRow で追記される（履歴）ので、同じ問題は最後（最新）の記録を採用する
        result.answers.forEach(function (a) {
            applyQuizAnswerState(a.quizId, a.chosenKey, a.correct);
        });
    } catch (err) {
        // 解答記録の取得に失敗しても、未解答として問題を解くことは継続できる
    }
}
