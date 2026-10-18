// ==================== CARDANO GRILLE (Решетка Кардано) ====================

const CARDANO_LETTERS = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
const PAD_CHAR = '–';
const CARDANO_ROT_COLORS = [
    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'
];
const CARDANO_ROT_BG = [
    'bg-blue-100 dark:bg-blue-900/40',
    'bg-emerald-100 dark:bg-emerald-900/40',
    'bg-amber-100 dark:bg-amber-900/40',
    'bg-rose-100 dark:bg-rose-900/40'
];
const CARDANO_ROT_NAMES = ['0°', '90°', '180°', '270°'];

let cardanoTemplate = null;
let cardanoGridSize = 6;
let currentModeGlobal = 'encrypt';
let currentCardanoResult = null;

// ---------- TEMPLATE ----------

function generateRandomTemplate(n) {
    const template = Array.from({ length: n }, () => Array(n).fill(false));
    const assigned = Array.from({ length: n }, () => Array(n).fill(false));

    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (assigned[r][c]) continue;
            const orbit = [];
            let cr = r, cc = c;
            for (let k = 0; k < 4; k++) {
                orbit.push([cr, cc]);
                assigned[cr][cc] = true;
                const nr = cc, nc = n - 1 - cr;
                cr = nr; cc = nc;
            }
            const [hr, hc] = orbit[Math.floor(Math.random() * 4)];
            template[hr][hc] = true;
        }
    }
    return template;
}

function countHoles(template) {
    let count = 0;
    for (const row of template) for (const cell of row) if (cell) count++;
    return count;
}

function templateCellAt(r, c, rot, n) {
    switch (rot) {
        case 0: return [r, c];
        case 1: return [n - 1 - c, r];
        case 2: return [n - 1 - r, n - 1 - c];
        case 3: return [c, n - 1 - r];
        default: return [r, c];
    }
}

function isHoleAt(template, r, c, rot) {
    const n = template.length;
    const [tr, tc] = templateCellAt(r, c, rot, n);
    return template[tr][tc];
}

function rotationForCell(template, r, c) {
    for (let k = 0; k < 4; k++) {
        if (isHoleAt(template, r, c, k)) return k;
    }
    return -1;
}

// ---------- ENCRYPT / DECRYPT ----------

function randomCardanoLetter() {
    return CARDANO_LETTERS[Math.floor(Math.random() * CARDANO_LETTERS.length)];
}

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

