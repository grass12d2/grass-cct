// ==================== PLAYFAIR CIPHER (Nga, 5×6) ====================

const PLAYFAIR_ALPHABET = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЬЫЭЮЯ';
const PLAYFAIR_FILLER = 'Х';
const PLAYFAIR_FILLER_ALT = 'Ф';
const PLAYFAIR_ROWS = 5;
const PLAYFAIR_COLS = 6;

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
const DEFAULT_SPEED_INDEX = 3;
let currentSpeedIndex = DEFAULT_SPEED_INDEX;

let playfairState = {
    grid: null,
    key: 'ТРАВА',
    digraphs: [],
    currentStep: -1,
    totalSteps: 0,
    playing: false,
    speed: 1,
    timer: null,
    mode: 'encrypt',
    useModernFiller: false
};

// ---------- Chuẩn hoá ----------
function normalizePlayfairText(text) {
    return text
        .replace(/[Ёё]/g, m => m === 'Ё' ? 'Е' : 'е')
        .replace(/[Йй]/g, m => m === 'Й' ? 'И' : 'и')
        .replace(/[Ъъ]/g, m => m === 'Ъ' ? 'Ь' : 'ь');
}

function extractPlayfairLetters(text) {
    let result = '';
    const invalidChars = new Set();
    for (const char of text) {
        if (char === ' ' || char === '\n' || char === '\t') {
            result += char;
            continue;
        }
        const upper = normalizePlayfairText(char).toUpperCase();
        if (PLAYFAIR_ALPHABET.includes(upper)) result += upper;
        else invalidChars.add(char);
    }
    return { text: result, invalidChars };
}

function getCleanCipherText(text) {
    return extractPlayfairLetters(text).text.replace(/[^А-Я]/g, '');
}

function handlePlayfairInputWithCursor(textarea, showAlert = true) {
    const original = textarea.value;
    const cursorPos = textarea.selectionStart;
    const { text: processed, invalidChars } = extractPlayfairLetters(original);

    if (showAlert && invalidChars.size > 0) {
        const list = [...invalidChars].slice(0, 5).join(', ');
        const more = invalidChars.size > 5 ? '...' : '';
        GrassEAD.showMessage(
            `Ký tự không hợp lệ đã bị loại bỏ: ${list}${more}. Chỉ chấp nhận А-Я (trừ Ё, Й, Ъ) và dấu cách.`,
            'error'
        );
    }

    if (processed === original) return processed;

    const beforeCursor = original.slice(0, cursorPos);
    const processedBefore = extractPlayfairLetters(beforeCursor).text;
    const newCursorPos = Math.min(processedBefore.length, processed.length);

    textarea.value = processed;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    return processed;
}

// ---------- Khoá ----------
function normalizePlayfairKey(key) {
    let result = '';
    for (const char of key.toUpperCase()) {
        const upper = normalizePlayfairText(char);
        if (PLAYFAIR_ALPHABET.includes(upper)) result += upper;
    }
    return result || 'ТРАВА';
}

function handlePlayfairKeyInput(textarea, showAlert = true) {
    const original = textarea.value;
    const cursorPos = textarea.selectionStart;

    let processed = '';
    const invalidChars = [];
    for (const char of original) {
        if (char === ' ' || char === '\n' || char === '\t') continue;
        const upper = normalizePlayfairText(char).toUpperCase();
        if (PLAYFAIR_ALPHABET.includes(upper)) processed += upper;
        else invalidChars.push(char);
    }

    if (showAlert && invalidChars.length > 0) {
        const unique = [...new Set(invalidChars)].slice(0, 5).join(', ');
        const more = invalidChars.length > 5 ? '...' : '';
        GrassEAD.showMessage(
            `Ký tự không hợp lệ trong khoá: ${unique}${more}. Chỉ chấp nhận А-Я (trừ Ё, Й, Ъ).`,
            'error'
        );
    }

    if (processed === original) return processed;

    const beforeCursor = original.slice(0, cursorPos);
    let processedBefore = '';
    for (const char of beforeCursor) {
        if (char === ' ' || char === '\n' || char === '\t') continue;
        const upper = normalizePlayfairText(char).toUpperCase();
        if (PLAYFAIR_ALPHABET.includes(upper)) processedBefore += upper;
    }
    const newCursorPos = Math.min(processedBefore.length, processed.length);

    textarea.value = processed;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    return processed;
}

