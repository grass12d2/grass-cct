// ==================== SIDEBAR MANAGER ====================
(function () {
    'use strict';

    // ==================== NAVBAR HEIGHT TRACKING ====================
    function updateNavbarHeight() {
        const navbar = document.querySelector('nav');
        if (navbar) {
            const h = Math.round(navbar.getBoundingClientRect().height);
            document.documentElement.style.setProperty('--navbar-height', h + 'px');
        }
    }

    // ==================== DRAWER ====================
    function openDrawer() {
        const drawer = document.getElementById('tools-drawer');
        const backdrop = document.getElementById('tools-backdrop');
        if (!drawer || !backdrop) return;

        updateNavbarHeight();

        drawer.classList.remove('-translate-x-full');
        drawer.classList.add('translate-x-0');
        backdrop.classList.remove('opacity-0', 'pointer-events-none');
        backdrop.classList.add('opacity-100', 'pointer-events-auto');
        document.body.style.overflow = 'hidden';
        document.documentElement.classList.add('drawer-open');
    }

    function closeDrawer() {
        const drawer = document.getElementById('tools-drawer');
        const backdrop = document.getElementById('tools-backdrop');
        if (!drawer || !backdrop) return;

        drawer.classList.add('-translate-x-full');
        drawer.classList.remove('translate-x-0');
        backdrop.classList.add('opacity-0', 'pointer-events-none');
        backdrop.classList.remove('opacity-100', 'pointer-events-auto');
        document.body.style.overflow = '';
        document.documentElement.classList.remove('drawer-open');
    }

    // NEW: toggle
    function toggleDrawer() {
        const drawer = document.getElementById('tools-drawer');
        if (!drawer) return;
        const isOpen = !drawer.classList.contains('-translate-x-full');
        if (isOpen) closeDrawer();
        else openDrawer();
    }

    // NEW: đánh dấu link đang active
    function highlightActivePage() {
        const sidebarPh = document.getElementById('sidebar-placeholder');
        if (!sidebarPh) return;

        const currentPage = (window.location.pathname.split('/').pop() || 'index.html').split('?')[0];

        sidebarPh.querySelectorAll('a[href]').forEach(a => {
            const href = (a.getAttribute('href') || '').split('?')[0];
            const hrefPage = href.split('/').pop();
            if (hrefPage && hrefPage === currentPage) {
                a.classList.add('sidebar-link-active');
                a.setAttribute('aria-current', 'page');
            } else {
                a.classList.remove('sidebar-link-active');
                a.removeAttribute('aria-current');
            }
        });
    }

    function closeDrawer() {
        const drawer = document.getElementById('tools-drawer');
        const backdrop = document.getElementById('tools-backdrop');
        if (!drawer || !backdrop) return;

        drawer.classList.add('-translate-x-full');
        drawer.classList.remove('translate-x-0');
        backdrop.classList.add('opacity-0', 'pointer-events-none');
        backdrop.classList.remove('opacity-100', 'pointer-events-auto');
        document.body.style.overflow = '';
    }

    // ==================== COLLAPSE GROUP ====================
    function handleCollapseToggle(button, listId, chevronId) {
        const listEl = document.getElementById(listId);
        const chevronEl = document.getElementById(chevronId);
        if (!listEl) return;

        const isExpanded = button.getAttribute('aria-expanded') === 'true';

        if (isExpanded) {
            // Đóng
            listEl.style.height = listEl.scrollHeight + 'px';
            listEl.style.overflow = 'hidden';
            listEl.style.transition = 'height 0.2s ease, opacity 0.2s ease';
            requestAnimationFrame(() => {
                listEl.style.height = '0px';
                listEl.style.opacity = '0';
            });
            button.setAttribute('aria-expanded', 'false');
            if (chevronEl) chevronEl.style.transform = 'rotate(0deg)';
            setTimeout(() => {
                listEl.classList.add('hidden');
                listEl.style.height = '';
                listEl.style.opacity = '';
                listEl.style.overflow = '';
                listEl.style.transition = '';
            }, 220);
        } else {
            // Mở
            listEl.classList.remove('hidden');
            listEl.style.height = '0px';
            listEl.style.opacity = '0';
            listEl.style.overflow = 'hidden';
            listEl.style.transition = 'height 0.2s ease, opacity 0.2s ease';
            requestAnimationFrame(() => {
                listEl.style.height = listEl.scrollHeight + 'px';
                listEl.style.opacity = '1';
            });
            button.setAttribute('aria-expanded', 'true');
            if (chevronEl) chevronEl.style.transform = 'rotate(180deg)';
            setTimeout(() => {
                listEl.style.height = '';
                listEl.style.overflow = '';
                listEl.style.transition = '';
            }, 220);
        }
    }

    // ==================== EVENT BINDING ====================
    function bindSidebarEvents() {
        if (window.__sidebarEventsBound) return;
        window.__sidebarEventsBound = true;

        document.addEventListener('click', function (e) {
            if (e.target.closest('#tools-toggle')) { toggleDrawer(); return; }
            if (e.target.closest('#tools-close')) { closeDrawer(); return; }
            if (e.target.closest('#tools-backdrop')) { closeDrawer(); return; }

            if (e.target.closest('#tool-clear')) {
                localStorage.removeItem('theme');
                if (window.GrassCCT && GrassCCT.showMessage) {
                    GrassCCT.showMessage('Đã xoá dữ liệu tạm!', 'info');
                }
                return;
            }

            const collapseMap = {
                'algorithms-toggle': { list: 'algorithms-list', chevron: 'algorithms-chevron' },
                'utilities-toggle': { list: 'utilities-list', chevron: 'utilities-chevron' },
                'info-toggle': { list: 'info-list', chevron: 'info-chevron' },
            };
            for (const [btnId, cfg] of Object.entries(collapseMap)) {
                const btn = e.target.closest('#' + btnId);
                if (btn) {
                    handleCollapseToggle(btn, cfg.list, cfg.chevron);
                    return;
                }
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                const drawer = document.getElementById('tools-drawer');
                if (drawer && !drawer.classList.contains('-translate-x-full')) {
                    closeDrawer();
                }
            }
        });

        window.addEventListener('resize', updateNavbarHeight);
    }

    // ==================== LOAD ====================
    async function loadSidebar() {
        const isInPages = window.location.pathname.includes('/pages/');
        const basePath = isInPages ? '../' : '';
        const cacheBust = '?v=' + Date.now();

        const sidebarPh = document.getElementById('sidebar-placeholder');
        if (sidebarPh) {
            try {
                const res = await fetch(basePath + 'components/sidebar.html' + cacheBust);
                if (res.ok) {
                    sidebarPh.innerHTML = await res.text();

                    // Rewrite link tương đối: khi ở /pages/ thì prefix "../"
                    // (bỏ qua link external, hash, mailto, tel)
                    sidebarPh.querySelectorAll('a[href]').forEach(a => {
                        const href = a.getAttribute('href');
                        if (!href) return;
                        if (/^(https?:|mailto:|tel:|#|\/\/)/.test(href)) return;
                        if (href.startsWith('../') || href.startsWith('./')) return;
                        a.setAttribute('href', (isInPages ? '../' : '') + href);
                    });
                }
            } catch (err) {
                console.error('[Sidebar] Load error:', err);
            }
        }

        await new Promise(resolve => setTimeout(resolve, 50));

        updateNavbarHeight();
        bindSidebarEvents();
        highlightActivePage();

        console.log('[Sidebar] Ready, navbar height:', document.documentElement.style.getPropertyValue('--navbar-height'));
    }

    // ==================== START ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSidebar);
    } else {
        loadSidebar();
    }
})();