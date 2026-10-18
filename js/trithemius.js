// ==================== MÃ HOÁ / GIẢI MÃ ====================

function trithemiusEncrypt(text) {
    const upper = GrassCCT.RUSSIAN_ALPHABET;
    let cleanInput = '';
    for (let char of text.toUpperCase()) {
        if (upper.includes(char)) {
            cleanInput += char;
        }
    }

    let result = '';
    const len = upper.length;

    let position = 0;
    for (let char of cleanInput) {
        const shift = position;
        position++;

        const index = upper.indexOf(char);
        result += upper[(index + shift) % len];
    }
    return result;
}

function trithemiusDecrypt(text) {
    const upper = GrassCCT.RUSSIAN_ALPHABET;
    let cleanInput = '';
    for (let char of text.toUpperCase()) {
        if (upper.includes(char)) {
            cleanInput += char;
        }
    }

    let result = '';
    const len = upper.length;

    let position = 0;
    for (let char of cleanInput) {
        const shift = position;
        position++;

        const index = upper.indexOf(char);
        result += upper[((index - shift) % len + len) % len];
    }
    return result;
}

// ==================== LẤY DANH SÁCH ITEMS CHI TIẾT ====================

function getDetailItems() {
    const input = document.getElementById('trithemius-input');
    if (!input) return [];
    const text = input.value;
    if (!text || text.trim() === '') return [];

    const upper = GrassCCT.RUSSIAN_ALPHABET;
    const len = upper.length;
    const items = [];

    let cleanText = '';
    for (let char of text.toUpperCase()) {
        if (upper.includes(char)) {
            cleanText += char;
        }
    }

    for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        const inputIndex = upper.indexOf(char);
        const shift = i % 32;

        let outputChar, outputIndex;
        if (currentModeGlobal === 'encrypt') {
            outputIndex = (inputIndex + shift) % len;
            outputChar = upper[outputIndex];
        } else {
            outputIndex = ((inputIndex - shift) % len + len) % len;
            outputChar = upper[outputIndex];
        }

        items.push({
            input: char,
            output: outputChar,
            inputPos: inputIndex + 1,
            outputPos: outputIndex + 1,
            shift: shift
        });
    }

    return items;
}

// ==================== RENDER CHI TIẾT (NGANG) ====================

function renderDetailHorizontal() {
    const container = document.getElementById('trithemius-detail');
    if (!container) return;

    const items = getDetailItems();

    if (items.length === 0) {
        container.innerHTML = `
            <div class="text-center py-6 text-gray-500 dark:text-gray-400">
                <i class="fas fa-info-circle text-xl mb-2 block"></i>
                <p class="text-sm">Nhập văn bản để xem chi tiết từng ký tự</p>
            </div>
        `;
        return;
    }

    const isEncrypt = currentModeGlobal === 'encrypt';
    const label1 = isEncrypt ? 'Gốc' : 'Mã hoá';
    const label2 = isEncrypt ? 'Mã hoá' : 'Gốc';
    const shiftSign = isEncrypt ? '+' : '-';

    let html = `
        <div class="overflow-x-auto pb-3">
            <table class="table-encrypt">
                <thead>
                    <tr>
                        <th class="bg-indigo-100 dark:bg-indigo-900/30 min-w-[60px] sticky left-0 z-20">Vị trí</th>
    `;

    items.forEach((item, index) => {
        html += `
            <th class="bg-indigo-100 dark:bg-indigo-900/30 min-w-[70px]">
                ${index + 1}
            </th>
        `;
    });

    html += `</tr></thead><tbody>`;

    // Hàng 1: input (label sticky)
    html += `<tr><td class="font-bold bg-gray-100 dark:bg-gray-700 text-sm sticky left-0 z-10 min-w-[60px]">${label1}</td>`;
    items.forEach(item => {
        html += `
            <td class="font-bold text-gray-900 dark:text-white text-center text-base">
                ${item.input}
                <span class="text-xs text-gray-500 dark:text-gray-400 block">${item.inputPos}</span>
            </td>
        `;
    });
    html += `</tr>`;

    // Hàng 2: shift (label sticky)
    html += `<tr><td class="font-bold bg-gray-100 dark:bg-gray-700 text-sm sticky left-0 z-10 min-w-[60px]">Shift</td>`;
    items.forEach(item => {
        html += `
            <td class="font-bold text-purple-600 dark:text-purple-400 text-center text-base">
                ${shiftSign}${item.shift}
            </td>
        `;
    });
    html += `</tr>`;

    // Hàng 3: output (label sticky)
    html += `<tr><td class="font-bold bg-gray-100 dark:bg-gray-700 text-sm sticky left-0 z-10 min-w-[60px]">${label2}</td>`;
    items.forEach(item => {
        html += `
            <td class="font-bold text-blue-600 dark:text-blue-400 text-center text-base">
                ${item.output}
                <span class="text-xs text-gray-500 dark:text-gray-400 block">${item.outputPos}</span>
            </td>
        `;
    });
    html += `</tr>`;

    html += `
                </tbody>
            </table>
        </div>
        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <i class="fas fa-info-circle mr-1"></i>
            Số nhỏ bên dưới ký tự là vị trí trong bảng chữ cái (А=1, Б=2, ..., Я=32)
        </div>
    `;

    container.innerHTML = html;
}

