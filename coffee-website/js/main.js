/* ============================================================
   隅光咖啡 Yú Guāng Coffee — Brand Showcase Website
   Main JavaScript
   ============================================================ */

// Cloudflare Worker API 地址（部署后替换为实际 URL）
const WORKER_URL = 'https://yuguang-reserve-api.g18781875638.workers.dev';

document.addEventListener('DOMContentLoaded', () => {

    // ==================== DOM ELEMENTS ====================
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const backToTop = document.getElementById('backToTop');
    const menuGrid = document.getElementById('menuGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const contactForm = document.getElementById('contactForm');
    const newsletterForm = document.getElementById('newsletterForm');
    const formFeedback = document.getElementById('formFeedback');

    // Lightbox elements
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const galleryItems = document.querySelectorAll('.gallery-item img');

    // Testimonial elements
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    const testimonialDots = document.querySelectorAll('.testimonial-dots .dot');

    // Counter elements
    const counters = document.querySelectorAll('.counter');

    // ==================== INITIALIZATION ====================
    initAOS();

    // ==================== NAVIGATION ====================

    /**
     * Handle scroll events: navbar style, back-to-top, active section, counters
     */
    let scrollTimeout;
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        // Use requestAnimationFrame for performance
        if (!scrollTimeout) {
            scrollTimeout = requestAnimationFrame(() => {
                const scrollY = window.scrollY;

                // Navbar background
                handleNavbarScroll(scrollY);

                // Back to top button
                handleBackToTop(scrollY);

                // Active nav link
                updateActiveNavLink();

                // Counter animation (fires once)
                animateCounters();

                // Update last scroll position
                lastScrollY = scrollY;
                scrollTimeout = null;
            });
        }
    }, { passive: true });

    /**
     * Toggle navbar scrolled class based on scroll position
     */
    function handleNavbarScroll(scrollY) {
        if (scrollY > 80) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    /**
     * Show/hide back-to-top button
     */
    function handleBackToTop(scrollY) {
        if (scrollY > 600) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }

    /**
     * Update active nav link based on visible section
     */
    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollY = window.scrollY + window.innerHeight / 3;

        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    // ==================== MOBILE MENU ====================

    /**
     * Toggle hamburger menu
     */
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    /**
     * Close menu when clicking a nav link
     */
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    /**
     * Close menu when clicking outside
     */
    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('active') &&
            !navMenu.contains(e.target) &&
            !hamburger.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // ==================== SMOOTH SCROLL ====================

    // Smooth scroll for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            e.preventDefault();
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = targetEl.offsetTop - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Back to top button
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // ==================== MENU FILTERING ====================

    /**
     * Filter menu items by category with animation
     */
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');
            const menuCards = document.querySelectorAll('.menu-card');

            // Filter with staggered animation
            menuCards.forEach((card, index) => {
                const category = card.getAttribute('data-category');

                if (filter === 'all' || category === filter) {
                    // Show card with animation
                    card.style.animation = 'none';
                    card.offsetHeight; // Force reflow
                    card.classList.remove('hidden');
                    card.style.animation = `fadeInUp 0.4s ease ${index * 0.06}s both`;
                } else {
                    card.classList.add('hidden');
                    card.style.animation = 'none';
                }
            });
        });
    });

    // ==================== GALLERY LIGHTBOX ====================

    let currentImageIndex = 0;
    const galleryImageArray = Array.from(galleryItems);

    /**
     * Open lightbox
     */
    galleryItems.forEach((img, index) => {
        img.addEventListener('click', () => {
            currentImageIndex = index;
            openLightbox(img.src, img.alt);
        });
    });

    function openLightbox(src, alt) {
        lightboxImg.src = src;
        lightboxImg.alt = alt;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function nextImage() {
        currentImageIndex = (currentImageIndex + 1) % galleryImageArray.length;
        updateLightboxImage();
    }

    function prevImage() {
        currentImageIndex = (currentImageIndex - 1 + galleryImageArray.length) % galleryImageArray.length;
        updateLightboxImage();
    }

    function updateLightboxImage() {
        const img = galleryImageArray[currentImageIndex];
        // Fade transition
        lightboxImg.style.opacity = '0';
        lightboxImg.style.transition = 'opacity 0.2s ease';

        setTimeout(() => {
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightboxImg.style.opacity = '1';
        }, 200);
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxNext.addEventListener('click', nextImage);
    lightboxPrev.addEventListener('click', prevImage);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;

        switch (e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowRight':
                nextImage();
                break;
            case 'ArrowLeft':
                prevImage();
                break;
        }
    });

    // Click outside image to close
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // ==================== TESTIMONIALS SLIDER ====================

    let currentTestimonial = 0;
    let testimonialInterval;

    function showTestimonial(index) {
        testimonialCards.forEach(card => card.classList.remove('active'));
        testimonialDots.forEach(dot => dot.classList.remove('active'));

        testimonialCards[index].classList.add('active');
        testimonialDots[index].classList.add('active');
        currentTestimonial = index;
    }

    // Dot click handlers
    testimonialDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.getAttribute('data-index'));
            showTestimonial(index);
            resetTestimonialAutoPlay();
        });
    });

    // Auto rotate
    function startTestimonialAutoPlay() {
        testimonialInterval = setInterval(() => {
            const next = (currentTestimonial + 1) % testimonialCards.length;
            showTestimonial(next);
        }, 5000);
    }

    function resetTestimonialAutoPlay() {
        clearInterval(testimonialInterval);
        startTestimonialAutoPlay();
    }

    // Start auto-play if there are testimonials
    if (testimonialCards.length > 1) {
        startTestimonialAutoPlay();
    }

    // Pause on hover
    const testimonialsSlider = document.querySelector('.testimonials-slider');
    if (testimonialsSlider) {
        testimonialsSlider.addEventListener('mouseenter', () => {
            clearInterval(testimonialInterval);
        });
        testimonialsSlider.addEventListener('mouseleave', () => {
            startTestimonialAutoPlay();
        });
    }

    // ==================== COUNTER ANIMATION ====================

    let countersAnimated = false;

    function animateCounters() {
        if (countersAnimated) return;

        // Check if counters section is visible
        const statsSection = document.querySelector('.stats');
        if (!statsSection) return;

        const triggerPoint = statsSection.offsetTop - window.innerHeight + 100;
        if (window.scrollY < triggerPoint) return;

        countersAnimated = true;

        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000; // ms
            const startTime = performance.now();
            const startValue = 0;

            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease-out quad
                const eased = 1 - (1 - progress) * (1 - progress);

                const currentValue = Math.round(startValue + (target - startValue) * eased);

                // Format number with commas for large values
                if (target >= 1000) {
                    counter.textContent = currentValue.toLocaleString('zh-CN');
                } else {
                    counter.textContent = currentValue;
                }

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    // Final value
                    counter.textContent = target >= 1000
                        ? target.toLocaleString('zh-CN')
                        : target;
                }
            }

            requestAnimationFrame(update);
        });
    }

    // Also check counters on initial load
    setTimeout(animateCounters, 300);

    // ==================== CONTACT FORM ====================

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Clear previous feedback
            formFeedback.className = 'form-feedback';
            formFeedback.textContent = '';

            // Get form fields
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();

            // Validate
            let isValid = true;
            const errors = [];

            // Clear error states
            document.querySelectorAll('.input-wrapper input, .input-wrapper textarea')
                .forEach(el => el.classList.remove('error'));

            if (!name) {
                errors.push('请输入您的姓名');
                document.getElementById('name').classList.add('error');
                isValid = false;
            } else if (name.length < 2) {
                errors.push('姓名至少需要2个字符');
                document.getElementById('name').classList.add('error');
                isValid = false;
            }

            if (!email) {
                errors.push('请输入您的邮箱');
                document.getElementById('email').classList.add('error');
                isValid = false;
            } else if (!isValidEmail(email)) {
                errors.push('请输入有效的邮箱地址');
                document.getElementById('email').classList.add('error');
                isValid = false;
            }

            if (!message) {
                errors.push('请输入留言内容');
                document.getElementById('message').classList.add('error');
                isValid = false;
            } else if (message.length < 10) {
                errors.push('留言内容至少需要10个字符');
                document.getElementById('message').classList.add('error');
                isValid = false;
            }

            if (!isValid) {
                formFeedback.className = 'form-feedback error';
                formFeedback.textContent = errors.join('；');
                return;
            }

            // Simulate form submission
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发送中...';
            submitBtn.disabled = true;

            setTimeout(() => {
                formFeedback.className = 'form-feedback success';
                formFeedback.textContent = '✨ 消息已成功发送！我们会尽快回复您。';
                contactForm.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;

                // Clear success message after a delay
                setTimeout(() => {
                    formFeedback.textContent = '';
                    formFeedback.className = 'form-feedback';
                }, 5000);
            }, 1500);
        });
    }

    /**
     * Email validation helper
     */
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Real-time validation: clear error state on input
    document.querySelectorAll('.input-wrapper input, .input-wrapper textarea')
        .forEach(input => {
            input.addEventListener('input', function() {
                this.classList.remove('error');
            });
        });

    // ==================== NEWSLETTER FORM ====================

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            const submitBtn = this.querySelector('button[type="submit"]');

            if (!email || !isValidEmail(email)) {
                emailInput.style.borderColor = 'var(--color-error)';
                emailInput.focus();
                return;
            }

            emailInput.style.borderColor = '';

            // Simulate subscription
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '✓';
            submitBtn.style.background = 'var(--color-success)';
            submitBtn.disabled = true;

            setTimeout(() => {
                emailInput.value = '';
                emailInput.placeholder = '订阅成功！感谢您的关注 ✨';
                submitBtn.textContent = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;

                setTimeout(() => {
                    emailInput.placeholder = '请输入您的邮箱';
                }, 4000);
            }, 1200);
        });

        // Clear error state on input
        const newsletterInput = newsletterForm.querySelector('input[type="email"]');
        if (newsletterInput) {
            newsletterInput.addEventListener('input', function() {
                this.style.borderColor = '';
            });
        }
    }

    // ==================== LANGUAGE TOGGLE ====================
    const langToggle = document.getElementById('langToggle');
    let isEnglish = false;

    if (langToggle) {
        langToggle.addEventListener('click', () => {
            isEnglish = !isEnglish;
            langToggle.querySelector('.lang-zh').textContent = isEnglish ? '中文' : 'EN';

            // Simple toggle animation
            langToggle.style.transform = 'scale(0.9)';
            setTimeout(() => {
                langToggle.style.transform = 'scale(1)';
            }, 100);

            // TODO: Implement full i18n if needed
            // For now, just show a toast notification
            showToast(isEnglish ? 'Language switched to English (demo)' : '已切换为中文');
        });
    }

    // ==================== TOAST NOTIFICATION ====================

    /**
     * Simple toast notification
     */
    function showToast(message) {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--color-dark-roast);
            color: #fff;
            padding: 12px 28px;
            border-radius: 50px;
            font-size: 0.88rem;
            z-index: 3000;
            box-shadow: 0 8px 30px rgba(26, 15, 10, 0.3);
            animation: toastIn 0.4s ease, toastOut 0.4s ease 2.5s forwards;
            pointer-events: none;
        `;

        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }

    // Add toast keyframes dynamically
    const toastStyle = document.createElement('style');
    toastStyle.textContent = `
        @keyframes toastIn {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes toastOut {
            from { opacity: 1; transform: translateX(-50%) translateY(0); }
            to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
    `;
    document.head.appendChild(toastStyle);

    // ==================== PARALLAX EFFECT (Hero) ====================

    window.addEventListener('scroll', () => {
        const heroBg = document.querySelector('.hero-bg-image');
        if (heroBg) {
            const scrollY = window.scrollY;
            if (scrollY < window.innerHeight) {
                const parallaxValue = scrollY * 0.4;
                heroBg.style.transform = `translateY(${parallaxValue}px)`;
            }
        }
    }, { passive: true });

    // ==================== UTILITY: AOS INIT ====================
    function initAOS() {
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                offset: 80,
                once: true,
                easing: 'ease-out-cubic',
                disable: 'mobile', // Disable on mobile for better performance
            });
        }
    }

    // ==================== REVEAL ON SCROLL (fallback) ====================
    // For elements without AOS, use IntersectionObserver
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -40px 0px'
        });

        revealElements.forEach(el => revealObserver.observe(el));
    }

    // ==================== RESERVATION FORM ====================

    const reserveForm = document.getElementById('reserveForm');
    const reserveFeedback = document.getElementById('reserveFeedback');

    /**
     * Validate reservation form fields
     * @returns {string[]} Array of error messages (empty = valid)
     */
    function validateReserveForm() {
        const errors = [];
        const name = document.getElementById('rName').value.trim();
        const phone = document.getElementById('rPhone').value.trim();
        const date = document.getElementById('rDate').value;
        const timeSlot = document.getElementById('rTimeSlot').value;
        const guests = parseInt(document.getElementById('rGuests').value);

        // Clear previous error states
        ['rName', 'rPhone', 'rDate', 'rTimeSlot', 'rGuests'].forEach(id => {
            document.getElementById(id).classList.remove('error');
        });

        if (!name || name.length < 2) {
            errors.push('请输入姓名（至少2个字符）');
            document.getElementById('rName').classList.add('error');
        }

        if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
            errors.push('请输入有效的11位手机号');
            document.getElementById('rPhone').classList.add('error');
        }

        if (!date) {
            errors.push('请选择预约日期');
            document.getElementById('rDate').classList.add('error');
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const d = new Date(date + 'T00:00:00');
            if (d < today) {
                errors.push('预约日期不能早于今天');
                document.getElementById('rDate').classList.add('error');
            }
        }

        if (!timeSlot) {
            errors.push('请选择预约时段');
            document.getElementById('rTimeSlot').classList.add('error');
        }

        if (isNaN(guests) || guests < 1 || guests > 20) {
            errors.push('人数需为1-20之间的整数');
            document.getElementById('rGuests').classList.add('error');
        }

        return errors;
    }

    if (reserveForm) {
        reserveForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Clear previous feedback
            reserveFeedback.className = 'form-feedback';
            reserveFeedback.textContent = '';

            const errors = validateReserveForm();
            if (errors.length > 0) {
                reserveFeedback.className = 'form-feedback error';
                reserveFeedback.textContent = errors.join('；');
                return;
            }

            // Build request body
            const body = {
                name: document.getElementById('rName').value.trim(),
                phone: document.getElementById('rPhone').value.trim(),
                date: document.getElementById('rDate').value,
                timeSlot: document.getElementById('rTimeSlot').value,
                guests: parseInt(document.getElementById('rGuests').value),
                notes: document.getElementById('rNotes').value.trim(),
            };

            // Disable button & show loading
            const submitBtn = reserveForm.querySelector('button[type="submit"]');
            const originalHTML = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
            submitBtn.disabled = true;

            try {
                const resp = await fetch(`${WORKER_URL}/api/reservations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });

                const data = await resp.json();

                if (data.success) {
                    reserveFeedback.className = 'form-feedback success';
                    reserveFeedback.textContent = '✨ ' + data.message;
                    reserveForm.reset();
                    document.getElementById('rGuests').value = '2'; // Reset to default

                    showToast('预约提交成功！');
                } else {
                    reserveFeedback.className = 'form-feedback error';
                    reserveFeedback.textContent = (data.errors || ['提交失败，请稍后重试']).join('；');
                }
            } catch (err) {
                reserveFeedback.className = 'form-feedback error';
                reserveFeedback.textContent = '网络错误，请检查网络后重试';
                console.error('Reserve submit error:', err);
            } finally {
                submitBtn.innerHTML = originalHTML;
                submitBtn.disabled = false;

                // Auto-clear success message
                if (reserveFeedback.classList.contains('success')) {
                    setTimeout(() => {
                        reserveFeedback.textContent = '';
                        reserveFeedback.className = 'form-feedback';
                    }, 5000);
                }
            }
        });
    }

    // Real-time error clearing for reservation inputs
    ['rName', 'rPhone', 'rDate', 'rTimeSlot', 'rGuests'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function() {
                this.classList.remove('error');
            });
            el.addEventListener('change', function() {
                this.classList.remove('error');
            });
        }
    });

    // ==================== RESERVATION LOOKUP ====================

    const lookupBtn = document.getElementById('lookupBtn');
    const lookupPhone = document.getElementById('lookupPhone');
    const lookupResults = document.getElementById('lookupResults');

    if (lookupBtn && lookupPhone && lookupResults) {
        lookupBtn.addEventListener('click', async () => {
            const phone = lookupPhone.value.trim();

            if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
                lookupResults.innerHTML = `
                    <div class="lookup-empty">
                        <i class="fas fa-exclamation-circle"></i>
                        请输入有效的11位手机号
                    </div>`;
                return;
            }

            lookupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 查询中';
            lookupBtn.disabled = true;

            try {
                const resp = await fetch(`${WORKER_URL}/api/reservations?phone=${encodeURIComponent(phone)}`);
                const data = await resp.json();

                if (data.success && data.reservations.length > 0) {
                    lookupResults.innerHTML = data.reservations.map(r => `
                        <div class="lookup-result-item">
                            <div class="lookup-result-header">
                                <strong>${escapeHTML(r.name)}</strong>
                                <span class="lookup-status ${r.status}">${statusLabel(r.status)}</span>
                            </div>
                            <div class="lookup-result-date">📅 ${r.reserve_date}</div>
                            <div class="lookup-result-detail">
                                <span><i class="fas fa-clock"></i> ${r.time_slot_label || r.time_slot}</span>
                                <span><i class="fas fa-users"></i> ${r.guests}人</span>
                                ${r.notes ? `<span><i class="fas fa-pencil-alt"></i> ${escapeHTML(r.notes)}</span>` : ''}
                            </div>
                        </div>
                    `).join('');
                } else {
                    lookupResults.innerHTML = `
                        <div class="lookup-empty">
                            <i class="fas fa-coffee"></i>
                            暂无预约记录<br>快来预约您的第一个隅光时光吧
                        </div>`;
                }
            } catch (err) {
                lookupResults.innerHTML = `
                    <div class="lookup-empty">
                        <i class="fas fa-exclamation-triangle"></i>
                        查询失败，请检查网络后重试
                    </div>`;
                console.error('Lookup error:', err);
            } finally {
                lookupBtn.innerHTML = '<i class="fas fa-search"></i> 查询';
                lookupBtn.disabled = false;
            }
        });

        // Also trigger on Enter key
        lookupPhone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                lookupBtn.click();
            }
        });
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Map status code to Chinese label
     */
    function statusLabel(status) {
        const map = {
            pending: '待确认',
            confirmed: '已确认',
            completed: '已完成',
            cancelled: '已取消',
        };
        return map[status] || status;
    }

    // ==================== INITIAL STATE ====================
    // Check initial scroll position
    handleNavbarScroll(window.scrollY);
    handleBackToTop(window.scrollY);
    updateActiveNavLink();

    console.log('%c☕ 隅光咖啡 Yú Guāng Coffee %c— 品牌展示网站已就绪',
        'font-size:1.2em;color:#C68E5B;', 'color:#8D6E63;');
    console.log('%c在城市角落，慢煮一杯光。', 'font-style:italic;color:#A1887F;');
});
