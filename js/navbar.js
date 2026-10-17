// ==================== NAVBAR MANAGER ====================
(function () {
    'use strict';

    // ==================== OS DETECTION ====================
    function detectOS() {
        const html = document.documentElement;

        // iPadOS 13+ báo UA giống macOS nhưng có touchpoints
        const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
        const isMac = /Mac|iPhone|iPod/.test(navigator.platform) || isIPadOS;

        html.classList.remove('os-mac', 'os-other');
        if (isMac) {
            html.classList.add('os-mac');
        } else {
            html.classList.add('os-other');
        }
    }

    // Chạy NGAY khi script parse — trước cả khi fetch navbar
    detectOS();

    // ===== Config =====
    const NAVBAR_ALGORITHMS = [
        { id: 'caesar', name: 'Caesar', path: '/pages/caesar.html', icon: 'fa-arrow-right-arrow-left', color: 'blue', desc: 'Dịch chuyển theo shift' },
        { id: 'atbash', name: 'Atbash', path: '/pages/atbash.html', icon: 'fa-retweet', color: 'fuchsia', desc: 'Đảo ngược bảng chữ cái' },
        { id: 'polybius', name: 'Polybius', path: '/pages/polybius.html', icon: 'fa-table-cells', color: 'green', desc: 'Bảng chữ cái 6×6' },
        { id: 'trithemius', name: 'Trithemius', path: '/pages/trithemius.html', icon: 'fa-chart-line', color: 'indigo', desc: 'Shift tăng dần' },
        { id: 'bellaso', name: 'Bellaso', path: '/pages/bellaso.html', icon: 'fa-key', color: 'pink', desc: 'Vigenère với khoá' },
        { id: 'vigenere-autokey', name: 'Vigenère Autokey', path: '/pages/vigenere-autokey.html', icon: 'fa-lock', color: 'orange', desc: 'Gamma = Khoá + Văn bản' },
        { id: 'vigenere-ctkey', name: 'Vigenère Ciphertext', path: '/pages/vigenere-ctkey.html', icon: 'fa-lock-open', color: 'cyan', desc: 'Gamma = Khoá + Bản mã' },
        { id: 'cardano', name: 'Cardan Grille (hình vuông)', path: '/pages/cardano.html', icon: 'fa-border-all', color: 'violet', desc: 'Lưới khoét xoay 4 vị trí' },
        { id: 'cardano-rect', name: 'Cardan Grille (hình chữ nhật)', path: '/pages/cardano-rect.html', icon: 'fa-table-cells-large', color: 'emerald', desc: 'Lưới chữ nhật — 24 thứ tự' },
        { id: 'playfair', name: 'Playfair', path: '/pages/playfair.html', icon: 'fa-clone', color: 'blue', desc: 'Mã hoá cặp ký tự 5×6' },
    ];

    let isInPages = false;
    let searchState = { selectedIndex: 0, matches: [] };
    let suppressHoverSelection = false;

    // ===== Helpers =====
    // Luôn prefix link bằng đường dẫn tương đối để không trỏ về server root
    function getFullPath(path) {
        return (isInPages ? '..' : '.') + path;
    }

    function colorClasses(color) {
        const map = {
            blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
            fuchsia: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400',
            green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
            emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
            indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
            pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
            orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
            cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
            violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
        };
        return map[color] || map.blue;
    }

    // ==================== THEME ====================
    function updateThemeIcon() {
        const darkIcon = document.getElementById('theme-toggle-dark-icon');
        const lightIcon = document.getElementById('theme-toggle-light-icon');
        if (!darkIcon || !lightIcon) return;

        const isDark = document.documentElement.classList.contains('dark');
        darkIcon.style.display = isDark ? 'none' : 'inline-block';
        lightIcon.style.display = isDark ? 'inline-block' : 'none';
    }

    function applyTheme() {
        const html = document.documentElement;
        const stored = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (stored === 'dark' || (!stored && prefersDark)) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        updateThemeIcon();
    }

    function toggleTheme() {
        const html = document.documentElement;
        html.classList.toggle('dark');
        localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
        updateThemeIcon();
    }

    // ==================== SEARCH POPUP ====================
    function openSearch() {
        const popup = document.getElementById('search-popup');
        const backdrop = document.getElementById('search-popup-backdrop');
        const panel = document.getElementById('search-popup-panel');
        const input = document.getElementById('search-popup-input');
        if (!popup || !backdrop || !panel) return;

        popup.style.display = 'block';
        document.body.style.overflow = 'hidden';

        const isMobile = window.innerWidth < 768;
        const fromTransform = isMobile
            ? 'translate(-50%, 0) scale(0.95)'
            : 'translate(-50%, -50%) scale(0.95)';
        const toTransform = isMobile
            ? 'translate(-50%, 0) scale(1)'
            : 'translate(-50%, -50%) scale(1)';

        // Force initial state (re-apply để chắc chắn)
        panel.style.opacity = '0';
        panel.style.transform = fromTransform;

        // Force reflow — bắt buộc để transition có điểm bắt đầu
        panel.getBoundingClientRect();

        // Animate sang trạng thái cuối
        backdrop.style.opacity = '1';
        panel.style.opacity = '1';
        panel.style.transform = toTransform;

        setTimeout(() => input && input.focus(), 60);
    }

    function closeSearch() {
        const popup = document.getElementById('search-popup');
        const backdrop = document.getElementById('search-popup-backdrop');
        const panel = document.getElementById('search-popup-panel');
        const input = document.getElementById('search-popup-input');
        const clearBtn = document.getElementById('search-popup-clear');
        if (!popup || !backdrop || !panel) return;

        const isMobile = window.innerWidth < 768;
        const closeTransform = isMobile
            ? 'translate(-50%, 0) scale(0.95)'
            : 'translate(-50%, -50%) scale(0.95)';

        backdrop.style.opacity = '0';
        panel.style.opacity = '0';
        panel.style.transform = closeTransform;

        setTimeout(() => {
            popup.style.display = 'none';
            document.body.style.overflow = '';
            if (input) input.value = '';
            if (clearBtn) clearBtn.classList.add('hidden');
            renderSearchResults('');
        }, 160);
    }

    function renderSearchResults(query) {
        const results = document.getElementById('search-popup-results');
        const countEl = document.getElementById('search-popup-count');
        if (!results) return;

        const q = (query || '').trim().toLowerCase();
        searchState.matches = q
            ? NAVBAR_ALGORITHMS.filter(a =>
                a.name.toLowerCase().includes(q) ||
                a.id.toLowerCase().includes(q) ||
                a.desc.toLowerCase().includes(q))
            : NAVBAR_ALGORITHMS;
        searchState.selectedIndex = 0;

        if (searchState.matches.length === 0) {
            results.innerHTML = `
                <div class="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    <i class="fas fa-search-minus mb-3 block text-3xl text-gray-300 dark:text-gray-600"></i>
                    <p>Không tìm thấy kết quả cho "<span class="font-semibold text-gray-700 dark:text-gray-300">${query}</span>"</p>
                    <p class="text-xs mt-2">Thử: "caesar", "atbash", "vigenere", ...</p>
                </div>
            `;
            if (countEl) countEl.textContent = '';
            return;
        }

        let html = '<ul>';
        searchState.matches.forEach((a, i) => {
            html += `
                <li>
                    <a href="${getFullPath(a.path)}" data-index="${i}"
                        class="search-result-item flex items-center gap-3 px-3 py-3 mx-1 rounded-xl transition-colors group">
                        <span class="w-12 h-12 rounded-xl ${colorClasses(a.color)} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <i class="fas ${a.icon} text-lg"></i>
                        </span>
                        <span class="flex-1 min-w-0">
                            <span class="block text-base font-semibold text-gray-900 dark:text-white">${a.name}</span>
                            <span class="block text-sm text-gray-500 dark:text-gray-400 truncate">${a.desc}</span>
                        </span>
                        <i class="fas fa-arrow-right text-sm text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"></i>
                    </a>
                </li>
            `;
        });
        html += '</ul>';
        results.innerHTML = html;
        if (countEl) countEl.textContent = `${searchState.matches.length} kết quả`;
        updateSearchSelected();
    }

    function updateSearchSelected(shouldScroll = true) {
        const results = document.getElementById('search-popup-results');
        if (!results) return;
        const items = results.querySelectorAll('.search-result-item');
        items.forEach((item, i) => {
            if (i === searchState.selectedIndex) {
                item.classList.add('bg-amber-50', 'dark:bg-gray-700/50');
                if (shouldScroll) {
                    item.scrollIntoView({ block: 'nearest' });
                }
            } else {
                item.classList.remove('bg-amber-50', 'dark:bg-gray-700/50');
            }
        });
    }

    // ==================== EVENT BINDING ====================
    function bindNavbarEvents() {
        if (window.__navbarEventsBound) return;
        window.__navbarEventsBound = true;

        // ===== Click =====
        document.addEventListener('click', function (e) {
            if (e.target.closest('#theme-toggle')) { toggleTheme(); return; }

            if (e.target.closest('#search-trigger') || e.target.closest('#search-mobile-trigger')) {
                openSearch(); return;
            }
            if (e.target.closest('#search-popup-backdrop')) { closeSearch(); return; }

            if (e.target.closest('#search-popup-clear')) {
                const input = document.getElementById('search-popup-input');
                const clearBtn = document.getElementById('search-popup-clear');
                if (input) input.value = '';
                if (clearBtn) clearBtn.classList.add('hidden');
                renderSearchResults('');
                if (input) input.focus();
                return;
            }
        });

        // ===== Keydown global: ESC đóng search + Ctrl/Cmd+K mở search =====
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                const searchPopup = document.getElementById('search-popup');
                if (searchPopup && searchPopup.style.display !== 'none') {
                    closeSearch();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                const popup = document.getElementById('search-popup');
                if (popup && popup.style.display === 'none') openSearch();
                else closeSearch();
            }
        });

        // ===== Input cho search =====
        document.addEventListener('input', function (e) {
            if (e.target.id === 'search-popup-input') {
                const clearBtn = document.getElementById('search-popup-clear');
                if (clearBtn) clearBtn.classList.toggle('hidden', !e.target.value);
                renderSearchResults(e.target.value);
            }
        });

        // ===== Navigation trong search (ArrowUp / ArrowDown / Enter) =====
        document.addEventListener('keydown', function (e) {
            if (e.target.id !== 'search-popup-input') return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                suppressHoverSelection = true;
                searchState.selectedIndex = Math.min(searchState.selectedIndex + 1, searchState.matches.length - 1);
                updateSearchSelected();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                suppressHoverSelection = true;
                searchState.selectedIndex = Math.max(searchState.selectedIndex - 1, 0);
                updateSearchSelected();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const match = searchState.matches[searchState.selectedIndex];
                if (match) window.location.href = getFullPath(match.path);
            }
        });

        // ===== Reset cờ suppress khi chuột THỰC SỰ di chuyển =====
        document.addEventListener('mousemove', function () {
            suppressHoverSelection = false;
        });

        // ===== Hover chuột trên kết quả → đổi selection (DUY NHẤT) =====
        document.addEventListener('mouseover', function (e) {
            if (suppressHoverSelection) return;

            const item = e.target.closest('.search-result-item');
            if (!item) return;

            const popup = document.getElementById('search-popup');
            if (!popup || popup.style.display === 'none') return;

            const idx = parseInt(item.dataset.index);
            if (!isNaN(idx) && idx !== searchState.selectedIndex) {
                searchState.selectedIndex = idx;
                updateSearchSelected(false);
            }
        });
    }

    // ==================== LOAD ====================
    async function loadNavbar() {
        isInPages = window.location.pathname.includes('/pages/');
        const basePath = isInPages ? '../' : '';
        const cacheBust = '?v=' + Date.now();

        // ===== Load navbar (có cache) =====
        const navbarPh = document.getElementById('navbar-placeholder');
        if (navbarPh) {
            // Đổi version này MỖI KHI sửa components/navbar.html
            const NAVBAR_CACHE_VERSION = 'v2';

            let cachedHtml = null;
            try {
                cachedHtml = sessionStorage.getItem('navbar-html-' + NAVBAR_CACHE_VERSION);
            } catch (e) { }

            if (cachedHtml) {
                // Có cache → inject ngay, không cần chờ
                navbarPh.innerHTML = cachedHtml;
                applyCachedNavbar(navbarPh);
            } else {
                // Chưa có cache → fetch
                try {
                    const res = await fetch(basePath + 'components/navbar.html' + cacheBust);
                    if (res.ok) {
                        const html = await res.text();
                        navbarPh.innerHTML = html;
                        applyCachedNavbar(navbarPh);
                        // Lưu cache cho lần sau
                        try {
                            sessionStorage.setItem('navbar-html-' + NAVBAR_CACHE_VERSION, html);
                        } catch (e) { }
                    }
                } catch (err) {
                    console.error('[Navbar] Load error:', err);
                }
            }
        }

        // Hàm phụ để rewrite link + sticky + brand text
        function applyCachedNavbar(navbarPh) {
            const prefix = isInPages ? '..' : '.';
            navbarPh.querySelectorAll('a[href^="/"]').forEach(a => {
                a.setAttribute('href', prefix + a.getAttribute('href'));
            });
            navbarPh.classList.add('sticky', 'top-0', 'z-40');

            // ===== Brand superscript: EAD ↔ Encrypt And Decrypt theo viewport =====
            function updateBrandText() {
                const el = navbarPh.querySelector('#navbar-brand-sup');
                if (!el) return;
                el.textContent = window.innerWidth >= 900 ? 'Encrypt And Decrypt' : 'EAD';
            }
            updateBrandText();
            window.addEventListener('resize', updateBrandText);
        }


        // ===== Load footer =====
        const footerPh = document.getElementById('footer-placeholder');
        if (footerPh) {
            try {
                const res = await fetch(basePath + 'components/footer.html' + cacheBust);
                if (res.ok) {
                    footerPh.innerHTML = await res.text();
                }
            } catch (err) {
                console.error('[Footer] Load error:', err);
            }
        }

        // ===== Update year cho footer =====
        document.querySelectorAll('.current-year').forEach(el => {
            el.textContent = new Date().getFullYear();
        });

        await new Promise(resolve => requestAnimationFrame(resolve));

        applyTheme();
        renderSearchResults('');
        bindNavbarEvents();

        console.log('[Navbar] Ready');
    }

    // ==================== START ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadNavbar);
    } else {
        loadNavbar();
    }
})();