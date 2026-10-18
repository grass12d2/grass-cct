// ==================== CARDANO GRILLE RECT (Решетка Кардано — прямоугольная) ====================

const CARDANO_LETTERS = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
const PAD_CHAR = '–';

// Template mặc định cho lưới 6×10 (15 lỗ cố định)
const DEFAULT_TEMPLATE_6X10 = [
    [0, 1], [1, 0], [1, 4], [1, 6], [1, 7],
    [2, 1], [2, 5], [2, 9], [3, 3], [3, 7],
    [4, 1], [5, 2], [5, 5], [5, 6], [5, 9]
];

// Màu theo vị trí
const CARDANO_ROT_COLORS = [
    'bg-emerald-600',
    'bg-violet-500',
    'bg-rose-500',
    'bg-amber-500'
];
const CARDANO_ROT_BG = [
    'bg-emerald-100 dark:bg-emerald-900/40',
    'bg-violet-100 dark:bg-violet-900/40',
    'bg-rose-100 dark:bg-rose-900/40',
    'bg-amber-100 dark:bg-amber-900/40'
];

const CARDANO_ROT_NAMES = ['Gốc', 'Đảo 180°', 'Lật dọc', 'Lật ngang'];

const POSITION_LABELS = ['Gốc', 'Đảo 180°', 'Lật dọc', 'Lật ngang'];
const POSITION_BADGE = ['Gốc', '180°', 'Lật dọc', 'Lật ngang'];
const POSITION_ANGLE_HTML = [
    'Gốc',
    '180°',
    '<i class="fas fa-arrows-up-down"></i>',
    '<i class="fas fa-arrows-left-right"></i>'
];

// 24 hoán vị
const ALL_ORDERS = (function () {
    const result = [];
    function permute(arr, m = []) {
        if (arr.length === 0) result.push(m);
        else {
            for (let i = 0; i < arr.length; i++) {
                const rest = arr.slice(0, i).concat(arr.slice(i + 1));
                permute(rest, m.concat([arr[i]]));
            }
        }
    }
    permute([0, 1, 2, 3]);
    return result;
})();

function findOrderIndex(perm) {
    return ALL_ORDERS.findIndex(arr =>
        arr.length === perm.length && arr.every((v, i) => v === perm[i])
    );
}

const DEFAULT_ORDER = [0, 1, 2, 3];
const DEFAULT_ORDER_INDEX = findOrderIndex(DEFAULT_ORDER);
let currentOrderIndex = DEFAULT_ORDER_INDEX;

let cardanoTemplate = null;
let cardanoGridRows = 6;
let cardanoGridCols = 10;
let currentModeGlobal = 'encrypt';
let currentCardanoResult = null;

// Vị trí hiện tại của grille (dùng cho logic animation)
let currentGrillePos = 0;

// ---------- ORDER ----------

function getCurrentOrder() {
    return ALL_ORDERS[currentOrderIndex];
}

function getPositionForStep(stepIdx) {
    return getCurrentOrder()[stepIdx];
}

// ---------- TEMPLATE ----------

function templateCellAt(r, c, pos, rows, cols) {
    switch (pos) {
        case 0: return [r, c];
        case 1: return [rows - 1 - r, cols - 1 - c];
        case 2: return [rows - 1 - r, c];
        case 3: return [r, cols - 1 - c];
        default: return [r, c];
    }
}

function generateFixedTemplate6x10() {
    const rows = 6, cols = 10;
    const template = Array.from({ length: rows }, () => Array(cols).fill(false));
    for (const [r, c] of DEFAULT_TEMPLATE_6X10) {
        template[r][c] = true;
    }
    return template;
}

function generateRandomTemplateForce(rows, cols) {
    const template = Array.from({ length: rows }, () => Array(cols).fill(false));
    const assigned = Array.from({ length: rows }, () => Array(cols).fill(false));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (assigned[r][c]) continue;
            const orbit = [
                [r, c],
                [rows - 1 - r, cols - 1 - c],
                [rows - 1 - r, c],
                [r, cols - 1 - c]
            ];
            for (const [or_, oc] of orbit) assigned[or_][oc] = true;
            const [hr, hc] = orbit[Math.floor(Math.random() * 4)];
            template[hr][hc] = true;
        }
    }
    return template;
}

function generateRandomTemplate(rows, cols) {
    if (rows === 6 && cols === 10) {
        return generateFixedTemplate6x10();
    }
    return generateRandomTemplateForce(rows, cols);
}

function countHoles(template) {
    let count = 0;
    for (const row of template) for (const cell of row) if (cell) count++;
    return count;
}

function isHoleAt(template, r, c, pos) {
    const rows = template.length;
    const cols = template[0].length;
    const [tr, tc] = templateCellAt(r, c, pos, rows, cols);
    return template[tr][tc];
}

function turnForCell(template, r, c) {
    for (let pos = 0; pos < 4; pos++) {
        if (isHoleAt(template, r, c, pos)) return pos;
    }
    return -1;
}

// ============ TRANSFORM ĐƠN TRỤC — mỗi vị trí là 1 phép duy nhất ============
// Dùng rotateZ cho Đảo 180° (flat spin), rotateX cho Lật dọc, rotateY cho Lật ngang
function grilleTransform(pos) {
    const pers = 'perspective(1200px)';
    switch (pos) {
        case 0: return `${pers} rotate(0deg) rotateX(0deg) rotateY(0deg)`;
        case 1: return `${pers} rotate(180deg) rotateX(0deg) rotateY(0deg)`;  // Đảo 180° — xoay phẳng
        case 2: return `${pers} rotate(0deg) rotateX(180deg) rotateY(0deg)`;  // Lật dọc — lật quanh trục ngang
        case 3: return `${pers} rotate(0deg) rotateX(0deg) rotateY(180deg)`;  // Lật ngang — lật quanh trục dọc
        default: return `${pers} rotate(0deg) rotateX(0deg) rotateY(0deg)`;
    }
}

// ============ ANIMATION HELPER — reset rồi lật đơn trục ============
async function animateGrilleTo(targetPos) {
    const grille = document.getElementById('anim-grille');
    if (!grille) return;

    // Đang ở target rồi → không làm gì
    if (currentGrillePos === targetPos) return;

    // Nếu cả 2 đều khác 0 → reset về gốc trước (tránh lật chéo)
    if (currentGrillePos !== 0 && targetPos !== 0) {
        grille.style.transition = 'transform 1s ease-in-out';
        grille.style.transform = grilleTransform(0);
        currentGrillePos = 0;
        await animSleep(1050);
    }

    // Lật đơn trục sang target
    grille.style.transition = 'transform 2s cubic-bezier(0.65, 0, 0.35, 1)';
    grille.style.transform = grilleTransform(targetPos);
    currentGrillePos = targetPos;
    await animSleep(2100);
}

