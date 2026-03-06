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

function getGradeColor(gradeText) {
    if (!gradeText) return 'white';
    if (gradeText.includes('다이아몬드')) return '#D1D5DA'; // Silver
    if (gradeText.includes('루비')) return '#FF4D4D'; // Red
    if (gradeText.includes('자수정')) return '#A371F7'; // Purple
    if (gradeText.includes('사파이어')) return '#58A6FF'; // Blue
    if (gradeText.includes('에메랄드')) return '#3FB950'; // Green
    if (gradeText.includes('토파즈')) return '#D29922'; // Orange
    return 'white';
}

// ANO 정규화: 앞자리의 '0'을 제거하여 DB.json의 키와 일치시킴
function normalizeAno(val) {
    if (!val) return "---";
    const s = val.toString().trim();
    if (s === "---") return "---";
    return s.replace(/^0+/, "") || "0";
}

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
    paginationTop: document.getElementById('pagination-top'),
    totalCount: document.getElementById('total-count')
};

const GAME_API = 'http://www.chaosonline.co.kr:8081/ClientJson/RecordInfo.aspx';

function collectAllObjects(obj, results = []) {
    if (!obj || typeof obj !== 'object' || results.includes(obj)) return results;
    results.push(obj);
    if (Array.isArray(obj)) {
        for (const i of obj) collectAllObjects(i, results);
    } else {
        for (const v of Object.values(obj)) {
            if (v && typeof v === 'object') collectAllObjects(v, results);
        }
    }
    return results;
}

async function init() {
    console.log("Dashboard Init Starting...");
    const loadingMsg = "데이터를 불러오는 중입니다...";
    if (els.rankingBody) els.rankingBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px;">${loadingMsg}</td></tr>`;

    try {
        const cacheBuster = `cb=${Date.now()}`;
        const [rankRes, dbRes] = await Promise.all([
            fetch(`V88_FINAL_RANK_DEEP.json?${cacheBuster}`).catch(err => {
                console.error("Rank JSON Fetch Error:", err);
                return { ok: false };
            }),
            fetch(`DB.json?${cacheBuster}`).catch(err => {
                console.error("DB JSON Fetch Error:", err);
                return { ok: false };
            })
        ]);

        if (rankRes && rankRes.ok) {
            allData = await rankRes.json();
        } else {
            throw new Error("데이터 파일이 로드되지 않았습니다.");
        }

        if (dbRes && dbRes.ok) {
            userDetails = await dbRes.json();
        }

        filteredData = [...allData];
        renderTable();
        els.searchInput.addEventListener('input', handleSearch);
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => sortData(th.dataset.sort));
        });
    } catch (err) { console.error("Data load failed:", err); }
}

function handleSearch() {
    const val = els.searchInput.value.toLowerCase();
    filteredData = allData.filter(u => {
        const rawAno = (u.userANO || u.ano || "").toString();
        const normAno = normalizeAno(rawAno);
        const nick = (u.nick || u.nickname || "").toLowerCase();
        const detail = userDetails[normAno] || {};
        const history = (detail.nickHistory || []).map(n => n.toLowerCase());
        return nick.includes(val) || rawAno.includes(val) || normAno.includes(val) || history.some(h => h.includes(val));
    });
    currentPage = 1;
    renderTable();
}

function sortData(key) {
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = key === 'rank'; }
    const gradeOrder = ['다이아몬드 1', '루비 1', '자수정 1', '사파이어 1', '에메랄드 1', '토파즈 1'];
    filteredData.sort((a, b) => {
        let va, vb;
        if (key === 'rank') { va = parseInt(a.RTRank || a.rank || 9999, 10); vb = parseInt(b.RTRank || b.rank || 9999, 10); }
        else if (key === 'grade') { va = gradeOrder.findIndex(g => (a.gradeName || a.grade || '').includes(g.split(' ')[0])); vb = gradeOrder.findIndex(g => (b.gradeName || b.grade || '').includes(g.split(' ')[0])); if (va === -1) va = 99; if (vb === -1) vb = 99; }
        else if (key === 'wr') { const wA = parseInt(a.winCount || a.win || a.WinCount || 0, 10); const lA = parseInt(a.loseCount || a.lose || a.LoseCount || 0, 10); const wB = parseInt(b.winCount || b.win || b.WinCount || 0, 10); const lB = parseInt(b.loseCount || b.lose || b.LoseCount || 0, 10); va = (wA + lA) > 0 ? (wA / (wA + lA)) : 0; vb = (wB + lB) > 0 ? (wB / (wB + lB)) : 0; }
        else if (key === 'nick') { va = (a.nick || a.nickname || '').toLowerCase(); vb = (b.nick || b.nickname || '').toLowerCase(); return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va); }
        return sortAsc ? va - vb : vb - va;
    });
    currentPage = 1;
    renderTable();
}

