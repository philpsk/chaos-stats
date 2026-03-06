const HERO_MAP = {
    "111117": "가토가챠", "111106": "갈리토스", "311104": "구르르", "112212": "노엘", "112202": "다래",
    "111103": "두발카인", "111119": "드레이번", "113214": "디지", "312102": "레오닉", "113205": "레이나",
    "312203": "레이든", "311102": "렉터", "113203": "로칸", "312207": "리키안", "111101": "마르쿠스",
    "112101": "마젠다", "113209": "메이릴", "113212": "멜쉬드", "311201": "브로켄", "112213": "브리짓",
    "113215": "비글랭", "113210": "샤아라", "112103": "샤카-잔", "112209": "샤피나", "312201": "세레나",
    "112105": "셰릴", "111105": "스톤콜드", "112208": "스푸키", "112204": "실크", "112203": "아그네스",
    "112201": "에델린", "113207": "이레아", "112206": "제르딘", "112108": "진", "111107": "챈",
    "313205": "카쟈드", "311108": "칸젤", "111114": "코포리", "111118": "쿠아다", "111113": "쿤카",
    "311103": "킹죠", "111104": "탈론", "112207": "티리아", "113201": "프로드", "113211": "호른달",
    "413208": "나즈", "213210": "나카챠", "211106": "네파-툼", "213202": "니바스", "411111": "니피",
    "211202": "닐스", "211114": "듀라한", "211115": "라그나", "211112": "라데스", "211117": "라우부",
    "213212": "레이첼", "212101": "레퍼드", "213211": "로로키둘", "212208": "로자미어", "213207": "루시퍼",
    "211111": "멀머던", "213206": "메두사", "211101": "뮤턴트", "212204": "바이퍼", "211113": "베헤모스",
    "212103": "벨제뷔트", "411112": "세드릭", "211105": "세티어", "211116": "솔 배드가이", "211110": "솔-벤-하임",
    "212205": "아그니 형제", "212202": "아카샤", "213208": "아키로", "213201": "악동", "412102": "알카라스",
    "413204": "엘딘", "411102": "엘시드", "213204": "오블리", "413202": "자이로스", "212107": "자카리어스",
    "212106": "잼", "412104": "적혈귀", "212210": "칼리", "211109": "코르포스", "412205": "테르시아",
    "212105": "트리키", "211203": "파고", "413206": "페르다", "213209": "플루토", "213203": "헤르쥬나"
};

let allData = [];
let userDetails = {};
let filteredData = [];
let currentPage = 1;
const pageSize = 50;
let sortKey = 'rank';
let sortAsc = true;

// 유틸리티 함수
function getGradeColor(grade) {
    if (!grade) return '#8b949e';
    const g = grade.toString();
    if (g.includes('루비')) return '#FF4D4D';
    if (g.includes('다이아')) return '#D1D5DA';
    if (g.includes('자수정')) return '#A371F7';
    if (g.includes('사파이어')) return '#58A6FF';
    if (g.includes('에메랄드')) return '#3FB950';
    if (g.includes('토파즈')) return '#D29922';
    return '#8b949e';
}

function normalizeAno(val) {
    if (!val) return "";
    return val.toString().trim().replace(/^0+/, "") || "0";
}

// 엘리먼트 캐시
const els = {
    nickname: document.getElementById('user-nickname'),
    ano: document.getElementById('user-ano'),
    grade: document.getElementById('user-grade'),
    rank: document.getElementById('user-rank'),
    rankingBody: document.getElementById('ranking-body'),
    searchInput: document.getElementById('search-input'),
    stats: {
        totalRec: document.getElementById('stat-total-rec'),
        nick: document.getElementById('stat-nick'),
        prevNicks: document.getElementById('stat-prev-nicks'),
        anoVal: document.getElementById('stat-ano-val'),
        seasonRec: document.getElementById('stat-season-rec'),
        consecutive: document.getElementById('stat-consecutive'),
        totalCont: document.getElementById('stat-total-cont'),
        combatCont: document.getElementById('stat-combat-cont'),
        combatRate: document.getElementById('stat-combat-rate'),
        kda: document.getElementById('stat-kda'),
        avgLv: document.getElementById('stat-avg-lv'),
        avgDispell: document.getElementById('stat-avg-dispell'),
        avgPotion: document.getElementById('stat-avg-potion'),
        avgGold: document.getElementById('stat-avg-gold')
    },
    seasonWr: document.getElementById('user-season-wr'),
    heroList: document.getElementById('hero-list'),
    pagination: document.getElementById('pagination'),
    paginationTop: document.getElementById('pagination-top')
};