// ---------- ENCRYPT / DECRYPT ----------

function prepareCardanoInput(text) {
    let result = '';
    for (const char of text.toUpperCase()) {
        if (char === 'Ё') {
            result += 'Е';
        } else if (char === '–' || char === '-' || char === '—') {
            result += PAD_CHAR;
        } else if (GrassCCT.RUSSIAN_ALPHABET.includes(char)) {
            result += char;
        }
    }
    return result;
}

function cardanoEncrypt(text, template) {
    const rows = template.length;
    const cols = template[0].length;
    const capacity = rows * cols;
    let clean = prepareCardanoInput(text);
    if (clean.length > capacity) clean = clean.slice(0, capacity);

    const grid = Array.from({ length: rows }, () => Array(cols).fill(''));
    const padFlags = Array.from({ length: rows }, () => Array(cols).fill(false));

    const order = getCurrentOrder();
    let idx = 0;
    for (let stepIdx = 0; stepIdx < 4; stepIdx++) {
        const pos = order[stepIdx];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (isHoleAt(template, r, c, pos)) {
                    if (idx < clean.length) {
                        grid[r][c] = clean[idx++];
                    } else {
                        grid[r][c] = PAD_CHAR;
                        padFlags[r][c] = true;
                    }
                }
            }
        }
    }

    return {
        grid, padFlags,
        ciphertext: grid.map(row => row.join('')).join(''),
        plaintext: clean
    };
}

function cardanoDecrypt(ciphertext, template) {
    const rows = template.length;
    const cols = template[0].length;
    const capacity = rows * cols;
    let clean = prepareCardanoInput(ciphertext);
    if (clean.length < capacity) clean = clean.padEnd(capacity, PAD_CHAR);
    if (clean.length > capacity) clean = clean.slice(0, capacity);

    const grid = [];
    for (let r = 0; r < rows; r++) {
        grid.push(clean.slice(r * cols, (r + 1) * cols).split(''));
    }

    const order = getCurrentOrder();
    let plaintext = '';
    for (let stepIdx = 0; stepIdx < 4; stepIdx++) {
        const pos = order[stepIdx];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (isHoleAt(template, r, c, pos)) {
                    plaintext += grid[r][c];
                }
            }
        }
    }

    return { grid, plaintext, ciphertext: clean };
}

// ---------- RENDER TEMPLATE ----------

function getCellConfig(rows, cols) {
    const key = `${rows}x${cols}`;
    const configs = {
        '4x6': { cell: 78, fontSize: 32, headFont: 15, rowLabelW: 40 },
        '6x8': { cell: 62, fontSize: 24, headFont: 13, rowLabelW: 34 },
        '6x10': { cell: 52, fontSize: 20, headFont: 12, rowLabelW: 28 }
    };
    const base = configs[key] || { cell: 52, fontSize: 20, headFont: 12, rowLabelW: 28 };

    // Trên mobile, giảm cell size và font để vừa khung
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    if (isMobile) {
        return {
            ...base,
            cell: Math.max(28, Math.round(base.cell * 0.7)),
            fontSize: Math.max(12, Math.round(base.fontSize * 0.7)),
            headFont: Math.max(9, Math.round(base.headFont * 0.8)),
            rowLabelW: Math.max(20, Math.round(base.rowLabelW * 0.75))
        };
    }
    return base;
}

function renderCardanoTemplate() {
    const container = document.getElementById('cardano-template');
    if (!container || !cardanoTemplate) return;

    const rows = cardanoTemplate.length;
    const cols = cardanoTemplate[0].length;
    const holes = countHoles(cardanoTemplate);
    const result = currentCardanoResult;
    const isEncrypt = currentModeGlobal === 'encrypt';

    const cfg = getCellConfig(rows, cols);

    let html = `<div class="overflow-x-auto pb-2">
        <table class="table-encrypt mx-auto" style="table-layout: fixed; width: auto;">
            <thead><tr>
                <th class="bg-emerald-100 dark:bg-emerald-900/30 text-center"
                    style="width:${cfg.rowLabelW}px;font-size:${cfg.headFont}px;"></th>`;
    for (let c = 1; c <= cols; c++) {
        html += `<th class="bg-emerald-100 dark:bg-emerald-900/30 text-center"
            style="width:${cfg.cell}px;font-size:${cfg.headFont}px;">${c}</th>`;
    }
    html += `</tr></thead><tbody>`;

    for (let r = 0; r < rows; r++) {
        html += `<tr>
            <td class="font-bold bg-emerald-100 dark:bg-emerald-900/30 text-center"
                style="width:${cfg.rowLabelW}px;font-size:${cfg.headFont}px;padding:2px;">${r + 1}</td>`;

        for (let c = 0; c < cols; c++) {
            const pos = turnForCell(cardanoTemplate, r, c);
            const ch = result ? (result.grid[r][c] || '') : '';
            const isPad = result && result.padFlags && result.padFlags[r][c];
            const bg = pos >= 0 ? CARDANO_ROT_BG[pos] : 'bg-gray-100 dark:bg-gray-700/30';

            let content, contentCls = 'font-bold font-mono';
            if (ch) {
                content = ch;
                if (isPad) {
                    contentCls += ' text-gray-400 dark:text-gray-500';
                } else {
                    contentCls += isEncrypt
                        ? ' text-emerald-800 dark:text-emerald-300'
                        : ' text-gray-900 dark:text-white';
                }
            } else {
                content = `<span class="font-mono text-gray-500 dark:text-gray-400"
                    style="font-size:${cfg.headFont}px;">${pos >= 0 ? pos : ''}</span>`;
            }

            html += `<td class="${bg} text-center ${contentCls}"
                style="width:${cfg.cell}px;height:${cfg.cell}px;font-size:${cfg.fontSize}px;padding:4px;">${content}</td>`;
        }
        html += `</tr>`;
    }
    html += `</tbody></table></div>`;

    html += `
        <div class="mt-3 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 items-center">
            ${[0, 1, 2, 3].map(k => `
                <span class="flex items-center gap-1.5">
                    <span class="inline-block w-3 h-3 rounded ${CARDANO_ROT_COLORS[k]}"></span>
                    ${CARDANO_ROT_NAMES[k]}
                </span>
            `).join('')}
            <span class="text-gray-300 dark:text-gray-600">|</span>
            <span>${rows}×${cols} = ${rows * cols} ô · ${holes} lỗ × 4 vị trí</span>
        </div>
        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <i class="fas fa-info-circle mr-1"></i>
            Ô có màu = lỗ khoét của vị trí tương ứng. Trong bảng: chữ = ký tự đã ghi; số = vị trí điền vào ô.
            Ký tự <strong>–</strong> (xám) là ô đệm trống.
        </p>
    `;

    container.innerHTML = html;
}

