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

// 최신 전적 필드 병합 및 포맷팅
function formatWLMerged(items) {
    if (!Array.isArray(items)) items = [items];
    let data = { win: 0, loss: 0, draw: 0, pc: 0, wr: 0, con: 0 };
    let foundAny = false;

    for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const w = parseInt(item.totalWinCount || item.WinCount || item.winCount || 0, 10);
        const l = parseInt(item.totalLoseCount || item.LoseCount || item.loseCount || 0, 10);
        const d = parseInt(item.totalDrawCount || item.DrawCount || 0, 10);
        const p = parseInt(item.playCount || item.PlayCount || 0, 10);
        const c = parseInt(item.consecutiveWinLose || item.con_winlose || 0, 10);

        if (w > 0 || l > 0 || p > 0) {
            data.win = Math.max(data.win, w);
            data.loss = Math.max(data.loss, l);
            data.draw = Math.max(data.draw, d);
            data.pc = Math.max(data.pc, p, w + l + d);
            foundAny = true;
        }
        if (c !== 0) data.con = c;
    }

    if (!foundAny && data.con === 0) return null;

    const wr = (data.pc > 0) ? Math.round((data.win / data.pc) * 100) : 0;
    let conStr = "---";
    if (data.con > 0) conStr = `${data.con}연승`;
    else if (data.con < 0) conStr = `${Math.abs(data.con)}연패`;

    return `${data.pc}전 ${data.win}승 ${data.loss}패 (${wr}%) | ${conStr}`;
}

// 모든 객체 수집
function collectAllObjects(obj, results = []) {
    if (!obj || typeof obj !== 'object') return results;
    results.push(obj);
    if (Array.isArray(obj)) {
        for (const i of obj) collectAllObjects(i, results);
    } else {
        for (const v of Object.values(obj)) {
            if (typeof v === 'object') collectAllObjects(v, results);
        }
    }
    return results;
}

