document.addEventListener('DOMContentLoaded', function() {
    const root = document.documentElement;
    const navToggle = document.getElementById('nav-toggle');
    const navClose = document.getElementById('nav-close');
    const navMenu = document.getElementById('nav-menu');
    const navOverlay = document.getElementById('nav-overlay');
    const navLinks = document.querySelectorAll('.nav__link');
    const header = document.getElementById('header');
    const scrollUpEl = document.getElementById('scroll-up');
    const progressEl = document.getElementById('scroll-progress');
    const themeToggle = document.getElementById('theme-toggle');
    const themeDropdown = document.getElementById('theme-dropdown');
    const themeIcon = document.getElementById('theme-icon');
    const themeOptions = document.querySelectorAll('.theme-option');
    const metaThemeColor = document.getElementById('meta-theme-color');
    const footerYear = document.getElementById('footer-year');
    const desktopNavQuery = window.matchMedia('(min-width: 960px)');
    const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

    if (footerYear) footerYear.textContent = String(new Date().getFullYear());

    // ===== Mobile menu =====
    const openMenu = () => {
        if (!navMenu) return;
        navMenu.classList.add('show-menu');
        document.body.classList.add('nav-open');
        if (navOverlay) navOverlay.classList.add('show');
        if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
        if (navClose) navClose.focus();
    };

    const closeMenu = () => {
        if (!navMenu || !navMenu.classList.contains('show-menu')) return;
        navMenu.classList.remove('show-menu');
        document.body.classList.remove('nav-open');
        if (navOverlay) navOverlay.classList.remove('show');
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    };

    if (navToggle) navToggle.addEventListener('click', openMenu);
    if (navClose) navClose.addEventListener('click', closeMenu);
    if (navOverlay) navOverlay.addEventListener('click', closeMenu);
    navLinks.forEach(link => link.addEventListener('click', closeMenu));
    if (navMenu) {
        navMenu.querySelectorAll('.nav__resume').forEach(link => link.addEventListener('click', closeMenu));
    }

    desktopNavQuery.addEventListener('change', (e) => {
        if (e.matches) closeMenu();
    });

    // ===== Scroll-driven UI (header, progress bar, back-to-top, active link) =====
    const sections = Array.from(document.querySelectorAll('section[id]'));
    const linkFor = (id) => document.querySelector(`.nav__menu a[href="#${id}"]`);

    const updateActiveLink = () => {
        const marker = window.scrollY + window.innerHeight * 0.35;
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        let currentId = sections.length ? sections[0].id : '';

        sections.forEach(section => {
            if (section.offsetTop <= marker) currentId = section.id;
        });
        if (atBottom && sections.length) currentId = sections[sections.length - 1].id;

        // Sections without a nav link (e.g. FAQ) keep the previous linked section highlighted.
        if (!linkFor(currentId)) {
            const linked = sections.filter(s => s.offsetTop <= marker && linkFor(s.id));
            if (linked.length) currentId = linked[linked.length - 1].id;
        }

        navLinks.forEach(link => link.classList.remove('active'));
        const active = linkFor(currentId);
        if (active) active.classList.add('active');
    };

    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

            if (header) header.classList.toggle('header--scrolled', scrollY > 20);
            if (scrollUpEl) scrollUpEl.classList.toggle('show-scroll', scrollY > 400);
            if (progressEl) {
                const progress = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;
                progressEl.style.setProperty('--progress', progress.toFixed(4));
            }
            updateActiveLink();
            ticking = false;
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    if (scrollUpEl) {
        scrollUpEl.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===== Theme =====
    const THEMES = ['light', 'dark', 'system'];
    const THEME_ICONS = { light: 'fa-sun', dark: 'fa-moon', system: 'fa-desktop' };
    const THEME_COLORS = { light: '#f6f7fb', dark: '#070b14' };

    const getStoredTheme = () => {
        try {
            const stored = localStorage.getItem('theme');
            return THEMES.includes(stored) ? stored : 'system';
        } catch (e) {
            return 'system';
        }
    };

    const saveTheme = (theme) => {
        try {
            localStorage.setItem('theme', theme);
        } catch (e) {
            // Storage unavailable (private mode etc.) — the choice still applies for this visit.
        }
    };

    const resolveTheme = (theme) => {
        if (theme === 'system') return systemDarkQuery.matches ? 'dark' : 'light';
        return theme;
    };

    const applyTheme = (theme) => {
        const resolved = resolveTheme(theme);
        root.classList.toggle('dark-theme', resolved === 'dark');
        root.classList.toggle('light-theme', resolved === 'light');
        if (metaThemeColor) metaThemeColor.setAttribute('content', THEME_COLORS[resolved]);

        if (themeIcon) themeIcon.className = `fas ${THEME_ICONS[theme]}`;
        if (themeToggle) themeToggle.setAttribute('aria-label', `Change color theme (current: ${theme})`);

        themeOptions.forEach(option => {
            const isActive = option.dataset.theme === theme;
            option.classList.toggle('active', isActive);
            option.setAttribute('aria-checked', isActive ? 'true' : 'false');
        });
    };

    const setThemeDropdown = (open) => {
        if (!themeDropdown || !themeToggle) return;
        themeDropdown.classList.toggle('show', open);
        themeToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    if (themeToggle && themeDropdown) {
        themeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            setThemeDropdown(!themeDropdown.classList.contains('show'));
        });

        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const selected = option.dataset.theme;
                saveTheme(selected);
                applyTheme(selected);
                setThemeDropdown(false);
                themeToggle.focus();
            });
        });

        document.addEventListener('click', (e) => {
            if (!themeToggle.contains(e.target) && !themeDropdown.contains(e.target)) {
                setThemeDropdown(false);
            }
        });
    }

    systemDarkQuery.addEventListener('change', () => {
        if (getStoredTheme() === 'system') applyTheme('system');
    });

    // Another tab changed the theme.
    window.addEventListener('storage', (e) => {
        if (e.key === 'theme') applyTheme(getStoredTheme());
    });

    applyTheme(getStoredTheme());

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMenu();
            setThemeDropdown(false);
        }
    });

    // ===== Reveal on scroll =====
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
        // Stagger siblings that share a parent so grids cascade in.
        const groups = new Map();
        revealEls.forEach(el => {
            const siblings = groups.get(el.parentElement) || [];
            siblings.push(el);
            groups.set(el.parentElement, siblings);
        });
        groups.forEach(siblings => {
            siblings.forEach((el, i) => el.style.setProperty('--reveal-delay', `${Math.min(i, 6) * 80}ms`));
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        revealEls.forEach(el => observer.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('is-visible'));
    }

    // Initialize 404 page animations if on 404 page
    init404Animations();
});

