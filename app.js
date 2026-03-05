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


// 랭대 총전적(tabType=A) - 게임 서버에 직접 fetch (Python 서버 불필요)
const GAME_API = 'http://www.chaosonline.co.kr:8081/ClientJson/RecordInfo.aspx';

// 재귀적으로 winLoseTendency 탐색
function findWL(obj) {
    if (!obj || typeof obj !== 'object') return null;
    if (Array.isArray(obj)) {
        for (const item of obj) { const r = findWL(item); if (r) return r; }
        return null;
    }
    if ('winLoseTendency' in obj) return obj['winLoseTendency'];
    for (const v of Object.values(obj)) { const r = findWL(v); if (r) return r; }
    return null;
}

async function fetchAllRecord(ano, rawAno) {
    const dbInfo = userDetails[String(rawAno || ano)] || userDetails[rawAno || ano] || {};
    return dbInfo.rank_all_wl || null;
}

// 구버전 /api/rankinfo 삭제 - 위의 직접 fetch 버전 사용

async function init() {
    try {
        const t = Date.now();
        const [rankRes, dbRes] = await Promise.all([
            fetch(`V88_FINAL_RANK_DEEP.json?t=${t}`).catch(() => ({ json: () => [] })),
            fetch(`DB.json?t=${t}`).catch(() => ({ json: () => ({}) }))
        ]);

        allData = await rankRes.json();
        userDetails = await dbRes.json();
        filteredData = [...allData];

        renderTable();
        if (allData.length > 0) selectUser(allData[0].userANO || allData[0].ano);

        els.searchInput.addEventListener('input', handleSearch);

        // 테이블 헤더 클릭 정렬 바인드
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => sortData(th.dataset.sort));
        });

    } catch (err) {
        console.error("Data load failed:", err);
    }
}

function handleSearch() {
    const val = els.searchInput.value.toLowerCase();
    filteredData = allData.filter(u => {
        const nick = (u.nick || u.nickname || "").toLowerCase();
        const ano = (u.userANO || u.ano || "").toString();
        return nick.includes(val) || ano.includes(val);
    });
    currentPage = 1;
    renderTable();
}


