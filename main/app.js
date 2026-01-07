document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const navToggle = document.getElementById('nav-toggle');
    const navClose = document.getElementById('nav-close');
    const navMenu = document.querySelector('.nav__menu');
    const navOverlay = document.getElementById('nav-overlay');
    const navLinks = document.querySelectorAll('.nav__link');
    const header = document.querySelector('.header');
    const scrollUpEl = document.getElementById('scroll-up');
    const scrollDownEl = document.getElementById('scroll-down');
    const themeToggle = document.getElementById('theme-toggle');
    const themeDropdown = document.getElementById('theme-dropdown');
    const themeIcon = document.getElementById('theme-icon');
    const themeOptions = document.querySelectorAll('.theme-option');

    const getHeaderOffset = () => {
        if (!header) return 70;
        return header.getBoundingClientRect().height || 70;
    };

    const openMenu = () => {
        if (!navMenu) return;
        navMenu.classList.add('show-menu');
        document.body.classList.add('nav-open');
        if (navOverlay) {
            navOverlay.classList.add('show');
            navOverlay.setAttribute('aria-hidden', 'false');
        }
        if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
    };

    const closeMenu = () => {
        if (!navMenu) return;
        navMenu.classList.remove('show-menu');
        document.body.classList.remove('nav-open');
        if (navOverlay) {
            navOverlay.classList.remove('show');
            navOverlay.setAttribute('aria-hidden', 'true');
        }
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    };

    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            openMenu();
        });
    }

    if (navClose && navMenu) {
        navClose.addEventListener('click', function() {
            closeMenu();
        });
    }

    if (navOverlay) {
        navOverlay.addEventListener('click', function() {
            closeMenu();
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMenu();
        }
    });

    // Close menu when clicking on nav links
    if (navMenu) {
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                closeMenu();
            });
        });
    }

    // Header scroll effect
    if (header) {
        const syncHeaderState = () => {
            if (window.scrollY > 50) {
                header.classList.add('header--scrolled');
            } else {
                header.classList.remove('header--scrolled');
            }
        };
        window.addEventListener('scroll', syncHeaderState);
        syncHeaderState();
    }

    // Show/hide scroll-to-top button
    if (scrollUpEl) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 200) {
                scrollUpEl.classList.add('show-scroll');
            } else {
                scrollUpEl.classList.remove('show-scroll');
            }
        });

        // Scroll to top
        scrollUpEl.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Scroll-down button: scroll to next section
    if (scrollDownEl) {
        const sections = Array.from(document.querySelectorAll('section'));

        const getNextSectionTop = () => {
            const scrollPos = window.scrollY;
            for (let i = 0; i < sections.length; i++) {
                const nextTop = sections[i].offsetTop - getHeaderOffset();
                if (nextTop > scrollPos + 1) {
                    return nextTop;
                }
            }
            // If at/after last section, go to bottom
            return document.body.scrollHeight;
        };

        // Show/hide scroll-down (hide near bottom)
        const toggleDownVisibility = () => {
            const nearBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 50;
            if (nearBottom) {
                scrollDownEl.classList.remove('show-scroll');
            } else {
                scrollDownEl.classList.add('show-scroll');
            }
        };

        window.addEventListener('scroll', toggleDownVisibility);
        window.addEventListener('load', toggleDownVisibility);

        scrollDownEl.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: getNextSectionTop(), behavior: 'smooth' });
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            e.preventDefault();
            const target = document.querySelector(targetId);
            if (target) {
                window.scrollTo({ top: target.offsetTop - getHeaderOffset(), behavior: 'smooth' });
            }
        });
    });

    // Active link highlight on scroll
    const sections = document.querySelectorAll('section[id]');
    const activateMenuOnScroll = () => {
        const scrollY = window.pageYOffset;
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - getHeaderOffset() - 30;
            const sectionId = current.getAttribute('id');
            const navLink = document.querySelector(`.nav__menu a[href*="${sectionId}"]`);
            if (!navLink) return;
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLink.classList.add('active');
            } else {
                navLink.classList.remove('active');
            }
        });
    };
    window.addEventListener('scroll', activateMenuOnScroll);
    activateMenuOnScroll();

    // Reset mobile menu state when resizing to desktop
    const resetMenuOnResize = () => {
        if (window.innerWidth >= 768 && navMenu) {
            closeMenu();
            // Ensure desktop styles apply
            navMenu.style.right = '';
        }
    };
    window.addEventListener('resize', resetMenuOnResize);
    resetMenuOnResize();

    // Theme Toggle
    const canUseLocalStorage = () => {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    };

    const getStoredTheme = () => {
        if (!canUseLocalStorage()) return 'system';
        return localStorage.getItem('theme') || 'system';
    };

    const saveTheme = (theme) => {
        try {
            localStorage.setItem('theme', theme);
        } catch (e) {
            console.log('localStorage not available, theme preference will not be saved');
        }
    };

    const getSystemTheme = () => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const applyTheme = (theme) => {
        document.documentElement.classList.remove('light-theme', 'dark-theme');

        if (theme === 'system') {
            const systemTheme = getSystemTheme();
            if (systemTheme === 'dark') {
                document.documentElement.classList.add('dark-theme');
            }
            themeIcon.className = 'fas fa-desktop';
        } else if (theme === 'dark') {
            document.documentElement.classList.add('dark-theme');
            themeIcon.className = 'fas fa-moon';
        } else {
            themeIcon.className = 'fas fa-sun';
        }

        saveTheme(theme);

        themeOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.theme === theme) {
                option.classList.add('active');
            }
        });
    };

    const toggleThemeDropdown = (e) => {
        e.stopPropagation();
        themeDropdown.classList.toggle('show');
    };

    const closeThemeDropdown = () => {
        themeDropdown.classList.remove('show');
    };

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleThemeDropdown);
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const selectedTheme = option.dataset.theme;
                applyTheme(selectedTheme);
                closeThemeDropdown();
            });
        });

        document.addEventListener('click', (e) => {
            if (!themeToggle.contains(e.target) && !themeDropdown.contains(e.target)) {
                closeThemeDropdown();
            }
        });

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (getStoredTheme() === 'system') {
                applyTheme('system');
            }
        });

        applyTheme(getStoredTheme());
    }

    // Animation on scroll (fallback when ScrollReveal isn't available)
    if (!window.ScrollReveal) {
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            section.classList.add('animate-on-scroll');
        });
        window.addEventListener('scroll', animateOnScroll);
        window.addEventListener('load', animateOnScroll);
        animateOnScroll();
    }

    // Initialize 404 page animations if on 404 page
    init404Animations();
});

