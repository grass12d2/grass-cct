function caesarEncrypt(text, shift = 3) {
    const processed = GrassCCT.processInput(text);
    let result = '';
    const upper = GrassCCT.RUSSIAN_ALPHABET;
    const lower = GrassCCT.RUSSIAN_ALPHABET_LOWER;
    const len = upper.length;
    shift = ((shift % len) + len) % len;

    for (let char of processed) {
        if (upper.includes(char)) {
            const index = upper.indexOf(char);
            result += upper[(index + shift) % len];
        } else if (lower.includes(char)) {
            const index = lower.indexOf(char);
            result += lower[(index + shift) % len];
        } else {
            result += char;
        }
    }
    return result;
}

function caesarDecrypt(text, shift = 3) {
    return caesarEncrypt(text, -shift);
}

// Lấy danh sách items cho bảng chi tiết
function getDetailItems() {
    const input = document.getElementById('caesar-input');
    if (!input) return [];
    const text = input.value;
    if (!text || text.trim() === '') return [];

    const upper = GrassCCT.RUSSIAN_ALPHABET;
    const len = upper.length;
    const items = [];

    const processed = GrassCCT.processInput(text);
    const shift = currentShift;

    for (let char of processed) {
        if (char === ' ') continue;
        if (upper.includes(char)) {
            const index = upper.indexOf(char);
            let mappedIndex;
            let mappedChar;
            if (currentModeGlobal === 'encrypt') {
                mappedIndex = ((index + shift) % len + len) % len;
                mappedChar = upper[mappedIndex];
            } else {
                mappedIndex = ((index - shift) % len + len) % len;
                mappedChar = upper[mappedIndex];
            }
            items.push({
                input: char,
                output: mappedChar,
                inputPos: index + 1,
                outputPos: mappedIndex + 1
            });
        } else {
            items.push({ input: char, output: char, inputPos: '-', outputPos: '-' });
        }
    }

    return items;
}

// Tính dấu và giá trị tuyệt đối của shift để hiển thị
function getShiftDisplay(isEncrypt) {
    if (currentShift === 0) {
        return { sign: '', abs: 0 };
    }
    const effectiveSign = isEncrypt ? Math.sign(currentShift) : -Math.sign(currentShift);
    return {
        sign: effectiveSign > 0 ? '+' : '-',
        abs: Math.abs(currentShift)
    };
}