// ---------- Xây lưới ----------
function buildPlayfairGrid(key) {
    const normalizedKey = normalizePlayfairKey(key);
    const seen = new Set();
    const flat = [];
    for (const char of normalizedKey) {
        if (!seen.has(char)) { seen.add(char); flat.push(char); }
    }
    for (const char of PLAYFAIR_ALPHABET) {
        if (!seen.has(char)) { seen.add(char); flat.push(char); }
    }
    const grid = [];
    for (let r = 0; r < PLAYFAIR_ROWS; r++) {
        grid.push(flat.slice(r * PLAYFAIR_COLS, (r + 1) * PLAYFAIR_COLS));
    }
    return grid;
}

function findCharPos(grid, char) {
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c] === char) return { row: r, col: c };
        }
    }
    return null;
}

// ---------- Tách cặp ----------
function pickFiller(char) {
    return char === PLAYFAIR_FILLER ? PLAYFAIR_FILLER_ALT : PLAYFAIR_FILLER;
}

function splitEncryptDigraphs(text) {
    const clean = getCleanCipherText(text);
    const digraphs = [];
    let i = 0;
    while (i < clean.length) {
        const a = clean[i];
        let b;
        if (i + 1 < clean.length) {
            b = clean[i + 1];
            // Chỉ chèn filler khi bật biến thể hiện đại VÀ gặp cặp trùng
            if (playfairState.useModernFiller && a === b) {
                b = pickFiller(a);
                i += 1;
            } else {
                i += 2;
            }
        } else {
            // Độ dài lẻ → luôn pad Х ở cuối (kỹ thuật, cả 2 biến thể)
            b = pickFiller(a);
            i += 1;
        }
        digraphs.push([a, b]);
    }
    return digraphs;
}

function splitDecryptDigraphs(text) {
    const clean = getCleanCipherText(text);
    const digraphs = [];
    for (let i = 0; i < clean.length; i += 2) {
        if (i + 1 < clean.length) digraphs.push([clean[i], clean[i + 1]]);
        else digraphs.push([clean[i], PLAYFAIR_FILLER]);
    }
    return digraphs;
}

// ---------- Mã hoá / giải mã 1 cặp ----------
function encryptPair(grid, a, b) {
    const posA = findCharPos(grid, a);
    const posB = findCharPos(grid, b);
    if (!posA || !posB) return { result: [a, b], rule: 'unknown' };

    let resultA, resultB, rule;
    if (posA.row === posB.row) {
        resultA = grid[posA.row][(posA.col + 1) % PLAYFAIR_COLS];
        resultB = grid[posB.row][(posB.col + 1) % PLAYFAIR_COLS];
        rule = 'row';
    } else if (posA.col === posB.col) {
        resultA = grid[(posA.row + 1) % PLAYFAIR_ROWS][posA.col];
        resultB = grid[(posB.row + 1) % PLAYFAIR_ROWS][posB.col];
        rule = 'col';
    } else {
        resultA = grid[posA.row][posB.col];
        resultB = grid[posB.row][posA.col];
        rule = 'rect';
    }
    return {
        result: [resultA, resultB], rule, posA, posB,
        outPosA: findCharPos(grid, resultA),
        outPosB: findCharPos(grid, resultB)
    };
}

function decryptPair(grid, a, b) {
    const posA = findCharPos(grid, a);
    const posB = findCharPos(grid, b);
    if (!posA || !posB) return { result: [a, b], rule: 'unknown' };

    let resultA, resultB, rule;
    if (posA.row === posB.row) {
        resultA = grid[posA.row][(posA.col - 1 + PLAYFAIR_COLS) % PLAYFAIR_COLS];
        resultB = grid[posB.row][(posB.col - 1 + PLAYFAIR_COLS) % PLAYFAIR_COLS];
        rule = 'row';
    } else if (posA.col === posB.col) {
        resultA = grid[(posA.row - 1 + PLAYFAIR_ROWS) % PLAYFAIR_ROWS][posA.col];
        resultB = grid[(posB.row - 1 + PLAYFAIR_ROWS) % PLAYFAIR_ROWS][posB.col];
        rule = 'col';
    } else {
        resultA = grid[posA.row][posB.col];
        resultB = grid[posB.row][posA.col];
        rule = 'rect';
    }
    return {
        result: [resultA, resultB], rule, posA, posB,
        outPosA: findCharPos(grid, resultA),
        outPosB: findCharPos(grid, resultB)
    };
}

function getRuleText(rule) {
    return {
        row: 'Cùng hàng → dịch phải (mã hoá) / trái (giải mã)',
        col: 'Cùng cột → dịch xuống (mã hoá) / lên (giải mã)',
        rect: 'Khác hàng & cột → đổi góc hình chữ nhật',
        unknown: 'Không xác định'
    }[rule] || '';
}