// Loader: hide after window load
window.addEventListener('load', function() {
    const loader = document.getElementById('loader');
    if (loader) {
        // small delay for smoother transition
        setTimeout(() => loader.classList.add('loader--hide'), 300);
        setTimeout(() => {
            if (loader.parentNode) loader.parentNode.removeChild(loader);
            document.body.classList.remove('is-loading');
        }, 1000);
    }
});

// Scroll reveal animation
if (window.ScrollReveal) {
    const sr = ScrollReveal({
        origin: 'top',
        distance: '60px',
        duration: 2000,
        delay: 200,
        reset: false
    });

    sr.reveal('.home__content, .home__img', { origin: 'left' });
    sr.reveal('.about__img, .about__data', { interval: 200 });
    sr.reveal('.skills__content, .experience__content', { interval: 200 });
    sr.reveal('.contact__card', { interval: 200 });
}

// (scroll and smooth anchor logic handled inside DOMContentLoaded)

// Animation on scroll
function animateOnScroll() {
    const elements = document.querySelectorAll('.animate-on-scroll');

    elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;

        if (elementPosition < screenPosition) {
            element.classList.add('visible');
        }
    });
}

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

    // Reset rocket animation when mouse leaves
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
                0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                30% { transform: translate(-50%, -50%) scale(1.2); }
                100% { transform: translate(200%, -200%) scale(0.5); opacity: 0; }
            }
            
            .shooting-star {
                position: absolute;
                color: #fff;
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