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
    paginationTop: document.getElementById('pagination-top'),
    totalCount: document.getElementById('total-count')
};


// 랭대 총전적(tabType=A) - 게임 서버에 직접 fetch (Python 서버 불필요)
const GAME_API = 'http://www.chaosonline.co.kr:8081/ClientJson/RecordInfo.aspx';

// 데이터 포맷팅: { totalWinCount: 5456, ... } -> "8484전 5456승 3020패 (64%) | 1연승"
function formatWL(item) {
    if (!item || typeof item !== 'object') return null;
    const win = parseInt(item.totalWinCount || item.WinCount || item.winCount || 0, 10);
    const loss = parseInt(item.totalLoseCount || item.LoseCount || item.loseCount || 0, 10);
    const draw = parseInt(item.totalDrawCount || item.DrawCount || 0, 10);
    const pc = parseInt(item.playCount || item.PlayCount || 0, 10) || (win + loss + draw);
    const wr = item.totalWinRate || (pc > 0 ? Math.round((win / pc) * 100) : 0);
    const con = parseInt(item.consecutiveWinLose || item.con_winlose || 0, 10);

    let conStr = "---";
    if (con > 0) conStr = `${con}연승`;
    else if (con < 0) conStr = `${Math.abs(con)}연패`;

    return `${pc}전 ${win}승 ${loss}패 (${wr}%) | ${conStr}`;
}

// 재귀적으로 데이터 뭉치 찾기
function findAndFormatWL(obj) {
    if (!obj || typeof obj !== 'object') return null;

    // 만약 현재 객체에 전적 관련 핵심 필드가 있다면 바로 포맷팅
    if ('totalWinCount' in obj || 'WinCount' in obj || 'winCount' in obj) {
        return formatWL(obj);
    }

    if (Array.isArray(obj)) {
        for (const item of obj) {
            const r = findAndFormatWL(item);
            if (r) return r;
        }
    } else {
        // winLoseTendency 필드가 있으면 그 안을 먼저 탐색
        if ('winLoseTendency' in obj) {
            const r = findAndFormatWL(obj.winLoseTendency);
            if (r) return r;
        }
        // 자식 노드들 탐색
        for (const v of Object.values(obj)) {
            const r = findAndFormatWL(v);
            if (r) return r;
        }
    }
    return null;
}

