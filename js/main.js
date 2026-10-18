// ==================== XỬ LÝ VĂN BẢN ====================

// ==================== VIEWPORT HEIGHT TRACKER ====================
// Mobile (Safari iOS, Chrome Android) có address bar co giãn → 100vh sai.
// Set --vh = 1% chiều cao thực của viewport, cập nhật mỗi khi resize/orient.
(function setupVH() {
    function setVH() {
        document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px');
    }
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    // iOS Safari đôi khi bắn resize muộn → check thêm sau 200ms
    setTimeout(setVH, 200);
})();

// ==================== SCROLL CONTAINER WRAPPER ====================
// Bọc <main> + #footer-placeholder trong #scroll-container để viewport
// không có scrollbar → navbar span full width (giống YouTube).
// Chạy TRƯỚC mọi script khác vì file này load đầu tiên.
(function wrapScrollContainer() {
    // Đã wrap rồi thì bỏ qua
    if (document.getElementById('scroll-container')) return;

    const main = document.querySelector('body > main');
    const footer = document.getElementById('footer-placeholder');
    if (!main || !footer) return;

    // Tạo wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'scroll-container';

    // Chèn wrapper vào đúng vị trí main
    main.parentNode.insertBefore(wrapper, main);

    // Di chuyển main + footer vào wrapper
    wrapper.appendChild(main);
    wrapper.appendChild(footer);
})();

// Chuẩn hoá Ё → Е
function normalizeRussianText(text) {
    return text.replace(/[Ёё]/g, match => match === 'Ё' ? 'Е' : 'е');
}

// Bảng chữ cái tiếng Nga (33 chữ, không có Ё)
const RUSSIAN_ALPHABET = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
const RUSSIAN_ALPHABET_LOWER = 'абвгдежзийклмнопрстуфхцчшщъыьэюя';

// CHỈ chấp nhận А-Я và dấu cách (bỏ 0-9, dấu . và ,)
const VALID_CHARS = RUSSIAN_ALPHABET + RUSSIAN_ALPHABET_LOWER + ' ';

function processInput(text) {
    let result = normalizeRussianText(text);
    // Chỉ lấy các ký tự chữ cái tiếng Nga và dấu cách
    let filtered = '';
    for (let char of result) {
        if (RUSSIAN_ALPHABET.includes(char) || RUSSIAN_ALPHABET_LOWER.includes(char) || char === ' ') {
            filtered += char;
        }
    }
    return filtered;
}

function formatResult(text) {
    let clean = text.replace(/\s+/g, '');
    if (clean.length === 0) return '';
    const chunks = [];
    for (let i = 0; i < clean.length; i += 5) {
        chunks.push(clean.slice(i, i + 5));
    }
    return chunks.join(' ');
}

// Format cho Polybius: chia thành cụm 5 số
function formatPolybiusResult(text) {
    let clean = text.replace(/\s+/g, '');
    if (clean.length === 0) return '';
    const chunks = [];
    for (let i = 0; i < clean.length; i += 5) {
        chunks.push(clean.slice(i, i + 5));
    }
    return chunks.join(' ');
}

// Lấy danh sách các chữ cái cho bảng (33 chữ)
function getFullAlphabet() {
    return RUSSIAN_ALPHABET.split('');
}

// Lấy bảng chữ cái đảo ngược (cho Atbash)
function getReversedAlphabet() {
    return RUSSIAN_ALPHABET.split('').reverse().join('');
}

// Kiểm tra ký tự hợp lệ
function isValidChar(char) {
    return VALID_CHARS.includes(char);
}