async function init() {
    try {
        const cb = `cb=${Date.now()}`;
        const [r1, r2] = await Promise.all([
            fetch(`V88_FINAL_RANK_DEEP.json?${cb}`),
            fetch(`DB.json?${cb}`).catch(() => ({ ok: false }))
        ]);
        if (r1.ok) allData = await r1.json();
        if (r2.ok) userDetails = await r2.json();
        filteredData = [...allData];
        renderTable();
        els.searchInput.addEventListener('input', handleSearch);
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => sortData(th.dataset.sort));
        });
    } catch (e) { console.error(e); }
}

function handleSearch() {
    const v = els.searchInput.value.toLowerCase();
    filteredData = allData.filter(u => {
        const nick = (u.nick || u.nickname || "").toLowerCase();
        const ano = (u.userANO || u.ano || "").toString();
        const norm = normalizeAno(ano);
        const detail = userDetails[norm] || {};
        const history = (detail.nickHistory || []).map(n => n.trim().toLowerCase());
        return nick.includes(v) || ano.includes(v) || history.some(h => h.includes(v));
    });
    currentPage = 1; renderTable();
}

function sortData(key) {
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = (key === 'rank'); }
    filteredData.sort((a, b) => {
        let va = a[key] || 0, vb = b[key] || 0;
        if (key === 'rank') { va = parseInt(a.RTRank || a.rank || 999, 10); vb = parseInt(b.RTRank || b.rank || 999, 10); }
        if (key === 'nick') { va = (a.nick || a.nickname || "").toLowerCase(); vb = (b.nick || b.nickname || "").toLowerCase(); return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va); }
        return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    currentPage = 1; renderTable();
}

function renderTable() {
    const start = (currentPage - 1) * pageSize;
    const pageData = filteredData.slice(start, start + pageSize);
    els.rankingBody.innerHTML = pageData.map(u => {
        const ano = u.userANO || u.ano;
        const norm = normalizeAno(ano);
        const nick = u.nick || u.nickname || "Unknown";
        const grade = u.gradeName || u.grade || "---";
        const win = parseInt(u.winCount || u.win || 0, 10);
        const loss = parseInt(u.loseCount || u.lose || 0, 10);
        const wr = (win + loss) > 0 ? ((win / (win + loss)) * 100).toFixed(1) : 0;
        const rank = u.RTRank || u.rank || "---";
        const detail = userDetails[norm] || {};
        const heroes = u.characterList || detail.characterList || [];
        const icons = heroes.slice(0, 7).map(c => `<img src="img_hero/${c.characterNo || c}.png" class="hero-mini-icon" onerror="this.src='img_hero/nop.png'">`).join('');
        return `<tr onclick="selectUser('${ano}')"><td>${rank}</td><td>${nick}</td><td><div class="hero-icons-container">${icons}</div></td><td style="color:${getGradeColor(grade)}">${grade}</td><td><span style="color:#238636">${win}승</span> <span style="color:#da3633">${loss}패</span> <span class="win-rate-pill">${wr}%</span></td><td style="color:#58A6FF">${ano}</td></tr>`;
    }).join('');
    renderPagination();
}

function renderPagination() {
    const total = Math.ceil(filteredData.length / pageSize);
    let h = ''; if (total > 1) { for (let i = 1; i <= Math.min(total, 10); i++) h += `<button onclick="goToPage(${i})" class="pg-btn ${i === currentPage ? 'active' : ''}">${i}</button>`; }
    if (els.pagination) els.pagination.innerHTML = h;
    if (els.paginationTop) els.paginationTop.innerHTML = h;
}

window.goToPage = (p) => { currentPage = parseInt(p, 10); renderTable(); };

// [FINAL] 상세 정보 표시용 단일화된 필드 추출기
function safeVal(obj, keys) {
    if (!obj) return 0;
    for (let k of keys) {
        if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
    }
    return 0;
}