// ---------- Render grid ----------
function buildGridTable(grid, cellStates, withArrows = false) {
    // Chỉ padding khi cần vẽ mũi tên — lưới tĩnh không cần
    const padding = withArrows ? 'padding: 82px 14px;' : '';
    let html = `<div class="playfair-grid-wrapper" style="width: max-content; margin: 0 auto; position: relative; ${padding}">`;
    html += '<table class="playfair-grid"><thead><tr><th></th>';
    for (let c = 1; c <= PLAYFAIR_COLS; c++) html += `<th>${c}</th>`;
    html += '</tr></thead><tbody>';

    for (let r = 0; r < PLAYFAIR_ROWS; r++) {
        html += `<tr><th>${r + 1}</th>`;
        for (let c = 0; c < PLAYFAIR_COLS; c++) {
            const char = grid[r][c];
            const state = cellStates[`${r},${c}`] || '';
            const cls = 'playfair-cell' + (state ? ` playfair-cell-${state}` : '');
            html += `<td class="${cls}" data-r="${r}" data-c="${c}">${char}</td>`;
        }
        html += '</tr>';
    }

    html += '</tbody></table>';
    // SVG chỉ cần khi có mũi tên
    if (withArrows) {
        html += '<svg class="playfair-arrows" style="position: absolute; top: 0; left: 0; pointer-events: none; overflow: visible; z-index: 10;"></svg>';
    }
    html += '</div>';
    return html;
}

function renderGridDisplay() {
    const container = document.getElementById('playfair-grid-display');
    if (!container || !playfairState.grid) return;
    container.innerHTML = buildGridTable(playfairState.grid, {}, false);
}

// ---------- Vẽ mũi tên cong ----------
function drawArrows(container, current) {
    const wrapper = container.querySelector('.playfair-grid-wrapper');
    const svg = container.querySelector('.playfair-arrows');
    if (!wrapper || !svg) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    svg.setAttribute('width', wrapperRect.width);
    svg.setAttribute('height', wrapperRect.height);
    svg.setAttribute('viewBox', `0 0 ${wrapperRect.width} ${wrapperRect.height}`);

    svg.innerHTML = `
        <defs>
            <marker id="pf-ah-1" markerWidth="12" markerHeight="9" refX="12" refY="4.5"
                orient="auto" markerUnits="userSpaceOnUse">
                <polygon points="0 0, 12 4.5, 0 9" fill="#3b82f6"/>
            </marker>
            <marker id="pf-ah-2" markerWidth="12" markerHeight="9" refX="12" refY="4.5"
                orient="auto" markerUnits="userSpaceOnUse">
                <polygon points="0 0, 12 4.5, 0 9" fill="#d946ef"/>
            </marker>
        </defs>
    `;

    const cells = {};
    wrapper.querySelectorAll('td[data-r]').forEach(td => {
        const r = parseInt(td.dataset.r);
        const c = parseInt(td.dataset.c);
        const rect = td.getBoundingClientRect();
        cells[`${r},${c}`] = {
            cx: rect.left - wrapperRect.left + rect.width / 2,
            cy: rect.top - wrapperRect.top + rect.height / 2,
            w: rect.width,
            h: rect.height
        };
    });

    const rule = current.rule;
    const posA = current.posA;
    const posB = current.posB;
    const isAUpper = posA && posB ? (posA.row < posB.row) : false;

    drawArrowByRule(svg, cells, posA, current.outPosA, rule, 1, '#3b82f6', isAUpper);
    drawArrowByRule(svg, cells, posB, current.outPosB, rule, 2, '#d946ef', !isAUpper);
}