function processCardanoInput(text) {
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

function handleCardanoInputWithCursor(textarea, showAlert = true) {
    const original = textarea.value;
    const cursorPos = textarea.selectionStart;
    const { text: processed, invalidChars } = processCardanoInput(original);

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
    const processedBefore = processCardanoInput(beforeCursor).text;
    const newCursorPos = Math.min(processedBefore.length, processed.length);

    textarea.value = processed;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    return processed;
}

function cardanoEncrypt(text, template) {
    const n = template.length;
    const capacity = n * n;
    let clean = prepareCardanoInput(text);
    if (clean.length > capacity) clean = clean.slice(0, capacity);

    const grid = Array.from({ length: n }, () => Array(n).fill(''));
    const padFlags = Array.from({ length: n }, () => Array(n).fill(false));

    let idx = 0;
    for (let rot = 0; rot < 4; rot++) {
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                if (isHoleAt(template, r, c, rot)) {
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
    const n = template.length;
    const capacity = n * n;
    let clean = prepareCardanoInput(ciphertext);
    if (clean.length < capacity) clean = clean.padEnd(capacity, PAD_CHAR);
    if (clean.length > capacity) clean = clean.slice(0, capacity);

    const grid = [];
    for (let r = 0; r < n; r++) {
        grid.push(clean.slice(r * n, (r + 1) * n).split(''));
    }

    let plaintext = '';
    for (let rot = 0; rot < 4; rot++) {
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                if (isHoleAt(template, r, c, rot)) {
                    plaintext += grid[r][c];
                }
            }
        }
    }

    return { grid, plaintext, ciphertext: clean };
}

// ---------- RENDER TEMPLATE ----------

function renderCardanoTemplate() {
    const container = document.getElementById('cardano-template');
    if (!container || !cardanoTemplate) return;

    const n = cardanoTemplate.length;
    const holes = countHoles(cardanoTemplate);
    const result = currentCardanoResult;
    const isEncrypt = currentModeGlobal === 'encrypt';

    const CELL_SIZE = { 4: 72, 6: 58, 8: 46, 10: 38 };
    const FONT_SIZE = { 4: 28, 6: 22, 8: 17, 10: 13 };
    const HEAD_FONT = { 4: 14, 6: 13, 8: 12, 10: 10 };
    const ROW_LABEL_W = { 4: 40, 6: 34, 8: 28, 10: 24 };
    const cellSize = CELL_SIZE[n] || 46;
    const fontSize = FONT_SIZE[n] || 16;
    const headFont = HEAD_FONT[n] || 12;
    const rowLabelW = ROW_LABEL_W[n] || 30;

    let html = `<div class="overflow-x-auto pb-2">
        <table class="table-encrypt mx-auto" style="table-layout: fixed; width: auto;">
            <thead><tr>
                <th class="bg-violet-100 dark:bg-violet-900/30 text-center"
                    style="width:${rowLabelW}px;font-size:${headFont}px;"></th>`;
    for (let c = 1; c <= n; c++) {
        html += `<th class="bg-violet-100 dark:bg-violet-900/30 text-center"
            style="width:${cellSize}px;font-size:${headFont}px;">${c}</th>`;
    }
    html += `</tr></thead><tbody>`;

    for (let r = 0; r < n; r++) {
        html += `<tr>
            <td class="font-bold bg-violet-100 dark:bg-violet-900/30 text-center"
                style="width:${rowLabelW}px;font-size:${headFont}px;padding:2px;">${r + 1}</td>`;

        for (let c = 0; c < n; c++) {
            const rot = rotationForCell(cardanoTemplate, r, c);
            const ch = result ? (result.grid[r][c] || '') : '';
            const isPad = result && result.padFlags && result.padFlags[r][c];
            const bg = rot >= 0 ? CARDANO_ROT_BG[rot] : 'bg-gray-100 dark:bg-gray-700/30';

            let content, contentCls = 'font-bold font-mono';
            if (ch) {
                content = ch;
                contentCls += isPad
                    ? ' text-gray-400 dark:text-gray-500'
                    : (isEncrypt ? ' text-violet-700 dark:text-violet-300' : ' text-gray-900 dark:text-white');
            } else {
                content = `<span class="font-mono text-gray-500 dark:text-gray-400"
                    style="font-size:${headFont}px;">${rot >= 0 ? rot : ''}</span>`;
            }

            html += `<td class="${bg} text-center ${contentCls}"
                style="width:${cellSize}px;height:${cellSize}px;font-size:${fontSize}px;padding:4px;">${content}</td>`;
        }
        html += `</tr>`;
    }
    html += `</tbody></table></div>`;

    html += `
        <div class="mt-3 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 items-center">
            ${[0, 1, 2, 3].map(k => `
                <span class="flex items-center gap-1.5">
                    <span class="inline-block w-3 h-3 rounded ${CARDANO_ROT_COLORS[k]}"></span>
                    Lượt ${k + 1} — ${CARDANO_ROT_NAMES[k]}
                </span>
            `).join('')}
            <span class="text-gray-300 dark:text-gray-600">|</span>
            <span>${n}×${n} = ${n * n} ô · ${holes} lỗ × 4 lượt</span>
        </div>
        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <i class="fas fa-info-circle mr-1"></i>
            Ô có màu = lỗ khoét của lượt xoay tương ứng. Trong bảng: chữ = ký tự đã ghi; số = lượt xoay điền vào ô.
            ${isEncrypt ? 'Ký tự <strong>–</strong> (xám) là ô đệm trống.' : ''}
        </p>
    `;

    container.innerHTML = html;
}

// ---------- MAIN FLOW ----------

function updateCardanoOutput() {
    const input = document.getElementById('cardano-input');
    const output = document.getElementById('cardano-output');
    if (!input || !output) return;

    if (!cardanoTemplate) cardanoTemplate = generateRandomTemplate(cardanoGridSize);

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
    cardanoTemplate = generateRandomTemplate(cardanoGridSize);
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
            ? 'Nhập văn bản tiếng Nga (ví dụ: ПРИВЕТ)'
            : 'Nhập văn bản đã mã hoá';
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

    cardanoTemplate = generateRandomTemplate(cardanoGridSize);
    updateCardanoUI();
    renderCardanoTemplate();

    if (input) {
        input.addEventListener('input', function () {
            handleCardanoInputWithCursor(this, true);
            updateCardanoOutput();
        });
        input.addEventListener('paste', function () {
            setTimeout(() => {
                handleCardanoInputWithCursor(this, true);
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
        cardanoGridSize = parseInt(this.value);
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

    if (pasteBtn) pasteBtn.addEventListener('click', (e) => { e.preventDefault(); GrassCCT.pasteText(input); });
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

// ==================== CARDANO ANIMATION ====================

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

// Chuẩn bị data animation cho MÃ HOÁ
function prepareAnimOrder(plaintext) {
    const n = cardanoTemplate.length;
    let clean = prepareCardanoInput(plaintext);
    if (clean.length > n * n) clean = clean.slice(0, n * n);

    const order = [];
    let idx = 0;
    for (let rot = 0; rot < 4; rot++) {
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                if (isHoleAt(cardanoTemplate, r, c, rot)) {
                    const isPad = idx >= clean.length;
                    const ch = isPad ? PAD_CHAR : clean[idx++];
                    order.push({ r, c, ch, rot, isPad });
                }
            }
        }
    }
    return order;
}

// Chuẩn bị data animation cho GIẢI MÃ
// - Grid = bản mã đã điền đầy
// - Order = thứ tự đọc 4 lượt (chính là bản rõ)
function prepareDecryptAnimOrder(ciphertext) {
    const n = cardanoTemplate.length;
    const capacity = n * n;
    let clean = prepareCardanoInput(ciphertext);
    if (clean.length < capacity) clean = clean.padEnd(capacity, '·');
    if (clean.length > capacity) clean = clean.slice(0, capacity);

    // Bản mã đọc theo hàng để tạo grid đầy
    const grid = [];
    for (let r = 0; r < n; r++) {
        grid.push(clean.slice(r * n, (r + 1) * n).split(''));
    }

    // Order: duyệt 4 lượt xoay, tại mỗi lỗ khoét thì đọc grid[r][c]
    const order = [];
    for (let rot = 0; rot < 4; rot++) {
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                if (isHoleAt(cardanoTemplate, r, c, rot)) {
                    order.push({
                        r, c,
                        ch: grid[r][c],
                        rot,
                        isPad: false
                    });
                }
            }
        }
    }
    return { grid, order };
}

function renderAnimStage() {
    const container = document.getElementById('anim-stage');
    if (!container || !cardanoTemplate) return;

    const n = cardanoTemplate.length;
    const isDecrypt = currentModeGlobal === 'decrypt';

    const ANIM_FONT = { 4: 28, 6: 22, 8: 17, 10: 13 };
    const cellFont = ANIM_FONT[n] || 16;

    let cellsHtml = '';
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            let content = '';
            let extraCls = '';
            if (isDecrypt && animCipherGrid) {
                content = animCipherGrid[r][c] || '';
                if (content) extraCls = 'cardano-anim-cell-cipher';
            }
            cellsHtml += `<div class="cardano-anim-cell ${extraCls}" data-r="${r}" data-c="${c}"
                style="grid-row:${r + 1};grid-column:${c + 1};font-size:${cellFont}px;">${content}</div>`;
        }
    }

    let grilleHtml = '';
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const isHole = cardanoTemplate[r][c];
            const style = isHole
                ? `grid-row:${r + 1};grid-column:${c + 1};background:transparent;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.5), inset 0 0 0 2px rgba(76,29,149,0.25);`
                : `grid-row:${r + 1};grid-column:${c + 1};background:rgba(76,29,149,0.85);`;
            grilleHtml += `<div style="${style}"></div>`;
        }
    }

    container.innerHTML = `
        <div class="flex flex-col items-center">
            <div style="min-height:56px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;">
                <div id="anim-badge" style="
                min-width:clamp(64px, 18vw, 110px);text-align:center;
                padding:clamp(4px, 1.2vw, 8px) clamp(12px, 4vw, 24px);
                border-radius:clamp(8px, 2.5vw, 14px);
                font-size:clamp(14px, 4.5vw, 22px);font-weight:800;
                background:linear-gradient(135deg, rgba(139,92,246,0.95), rgba(76,29,149,0.95));
                color:#fff;font-family:ui-monospace,monospace;
                transition:opacity 0.35s, transform 0.35s;
                opacity:0;pointer-events:none;
                box-shadow:0 10px 30px rgba(139,92,246,0.35);
                letter-spacing:0.05em;">0°</div>
            </div>
            <div class="cardano-anim-board" style="position:relative;width:100%;max-width:400px;aspect-ratio:1/1;
                background:#ffffff;border-radius:14px;overflow:hidden;
                box-shadow:0 20px 45px -15px rgba(76,29,149,0.35), 0 0 0 1px rgba(76,29,149,0.12);">
                <div style="position:absolute;inset:0;display:grid;
                    grid-template-columns:repeat(${n},1fr);grid-template-rows:repeat(${n},1fr);">
                    ${cellsHtml}
                </div>
                <div id="anim-grille" class="cardano-anim-grille" style="position:absolute;inset:0;
                    display:grid;grid-template-columns:repeat(${n},1fr);grid-template-rows:repeat(${n},1fr);
                    transform:rotate(0deg);transform-origin:center center;pointer-events:none;opacity:0;">
                    ${grilleHtml}
                </div>
            </div>
        </div>
    `;
}