async function fetchAllRecord(ano, rawAno) {
    const targetAno = String(rawAno || ano);
    const dbInfo = userDetails[targetAno] || {};
    if (dbInfo.rank_all_wl) return dbInfo.rank_all_wl;

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
                // winLoseTendency 또는 전체 데이터 블록 추출
                const wlMatch = content.match(/winLoseTendency\s*:\s*([\[\{][^]*?[\]\}])/);
                const rawStr = wlMatch ? wlMatch[1] : content;

                let parsedData = null;
                try {
                    const fixedJson = rawStr.trim()
                        .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                        .replace(/:\s*'([^']*)'/g, ':"$1"')
                        .replace(/,\s*([\]\}])/g, '$1');
                    parsedData = JSON.parse(fixedJson);
                } catch (e) {
                    try { parsedData = eval('(' + (rawStr.includes('{') ? rawStr : '{' + rawStr + '}') + ')'); } catch (e2) { }
                }

                if (parsedData) {
                    const allObjs = collectAllObjects(parsedData);
                    const summary = formatWLMerged(allObjs);
                    if (summary) {
                        console.log(`✓ Real-time Success: ${summary}`);
                        return summary;
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
// 최신 전적 필드 병합 및 포맷팅 (더 넓은 필드 범위 지원)
function formatWLMerged(items) {
    if (!Array.isArray(items)) items = [items];
    let data = { win: 0, loss: 0, draw: 0, pc: 0, wr: 0, con: 0 };
    let foundAny = false;

    for (const item of items) {
        if (!item || typeof item !== 'object') continue;

        // 필드명 후보군 모두 체크 (대소문자 및 접두사 대응)
        const w = parseInt(item.totalWinCount || item.WinCount || item.winCount || item.win || 0, 10);
        const l = parseInt(item.totalLoseCount || item.LoseCount || item.loseCount || item.lose || 0, 10);
        const d = parseInt(item.totalDrawCount || item.DrawCount || item.drawCount || item.draw || 0, 10);
        const p = parseInt(item.playCount || item.PlayCount || item.playcount || 0, 10);
        const c = parseInt(item.consecutiveWinLose || item.con_winlose || item.consecutive || 0, 10);

        if (w > 0 || l > 0 || p > 0) {
            data.win = Math.max(data.win, w);
            data.loss = Math.max(data.loss, l);
            data.draw = Math.max(data.draw, d);
            data.pc = Math.max(data.pc, p, w + l + d);
            foundAny = true;
        }
        if (c !== 0) data.con = c;
    }

    if (!foundAny && data.con === 0) return null;

    const wr = (data.pc > 0) ? Math.round((data.win / data.pc) * 100) : 0;
    let conStr = "---";
    if (data.con > 0) conStr = `${data.con}연승`;
    else if (data.con < 0) conStr = `${Math.abs(data.con)}연패`;

    return `${data.pc.toLocaleString()}전 <span style="color:#238636">${data.win.toLocaleString()}승</span> <span style="color:#da3633">${data.loss.toLocaleString()}패</span> (${wr}%) | ${conStr}`;
}

// 모든 객체 수집 (깊은 복사 없이 참조 탐색)
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

async function fetchAllRecord(ano, rawAno) {
    const targetAno = String(rawAno || ano);
    const dbInfo = userDetails[targetAno] || {};
    if (dbInfo.rank_all_wl) return dbInfo.rank_all_wl;

    console.log(`Real-time fetch (Total & Streak) for ANO: ${targetAno}`);

    const targetUrl = GAME_API + '?tabType=A&ano=' + targetAno;
    const isLocal = window.location.protocol === 'http:';

    // 프록시 다변화 배열 구성
    const attemptUrls = [];
    if (isLocal) attemptUrls.push(targetUrl);
    attemptUrls.push(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
    attemptUrls.push(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
    attemptUrls.push(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
    attemptUrls.push(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);

    // 단일 프록시 요청 처리 핸들러 (타임아웃 8초)
    const fetchSingleProxy = async (url) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const contentType = res.headers.get("content-type");
            let content = "";
            if (contentType && contentType.includes("application/json") && url.includes("/get?url")) {
                const data = await res.json();
                content = data.contents || JSON.stringify(data);
            } else {
                content = await res.text();
            }

            if (typeof content !== 'string' || content.length < 50 || !content.includes('{')) {
                throw new Error("Invalid response format");
            }

            // winLoseTendency 블록 추출
            const wlMatch = content.match(/winLoseTendency\s*:\s*([\[\{][^]*?[\]\}])/);
            if (!wlMatch || !wlMatch[1]) throw new Error("No payload found");

            const rawStr = wlMatch[1].trim();
            let parsedData = null;
            try {
                // 비표준 JSON 보정 (따옴표 없는 키, 불필요한 쉼표 등)
                const fixedJson = rawStr
                    .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                    .replace(/:\s*'([^']*)'/g, ':"$1"')
                    .replace(/,\s*([\]\}])/g, '$1');
                parsedData = JSON.parse(fixedJson);
            } catch (err) {
                // 파싱 실패시 eval 폴백
                try {
                    let evalStr = rawStr;
                    if (!evalStr.startsWith('[') && !evalStr.startsWith('{')) evalStr = '{' + evalStr + '}';
                    parsedData = eval('(' + evalStr + ')');
                } catch (err2) { throw new Error("JSON Parse/Eval failed"); }
            }

            if (!parsedData) throw new Error("Parsed data is null");

            const allObjs = collectAllObjects(parsedData);
            const summary = formatWLMerged(allObjs);
            if (!summary) throw new Error("Summary generation failed");

            console.log(`✓ Real-time Success via [${url.split('/')[2]}]: ${summary}`);
            return summary;
        } catch (e) {
            clearTimeout(timeoutId);
            throw e; // Promise.any 처리를 위해 던짐
        }
    };

    // 무한 로딩 방지: 커스텀 Any 프로미스 (가장 먼저 성공한 것 반환, 모두 실패시 null)
    return new Promise((resolve) => {
        let failures = 0;
        let resolved = false;

        for (const url of attemptUrls) {
            fetchSingleProxy(url)
                .then(summary => {
                    if (!resolved) {
                        resolved = true;
                        resolve(summary);
                    }
                })
                .catch(err => {
                    // console.warn(`Proxy failed [${url.split('/')[2]}]:`, err.message);
                    failures++;
                    if (failures === attemptUrls.length && !resolved) {
                        console.error("❌ All real-time proxy attempts failed.");
                        resolve(null);
                    }
                });
        }
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
        els.rank.innerText = `${user.RTRank || user.rank || '---'}위`;

        // 승률 표시 (상단 배지)
        const win = parseInt(user.winCount || user.win || 0, 10);
        const loss = parseInt(user.loseCount || user.lose || 0, 10);
        let wr = user.winRate || ((win + loss) > 0 ? Math.round((win / (win + loss)) * 100) : 0);
        els.seasonWr.innerText = `${wr}%`;

        // 상세 정보판 업데이트
        els.stats.nick.innerText = user.nick || user.nickname || '---';
        els.stats.anoVal.innerText = displayAno;

        // [수정] 시즌 전적 필드 호환성 강화: 모든 가능성 있는 필드명 체크
        const swl = detail.rank_season_wl || {};
        const swin = parseInt(swl.totalWinCount || user.WinCount || swl.winCount || user.winCount || user.win || 0, 10);
        const sloss = parseInt(swl.totalLoseCount || user.LoseCount || swl.loseCount || user.loseCount || user.lose || 0, 10);
        const spc = parseInt(swl.playCount || user.playCount || 0, 10) || (swin + sloss);
        const swr = swl.totalWinRate || user.WinRate_InclDisc || user.winRate || (spc > 0 ? Math.round((swin / spc) * 100) : 0);
        els.stats.seasonRec.innerHTML = `${spc}전 <span style="color:#238636">${swin}승</span> <span style="color:#da3633">${sloss}패</span> (${String(swr).replace('%', '')}%)`;

        // [수정] KDA 계산: 데스크톱 버전에 맞게 단일 수치(killDieAssistRate) 우선 사용
        const kdaSingle = parseFloat(user.killDieAssistRate || detail.kda || 0);
        let kdaDisplay = kdaSingle > 0 ? kdaSingle.toFixed(2) : "0.00";
        if (kdaSingle === 0 && spc > 0) {
            // killDieAssistRate가 없을 경우 자체 계산 (Kill + Assist) / Death
            const kSum = parseInt(user.killCntSum || 0, 10);
            const dSum = parseInt(user.dieCntSum || 0, 10);
            const aSum = parseInt(user.assistCntSum || 0, 10);
            const calculatedKda = (kSum + aSum) / Math.max(dSum, 1);
            kdaDisplay = calculatedKda.toFixed(2);
        }

        els.stats.totalCont.innerText = Number(basic.totalContribution || user.totalContribute || user.avgContribute || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        els.stats.combatCont.innerText = Number(basic.combatContribution || user.combatContribution || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        els.stats.combatRate.innerText = `${(basic.battleJoinRate || user.combatRate || user.combatRateAvg || 0)}%`;
        els.stats.kda.innerText = `${kdaDisplay}`;
        els.stats.avgLv.innerText = `Lv.${(basic.averageCharacterLevel || user.avgLevel || 0)}`;
        els.stats.avgDispell.innerText = `${basic.avgDispell || user.avgDispell || 0}`;
        els.stats.avgPotion.innerText = `${basic.avgPotion || user.avgPotion || 0}`;
        els.stats.avgGold.innerText = Number(basic.averageGetGold || user.avgGold || 0).toLocaleString();

        renderHeroList(detail);

        // [수정] 랭대 총전적 & 연승 정보 로딩 상태 유지 (즉시 Fallback 제거)
        els.stats.totalRec.innerHTML = '<span class="loading-text" style="color:#888">실시간 확인 중...</span>';
        els.stats.consecutive.innerHTML = '<span class="loading-text" style="color:#888">...</span>';

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
                // 실패 시에만 기존 데이터 표시
                const fallbackTotalRec = detail.rank_all_wl || `${user.playCount || swin + sloss}전 ${swin}승 ${sloss}패 (${swr}%)`;
                const fallbackCon = detail.winLoseTendency || '---';
                els.stats.totalRec.innerText = fallbackTotalRec;
                els.stats.consecutive.innerText = fallbackCon;
            }
        });
    }
}

function renderHeroList(detail) {
    const heroes = detail.characterList || [];
    const basic = detail.basicInfo || {};
    const likeHeroesRaw = detail.rank_season_wl ? (detail.rank_season_wl.likeRateHero || "") : (basic.likeRateHero || "");
    const likeHeroes = likeHeroesRaw.split(",").map(s => s.trim());

    els.heroList.innerHTML = (heroes.length > 0 ? heroes : []).slice(0, 16).map((h, i) => {
        const name = HERO_MAP[h.characterNo] || h.characterNo;
        const clr = likeHeroes.includes(name) ? "#FF4D4D" : "#58A6FF";
        return `<span style="color:${clr}; margin-right: 8px;">${name}${i < 15 && i < heroes.length - 1 ? ',' : ''}</span>`;
    }).join('');
}

init();