// ---------- MAIN FLOW ----------

function updateCardanoOutput() {
    const input = document.getElementById('cardano-input');
    const output = document.getElementById('cardano-output');
    if (!input || !output) return;

    if (!cardanoTemplate) cardanoTemplate = generateRandomTemplate(cardanoGridRows, cardanoGridCols);

    const text = input.value;
    if (!text || text.trim() === '') {
        output.value = '';
        currentCardanoResult = null;
        renderCardanoTemplate();
        return;
    }

    if (currentModeGlobal === 'encrypt') {
        const result = cardanoEncrypt(text, cardanoTemplate);
        currentCardanoResult = result;
        output.value = GrassCCT.formatResult(result.ciphertext);
    } else {
        const result = cardanoDecrypt(text, cardanoTemplate);
        currentCardanoResult = result;
        output.value = result.plaintext;
    }
    renderCardanoTemplate();
}

function regenerateCardanoTemplate() {
    if (cardanoGridRows === 6 && cardanoGridCols === 10) {
        cardanoTemplate = generateRandomTemplateForce(cardanoGridRows, cardanoGridCols);
    } else {
        cardanoTemplate = generateRandomTemplate(cardanoGridRows, cardanoGridCols);
    }
    updateCardanoOutput();
}

function updateCardanoUI() {
    const isEncrypt = currentModeGlobal === 'encrypt';
    const inputLabel = document.getElementById('input-label');
    const outputLabel = document.getElementById('output-label');
    const input = document.getElementById('cardano-input');
    const modeEncrypt = document.getElementById('mode-encrypt');
    const modeDecrypt = document.getElementById('mode-decrypt');

    if (inputLabel) inputLabel.textContent = isEncrypt ? 'Văn bản gốc' : 'Văn bản mã hoá';
    if (outputLabel) outputLabel.textContent = isEncrypt ? 'Văn bản mã hoá' : 'Văn bản gốc';
    if (input) {
        input.placeholder = isEncrypt
            ? "Nhập văn bản tiếng Nga (ví dụ: ПРИВЕТ). Chấp nhận cả '-' và '–'."
            : "Nhập văn bản đã mã hoá (chấp nhận '-' và '–')";
    }

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

// ---------- ORDER UI ----------

function updateOrderUI() {
    const idxEl = document.getElementById('order-index');
    const visualEl = document.getElementById('order-visual');

    if (idxEl) idxEl.textContent = currentOrderIndex + 1;

    document.querySelectorAll('[data-pos-label]').forEach((el, i) => {
        const pos = getPositionForStep(i);
        el.innerHTML = POSITION_ANGLE_HTML[pos];
    });

    if (!visualEl) return;

    const order = getCurrentOrder();
    const colors = ['bg-emerald-600', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500'];
    const icons = [
        'G',
        '180',
        '<i class="fas fa-arrows-up-down"></i>',
        '<i class="fas fa-arrows-left-right"></i>'
    ];

    visualEl.innerHTML = order.map((pos, i) => `
        <div class="flex items-center">
            <div class="w-8 h-8 rounded-lg ${colors[pos]} flex items-center justify-center text-white font-bold text-xs shadow-sm">
                ${icons[pos]}
            </div>
            ${i < 3 ? '<i class="fas fa-arrow-right text-[10px] text-gray-400 mx-1"></i>' : ''}
        </div>
    `).join('');
}

function setOrderIndex(idx) {
    const total = ALL_ORDERS.length;
    currentOrderIndex = ((idx % total) + total) % total;

    try {
        localStorage.setItem('cardano-rect-order', String(currentOrderIndex));
    } catch (e) { }

    updateOrderUI();
    updateCardanoOutput();
    resetCardanoAnimation();
}

function loadOrderIndex() {
    try {
        const ORDER_STORAGE_VERSION = 'v4';
        const storedVer = localStorage.getItem('cardano-rect-order-version');

        if (storedVer !== ORDER_STORAGE_VERSION) {
            currentOrderIndex = DEFAULT_ORDER_INDEX;
            localStorage.setItem('cardano-rect-order-version', ORDER_STORAGE_VERSION);
            localStorage.setItem('cardano-rect-order', String(currentOrderIndex));
            return;
        }

        const saved = localStorage.getItem('cardano-rect-order');
        if (saved !== null) {
            const idx = parseInt(saved);
            if (!isNaN(idx) && idx >= 0 && idx < ALL_ORDERS.length) {
                currentOrderIndex = idx;
            }
        }
    } catch (e) { }
}

// ---------- INPUT HANDLER ----------

function processCardanoRectInput(text) {
    let result = '';
    const invalidChars = new Set();

    for (const char of text) {
        if (char === ' ' || char === '\n' || char === '\t') {
            result += char;
        } else if (char === '–' || char === '-' || char === '—') {
            result += PAD_CHAR;
        } else {
            const upper = char.toUpperCase();
            if (upper === 'Ё') {
                result += 'Е';
            } else if (GrassCCT.RUSSIAN_ALPHABET.includes(upper)) {
                result += upper;
            } else {
                invalidChars.add(char);
            }
        }
    }
    return { text: result, invalidChars };
}

function handleCardanoRectInputWithCursor(textarea, showAlert = true) {
    const original = textarea.value;
    const cursorPos = textarea.selectionStart;
    const { text: processed, invalidChars } = processCardanoRectInput(original);

    if (showAlert && invalidChars.size > 0) {
        const list = [...invalidChars].slice(0, 5).join(', ');
        const more = invalidChars.size > 5 ? '...' : '';
        GrassCCT.showMessage(
            `Ký tự không hợp lệ đã bị loại bỏ: ${list}${more}. Chỉ chấp nhận А-Я, dấu cách, và '-'.`,
            'error'
        );
    }

    if (processed === original) return processed;

    const beforeCursor = original.slice(0, cursorPos);
    const processedBefore = processCardanoRectInput(beforeCursor).text;
    const newCursorPos = Math.min(processedBefore.length, processed.length);

    textarea.value = processed;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    return processed;
}

// ---------- INIT ----------

document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('cardano-input');
    const output = document.getElementById('cardano-output');
    const modeEncrypt = document.getElementById('mode-encrypt');
    const modeDecrypt = document.getElementById('mode-decrypt');
    const gridSizeSelect = document.getElementById('grid-size');
    const newTemplateBtn = document.getElementById('new-template');
    const pasteBtn = document.getElementById('paste-btn');
    const copyInputBtn = document.getElementById('copy-input-btn');
    const copyOutputBtn = document.getElementById('copy-output-btn');
    const clearBtn = document.getElementById('clear-btn');
    const animPlayBtn = document.getElementById('anim-play');
    const animResetBtn = document.getElementById('anim-reset');

    loadOrderIndex();
    cardanoTemplate = generateRandomTemplate(cardanoGridRows, cardanoGridCols);
    updateCardanoUI();
    updateOrderUI();
    renderCardanoTemplate();

    if (input) {
        input.addEventListener('input', function () {
            handleCardanoRectInputWithCursor(this);
            updateCardanoOutput();
        });
        input.addEventListener('paste', function () {
            setTimeout(() => {
                handleCardanoRectInputWithCursor(this);
                updateCardanoOutput();
            }, 10);
        });
    }

    if (modeEncrypt) modeEncrypt.addEventListener('click', () => {
        if (currentModeGlobal === 'encrypt') return;
        currentModeGlobal = 'encrypt';
        currentCardanoResult = null;
        updateCardanoUI();
        updateCardanoOutput();
        resetCardanoAnimation();
    });

    if (modeDecrypt) modeDecrypt.addEventListener('click', () => {
        if (currentModeGlobal === 'decrypt') return;
        currentModeGlobal = 'decrypt';
        currentCardanoResult = null;
        updateCardanoUI();
        updateCardanoOutput();
        resetCardanoAnimation();
    });

    if (gridSizeSelect) gridSizeSelect.addEventListener('change', function () {
        const [r, c] = this.value.split('x').map(Number);
        cardanoGridRows = r;
        cardanoGridCols = c;
        if (input) input.value = '';
        if (output) output.value = '';
        currentCardanoResult = null;
        regenerateCardanoTemplate();
        resetCardanoAnimation();
        closeCustomEditor();
    });

    if (newTemplateBtn) newTemplateBtn.addEventListener('click', function () {
        regenerateCardanoTemplate();
        GrassCCT.showMessage('Đã tạo template mới!', 'success');
        resetCardanoAnimation();
    });

    if (pasteBtn) pasteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        GrassCCT.pasteText(input).then(() => {
            if (input) {
                handleCardanoRectInputWithCursor(input);
                updateCardanoOutput();
            }
        });
    });
    if (copyInputBtn) copyInputBtn.addEventListener('click', (e) => { e.preventDefault(); GrassCCT.copyText(input.value); });
    if (copyOutputBtn) copyOutputBtn.addEventListener('click', (e) => { e.preventDefault(); GrassCCT.copyText(output.value); });
    if (clearBtn) clearBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (input) input.value = '';
        if (output) output.value = '';
        currentCardanoResult = null;
        GrassCCT.showMessage('Đã xoá nội dung!', 'info');
        updateCardanoOutput();
        resetCardanoAnimation();
    });

    const orderPrevBtn = document.getElementById('order-prev');
    const orderNextBtn = document.getElementById('order-next');
    const orderResetBtn = document.getElementById('order-reset');

    if (orderPrevBtn) orderPrevBtn.addEventListener('click', () => setOrderIndex(currentOrderIndex - 1));
    if (orderNextBtn) orderNextBtn.addEventListener('click', () => setOrderIndex(currentOrderIndex + 1));
    if (orderResetBtn) orderResetBtn.addEventListener('click', () => {
        setOrderIndex(DEFAULT_ORDER_INDEX);
        if (cardanoGridRows === 6 && cardanoGridCols === 10) {
            cardanoTemplate = generateFixedTemplate6x10();
            updateCardanoOutput();
            resetCardanoAnimation();
        }
        GrassCCT.showMessage('Đã về template & thứ tự mặc định!', 'info');
    });

    const animPrevBtn = document.getElementById('anim-prev');
    const animNextBtn = document.getElementById('anim-next');
    const customTemplateBtn = document.getElementById('custom-template');
    const customRandomBtn = document.getElementById('custom-random');
    const customClearBtn = document.getElementById('custom-clear');
    const customApplyBtn = document.getElementById('custom-apply');
    const customCancelBtn = document.getElementById('custom-cancel');

    if (animPlayBtn) animPlayBtn.addEventListener('click', playCardanoAnimation);
    if (animResetBtn) animResetBtn.addEventListener('click', resetCardanoAnimation);
    if (animPrevBtn) animPrevBtn.addEventListener('click', goToPrevStep);
    if (animNextBtn) animNextBtn.addEventListener('click', goToNextStep);

    if (customTemplateBtn) customTemplateBtn.addEventListener('click', openCustomEditor);
    if (customRandomBtn) customRandomBtn.addEventListener('click', randomFillEditor);
    if (customClearBtn) customClearBtn.addEventListener('click', clearEditor);
    if (customApplyBtn) customApplyBtn.addEventListener('click', applyCustomTemplate);
    if (customCancelBtn) customCancelBtn.addEventListener('click', closeCustomEditor);

    resetCardanoAnimation();
});