// ===== Progress step helpers =====

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

// ===== Badge =====

function showBadge(text) {
    const badge = document.getElementById('anim-badge');
    if (!badge) return;
    badge.innerHTML = text;
    badge.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.95), rgba(76,29,149,0.95))';
    badge.style.boxShadow = '0 10px 30px rgba(139,92,246,0.35)';
    badge.style.opacity = '1';
    badge.style.transform = 'scale(1)';
}

function showBadgeDone() {
    const badge = document.getElementById('anim-badge');
    if (!badge) return;
    badge.innerHTML = '<i class="fas fa-check"></i> 270°';
    badge.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))';
    badge.style.boxShadow = '0 10px 30px rgba(16,185,129,0.4)';
    badge.style.opacity = '1';
    badge.style.transform = 'scale(1)';
}

function setAnimStatus(html) {
    const el = document.getElementById('anim-status');
    if (el) el.innerHTML = html;
}

// ===== Fill & step-forward =====

async function fillStepItems(step) {
    const isDecrypt = currentModeGlobal === 'decrypt';
    const items = animOrderCache.filter(o => o.rot === step);

    for (const item of items) {
        const cell = document.querySelector(
            `.cardano-anim-cell[data-r="${item.r}"][data-c="${item.c}"]`
        );
        if (!cell) continue;

        if (isDecrypt) {
            // GIẢI MÃ: ô đã có sẵn chữ → chỉ highlight
            cell.classList.remove('cardano-anim-cell-revealed');
            void cell.offsetWidth;
            cell.classList.add('cardano-anim-cell-revealed');
        } else {
            // MÃ HOÁ: điền ký tự + hiệu ứng rơi
            cell.classList.remove('cardano-anim-cell-filled');
            void cell.offsetWidth;
            cell.textContent = item.ch;
            cell.classList.add('cardano-anim-cell-filled');
            if (item.isPad) cell.classList.add('cardano-anim-cell-pad');
        }
        await animSleep(65);
    }
}