function renderTable() {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = filteredData.slice(start, end);
    els.rankingBody.innerHTML = pageData.map(u => {
        const ano = u.userANO || u.ano;
        const nick = u.nick || u.nickname || "Unknown";
        const grade = u.gradeName || u.grade || "---";
        const win = parseInt(u.winCount || u.win || u.WinCount || 0, 10);
        const loss = parseInt(u.loseCount || u.lose || u.LoseCount || 0, 10);
        const wr = (win + loss) > 0 ? ((win / (win + loss)) * 100).toFixed(1) : 0;
        const rank = u.RTRank || u.rank || "---";
        const dbInfo = userDetails[normalizeAno(ano)] || {};
        const charList = u.characterList || dbInfo.characterList || [];
        const heroIconsHtml = charList.slice(0, 7).map(c => { const cNo = c.characterNo || c; return `<img src="img_hero/${cNo}.png" class="hero-mini-icon" onerror="this.src='img_hero/nop.png'">`; }).join('');
        return `<tr onclick="selectUser('${ano}')"><td>${rank}</td><td>${nick}</td><td><div class="hero-icons-container">${heroIconsHtml}</div></td><td style="color: ${getGradeColor(grade)}; padding-left:20px">${grade}</td><td><span style="color: #238636">${win}승</span> <span style="color: #da3633">${loss}패</span> <span class="win-rate-pill">${wr}%</span></td><td style="color: #58A6FF">${ano}</td></tr>`;
    }).join('');
    renderPagination();
}

function formatWLMerged(items) {
    if (!Array.isArray(items)) items = [items];
    let data = { win: 0, loss: 0, draw: 0, pc: 0, wr: 0, con: 0 };
    let foundAny = false;
    for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const w = parseInt(item.winCount || item.totalWinCount || item.WinCount || item.win || 0, 10);
        const l = parseInt(item.loseCount || item.totalLoseCount || item.LoseCount || item.lose || 0, 10);
        const p = parseInt(item.playCount || item.PlayCount || item.playcount || 0, 10);
        const c = parseInt(item.consecutiveWinLose || item.con_winlose || 0, 10);
        if (w > 0 || l > 0 || p > 0) { data.win = Math.max(data.win, w); data.loss = Math.max(data.loss, l); data.pc = Math.max(data.pc, p, w + l); foundAny = true; }
        if (c !== 0) data.con = c;
    }
    if (!foundAny && data.con === 0) return null;
    const wr = (data.pc > 0) ? Math.round((data.win / data.pc) * 100) : 0;
    let conStr = data.con > 0 ? `${data.con}연승` : (data.con < 0 ? `${Math.abs(data.con)}연패` : "---");
    return `${data.pc.toLocaleString()}전 <span style="color:#238636">${data.win.toLocaleString()}승</span> <span style="color:#da3633">${data.loss.toLocaleString()}패</span> (${wr}%) | ${conStr}`;
}

async function fetchAllRecord(ano, rawAno) {
    const targetAno = String(rawAno || ano);
    const parseChaosJson = (rawContent) => {
        if (!rawContent) return null;
        let text = rawContent.trim();
        if (text.includes('window.RecordInfo')) { text = text.substring(text.indexOf('=') + 1).trim(); if (text.endsWith(';')) text = text.substring(0, text.length - 1); }
        const firstBrace = text.indexOf('{'); const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) text = text.substring(firstBrace, lastBrace + 1);
        try { const fixed = text.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:\s*'([^']*)'/g, ':"$1"').replace(/,\s*([\]\}])/g, '$1'); return JSON.parse(fixed); }
        catch (e) { try { return eval('(' + text + ')'); } catch (e2) { return null; } }
    };
    const WORKER_URL = 'https://script.google.com/macros/s/AKfycby1H2PVEMbzf_cd80ua8UFhni3ZbITnIcuOpU9yCLNt4QrKh-2GeRsOGvZMqShkgqg5/exec';
    try {
        const res = await fetch(`${WORKER_URL}?ano=${targetAno}`, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
            const content = await res.text();
            const parsed = parseChaosJson(content);
            if (parsed) return formatWLMerged(collectAllObjects(parsed));
        }
    } catch (e) { console.error("Real-time fetch failed"); }
    return null;
}