function drawArrowByRule(svg, cells, from, to, rule, num, color, isUpperRow) {
    if (!from || !to) return;
    const src = cells[`${from.row},${from.col}`];
    const tgt = cells[`${to.row},${to.col}`];
    if (!src || !tgt) return;

    // ===== Bước 1: Chọn cạnh nguồn và cạnh đích theo quy tắc =====
    let srcEdge, tgtEdge;
    if (rule === 'col') {
        // Cùng cột: 1 → trái, 2 → phải
        srcEdge = (num === 1) ? 'left' : 'right';
        tgtEdge = (num === 1) ? 'left' : 'right';
    } else if (rule === 'row') {
        // Cùng hàng: 1 → trên, 2 → dưới
        srcEdge = (num === 1) ? 'top' : 'bottom';
        tgtEdge = (num === 1) ? 'top' : 'bottom';
    } else {
        // Rect: trên → trên, dưới → dưới
        const useTop = isUpperRow;
        srcEdge = useTop ? 'top' : 'bottom';
        tgtEdge = useTop ? 'top' : 'bottom';
    }

    // ===== Bước 2: Lấy đúng trung điểm cạnh =====
    const edgeMid = (cell, edge) => {
        if (edge === 'left') return [cell.cx - cell.w / 2, cell.cy];
        if (edge === 'right') return [cell.cx + cell.w / 2, cell.cy];
        if (edge === 'top') return [cell.cx, cell.cy - cell.h / 2];
        return [cell.cx, cell.cy + cell.h / 2]; // bottom
    };

    const [startX, startY] = edgeMid(src, srcEdge);
    const [endX, endY] = edgeMid(tgt, tgtEdge);

    // ===== Bước 3: Hướng "ra ngoài" của cạnh nguồn =====
    const outX = srcEdge === 'left' ? -1 : srcEdge === 'right' ? 1 : 0;
    const outY = srcEdge === 'top' ? -1 : srcEdge === 'bottom' ? 1 : 0;

    const dist = Math.hypot(endX - startX, endY - startY);
    const cellSize = Math.max(src.w, src.h);

    // ===== Bước 4: Control point = midpoint + đẩy ra ngoài =====
    let offset;
    if (rule === 'rect') {
        offset = Math.max(dist * 0.45, cellSize * 0.65);
    } else {
        offset = Math.max(dist * 0.35, cellSize * 0.65);
    }

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const ctrlX = midX + outX * offset;
    const ctrlY = midY + outY * offset;

    // ===== Bước 5: Vẽ path =====
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('marker-end', `url(#pf-ah-${num})`);
    path.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))';
    svg.appendChild(path);

    // ===== Bước 6: Badge số 1/2 tại đỉnh cong =====
    const t = 0.5;
    const bx = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * ctrlX + t * t * endX;
    const by = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * ctrlY + t * t * endY;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', bx);
    circle.setAttribute('cy', by);
    circle.setAttribute('r', '11');
    circle.setAttribute('fill', color);
    circle.setAttribute('stroke', '#ffffff');
    circle.setAttribute('stroke-width', '2.5');
    circle.style.filter = 'drop-shadow(0 1px 3px rgba(0,0,0,0.25))';
    svg.appendChild(circle);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', bx);
    text.setAttribute('y', by + 1);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('fill', '#ffffff');
    text.setAttribute('font-size', '14');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('font-family', 'ui-monospace, monospace');
    text.textContent = String(num);
    svg.appendChild(text);
}

// ---------- Render stage ----------
function renderStage() {
    const container = document.getElementById('playfair-stage');
    if (!container || !playfairState.grid) return;

    const current = (playfairState.currentStep >= 0 && playfairState.currentStep < playfairState.digraphs.length)
        ? playfairState.digraphs[playfairState.currentStep]
        : null;

    const cellStates = {};
    const setCell = (r, c, role) => {
        const key = `${r},${c}`;
        if (!cellStates[key]) cellStates[key] = role;
        else if (cellStates[key] !== role) cellStates[key] = 'both';
    };

    if (current) {
        setCell(current.posA.row, current.posA.col, 'a-input');
        setCell(current.posB.row, current.posB.col, 'b-input');
        setCell(current.outPosA.row, current.outPosA.col, 'a-output');
        setCell(current.outPosB.row, current.outPosB.col, 'b-output');
    }

    let html = '<div style="overflow-x: auto;">' + buildGridTable(playfairState.grid, cellStates, true) + '</div>';

    html += `
        <div class="mt-3 flex flex-wrap justify-center gap-3 text-xs text-gray-500 dark:text-gray-400 items-center">
            <span class="flex items-center gap-1.5">
                <span class="inline-block w-3 h-3 rounded" style="background:#dbeafe;box-shadow:inset 0 0 0 1.5px #3b82f6;"></span>
                Cặp 1 (gốc)
            </span>
            <span class="flex items-center gap-1.5">
                <span class="inline-block w-3 h-3 rounded" style="background:#fae8ff;box-shadow:inset 0 0 0 1.5px #d946ef;"></span>
                Cặp 2 (gốc)
            </span>
            <span class="flex items-center gap-1.5">
                <span class="inline-block w-3 h-3 rounded" style="background:#fde68a;box-shadow:inset 0 0 0 1.5px #f59e0b;"></span>
                Ô trùng
            </span>
            ${current ? `
                <span class="text-gray-300 dark:text-gray-600">|</span>
                <span class="font-medium text-blue-600 dark:text-blue-400">
                    <i class="fas fa-route mr-1"></i>${getRuleText(current.rule)}
                </span>
            ` : ''}
        </div>
    `;
    container.innerHTML = html;

    if (current) {
        requestAnimationFrame(() => drawArrows(container, current));
    }

    updateStatusText(current);
    updateProgress();
    updatePartialResult();
    updateDigraphList();
    updateControls();
}