// ==================== ANIMATION ====================

let animTimers = [];
let animPlaying = false;
let animOrderCache = null;
let animCipherGrid = null;
let currentAnimStep = -1;

function animSleep(ms) {
    return new Promise(resolve => {
        const t = setTimeout(resolve, ms);
        animTimers.push(t);
    });
}

function clearAnimTimers() {
    animTimers.forEach(t => clearTimeout(t));
    animTimers = [];
}

function prepareAnimOrder(plaintext) {
    const rows = cardanoTemplate.length;
    const cols = cardanoTemplate[0].length;
    const capacity = rows * cols;
    let clean = prepareCardanoInput(plaintext);
    if (clean.length > capacity) clean = clean.slice(0, capacity);

    const order = getCurrentOrder();
    const animOrder = [];
    let idx = 0;
    for (let stepIdx = 0; stepIdx < 4; stepIdx++) {
        const pos = order[stepIdx];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (isHoleAt(cardanoTemplate, r, c, pos)) {
                    const isPad = idx >= clean.length;
                    const ch = isPad ? PAD_CHAR : clean[idx++];
                    animOrder.push({ r, c, ch, rot: stepIdx, position: pos, isPad });
                }
            }
        }
    }
    return animOrder;
}

function prepareDecryptAnimOrder(ciphertext) {
    const rows = cardanoTemplate.length;
    const cols = cardanoTemplate[0].length;
    const capacity = rows * cols;
    let clean = prepareCardanoInput(ciphertext);
    if (clean.length < capacity) clean = clean.padEnd(capacity, PAD_CHAR);
    if (clean.length > capacity) clean = clean.slice(0, capacity);

    const grid = [];
    for (let r = 0; r < rows; r++) {
        grid.push(clean.slice(r * cols, (r + 1) * cols).split(''));
    }

    const order = getCurrentOrder();
    const animOrder = [];
    for (let stepIdx = 0; stepIdx < 4; stepIdx++) {
        const pos = order[stepIdx];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (isHoleAt(cardanoTemplate, r, c, pos)) {
                    animOrder.push({ r, c, ch: grid[r][c], rot: stepIdx, position: pos, isPad: false });
                }
            }
        }
    }
    return { grid, order: animOrder };
}

