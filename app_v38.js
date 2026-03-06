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
window.realtimeCache = {};

// ID 객체 캐싱 (성능 및 코드 간결화)
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

function getGradeColor(gradeText) {
    if (!gradeText) return 'white';
    if (gradeText.includes('루비')) return '#FF4D4D';
    if (gradeText.includes('다이아')) return '#D1D5DA';
    if (gradeText.includes('자수정')) return '#A371F7';
    if (gradeText.includes('사파이어')) return '#58A6FF';
    if (gradeText.includes('에메랄드')) return '#3FB950';
    if (gradeText.includes('토파즈')) return '#D29922';
    return '#8b949e';
}

function normalizeAno(val) {
    if (!val) return "---";
    return val.toString().trim().replace(/^0+/, "") || "0";
}

async function init() {
    try {
        const cacheBuster = `cb=${Date.now()}`;
        const [rankRes, dbRes] = await Promise.all([
            fetch(`V88_FINAL_RANK_DEEP.json?${cacheBuster}`),
            fetch(`DB.json?${cacheBuster}`).catch(() => ({ ok: false }))
        ]);
        if (rankRes.ok) allData = await rankRes.json();
        if (dbRes.ok) userDetails = await dbRes.json();
        filteredData = [...allData];
        renderTable();
        els.searchInput.addEventListener('input', handleSearch);
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => sortData(th.dataset.sort));
        });
    } catch (e) { console.error("Init Error", e); }
}

function handleSearch() {
    const val = els.searchInput.value.toLowerCase();
    filteredData = allData.filter(u => {
        const rawAno = (u.userANO || u.ano || "").toString();
        const normAno = normalizeAno(rawAno);
        const nick = (u.nick || u.nickname || "").toLowerCase();
        const detail = userDetails[normAno] || {};
        const history = (detail.nickHistory || []).map(n => n.trim().toLowerCase());
        return nick.includes(val) || rawAno.includes(val) || history.some(h => h.includes(val));
    });
    currentPage = 1; renderTable();
}

function sortData(key) {
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = (key === 'rank'); }
    filteredData.sort((a, b) => {
        let va, vb;
        if (key === 'nick') { va = (a.nick || a.nickname || '').toLowerCase(); vb = (b.nick || b.nickname || '').toLowerCase(); return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va); }
        if (key === 'rank') { va = parseInt(a.RTRank || a.rank || 999, 10); vb = parseInt(b.RTRank || b.rank || 999, 10); }
        else if (key === 'wr') { va = (parseInt(a.winCount || a.win || 0, 10) / Math.max(1, parseInt(a.playCount || 1, 10))); vb = (parseInt(b.winCount || b.win || 0, 10) / Math.max(1, parseInt(b.playCount || 1, 10))); }
        else { va = a[key] || 0; vb = b[key] || 0; }
        return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    currentPage = 1; renderTable();
}

function renderTable() {
    const start = (currentPage - 1) * pageSize;
    const pageData = filteredData.slice(start, start + pageSize);
    els.rankingBody.innerHTML = pageData.map(u => {
        const ano = u.userANO || u.ano;
        const nick = u.nick || u.nickname || "Unknown";
        const grade = u.gradeName || u.grade || "---";
        const win = parseInt(u.winCount || u.win || 0, 10);
        const loss = parseInt(u.loseCount || u.lose || 0, 10);
        const wr = (win + loss) > 0 ? ((win / (win + loss)) * 100).toFixed(1) : 0;
        const rank = u.RTRank || u.rank || "---";
        const dbInfo = userDetails[normalizeAno(ano)] || {};
        const charList = u.characterList || dbInfo.characterList || [];
        const heroIcons = charList.slice(0, 7).map(c => `<img src="img_hero/${c.characterNo || c}.png" class="hero-mini-icon" onerror="this.src='img_hero/nop.png'">`).join('');
        return `<tr onclick="selectUser('${ano}')"><td>${rank}</td><td>${nick}</td><td><div class="hero-icons-container">${heroIcons}</div></td><td style="color:${getGradeColor(grade)}">${grade}</td><td><span style="color:#238636">${win}승</span> <span style="color:#da3633">${loss}패</span> <span class="win-rate-pill">${wr}%</span></td><td style="color:#58A6FF">${ano}</td></tr>`;
    }).join('');
    renderPagination();
}

function renderPagination() {
    const pages = Math.ceil(filteredData.length / pageSize);
    let html = ''; if (pages > 1) { for (let i = 1; i <= Math.min(pages, 10); i++) { html += `<button onclick="goToPage(${i})" class="pg-btn ${i === currentPage ? 'active' : ''}">${i}</button>`; } }
    if (els.pagination) els.pagination.innerHTML = html;
    if (els.paginationTop) els.paginationTop.innerHTML = html;
}

window.goToPage = (p) => { currentPage = parseInt(p, 10); renderTable(); };

