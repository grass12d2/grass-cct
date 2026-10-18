// Mã hoá Vigenère với khoá là bản mã (Ciphertext Key)
function vigenereCTKeyEncrypt(text, key = 'А') {
    const processed = GrassCCT.processInput(text);
    let result = '';
    const upper = GrassCCT.RUSSIAN_ALPHABET;
    const lower = GrassCCT.RUSSIAN_ALPHABET_LOWER;
    const len = upper.length;

    let initialKey = key.toUpperCase();
    initialKey = initialKey.replace(/[^А-Я]/g, '');
    if (initialKey.length === 0) initialKey = 'А';

    let gamma = initialKey;
    let ciphertext = '';
    let keyIndex = 0;

    for (let char of processed) {
        if (char === ' ') {
            ciphertext += ' ';
            continue;
        }

        const gammaChar = gamma[keyIndex];
        let shift = upper.indexOf(gammaChar);
        if (shift === -1) shift = 0;

        let encryptedChar;
        if (upper.includes(char)) {
            const index = upper.indexOf(char);
            encryptedChar = upper[(index + shift) % len];
        } else if (lower.includes(char)) {
            const index = lower.indexOf(char);
            encryptedChar = lower[(index + shift) % len];
        } else {
            encryptedChar = char;
        }

        ciphertext += encryptedChar;
        gamma += encryptedChar;
        keyIndex++;
    }
    return ciphertext;
}

// Giải mã Vigenère với khoá là bản mã (Ciphertext Key)
function vigenereCTKeyDecrypt(text, key = 'А') {
    const processed = text;
    let result = '';
    const upper = GrassCCT.RUSSIAN_ALPHABET;
    const lower = GrassCCT.RUSSIAN_ALPHABET_LOWER;
    const len = upper.length;

    let initialKey = key.toUpperCase();
    initialKey = initialKey.replace(/[^А-Я]/g, '');
    if (initialKey.length === 0) initialKey = 'А';

    let gamma = initialKey;
    let plaintext = '';
    let keyIndex = 0;

    for (let char of processed) {
        if (char === ' ') {
            plaintext += ' ';
            continue;
        }

        const gammaChar = gamma[keyIndex];
        let shift = upper.indexOf(gammaChar);
        if (shift === -1) shift = 0;

        let decryptedChar;
        if (upper.includes(char)) {
            const index = upper.indexOf(char);
            decryptedChar = upper[(index - shift + len) % len];
        } else if (lower.includes(char)) {
            const index = lower.indexOf(char);
            decryptedChar = lower[(index - shift + len) % len];
        } else {
            decryptedChar = char;
        }

        plaintext += decryptedChar;
        gamma += char;
        keyIndex++;
    }
    return plaintext;
}

// Tạo bảng Gamma chi tiết cho Vigenère Ciphertext Key
function generateCTKeyTable(text, key = 'А', isDecrypt = false) {
    const table = [];
    const upper = GrassCCT.RUSSIAN_ALPHABET;

    let cleanText = text.replace(/\s/g, '');

    let initialKey = key.toUpperCase();
    initialKey = initialKey.replace(/[^А-Я]/g, '');
    if (initialKey.length === 0) initialKey = 'А';

    if (cleanText.length === 0) {
        return [];
    }

    if (isDecrypt) {
        // Giải mã: gamma = khoá ban đầu + bản mã (có sẵn từ input)
        let gamma = initialKey + cleanText;
        gamma = gamma.slice(0, cleanText.length);

        for (let i = 0; i < cleanText.length; i++) {
            const inputChar = cleanText[i] || '';
            const gammaChar = gamma[i] || '';
            let shift = upper.indexOf(gammaChar);
            if (shift === -1) shift = 0;

            let outputChar = '';
            if (upper.includes(inputChar)) {
                const index = upper.indexOf(inputChar);
                outputChar = upper[(index - shift + upper.length) % upper.length];
            } else {
                outputChar = inputChar;
            }

            const inputValue = upper.includes(inputChar) ? upper.indexOf(inputChar) + 1 : '-';
            const outputValue = upper.includes(outputChar) ? upper.indexOf(outputChar) + 1 : '-';

            table.push({
                position: i + 1,
                inputChar: inputChar,
                inputValue: inputValue,
                gammaChar: gammaChar,
                keyType: 'Chữ',
                shift: shift,
                outputChar: outputChar,
                outputValue: outputValue,
                isKeyPart: i < initialKey.length
            });
        }
    } else {
        // Mã hoá: gamma = khoá ban đầu + bản mã (được xây dựng dần)
        let gamma = initialKey;
        for (let i = 0; i < cleanText.length; i++) {
            const inputChar = cleanText[i] || '';
            const gammaChar = gamma[i] || '';
            let shift = upper.indexOf(gammaChar);
            if (shift === -1) shift = 0;

            let outputChar = '';
            if (upper.includes(inputChar)) {
                const index = upper.indexOf(inputChar);
                outputChar = upper[(index + shift) % upper.length];
            } else {
                outputChar = inputChar;
            }

            const inputValue = upper.includes(inputChar) ? upper.indexOf(inputChar) + 1 : '-';
            const outputValue = upper.includes(outputChar) ? upper.indexOf(outputChar) + 1 : '-';

            table.push({
                position: i + 1,
                inputChar: inputChar,
                inputValue: inputValue,
                gammaChar: gammaChar,
                keyType: 'Chữ',
                shift: shift,
                outputChar: outputChar,
                outputValue: outputValue,
                isKeyPart: i < initialKey.length
            });

            // Mấu chốt: thêm bản mã vào gamma cho vòng lặp tiếp theo
            gamma += outputChar;
        }
    }

    return table;
}