// ==================== RENDER CHI TIẾT (DỌC) ====================

function renderDetailVertical() {
    const container = document.getElementById('trithemius-detail');
    if (!container) return;

    const items = getDetailItems();

    if (items.length === 0) {
        container.innerHTML = `
            <div class="text-center py-6 text-gray-500 dark:text-gray-400">
                <i class="fas fa-info-circle text-xl mb-2 block"></i>
                <p class="text-sm">Nhập văn bản để xem chi tiết từng ký tự</p>
            </div>
        `;
        return;
    }

    const isEncrypt = currentModeGlobal === 'encrypt';
    const label1 = isEncrypt ? 'Gốc' : 'Mã hoá';
    const label2 = isEncrypt ? 'Mã hoá' : 'Gốc';
    const shiftSign = isEncrypt ? '+' : '-';

    let html = `
        <div class="overflow-y-auto max-h-[500px] rounded-lg">
            <table class="table-encrypt">
                <thead class="sticky top-0">
                    <tr>
                        <th class="bg-indigo-100 dark:bg-indigo-900/30 min-w-[60px]">Vị trí</th>
                        <th class="bg-indigo-100 dark:bg-indigo-900/30 min-w-[80px]">${label1}</th>
                        <th class="bg-indigo-100 dark:bg-indigo-900/30 min-w-[70px]">Shift</th>
                        <th class="bg-indigo-100 dark:bg-indigo-900/30 min-w-[80px]">${label2}</th>
                    </tr>
                </thead>
                <tbody>
    `;

    items.forEach((item, index) => {
        html += `
            <tr>
                <td class="font-bold text-gray-900 dark:text-white text-center">${index + 1}</td>
                <td class="font-bold text-gray-900 dark:text-white text-center">
                    ${item.input}
                    <span class="text-xs text-gray-500 dark:text-gray-400 block">(${item.inputPos})</span>
                </td>
                <td class="font-bold text-purple-600 dark:text-purple-400 text-center">${shiftSign}${item.shift}</td>
                <td class="font-bold text-blue-600 dark:text-blue-400 text-center">
                    ${item.output}
                    <span class="text-xs text-gray-500 dark:text-gray-400 block">(${item.outputPos})</span>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <i class="fas fa-info-circle mr-1"></i>
            Số trong ngoặc là vị trí trong bảng chữ cái (А=1, Б=2, ..., Я=32)
        </div>
    `;

    container.innerHTML = html;
}

function renderDetailTable() {
    if (isVertical) {
        renderDetailVertical();
    } else {
        renderDetailHorizontal();
    }
}

// ==================== BẢNG TRITHEMIUS CƠ BẢN ====================

function renderBaseTable(isDecrypt) {
    const container = document.getElementById('trithemius-table');
    if (!container) return;

    const upper = GrassCCT.RUSSIAN_ALPHABET;

    let html = `
        <div class="overflow-auto max-h-[600px] pb-2">
            <table class="table-encrypt">
                <thead class="sticky top-0 z-20">
                    <tr>
                        <th class="bg-indigo-200 dark:bg-indigo-900 sticky left-0 z-30 border border-indigo-300 dark:border-indigo-800 text-xs">#</th>
    `;

    for (let i = 1; i <= 32; i++) {
        html += `<th class="bg-indigo-200 dark:bg-indigo-900 text-xs border border-indigo-300 dark:border-indigo-800">${i}</th>`;
    }
    html += `</tr>
    <tr>
        <th class="bg-indigo-200 dark:bg-indigo-900 sticky left-0 z-30 border border-indigo-300 dark:border-indigo-800 text-xs">А-Я</th>`;

    for (let col = 0; col < 32; col++) {
        html += `<th class="bg-indigo-200 dark:bg-indigo-900 border border-indigo-300 dark:border-indigo-800">${upper[col]}</th>`;
    }
    html += `</tr></thead><tbody>`;

    for (let row = 0; row < 32; row++) {
        html += `<tr>`;
        html += `<td class="font-bold bg-indigo-100 dark:bg-indigo-900/50 text-center sticky left-0 z-10 border border-indigo-200 dark:border-indigo-800">${row + 1}</td>`;

        for (let col = 0; col < 32; col++) {
            const index = isDecrypt
                ? ((col - row) % 32 + 32) % 32
                : (col + row) % 32;
            const char = upper[index];
            html += `
                <td class="text-center text-sm border border-indigo-100 dark:border-indigo-900/30">
                    ${char}
                </td>
            `;
        }
        html += `</tr>`;
    }

    html += `
                </tbody>
            </table>
        </div>
        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <i class="fas fa-info-circle mr-1"></i>
            ${isDecrypt
            ? 'Mỗi hàng shift giảm dần: hàng 1 là -1, hàng 2 là -2, ...'
            : 'Mỗi hàng shift tăng dần: hàng 1 là +1, hàng 2 là +2, ...'}
        </div>
    `;

    container.innerHTML = html;
}

function updateTrithemiusTable(text, isDecrypt) {
    const upper = GrassCCT.RUSSIAN_ALPHABET;
    let cleanText = '';
    for (let char of text.toUpperCase()) {
        if (upper.includes(char)) {
            cleanText += char;
        }
    }

    if (cleanText.length === 0) {
        renderBaseTable(isDecrypt);
        return;
    }

    // Khi có text → render bảng cơ bản với highlight
    renderHighlightedTable(isDecrypt, cleanText);
}

// Render bảng có highlight ô output
function renderHighlightedTable(isDecrypt, cleanText) {
    const container = document.getElementById('trithemius-table');
    if (!container) return;

    const upper = GrassCCT.RUSSIAN_ALPHABET;
    const len = upper.length;

    // Màu highlight: mã hoá = cam (nóng), giải mã = xanh lá
    const highlightClass = isDecrypt
        ? 'bg-green-500 dark:bg-green-600'
        : 'bg-orange-500 dark:bg-orange-600';

    let html = `
        <div class="overflow-auto max-h-[600px] pb-2">
            <table class="table-encrypt">
                <thead class="sticky top-0 z-20">
                    <tr>
                        <th class="bg-indigo-200 dark:bg-indigo-900 sticky left-0 z-30 border border-indigo-300 dark:border-indigo-800 text-xs">#</th>
    `;

    for (let i = 1; i <= 32; i++) {
        html += `<th class="bg-indigo-200 dark:bg-indigo-900 text-xs border border-indigo-300 dark:border-indigo-800">${i}</th>`;
    }
    html += `</tr>
    <tr>
        <th class="bg-indigo-200 dark:bg-indigo-900 sticky left-0 z-30 border border-indigo-300 dark:border-indigo-800 text-xs">А-Я</th>`;

    for (let col = 0; col < 32; col++) {
        html += `<th class="bg-indigo-200 dark:bg-indigo-900 border border-indigo-300 dark:border-indigo-800">${upper[col]}</th>`;
    }
    html += `</tr></thead><tbody>`;

    // Chỉ render số hàng = số ký tự
    for (let row = 0; row < cleanText.length; row++) {
        const shift = row % 32;
        const inputChar = cleanText[row];
        const inputIndex = upper.indexOf(inputChar);

        let outputIndex;
        if (isDecrypt) {
            outputIndex = ((inputIndex - shift) % len + len) % len;
        } else {
            outputIndex = (inputIndex + shift) % len;
        }

        let outputCol;
        if (isDecrypt) {
            outputCol = (outputIndex + shift) % 32;
        } else {
            outputCol = ((outputIndex - shift) % 32 + 32) % 32;
        }

        html += `<tr>`;
        html += `<td class="font-bold bg-indigo-100 dark:bg-indigo-900/50 text-center sticky left-0 z-10 border border-indigo-200 dark:border-indigo-800">${row + 1}</td>`;

        for (let col = 0; col < 32; col++) {
            const index = isDecrypt
                ? ((col - shift) % 32 + 32) % 32
                : (col + shift) % 32;
            const char = upper[index];

            const isOutput = col === outputCol;

            let cellClass = 'text-center text-sm border border-indigo-100 dark:border-indigo-900/30';
            if (isOutput) {
                cellClass += ' ' + highlightClass + ' font-bold text-white';
            }

            html += `<td class="${cellClass}">${char}</td>`;
        }
        html += `</tr>`;
    }

    const legendLabel = isDecrypt ? 'Ký tự gốc (đã giải mã)' : 'Ký tự đã mã hoá';
    const legendColor = isDecrypt
        ? 'bg-green-500 dark:bg-green-600'
        : 'bg-orange-500 dark:bg-orange-600';

    html += `
                </tbody>
            </table>
        </div>
        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-3">
            <span>
                <span class="inline-block w-4 h-4 ${legendColor} rounded align-middle"></span>
                ${legendLabel}
            </span>
        </div>
    `;

    container.innerHTML = html;
}

// ==================== BIẾN TOÀN CỤC ====================

let currentModeGlobal = 'encrypt';
let isVertical = false;

// ==================== DOM ====================

document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('trithemius-input');
    const output = document.getElementById('trithemius-output');
    const inputLabel = document.getElementById('input-label');
    const outputLabel = document.getElementById('output-label');
    const modeEncrypt = document.getElementById('mode-encrypt');
    const modeDecrypt = document.getElementById('mode-decrypt');
    const viewToggle = document.getElementById('view-toggle');
    const detailViewLabel = document.getElementById('detail-view-label');
    const tableTitle = document.getElementById('table-title');
    const pasteBtn = document.getElementById('paste-btn');
    const copyInputBtn = document.getElementById('copy-input-btn');
    const copyOutputBtn = document.getElementById('copy-output-btn');
    const clearBtn = document.getElementById('clear-btn');

    let currentMode = 'encrypt';
    currentModeGlobal = currentMode;

    function updateUI() {
        const isEncrypt = currentMode === 'encrypt';

        if (inputLabel) {
            inputLabel.textContent = isEncrypt ? 'Văn bản gốc' : 'Văn bản mã hoá';
        }
        if (outputLabel) {
            outputLabel.textContent = isEncrypt ? 'Văn bản mã hoá' : 'Văn bản gốc';
        }
        if (input) {
            input.placeholder = isEncrypt
                ? 'Nhập văn bản tiếng Nga (ví dụ: ПРИВЕТ)'
                : 'Nhập văn bản đã mã hoá';
        }

        if (tableTitle) {
            tableTitle.textContent = isEncrypt ? '(Mã hoá)' : '(Giải mã)';
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

        if (viewToggle) {
            viewToggle.innerHTML = isVertical
                ? '<i class="fas fa-sync-alt"></i><span class="view-toggle-text">Xem ngang</span>'
                : '<i class="fas fa-sync-alt"></i><span class="view-toggle-text">Xem dọc</span>';
        }
        if (detailViewLabel) {
            detailViewLabel.textContent = isVertical ? '(Dọc)' : '(Ngang)';
        }
    }

    function handleInput(event) {
        GrassCCT.handleTextInputWithCursor(event.target, true);
        updateOutput();
    }

    function updateOutput() {
        if (!input || !output) return;
        const text = input.value;
        const isDecrypt = currentMode === 'decrypt';

        updateTrithemiusTable(text, isDecrypt);
        renderDetailTable();

        if (!text) {
            output.value = '';
            return;
        }

        let result;
        if (currentMode === 'encrypt') {
            result = trithemiusEncrypt(text);
            result = GrassCCT.formatResult(result);
        } else {
            result = trithemiusDecrypt(text);
        }
        output.value = result;
    }

    if (input) {
        input.addEventListener('input', handleInput);
        input.addEventListener('paste', function (e) {
            setTimeout(() => {
                GrassCCT.handleTextInputWithCursor(this, true);
                updateOutput();
            }, 10);
        });
    }

    if (modeEncrypt) {
        modeEncrypt.addEventListener('click', function () {
            if (currentMode !== 'encrypt') {
                currentMode = 'encrypt';
                currentModeGlobal = currentMode;
                updateUI();
                updateOutput();
            }
        });
    }

    if (modeDecrypt) {
        modeDecrypt.addEventListener('click', function () {
            if (currentMode !== 'decrypt') {
                currentMode = 'decrypt';
                currentModeGlobal = currentMode;
                updateUI();
                updateOutput();
            }
        });
    }

    if (viewToggle) {
        viewToggle.addEventListener('click', function () {
            isVertical = !isVertical;
            updateUI();
            updateOutput();
        });
    }

    if (pasteBtn) {
        pasteBtn.addEventListener('click', function (e) {
            e.preventDefault();
            GrassCCT.pasteText(input);
        });
    }

    if (copyInputBtn) {
        copyInputBtn.addEventListener('click', function (e) {
            e.preventDefault();
            GrassCCT.copyText(input.value);
        });
    }

    if (copyOutputBtn) {
        copyOutputBtn.addEventListener('click', function (e) {
            e.preventDefault();
            GrassCCT.copyText(output.value);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (input) {
                input.value = '';
            }
            if (output) {
                output.value = '';
            }
            GrassCCT.showMessage('Đã xoá nội dung!', 'info');
            updateOutput();
        });
    }

    updateUI();
    renderBaseTable(false);
    updateOutput();
});