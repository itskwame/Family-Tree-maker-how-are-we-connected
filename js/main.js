// ==========================================
// Smooth Scrolling for Navigation Links
// ==========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = target.offsetTop - navHeight;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ==========================================
// Navbar Background on Scroll
// ==========================================
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    // Add shadow when scrolled
    if (currentScroll > 50) {
        navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    }
    
    lastScroll = currentScroll;
});

// ==========================================
// FAQ Accordion Functionality
// ==========================================
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
        // Close other items
        faqItems.forEach(otherItem => {
            if (otherItem !== item && otherItem.classList.contains('active')) {
                otherItem.classList.remove('active');
            }
        });
        
        // Toggle current item
        item.classList.toggle('active');
    });
});

// ==========================================
// Mobile Menu Toggle
// ==========================================
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');
const navButtons = document.querySelector('.nav-buttons');

mobileMenuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    navButtons.classList.toggle('active');
    
    // Toggle icon
    const icon = mobileMenuToggle.querySelector('i');
    if (icon.classList.contains('fa-bars')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
    } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
});

// ==========================================
// Intersection Observer for Animations
// ==========================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Observe steps
document.querySelectorAll('.step').forEach((step, index) => {
    step.style.opacity = '0';
    step.style.transform = 'translateY(30px)';
    step.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(step);
});

// Observe pricing cards
document.querySelectorAll('.pricing-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});

// Observe testimonials
document.querySelectorAll('.testimonial-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});

// ==========================================
// CTA Button Click Handlers
// ==========================================
// All signup/trial buttons are handled via onclick in HTML
// Demo and schedule buttons can be added here if needed in future

// ==========================================
// Hero Stats Counter Animation
// ==========================================
const animateCounter = (element, target, duration = 2000) => {
    let start = 0;
    const increment = target / (duration / 16); // 60fps
    
    const updateCounter = () => {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start).toLocaleString() + '+';
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target.toLocaleString() + '+';
        }
    };
    
    updateCounter();
};

// Observe hero stats
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const stats = document.querySelectorAll('.stat strong');
            
            // Animate counters once when visible
            if (!entry.target.dataset.animated) {
                animateCounter(stats[0], 10000);
                animateCounter(stats[1], 500);
                animateCounter(stats[2], 1);
                
                // Update the last stat to show millions
                setTimeout(() => {
                    stats[2].textContent = '1M+';
                }, 2000);
                
                entry.target.dataset.animated = 'true';
            }
        }
    });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    statsObserver.observe(heroStats);
}

// ==========================================
// Tree Node Animation Enhancement
// ==========================================
const treeNodes = document.querySelectorAll('.tree-node');

treeNodes.forEach((node, index) => {
    // Add hover effect
    node.addEventListener('mouseenter', () => {
        node.style.transform = 'scale(1.1)';
        node.style.transition = 'transform 0.3s ease';
    });
    
    node.addEventListener('mouseleave', () => {
        node.style.transform = 'scale(1)';
    });
    
    // Staggered entrance animation
    setTimeout(() => {
        node.style.opacity = '1';
        node.style.transform = 'translateY(0)';
    }, index * 200);
    
    node.style.opacity = '0';
    node.style.transform = 'translateY(20px)';
    node.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
});

// ==========================================
// Form Validation (for future implementation)
// ==========================================
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// ==========================================
// Scroll to Top Button (Optional Enhancement)
// ==========================================
const createScrollToTopButton = () => {
    const button = document.createElement('button');
    button.innerHTML = '<i class="fas fa-arrow-up"></i>';
    button.className = 'scroll-to-top';
    button.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
        z-index: 999;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
    `;
    
    document.body.appendChild(button);
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
        } else {
            button.style.opacity = '0';
            button.style.pointerEvents = 'none';
        }
    });
    
    // Scroll to top on click
    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Hover effect
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
    });
};

// Initialize scroll to top button
createScrollToTopButton();

// ==========================================
// Console Welcome Message
// ==========================================
console.log('%c👨‍👩‍👧‍👦 Welcome to FamilyConnect! ', 'font-size: 20px; font-weight: bold; color: #667eea;');
console.log('%cBringing families together, one connection at a time.', 'font-size: 14px; color: #4a5568;');

// ==========================================
// Performance Monitoring (Development)
// ==========================================
if (window.performance) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`Page load time: ${pageLoadTime}ms`);
        }, 0);
    });
}

// ==========================================
// Add mobile menu styles dynamically
// ==========================================
const addMobileMenuStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        @media (max-width: 768px) {
            .nav-links.active,
            .nav-buttons.active {
                display: flex;
                flex-direction: column;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                padding: 20px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                gap: 16px;
            }
            
            .nav-links.active {
                animation: slideDown 0.3s ease;
            }
            
            .nav-buttons.active {
                position: relative;
                top: auto;
                box-shadow: none;
                padding: 0;
                margin-top: 16px;
            }
            
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        }
    `;
    document.head.appendChild(style);
};

addMobileMenuStyles();

// ==========================================
// Initialize all features on DOM ready
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('FamilyConnect Landing Page Loaded Successfully! 🎉');
});