async function fetchAllRecord(ano, rawAno) {
    const targetAno = String(rawAno || ano);
    const dbInfo = userDetails[targetAno] || {};
    if (dbInfo.rank_all_wl) return dbInfo.rank_all_wl;

    console.log(`Real-time fetch for ${targetAno}`);

    const targetUrl = GAME_API + '?tabType=A&ano=' + targetAno;
    const isLocal = window.location.protocol === 'http:';
    const attemptUrls = [];
    if (isLocal) attemptUrls.push(targetUrl);
    attemptUrls.push(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);

    for (const url of attemptUrls) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
            const data = await res.json();
            let content = data.contents || data;

            if (typeof content === 'string' && content.length > 50) {
                // winLoseTendency 영역 추출 (배열 또는 객체)
                const wlMatch = content.match(/winLoseTendency\s*:\s*([\[\{][^]*?[\]\}])/);
                if (wlMatch && wlMatch[1]) {
                    const rawStr = wlMatch[1].trim();
                    let parsedData = null;
                    try {
                        // 1. 보정된 JSON 파싱 시도
                        const fixedJson = rawStr
                            .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                            .replace(/:\s*'([^']*)'/g, ':"$1"')
                            .replace(/,\s*([\]\}])/g, '$1');
                        parsedData = JSON.parse(fixedJson);
                    } catch (e) {
                        try { parsedData = eval('(' + rawStr + ')'); } catch (e2) { }
                    }

                    if (parsedData) {
                        const summary = findAndFormatWL(parsedData);
                        if (summary) {
                            console.log(`✓ Real-time Success: ${summary}`);
                            return summary;
                        }
                    }
                }
            }
        } catch (e) {
            console.warn(`Attempt failed:`, e.message);
        }
    }
    return null;
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

        console.log("Data Loaded:", {
            rankSummary: allData.length,
            dbSummary: Object.keys(userDetails).length,
            sample: userDetails['2489'] ? "덕구 있음" : "덕구 없음"
        });

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
    if (els.totalCount) {
        els.totalCount.innerText = `검색 결과: ${filteredData.length}명`;
    }
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
    const basic = detail.basicInfo || {};

    if (user) {
        // [1] 즉시 UI 채우기 (기존 DB 정보 우선, 없으면 랭킹 행 데이터 활용)
        els.nickname.innerText = `닉네임: ${user.nick || user.nickname || '---'}`;
        const displayAno = user.userANO || user.ano || ano;
        els.ano.innerText = `ANO: ${displayAno}`;
        els.grade.innerText = `등급: ${user.gradeName || '---'} ${user.gradeLevel || ''}`;
        els.grade.style.color = getGradeColor(user.gradeName || user.grade);
        els.grade.style.fontWeight = "bold";
        els.rank.innerText = `${user.RTRank || user.rank || '---'}위`;

        // 승률 표시 (상단 배지)
        const win = parseInt(user.winCount || user.win || 0, 10);
        const loss = parseInt(user.loseCount || user.lose || 0, 10);
        let wr = user.winRate || ((win + loss) > 0 ? Math.round((win / (win + loss)) * 100) : 0);
        els.seasonWr.innerText = `${wr}%`;

        // 상세 정보판 업데이트
        els.stats.nick.innerText = user.nick || user.nickname || '---';
        els.stats.anoVal.innerText = displayAno;

        // 시즌 전적 (기존 DB 정보가 있으면 사용, 없으면 리스트 데이터 사용)
        const swl = detail.rank_season_wl || user;
        const swin = parseInt(swl.winCount || swl.win || swl.WinCount || 0, 10);
        const sloss = parseInt(swl.loseCount || swl.lose || swl.LoseCount || 0, 10);
        const spc = parseInt(swl.playCount || swl.PlayCount || 0, 10) || swin + sloss;
        const swr = swl.winRate || (spc > 0 ? Math.round((swin / spc) * 100) : 0);
        els.stats.seasonRec.innerHTML = `${spc}전 <span style="color:#238636">${swin}승</span> <span style="color:#da3633">${sloss}패</span> (${swr}%)`;

        // 기타 상세 스탯 (기존 DB 정보 우선)
        els.stats.totalCont.innerText = Number(basic.totalContribution || user.totalContribution || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        els.stats.combatCont.innerText = Number(basic.combatContribution || user.combatContribution || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        els.stats.combatRate.innerText = `${(basic.battleJoinRate || user.combatRate || 0)}%`;
        els.stats.kda.innerText = `${user.avgKill || 0} / ${user.avgDeath || 0} / ${user.avgAssist || 0}`;
        els.stats.avgLv.innerText = `Lv.${(basic.averageCharacterLevel || user.avgLevel || 0)}`;
        els.stats.avgDispell.innerText = `${basic.avgDispell || user.avgDispell || 0}`;
        els.stats.avgPotion.innerText = `${basic.avgPotion || user.avgPotion || 0}`;
        els.stats.avgGold.innerText = Number(basic.averageGetGold || user.avgGold || 0).toLocaleString();

        renderHeroList(detail);

        // [2] 랭대 총전적 & 연승 정보만 "실시간"으로 받아오기 (비동기)
        els.stats.totalRec.innerHTML = '<span class="loading-text">실시간 확인 중...</span>';
        els.stats.consecutive.innerHTML = '<span class="loading-text">...</span>';

        fetchAllRecord(ano, displayAno).then(summary => {
            if (summary) {
                // 파싱 예시: "486전 316승 170패 (65%) | 12연승"
                const parts = summary.split('|');
                els.stats.totalRec.innerHTML = parts[0].trim();
                if (parts[1]) {
                    const conStr = parts[1].trim();
                    if (conStr.includes('연승')) els.stats.consecutive.innerHTML = `<span style="color:#3FB950; font-weight:bold;">${conStr}</span>`;
                    else if (conStr.includes('연패')) els.stats.consecutive.innerHTML = `<span style="color:#FF4D4D; font-weight:bold;">${conStr}</span>`;
                    else els.stats.consecutive.innerText = conStr;
                }
            } else {
                // 실시간 실패 시 DB에 기존 정보가 있으면 표시, 없으면 데이터 없음
                els.stats.totalRec.innerText = detail.rank_all_wl || '데이터 없음';
                els.stats.consecutive.innerText = detail.winLoseTendency || '---';
            }
        });
    }
}

function renderHeroList(detail) {
    const heroes = detail.characterList || [];
    const basic = detail.basicInfo || {};
    const likeHeroesRaw = detail.rank_season_wl ? (detail.rank_season_wl.likeRateHero || "") : (basic.likeRateHero || "");
    const likeHeroes = likeHeroesRaw.split(",").map(s => s.trim());

    els.heroList.innerHTML = heroes.slice(0, 16).map((h, i) => {
        const name = HERO_MAP[h.characterNo] || h.characterNo;
        const clr = likeHeroes.includes(name) ? "#FF4D4D" : "#58A6FF";
        return `<span style="color:${clr}; margin-right: 8px;">${name}${i < 15 && i < heroes.length - 1 ? ',' : ''}</span>`;
    }).join('');
}

init();
