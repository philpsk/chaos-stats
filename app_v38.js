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
// formatWLMerged 함수 중복 제거 (파일 하단의 통합 버전 사용)

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

// 구버전 /api/rankinfo 삭제 - 위의 직접 fetch 버전 사용

async function init() {
    console.log("Dashboard Init Starting...");
    try {
        const t = Date.now();
        const [rankRes, dbRes] = await Promise.all([
            fetch(`V88_FINAL_RANK_DEEP.json?t=${t}`).catch(() => ({ ok: false, json: () => [] })),
            fetch(`DB.json?t=${t}`).catch(() => ({ ok: false, json: () => ({}) }))
        ]);

        if (rankRes && rankRes.ok) {
            allData = await rankRes.json();
        } else {
            console.error("V88 JSON Load Failed");
            allData = [];
        }

        if (dbRes && dbRes.ok) {
            userDetails = await dbRes.json();
        } else {
            console.error("DB JSON Load Failed");
            userDetails = {};
        }

        filteredData = [...allData];
        console.log("Filtered Data Prepared:", filteredData.length);

        renderTable();
        // 첫 화면 로드 시 1등 유저 자동 선택 및 구글 서버 조회 방지
        // if (allData.length > 0) selectUser(allData[0].userANO || allData[0].ano);

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

    const gradeOrder = [
        '다이아몬드 1', '다이아몬드 2', '다이아몬드 3', '다이아몬드 4', '다이아몬드 5',
        '루비 1', '루비 2', '루비 3', '루비 4', '루비 5',
        '자수정 1', '자수정 2', '자수정 3', '자수정 4', '자수정 5',
        '사파이어 1', '사파이어 2', '사파이어 3', '사파이어 4', '사파이어 5',
        '에메랄드 1', '에메랄드 2', '에메랄드 3', '에메랄드 4', '에메랄드 5',
        '토파즈 1', '토파즈 2', '토파즈 3', '토파즈 4', '토파즈 5'
    ];

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
            console.log(`[DEBUG] ANO: ${ano}, Nick: ${nick}, charList(Total): ${charList.length}, Displaying: ${Math.min(charList.length, 7)}`);
        }
        const heroIconsHtml = charList.slice(0, 7).map(c => {
            const cNo = c.characterNo || c;
            return `<img src="img_hero/${cNo}.png" class="hero-mini-icon" onerror="this.src='img_hero/nop.png'" alt="Hero ${cNo}">`;
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

    console.log(`Real-time fetch (Total & Streak) for ANO: ${targetAno}`);

    // 응답 문자열에서 안전하게 비표준 JSON 객체(중첩 배열 등 포함)를 추출하는 헬퍼 함수
    const parseChaosJson = (rawContent) => {
        if (!rawContent) return null;
        let text = rawContent.trim();
        if (text.includes('window.RecordInfo')) {
            text = text.substring(text.indexOf('=') + 1).trim();
            if (text.endsWith(';')) text = text.substring(0, text.length - 1);
        }
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            text = text.substring(firstBrace, lastBrace + 1);
        }
        let parsed = null;
        try {
            const fixed = text.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:\s*'([^']*)'/g, ':"$1"').replace(/,\s*([\]\}])/g, '$1');
            parsed = JSON.parse(fixed);
        } catch (e) {
            try { parsed = eval('(' + text + ')'); } catch (e2) { console.error("Parse Fallback Error:", e2); }
        }
        return parsed;
    };

    // ★ 1순위: 사용자 파이썬 서버가 수집해서 같이 올린 cache 폴더 내 JSON 정적 파일 우선 조회
    try {
        const cacheUrl = `cache/${targetAno}_realtime.json?_t=${Date.now()}`;
        console.log(`Checking local/github cache first: ${cacheUrl}`);
        const cacheRes = await fetch(cacheUrl, { signal: AbortSignal.timeout(1500) }); // 타임아웃 3초 -> 1.5초 단축
        if (cacheRes.ok) {
            const cacheContent = await cacheRes.text();
            const parsedData = parseChaosJson(cacheContent);
            if (parsedData && (parsedData.winLoseTendency || parsedData.rank_all_wl)) {
                const summary = formatWLMerged(collectAllObjects(parsedData));
                if (summary) {
                    console.log(`✓ Success via Static Cache!`);
                    window.realtimeCache[targetAno] = summary; // 캐시 저장
                    return summary;
                }
            }
        }
    } catch (err) {
        console.log("No static cache found, falling back to proxies.");
    }

    const targetUrl = GAME_API + '?tabType=A&ano=' + targetAno;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // 2순위: 일반 유저(웹 브라우저) 전용 구글 앱스 스크립트 프록시 (CORS 완벽 우회)
    // 사용자님이 생성하신 평생 무료 구글 백엔드 주소 적용 완료!
    const WORKER_URL = 'https://script.google.com/macros/s/AKfycby1H2PVEMbzf_cd80ua8UFhni3ZbITnIcuOpU9yCLNt4QrKh-2GeRsOGvZMqShkgqg5/exec';

    const attemptUrls = [];
    if (isLocal) {
        attemptUrls.push(`/api/record?ano=${targetAno}`); // 제일 빠른 로컬 파이썬 서버
    } else {
        // 보안/안정성을 위해 무료 퍼블릭 프록시를 제외하고 오직 사용자님의 Google Apps Script 하나만 단일 사용합니다.
        // 구글 서버 종특상 1.5초~2.5초 가량의 리디렉션 콜드스타트가 발생할 수 있습니다.
        if (WORKER_URL) attemptUrls.push(`${WORKER_URL}?ano=${targetAno}`);
    }

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

            const parsedData = parseChaosJson(content);
            if (!parsedData || (!parsedData.winLoseTendency && !parsedData.rank_all_wl)) {
                throw new Error("Parsed data is null or missing winLoseTendency");
            }

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

        // 상세 정보판 업데이트 (승률 배지 계산을 위해 위치 조정)
        els.stats.nick.innerText = user.nick || user.nickname || '---';
        els.stats.anoVal.innerText = displayAno;

        // [수정] 시즌 전적 필드 우선순위 교정: 랭킹 API(최신 데이터) 우선, DB.json(구버전) 후순위
        const swl = detail.rank_season_wl || {};
        const swin = parseInt(user.win || user.winCount || user.WinCount || swl.totalWinCount || swl.winCount || 0, 10);
        const sloss = parseInt(user.lose || user.loseCount || user.LoseCount || swl.totalLoseCount || swl.loseCount || 0, 10);
        const spc = parseInt(user.playCount || swl.playCount || 0, 10) || (swin + sloss);
        const swr = user.winRate || user.WinRate_InclDisc || swl.totalWinRate || (spc > 0 ? Math.round((swin / spc) * 100) : 0);

        // 하단 상세 패널 업데이트
        els.stats.seasonRec.innerHTML = `${spc}전 <span style="color:#238636">${swin}승</span> <span style="color:#da3633">${sloss}패</span> (${String(swr).replace('%', '')}%)`;

        // 상단 메인 승률 배지 업데이트 (0% 버그 해결)
        els.seasonWr.innerText = `${String(swr).replace('%', '')}%`;

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
                // 실시간 통신 모두 실패 시, 로컬 DB 내 객체를 포맷터로 우선 처리하여 (오프라인) 표기
                const fallbackSummary = formatWLMerged(detail.rank_all_wl || detail.winLoseTendency || user);
                if (fallbackSummary) {
                    const parts = fallbackSummary.split('|');
                    els.stats.totalRec.innerHTML = parts[0].trim();
                    if (parts[1]) els.stats.consecutive.innerHTML = parts[1].trim();
                } else {
                    const fallbackPlayCount = user.playCount || (swin + sloss);
                    els.stats.totalRec.innerHTML = `${fallbackPlayCount}전 <span style="color:#238636">${swin}승</span> <span style="color:#da3633">${sloss}패</span> (${swr}%)`;
                    els.stats.consecutive.innerHTML = `---`;
                }
            }
        });
    }
}