async function animateStepForward(step) {
    activateStep(step);
    const grille = document.getElementById('anim-grille');

    if (step > 0) {
        setAnimStatus(`<i class="fas fa-rotate mr-1"></i>Xoay lưới sang ${step * 90}°...`);
        showBadge(`${step * 90}°`);
        if (grille) grille.style.transform = `rotate(${step * 90}deg)`;
        await animSleep(1050);
    } else {
        showBadge('0°');
        await animSleep(280);
    }

    setAnimStatus(`<i class="fas fa-pen mr-1"></i>Điền ký tự vào lỗ khoét — Lượt ${step + 1} (${step * 90}°)`);
    await fillStepItems(step);

    markStepDone(step);
    currentAnimStep = step;
    await animSleep(420);
}

// ===== Kết thúc animation (dùng chung cho cả 2 mode) =====

async function finishAnimation() {
    const grille = document.getElementById('anim-grille');
    const isDecrypt = currentModeGlobal === 'decrypt';

    const msg = isDecrypt
        ? 'Hoàn tất 4 lượt — Đã đọc xong bản rõ...'
        : 'Hoàn tất 4 lượt — Đang đọc lưới theo hàng...';
    setAnimStatus(`<i class="fas fa-check-circle mr-1 text-emerald-500"></i>${msg}`);
    await animSleep(500);

    if (grille) grille.style.opacity = '0';
    showBadgeDone();
    await animSleep(650);

    showAnimResult(animOrderCache, cardanoTemplate.length);

    const doneMsg = isDecrypt
        ? 'Bản rõ đã sẵn sàng! Dùng nút bên dưới để xem lại từng lượt.'
        : 'Bản mã đã sẵn sàng! Dùng nút bên dưới để xem lại từng lượt.';
    setAnimStatus(`<i class="fas fa-flag-checkered mr-1 text-violet-500"></i>${doneMsg}`);
}