function updateStatusText(current) {
    const el = document.getElementById('playfair-status');
    if (!el) return;
    if (!current) {
        if (playfairState.totalSteps === 0) {
            el.innerHTML = '<span class="text-gray-400">Nhập văn bản để bắt đầu hoạt ảnh</span>';
        } else {
            el.innerHTML = `<span class="text-gray-500">Sẵn sàng — ${playfairState.totalSteps} cặp ký tự. Nhấn Play hoặc +1 để bắt đầu.</span>`;
        }
        return;
    }
    el.innerHTML = `
        <strong class="text-blue-600 dark:text-blue-400">Bước ${playfairState.currentStep + 1}/${playfairState.totalSteps}</strong>
        <span class="mx-2">·</span>
        <span class="pair-badge pair-input">${current.input[0]}${current.input[1]}</span>
        <i class="fas fa-arrow-right mx-1.5 text-gray-400"></i>
        <span class="pair-badge pair-output">${current.output[0]}${current.output[1]}</span>
    `;
}

function updateProgress() {
    const slider = document.getElementById('anim-progress');
    const text = document.getElementById('progress-text');
    if (slider) {
        slider.min = -1;
        slider.max = Math.max(0, playfairState.totalSteps - 1);
        slider.value = playfairState.currentStep;
        slider.disabled = playfairState.totalSteps === 0;
    }
    if (text) {
        text.textContent = `${playfairState.currentStep + 1} / ${playfairState.totalSteps}`;
    }
}

function updatePartialResult() {
    const el = document.getElementById('playfair-result');
    if (!el) return;
    if (playfairState.currentStep < 0) { el.innerHTML = ''; return; }
    let partial = '';
    for (let i = 0; i <= playfairState.currentStep; i++) partial += playfairState.digraphs[i].output.join('');
    const label = playfairState.mode === 'encrypt' ? 'Bản mã' : 'Bản rõ';
    el.innerHTML = `
        <span class="text-xs text-gray-500 dark:text-gray-400">${label} tích lũy:</span>
        <span class="font-mono font-bold text-base text-blue-700 dark:text-blue-400 ml-2">${GrassEAD.formatResult(partial)}</span>
    `;
}

function updateDigraphList() {
    const el = document.getElementById('playfair-digraph-list');
    if (!el) return;
    if (playfairState.totalSteps === 0) { el.innerHTML = ''; return; }

    let html = '<div class="text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2"><i class="fas fa-list mr-1"></i>Danh sách cặp ký tự</div><div class="flex flex-wrap gap-1">';
    playfairState.digraphs.forEach((dg, i) => {
        let cls = 'digraph-item';
        if (i < playfairState.currentStep) cls += ' done';
        else if (i === playfairState.currentStep) cls += ' current';
        html += `<span class="${cls}" data-step="${i}">
            <span>${dg.input.join('')}</span>
            <i class="fas fa-arrow-right text-[8px] opacity-60"></i>
            <span>${dg.output.join('')}</span>
        </span>`;
    });
    html += '</div>';
    el.innerHTML = html;

    el.querySelectorAll('.digraph-item').forEach(item => {
        item.addEventListener('click', () => {
            const step = parseInt(item.dataset.step);
            if (!isNaN(step)) {
                pauseAnimation();
                playfairState.currentStep = step;
                renderStage();
            }
        });
    });
}

function updateControls() {
    const back10 = document.getElementById('anim-back-10');
    const back1 = document.getElementById('anim-back-1');
    const forward1 = document.getElementById('anim-forward-1');
    const forward10 = document.getElementById('anim-forward-10');
    const playPause = document.getElementById('anim-play-pause');

    const noSteps = playfairState.totalSteps === 0;
    const atStart = playfairState.currentStep <= -1;
    const atEnd = playfairState.currentStep >= playfairState.totalSteps - 1;

    if (back10) back10.disabled = noSteps || atStart;
    if (back1) back1.disabled = noSteps || atStart;
    if (forward1) forward1.disabled = noSteps || atEnd;
    if (forward10) forward10.disabled = noSteps || atEnd;

    if (playPause) {
        playPause.disabled = noSteps;
        playPause.innerHTML = playfairState.playing
            ? '<i class="fas fa-pause"></i>'
            : '<i class="fas fa-play"></i>';
    }
}