async function selectUser(ano) {
    const normAno = normalizeAno(ano);
    const user = allData.find(u => normalizeAno(u.userANO || u.ano) === normAno);
    const detail = userDetails[normAno] || {};
    const basic = detail.basicInfo || {};

    if (user) {
        const currentNick = user.nick || user.nickname || user.Nickname || 'Unknown';
        const nicks = detail.nickHistory || [];
        const prevNicksList = nicks.filter(n => n && n !== 'Unknown' && n !== '---' && n.toLowerCase() !== currentNick.toLowerCase());

        els.nickname.innerText = `닉네임: ${currentNick}${prevNicksList.length > 0 ? ' (전: ' + prevNicksList.join(', ') + ')' : ''}`;
        const displayAno = user.userANO || user.ano || ano;
        els.ano.innerText = `ANO: ${displayAno}`;
        els.grade.innerText = `등급: ${user.gradeName || user.grade || '---'} ${user.gradeLevel || ''}`;
        els.grade.style.color = getGradeColor(user.gradeName || user.grade);
        els.rank.innerText = `${user.RTRank || user.rank || '---'}위`;

        els.stats.nick.innerText = currentNick;
        els.stats.prevNicks.innerText = prevNicksList.length > 0 ? prevNicksList.join(', ') : '---';
        els.stats.anoVal.innerText = displayAno;

        const getVal = (obj, keys) => { if (!obj) return null; for (let k of keys) { if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k]; } return null; };
        const swlArr = [user, detail.rank_season_wl || {}, detail.winLoseTendency || {}];
        let swin = 0, sloss = 0, spc = 0;
        for (let base of swlArr) {
            const w = parseInt(getVal(base, ['winCount', 'win', 'WinCount', 'totalWinCount']) || 0, 10);
            const l = parseInt(getVal(base, ['loseCount', 'lose', 'LoseCount', 'totalLoseCount']) || 0, 10);
            const p = parseInt(getVal(base, ['playCount', 'PlayCount']) || 0, 10);
            if (w > 0 || l > 0) { swin = w; sloss = l; spc = p || (swin + sloss); break; }
        }
        const swrRaw = getVal(user, ['winRate', 'WinRate_InclDisc', 'totalWinRate']) || getVal(detail.rank_season_wl || {}, ['totalWinRate', 'winRate']) || (spc > 0 ? Math.round((swin / spc) * 100) : 0);
        const swr = String(swrRaw).replace('%', '');
        els.stats.seasonRec.innerHTML = `${spc}전 <span style="color:#238636">${swin}승</span> <span style="color:#da3633">${sloss}패</span> (${swr}%)`;
        els.seasonWr.innerText = `${swr}%`;

        const totalCont = getVal(basic, ['totalContribution']) || getVal(user, ['totalContribute', 'avgContribute']) || 0;
        const combatCont = getVal(basic, ['combatContribution']) || getVal(user, ['combatContributeAvg']) || 0;
        const combatRate = getVal(basic, ['battleJoinRate']) || getVal(user, ['combatRateAvg', 'combatRate']) || 0;
        const avgLv = getVal(basic, ['averageCharacterLevel']) || getVal(user, ['lastLevelAvg', 'avgLevel']) || 0;
        const gold = getVal(basic, ['averageGetGold']) || getVal(user, ['totalGoldAvg', 'avgGold']) || 0;

        els.stats.totalCont.innerText = Number(totalCont).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        els.stats.combatCont.innerText = Number(combatCont).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        els.stats.combatRate.innerText = `${combatRate}%`;
        els.stats.avgLv.innerText = `Lv.${avgLv}`;
        els.stats.avgGold.innerText = Number(gold).toLocaleString();

        const kdaVal = parseFloat(getVal(user, ['killDieAssistRate', 'kda']) || getVal(detail, ['kda']) || 0);
        els.stats.kda.innerText = kdaVal > 0 ? kdaVal.toFixed(2) : "0.00";

        renderHeroList(detail);
        els.stats.totalRec.innerHTML = '<span style="color:#888">확인 중...</span>';
        fetchAllRecord(ano, displayAno).then(summary => {
            if (summary) {
                const parts = summary.split('|');
                els.stats.totalRec.innerHTML = parts[0].trim();
                if (parts[1]) els.stats.consecutive.innerHTML = parts[1].trim();
            } else {
                els.stats.totalRec.innerHTML = `${spc}전 ${swin}승 ${sloss}패 (${swr}%)`;
                els.stats.consecutive.innerHTML = `---`;
            }
        });
    }
}

function renderHeroList(detail) {
    const heroes = detail.characterList || [];
    els.heroList.innerHTML = `<div style="display:grid; grid-template-columns: repeat(8, 34px); gap:8px;">${heroes.slice(0, 16).map(h => { const cNo = h.characterNo || h; return `<img src="img_hero/${cNo}.png" class="hero-mini-icon" style="width:34px; height:34px;" onerror="this.src='img_hero/nop.png'">`; }).join('')}</div>`;
}

function renderPagination() {
    const totalPages = Math.ceil(filteredData.length / pageSize);
    let html = '';
    if (totalPages > 1) {
        for (let i = 1; i <= Math.min(totalPages, 10); i++) { html += `<button onclick="goToPage(${i})" class="pg-btn ${i === currentPage ? 'active' : ''}">${i}</button>`; }
        html += `<div class="pg-input-wrapper"><input type="number" class="pg-input" min="1" max="${totalPages}" value="${currentPage}" onkeydown="if(event.key==='Enter') goToPage(this.value)"><span class="total-pg-label">/ ${totalPages}</span></div>`;
    }
    if (els.pagination) els.pagination.innerHTML = html;
    if (els.paginationTop) els.paginationTop.innerHTML = html;
}

window.goToPage = function (page) {
    const p = parseInt(page, 10);
    if (isNaN(p) || p < 1 || p > Math.ceil(filteredData.length / pageSize)) return;
    currentPage = p; renderTable();
};

init();