async function selectUser(ano) {
    try {
        const norm = normalizeAno(ano);
        const user = allData.find(u => normalizeAno(u.userANO || u.ano) === norm);
        const detail = userDetails[norm] || {};
        const basic = detail.basicInfo || {};
        const swl = detail.rank_season_wl || {};

        if (!user) return;

        // 1. 닉네임 및 이전 닉네임 (가장 중요)
        const curNick = user.nick || user.nickname || "Unknown";
        const nHistory = (detail.nickHistory || []).map(n => n.trim()).filter(n => n && n !== "Unknown" && n !== curNick);
        const uniqueHistory = [];
        nHistory.forEach(n => { if (!uniqueHistory.includes(n)) uniqueHistory.push(n); });
        const prevText = uniqueHistory.length > 0 ? " (전: " + uniqueHistory.join(", ") + ")" : "";

        // UI 상단 즉시 반영 (하나도 안 뜨는 문제 방지 위해 innerText 직접 할당)
        els.nickname.innerText = "닉네임: " + curNick + prevText;
        els.ano.innerText = "ANO: " + (user.userANO || user.ano || ano);
        els.grade.innerText = "등급: " + (user.gradeName || user.grade || "---") + " " + (user.gradeLevel || "");
        els.grade.style.color = getGradeColor(user.gradeName || user.grade);
        els.rank.innerText = (user.RTRank || user.rank || "---") + "위";

        // 2. 패널 정보 (왼쪽)
        els.stats.nick.innerText = curNick;
        els.stats.prevNicks.innerText = uniqueHistory.join(", ") || "---";
        els.stats.anoVal.innerText = (user.userANO || user.ano || ano);

        // 3. 전적 계산
        const w = parseInt(safeVal(user, ['winCount', 'win', 'WinCount']) || swl.totalWinCount || 0, 10);
        const l = parseInt(safeVal(user, ['loseCount', 'lose', 'LoseCount']) || swl.totalLoseCount || 0, 10);
        const p = parseInt(safeVal(user, ['playCount', 'PlayCount']) || swl.playCount || (w + l) || 1, 10);
        const wr = safeVal(user, ['winRate', 'WinRate_InclDisc']) || swl.totalWinRate || Math.round((w / p) * 100);

        els.stats.seasonRec.innerHTML = p + "전 <span style='color:#238636'>" + w + "승</span> <span style='color:#da3633'>" + l + "패</span> (" + wr + "%)";
        els.seasonWr.innerText = wr + "%";

        // 4. 상세 수치
        els.stats.totalCont.innerText = Number(safeVal(basic, ['totalContribution']) || safeVal(user, ['totalContribute', 'avgContribute']) || 0).toLocaleString();
        els.stats.combatCont.innerText = Number(safeVal(basic, ['combatContribution']) || safeVal(user, ['combatContributeAvg']) || 0).toLocaleString();
        els.stats.combatRate.innerText = (safeVal(basic, ['battleJoinRate']) || safeVal(user, ['combatRateAvg', 'combatRate']) || 0) + "%";
        els.stats.avgLv.innerText = "Lv." + (safeVal(basic, ['averageCharacterLevel']) || safeVal(user, ['lastLevelAvg', 'avgLevel']) || 0);
        els.stats.kda.innerText = Number(safeVal(user, ['killDieAssistRate']) || detail.kda || 0).toFixed(2);
        els.stats.avgGold.innerText = Number(safeVal(basic, ['averageGetGold']) || safeVal(user, ['totalGoldAvg', 'avgGold']) || 0).toLocaleString();

        // 5. 실시간 랭대 (구글 프록시)
        els.stats.totalRec.innerHTML = "<span style='color:#888'>조회 중...</span>";
        els.stats.consecutive.innerText = "---";

        const worker = "https://script.google.com/macros/s/AKfycby1H2PVEMbzf_cd80ua8UFhni3ZbITnIcuOpU9yCLNt4QrKh-2GeRsOGvZMqShkgqg5/exec";
        fetch(worker + "?ano=" + norm).then(r => r.text()).then(t => {
            const f = t.indexOf("{"), l = t.lastIndexOf("}");
            if (f !== -1 && l !== -1) {
                const j = JSON.parse(t.substring(f, l + 1).replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:\s*'([^']*)'/g, ':"$1"').replace(/,\s*([\]\}])/g, '$1'));
                const tw = j.winLoseTendency?.totalWinCount || 0, tl = j.winLoseTendency?.totalLoseCount || 0, tc = j.winLoseTendency?.consecutiveWinLose || 0;
                els.stats.totalRec.innerHTML = (tw + tl) + "전 " + tw + "승 " + tl + "패 (" + Math.round(tw / (tw + tl || 1) * 100) + "%)";
                els.stats.consecutive.innerHTML = tc > 0 ? "<span style='color:#3FB950'>" + tc + "연승</span>" : (tc < 0 ? "<span style='color:#FF4D4D'>" + Math.abs(tc) + "연패</span>" : "---");
            }
        }).catch(() => { els.stats.totalRec.innerHTML = "조회 실패"; });

        // 6. 영웅 목록
        const h = u.characterList || detail.characterList || [];
        els.heroList.innerHTML = "<div style='display:grid; grid-template-columns: repeat(8, 34px); gap:8px;'>" + h.slice(0, 16).map(c => `<img src="img_hero/${c.characterNo || c}.png" class="hero-mini-icon" style="width:34px; height:34px;" onerror="this.src='img_hero/nop.png'">`).join('') + "</div>";

    } catch (e) { console.error(e); }
}

init();
