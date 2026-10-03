document.addEventListener('DOMContentLoaded', function() {
    const root = document.documentElement;
    const navToggle = document.getElementById('nav-toggle');
    const navClose = document.getElementById('nav-close');
    const navMenu = document.getElementById('nav-menu');
    const navOverlay = document.getElementById('nav-overlay');
    const navIndicator = document.getElementById('nav-indicator');
    const navLinks = document.querySelectorAll('.nav__link');
    const header = document.getElementById('header');
    const scrollUpEl = document.getElementById('scroll-up');
    const progressEl = document.getElementById('scroll-progress');
    const themeSwitch = document.querySelector('.theme-switch');
    const themeOptions = document.querySelectorAll('.theme-option');
    const metaThemeColor = document.getElementById('meta-theme-color');
    const footerYear = document.getElementById('footer-year');
    const desktopNavQuery = window.matchMedia('(min-width: 960px)');
    const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

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
        navMenu.querySelectorAll('.nav__menu-foot a').forEach(link => link.addEventListener('click', closeMenu));
    }

    // ===== Sliding nav indicator (desktop) =====
    const moveIndicator = () => {
        if (!navIndicator || !desktopNavQuery.matches) return;
        const active = document.querySelector('.nav__link.active');
        if (!active) {
            navIndicator.classList.remove('is-ready');
            return;
        }
        navIndicator.style.width = `${active.offsetWidth}px`;
        navIndicator.style.transform = `translateX(${active.parentElement.offsetLeft}px)`;
        navIndicator.classList.add('is-ready');
    };

    desktopNavQuery.addEventListener('change', (e) => {
        if (e.matches) closeMenu();
        moveIndicator();
    });

    // ===== Scroll-driven UI (header, progress bar, back-to-top, active link) =====
    const sections = Array.from(document.querySelectorAll('section[id]'));
    const linkFor = (id) => document.querySelector(`.nav__menu a[href="#${id}"]`);
    let activeId = '';

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

        if (currentId === activeId) return;
        activeId = currentId;
        navLinks.forEach(link => link.classList.remove('active'));
        const active = linkFor(currentId);
        if (active) active.classList.add('active');
        moveIndicator();
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
    window.addEventListener('resize', () => {
        onScroll();
        moveIndicator();
    });
    onScroll();
    // Web fonts change link widths; re-measure once they're in.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);

    if (scrollUpEl) {
        scrollUpEl.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===== Theme =====
    const THEMES = ['light', 'dark', 'system'];
    const THEME_COLORS = { light: '#f7f8fc', dark: '#05070f' };

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
        // Switch every color in the same frame instead of letting each element transition separately.
        root.classList.add('theme-switching');
        root.classList.toggle('dark-theme', resolved === 'dark');
        root.classList.toggle('light-theme', resolved === 'light');
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => root.classList.remove('theme-switching'));
        });
        if (metaThemeColor) metaThemeColor.setAttribute('content', THEME_COLORS[resolved]);

        if (themeSwitch) themeSwitch.dataset.active = theme;
        themeOptions.forEach(option => {
            const isActive = option.dataset.theme === theme;
            option.classList.toggle('active', isActive);
            option.setAttribute('aria-checked', isActive ? 'true' : 'false');
            option.tabIndex = isActive ? 0 : -1;
        });
    };

    themeOptions.forEach((option, index) => {
        option.addEventListener('click', () => {
            const selected = option.dataset.theme;
            saveTheme(selected);
            applyTheme(selected);
        });
        // Radio-group arrow-key navigation.
        option.addEventListener('keydown', (e) => {
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
            e.preventDefault();
            const step = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
            const next = themeOptions[(index + step + themeOptions.length) % themeOptions.length];
            next.focus();
            next.click();
        });
    });

    systemDarkQuery.addEventListener('change', () => {
        if (getStoredTheme() === 'system') applyTheme('system');
    });

    // Another tab changed the theme.
    window.addEventListener('storage', (e) => {
        if (e.key === 'theme') applyTheme(getStoredTheme());
    });

    applyTheme(getStoredTheme());

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeMenu();
    });

    // ===== Count-up stats =====
    const animateCount = (el) => {
        const target = parseInt(el.dataset.count, 10);
        if (!target || reducedMotionQuery.matches) return;
        const duration = 1400;
        const start = performance.now();
        const tick = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = String(Math.round(target * eased));
            if (t < 1) window.requestAnimationFrame(tick);
        };
        window.requestAnimationFrame(tick);
    };

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
            siblings.forEach((el, i) => el.style.setProperty('--reveal-delay', `${Math.min(i, 6) * 70}ms`));
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    entry.target.querySelectorAll('.count').forEach(animateCount);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        revealEls.forEach(el => observer.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('is-visible'));
    }

    // ===== Hero: rotating words =====
    const rotator = document.getElementById('rotator');
    if (rotator && !reducedMotionQuery.matches) {
        const words = Array.from(rotator.querySelectorAll('.rotator__word'));
        let current = 0;
        window.setInterval(() => {
            if (document.hidden) return;
            const prev = words[current];
            current = (current + 1) % words.length;
            prev.classList.remove('is-active');
            prev.classList.add('is-leaving');
            words[current].classList.remove('is-leaving');
            words[current].classList.add('is-active');
            window.setTimeout(() => prev.classList.remove('is-leaving'), 650);
        }, 2600);
    }

    // ===== Hero: console replay =====
    const consoleBody = document.getElementById('console-body');
    if (consoleBody && !reducedMotionQuery.matches) {
        const lines = Array.from(consoleBody.querySelectorAll('.console__line'));
        const snapshots = lines.map(line => line.innerHTML);
        const cursor = document.createElement('span');
        cursor.className = 'console__cursor';
        cursor.setAttribute('aria-hidden', 'true');
        const wait = (ms) => new Promise(resolve => window.setTimeout(resolve, ms));

        const typeCommand = async (line, html) => {
            const prompt = line.querySelector('.c-prompt');
            const text = line.textContent.replace(prompt ? prompt.textContent : '', '').trimStart();
            line.innerHTML = '';
            if (prompt) line.appendChild(prompt.cloneNode(true));
            const typed = document.createTextNode('');
            line.appendChild(typed);
            line.appendChild(cursor);
            line.hidden = false;
            for (let i = 0; i <= text.length; i++) {
                typed.textContent = text.slice(0, i);
                await wait(38 + Math.random() * 40);
            }
            await wait(280);
            line.innerHTML = html;
        };

        const play = async () => {
            while (true) {
                lines.forEach(line => { line.hidden = true; });
                await wait(500);
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line.querySelector('.c-prompt')) {
                        await typeCommand(line, snapshots[i]);
                    } else {
                        line.innerHTML = snapshots[i];
                        line.hidden = false;
                        await wait(line.classList.contains('c-result') ? 380 : 260);
                    }
                }
                lines[lines.length - 1].appendChild(cursor);
                await wait(5200);
                while (document.hidden) await wait(1000);
            }
        };
        play();
    }

    // ===== Hero: subtle 3D tilt on the console =====
    const tiltEl = document.getElementById('hero-console');
    if (tiltEl && finePointerQuery.matches && !reducedMotionQuery.matches) {
        const visual = tiltEl.parentElement;
        visual.addEventListener('pointermove', (e) => {
            const rect = visual.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            tiltEl.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
            tiltEl.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
        });
        visual.addEventListener('pointerleave', () => {
            tiltEl.style.setProperty('--ry', '0deg');
            tiltEl.style.setProperty('--rx', '0deg');
        });
    }

    // ===== Card spotlight follows the cursor =====
    if (finePointerQuery.matches) {
        document.addEventListener('pointermove', (e) => {
            const card = e.target.closest && e.target.closest('.spotlight');
            if (!card) return;
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
            card.style.setProperty('--my', `${e.clientY - rect.top}px`);
        }, { passive: true });
    }

    // ===== Skills filter =====
    const skillTabs = document.querySelectorAll('.skills__tab');
    const skillItems = document.querySelectorAll('#skills-grid .skill');
    skillTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const filter = tab.dataset.filter;
            skillTabs.forEach(t => {
                const isActive = t === tab;
                t.classList.toggle('is-active', isActive);
                t.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });
            let shown = 0;
            skillItems.forEach(item => {
                const match = filter === 'all' || item.dataset.cat === filter;
                item.classList.toggle('is-hidden', !match);
                item.classList.remove('is-entering');
                if (match) {
                    void item.offsetWidth; // restart the entrance animation
                    item.style.setProperty('--d', `${Math.min(shown, 12) * 30}ms`);
                    item.classList.add('is-entering');
                    shown += 1;
                }
            });
        });
    });

    // ===== Copy email =====
    const copyBtn = document.getElementById('copy-email');
    if (copyBtn) {
        const label = copyBtn.querySelector('span');
        const icon = copyBtn.querySelector('i');
        copyBtn.addEventListener('click', async () => {
            const email = copyBtn.dataset.email;
            try {
                await navigator.clipboard.writeText(email);
            } catch (e) {
                window.location.href = `mailto:${email}`;
                return;
            }
            copyBtn.classList.add('is-copied');
            if (label) label.textContent = 'Copied!';
            if (icon) icon.className = 'fas fa-check';
            copyBtn.setAttribute('aria-label', 'Email address copied');
            window.setTimeout(() => {
                copyBtn.classList.remove('is-copied');
                if (label) label.textContent = 'Copy';
                if (icon) icon.className = 'far fa-copy';
                copyBtn.setAttribute('aria-label', 'Copy email address');
            }, 2000);
        });
    }

    // ===== Local time in India (IST; Asia/Kolkata is the IANA zone for all of India) =====
    const localTime = document.getElementById('local-time');
    if (localTime && window.Intl) {
        const formatter = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata',
        });
        const renderTime = () => {
            localTime.textContent = `${formatter.format(new Date())} IST · UTC+5:30`;
        };
        renderTime();
        window.setInterval(renderTime, 30000);
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