// Màu gamma: khoá = cyan, bản mã = xanh dương đậm (dễ nhìn cả 2 theme)
const GAMMA_KEY_CLASS = 'text-cyan-600 dark:text-cyan-400';
const GAMMA_TEXT_CLASS = 'text-blue-600 dark:text-blue-400';

// Render bảng CTKey (ngang)
function renderCTKeyTableHorizontal(text = '', key = 'А', isDecrypt = false) {
    const container = document.getElementById('vigenere-table');
    if (!container) return;

    const cleanText = text.replace(/\s/g, '');

    if (!cleanText || cleanText.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i class="fas fa-info-circle text-2xl mb-2 block"></i>
                <p>Nhập văn bản vào ô bên trái và khoá ở ô trên để xem bảng mã hoá</p>
                <p class="text-xs mt-1">Gamma = Khoá ban đầu + Bản mã</p>
            </div>
        `;
        return;
    }

    const table = generateCTKeyTable(text, key, isDecrypt);

    let html = `
        <div class="overflow-x-auto pb-3">
            <table class="table-encrypt">
                <thead>
                    <tr>
                        <th class="bg-cyan-100 dark:bg-cyan-900/30 min-w-[80px] sticky left-0 z-20">Vị trí</th>
    `;

    table.forEach(row => {
        const isKey = row.isKeyPart;
        html += `
            <th class="${isKey ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-cyan-100 dark:bg-cyan-900/30'} min-w-[70px]">
                ${row.position}
                ${isKey ? '<span class="text-xs text-yellow-600 dark:text-yellow-400 block">(Khoá)</span>' : ''}
            </th>
        `;
    });

    html += `</tr></thead><tbody>`;

    if (isDecrypt) {
        // Hàng "Mã hoá"
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

        // Hàng "Gamma"
        html += `<tr><td class="font-bold bg-gray-100 dark:bg-gray-700 text-sm sticky left-0 z-10 min-w-[80px]">Gamma</td>`;
        table.forEach(row => {
            const isKey = row.isKeyPart;
            const gammaClass = isKey ? GAMMA_KEY_CLASS : GAMMA_TEXT_CLASS;
            html += `
                <td class="font-bold text-center text-base ${gammaClass}">
                    ${row.gammaChar}
                    <span class="text-xs block">-${row.shift}</span>
                </td>
            `;
        });
        html += `</tr>`;

        // Hàng "Gốc"
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
        // Hàng "Gốc"
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

        // Hàng "Gamma"
        html += `<tr><td class="font-bold bg-gray-100 dark:bg-gray-700 text-sm sticky left-0 z-10 min-w-[80px]">Gamma</td>`;
        table.forEach(row => {
            const isKey = row.isKeyPart;
            const gammaClass = isKey ? GAMMA_KEY_CLASS : GAMMA_TEXT_CLASS;
            html += `
                <td class="font-bold text-center text-base ${gammaClass}">
                    ${row.gammaChar}
                    <span class="text-xs block">+${row.shift}</span>
                </td>
            `;
        });
        html += `</tr>`;

        // Hàng "Mã hoá"
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
            <div class="mt-3 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-3">
                <span><span class="inline-block w-3 h-3 rounded bg-cyan-500 dark:bg-cyan-400"></span> Gamma phần khoá ban đầu</span>
                <span><span class="inline-block w-3 h-3 rounded bg-blue-600 dark:bg-blue-400"></span> Gamma phần bản mã</span>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Render bảng CTKey (dọc)
function renderCTKeyTableVertical(text = '', key = 'А', isDecrypt = false) {
    const container = document.getElementById('vigenere-table');
    if (!container) return;

    const cleanText = text.replace(/\s/g, '');

    if (!cleanText || cleanText.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i class="fas fa-info-circle text-2xl mb-2 block"></i>
                <p>Nhập văn bản vào ô bên trái và khoá ở ô trên để xem bảng mã hoá</p>
                <p class="text-xs mt-1">Gamma = Khoá ban đầu + Bản mã</p>
            </div>
        `;
        return;
    }

    const table = generateCTKeyTable(text, key, isDecrypt);

    let html = `
        <div class="overflow-y-auto max-h-[500px] rounded-lg">
            <table class="table-encrypt">
                <thead class="sticky top-0">
                    <tr>
                        <th class="bg-cyan-100 dark:bg-cyan-900/30">Vị trí</th>
    `;

    if (isDecrypt) {
        html += `
                        <th class="bg-cyan-100 dark:bg-cyan-900/30">Mã hoá</th>
                        <th class="bg-cyan-100 dark:bg-cyan-900/30">Gamma</th>
                        <th class="bg-cyan-100 dark:bg-cyan-900/30">Gốc</th>
                    </tr>
                </thead>
                <tbody>
        `;
    } else {
        html += `
                        <th class="bg-cyan-100 dark:bg-cyan-900/30">Gốc</th>
                        <th class="bg-cyan-100 dark:bg-cyan-900/30">Gamma</th>
                        <th class="bg-cyan-100 dark:bg-cyan-900/30">Mã hoá</th>
                    </tr>
                </thead>
                <tbody>
        `;
    }

    table.forEach(row => {
        const isKey = row.isKeyPart;
        const shiftDisplay = isDecrypt ? `-${row.shift}` : `+${row.shift}`;
        const gammaClass = isKey ? GAMMA_KEY_CLASS : GAMMA_TEXT_CLASS;

        if (isDecrypt) {
            html += `
                <tr class="${isKey ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}">
                    <td class="font-bold text-gray-900 dark:text-white text-center">${row.position}</td>
                    <td class="font-bold text-purple-600 dark:text-purple-400 text-center">
                        ${row.inputChar}
                        <span class="text-xs text-gray-500 dark:text-gray-400 block">${row.inputValue}</span>
                    </td>
                    <td class="font-bold text-center ${gammaClass}">
                        ${row.gammaChar}
                        <span class="text-xs block">${shiftDisplay}</span>
                    </td>
                    <td class="font-bold text-gray-900 dark:text-white text-center">
                        ${row.outputChar}
                        <span class="text-xs text-gray-500 dark:text-gray-400 block">${row.outputValue}</span>
                    </td>
                </tr>
            `;
        } else {
            html += `
                <tr class="${isKey ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}">
                    <td class="font-bold text-gray-900 dark:text-white text-center">${row.position}</td>
                    <td class="font-bold text-gray-900 dark:text-white text-center">
                        ${row.inputChar}
                        <span class="text-xs text-gray-500 dark:text-gray-400 block">${row.inputValue}</span>
                    </td>
                    <td class="font-bold text-center ${gammaClass}">
                        ${row.gammaChar}
                        <span class="text-xs block">${shiftDisplay}</span>
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
            <div class="mt-3 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-3">
                <span><span class="inline-block w-3 h-3 rounded bg-cyan-500 dark:bg-cyan-400"></span> Gamma phần khoá ban đầu</span>
                <span><span class="inline-block w-3 h-3 rounded bg-blue-600 dark:bg-blue-400"></span> Gamma phần bản mã</span>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function renderCTKeyTable(text = '', key = 'А', isDecrypt = false, isVertical = false) {
    if (isVertical) {
        renderCTKeyTableVertical(text, key, isDecrypt);
    } else {
        renderCTKeyTableHorizontal(text, key, isDecrypt);
    }
}

// Hàm hiển thị thông tin key
function updateCTKeyInfo(key) {
    const container = document.getElementById('key-info');
    if (!container) return;

    let normalizedKey = key.toUpperCase();
    normalizedKey = normalizedKey.replace(/[^А-Я]/g, '');
    if (normalizedKey.length === 0) normalizedKey = 'А';

    const keyDisplay = normalizedKey.length > 25
        ? normalizedKey.slice(0, 25) + '…'
        : normalizedKey;

    container.innerHTML = `
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm min-w-0">
            <span class="font-medium text-gray-700 dark:text-gray-300 shrink-0">
                <i class="fas fa-key text-cyan-500 mr-1"></i>Khoá ban đầu:
            </span>
            <span class="font-mono font-bold text-cyan-600 dark:text-cyan-400 break-all min-w-0">
                ${keyDisplay}
            </span>
            <span class="text-gray-500 dark:text-gray-400 shrink-0">(${normalizedKey.length} ký tự)</span>
            <span class="text-xs text-gray-600 dark:text-gray-300 bg-cyan-100 dark:bg-cyan-900/30 px-2 py-1 rounded max-w-full break-words">
                Gamma = Khoá + Bản mã
            </span>
        </div>
    `;
}

// Kiểm tra ký tự hợp lệ cho khoá (chỉ А-Я)
function isValidCTKeyChar(char) {
    return GrassCCT.RUSSIAN_ALPHABET.includes(char.toUpperCase());
}

document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('vigenere-input');
    const output = document.getElementById('vigenere-output');
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
            currentKeyValue = 'А';
        }

        const isDecrypt = currentMode === 'decrypt';
        const displayText = text || '';
        renderCTKeyTable(displayText, currentKeyValue, isDecrypt, isVertical);
        updateCTKeyInfo(currentKeyValue);

        if (!text) {
            output.value = '';
            return;
        }

        let result;
        if (currentMode === 'encrypt') {
            result = vigenereCTKeyEncrypt(text, currentKeyValue);
            result = GrassCCT.formatResult(result);
        } else {
            const cleanText = text.replace(/\s/g, '');
            result = vigenereCTKeyDecrypt(cleanText, currentKeyValue);
        }
        output.value = result;
    }

    function handleKeyInput(event) {
        const textarea = event.target;
        const originalText = textarea.value;
        const cursorPos = textarea.selectionStart;

        let processed = '';
        let hasInvalidChar = false;
        let invalidChars = [];

        for (let char of originalText) {
            if (char === ' ' || char === '\n' || char === '\t') continue;
            if (isValidCTKeyChar(char)) {
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

        if (finalKey === originalText) {
            currentKey = finalKey;
            updateOutput();
            return;
        }

        const beforeCursor = originalText.slice(0, cursorPos);
        const processedBefore = beforeCursor.toUpperCase().replace(/[^А-Я]/g, '');
        const newCursorPos = Math.min(processedBefore.length, finalKey.length);

        textarea.value = finalKey;
        textarea.setSelectionRange(newCursorPos, newCursorPos);

        currentKey = finalKey;
        const currentText = input ? input.value : '';
        const isDecrypt = currentMode === 'decrypt';
        renderCTKeyTable(currentText, finalKey || 'А', isDecrypt, isVertical);
        updateCTKeyInfo(finalKey || 'А');
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
        keyInput.placeholder = 'А';
        keyInput.value = '';

        keyInput.addEventListener('focus', function () {
            if (this.value === '') {
                this.placeholder = '';
            }
        });

        keyInput.addEventListener('blur', function () {
            if (this.value === '') {
                this.placeholder = 'А';
                currentKey = '';
                const currentText = input ? input.value : '';
                const isDecrypt = currentMode === 'decrypt';
                renderCTKeyTable(currentText, 'А', isDecrypt, isVertical);
                updateCTKeyInfo('А');
                updateOutput();
            }
        });

        keyInput.addEventListener('input', handleKeyInput);

        keyInput.addEventListener('paste', function () {
            setTimeout(() => {
                handleKeyInput({ target: keyInput });
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
            const keyForTable = currentKey || 'А';
            const isDecrypt = currentMode === 'decrypt';
            renderCTKeyTable(currentText, keyForTable, isDecrypt, isVertical);
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
            const keyForTable = currentKey || 'А';
            const isDecrypt = currentMode === 'decrypt';
            renderCTKeyTable('', keyForTable, isDecrypt, isVertical);
            updateOutput();
        });
    }

    updateUI();
    const initialKey = 'А';
    renderCTKeyTable('', initialKey, false, isVertical);
    updateCTKeyInfo(initialKey);
    updateOutput();
});