// Render chi tiết (ngang)
function renderDetailHorizontal() {
    const container = document.getElementById('caesar-detail');
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
    const shiftInfo = getShiftDisplay(isEncrypt);
    const shiftSign = shiftInfo.sign;
    const shiftAbs = shiftInfo.abs;

    let html = `
        <div class="overflow-x-auto pb-3">
            <table class="table-encrypt">
                <thead>
                    <tr>
                        <th class="bg-blue-100 dark:bg-blue-900/30 min-w-[60px] sticky left-0 z-20">Vị trí</th>
    `;

    items.forEach((item, index) => {
        html += `
            <th class="bg-blue-100 dark:bg-blue-900/30 min-w-[70px]">
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
    items.forEach(() => {
        html += `
            <td class="font-bold text-purple-600 dark:text-purple-400 text-center text-base">
                ${shiftSign}${shiftAbs}
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

// Render chi tiết (dọc)
function renderDetailVertical() {
    const container = document.getElementById('caesar-detail');
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
    const shiftInfo = getShiftDisplay(isEncrypt);
    const shiftSign = shiftInfo.sign;
    const shiftAbs = shiftInfo.abs;

    let html = `
        <div class="overflow-y-auto max-h-[500px] rounded-lg">
            <table class="table-encrypt">
                <thead class="sticky top-0">
                    <tr>
                        <th class="bg-blue-100 dark:bg-blue-900/30 min-w-[60px]">Vị trí</th>
                        <th class="bg-blue-100 dark:bg-blue-900/30 min-w-[80px]">${label1}</th>
                        <th class="bg-blue-100 dark:bg-blue-900/30 min-w-[70px]">Shift</th>
                        <th class="bg-blue-100 dark:bg-blue-900/30 min-w-[80px]">${label2}</th>
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
                <td class="font-bold text-purple-600 dark:text-purple-400 text-center">${shiftSign}${shiftAbs}</td>
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

// Render bảng Caesar (ngang)
function renderCaesarTableHorizontal(shift, isDecrypt = false) {
    const container = document.getElementById('caesar-table');
    if (!container) return;

    const chars = GrassCCT.RUSSIAN_ALPHABET.split('');
    const len = chars.length;
    const displayShift = shift;

    let html = `
        <div class="overflow-x-auto pb-3">
            <table class="table-encrypt">
                <tbody>
    `;

    if (isDecrypt) {
        // Hàng "Mã hoá" — ký tự cố định А-Я, kèm vị trí (hàng đầu tiên → cần border-t)
        html += `<tr><td class="font-bold bg-gray-100 dark:bg-gray-700 text-sm border-t border-amber-100 dark:border-gray-700 sticky left-0 z-10 min-w-[80px]">Mã hoá</td>`;
        chars.forEach((char, i) => {
            html += `
                <td class="font-bold text-blue-600 dark:text-blue-400 text-center border-t border-amber-100 dark:border-gray-700">
                    ${char}
                    <span class="text-xs text-gray-500 dark:text-gray-400 block">${i + 1}</span>
                </td>
            `;
        });
        html += `</tr>`;

        // Hàng "Gốc"
        html += `<tr><td class="font-bold bg-gray-100 dark:bg-gray-700 text-sm sticky left-0 z-10 min-w-[80px]">Gốc</td>`;
        chars.forEach((char, i) => {
            const newIndex = ((i - displayShift) % len + len) % len;
            const originalChar = chars[newIndex];
            html += `
                <td class="font-bold text-gray-900 dark:text-white text-center">
                    ${originalChar}
                    <span class="text-xs text-gray-500 dark:text-gray-400 block">${newIndex + 1}</span>
                </td>
            `;
        });
        html += `</tr>`;
    } else {
        // Hàng "Gốc" — ký tự cố định А-Я, kèm vị trí (hàng đầu tiên → cần border-t)
        html += `<tr><td class="font-bold bg-gray-100 dark:bg-gray-700 text-sm border-t border-amber-100 dark:border-gray-700 sticky left-0 z-10 min-w-[80px]">Gốc</td>`;
        chars.forEach((char, i) => {
            html += `
                <td class="font-bold text-gray-900 dark:text-white text-center border-t border-amber-100 dark:border-gray-700">
                    ${char}
                    <span class="text-xs text-gray-500 dark:text-gray-400 block">${i + 1}</span>
                </td>
            `;
        });
        html += `</tr>`;

        // Hàng "Mã hoá"
        html += `<tr><td class="font-bold bg-gray-100 dark:bg-gray-700 text-sm sticky left-0 z-10 min-w-[80px]">Mã hoá</td>`;
        chars.forEach((char, i) => {
            const newIndex = ((i + displayShift) % len + len) % len;
            const encryptedChar = chars[newIndex];
            html += `
                <td class="font-bold text-blue-600 dark:text-blue-400 text-center">
                    ${encryptedChar}
                    <span class="text-xs text-gray-500 dark:text-gray-400 block">${newIndex + 1}</span>
                </td>
            `;
        });
        html += `</tr>`;
    }

    html += `
                </tbody>
            </table>
        </div>
        <div class="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
            <i class="fas fa-info-circle mr-1"></i>
            Mỗi cột là một cặp ký tự gốc ↔ ký tự mã hoá với shift = ${displayShift}
        </div>
    `;

    container.innerHTML = html;
}

// Render bảng Caesar (dọc)
function renderCaesarTableVertical(shift, isDecrypt = false) {
    const container = document.getElementById('caesar-table');
    if (!container) return;

    const chars = GrassCCT.RUSSIAN_ALPHABET.split('');
    const len = chars.length;
    const displayShift = shift;

    let html = `
        <div class="overflow-y-auto max-h-[500px] rounded-lg">
            <table class="table-encrypt">
                <thead class="sticky top-0">
                    <tr>
    `;

    if (isDecrypt) {
        // Giải mã: input là mã hoá → Mã hoá bên trái, Gốc bên phải
        html += `
                        <th class="bg-blue-100 dark:bg-blue-900/30">Mã hoá</th>
                        <th class="bg-blue-100 dark:bg-blue-900/30">Gốc</th>
                    </tr>
                </thead>
                <tbody>
        `;

        chars.forEach((char, i) => {
            const newIndex = ((i - displayShift) % len + len) % len;
            const originalChar = chars[newIndex];

            html += `
                <tr>
                    <td class="font-bold text-blue-600 dark:text-blue-400 text-center">
                        ${char}
                        <span class="text-xs text-gray-500 dark:text-gray-400 block">(${i + 1})</span>
                    </td>
                    <td class="font-bold text-gray-900 dark:text-white text-center">
                        ${originalChar}
                        <span class="text-xs text-gray-500 dark:text-gray-400 block">(${newIndex + 1})</span>
                    </td>
                </tr>
            `;
        });
    } else {
        // Mã hoá: input là gốc → Gốc bên trái, Mã hoá bên phải
        html += `
                        <th class="bg-blue-100 dark:bg-blue-900/30">Gốc</th>
                        <th class="bg-blue-100 dark:bg-blue-900/30">Mã hoá</th>
                    </tr>
                </thead>
                <tbody>
        `;

        chars.forEach((char, i) => {
            const newIndex = ((i + displayShift) % len + len) % len;
            const encryptedChar = chars[newIndex];

            html += `
                <tr>
                    <td class="font-bold text-gray-900 dark:text-white text-center">
                        ${char}
                        <span class="text-xs text-gray-500 dark:text-gray-400 block">(${i + 1})</span>
                    </td>
                    <td class="font-bold text-blue-600 dark:text-blue-400 text-center">
                        ${encryptedChar}
                        <span class="text-xs text-gray-500 dark:text-gray-400 block">(${newIndex + 1})</span>
                    </td>
                </tr>
            `;
        });
    }

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

function renderCaesarTable(shift, isDecrypt = false, isVertical = false) {
    if (isVertical) {
        renderCaesarTableVertical(shift, isDecrypt);
    } else {
        renderCaesarTableHorizontal(shift, isDecrypt);
    }
}

// Hàm cập nhật background thanh trượt
function updateSliderBackground(slider) {
    const min = parseInt(slider.min);
    const max = parseInt(slider.max);
    const value = parseInt(slider.value);
    const percent = ((value - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percent}%, #e5e7eb ${percent}%, #e5e7eb 100%)`;
}

let currentModeGlobal = 'encrypt';
let currentShift = 3;
let isVertical = false;

document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('caesar-input');
    const output = document.getElementById('caesar-output');
    const inputLabel = document.getElementById('input-label');
    const outputLabel = document.getElementById('output-label');
    const shiftInput = document.getElementById('shift');
    const shiftValue = document.getElementById('shift-value');
    const shiftNumber = document.getElementById('shift-number');
    const shiftDecrease = document.getElementById('shift-decrease');
    const shiftIncrease = document.getElementById('shift-increase');
    const tableShiftValue = document.getElementById('table-shift-value');
    const modeEncrypt = document.getElementById('mode-encrypt');
    const modeDecrypt = document.getElementById('mode-decrypt');
    const viewToggle = document.getElementById('view-toggle');
    const detailViewLabel = document.getElementById('detail-view-label');
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

        if (!text) {
            output.value = '';
            renderCaesarTable(currentShift, isDecrypt, isVertical);
            renderDetailTable();
            if (tableShiftValue) tableShiftValue.textContent = currentShift;
            return;
        }
        let result;
        if (currentMode === 'encrypt') {
            result = caesarEncrypt(text, currentShift);
            result = GrassCCT.formatResult(result);
        } else {
            const cleanText = text.replace(/\s/g, '');
            result = caesarDecrypt(cleanText, currentShift);
        }
        output.value = result;
        renderCaesarTable(currentShift, isDecrypt, isVertical);
        renderDetailTable();
        if (tableShiftValue) tableShiftValue.textContent = currentShift;
    }

    function normalizeShift(value) {
        let num = parseInt(value);
        if (isNaN(num)) num = 0;

        if (num > 31 || num < -31) {
            let modded = ((num % 32) + 32) % 32;
            if (modded > 31) modded = modded - 32;
            return modded;
        }
        return num;
    }

    function updateShift(value) {
        let newShift = parseInt(value);
        if (isNaN(newShift)) newShift = 0;

        let normalizedShift = normalizeShift(newShift);
        currentShift = normalizedShift;

        if (shiftValue) shiftValue.textContent = currentShift;
        if (shiftNumber) shiftNumber.value = currentShift;
        if (shiftInput) {
            shiftInput.value = currentShift;
            updateSliderBackground(shiftInput);
        }
        if (tableShiftValue) tableShiftValue.textContent = currentShift;

        updateOutput();
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

    if (shiftInput) {
        shiftInput.min = -31;
        shiftInput.max = 31;
        shiftInput.value = 3;
        updateSliderBackground(shiftInput);

        shiftInput.addEventListener('input', function () {
            const val = parseInt(this.value);
            if (!isNaN(val)) {
                currentShift = val;
                if (shiftValue) shiftValue.textContent = currentShift;
                if (shiftNumber) shiftNumber.value = currentShift;
                if (tableShiftValue) tableShiftValue.textContent = currentShift;
                updateSliderBackground(this);
                updateOutput();
            }
        });
    }

    if (shiftNumber) {
        shiftNumber.min = -31;
        shiftNumber.max = 31;
        shiftNumber.value = 3;

        shiftNumber.addEventListener('change', function () {
            let val = parseInt(this.value);
            if (isNaN(val)) val = 0;
            if (val > 31 || val < -31) {
                let modded = ((val % 32) + 32) % 32;
                if (modded > 31) modded = modded - 32;
                this.value = modded;
                GrassCCT.showMessage(`Shift đã được chuẩn hoá thành ${modded} (mod 32)`, 'info');
                updateShift(modded);
            } else {
                updateShift(val);
            }
        });

        shiftNumber.addEventListener('input', function () {
            let val = parseInt(this.value);
            if (!isNaN(val) && val >= -31 && val <= 31) {
                currentShift = val;
                if (shiftValue) shiftValue.textContent = currentShift;
                if (shiftInput) {
                    shiftInput.value = currentShift;
                    updateSliderBackground(shiftInput);
                }
                if (tableShiftValue) tableShiftValue.textContent = currentShift;
                updateOutput();
            }
        });
    }

    if (shiftDecrease) {
        shiftDecrease.addEventListener('click', function () {
            updateShift(currentShift - 1);
        });
    }

    if (shiftIncrease) {
        shiftIncrease.addEventListener('click', function () {
            updateShift(currentShift + 1);
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
    updateShift(3);
});