// ---------- Main ----------
function updatePlayfair() {
    const input = document.getElementById('playfair-input');
    const output = document.getElementById('playfair-output');
    if (!input || !output) return;

    playfairState.grid = buildPlayfairGrid(playfairState.key);
    renderGridDisplay();

    const text = input.value;
    if (!text || !text.trim()) {
        playfairState.digraphs = [];
        playfairState.currentStep = -1;
        playfairState.totalSteps = 0;
        output.value = '';
        renderStage();
        return;
    }

    const pairs = playfairState.mode === 'encrypt'
        ? splitEncryptDigraphs(text)
        : splitDecryptDigraphs(text);

    playfairState.digraphs = pairs.map(([a, b]) => {
        const r = playfairState.mode === 'encrypt'
            ? encryptPair(playfairState.grid, a, b)
            : decryptPair(playfairState.grid, a, b);
        return {
            input: [a, b],
            output: r.result,
            rule: r.rule,
            posA: r.posA, posB: r.posB,
            outPosA: r.outPosA, outPosB: r.outPosB
        };
    });
    playfairState.totalSteps = playfairState.digraphs.length;

    if (playfairState.currentStep >= playfairState.totalSteps) {
        playfairState.currentStep = playfairState.totalSteps - 1;
    }

    const fullResult = playfairState.digraphs.map(d => d.output.join('')).join('');
    output.value = GrassEAD.formatResult(fullResult);
    renderStage();
}

// ---------- Animation ----------
function pauseAnimation() {
    playfairState.playing = false;
    if (playfairState.timer) {
        clearTimeout(playfairState.timer);
        playfairState.timer = null;
    }
    updateControls();
}

function playAnimation() {
    if (playfairState.totalSteps === 0) return;
    if (playfairState.currentStep >= playfairState.totalSteps - 1) {
        playfairState.currentStep = -1;
        renderStage();
    }
    playfairState.playing = true;
    updateControls();
    scheduleNextStep();
}

function scheduleNextStep() {
    if (!playfairState.playing) return;
    const baseDelay = 1400;
    const delay = baseDelay / playfairState.speed;

    playfairState.timer = setTimeout(() => {
        if (!playfairState.playing) return;
        if (playfairState.currentStep >= playfairState.totalSteps - 1) {
            pauseAnimation();
            return;
        }
        playfairState.currentStep++;
        renderStage();
        scheduleNextStep();
    }, delay);
}

function stepForward(n) {
    if (playfairState.totalSteps === 0) return;
    pauseAnimation();
    playfairState.currentStep = Math.min(playfairState.currentStep + n, playfairState.totalSteps - 1);
    renderStage();
}

function stepBack(n) {
    if (playfairState.totalSteps === 0) return;
    pauseAnimation();
    playfairState.currentStep = Math.max(playfairState.currentStep - n, -1);
    renderStage();
}

function togglePlay() {
    if (playfairState.playing) pauseAnimation();
    else playAnimation();
}

function resetAnimation() {
    playfairState.currentStep = -1;
    pauseAnimation();
    renderStage();
}