// ==================== POPUP THÔNG BÁO ====================
function showMessage(message, type = 'success') {
    // Xoá toast cũ nếu có
    document.querySelectorAll('.message-popup').forEach(el => el.remove());

    const config = {
        success: {
            bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            shadow: 'rgba(16, 185, 129, 0.35)',
            icon: 'fa-check-circle'
        },
        error: {
            bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            shadow: 'rgba(239, 68, 68, 0.35)',
            icon: 'fa-circle-exclamation'
        },
        warning: {
            bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            shadow: 'rgba(245, 158, 11, 0.35)',
            icon: 'fa-triangle-exclamation'
        },
        info: {
            bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            shadow: 'rgba(59, 130, 246, 0.35)',
            icon: 'fa-circle-info'
        }
    };

    const c = config[type] || config.success;

    const popup = document.createElement('div');
    popup.className = 'message-popup';
    popup.style.cssText = `
    position: fixed;
    top: calc(var(--navbar-height, 64px) + 8px);
    left: 50%;
    right: auto;
    transform: translateX(-50%) translateY(-12px);
    z-index: 99999;
    width: auto;
    max-width: min(calc(100vw - 32px), 420px);
    background: ${c.bg};
    color: white;
    padding: 10px 14px;
    border-radius: 12px;
    box-shadow: 0 10px 30px -5px ${c.shadow}, 0 0 0 1px rgba(255,255,255,0.1) inset;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.35;
    opacity: 0;
    transition: opacity 0.25s ease, transform 0.25s ease;
    pointer-events: auto;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
`;

    // Mobile: dạng pill, trải rộng tối đa nhưng vẫn có margin 2 bên
    if (window.innerWidth < 640) {
        popup.style.borderRadius = '999px';
        popup.style.paddingLeft = '16px';
        popup.style.width = '80vw';
        popup.style.maxWidth = '80vw';
    }
    popup.innerHTML = `
        <i class="fas ${c.icon}" style="font-size:14px;flex-shrink:0;opacity:0.95;"></i>
        <span style="flex:1;min-width:0;word-break:break-word;">${message}</span>
        <button type="button" class="message-popup-close"
            style="flex-shrink:0;background:transparent;border:0;color:rgba(255,255,255,0.75);cursor:pointer;padding:2px 4px;border-radius:6px;line-height:1;font-size:12px;"
            aria-label="Đóng">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(popup);

    // Animate in
    requestAnimationFrame(() => {
        popup.style.opacity = '1';
        popup.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Nút đóng
    const closeBtn = popup.querySelector('.message-popup-close');
    closeBtn.addEventListener('click', () => hidePopup(popup));

    // Tự động ẩn sau 3s
    const autoHide = setTimeout(() => hidePopup(popup), 3000);
    popup._autoHideTimer = autoHide;
}

function hidePopup(popup) {
    if (!popup || !popup.parentElement) return;
    if (popup._autoHideTimer) clearTimeout(popup._autoHideTimer);

    popup.style.opacity = '0';
    popup.style.transform = 'translateX(-50%) translateY(-12px)';
    setTimeout(() => popup.remove(), 250);
}

// ==================== XỬ LÝ INPUT ====================

// Xử lý input: chuẩn hoá Ё→Е, chuyển UPPERCASE, kiểm tra ký tự hợp lệ
function handleTextInput(text, showAlert = true) {
    // 1. Chuẩn hoá Ё/ё → Е/е (silent — không báo lỗi, không xoá)
    // 2. Uppercase toàn bộ
    let upperText = normalizeRussianText(text).toUpperCase();

    if (showAlert) {
        for (let char of upperText) {
            if (char === ' ' || char === '\n' || char === '\t') continue;
            if (!RUSSIAN_ALPHABET.includes(char)) {
                showMessage(`Ký tự "${char}" không hợp lệ! Chỉ chấp nhận chữ cái А-Я và dấu cách`, 'error');
                // Lọc bỏ ký tự không hợp lệ
                return upperText.split('').filter(c =>
                    c === ' ' || c === '\n' || c === '\t' || RUSSIAN_ALPHABET.includes(c)
                ).join('');
            }
        }
    }

    return upperText;
}

// ==================== COPY / PASTE ====================

// Hàm copy text
function copyText(text, showSuccess = true) {
    if (!text || text.trim() === '') {
        showMessage('Không có nội dung để sao chép!', 'warning');
        return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            if (showSuccess) {
                showMessage('Sao chép thành công!', 'success');
            }
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

// Fallback copy
function fallbackCopy(text) {
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showMessage('Sao chép thành công!', 'success');
    } catch (err) {
        showMessage('Không thể sao chép! Vui lòng thử lại.', 'error');
    }
}

// Hàm paste text
function pasteText(textarea) {
    if (!textarea) {
        showMessage('Không tìm thấy ô nhập văn bản!', 'error');
        return;
    }

    if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
            if (text) {
                textarea.value = text;
                textarea.dispatchEvent(new Event('input'));
                showMessage('Đã dán văn bản từ bảng nhớ tạm!', 'success');
            } else {
                showMessage('Bảng nhớ tạm trống!', 'warning');
            }
        }).catch(() => {
            fallbackPaste(textarea);
        });
    } else {
        fallbackPaste(textarea);
    }
}

// Fallback paste
function fallbackPaste(textarea) {
    showMessage('Vui lòng dán thủ công bằng Ctrl+V (hoặc Cmd+V)', 'warning');

    const hiddenTextarea = document.createElement('textarea');
    hiddenTextarea.style.position = 'fixed';
    hiddenTextarea.style.opacity = '0';
    hiddenTextarea.style.left = '-9999px';
    hiddenTextarea.style.top = '-9999px';
    hiddenTextarea.style.width = '1px';
    hiddenTextarea.style.height = '1px';
    document.body.appendChild(hiddenTextarea);

    hiddenTextarea.focus();

    hiddenTextarea.addEventListener('paste', function (e) {
        e.preventDefault();
        const text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
        if (text && textarea) {
            textarea.value = text;
            textarea.dispatchEvent(new Event('input'));
            showMessage('Đã dán văn bản thành công!', 'success');
        } else {
            showMessage('Không có dữ liệu để dán!', 'warning');
        }
        if (document.body.contains(hiddenTextarea)) {
            document.body.removeChild(hiddenTextarea);
        }
    }, { once: true });

    setTimeout(() => {
        if (document.body.contains(hiddenTextarea)) {
            document.body.removeChild(hiddenTextarea);
            textarea.focus();
        }
    }, 5000);
}

// ==================== CLEAR TEXT ====================

// Hàm clear textarea
function clearText(textarea) {
    if (textarea) {
        textarea.value = '';
        textarea.dispatchEvent(new Event('input'));
        showMessage('Đã xoá nội dung!', 'info');
    }
}

// ==================== HANDLE INPUT CÓ GIỮ CURSOR ====================
/**
 * Xử lý input, chuyển uppercase, lọc ký tự không hợp lệ,
 * GIỮ NGUYÊN vị trí con trỏ nhập liệu.
 */
function handleTextInputWithCursor(textarea, showAlert = true) {
    if (!textarea) return '';

    const originalText = textarea.value;
    const cursorPos = textarea.selectionStart;

    const processed = handleTextInput(originalText, showAlert);

    if (processed !== originalText) {
        // Tính vị trí cursor mới = độ dài của phần đã xử lý trước cursor
        const beforeCursor = originalText.slice(0, cursorPos);
        const processedBefore = handleTextInput(beforeCursor, false);
        const newCursorPos = Math.min(processedBefore.length, processed.length);

        textarea.value = processed;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
    }

    return processed;
}

// ==================== EXPORT ====================

window.GrassCCT = {
    normalizeRussianText,
    processInput,
    formatResult,
    formatPolybiusResult,
    RUSSIAN_ALPHABET,
    RUSSIAN_ALPHABET_LOWER,
    VALID_CHARS,
    getFullAlphabet,
    getReversedAlphabet,
    isValidChar,
    showMessage,
    handleTextInput,
    handleTextInputWithCursor,
    copyText,
    pasteText,
    clearText
};