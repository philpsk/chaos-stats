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

function getGradeWeight(grade) {
    if (!grade) return 0;
    const g = String(grade);
    let weight = 0;
    if (g.includes('다이아')) weight = 6000;
    else if (g.includes('루비')) weight = 5000;
    else if (g.includes('자수정')) weight = 4000;
    else if (g.includes('사파이어')) weight = 3000;
    else if (g.includes('에메랄드')) weight = 2000;
    else if (g.includes('토파즈')) weight = 1000;

    const m = g.match(/\d+/);
    if (m) {
        // 단계가 낮을수록(1단계) 더 높은 순위이므로 가중치를 뺌
        // 5단계: +100, 4단계: +200, ... 1단계: +500
        const step = parseInt(m[0], 10);
        weight += (6 - step) * 100;
    }
    return weight;
}

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
    } catch (e) { console.error("Init failed", e); }
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

    // Update header icons
    document.querySelectorAll('th[data-sort]').forEach(th => {
        const k = th.dataset.sort;
        let txt = th.innerText.replace(/[↕↑↓]/g, '').trim();
        if (k === sortKey) txt += (sortAsc ? ' ↑' : ' ↓');
        else txt += ' ↕';
        th.innerText = txt;
    });

    filteredData.sort((a, b) => {
        let va, vb;
        if (key === 'rank') { va = parseInt(a.RTRank || a.rank || 999, 10); vb = parseInt(b.RTRank || b.rank || 999, 10); }
        else if (key === 'nick') { va = (a.nick || a.nickname || "").toLowerCase(); vb = (b.nick || b.nickname || "").toLowerCase(); return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va); }
        else if (key === 'wr') {
            const wA = parseInt(findVal(a, ['WinCount', 'winCount', 'win']) || 0, 10);
            const lA = parseInt(findVal(a, ['LoseCount', 'loseCount', 'lose']) || 0, 10);
            const wB = parseInt(findVal(b, ['WinCount', 'winCount', 'win']) || 0, 10);
            const lB = parseInt(findVal(b, ['LoseCount', 'loseCount', 'lose']) || 0, 10);
            va = (wA + lA) > 0 ? (wA / (wA + lA)) : 0;
            vb = (wB + lB) > 0 ? (wB / (wB + lB)) : 0;
        } else if (key === 'grade') {
            va = getGradeWeight(a.gradeName || a.grade);
            vb = getGradeWeight(b.gradeName || b.grade);
            // 등급은 기본적으로 높은 등급이 위로 오도록 (내림차순 가중치)
            return sortAsc ? vb - va : va - vb;
        } else { va = a[key] || 0; vb = b[key] || 0; }

        if (va === vb) return 0;
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
        const win = parseInt(findVal(u, ['WinCount', 'winCount', 'win']) || 0, 10);
        const loss = parseInt(findVal(u, ['LoseCount', 'loseCount', 'lose']) || 0, 10);
        let wrRaw = findVal(u, ['WinRate_InclDisc', 'winRate']);
        let wr = 0;
        if (wrRaw) wr = String(wrRaw).replace('%', '');
        else wr = (win + loss) > 0 ? ((win / (win + loss)) * 100).toFixed(1) : 0;
        const rank = u.RTRank || u.rank || "---";
        const detail = userDetails[norm] || {};
        const heroes = u.characterList || detail.characterList || [];
        const icons = heroes.slice(0, 7).map(c => `<img src="img_hero/${c.characterNo || c}.png" class="hero-mini-icon" onerror="this.src='img_hero/nop.png'">`).join('');
        return `<tr onclick="selectUser('${ano}')"><td>${rank}</td><td>${nick}</td><td><div class="hero-icons-container">${icons}</div></td><td style="color:${getGradeColor(grade)}">${grade}</td><td><span style="color:#238636">${win}승</span> <span style="color:#da3633">${loss}패</span> <span class="win-rate-pill">${wr}%</span></td><td style="color:#58A6FF">${ano}</td></tr>`;
    }).join('');
    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredData.length / pageSize);
    if (totalPages <= 1) {
        updateHtml('pagination', '');
        updateHtml('pagination-top', '');
        return;
    }

    const maxVisibleButtons = 10;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

    if (endPage - startPage + 1 < maxVisibleButtons) {
        startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    let h = `<div class="pagination-area">`;
    
    // 처음/이전 버튼
    h += `<button onclick="goToPage(1)" class="pg-btn" ${currentPage === 1 ? 'disabled' : ''} title="처음으로">«</button>`;
    h += `<button onclick="goToPage(${currentPage - 1})" class="pg-btn" ${currentPage === 1 ? 'disabled' : ''} title="이전">‹</button>`;

    // 숫자 버튼
    for (let i = startPage; i <= endPage; i++) {
        h += `<button onclick="goToPage(${i})" class="pg-btn ${i === currentPage ? 'active' : ''}">${i}</button>`;
    }

    // 다음/끝 버튼
    h += `<button onclick="goToPage(${currentPage + 1})" class="pg-btn" ${currentPage === totalPages ? 'disabled' : ''} title="다음">›</button>`;
    h += `<button onclick="goToPage(${totalPages})" class="pg-btn" ${currentPage === totalPages ? 'disabled' : ''} title="맨 끝으로">»</button>`;

    // 페이지 입력
    h += `
        <div class="pg-input-wrapper">
            <input type="number" class="pg-input" value="${currentPage}" min="1" max="${totalPages}" 
                onkeydown="if(event.key==='Enter') goToPage(this.value)"
                onfocus="this.select()">
            <span class="total-pg-label">/ ${totalPages}</span>
        </div>
    `;
    h += `</div>`;

    updateHtml('pagination', h);
    updateHtml('pagination-top', h);
}