function renderHeroList(detail) {
    const heroes = detail.characterList || [];
    // 상단 프로필 영역 선호 영웅 (아이콘 16개, 8x2 배열로 확장)
    els.heroList.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(8, 34px); gap:8px;">
            ${(heroes.length > 0 ? heroes : []).slice(0, 16).map(h => {
        const cNo = h.characterNo || h;
        return `<img src="img_hero/${cNo}.png" class="hero-mini-icon" style="width:34px; height:34px;" onerror="this.src='img_hero/nop.png'" alt="Hero ${cNo}">`;
    }).join('')}
        </div>
    `;
}

function renderPagination() {
    const totalPages = Math.ceil(filteredData.length / pageSize);
    let html = '';

    if (totalPages > 1) {
        // [복구] 10페이지 단위 블록 계산 및 출력
        const block = 10;
        const currentBlock = Math.ceil(currentPage / block);
        const startP = (currentBlock - 1) * block + 1;
        const endP = Math.min(startP + block - 1, totalPages);

        html += `<button onclick="goToPage(1)" class="pg-btn" title="처음 페이지" ${currentPage === 1 ? 'disabled' : ''}>&laquo;</button>`;
        html += `<button onclick="goToPage(${startP - 1})" class="pg-btn" title="이전 ${block}페이지" ${startP === 1 ? 'disabled' : ''}>&lsaquo;</button>`;

        for (let i = startP; i <= endP; i++) {
            html += `<button onclick="goToPage(${i})" class="pg-btn ${i === currentPage ? 'active' : ''}">${i}</button>`;
        }

        html += `<button onclick="goToPage(${endP + 1})" class="pg-btn" title="다음 ${block}페이지" ${endP === totalPages ? 'disabled' : ''}>&rsaquo;</button>`;
        html += `<button onclick="goToPage(${totalPages})" class="pg-btn" title="마지막 페이지" ${currentPage === totalPages ? 'disabled' : ''}>&raquo;</button>`;

        // [복구] 직접 입력 이동(Jump) UI 컨테이너
        html += `
            <div class="pg-input-wrapper">
                <input type="number" class="pg-input" min="1" max="${totalPages}" value="${currentPage}" onkeydown="if(event.key==='Enter') goToPage(this.value)">
                <span class="total-pg-label">/ ${totalPages}</span>
                <button class="pg-btn" onclick="goToPage(this.previousElementSibling.previousElementSibling.value)">이동</button>
            </div>
        `;
    }

    if (els.pagination) els.pagination.innerHTML = html;
    if (els.paginationTop) els.paginationTop.innerHTML = html;
}

window.goToPage = function (page) {
    const p = parseInt(page, 10);
    if (isNaN(p) || p < 1 || p > Math.ceil(filteredData.length / pageSize)) return;
    currentPage = p;
    renderTable();
};

init();