// 상세 유저 선택 함수 (완전히 보호된 로직)
async function selectUser(ano) {
    try {
        const normAno = normalizeAno(ano);
        const user = allData.find(u => normalizeAno(u.userANO || u.ano) === normAno);
        const detail = userDetails[normAno] || {};
        const basic = detail.basicInfo || {};

        if (!user) return;

        // [핵심] 닉네임 및 전닉 처리
        const currentNick = user.nick || user.nickname || 'Unknown';
        const nHistory = (detail.nickHistory || []).map(n => n.trim()).filter(n => n && n !== 'Unknown' && n !== currentNick);
        const prevNicks = nHistory.length > 0 ? Array.from(new Set(nHistory)).join(', ') : '';

        // UI 상단 반영
        els.nickname.innerText = `닉네임: ${currentNick}${prevNicks ? ' (전: ' + prevNicks + ')' : ''}`;
        els.ano.innerText = `ANO: ${user.userANO || user.ano || ano}`;
        els.grade.innerText = `등급: ${user.gradeName || user.grade || '---'} ${user.gradeLevel || ''}`;
        els.grade.style.color = getGradeColor(user.gradeName || user.grade);
        els.rank.innerText = `${user.RTRank || user.rank || '---'}위`;

        // 왼쪽 상세 패널 반영
        els.stats.nick.innerText = currentNick;
        els.stats.prevNicks.innerText = prevNicks || '---';
        els.stats.anoVal.innerText = user.userANO || user.ano || ano;

        // 전적 데이터 안전 추출
        const swl = detail.rank_season_wl || {};
        const win = parseInt(user.winCount || user.win || swl.totalWinCount || 0, 10);
        const loss = parseInt(user.loseCount || user.lose || swl.totalLoseCount || 0, 10);
        const play = parseInt(user.playCount || swl.playCount || (win + loss) || 1, 10);
        const wr = user.winRate || swl.totalWinRate || Math.round((win / play) * 100);

        els.stats.seasonRec.innerHTML = `${play}전 <span style="color:#238636">${win}승</span> <span style="color:#da3633">${loss}패</span> (${wr}%)`;
        els.seasonWr.innerText = `${wr}%`;

        // 기여도 및 평균 데이터
        els.stats.totalCont.innerText = (basic.totalContribution || user.totalContribute || 0).toLocaleString();
        els.stats.combatCont.innerText = (basic.combatContribution || user.combatContributeAvg || 0).toLocaleString();
        els.stats.combatRate.innerText = `${basic.battleJoinRate || user.combatRate || 0}%`;
        els.stats.avgLv.innerText = `Lv.${basic.averageCharacterLevel || user.avgLevel || 0}`;
        els.stats.kda.innerText = (user.killDieAssistRate || detail.kda || 0).toFixed(2);
        els.stats.avgGold.innerText = (basic.averageGetGold || user.avgGold || 0).toLocaleString();

        // 실시간 랭대 전적 fetch
        els.stats.totalRec.innerHTML = '<span style="color:#888">확인 중...</span>';
        const WORKER = 'https://script.google.com/macros/s/AKfycby1H2PVEMbzf_cd80ua8UFhni3ZbITnIcuOpU9yCLNt4QrKh-2GeRsOGvZMqShkgqg5/exec';
        fetch(`${WORKER}?ano=${normAno}`).then(r => r.text()).then(txt => {
            const first = txt.indexOf('{'), last = txt.lastIndexOf('}');
            if (first !== -1 && last !== -1) {
                const json = JSON.parse(txt.substring(first, last + 1).replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:\s*'([^']*)'/g, ':"$1"').replace(/,\s*([\]\}])/g, '$1'));
                const tw = json.winLoseTendency?.totalWinCount || 0, tl = json.winLoseTendency?.totalLoseCount || 0, tc = json.winLoseTendency?.consecutiveWinLose || 0;
                els.stats.totalRec.innerHTML = `${tw + tl}전 ${tw}승 ${tl}패 (${Math.round(tw / (tw + tl || 1) * 100)}%)`;
                els.stats.consecutive.innerHTML = tc > 0 ? `${tc}연승` : (tc < 0 ? `${Math.abs(tc)}연패` : '---');
            }
        }).catch(() => {
            els.stats.totalRec.innerHTML = '---';
            els.stats.consecutive.innerText = '---';
        });

        // 영웅 리스트
        const hList = detail.characterList || user.characterList || [];
        els.heroList.innerHTML = `<div style="display:grid; grid-template-columns: repeat(8, 34px); gap:8px;">${hList.slice(0, 16).map(h => `<img src="img_hero/${h.characterNo || h}.png" class="hero-mini-icon" style="width:34px; height:34px;" onerror="this.src='img_hero/nop.png'">`).join('')}</div>`;

    } catch (e) { console.error("Select Error", e); }
}

init();