// ===== Main play =====

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

    // Chuẩn bị data TRƯỚC khi render stage
    if (isDecrypt) {
        const decryptData = prepareDecryptAnimOrder(text);
        animOrderCache = decryptData.order;
        animCipherGrid = decryptData.grid;
    } else {
        animCipherGrid = null;
        animOrderCache = prepareAnimOrder(text);
    }

    renderAnimStage();

    const grille = document.getElementById('anim-grille');
    if (grille) {
        grille.style.transform = 'rotate(0deg)';
        grille.style.opacity = '1';
    }
    showBadge('0°');

    currentAnimStep = -1;

    setAnimStatus('<i class="fas fa-hourglass-start mr-1"></i>Chuẩn bị...');
    await animSleep(500);

    for (let s = 0; s < 4; s++) {
        await animateStepForward(s);
    }

    await finishAnimation();

    animPlaying = false;
    if (playBtn) playBtn.disabled = false;
    if (navEl) navEl.style.display = 'flex';
    updateNavButtons();
}

// ===== Prev / Next =====

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

    // Xoá highlight của lượt hiện tại
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

    // Ẩn kết quả + reset badge về màu tím
    const resultEl = document.getElementById('anim-result');
    if (resultEl) { resultEl.classList.add('hidden'); resultEl.innerHTML = ''; }

    const badge = document.getElementById('anim-badge');
    if (badge) {
        badge.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.95), rgba(76,29,149,0.95))';
        badge.style.boxShadow = '0 10px 30px rgba(139,92,246,0.35)';
    }

    currentAnimStep = step - 1;

    const grille = document.getElementById('anim-grille');
    if (grille) grille.style.opacity = '1';

    if (currentAnimStep >= 0) {
        const angle = currentAnimStep * 90;
        showBadge(`${angle}°`);
        if (grille) grille.style.transform = `rotate(${angle}deg)`;
        setAnimStatus(`<i class="fas fa-rotate-left mr-1"></i>Lùi về lượt ${currentAnimStep + 1} (${angle}°)`);
        await animSleep(1050);
    } else {
        showBadge('0°');
        if (grille) grille.style.transform = 'rotate(0deg)';
        setAnimStatus('<i class="fas fa-rotate-left mr-1"></i>Đã lùi về trạng thái ban đầu');
        await animSleep(650);
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

    // Vừa chạm step 3 → chạy hiệu ứng kết thúc
    if (currentAnimStep === 3) {
        await finishAnimation();
    }

    animPlaying = false;
    if (playBtn) playBtn.disabled = false;
    updateNavButtons();
}

// ===== Result & reset =====