function sortData(key) {
    if (sortKey === key) {
        sortAsc = !sortAsc;
    } else {
        sortKey = key;
        sortAsc = key === 'rank'; // 순위는 오름차순이 기본
    }

    const gradeOrder = ['다이아몬드 1', '다이아몬드 2', '다이아몬드 3', '루비 1', '루비 2', '루비 3', '자수정 1', '자수정 2', '자수정 3', '사파이어 1', '사파이어 2', '사파이어 3', '에메랄드 1', '에메랄드 2', '에메랄드 3', '토파즈 1', '토파즈 2', '토파즈 3'];

    filteredData.sort((a, b) => {
        let va, vb;
        if (key === 'rank') {
            va = parseInt(a.RTRank || a.rank || 9999, 10);
            vb = parseInt(b.RTRank || b.rank || 9999, 10);
        } else if (key === 'grade') {
            va = gradeOrder.indexOf(a.gradeName || a.grade || '');
            vb = gradeOrder.indexOf(b.gradeName || b.grade || '');
            if (va === -1) va = 99;
            if (vb === -1) vb = 99;
        } else if (key === 'wr') {
            const wA = parseInt(a.win || a.WinCount || 0, 10);
            const lA = parseInt(a.lose || a.LoseCount || 0, 10);
            const wB = parseInt(b.win || b.WinCount || 0, 10);
            const lB = parseInt(b.lose || b.LoseCount || 0, 10);
            va = (wA + lA) > 0 ? wA / (wA + lA) : 0;
            vb = (wB + lB) > 0 ? wB / (wB + lB) : 0;
        } else if (key === 'nick') {
            va = (a.nick || a.nickname || '').toLowerCase();
            vb = (b.nick || b.nickname || '').toLowerCase();
            return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
        }
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
        const win = parseInt(u.win || u.WinCount || u.wincount || 0, 10);
        const loss = parseInt(u.lose || u.LoseCount || u.losecount || 0, 10);
        const wr = (win + loss) > 0 ? ((win / (win + loss)) * 100).toFixed(1) : 0;
        const rank = u.RTRank || u.rank || "---";

        // 선호 영웅 이미지 생성 (최대 5개)
        // DB.json(userDetails) 구조가 userDetails['ANO'] 형태라고 가정
        const dbInfo = userDetails[String(ano)] || userDetails[ano] || {};
        const charList = u.characterList || dbInfo.characterList || [];

        if (ano === pageData[0].userANO || ano === pageData[0].ano) { // 첫 번째 유저만 로그 찍기
            console.log(`[DEBUG] ANO: ${ano}, Nick: ${nick}, charList:`, charList);
        }
        const heroIconsHtml = charList.slice(0, 5).map(c => {
            const cNo = c.characterNo || c; // 구조가 중첩되어 있을 수도 있으니 확인
            console.log(`[DEBUG] Image mapped -> img_hero/${cNo}.png`);
            return `<img src="img_hero/${cNo}.png" class="hero-mini-icon" alt="Hero ${cNo}">`;
        }).join('');

        return `
            <tr onclick="selectUser('${ano}')">
                <td>${rank}</td>
                <td>${nick}</td>
                <td>
                    <div class="hero-icons-container">
                        ${heroIconsHtml}
                    </div>
                </td>
                <td style="color: ${getGradeColor(grade)}; padding-left:20px">${grade}</td>
                <td>
                    <span style="color: #238636">${win}승</span> 
                    <span style="color: #da3633">${loss}패</span>
                    <span class="win-rate-pill" style="background: ${wr >= 50 ? 'rgba(35, 134, 54, 0.2)' : 'rgba(218, 54, 51, 0.2)'}">${wr}%</span>
                </td>
                <td style="color: #58A6FF">${ano}</td>
            </tr>
        `;
    }).join('');

    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const areas = [els.pagination, els.paginationTop];

    areas.forEach(area => {
        if (!area) return;
        area.innerHTML = '';
        if (totalPages <= 1) return;

        // 버튼 생성 헬퍼
        const createBtn = (text, target, active = false, disabled = false) => {
            const btn = document.createElement('button');
            btn.className = `pg-btn ${active ? 'active' : ''}`;
            btn.innerText = text;
            btn.disabled = disabled;
            if (!disabled) {
                btn.onclick = () => {
                    currentPage = target;
                    renderTable();
                    document.querySelector('.right-panel').scrollTo({ top: 0, behavior: 'smooth' });
                };
            }
            return btn;
        };

        // << (첫 페이지)
        area.appendChild(createBtn('<<', 1, false, currentPage === 1));
        // < (이전)
        area.appendChild(createBtn('<', Math.max(1, currentPage - 1), false, currentPage === 1));

        // 페이지 번호 (최대 10개 표시)
        let start = Math.max(1, currentPage - 4);
        let end = Math.min(totalPages, start + 9);
        if (end === totalPages) start = Math.max(1, end - 9);

        for (let i = start; i <= end; i++) {
            area.appendChild(createBtn(i, i, i === currentPage));
        }

        // > (다음)
        area.appendChild(createBtn('>', Math.min(totalPages, currentPage + 1), false, currentPage === totalPages));
        // >> (끝 페이지)
        area.appendChild(createBtn('>>', totalPages, false, currentPage === totalPages));

        // 페이지 직접 입력 (상단에만 표시 혹은 둘 다 표시 - 여기선 둘 다)
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'pg-input-wrapper';

        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'pg-input';
        input.value = currentPage;
        input.min = 1;
        input.max = totalPages;
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                let val = parseInt(input.value);
                if (isNaN(val) || val < 1) val = 1;
                if (val > totalPages) val = totalPages;
                currentPage = val;
                renderTable();
                document.querySelector('.right-panel').scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        const label = document.createElement('span');
        label.className = 'total-pg-label';
        label.innerText = `/ ${totalPages}`;

        inputWrapper.appendChild(input);
        inputWrapper.appendChild(label);
        area.appendChild(inputWrapper);
    });
}