function renderAnimStage() {
    const container = document.getElementById('anim-stage');
    if (!container || !cardanoTemplate) return;

    const rows = cardanoTemplate.length;
    const cols = cardanoTemplate[0].length;
    const isDecrypt = currentModeGlobal === 'decrypt';

    // Font tỉ lệ theo bề rộng ô (~36%) — dùng cqw để tự co giãn
    // theo bề rộng board (to trên màn lớn, nhỏ trên mobile).
    const cellFontCss = `calc(100cqw / ${cols} * 0.36)`;

    let cellsHtml = '';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let content = '';
            let extraCls = '';
            if (isDecrypt && animCipherGrid) {
                content = animCipherGrid[r][c] || '';
                if (content) extraCls = 'cardano-anim-cell-cipher';
            }
            cellsHtml += `<div class="cardano-anim-cell ${extraCls}" data-r="${r}" data-c="${c}"
                style="grid-row:${r + 1};grid-column:${c + 1};font-size:${cellFontCss};">${content}</div>`;
        }
    }

    let grilleHtml = '';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const isHole = cardanoTemplate[r][c];
            const style = isHole
                ? `grid-row:${r + 1};grid-column:${c + 1};background:transparent;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.5), inset 0 0 0 2px rgba(5,150,105,0.35);`
                : `grid-row:${r + 1};grid-column:${c + 1};background:rgba(5,150,105,0.85);`;
            grilleHtml += `<div style="${style}"></div>`;
        }
    }

    const aspect = cols / rows;
    // Marker góc ~40% kích thước ô — tự co giãn theo loại bảng,
    // đủ nhỏ để không che ký tự trong ô top-right.
    const markerSize = 'calc(100% / 2.5)';

    container.innerHTML = `
        <div class="flex flex-col items-center w-full">
            <div style="min-height:56px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;width:100%;">
                <div id="anim-badge" style="
                min-width:clamp(64px, 18vw, 110px);text-align:center;
                padding:clamp(4px, 1.2vw, 8px) clamp(12px, 4vw, 24px);
                border-radius:clamp(8px, 2.5vw, 14px);
                font-size:clamp(14px, 4.5vw, 20px);font-weight:800;
                background:linear-gradient(135deg, rgba(5,150,105,0.95), rgba(4,120,87,0.95));
                color:#fff;font-family:ui-monospace,monospace;
                transition:opacity 0.35s, transform 0.35s;
                opacity:0;pointer-events:none;
                box-shadow:0 10px 30px rgba(5,150,105,0.4);
                letter-spacing:0.05em;">Gốc</div>
            </div>
            <div class="cardano-anim-board" style="position:relative;width:100%;max-width:min(100%, 560px);aspect-ratio:${aspect};
                background:#ffffff;border-radius:14px;overflow:hidden;
                box-shadow:0 20px 45px -15px rgba(5,150,105,0.35), 0 0 0 1px rgba(5,150,105,0.12);
                perspective:1200px;
                container-type: inline-size;">
                <div style="position:absolute;inset:0;display:grid;
                    grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr);">
                    ${cellsHtml}
                </div>
                <div id="anim-grille" class="cardano-anim-grille" style="position:absolute;inset:0;
                    display:grid;grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr);
                    transform:${grilleTransform(0)};pointer-events:none;opacity:0;">

                    <div id="anim-marker" style="
                        grid-row:1;grid-column:${cols};
                        justify-self:end;align-self:start;
                        width:${markerSize};height:${markerSize};
                        background:linear-gradient(135deg, rgba(251,191,36,0.95) 0%, rgba(245,158,11,0.85) 100%);
                        border-top-right-radius:12px;
                        border-bottom-left-radius:100%;
                        box-shadow:inset 0 0 0 1px rgba(255,255,255,0.4), 0 2px 8px rgba(245,158,11,0.5);
                        z-index:10;
                        pointer-events:none;
                        opacity:0.9;
                    "></div>

                    ${grilleHtml}
                </div>
            </div>
        </div>
    `;
}

function activateStep(step) {
    document.querySelectorAll('.anim-step').forEach(el => {
        const s = parseInt(el.dataset.step);
        if (s === step) {
            el.classList.remove('done');
            el.classList.add('active');
        } else if (s > step) {
            el.classList.remove('active', 'done');
        }
    });
}

function markStepDone(step) {
    const el = document.querySelector(`.anim-step[data-step="${step}"]`);
    if (el) {
        el.classList.remove('active');
        el.classList.add('done');
    }
}

function resetAnimSteps() {
    document.querySelectorAll('.anim-step').forEach(el => el.classList.remove('active', 'done'));
}

function showBadge(text) {
    const badge = document.getElementById('anim-badge');
    if (!badge) return;
    badge.innerHTML = text;
    badge.style.background = 'linear-gradient(135deg, rgba(5,150,105,0.95), rgba(4,120,87,0.95))';
    badge.style.boxShadow = '0 10px 30px rgba(5,150,105,0.4)';
    badge.style.opacity = '1';
    badge.style.transform = 'scale(1)';
}

