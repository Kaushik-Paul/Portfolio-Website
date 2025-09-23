document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const navToggle = document.getElementById('nav-toggle');
    const navClose = document.getElementById('nav-close');
    const navMenu = document.querySelector('.nav__menu');
    const navLinks = document.querySelectorAll('.nav__link');
    const header = document.querySelector('.header');
    const scrollUpEl = document.getElementById('scroll-up');
    const scrollDownEl = document.getElementById('scroll-down');

    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.add('show-menu');
        });
    }

    if (navClose && navMenu) {
        navClose.addEventListener('click', function() {
            navMenu.classList.remove('show-menu');
        });
    }

    // Close menu when clicking on nav links
    if (navMenu) {
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('show-menu');
            });
        });
    }

    // Header scroll effect
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            } else {
                header.style.backgroundColor = 'var(--container-color)';
                header.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.1)';
            }
        });
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
                if (sections[i].offsetTop - 90 > scrollPos + 1) {
                    return sections[i].offsetTop - 70; // account for header
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
                window.scrollTo({ top: target.offsetTop - 70, behavior: 'smooth' });
            }
        });
    });

    // Active link highlight on scroll
    const sections = document.querySelectorAll('section[id]');
    const activateMenuOnScroll = () => {
        const scrollY = window.pageYOffset;
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 100;
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

// (scroll and smooth anchor logic handled inside DOMContentLoaded)

// Animation on scroll
const animateOnScroll = function() {
    const elements = document.querySelectorAll('.animate-on-scroll');

    elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;

        if (elementPosition < screenPosition) {
            element.classList.add('visible');
        }
    });
};

window.addEventListener('scroll', animateOnScroll);
window.addEventListener('load', animateOnScroll);

// Add animation classes to sections
document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.classList.add('animate-on-scroll');
    });
});