window.goToPage = (p) => {
    const totalPages = Math.ceil(filteredData.length / pageSize);
    let page = parseInt(p, 10);
    if (isNaN(page)) return;
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    currentPage = page;
    renderTable();
};

async function selectUser(ano) {
    const norm = normalizeAno(ano);
    const user = allData.find(u => normalizeAno(u.userANO || u.ano) === norm);
    const detail = userDetails[norm] || {};
    const basic = detail.basicInfo || {};
    const swl = detail.rank_season_wl || {};

    if (!user) return;

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
        updateText('stat-nick', curNick);
        updateText('stat-prev-nicks', unique.join(', ') || '---');
        updateText('stat-ano-val', user.userANO || user.ano || ano);
    } catch (e) { console.error(e); }

    try {
        // [수정] 모든 전적 데이터 추출 시 명시적으로 숫자로 변환하여 문자열 결합 방지
        const w = Number(findVal(user, ['WinCount', 'winCount', 'win']) || swl.totalWinCount || 0);
        const l = Number(findVal(user, ['LoseCount', 'loseCount', 'lose']) || swl.totalLoseCount || 0);
        const p = Number(findVal(user, ['playCount', 'PlayCount']) || swl.playCount || (w + l) || 1);
        let wrRaw = findVal(user, ['WinRate_InclDisc', 'winRate']) || swl.totalWinRate;
        let wr = 0;
        if (wrRaw) wr = String(wrRaw).replace('%', '');
        else wr = Math.round((w / p) * 100);
        updateHtml('stat-season-rec', `${p}전 <span style="color:#238636">${w}승</span> <span style="color:#da3633">${l}패</span> (${wr}%)`);
        updateText('user-season-wr', `${wr}%`);
    } catch (e) { console.error(e); }

    try {
        const tc = findVal(basic, ['totalContribution']) || findVal(user, ['totalContribute', 'avgContribute']) || 0;
        const cc = findVal(basic, ['combatContribution']) || findVal(user, ['combatContributeAvg']) || 0;
        const cr = findVal(basic, ['battleJoinRate']) || findVal(user, ['combatRateAvg', 'combatRate']) || 0;
        const lv = findVal(basic, ['averageCharacterLevel']) || findVal(user, ['lastLevelAvg', 'avgLevel']) || 0;
        const kda = findVal(user, ['killDieAssistRate']) || detail.kda || 0;
        const dispell = findVal(basic, ['avgDispell']) || findVal(user, ['dispellCntAvg']) || 0;
        const potion = findVal(basic, ['avgPotion']) || findVal(user, ['potionCntAvg']) || 0;
        const gold = findVal(basic, ['averageGetGold']) || findVal(user, ['totalGoldAvg', 'avgGold']) || 0;
        updateText('stat-total-cont', Number(tc).toLocaleString());
        updateText('stat-combat-cont', Number(cc).toLocaleString());
        updateText('stat-combat-rate', `${cr}%`);
        updateText('stat-avg-lv', `Lv.${lv}`);
        updateText('stat-kda', Number(kda).toFixed(2));
        updateText('stat-avg-dispell', `${dispell}회`);
        updateText('stat-avg-potion', `${potion}회`);
        updateText('stat-avg-gold', Number(gold).toLocaleString());
    } catch (e) { console.error(e); }

    try {
        updateHtml('stat-total-rec', '<span style="color:#888">확인 중...</span>');
        updateText('stat-consecutive', "---");
        const worker = "https://script.google.com/macros/s/AKfycby1H2PVEMbzf_cd80ua8UFhni3ZbITnIcuOpU9yCLNt4QrKh-2GeRsOGvZMqShkgqg5/exec";
        fetch(`${worker}?ano=${norm}`).then(r => r.text()).then(t => {
            const f = t.indexOf("{"), l = t.lastIndexOf("}");
            if (f !== -1 && l !== -1) {
                const j = JSON.parse(t.substring(f, l + 1).replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:\s*'([^']*)'/g, ':"$1"').replace(/,\s*([\]\}])/g, '$1'));
                // [수정] 실시간 전적 합산 시 확실하게 숫자로 변환하여 문자열 결합 방지
                const tw = Number(j.winLoseTendency?.totalWinCount || 0);
                const tl = Number(j.winLoseTendency?.totalLoseCount || 0);
                const tc = Number(j.winLoseTendency?.consecutiveWinLose || 0);
                const totalGames = tw + tl;
                updateHtml('stat-total-rec', `${totalGames}전 ${tw}승 ${tl}패 (${Math.round(tw / (totalGames || 1) * 100)}%)`);
                updateHtml('stat-consecutive', tc > 0 ? `<span style="color:#3FB950">${tc}연승</span>` : (tc < 0 ? `<span style="color:#FF4D4D">${Math.abs(tc)}연패</span>` : "---"));
            }
        }).catch(() => { updateText('stat-total-rec', '조회 실패'); });
    } catch (e) { }

    try {
        const charList = user.characterList || detail.characterList || [];
        updateHtml('hero-list', `<div style="display:grid; grid-template-columns: repeat(8, 34px); gap:8px;">${charList.slice(0, 16).map(c => `<img src="img_hero/${c.characterNo || c}.png" class="hero-mini-icon" style="width:34px; height:34px;" onerror="this.src='img_hero/nop.png'">`).join('')}</div>`);
    } catch (e) { console.error("Hero list render failed", e); }
}

init();