function showBadgeDone() {
    const badge = document.getElementById('anim-badge');
    if (!badge) return;
    badge.innerHTML = '<i class="fas fa-check"></i> Hoàn tất';
    badge.style.background = 'linear-gradient(135deg, rgba(5,150,105,0.95), rgba(4,120,87,0.95))';
    badge.style.boxShadow = '0 10px 30px rgba(5,150,105,0.5)';
    badge.style.opacity = '1';
    badge.style.transform = 'scale(1)';
}

function setAnimStatus(html) {
    const el = document.getElementById('anim-status');
    if (el) el.innerHTML = html;
}

async function fillStepItems(step) {
    const isDecrypt = currentModeGlobal === 'decrypt';
    const items = animOrderCache.filter(o => o.rot === step);

    for (const item of items) {
        const cell = document.querySelector(
            `.cardano-anim-cell[data-r="${item.r}"][data-c="${item.c}"]`
        );
        if (!cell) continue;

        if (isDecrypt) {
            cell.classList.remove('cardano-anim-cell-revealed');
            void cell.offsetWidth;
            cell.classList.add('cardano-anim-cell-revealed');
        } else {
            cell.classList.remove('cardano-anim-cell-filled');
            void cell.offsetWidth;
            cell.textContent = item.ch;
            cell.classList.add('cardano-anim-cell-filled');
            if (item.isPad) cell.classList.add('cardano-anim-cell-pad');
        }
        await animSleep(65);
    }
}

// ============ ANIMATE STEP — dùng animateGrilleTo để tránh lật chéo ============
async function animateStepForward(step) {
    activateStep(step);
    const pos = getPositionForStep(step);

    if (step === 0) {
        // Lượt gốc: không lật
        showBadge(POSITION_BADGE[pos]);
        await animSleep(840);
    } else {
        // Nếu cần, reset về gốc trước (để không lật chéo)
        if (currentGrillePos !== 0) {
            setAnimStatus(`<i class="fas fa-undo mr-1"></i>Đưa lưới về vị trí gốc...`);
            showBadge('Gốc');
            const grille = document.getElementById('anim-grille');
            if (grille) {
                grille.style.transition = 'transform 1s ease-in-out';
                grille.style.transform = grilleTransform(0);
            }
            currentGrillePos = 0;
            await animSleep(1050);
        }

        // Lật đơn trục sang vị trí mới
        setAnimStatus(`<i class="fas fa-rotate mr-1"></i>Lượt ${step + 1}: ${POSITION_LABELS[pos]}...`);
        showBadge(POSITION_BADGE[pos]);
        const grille = document.getElementById('anim-grille');
        if (grille) {
            grille.style.transition = 'transform 2s cubic-bezier(0.65, 0, 0.35, 1)';
            grille.style.transform = grilleTransform(pos);
        }
        currentGrillePos = pos;
        await animSleep(2100);
    }

    setAnimStatus(`<i class="fas fa-pen mr-1"></i>Điền ký tự vào lỗ khoét — Lượt ${step + 1} (${POSITION_LABELS[pos]})`);
    await fillStepItems(step);

    markStepDone(step);
    currentAnimStep = step;
    await animSleep(1260);
}

async function finishAnimation() {
    const grille = document.getElementById('anim-grille');
    const isDecrypt = currentModeGlobal === 'decrypt';

    const msg = isDecrypt
        ? 'Hoàn tất 4 lượt — Đã đọc xong bản rõ...'
        : 'Hoàn tất 4 lượt — Đang đọc lưới theo hàng...';
    setAnimStatus(`<i class="fas fa-check-circle mr-1 text-emerald-500"></i>${msg}`);
    await animSleep(1500);

    if (grille) grille.style.opacity = '0';
    showBadgeDone();
    await animSleep(1950);

    showAnimResult(animOrderCache);
    setAnimStatus(`<i class="fas fa-flag-checkered mr-1 text-emerald-700 dark:text-emerald-400"></i>Kết quả đã sẵn sàng! Dùng nút bên dưới để xem lại từng lượt.`);
}

async function playCardanoAnimation() {
    const input = document.getElementById('cardano-input');
    const text = input ? input.value : '';
    const isDecrypt = currentModeGlobal === 'decrypt';

    if (!text || !text.trim()) {
        GrassCCT.showMessage('Nhập văn bản trước khi chạy hoạt ảnh!', 'warning');
        return;
    }
    if (animPlaying) return;
    animPlaying = true;

    const playBtn = document.getElementById('anim-play');
    const navEl = document.getElementById('anim-nav');
    if (playBtn) playBtn.disabled = true;
    if (navEl) navEl.style.display = 'none';

    clearAnimTimers();
    resetAnimSteps();

    const resultEl = document.getElementById('anim-result');
    if (resultEl) { resultEl.classList.add('hidden'); resultEl.innerHTML = ''; }

    if (isDecrypt) {
        const decryptData = prepareDecryptAnimOrder(text);
        animOrderCache = decryptData.order;
        animCipherGrid = decryptData.grid;
    } else {
        animCipherGrid = null;
        animOrderCache = prepareAnimOrder(text);
    }

    renderAnimStage();
    currentGrillePos = 0;

    const grille = document.getElementById('anim-grille');
    if (grille) {
        grille.style.transition = 'none';
        grille.style.transform = grilleTransform(0);
        grille.style.opacity = '1';
    }
    showBadge('Gốc');
    currentAnimStep = -1;

    setAnimStatus('<i class="fas fa-hourglass-start mr-1"></i>Chuẩn bị...');
    await animSleep(1500);

    for (let s = 0; s < 4; s++) {
        await animateStepForward(s);
    }

    await finishAnimation();

    animPlaying = false;
    if (playBtn) playBtn.disabled = false;
    if (navEl) navEl.style.display = 'flex';
    updateNavButtons();
}

function updateNavButtons() {
    const prevBtn = document.getElementById('anim-prev');
    const nextBtn = document.getElementById('anim-next');
    if (prevBtn) prevBtn.disabled = animPlaying || currentAnimStep < 0;
    if (nextBtn) nextBtn.disabled = animPlaying || currentAnimStep >= 3;
}

