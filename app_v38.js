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
    const g = String(grade);
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

// 안전한 엘리먼트 값 설정 함수 (null 에러 방지)
function updateText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}
function updateHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}
function updateColor(id, color) {
    const el = document.getElementById(id);
    if (el) el.style.color = color;
}

// 필드 추출기
function findVal(obj, keys) {
    if (!obj) return null;
    for (let k of keys) {
        if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
    }
    return null;
}

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
        document.getElementById('search-input')?.addEventListener('input', handleSearch);
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => sortData(th.dataset.sort));
        });
    } catch (e) {
        console.error("Init failed", e);
    }
}

function handleSearch() {
    const v = document.getElementById('search-input')?.value.toLowerCase() || "";
    filteredData = allData.filter(u => {
        const nick = (u.nick || u.nickname || "").toLowerCase();
        const ano = (u.userANO || u.ano || "").toString();
        const norm = normalizeAno(ano);
        const detail = userDetails[norm] || {};
        const history = (detail.nickHistory || []).map(n => String(n).trim().toLowerCase());
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
    const body = document.getElementById('ranking-body');
    if (!body) return;
    body.innerHTML = pageData.map(u => {
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
    updateHtml('pagination', h);
    updateHtml('pagination-top', h);
}

window.goToPage = (p) => { currentPage = parseInt(p, 10); renderTable(); };

// [FINAL] 상세 정보 표시용 함수 (극강의 안정성)
async function selectUser(ano) {
    const norm = normalizeAno(ano);
    const user = allData.find(u => normalizeAno(u.userANO || u.ano) === norm);
    const detail = userDetails[norm] || {};
    const basic = detail.basicInfo || {};
    const swl = detail.rank_season_wl || {};

    if (!user) return;

    // 1. 헤더 정보 업데이트 (Try-Catch로 보호)
    try {
        const curNick = user.nick || user.nickname || "Unknown";
        const nHistory = (detail.nickHistory || []).map(n => String(n).trim()).filter(n => n && n !== "Unknown" && n !== curNick);
        const unique = [...new Set(nHistory)];
        const prevText = unique.length > 0 ? ` (전: ${unique.join(', ')})` : "";

        updateText('user-nickname', `닉네임: ${curNick}${prevText}`);
        updateText('user-ano', `ANO: ${user.userANO || user.ano || ano}`);
        updateText('user-grade', `등급: ${user.gradeName || user.grade || '---'} ${user.gradeLevel || ''}`);
        updateColor('user-grade', getGradeColor(user.gradeName || user.grade));
        updateText('user-rank', `${user.RTRank || user.rank || '---'}위`);

        // 왼쪽 패널 상단
        updateText('stat-nick', curNick);
        updateText('stat-prev-nicks', unique.join(', ') || '---');
        updateText('stat-ano-val', user.userANO || user.ano || ano);
    } catch (e) { console.error("Header update error", e); }

    // 2. 전적 정보 업데이트
    try {
        const w = parseInt(findVal(user, ['winCount', 'win', 'WinCount']) || swl.totalWinCount || 0, 10);
        const l = parseInt(findVal(user, ['loseCount', 'lose', 'LoseCount']) || swl.totalLoseCount || 0, 10);
        const p = parseInt(findVal(user, ['playCount', 'PlayCount']) || swl.playCount || (w + l) || 1, 10);
        const wr = findVal(user, ['winRate', 'WinRate_InclDisc']) || swl.totalWinRate || Math.round((w / p) * 100);

        updateHtml('stat-season-rec', `${p}전 <span style="color:#238636">${w}승</span> <span style="color:#da3633">${l}패</span> (${wr}%)`);
        updateText('user-season-wr', `${wr}%`);
    } catch (e) { console.error("Record update error", e); }

    // 3. 기여도 및 세부 수치
    try {
        const tc = findVal(basic, ['totalContribution']) || findVal(user, ['totalContribute', 'avgContribute']) || 0;
        const cc = findVal(basic, ['combatContribution']) || findVal(user, ['combatContributeAvg']) || 0;
        const cr = findVal(basic, ['battleJoinRate']) || findVal(user, ['combatRateAvg', 'combatRate']) || 0;
        const lv = findVal(basic, ['averageCharacterLevel']) || findVal(user, ['lastLevelAvg', 'avgLevel']) || 0;
        const kda = findVal(user, ['killDieAssistRate']) || detail.kda || 0;
        const gold = findVal(basic, ['averageGetGold']) || findVal(user, ['totalGoldAvg', 'avgGold']) || 0;

        updateText('stat-total-cont', Number(tc).toLocaleString());
        updateText('stat-combat-cont', Number(cc).toLocaleString());
        updateText('stat-combat-rate', `${cr}%`);
        updateText('stat-avg-lv', `Lv.${lv}`);
        updateText('stat-kda', Number(kda).toFixed(2));
        updateText('stat-avg-gold', Number(gold).toLocaleString());
    } catch (e) { console.error("Stats update error", e); }

    // 4. 실시간 조회
    try {
        updateHtml('stat-total-rec', '<span style="color:#888">확인 중...</span>');
        updateText('stat-consecutive', "---");
        const worker = "https://script.google.com/macros/s/AKfycby1H2PVEMbzf_cd80ua8UFhni3ZbITnIcuOpU9yCLNt4QrKh-2GeRsOGvZMqShkgqg5/exec";
        fetch(`${worker}?ano=${norm}`).then(r => r.text()).then(t => {
            const f = t.indexOf("{"), l = t.lastIndexOf("}");
            if (f !== -1 && l !== -1) {
                const j = JSON.parse(t.substring(f, l + 1).replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:\s*'([^']*)'/g, ':"$1"').replace(/,\s*([\]\}])/g, '$1'));
                const tw = j.winLoseTendency?.totalWinCount || 0, tl = j.winLoseTendency?.totalLoseCount || 0, tc = j.winLoseTendency?.consecutiveWinLose || 0;
                updateHtml('stat-total-rec', `${tw + tl}전 ${tw}승 ${tl}패 (${Math.round(tw / (tw + tl || 1) * 100)}%)`);
                updateHtml('stat-consecutive', tc > 0 ? `<span style="color:#3FB950">${tc}연승</span>` : (tc < 0 ? `<span style="color:#FF4D4D">${Math.abs(tc)}연패</span>` : "---"));
            }
        }).catch(() => { updateText('stat-total-rec', '조회 실패'); });
    } catch (e) { }

    // 5. 영웅 리스트
    try {
        const h = u.characterList || detail.characterList || [];
        updateHtml('hero-list', `<div style="display:grid; grid-template-columns: repeat(8, 34px); gap:8px;">${h.slice(0, 16).map(c => `<img src="img_hero/${c.characterNo || c}.png" class="hero-mini-icon" style="width:34px; height:34px;" onerror="this.src='img_hero/nop.png'">`).join('')}</div>`);
    } catch (e) { }
}

init();
