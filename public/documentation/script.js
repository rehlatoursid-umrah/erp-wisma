/**
 * WIN-OS Booklet - Interactive Script
 * Premium UX Interactions (Spotlight, 3D Tilt, Scroll Reveal, Counters)
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. SCROLL REVEAL (Intersection Observer)
    const reveals = document.querySelectorAll('.reveal');
    const revealOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    reveals.forEach(el => revealObserver.observe(el));

    // 2. NAV SCROLL EFFECT
    const nav = document.querySelector('.nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }, { passive: true });

    // 3. COUNTER ANIMATION (Hero Section)
    function animateCounters() {
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.target, 10);
            const duration = 2500; // ms
            const start = performance.now();

            function update(now) {
                const progress = Math.min((now - start) / duration, 1);
                // Ease out expo
                const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                
                counter.textContent = Math.floor(ease * target);
                
                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            }
            requestAnimationFrame(update);
        });
    }
    
    // Trigger counters after a slight delay for dramatic effect on load
    setTimeout(animateCounters, 600);

    // 4. SPOTLIGHT & 3D TILT EFFECT (Cards)
    const cards = document.querySelectorAll('.card-spotlight');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Set variables for the spotlight pseudo-element
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);

            // Calculate 3D tilt
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Max tilt angle is 10 degrees
            const maxTilt = 10;
            const tiltX = ((centerY - y) / centerY) * maxTilt;
            const tiltY = ((x - centerX) / centerX) * maxTilt;

            card.style.setProperty('--tilt-x', `${tiltY}deg`);
            card.style.setProperty('--tilt-y', `${tiltX}deg`);
        });

        // Reset tilt on mouse leave
        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--tilt-x', `0deg`);
            card.style.setProperty('--tilt-y', `0deg`);
        });
    });

    // 5. SMOOTH SCROLL FOR NAV LINKS
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navHeight = nav.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 6. HERO GLOW FLOATING ANIMATION
    const glow = document.querySelector('.hero-glow');
    let tick = 0;
    
    function animateGlow() {
        tick += 0.005;
        if (glow) {
            // Gentle floating in figure-8 or circular path
            const x = Math.sin(tick) * 60;
            const y = Math.cos(tick * 0.8) * 40;
            glow.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        }
        requestAnimationFrame(animateGlow);
    }
    animateGlow();

});
