/**
 * 尼崎の習い事ガイド
 * data/schools.json を読み、条件（学年・地域・距離・伸ばしたい力・ジャンル）から点数を付けて並べる。
 * 点数の内訳は index.html の「並び順の決め方」と必ず一致させること。
 */
(function () {
    'use strict';

    // 地域の中心（主な駅のおおよその位置）。距離の起点に使う
    var AREAS = {
        '武庫之荘': [34.7537, 135.3922],
        '塚口': [34.7528, 135.4167],
        '園田': [34.7587, 135.4362],
        '立花': [34.7386, 135.3985],
        'JR尼崎': [34.7333, 135.4290],
        '阪神尼崎': [34.7185, 135.4174],
        '出屋敷・南部': [34.7178, 135.3952]
    };

    // ジャンルごとに育てやすい力。取材が進んだら教室単位の値で上書きする想定
    var GOALS = ['考える力', 'ものづくり', '集中力', '体力', '英語', '表現・音楽', '礼儀・心'];
    var CAT_GOALS = {
        'プログラミング': ['考える力', 'ものづくり', '集中力'],
        'ロボット': ['ものづくり', '考える力', '集中力'],
        'スイミング': ['体力', '集中力'],
        '英会話': ['英語', '表現・音楽'],
        'ピアノ・音楽': ['表現・音楽', '集中力'],
        'そろばん': ['集中力', '考える力'],
        '書道': ['集中力', '礼儀・心'],
        '体操': ['体力'],
        'ダンス': ['体力', '表現・音楽'],
        'サッカー': ['体力', '礼儀・心'],
        '武道': ['体力', '礼儀・心'],
        '学習塾': ['考える力', '集中力']
    };

    // No.1の指標（2026-10-28に取材前に決めたもの）。値は schools.json の facts から取る
    // dir: 1 = 大きいほど上、-1 = 小さいほど上
    var METRICS = [
        { key: 'students', label: '生徒数が多い', unit: '名', dir: 1 },
        { key: 'teachers', label: '講師数が多い', unit: '名', dir: 1 },
        { key: 'kidsPerTeacher', label: '講師1人が見る子どもが少ない（1回の授業）', unit: '名', dir: -1 },
        { key: 'avgYears', label: '生徒が長く続けている（平均の在籍年数）', unit: '年', dir: 1 },
        { key: 'foundedYear', label: '歴史が長い（開校年）', unit: '年', dir: -1 },
        { key: 'monthlyFee', label: '月謝が高い', unit: '円', dir: 1 },
        { key: 'monthlyFeeLow', from: 'monthlyFee', label: '月謝が安い', unit: '円', dir: -1 },
        { key: 'perHour', label: '1時間あたりの月謝が安い（ジャンルをまたいで比べる用）', unit: '円', dir: -1 }
    ];
    var RANK_MIN = 3;

    var schools = [];
    var gakko = [];
    var homeLabel = '自宅';
    var home = AREAS['武庫之荘'];
    var homeMarker = null;
    var map = null, layer = null;
    var compare = [];
    var form = document.getElementById('cond');

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function km(a, b) {
        var R = 6371, rad = Math.PI / 180;
        var dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad;
        var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * R * Math.asin(Math.sqrt(x));
    }

    function checked(name) {
        return Array.prototype.map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (i) { return i.value; });
    }

    function buildForm() {
        var areaSel = document.getElementById('areaSel');
        Object.keys(AREAS).forEach(function (a) {
            areaSel.insertAdjacentHTML('beforeend', '<option>' + esc(a) + '</option>');
        });
        document.getElementById('goals').innerHTML = GOALS.map(function (g) {
            return '<label><input type="checkbox" name="goal" value="' + esc(g) + '">' + esc(g) + '</label>';
        }).join('');
        var schoolSel = document.getElementById('schoolSel');
        ['小学校', '中学校'].forEach(function (t) {
            schoolSel.insertAdjacentHTML('beforeend', '<optgroup label="' + t + '">' + gakko.filter(function (g) { return g.type === t; })
                .map(function (g) { return '<option value="' + esc(g.id) + '">' + esc(g.short + (t === '小学校' ? '小' : '中')) + '</option>'; }).join('') + '</optgroup>');
        });
        var counts = {};
        schools.forEach(function (s) { counts[s.category] = (counts[s.category] || 0) + 1; });
        document.getElementById('cats').innerHTML = Object.keys(CAT_GOALS).map(function (c) {
            var n = counts[c] || 0;
            return n
                ? '<label><input type="checkbox" name="cat" value="' + esc(c) + '">' + esc(c) + '（' + n + '）</label>'
                : '<label class="soon"><input type="checkbox" disabled>' + esc(c) + '（調査中）</label>';
        }).join('');
    }

    function score(s, cond) {
        if (cond.age < s.ageMin || cond.age > s.ageMax) return null;
        if (cond.cats.length && cond.cats.indexOf(s.category) < 0) return null;
        var d = km(home, [s.lat, s.lng]);
        if (d > cond.dist) return null;
        var why = [];
        var limit = cond.dist >= 99 ? 12 : cond.dist;
        var pDist = Math.max(0, 40 * (1 - d / limit));
        why.push(homeLabel + 'から約' + d.toFixed(1) + 'km');

        var pGoal = 20; // 力を選んでいないときは全教室に同じ点を与える
        if (cond.goals.length) {
            var has = CAT_GOALS[s.category] || [];
            var hit = cond.goals.filter(function (g) { return has.indexOf(g) >= 0; });
            pGoal = 40 * hit.length / cond.goals.length;
            if (hit.length) why.push(hit.join('・') + 'を育てやすいジャンル');
        }
        var done = s.interview && s.interview.status === '取材済み';
        var pInt = done ? 10 : 0;
        if (done) why.push('取材済み');
        // 口コミが30件未満の評価は母数が小さく当てにならないので点にしない
        var pRate = s.coeteco && s.coeteco.reviews >= 30 ? Math.max(0, (s.coeteco.rating - 3.5) / 1.5 * 10) : 0;
        if (pRate > 10) pRate = 10;
        return { total: Math.round(pDist + pGoal + pInt + pRate), dist: d, why: why };
    }

    function readCond() {
        return {
            age: Number(form.age.value),
            dist: Number(form.dist.value),
            goals: checked('goal'),
            cats: checked('cat')
        };
    }

    function gmaps(s) {
        return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.name + ' ' + s.address);
    }

    function render() {
        var cond = readCond();
        var list = [];
        schools.forEach(function (s) {
            var r = score(s, cond);
            if (r) list.push({ s: s, r: r });
        });
        list.sort(function (a, b) { return b.r.total - a.r.total || a.r.dist - b.r.dist; });

        document.getElementById('count').textContent = list.length
            ? '条件に合う教室 ' + list.length + '件（合う順）'
            : '条件に合う教室が見つかりません。距離を広げるか、ジャンルのしぼりを外してください。';

        document.getElementById('results').innerHTML = list.map(function (x, i) {
            var s = x.s;
            var rate = s.coeteco
                ? 'コエテコ評価 ' + s.coeteco.rating + '（' + s.coeteco.reviews + '件・' + esc(s.coeteco.scope) + '）'
                : '口コミ評価なし';
            var src = s.sources.map(function (o) {
                return '<a href="' + esc(o.url) + '" target="_blank" rel="noopener">出典：' + esc(o.label) + '</a>';
            }).join('');
            return '<li>' +
                '<div class="rank">' + (i + 1) + '</div>' +
                '<div>' +
                '<div class="r-cat">' + esc(s.category) + '｜' + esc(s.area) + '</div>' +
                '<p class="r-name">' + esc(s.name) + (s.own ? ' <span class="own">（運営者の教室）</span>' : '') + '</p>' +
                '<p class="r-meta">対象 ' + esc(s.agesText) + '｜' + rate + '｜取材：' + esc(s.interview.status) + '</p>' +
                '<p class="r-meta">' + esc(s.address) + '</p>' +
                '<p class="r-why">' + esc(x.r.why.join('／')) + '</p>' +
                '<div class="r-links"><a href="' + gmaps(s) + '" target="_blank" rel="noopener">Googleマップ</a>' + src + '</div>' +
                '</div>' +
                '<div class="r-score"><b>' + x.r.total + '</b>点' +
                '<label><input type="checkbox" class="cmp-box" value="' + esc(s.id) + '"' +
                (compare.indexOf(s.id) >= 0 ? ' checked' : '') + '> 比べる</label></div>' +
                '</li>';
        }).join('');

        drawMap(list);
    }

    function drawMap(list) {
        if (!map) return;
        layer.clearLayers();
        list.forEach(function (x, i) {
            var s = x.s;
            L.circleMarker([s.lat, s.lng], { radius: 7, color: '#0b5d4b', weight: 2, fillOpacity: .8 })
                .bindPopup('<b>' + (i + 1) + '. ' + esc(s.name) + '</b><br>' + esc(s.category) + '｜約' + x.r.dist.toFixed(1) +
                    'km<br><a href="' + gmaps(s) + '" target="_blank" rel="noopener">Googleマップで開く</a>')
                .addTo(layer);
        });
    }

    function initMap() {
        map = L.map('map').setView(home, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18, attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        layer = L.layerGroup().addTo(map);
        homeMarker = L.marker(home, { title: '自宅の位置' }).addTo(map);
        map.on('click', function (e) {
            setHome([e.latlng.lat, e.latlng.lng], '自宅');
            form.school.value = '';
            render();
        });
    }

    function factValue(s, m) {
        var f = s.facts;
        if (!f) return null;
        if (m.key === 'perHour') {
            return f.monthlyFee && f.minutesPerMonth ? Math.round(f.monthlyFee / (f.minutesPerMonth / 60)) : null;
        }
        var v = f[m.from || m.key];
        return typeof v === 'number' ? v : null;
    }

    function buildRank() {
        document.getElementById('rankMetric').innerHTML = METRICS.map(function (m, i) {
            return '<option value="' + i + '">' + esc(m.label) + '</option>';
        }).join('');
        var cats = {};
        schools.forEach(function (s) { cats[s.category] = 1; });
        Object.keys(cats).forEach(function (c) {
            document.getElementById('rankScope').insertAdjacentHTML('beforeend', '<option>' + esc(c) + '</option>');
        });
    }

    function renderRank() {
        var m = METRICS[Number(document.getElementById('rankMetric').value)];
        var scope = document.getElementById('rankScope').value;
        var list = [];
        schools.forEach(function (s) {
            if (scope && s.category !== scope) return;
            var v = factValue(s, m);
            if (v !== null) list.push({ s: s, v: v });
        });
        var note = document.getElementById('rankNote');
        var ol = document.getElementById('rankList');
        if (list.length < RANK_MIN) {
            ol.innerHTML = '';
            note.textContent = 'この範囲で数字がそろった教室は、いま' + list.length + 'つです。' + RANK_MIN +
                'つそろったらNo.1を発表します（取材が進むと増えます）。';
            return;
        }
        list.sort(function (a, b) { return (b.v - a.v) * m.dir; });
        note.textContent = '数字は取材のときに各教室から聞いた値です。教室が公開してよいと言ったものだけを載せています。';
        ol.innerHTML = list.slice(0, 10).map(function (x, i) {
            // 同じ値は同じ順位にする
            var rank = i + 1;
            while (rank > 1 && list[rank - 2].v === x.v) rank--;
            var val = m.key === 'foundedYear' ? x.v + '年' : x.v.toLocaleString() + m.unit;
            return '<li><span class="rank">' + rank + '</span>' +
                '<div><p class="r-name">' + esc(x.s.name) + (x.s.own ? ' <span class="own">（運営者の教室）</span>' : '') + '</p>' +
                '<p class="r-meta">' + esc(x.s.category) + '｜' + esc(x.s.area) + '｜' + esc(x.s.facts.date) + ' 取材時の値</p></div>' +
                '<span class="val">' + esc(val) + '</span></li>';
        }).join('');
    }

    document.getElementById('rankMetric').addEventListener('change', renderRank);
    document.getElementById('rankScope').addEventListener('change', renderRank);

    function setHome(latlng, label) {
        home = latlng;
        homeLabel = label;
        if (homeMarker) { homeMarker.setLatLng(home); map.setView(home, 14); }
    }

    function gakkoById(id) {
        return gakko.filter(function (g) { return g.id === id; })[0];
    }

    function renderGakko() {
        var order = Object.keys(AREAS);
        var list = gakko.slice().sort(function (a, b) {
            return order.indexOf(a.area) - order.indexOf(b.area) || (a.type > b.type ? 1 : a.type < b.type ? -1 : 0) || (a.id > b.id ? 1 : -1);
        });
        document.getElementById('gakkoTable').innerHTML =
            '<thead><tr><th>地域</th><th>学校</th><th>取材</th><th></th></tr></thead><tbody>' +
            list.map(function (g) {
                return '<tr><td>' + esc(g.area) + '</td><td>' + esc(g.name.replace('尼崎市立', '')) + '<br><span class="unk">' + esc(g.address.replace('兵庫県尼崎市', '')) + '</span></td>' +
                    '<td>' + esc(g.interview.status) + (g.interview.summary ? '<br>' + esc(g.interview.summary) : '') + '</td>' +
                    '<td><a href="#find" class="near" data-id="' + esc(g.id) + '">近くの習い事</a></td></tr>';
            }).join('') + '</tbody>';
    }

    document.addEventListener('click', function (e) {
        if (!e.target.classList.contains('near')) return;
        var g = gakkoById(e.target.dataset.id);
        form.school.value = g.id;
        form.area.value = g.area;
        setHome([g.lat, g.lng], g.short + (g.type === '小学校' ? '小' : '中'));
        form.dist.value = '1.5';
        render();
    });

    function renderCompare() {
        var rows = compare.map(function (id) { return schools.filter(function (s) { return s.id === id; })[0]; });
        var table = document.getElementById('cmp');
        document.getElementById('cmpHint').hidden = rows.length > 0;
        if (!rows.length) { table.innerHTML = ''; return; }
        function row(label, f) {
            return '<tr><th>' + label + '</th>' + rows.map(function (s) { return '<td>' + f(s) + '</td>'; }).join('') + '</tr>';
        }
        var unk = '<span class="unk">未確認</span>';
        table.innerHTML =
            '<thead><tr><th></th>' + rows.map(function (s) { return '<th>' + esc(s.name) + '</th>'; }).join('') + '</tr></thead><tbody>' +
            row('ジャンル', function (s) { return esc(s.category); }) +
            row('対象年齢', function (s) { return esc(s.agesText); }) +
            row('住所', function (s) { return esc(s.address); }) +
            row(homeLabel + 'から', function (s) { return '約' + km(home, [s.lat, s.lng]).toFixed(1) + 'km'; }) +
            row('育てやすい力', function (s) { return esc((CAT_GOALS[s.category] || []).join('・')); }) +
            row('口コミ評価', function (s) {
                return s.coeteco ? 'コエテコ ' + s.coeteco.rating + '（' + s.coeteco.reviews + '件・' + esc(s.coeteco.scope) + '）' : '<span class="unk">なし</span>';
            }) +
            row('月謝', function (s) { return s.price ? esc(s.price) : unk; }) +
            row('振替・体験', function (s) { return s.trial ? esc(s.trial) : unk; }) +
            row('取材', function (s) { return esc(s.interview.status) + (s.interview.summary ? '<br>' + esc(s.interview.summary) : ''); }) +
            '</tbody>';
    }

    document.addEventListener('change', function (e) {
        if (e.target.classList.contains('cmp-box')) {
            var id = e.target.value;
            if (e.target.checked) {
                if (compare.length >= 3) { e.target.checked = false; return; }
                compare.push(id);
            } else {
                compare = compare.filter(function (x) { return x !== id; });
            }
            renderCompare();
            return;
        }
        if (e.target.name === 'area') {
            setHome(AREAS[e.target.value], '自宅');
            form.school.value = '';
        }
        if (e.target.name === 'school') {
            var g = gakkoById(e.target.value);
            if (g) {
                setHome([g.lat, g.lng], g.short + (g.type === '小学校' ? '小' : '中'));
                form.area.value = g.area;
            } else {
                setHome(AREAS[form.area.value], '自宅');
            }
        }
        if (e.target.form === form && e.target.name) render();
    });

    Array.prototype.forEach.call(document.querySelectorAll('.view-switch button'), function (b) {
        b.addEventListener('click', function () {
            var toMap = b.dataset.view === 'map';
            document.querySelectorAll('.view-switch button').forEach(function (x) { x.classList.toggle('on', x === b); });
            document.getElementById('map').hidden = !toMap;
            if (toMap && !map) { initMap(); render(); }
            if (toMap) map.invalidateSize();
        });
    });

    Promise.all([fetch('data/schools.json'), fetch('data/gakko.json')])
        .then(function (rs) { return Promise.all(rs.map(function (r) { return r.json(); })); })
        .then(function (both) {
            var data = both[0];
            schools = data;
            gakko = both[1];
            renderGakko();
            var done = data.filter(function (s) { return s.interview.status === '取材済み'; }).length;
            var cats = {};
            data.forEach(function (s) { cats[s.category] = 1; });
            document.getElementById('stats').innerHTML =
                '<b>' + data.length + '</b>教室 ／ <b>' + Object.keys(cats).length + '</b>ジャンル ／ 取材済み <b>' + done + '</b>教室';
            buildForm();
            buildRank();
            render();
            renderRank();
        });
})();