function changeSpeed(delta) {
    currentSpeedIndex = Math.max(0, Math.min(SPEED_OPTIONS.length - 1, currentSpeedIndex + delta));
    playfairState.speed = SPEED_OPTIONS[currentSpeedIndex];
    const el = document.getElementById('anim-speed-display');
    if (el) el.textContent = playfairState.speed + 'x';
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('playfair-input');
    const output = document.getElementById('playfair-output');
    const keyInput = document.getElementById('key-input');
    const modeEncrypt = document.getElementById('mode-encrypt');
    const modeDecrypt = document.getElementById('mode-decrypt');
    const pasteBtn = document.getElementById('paste-btn');
    const copyInputBtn = document.getElementById('copy-input-btn');
    const copyOutputBtn = document.getElementById('copy-output-btn');
    const clearBtn = document.getElementById('clear-btn');
    const inputLabel = document.getElementById('input-label');
    const outputLabel = document.getElementById('output-label');

    playfairState.grid = buildPlayfairGrid(playfairState.key);
    playfairState.speed = SPEED_OPTIONS[currentSpeedIndex];
    const speedDisplay = document.getElementById('anim-speed-display');
    if (speedDisplay) speedDisplay.textContent = playfairState.speed + 'x';

    function updateUI() {
        const isEncrypt = playfairState.mode === 'encrypt';
        if (inputLabel) inputLabel.textContent = isEncrypt ? 'Văn bản gốc' : 'Văn bản mã hoá';
        if (outputLabel) outputLabel.textContent = isEncrypt ? 'Văn bản mã hoá' : 'Văn bản gốc';
        if (input) input.placeholder = isEncrypt
            ? 'Nhập văn bản tiếng Nga — có thể có dấu cách (ví dụ: ПРИВЕТ МИР)'
            : 'Nhập văn bản đã mã hoá';

        if (modeEncrypt && modeDecrypt) {
            if (isEncrypt) {
                modeEncrypt.className = 'px-4 py-2 bg-red-500 border-2 border-red-500 text-white rounded-lg text-sm font-medium transition-colors shadow-md';
                modeDecrypt.className = 'px-4 py-2 bg-transparent border-2 border-blue-400 text-blue-500 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20';
            } else {
                modeDecrypt.className = 'px-4 py-2 bg-blue-500 border-2 border-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-md';
                modeEncrypt.className = 'px-4 py-2 bg-transparent border-2 border-red-400 text-red-500 dark:text-red-400 rounded-lg text-sm font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-900/20';
            }
        }
    }

    // ===== Toggle biến thể hiện đại =====
    const modernFillerToggle = document.getElementById('modern-filler-toggle');
    if (modernFillerToggle) {
        modernFillerToggle.checked = playfairState.useModernFiller;
        modernFillerToggle.addEventListener('change', function () {
            playfairState.useModernFiller = this.checked;
            playfairState.currentStep = -1;
            pauseAnimation();
            updatePlayfair();
        });
    }

    // ===== Tooltip popover cho icon info =====
    const infoBtn = document.getElementById('modern-filler-info');
    const tooltip = document.getElementById('modern-filler-tooltip');
    const tooltipArrow = document.getElementById('modern-filler-tooltip-arrow');

    if (infoBtn && tooltip) {
        let pinned = false;

        function positionTooltip() {
            if (!tooltip || tooltip.classList.contains('hidden')) return;

            // Reset về trạng thái mặc định trước khi đo
            tooltip.style.transform = '';
            if (tooltipArrow) tooltipArrow.style.right = '';

            const margin = 12;
            const tRect = tooltip.getBoundingClientRect();
            const vWidth = window.innerWidth;

            let shift = 0;
            if (tRect.left < margin) {
                // Tràn lề trái → đẩy sang phải
                shift = margin - tRect.left;
            } else if (tRect.right > vWidth - margin) {
                // Tràn lề phải → đẩy sang trái
                shift = vWidth - margin - tRect.right;
            }

            if (shift !== 0) {
                tooltip.style.transform = `translateX(${shift}px)`;
                // Giữ mũi tên nhọn trỏ về icon (bù lại độ dịch)
                if (tooltipArrow) {
                    tooltipArrow.style.right = `${8 + shift}px`;
                }
            }
        }

        const showTooltip = () => {
            tooltip.classList.remove('hidden');
            requestAnimationFrame(positionTooltip);
        };
        const hideTooltip = () => {
            tooltip.classList.add('hidden');
            tooltip.style.transform = '';
            if (tooltipArrow) tooltipArrow.style.right = '';
        };

        // Hover: hiện/ẩn (nếu chưa pin)
        infoBtn.addEventListener('mouseenter', showTooltip);
        infoBtn.addEventListener('mouseleave', () => {
            if (!pinned) hideTooltip();
        });

        // Click: toggle pin (không ảnh hưởng checkbox vì nút nằm ngoài label)
        infoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            pinned = !pinned;
            if (pinned) showTooltip();
            else hideTooltip();
        });

        // Click ra ngoài → ẩn + bỏ pin
        document.addEventListener('click', (e) => {
            if (!infoBtn.contains(e.target) && !tooltip.contains(e.target)) {
                pinned = false;
                hideTooltip();
            }
        });

        // Reposition khi resize hoặc scroll
        window.addEventListener('resize', () => {
            if (!tooltip.classList.contains('hidden')) positionTooltip();
        });
        window.addEventListener('scroll', () => {
            if (!tooltip.classList.contains('hidden')) positionTooltip();
        }, { passive: true });
    }

    if (input) {
        input.addEventListener('input', function () {
            handlePlayfairInputWithCursor(this, true);
            updatePlayfair();
        });
        input.addEventListener('paste', function () {
            setTimeout(() => {
                handlePlayfairInputWithCursor(this, true);
                updatePlayfair();
            }, 10);
        });
    }

    if (keyInput) {
        keyInput.placeholder = 'ТРАВА';
        keyInput.value = '';

        keyInput.addEventListener('focus', function () {
            if (this.value === '') this.placeholder = '';
        });

        keyInput.addEventListener('blur', function () {
            if (this.value === '') {
                this.placeholder = 'ТРАВА';
                playfairState.key = 'ТРАВА';
                playfairState.currentStep = -1;
                pauseAnimation();
                updatePlayfair();
            }
        });

        keyInput.addEventListener('input', function () {
            handlePlayfairKeyInput(this, true);
            playfairState.key = normalizePlayfairKey(this.value || 'ТРАВА');
            playfairState.currentStep = -1;
            pauseAnimation();
            updatePlayfair();
        });

        keyInput.addEventListener('paste', function () {
            setTimeout(() => {
                handlePlayfairKeyInput(this, true);
                playfairState.key = normalizePlayfairKey(this.value || 'ТРАВА');
                playfairState.currentStep = -1;
                pauseAnimation();
                updatePlayfair();
            }, 10);
        });
    }

    if (modeEncrypt) modeEncrypt.addEventListener('click', function () {
        if (playfairState.mode === 'encrypt') return;
        playfairState.mode = 'encrypt';
        playfairState.currentStep = -1;
        pauseAnimation();
        updateUI();
        updatePlayfair();
    });

    if (modeDecrypt) modeDecrypt.addEventListener('click', function () {
        if (playfairState.mode === 'decrypt') return;
        playfairState.mode = 'decrypt';
        playfairState.currentStep = -1;
        pauseAnimation();
        updateUI();
        updatePlayfair();
    });

    if (pasteBtn) pasteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        GrassEAD.pasteText(input);
    });
    if (copyInputBtn) copyInputBtn.addEventListener('click', function (e) {
        e.preventDefault();
        GrassEAD.copyText(input.value);
    });
    if (copyOutputBtn) copyOutputBtn.addEventListener('click', function (e) {
        e.preventDefault();
        GrassEAD.copyText(output.value);
    });
    if (clearBtn) clearBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (input) input.value = '';
        if (output) output.value = '';
        playfairState.currentStep = -1;
        pauseAnimation();
        GrassEAD.showMessage('Đã xoá nội dung!', 'info');
        updatePlayfair();
    });

    const animBack10 = document.getElementById('anim-back-10');
    const animBack1 = document.getElementById('anim-back-1');
    const animForward1 = document.getElementById('anim-forward-1');
    const animForward10 = document.getElementById('anim-forward-10');
    const animPlayPause = document.getElementById('anim-play-pause');
    const animSpeedDown = document.getElementById('anim-speed-down');
    const animSpeedUp = document.getElementById('anim-speed-up');
    const animProgress = document.getElementById('anim-progress');
    const animReset = document.getElementById('anim-reset');

    if (animBack10) animBack10.addEventListener('click', () => stepBack(10));
    if (animBack1) animBack1.addEventListener('click', () => stepBack(1));
    if (animForward1) animForward1.addEventListener('click', () => stepForward(1));
    if (animForward10) animForward10.addEventListener('click', () => stepForward(10));
    if (animPlayPause) animPlayPause.addEventListener('click', togglePlay);
    if (animSpeedDown) animSpeedDown.addEventListener('click', () => changeSpeed(-1));
    if (animSpeedUp) animSpeedUp.addEventListener('click', () => changeSpeed(1));
    if (animReset) animReset.addEventListener('click', resetAnimation);

    if (animProgress) {
        animProgress.addEventListener('input', function () {
            pauseAnimation();
            const val = parseInt(this.value);
            playfairState.currentStep = Math.max(-1, Math.min(val, playfairState.totalSteps - 1));
            renderStage();
        });
    }

    // Redraw arrows khi resize
    window.addEventListener('resize', () => {
        if (playfairState.currentStep >= 0) {
            const container = document.getElementById('playfair-stage');
            const current = playfairState.digraphs[playfairState.currentStep];
            if (container && current) drawArrows(container, current);
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function (e) {
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
        if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
        else if (e.code === 'ArrowRight') { e.preventDefault(); stepForward(e.shiftKey ? 10 : 1); }
        else if (e.code === 'ArrowLeft') { e.preventDefault(); stepBack(e.shiftKey ? 10 : 1); }
    });

    updateUI();
    updatePlayfair();
});