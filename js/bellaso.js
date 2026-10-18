// Mã hoá Bellaso (Vigenère với khoá)
function bellasoEncrypt(text, key = 'ТРАВА') {
    const processed = GrassCCT.processInput(text);
    let result = '';
    const upper = GrassCCT.RUSSIAN_ALPHABET;
    const lower = GrassCCT.RUSSIAN_ALPHABET_LOWER;
    const len = upper.length;

    let normalizedKey = key.toUpperCase();
    normalizedKey = normalizedKey.replace(/[^А-Я]/g, '');
    if (normalizedKey.length === 0) normalizedKey = 'ТРАВА';

    let keyIndex = 0;
    for (let char of processed) {
        if (char === ' ') {
            result += ' ';
            continue;
        }

        const keyChar = normalizedKey[keyIndex % normalizedKey.length];
        let shift = upper.indexOf(keyChar);
        if (shift === -1) shift = 0;
        keyIndex++;

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

// Giải mã Bellaso
function bellasoDecrypt(text, key = 'ТРАВА') {
    const processed = text;
    let result = '';
    const upper = GrassCCT.RUSSIAN_ALPHABET;
    const lower = GrassCCT.RUSSIAN_ALPHABET_LOWER;
    const len = upper.length;

    let normalizedKey = key.toUpperCase();
    normalizedKey = normalizedKey.replace(/[^А-Я]/g, '');
    if (normalizedKey.length === 0) normalizedKey = 'ТРАВА';

    let keyIndex = 0;
    for (let char of processed) {
        if (char === ' ') {
            result += ' ';
            continue;
        }

        const keyChar = normalizedKey[keyIndex % normalizedKey.length];
        let shift = upper.indexOf(keyChar);
        if (shift === -1) shift = 0;
        keyIndex++;

        if (upper.includes(char)) {
            const index = upper.indexOf(char);
            result += upper[(index - shift + len) % len];
        } else if (lower.includes(char)) {
            const index = lower.indexOf(char);
            result += lower[(index - shift + len) % len];
        } else {
            result += char;
        }
    }
    return result;
}

// Tạo dữ liệu bảng Bellaso
function generateBellasoTable(text, key = 'ТРАВА', isDecrypt = false) {
    const table = [];
    const upper = GrassCCT.RUSSIAN_ALPHABET;

    let cleanText = text.replace(/\s/g, '');

    let normalizedKey = key.toUpperCase();
    normalizedKey = normalizedKey.replace(/[^А-Я]/g, '');
    if (normalizedKey.length === 0) normalizedKey = 'ТРАВА';

    if (cleanText.length === 0) {
        return [];
    }

    for (let i = 0; i < cleanText.length; i++) {
        const inputChar = cleanText[i] || '';
        const keyChar = normalizedKey[i % normalizedKey.length];
        let shift = upper.indexOf(keyChar);
        if (shift === -1) shift = 0;

        let outputChar = '';
        if (isDecrypt) {
            if (upper.includes(inputChar)) {
                const index = upper.indexOf(inputChar);
                outputChar = upper[(index - shift + upper.length) % upper.length];
            } else {
                outputChar = inputChar;
            }
        } else {
            if (upper.includes(inputChar)) {
                const index = upper.indexOf(inputChar);
                outputChar = upper[(index + shift) % upper.length];
            } else {
                outputChar = inputChar;
            }
        }

        const inputValue = upper.includes(inputChar) ? upper.indexOf(inputChar) + 1 : '-';
        const outputValue = upper.includes(outputChar) ? upper.indexOf(outputChar) + 1 : '-';

        table.push({
            position: i + 1,
            inputChar: inputChar,
            inputValue: inputValue,
            keyChar: keyChar,
            keyType: 'Chữ',
            shift: shift,
            outputChar: outputChar,
            outputValue: outputValue
        });
    }
    return table;
}

// Render bảng Bellaso (ngang)
function renderBellasoTableHorizontal(text = '', key = 'ТРАВА', isDecrypt = false) {
    const container = document.getElementById('bellaso-table');
    if (!container) return;

    const cleanText = text.replace(/\s/g, '');

    if (!cleanText || cleanText.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i class="fas fa-info-circle text-2xl mb-2 block"></i>
                <p>Nhập văn bản vào ô bên trái và khoá ở ô trên để xem bảng mã hoá</p>
                <p class="text-xs mt-1">Mỗi ký tự trong văn bản sẽ được mã hoá với shift từ khoá</p>
            </div>
        `;
        return;
    }

    const table = generateBellasoTable(text, key, isDecrypt);

    let html = `
        <div class="overflow-x-auto pb-3">
            <table class="table-encrypt">
                <thead>
                    <tr>
                        <th class="bg-pink-100 dark:bg-pink-900/30 min-w-[80px] sticky left-0 z-20">Vị trí</th>
    `;

    table.forEach(row => {
        html += `
            <th class="bg-pink-100 dark:bg-pink-900/30 min-w-[70px]">
                ${row.position}
            </th>
        `;
    });

    html += `</tr></thead><tbody>`;

    if (isDecrypt) {
        // Hàng "Mã hoá" — label sticky
        html += `<tr><td class="font-bold bg-gray-100 dark:bg-gray-700 text-sm sticky left-0 z-10 min-w-[80px]">Mã hoá</td>`;
        table.forEach(row => {
            html += `
                <td class="font-bold text-purple-600 dark:text-purple-400 text-center text-base">
                    ${row.inputChar}
                    <span class="text-xs text-gray-500 dark:text-gray-400 block">${row.inputValue}</span>
                </td>
            `;
        });
        html += `</tr>`;

        // Hàng "Shift" — label sticky
        html += `<tr><td class="font-bold bg-gray-100 dark:bg-gray-700 text-sm sticky left-0 z-10 min-w-[80px]">Shift</td>`;
        table.forEach(row => {
            html += `
                <td class="font-bold text-pink-600 dark:text-pink-400 text-center text-base">
                    ${row.keyChar}
                    <span class="text-xs block" style="color: rgb(241, 126, 184);">-${row.shift}</span>
                </td>
            `;
        });
        html += `</tr>`;

        // Hàng "Gốc" — label sticky
        html += `<tr><td class="font-bold bg-gray-100 dark:bg-gray-700 text-sm sticky left-0 z-10 min-w-[80px]">Gốc</td>`;
        table.forEach(row => {
            html += `
                <td class="font-bold text-gray-900 dark:text-white text-center text-base">
                    ${row.outputChar}
                    <span class="text-xs text-gray-500 dark:text-gray-400 block">${row.outputValue}</span>
                </td>
            `;
        });
        html += `</tr>`;
    } else {
        // Hàng "Văn bản" — label sticky
        html += `<tr><td class="font-bold bg-gray-100 dark:bg-gray-700 text-sm sticky left-0 z-10 min-w-[80px]">Gốc</td>`;
        table.forEach(row => {
            html += `
                <td class="font-bold text-gray-900 dark:text-white text-center text-base">
                    ${row.inputChar}
                    <span class="text-xs text-gray-500 dark:text-gray-400 block">${row.inputValue}</span>
                </td>
            `;
        });
        html += `</tr>`;

        // Hàng "Shift" — label sticky
        html += `<tr><td class="font-bold bg-gray-100 dark:bg-gray-700 text-sm sticky left-0 z-10 min-w-[80px]">Shift</td>`;
        table.forEach(row => {
            html += `
                <td class="font-bold text-pink-600 dark:text-pink-400 text-center text-base">
                    ${row.keyChar}
                    <span class="text-xs block" style="color: rgb(241, 126, 184);">+${row.shift}</span>
                </td>
            `;
        });
        html += `</tr>`;

        // Hàng "Mã hoá" — label sticky
        html += `<tr><td class="font-bold bg-gray-100 dark:bg-gray-700 text-sm sticky left-0 z-10 min-w-[80px]">Mã hoá</td>`;
        table.forEach(row => {
            html += `
                <td class="font-bold text-purple-600 dark:text-purple-400 text-center text-base">
                    ${row.outputChar}
                    <span class="text-xs text-gray-500 dark:text-gray-400 block">${row.outputValue}</span>
                </td>
            `;
        });
        html += `</tr>`;
    }

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

// Render bảng Bellaso (dọc)
function renderBellasoTableVertical(text = '', key = 'ТРАВА', isDecrypt = false) {
    const container = document.getElementById('bellaso-table');
    if (!container) return;

    const cleanText = text.replace(/\s/g, '');

    if (!cleanText || cleanText.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i class="fas fa-info-circle text-2xl mb-2 block"></i>
                <p>Nhập văn bản vào ô bên trái và khoá ở ô trên để xem bảng mã hoá</p>
                <p class="text-xs mt-1">Mỗi ký tự trong văn bản sẽ được mã hoá với shift từ khoá</p>
            </div>
        `;
        return;
    }

    const table = generateBellasoTable(text, key, isDecrypt);

    let html = `
        <div class="overflow-y-auto max-h-[500px] rounded-lg">
            <table class="table-encrypt">
                <thead class="sticky top-0">
                    <tr>
                        <th class="bg-pink-100 dark:bg-pink-900/30">Vị trí</th>
    `;

    if (isDecrypt) {
        html += `
                        <th class="bg-pink-100 dark:bg-pink-900/30">Mã hoá</th>
                        <th class="bg-pink-100 dark:bg-pink-900/30">Shift</th>
                        <th class="bg-pink-100 dark:bg-pink-900/30">Gốc</th>
                    </tr>
                </thead>
                <tbody>
        `;
    } else {
        html += `
                        <th class="bg-pink-100 dark:bg-pink-900/30">Gốc</th>
                        <th class="bg-pink-100 dark:bg-pink-900/30">Shift</th>
                        <th class="bg-pink-100 dark:bg-pink-900/30">Mã hoá</th>
                    </tr>
                </thead>
                <tbody>
        `;
    }

    table.forEach(row => {
        const shiftDisplay = isDecrypt ? `-${row.shift}` : `+${row.shift}`;

        if (isDecrypt) {
            html += `
                <tr>
                    <td class="font-bold text-gray-900 dark:text-white text-center">${row.position}</td>
                    <td class="font-bold text-purple-600 dark:text-purple-400 text-center">
                        ${row.inputChar}
                        <span class="text-xs text-gray-500 dark:text-gray-400 block">${row.inputValue}</span>
                    </td>
                    <td class="font-bold text-pink-600 dark:text-pink-400 text-center">
                        ${row.keyChar}
                        <span class="text-xs block" style="color: rgb(241, 126, 184);">${shiftDisplay}</span>
                    </td>
                    <td class="font-bold text-gray-900 dark:text-white text-center">
                        ${row.outputChar}
                        <span class="text-xs text-gray-500 dark:text-gray-400 block">${row.outputValue}</span>
                    </td>
                </tr>
            `;
        } else {
            html += `
                <tr>
                    <td class="font-bold text-gray-900 dark:text-white text-center">${row.position}</td>
                    <td class="font-bold text-gray-900 dark:text-white text-center">
                        ${row.inputChar}
                        <span class="text-xs text-gray-500 dark:text-gray-400 block">${row.inputValue}</span>
                    </td>
                    <td class="font-bold text-pink-600 dark:text-pink-400 text-center">
                        ${row.keyChar}
                        <span class="text-xs block" style="color: rgb(241, 126, 184);">${shiftDisplay}</span>
                    </td>
                    <td class="font-bold text-purple-600 dark:text-purple-400 text-center">
                        ${row.outputChar}
                        <span class="text-xs text-gray-500 dark:text-gray-400 block">${row.outputValue}</span>
                    </td>
                </tr>
            `;
        }
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

function renderBellasoTable(text = '', key = 'ТРАВА', isDecrypt = false, isVertical = false) {
    if (isVertical) {
        renderBellasoTableVertical(text, key, isDecrypt);
    } else {
        renderBellasoTableHorizontal(text, key, isDecrypt);
    }
}

// Hàm hiển thị thông tin key
function updateBellasoKeyInfo(key) {
    const container = document.getElementById('key-info');
    if (!container) return;

    let normalizedKey = key.toUpperCase();
    normalizedKey = normalizedKey.replace(/[^А-Я]/g, '');
    if (normalizedKey.length === 0) normalizedKey = 'ТРАВА';

    const keyDisplay = normalizedKey.length > 25
        ? normalizedKey.slice(0, 25) + '…'
        : normalizedKey;

    container.innerHTML = `
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm min-w-0">
        <span class="font-medium text-gray-700 dark:text-gray-300 shrink-0">
            <i class="fas fa-key text-pink-500 mr-1"></i>Khoá:
        </span>
        <span class="font-mono font-bold text-pink-600 dark:text-pink-400 break-all min-w-0">
            ${keyDisplay}
        </span>
        <span class="text-gray-500 dark:text-gray-400 shrink-0">(${normalizedKey.length} ký tự)</span>
        <span class="text-xs text-gray-600 dark:text-gray-300 bg-pink-100 dark:bg-pink-900/30 px-2 py-1 rounded max-w-full break-words">
            Shift = Vị trí ký tự trong bảng chữ cái
        </span>
    </div>
`;
}

// Kiểm tra ký tự hợp lệ cho khoá Bellaso (chỉ А-Я)
function isValidBellasoKeyChar(char) {
    return GrassCCT.RUSSIAN_ALPHABET.includes(char.toUpperCase());
}

document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('bellaso-input');
    const output = document.getElementById('bellaso-output');
    const inputLabel = document.getElementById('input-label');
    const outputLabel = document.getElementById('output-label');
    const keyInput = document.getElementById('key-input');
    const modeEncrypt = document.getElementById('mode-encrypt');
    const modeDecrypt = document.getElementById('mode-decrypt');
    const viewToggle = document.getElementById('view-toggle');
    const viewModeLabel = document.getElementById('view-mode-label');
    const pasteBtn = document.getElementById('paste-btn');
    const copyInputBtn = document.getElementById('copy-input-btn');
    const copyOutputBtn = document.getElementById('copy-output-btn');
    const clearBtn = document.getElementById('clear-btn');

    let currentMode = 'encrypt';
    let currentKey = '';
    let isVertical = false;

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
        if (viewModeLabel) {
            viewModeLabel.textContent = isVertical ? '(Dọc)' : '(Ngang)';
        }
    }

    function handleInput(event) {
        GrassCCT.handleTextInputWithCursor(event.target, true);
        updateOutput();
    }

    function updateOutput() {
        if (!input || !output) return;
        const text = input.value;

        let currentKeyValue = currentKey;
        if (!currentKeyValue || currentKeyValue.trim() === '') {
            currentKeyValue = 'ТРАВА';
        }

        const isDecrypt = currentMode === 'decrypt';
        const displayText = text || '';
        renderBellasoTable(displayText, currentKeyValue, isDecrypt, isVertical);
        updateBellasoKeyInfo(currentKeyValue);

        if (!text) {
            output.value = '';
            return;
        }

        let result;
        if (currentMode === 'encrypt') {
            result = bellasoEncrypt(text, currentKeyValue);
            result = GrassCCT.formatResult(result);
        } else {
            const cleanText = text.replace(/\s/g, '');
            result = bellasoDecrypt(cleanText, currentKeyValue);
        }
        output.value = result;
    }

    function handleKeyInput(event) {
        const textarea = event.target;
        const originalText = textarea.value;
        const cursorPos = textarea.selectionStart;

        // Xử lý: giữ chữ cái hợp lệ, uppercase
        let processed = '';
        let hasInvalidChar = false;
        let invalidChars = [];

        for (let char of originalText) {
            if (char === ' ' || char === '\n' || char === '\t') continue;
            if (isValidBellasoKeyChar(char)) {
                processed += char;
            } else {
                hasInvalidChar = true;
                invalidChars.push(char);
            }
        }

        if (hasInvalidChar) {
            const uniqueInvalid = [...new Set(invalidChars)];
            GrassCCT.showMessage(`Ký tự không hợp lệ trong khoá: ${uniqueInvalid.join(', ')}. Chỉ chấp nhận chữ cái А-Я`, 'error');
        }

        const finalKey = processed.toUpperCase().replace(/[^А-Я]/g, '');

        // Nếu giá trị không đổi → không đụng gì (giữ cursor native)
        if (finalKey === originalText) {
            currentKey = finalKey;
            updateOutput();
            return;
        }

        // Tính cursor mới
        const beforeCursor = originalText.slice(0, cursorPos);
        const processedBefore = beforeCursor
            .toUpperCase()
            .replace(/[^А-Я]/g, '');
        const newCursorPos = Math.min(processedBefore.length, finalKey.length);

        textarea.value = finalKey;
        textarea.setSelectionRange(newCursorPos, newCursorPos);

        currentKey = finalKey;
        const currentText = input ? input.value : '';
        const isDecrypt = currentMode === 'decrypt';
        renderBellasoTable(currentText, finalKey || 'ТРАВА', isDecrypt, isVertical);
        updateBellasoKeyInfo(finalKey || 'ТРАВА');
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

    if (keyInput) {
        keyInput.placeholder = 'ТРАВА';
        keyInput.value = '';

        keyInput.addEventListener('focus', function () {
            if (this.value === '') {
                this.placeholder = '';
            }
        });

        keyInput.addEventListener('blur', function () {
            if (this.value === '') {
                this.placeholder = 'ТРАВА';
                currentKey = '';
                const currentText = input ? input.value : '';
                const isDecrypt = currentMode === 'decrypt';
                renderBellasoTable(currentText, 'ТРАВА', isDecrypt, isVertical);
                updateBellasoKeyInfo('ТРАВА');
                updateOutput();
            }
        });

        keyInput.addEventListener('input', handleKeyInput);

        keyInput.addEventListener('paste', function (e) {
            setTimeout(() => {
                const text = this.value;
                let processed = '';
                let hasInvalidChar = false;
                let invalidChars = [];

                for (let char of text) {
                    if (char === ' ' || char === '\n' || char === '\t') continue;
                    if (isValidBellasoKeyChar(char)) {
                        processed += char;
                    } else {
                        hasInvalidChar = true;
                        invalidChars.push(char);
                    }
                }

                if (hasInvalidChar) {
                    const uniqueInvalid = [...new Set(invalidChars)];
                    GrassCCT.showMessage(`Ký tự không hợp lệ trong khoá: ${uniqueInvalid.join(', ')}. Chỉ chấp nhận chữ cái А-Я`, 'error');
                }

                let finalKey = processed.toUpperCase();
                finalKey = finalKey.replace(/[^А-Я]/g, '');
                this.value = finalKey;
                currentKey = finalKey;
                const currentText = input ? input.value : '';
                const isDecrypt = currentMode === 'decrypt';
                renderBellasoTable(currentText, finalKey || 'ТРАВА', isDecrypt, isVertical);
                updateBellasoKeyInfo(finalKey || 'ТРАВА');
                updateOutput();
            }, 10);
        });
    }

    if (modeEncrypt) {
        modeEncrypt.addEventListener('click', function () {
            if (currentMode !== 'encrypt') {
                currentMode = 'encrypt';
                updateUI();
                updateOutput();
            }
        });
    }

    if (modeDecrypt) {
        modeDecrypt.addEventListener('click', function () {
            if (currentMode !== 'decrypt') {
                currentMode = 'decrypt';
                updateUI();
                updateOutput();
            }
        });
    }

    if (viewToggle) {
        viewToggle.addEventListener('click', function () {
            isVertical = !isVertical;
            updateUI();
            const currentText = input ? input.value : '';
            const keyForTable = currentKey || 'ТРАВА';
            const isDecrypt = currentMode === 'decrypt';
            renderBellasoTable(currentText, keyForTable, isDecrypt, isVertical);
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
            const keyForTable = currentKey || 'ТРАВА';
            const isDecrypt = currentMode === 'decrypt';
            renderBellasoTable('', keyForTable, isDecrypt, isVertical);
            updateOutput();
        });
    }

    updateUI();
    const initialKey = 'ТРАВА';
    renderBellasoTable('', initialKey, false, isVertical);
    updateBellasoKeyInfo(initialKey);
    updateOutput();
});