async function selectUser(ano) {
    const user = allData.find(u => (u.userANO || u.ano).toString() === ano.toString());
    const detail = userDetails[ano] || {};

    if (user) {
        els.nickname.innerText = `닉네임: ${user.nick || user.nickname || '---'}`;
        els.ano.innerText = `ANO: ${ano}`;
        els.grade.innerText = `등급: ${user.gradeName || user.grade || '---'}`;
        els.grade.style.color = getGradeColor(user.gradeName || user.grade);
        els.grade.style.fontWeight = "bold";
        els.rank.innerText = `${user.RTRank || user.rank || '---'}위`;

        const win = parseInt(user.win || user.WinCount || user.wincount || 0, 10);
        const loss = parseInt(user.lose || user.LoseCount || user.losecount || 0, 10);
        let wrStr = (win + loss) > 0 ? ((win / (win + loss)) * 100).toFixed(0) : 0;

        let pc = win + loss;
        els.seasonWr.innerText = `${wrStr}%`;
        els.stats.seasonRec.innerHTML = `${pc}전 <span style="color:#238636">${win}승</span> <span style="color:#da3633">${loss}패</span> (${wrStr}%)`;

        // 상세 정보 패널 상단에 닉네임 & ANO 표시
        els.stats.nick.innerText = user.nick || user.nickname || '---';
        els.stats.anoVal.innerText = ano;
    }

    // Populate Detailed stats from detail object
    const basic = detail.basicInfo || {};

    // 랭대 총전적 & 연승: 클릭할 때마다 항상 실시간 fetch
    els.stats.totalRec.innerHTML = `<span style="color:#888; font-style:italic;">불러오는 중...</span>`;
    els.stats.consecutive.innerHTML = `<span style="color:#888;">...</span>`;
    const rawAno = user ? String(user.userANO || user.ano) : ano;
    fetchAllRecord(ano, rawAno).then(wl => {
        if (wl && typeof wl === 'object' && Object.keys(wl).length > 0) {
            const awin = parseInt(wl.totalWinCount || wl.WinCount || wl.winCount || 0, 10);
            const aloss = parseInt(wl.totalLoseCount || wl.LoseCount || wl.loseCount || 0, 10);
            const apc = parseInt(wl.playCount || wl.playCount_InclDisc || 0, 10) || (awin + aloss);
            const awrStr = wl.totalWinRate || (apc > 0 ? Math.round((awin / apc) * 100).toString() : "0");

            els.stats.totalRec.innerHTML = `${apc}전 <span style="color:#238636">${awin}승</span> <span style="color:#da3633">${aloss}패</span> (${awrStr}%)`;

            // 연승/연패
            const con = parseInt(wl.consecutiveWinLose || wl.con_winlose || 0, 10);
            let conStr;
            if (con > 0) conStr = `<span style="color:#3FB950; font-weight:bold;">${con}연승</span>`;
            else if (con < 0) conStr = `<span style="color:#FF4D4D; font-weight:bold;">${Math.abs(con)}연패</span>`;
            else conStr = `<span style="color:#888">---</span>`;
            els.stats.consecutive.innerHTML = conStr;
        } else {
            els.stats.totalRec.innerHTML = `<span style="color:#888; font-style:italic;">데이터 없음</span>`;
            els.stats.consecutive.innerHTML = `<span style="color:#888;">---</span>`;
        }
    });
    // 랭대 총전적은 위 fetchAllRecord Promise에서 비동기 처리됨

    // 시즌 전적 (rank_season_wl 우선, 없으면 상위 랭킹 데이터 사용)
    if (detail.rank_season_wl) {
        const swl = detail.rank_season_wl;
        const swin = parseInt(swl.totalWinCount || swl.WinCount || swl.winCount || 0, 10);
        const sloss = parseInt(swl.totalLoseCount || swl.LoseCount || swl.loseCount || 0, 10);
        const spc = parseInt(swl.playCount || swl.play_Count || swl.PlayCount || 0, 10) || swin + sloss;
        const swr = swl.totalWinRate || swl.WinRate_InclDisc || swl.winRate || 0;
        const sWrDisp = swr ? String(swr).replace('%', '').split('.')[0] : (spc > 0 ? Math.round((swin / spc) * 100) : 0);
        els.seasonWr.innerText = `${sWrDisp}%`;
        els.stats.seasonRec.innerHTML = `${spc}전 <span style="color:#238636">${swin}승</span> <span style="color:#da3633">${sloss}패</span> (${sWrDisp}%)`;
    } else if (user) {
        const swin2 = parseInt(user.win || user.WinCount || user.wincount || 0, 10);
        const sloss2 = parseInt(user.lose || user.LoseCount || user.losecount || 0, 10);
        const spc2 = swin2 + sloss2;
        const sWr2 = spc2 > 0 ? Math.round((swin2 / spc2) * 100) : 0;
        els.seasonWr.innerText = `${sWr2}%`;
        els.stats.seasonRec.innerHTML = `${spc2}전 <span style="color:#238636">${swin2}승</span> <span style="color:#da3633">${sloss2}패</span> (${sWr2}%)`;
    }

    const conStr = detail.winLoseTendency || "---"; // rank_all_wl fetch 이후 갱신됨
    if (conStr.includes('연승')) {
        els.stats.consecutive.innerHTML = `<span style="color:#3FB950; font-weight:bold;">${conStr}</span>`;
    } else if (conStr.includes('연패')) {
        els.stats.consecutive.innerHTML = `<span style="color:#FF4D4D; font-weight:bold;">${conStr}</span>`;
    } else {
        els.stats.consecutive.innerText = conStr;
    }

    // Other detailed stats
    els.stats.totalCont.innerText = Number(basic.totalContribution || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    els.stats.combatCont.innerText = Number(basic.combatContribution || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    els.stats.combatRate.innerText = `${(basic.battleJoinRate || 0).toFixed(5)}%`;
    els.stats.kda.innerText = user.killDieAssistRate || user.killDieAssistrate || detail.kda || "---";
    els.stats.avgLv.innerText = `Lv.${(basic.averageCharacterLevel || 0).toFixed(2)}`;
    els.stats.avgDispell.innerText = `${basic.avgDispell || 0} 회`;
    els.stats.avgPotion.innerText = `${basic.avgPotion || 0} 회`;
    els.stats.avgGold.innerText = Number(basic.averageGetGold || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Heroes list styling mirroring Desktop Python logic
    const heroes = detail.characterList || [];
    const likeHeroesRaw = detail.rank_season_wl ? (detail.rank_season_wl.likeRateHero || "") : (basic.likeRateHero || "");
    const likeHeroes = likeHeroesRaw.split(",").map(s => s.trim());

    els.heroList.innerHTML = heroes.slice(0, 16).map((h, i) => {
        const name = HERO_MAP[h.characterNo] || h.characterNo;
        const clr = likeHeroes.includes(name) ? "#FF4D4D" : "#58A6FF";
        return `<span style="color:${clr}; margin-right: 8px;">${name}${i < 15 && i < heroes.length - 1 ? ',' : ''}</span>`;
    }).join('');
}

init();