function showAnimResult(order, n) {
    const resultEl = document.getElementById('anim-result');
    if (!resultEl) return;

    const isDecrypt = currentModeGlobal === 'decrypt';

    let output = '';
    if (isDecrypt) {
        // Giải mã: ghép theo thứ tự đọc trong order
        for (const item of order) output += item.ch;
    } else {
        // Mã hoá: ghép theo grid rồi đọc hàng
        const grid = Array.from({ length: n }, () => Array(n).fill(''));
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
        ? 'Bản rõ (đọc theo 4 lượt xoay)'
        : 'Bản mã (đọc theo hàng)';
    const note = isDecrypt
        ? `Đã đọc ${order.length} ký tự từ bản mã qua 4 lượt`
        : `${nonPad} ký tự thực + ${pad} ký tự "–" (xám, trên lưới)`;

    resultEl.innerHTML = `
        <div class="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800/50">
            <div class="text-xs uppercase tracking-wider font-bold text-violet-600 dark:text-violet-400 mb-2">
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

    const playBtn = document.getElementById('anim-play');
    if (playBtn) playBtn.disabled = false;

    resetAnimSteps();
    setAnimStatus('');

    const resultEl = document.getElementById('anim-result');
    if (resultEl) { resultEl.classList.add('hidden'); resultEl.innerHTML = ''; }

    const navEl = document.getElementById('anim-nav');
    if (navEl) navEl.style.display = 'none';

    renderAnimStage();
}

// ==================== CUSTOM TEMPLATE EDITOR ====================

let editorSelection = new Set();

function getOrbitKeys(r, c, n) {
    const keys = [];
    let cr = r, cc = c;
    for (let k = 0; k < 4; k++) {
        keys.push(`${cr},${cc}`);
        const nr = cc, nc = n - 1 - cr;
        cr = nr; cc = nc;
    }
    return keys;
}

function rotOfCellInEditor(r, c, n) {
    for (let k = 0; k < 4; k++) {
        const [tr, tc] = templateCellAt(r, c, k, n);
        if (editorSelection.has(`${tr},${tc}`)) return k;
    }
    return -1;
}

function renderCustomGrid() {
    const container = document.getElementById('custom-grid');
    if (!container) return;
    const n = cardanoGridSize;

    const requiredEl = document.getElementById('custom-required');
    const countEl = document.getElementById('custom-count');
    if (requiredEl) requiredEl.textContent = n * n / 4;
    if (countEl) {
        const required = n * n / 4;
        countEl.textContent = editorSelection.size;
        countEl.classList.toggle('text-emerald-600', editorSelection.size === required);
        countEl.classList.toggle('dark:text-emerald-400', editorSelection.size === required);
    }

    const CELL_SIZE = { 4: 64, 6: 52, 8: 42, 10: 34 };
    const FONT_SIZE = { 4: 24, 6: 19, 8: 15, 10: 12 };
    const HEAD_FONT = { 4: 14, 6: 13, 8: 12, 10: 10 };
    const ROW_LABEL_W = { 4: 38, 6: 32, 8: 26, 10: 22 };
    const cs = CELL_SIZE[n] || 42;
    const fs = FONT_SIZE[n] || 15;
    const hf = HEAD_FONT[n] || 12;
    const rw = ROW_LABEL_W[n] || 28;

    let html = `<div class="overflow-x-auto pb-2">
        <table class="table-encrypt mx-auto" style="table-layout: fixed; width: auto;">
            <thead><tr>
                <th class="bg-violet-100 dark:bg-violet-900/30 text-center"
                    style="width:${rw}px;font-size:${hf}px;"></th>`;
    for (let c = 1; c <= n; c++) {
        html += `<th class="bg-violet-100 dark:bg-violet-900/30 text-center"
            style="width:${cs}px;font-size:${hf}px;">${c}</th>`;
    }
    html += `</tr></thead><tbody>`;

    for (let r = 0; r < n; r++) {
        html += `<tr>
            <td class="font-bold bg-violet-100 dark:bg-violet-900/30 text-center"
                style="width:${rw}px;font-size:${hf}px;padding:2px;">${r + 1}</td>`;
        for (let c = 0; c < n; c++) {
            const key = `${r},${c}`;
            const isSel = editorSelection.has(key);
            const rot = rotOfCellInEditor(r, c, n);
            const isAffected = !isSel && rot >= 0;

            const bg = rot >= 0 ? CARDANO_ROT_BG[rot] : 'bg-gray-100 dark:bg-gray-700/30';
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
        const orbitKeys = getOrbitKeys(r, c, cardanoGridSize);
        for (const k of orbitKeys) editorSelection.delete(k);
        editorSelection.add(key);
    }
    renderCustomGrid();
}

function randomFillEditor() {
    const n = cardanoGridSize;
    const required = n * n / 4;

    if (editorSelection.size < required) {
        const assigned = new Set();
        for (const key of editorSelection) {
            const [r, c] = key.split(',').map(Number);
            for (const k of getOrbitKeys(r, c, n)) assigned.add(k);
        }

        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                if (assigned.has(`${r},${c}`)) continue;
                const orbitKeys = getOrbitKeys(r, c, n);
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
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                if (assigned.has(`${r},${c}`)) continue;
                const orbitKeys = getOrbitKeys(r, c, n);
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
    const n = cardanoGridSize;
    editorSelection = new Set();
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
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
    const n = cardanoGridSize;
    const required = n * n / 4;
    if (editorSelection.size !== required) {
        GrassCCT.showMessage(
            `Cần chọn đúng ${required} ô — bạn đang chọn ${editorSelection.size}`,
            'warning'
        );
        return;
    }
    const template = Array.from({ length: n }, () => Array(n).fill(false));
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