async function goToPrevStep() {
    if (animPlaying || currentAnimStep < 0) return;
    animPlaying = true;
    updateNavButtons();
    const playBtn = document.getElementById('anim-play');
    if (playBtn) playBtn.disabled = true;

    const step = currentAnimStep;
    const isDecrypt = currentModeGlobal === 'decrypt';

    const items = animOrderCache.filter(o => o.rot === step);
    for (const item of items) {
        const cell = document.querySelector(
            `.cardano-anim-cell[data-r="${item.r}"][data-c="${item.c}"]`
        );
        if (!cell) continue;
        if (isDecrypt) {
            cell.classList.remove('cardano-anim-cell-revealed');
        } else {
            cell.textContent = '';
            cell.classList.remove('cardano-anim-cell-filled', 'cardano-anim-cell-pad');
        }
    }

    const stepEl = document.querySelector(`.anim-step[data-step="${step}"]`);
    if (stepEl) stepEl.classList.remove('active', 'done');

    const resultEl = document.getElementById('anim-result');
    if (resultEl) { resultEl.classList.add('hidden'); resultEl.innerHTML = ''; }

    const badge = document.getElementById('anim-badge');
    if (badge) {
        badge.style.background = 'linear-gradient(135deg, rgba(5,150,105,0.95), rgba(4,120,87,0.95))';
        badge.style.boxShadow = '0 10px 30px rgba(5,150,105,0.4)';
    }

    currentAnimStep = step - 1;

    const grille = document.getElementById('anim-grille');
    if (grille) grille.style.opacity = '1';

    if (currentAnimStep >= 0) {
        const pos = getPositionForStep(currentAnimStep);

        // Reset về gốc trước
        if (currentGrillePos !== 0) {
            grille.style.transition = 'transform 1s ease-in-out';
            grille.style.transform = grilleTransform(0);
            currentGrillePos = 0;
            await animSleep(1050);
        }

        // Lật đến vị trí mới
        showBadge(POSITION_BADGE[pos]);
        setAnimStatus(`<i class="fas fa-rotate-left mr-1"></i>Lùi về lượt ${currentAnimStep + 1} (${POSITION_LABELS[pos]})`);
        grille.style.transition = 'transform 2s cubic-bezier(0.65, 0, 0.35, 1)';
        grille.style.transform = grilleTransform(pos);
        currentGrillePos = pos;
        await animSleep(2100);
    } else {
        showBadge('Gốc');
        grille.style.transition = 'transform 1s ease-in-out';
        grille.style.transform = grilleTransform(0);
        currentGrillePos = 0;
        setAnimStatus('<i class="fas fa-rotate-left mr-1"></i>Đã lùi về trạng thái ban đầu');
        await animSleep(1050);
    }

    animPlaying = false;
    if (playBtn) playBtn.disabled = false;
    updateNavButtons();
}

async function goToNextStep() {
    if (animPlaying || currentAnimStep >= 3) return;
    animPlaying = true;
    updateNavButtons();
    const playBtn = document.getElementById('anim-play');
    if (playBtn) playBtn.disabled = true;

    const grille = document.getElementById('anim-grille');
    if (grille) grille.style.opacity = '1';

    await animateStepForward(currentAnimStep + 1);

    if (currentAnimStep === 3) {
        await finishAnimation();
    }

    animPlaying = false;
    if (playBtn) playBtn.disabled = false;
    updateNavButtons();
}

function showAnimResult(order) {
    const resultEl = document.getElementById('anim-result');
    if (!resultEl) return;

    const rows = cardanoTemplate.length;
    const cols = cardanoTemplate[0].length;
    const isDecrypt = currentModeGlobal === 'decrypt';

    let output = '';
    if (isDecrypt) {
        for (const item of order) output += item.ch;
    } else {
        const grid = Array.from({ length: rows }, () => Array(cols).fill(''));
        for (const item of order) grid[item.r][item.c] = item.ch;
        output = grid.map(row => row.join('')).join('');
    }

    const chunks = [];
    for (let i = 0; i < output.length; i += 5) {
        chunks.push(output.slice(i, i + 5));
    }

    const nonPad = order.filter(o => !o.isPad).length;
    const pad = order.length - nonPad;

    const label = isDecrypt
        ? 'Bản rõ (đọc theo 4 lượt)'
        : 'Bản mã (đọc theo hàng)';
    const note = isDecrypt
        ? `Đã đọc ${order.length} ký tự từ bản mã qua 4 lượt`
        : `${nonPad} ký tự thực + ${pad} ký tự "–" (xám, trên lưới)`;

    resultEl.innerHTML = `
        <div class="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
            <div class="text-xs uppercase tracking-wider font-bold text-emerald-800 dark:text-emerald-400 mb-2">
                <i class="fas fa-file-lines mr-1"></i>${label}
            </div>
            <div class="flex flex-wrap gap-1 mb-3">
                ${chunks.map(ch => `<span class="anim-chunk">${ch}</span>`).join('')}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
                <i class="fas fa-info-circle mr-1"></i>
                ${note}
            </div>
        </div>
    `;
    resultEl.classList.remove('hidden');
}

function resetCardanoAnimation() {
    clearAnimTimers();
    animPlaying = false;
    currentAnimStep = -1;
    animOrderCache = null;
    animCipherGrid = null;
    currentGrillePos = 0;

    const playBtn = document.getElementById('anim-play');
    if (playBtn) playBtn.disabled = false;

    resetAnimSteps();
    setAnimStatus('');

    const resultEl = document.getElementById('anim-result');
    if (resultEl) { resultEl.classList.add('hidden'); resultEl.innerHTML = ''; }

    const navEl = document.getElementById('anim-nav');
    if (navEl) navEl.style.display = 'none';

    renderAnimStage();

    // Reset transition + transform về mặc định
    const grille = document.getElementById('anim-grille');
    if (grille) {
        grille.style.transition = 'none';
        grille.style.transform = grilleTransform(0);
    }
}

// ==================== CUSTOM TEMPLATE EDITOR ====================

let editorSelection = new Set();

function getOrbitKeys(r, c, rows, cols) {
    return [
        `${r},${c}`,
        `${rows - 1 - r},${cols - 1 - c}`,
        `${rows - 1 - r},${c}`,
        `${r},${cols - 1 - c}`
    ];
}

function turnOfCellInEditor(r, c, rows, cols) {
    for (let pos = 0; pos < 4; pos++) {
        const [tr, tc] = templateCellAt(r, c, pos, rows, cols);
        if (editorSelection.has(`${tr},${tc}`)) return pos;
    }
    return -1;
}