// 404 Page Animations
function init404Animations() {
    const rocket = document.querySelector('.error-page .rocket i');
    const planet = document.querySelector('.planet');

    if (!rocket || !planet) return;

    // Rocket launch animation on hover
    rocket.addEventListener('mouseenter', function() {
        this.style.animation = 'rocketLaunch 1s forwards';

        // Add shooting stars after rocket launches
        setTimeout(() => {
            createShootingStars();
        }, 500);
    });

    // Reset rocket animation after launch
    rocket.addEventListener('animationend', function() {
        if (this.style.animationName === 'rocketLaunch') {
            setTimeout(() => {
                this.style.animation = 'none';
                this.offsetHeight; // Trigger reflow
                this.style.animation = 'float 3s ease-in-out infinite';
            }, 2000);
        }
    });

    // Create shooting stars
    function createShootingStars() {
        const animationContainer = document.querySelector('.error__animation');
        if (!animationContainer) return;

        for (let i = 0; i < 3; i++) {
            const star = document.createElement('div');
            star.className = 'shooting-star';
            star.innerHTML = '✦';

            // Random position
            const startX = Math.random() * 100;
            const startY = Math.random() * 50;
            const endX = startX + 20 + Math.random() * 60;
            const endY = startY + 20 + Math.random() * 60;

            star.style.left = `${startX}%`;
            star.style.top = `${startY}%`;
            star.style.animation = `shootingStar ${1 + Math.random()}s linear forwards`;
            star.style.setProperty('--end-x', `${endX}%`);
            star.style.setProperty('--end-y', `${endY}%`);

            animationContainer.appendChild(star);

            // Remove star after animation
            star.addEventListener('animationend', function() {
                star.remove();
            });
        }
    }

    // Add styles for shooting stars if they don't exist
    if (!document.getElementById('404-animations-style')) {
        const style = document.createElement('style');
        style.id = '404-animations-style';
        style.textContent = `
            @keyframes rocketLaunch {
                0% { transform: translate(0, 0) scale(1); opacity: 1; }
                30% { transform: translate(0, 0) scale(1.2); }
                100% { transform: translate(150%, -250%) scale(0.5); opacity: 0; }
            }

            .shooting-star {
                position: absolute;
                font-size: 1.5rem;
                opacity: 0.8;
                z-index: 1;
                animation: shootingStar 1s linear forwards;
            }

            @keyframes shootingStar {
                to {
                    left: var(--end-x, 100%);
                    top: var(--end-y, 0);
                    opacity: 0;
                    transform: scale(0.5);
                }
            }
        `;
        document.head.appendChild(style);
    }
}