function renderCustomGrid() {
    const container = document.getElementById('custom-grid');
    if (!container) return;
    const rows = cardanoGridRows;
    const cols = cardanoGridCols;

    const requiredEl = document.getElementById('custom-required');
    const countEl = document.getElementById('custom-count');
    const required = (rows * cols) / 4;
    if (requiredEl) requiredEl.textContent = required;
    if (countEl) {
        countEl.textContent = editorSelection.size;
        countEl.classList.toggle('text-emerald-700', editorSelection.size === required);
        countEl.classList.toggle('dark:text-emerald-400', editorSelection.size === required);
    }

    const cfg = getCellConfig(rows, cols);
    const cs = cfg.cell - 6;
    const fs = cfg.fontSize - 4;
    const hf = cfg.headFont;
    const rw = cfg.rowLabelW - 4;

    let html = `<div class="overflow-x-auto pb-2">
        <table class="table-encrypt mx-auto" style="table-layout: fixed; width: auto;">
            <thead><tr>
                <th class="bg-emerald-100 dark:bg-emerald-900/30 text-center"
                    style="width:${rw}px;font-size:${hf}px;"></th>`;
    for (let c = 1; c <= cols; c++) {
        html += `<th class="bg-emerald-100 dark:bg-emerald-900/30 text-center"
            style="width:${cs}px;font-size:${hf}px;">${c}</th>`;
    }
    html += `</tr></thead><tbody>`;

    for (let r = 0; r < rows; r++) {
        html += `<tr>
            <td class="font-bold bg-emerald-100 dark:bg-emerald-900/30 text-center"
                style="width:${rw}px;font-size:${hf}px;padding:2px;">${r + 1}</td>`;
        for (let c = 0; c < cols; c++) {
            const key = `${r},${c}`;
            const isSel = editorSelection.has(key);
            const pos = turnOfCellInEditor(r, c, rows, cols);
            const isAffected = !isSel && pos >= 0;

            const bg = pos >= 0 ? CARDANO_ROT_BG[pos] : 'bg-gray-100 dark:bg-gray-700/30';
            const cls = ['custom-cell', 'text-center', 'font-bold', 'font-mono'];
            if (isSel) cls.push('custom-cell-selected');
            if (isAffected) cls.push('custom-cell-affected');

            const content = isSel ? '●' : (isAffected ? '○' : '');

            html += `<td class="${bg} ${cls.join(' ')}" data-r="${r}" data-c="${c}"
                style="width:${cs}px;height:${cs}px;font-size:${fs}px;padding:4px;">${content}</td>`;
        }
        html += `</tr>`;
    }
    html += `</tbody></table></div>`;

    container.innerHTML = html;

    container.querySelectorAll('td[data-r]').forEach(td => {
        td.addEventListener('click', () => {
            editorClickCell(parseInt(td.dataset.r), parseInt(td.dataset.c));
        });
    });
}

function editorClickCell(r, c) {
    const key = `${r},${c}`;
    if (editorSelection.has(key)) {
        editorSelection.delete(key);
    } else {
        const orbitKeys = getOrbitKeys(r, c, cardanoGridRows, cardanoGridCols);
        for (const k of orbitKeys) editorSelection.delete(k);
        editorSelection.add(key);
    }
    renderCustomGrid();
}

function randomFillEditor() {
    const rows = cardanoGridRows;
    const cols = cardanoGridCols;
    const required = (rows * cols) / 4;

    if (editorSelection.size < required) {
        const assigned = new Set();
        for (const key of editorSelection) {
            const [r, c] = key.split(',').map(Number);
            for (const k of getOrbitKeys(r, c, rows, cols)) assigned.add(k);
        }

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (assigned.has(`${r},${c}`)) continue;
                const orbitKeys = getOrbitKeys(r, c, rows, cols);
                const pickKey = orbitKeys[Math.floor(Math.random() * 4)];
                editorSelection.add(pickKey);
                for (const k of orbitKeys) assigned.add(k);
            }
        }

        renderCustomGrid();
        flashCustomGrid();
        return;
    }

    const prevSignature = [...editorSelection].sort().join('|');

    let newSelection, signature;
    let attempts = 0;
    do {
        newSelection = new Set();
        const assigned = new Set();
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (assigned.has(`${r},${c}`)) continue;
                const orbitKeys = getOrbitKeys(r, c, rows, cols);
                const pickKey = orbitKeys[Math.floor(Math.random() * 4)];
                newSelection.add(pickKey);
                for (const k of orbitKeys) assigned.add(k);
            }
        }
        signature = [...newSelection].sort().join('|');
        attempts++;
    } while (signature === prevSignature && attempts < 20);

    editorSelection = newSelection;
    renderCustomGrid();
    flashCustomGrid();
}

function flashCustomGrid() {
    const container = document.getElementById('custom-grid');
    if (!container) return;
    const tbl = container.querySelector('table');
    if (!tbl) return;
    tbl.style.transition = 'none';
    tbl.style.opacity = '0.35';
    tbl.style.transform = 'scale(0.98)';
    void tbl.offsetWidth;
    tbl.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
    tbl.style.opacity = '1';
    tbl.style.transform = 'scale(1)';
}

function clearEditor() {
    editorSelection.clear();
    renderCustomGrid();
}

function openCustomEditor() {
    const rows = cardanoGridRows;
    const cols = cardanoGridCols;
    editorSelection = new Set();
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (cardanoTemplate[r][c]) editorSelection.add(`${r},${c}`);
        }
    }
    const el = document.getElementById('custom-editor');
    if (el) {
        el.classList.remove('hidden');
        renderCustomGrid();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function closeCustomEditor() {
    const el = document.getElementById('custom-editor');
    if (el) el.classList.add('hidden');
}

function applyCustomTemplate() {
    const rows = cardanoGridRows;
    const cols = cardanoGridCols;
    const required = (rows * cols) / 4;
    if (editorSelection.size !== required) {
        GrassCCT.showMessage(
            `Cần chọn đúng ${required} ô — bạn đang chọn ${editorSelection.size}`,
            'warning'
        );
        return;
    }
    const template = Array.from({ length: rows }, () => Array(cols).fill(false));
    for (const key of editorSelection) {
        const [r, c] = key.split(',').map(Number);
        template[r][c] = true;
    }
    cardanoTemplate = template;
    updateCardanoOutput();
    resetCardanoAnimation();
    closeCustomEditor();
    GrassCCT.showMessage('Đã áp dụng template tự khoét!', 'success');
}