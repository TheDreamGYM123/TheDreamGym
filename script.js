document.addEventListener('DOMContentLoaded', async () => {
    const getInstagramUrl = (value) => {
        const fallback = 'https://www.instagram.com/thedreamgym24/';
        try {
            const url = new URL(value || fallback);
            if (!url.hostname.includes('instagram.com')) return fallback;
            url.pathname = url.pathname.replace(/\/embed\/?$/, '/');
            url.search = '';
            return url.href;
        } catch (error) {
            return fallback;
        }
    };

    // Fetch dynamic data from backend
    try {
        const settingsRes = await fetch('/api/settings');
        const settings = await settingsRes.json();
        
        const mainMarquee = document.getElementById('main-marquee');
        const marqueeContent = document.getElementById('marquee-content');
        const header = document.getElementById('header');
        
        if (mainMarquee && marqueeContent) {
            if (settings.banner_active === '1') {
                const text = settings.banner_text || '';
                let repeatedText = '';
                for(let i=0; i<30; i++) {
                    repeatedText += `${text} &nbsp;•&nbsp; `;
                }
                marqueeContent.innerHTML = `<span>${repeatedText}</span><span>${repeatedText}</span>`;
                
                if (settings.banner_speed) {
                    marqueeContent.style.animationDuration = `${settings.banner_speed}s`;
                }
                mainMarquee.style.display = 'flex';
                if(header) header.style.top = '40px';
            } else {
                mainMarquee.style.display = 'none';
                if(header) header.style.top = '0px';
            }
        }

        const watchVideoBtn = document.getElementById('watch-video-btn');
        if (watchVideoBtn && settings.hero_video_url) {
            watchVideoBtn.addEventListener('click', () => {
                let videoUrl = settings.hero_video_url.trim();
                if (!videoUrl) return;
                if (!/^https?:\/\//i.test(videoUrl)) {
                    videoUrl = `https://${videoUrl}`;
                }

                try {
                    const url = new URL(videoUrl);
                    if (url.protocol === 'http:' || url.protocol === 'https:') {
                        window.location.href = url.href;
                    }
                } catch (error) {
                    console.error('Invalid hero video URL:', error);
                }
            });
        }
    } catch (e) {
        console.error("Backend not connected yet or error fetching settings:", e);
    }

    // Header Scroll Effect
    let lastScrollTop = 0;
    const header = document.getElementById('header');
    let scrollTimeout;

    // Active Nav Link Elements
    const navLinks = document.querySelectorAll('.nav-links a');
    const navSections = [
        { id: '#', element: document.querySelector('.hero') },
        { id: '#programs', element: document.getElementById('programs') },
        { id: '#coaches', element: document.getElementById('coaches') },
        { id: '#pricing', element: document.getElementById('pricing') },
        { id: '#location', element: document.getElementById('location') }
    ];
    let scrollTicking = false;

    window.addEventListener('scroll', () => {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(() => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add background when scrolled
        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Hide/Show on scroll up/down
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            header.classList.add('nav-hidden');
            clearTimeout(scrollTimeout);
        } else if (scrollTop < lastScrollTop) {
            header.classList.remove('nav-hidden');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (window.pageYOffset > 100) {
                    header.classList.add('nav-hidden');
                }
            }, 2000);
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;

        // Active Nav Link Highlighting
        let currentNav = '#';
        navSections.forEach(sec => {
            if (sec.element) {
                const sectionTop = sec.element.offsetTop;
                if (scrollTop >= sectionTop - 250) {
                    currentNav = sec.id;
                }
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentNav) {
                link.classList.add('active');
            }
        });
            scrollTicking = false;
        });
    }, { passive: true });

    // Mobile Menu Logic
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    if (mobileMenuBtn && closeMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('open');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });

        closeMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        });

        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    const mapPanel = document.querySelector('.map-load-panel');
    if (mapPanel) {
        mapPanel.addEventListener('click', () => {
            if (mapPanel.dataset.loaded === 'true') return;
            const iframe = document.createElement('iframe');
            iframe.src = mapPanel.dataset.mapSrc;
            iframe.title = 'The Dream Gym location map';
            iframe.loading = 'lazy';
            iframe.referrerPolicy = 'no-referrer-when-downgrade';
            mapPanel.dataset.loaded = 'true';
            mapPanel.replaceWith(iframe);
        });
    }

    // Pricing Toggle Logic
    const pricingToggle = document.getElementById('pricing-toggle');
    const monthlyText = document.getElementById('monthly-text');
    const yearlyText = document.getElementById('yearly-text');

    function updateLabelStyles() {
        if (pricingToggle.checked) {
            monthlyText.style.opacity = '0.5';
            monthlyText.classList.remove('text-secondary');
            yearlyText.style.opacity = '1';
            yearlyText.classList.add('text-secondary');
        } else {
            monthlyText.style.opacity = '1';
            monthlyText.classList.add('text-secondary');
            yearlyText.style.opacity = '0.5';
            yearlyText.classList.remove('text-secondary');
        }
    }

    if (pricingToggle) {
        updateLabelStyles();
        pricingToggle.addEventListener('change', updateLabelStyles);
    }

    // Intersection Observer for fade-in animations
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once it has faded in
                fadeObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    fadeElements.forEach(el => {
        fadeObserver.observe(el);
    });

    // Toggle About Text
    window.toggleAboutText = () => {
        const moreText = document.getElementById('more-about-text');
        const btn = document.getElementById('about-toggle-btn');
        if (moreText.style.display === 'none' || moreText.style.display === '') {
            moreText.style.display = 'inline';
            btn.innerHTML = 'SHOW LESS <span class="material-symbols-outlined" style="font-size: 16px;">expand_less</span>';
        } else {
            moreText.style.display = 'none';
            btn.innerHTML = 'LEARN MORE <span class="material-symbols-outlined" style="font-size: 16px;">expand_more</span>';
        }
    };

    const runAfterFirstPaint = (callback) => {
        const runner = () => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(callback, { timeout: 1400 });
            } else {
                setTimeout(callback, 600);
            }
        };

        if (document.readyState === 'complete') {
            runner();
        } else {
            window.addEventListener('load', runner, { once: true });
        }
    };

    runAfterFirstPaint(async () => {
    // Load Reviews
    const reviewsContainer = document.getElementById('reviews-container');
    if (reviewsContainer) {
        try {
            const res = await fetch('/api/reviews');
            const reviews = await res.json();
            
            reviewsContainer.innerHTML = '';
            reviews.forEach((review, idx) => {
                let starsHtml = '';
                for(let i=0; i<review.rating; i++) {
                    starsHtml += '<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 1">star</span>';
                }
                
                let contentHtml = review.content;
                const maxLength = 120;
                if (review.content.length > maxLength) {
                    const truncated = review.content.substring(0, maxLength) + '...';
                    contentHtml = `
                        <span class="review-text-short">${truncated}</span>
                        <span class="review-text-full" hidden>${review.content}</span>
                        <button type="button" class="review-toggle" aria-expanded="false">Read more</button>
                    `;
                }
                
                reviewsContainer.innerHTML += `
                    <div class="review-card">
                        <div class="review-quote-mark">”</div>
                        <div>
                            <div class="review-stars">
                                ${starsHtml}
                            </div>
                            <div class="review-content">
                                ${contentHtml}
                            </div>
                        </div>
                        <div class="review-author" style="margin-top: 24px;">
                            <img src="${review.image}" alt="${review.name}" loading="lazy" decoding="async">
                            <div class="review-author-info">
                                <div class="name">${review.name}</div>
                                <div class="role">${review.role}</div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            // Re-run intersection observer on new elements if needed, or they just show up.
            const newFadeElements = reviewsContainer.querySelectorAll('.review-card');
            newFadeElements.forEach(el => fadeObserver.observe(el));

            reviewsContainer.querySelectorAll('.review-toggle').forEach(button => {
                button.addEventListener('click', () => {
                    const reviewContent = button.closest('.review-content');
                    if (!reviewContent) return;

                    const shortText = reviewContent.querySelector('.review-text-short');
                    const fullText = reviewContent.querySelector('.review-text-full');
                    const isExpanded = button.getAttribute('aria-expanded') === 'true';

                    if (shortText) shortText.hidden = !isExpanded;
                    if (fullText) fullText.hidden = isExpanded;
                    button.setAttribute('aria-expanded', String(!isExpanded));
                    button.innerText = isExpanded ? 'Read more' : 'Read less';

                    if (isExpanded) {
                        resumeReviewAutoScroll();
                    } else {
                        pauseReviewAutoScroll();
                    }
                });
            });
            
        } catch (e) {
            console.error("Failed to load reviews", e);
        }

        const prevBtn = document.getElementById('review-prev');
        const nextBtn = document.getElementById('review-next');
        let reviewAutoScrollTimer = null;
        let reviewAutoScrollPaused = false;
        let activeReviewIndex = 0;
        const reviewAutoScrollDelay = 3000;

        const getReviewCards = () => Array.from(reviewsContainer.querySelectorAll('.review-card'));

        const scrollToReview = (index) => {
            const cards = getReviewCards();
            if (cards.length === 0) return;

            activeReviewIndex = (index + cards.length) % cards.length;
            const cardLeft = cards[activeReviewIndex].getBoundingClientRect().left;
            const containerLeft = reviewsContainer.getBoundingClientRect().left;
            reviewsContainer.scrollTo({
                left: reviewsContainer.scrollLeft + cardLeft - containerLeft,
                behavior: 'smooth'
            });
        };

        const scrollToNextReview = () => {
            scrollToReview(activeReviewIndex + 1);
        };

        const scrollToPreviousReview = () => {
            scrollToReview(activeReviewIndex - 1);
        };

        const startReviewAutoScroll = () => {
            if (reviewAutoScrollTimer || reviewAutoScrollPaused || getReviewCards().length < 2) return;
            reviewAutoScrollTimer = setInterval(scrollToNextReview, reviewAutoScrollDelay);
        };

        const stopReviewAutoScroll = () => {
            if (!reviewAutoScrollTimer) return;
            clearInterval(reviewAutoScrollTimer);
            reviewAutoScrollTimer = null;
        };

        const pauseReviewAutoScroll = () => {
            reviewAutoScrollPaused = true;
            stopReviewAutoScroll();
        };

        const resumeReviewAutoScroll = () => {
            const hasExpandedReview = reviewsContainer.querySelector('.review-toggle[aria-expanded="true"]');
            if (hasExpandedReview) return;
            reviewAutoScrollPaused = false;
            startReviewAutoScroll();
        };

        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                stopReviewAutoScroll();
                scrollToPreviousReview();
                startReviewAutoScroll();
            });

            nextBtn.addEventListener('click', () => {
                stopReviewAutoScroll();
                scrollToNextReview();
                startReviewAutoScroll();
            });
        }

        startReviewAutoScroll();
    }

    // Load Gallery
    const galleryGrid = document.getElementById('gallery-bento-grid');
    if (galleryGrid) {
        try {
            const res = await fetch('/api/gallery');
            const galleryItems = await res.json();
            
            galleryGrid.innerHTML = '';
            galleryItems.forEach(item => {
                let colClass = '';
                let rowClass = '';
                if(item.grid_column && item.grid_column === 'span 2') colClass = 'span-2-col';
                if(item.grid_row && item.grid_row === 'span 2') rowClass = 'span-2-row';
                
                let contentHtml = '';
                if (item.type === 'image') {
                    contentHtml = `<img src="${item.content}" alt="${item.title || 'Gallery Image'}" class="bento-img" loading="lazy" decoding="async">`;
                } else if (item.type === 'youtube') {
                    contentHtml = `<iframe src="${item.content}" class="bento-iframe" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="${item.title || 'Gallery media'}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                } else if (item.type === 'instagram') {
                    contentHtml = `
                        <a class="bento-social-link instagram-card" href="${getInstagramUrl(item.content)}" target="_blank" rel="noopener noreferrer">
                            <span class="material-symbols-outlined">photo_camera</span>
                            <strong class="font-label-caps">${item.title || 'Instagram'}</strong>
                            <span>View on Instagram</span>
                        </a>
                    `;
                } else if (item.type === 'text') {
                    contentHtml = `<div class="bento-text-content font-body-lg text-secondary">"${item.content}"</div>`;
                }
                
                const labelHtml = item.title ? `<div class="bento-label font-label-caps">${item.title}</div>` : '';

                galleryGrid.innerHTML += `
                    <div class="bento-item ${colClass} ${rowClass}">
                        ${contentHtml}
                        ${item.type === 'image' || item.type === 'youtube' ? labelHtml : ''}
                    </div>
                `;
            });
            
            const newFadeElements = galleryGrid.querySelectorAll('.bento-item');
            newFadeElements.forEach(el => fadeObserver.observe(el));
            
            const loadMoreBtn = document.getElementById('gallery-load-more');
            if (loadMoreBtn) {
                loadMoreBtn.addEventListener('click', () => {
                    galleryGrid.classList.toggle('expanded');
                    if (galleryGrid.classList.contains('expanded')) {
                        loadMoreBtn.innerHTML = 'SHOW LESS';
                    } else {
                        loadMoreBtn.innerHTML = 'LOAD MORE';
                    }
                });
            }
            
        } catch (e) {
            console.error("Failed to load gallery", e);
        }
    }

    // Load Pricing
    const pricingGrid = document.querySelector('.pricing-grid');
    if (pricingGrid) {
        try {
            const res = await fetch('/api/pricing');
            const plans = await res.json();
            const membershipPlan = plans.find(plan => plan.category === 'membership');
            const trainingPlans = plans.filter(plan => plan.category !== 'membership');
            const popularPlans = trainingPlans.filter(plan => Number(plan.is_popular) === 1).slice(0, 3);
            const homepagePlans = (popularPlans.length ? popularPlans : trainingPlans).slice(0, 3);
            const formatPlanAmount = (amount) => Number(String(amount).replace(/[^\d.]/g, '') || 0).toLocaleString('en-IN');
            const renderCutPrice = (amount) => {
                const value = Number(String(amount || '').replace(/[^\d.]/g, '') || 0);
                return value ? `<div class="pricing-cut-price">Rs ${value.toLocaleString('en-IN')}</div>` : '';
            };
            const renderPlanCard = (plan, featured = false) => `
                <div class="pricing-card ${featured ? 'elite' : ''}">
                    ${featured ? '<div class="elite-glow"></div><div class="font-label-caps elite-badge">POPULAR</div>' : ''}
                    <div>
                        <div class="font-label-caps pricing-plan-name uppercase">${plan.name}</div>
                        <div class="pricing-period-label">${plan.period || ''}</div>
                        <div class="pricing-plan-badge">${plan.badge || plan.period}</div>
                        ${renderCutPrice(plan.cut_price)}
                        <div class="pricing-amount text-secondary">Rs ${formatPlanAmount(plan.price)}<span class="font-label-caps"> / ${String(plan.period || '').toUpperCase()}</span></div>
                    </div>
                    <ul class="pricing-features font-body-sm">
                        ${(plan.features || []).map(feature => `<li><span class="material-symbols-outlined text-secondary">check_circle</span> ${feature}</li>`).join('')}
                    </ul>
                    <button class="${featured ? 'btn-pricing-elite font-label-caps font-display-md' : 'btn-pricing font-label-caps'}" data-plan-name="${plan.name}" data-billing-cycle="${plan.period}" data-amount="${plan.price}">
                        ${featured ? 'GET STARTED' : 'SELECT PLAN'}
                    </button>
                </div>
            `;

            if (membershipPlan) {
                const membershipPanel = document.querySelector('.membership-fee-panel');
                if (membershipPanel) {
                    membershipPanel.innerHTML = `
                        <div>
                            <span class="font-label-caps">One-time membership fee</span>
                            <strong>Rs ${formatPlanAmount(membershipPlan.price)}</strong>
                        </div>
                        <p>${(membershipPlan.features || []).join(' ') || 'Registration is separate from the training plans below.'}</p>
                        <button class="btn-pricing membership-fee-btn" data-plan-name="${membershipPlan.name}" data-billing-cycle="${membershipPlan.period}" data-amount="${membershipPlan.price}">PAY MEMBERSHIP FEE</button>
                    `;
                }
            }

            pricingGrid.innerHTML = homepagePlans.map((plan, index) => renderPlanCard(plan, index === 1)).join('');
            const allPlansGrid = document.getElementById('all-pricing-plans-grid');
            if (allPlansGrid) {
                const groupLabels = {
                    subscription: 'Subscription Plans',
                    'personal-training': 'Personal Training Plans'
                };
                allPlansGrid.innerHTML = Object.entries(groupLabels).map(([category, title]) => {
                    const categoryPlans = trainingPlans.filter(plan => plan.category === category);
                    if (categoryPlans.length === 0) return '';
                    return `
                        <div class="pricing-plan-group">
                            <div class="pricing-group-heading">
                                <span class="font-label-caps">${category === 'subscription' ? 'Gym membership' : 'Coach-led plan'}</span>
                                <h3 class="font-display-md uppercase">${title}</h3>
                            </div>
                            <div class="pricing-card-row">
                                ${categoryPlans.map(plan => renderPlanCard(plan, Number(plan.is_popular) === 1)).join('')}
                            </div>
                        </div>
                    `;
                }).join('');
            }

            const newPlanElements = document.querySelectorAll('.pricing-card, .pricing-plan-group');
            newPlanElements.forEach(el => fadeObserver.observe(el));

            document.querySelectorAll('.pricing-card button, .membership-fee-btn').forEach(button => {
                button.addEventListener('click', () => {
                    openPaymentModal({
                        planName: button.dataset.planName,
                        billingCycle: button.dataset.billingCycle,
                        amount: button.dataset.amount
                    });
                });
            });
        } catch (e) {
            console.error("Failed to load pricing", e);
        }
    }

    // Load Trainers
    const coachesGrid = document.getElementById('coaches-grid');
    if (coachesGrid) {
        try {
            const res = await fetch('/api/trainers');
            const trainers = await res.json();
            
            if (trainers.length > 0) {
                coachesGrid.innerHTML = '';
                trainers.forEach(trainer => {
                    const delayStr = trainer.delay ? `style="transition-delay: ${trainer.delay};"` : '';
                    coachesGrid.innerHTML += `
                        <div class="coach-card fade-in" ${delayStr}>
                            <img src="${trainer.image_url}" alt="${trainer.name}" class="coach-img" loading="lazy" decoding="async">
                            <div class="coach-overlay"></div>
                            <div class="coach-info">
                                <div class="font-headline-md">${trainer.name}</div>
                                <div class="font-label-caps text-secondary">${trainer.role}</div>
                            </div>
                        </div>
                    `;
                });
                
                const newFadeElements = coachesGrid.querySelectorAll('.coach-card');
                newFadeElements.forEach(el => fadeObserver.observe(el));
            }
        } catch (e) {
            console.error("Failed to load trainers", e);
        }
    }

    // Load About Carousel Images
    const aboutCarouselTrack = document.querySelector('.carousel-track');
    const aboutCarouselDots = document.querySelector('.carousel-dots');
    const aboutCarouselContainer = document.querySelector('.about-carousel');
    if (aboutCarouselTrack && aboutCarouselDots && aboutCarouselContainer) {
        try {
            const res = await fetch('/api/about_images');
            const images = await res.json();
            
            if (images.length > 0) {
                aboutCarouselTrack.innerHTML = '';
                aboutCarouselDots.innerHTML = '';
                
                images.forEach((img, index) => {
                    aboutCarouselTrack.innerHTML += `<img src="${img.image_url}" alt="Gym interior ${index + 1}" class="about-img" loading="lazy" decoding="async">`;
                    aboutCarouselDots.innerHTML += `<span class="dot ${index === 0 ? 'active' : ''}"></span>`;
                });
                
                // Initialize carousel logic
                let currentSlide = 0;
                const slides = aboutCarouselTrack.querySelectorAll('.about-img');
                const dots = aboutCarouselDots.querySelectorAll('.dot');
                let carouselInterval;

                const updateActiveDot = (index) => {
                    dots.forEach(d => d.classList.remove('active'));
                    if (dots[index]) dots[index].classList.add('active');
                    currentSlide = index;
                };

                const startCarousel = () => {
                    if (slides.length > 1) {
                        carouselInterval = setInterval(() => {
                            let nextSlide = (currentSlide + 1) % slides.length;
                            const slideWidth = slides[0].clientWidth;
                            aboutCarouselContainer.scrollTo({
                                left: nextSlide * slideWidth,
                                behavior: 'smooth'
                            });
                            updateActiveDot(nextSlide);
                        }, 3000);
                    }
                };

                // Handle manual scrolling synchronization
                aboutCarouselContainer.addEventListener('scroll', () => {
                    const slideWidth = slides[0].clientWidth;
                    const scrollLeft = aboutCarouselContainer.scrollLeft;
                    const index = Math.round(scrollLeft / slideWidth);
                    if (index !== currentSlide && index < slides.length) {
                        updateActiveDot(index);
                    }
                }, { passive: true });

                // Handle dot clicks
                dots.forEach((dot, index) => {
                    dot.addEventListener('click', () => {
                        clearInterval(carouselInterval); // Pause auto-scroll when user interacts
                        const slideWidth = slides[0].clientWidth;
                        aboutCarouselContainer.scrollTo({
                            left: index * slideWidth,
                            behavior: 'smooth'
                        });
                        updateActiveDot(index);
                        startCarousel(); // Resume auto-scroll
                    });
                });

                startCarousel();
            } else {
                // If no images exist, clear the track completely
                aboutCarouselTrack.innerHTML = '<p class="text-on-surface-variant font-bold p-8 text-center w-full">No images uploaded.</p>';
                aboutCarouselDots.innerHTML = '';
            }
        } catch (e) {
            console.error("Failed to load about images", e);
        }
    }
    });
});

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

function openPaymentModal({ planName, billingCycle, amount }) {
    const planInput = document.getElementById('payment-plan-name');
    const cycleInput = document.getElementById('payment-billing-cycle');
    const amountInput = document.getElementById('payment-amount');
    const summary = document.getElementById('payment-plan-summary');
    const paymentForm = document.getElementById('payment-form');
    const receipt = document.getElementById('payment-receipt');

    if (paymentForm) {
        paymentForm.reset();
        paymentForm.style.display = 'flex';
    }
    if (planInput) planInput.value = planName || '';
    if (cycleInput) cycleInput.value = billingCycle || 'Monthly';
    if (amountInput) amountInput.value = amount || '';
    if (summary) {
        summary.innerText = `${planName || 'Membership'} - ${billingCycle || 'Monthly'} - Rs ${amount || ''}`;
    }
    if (receipt) {
        receipt.hidden = true;
        receipt.innerHTML = '';
    }

    openModal('payment-modal');
}

let razorpayScriptPromise;
function loadRazorpayScript() {
    if (window.Razorpay) return Promise.resolve();
    if (!razorpayScriptPromise) {
        razorpayScriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
            document.head.appendChild(script);
        });
    }
    return razorpayScriptPromise;
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
}

function formatIndiaTime(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return 'Not available';

    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone: 'Asia/Kolkata'
    }).format(date);
}

function showPaymentReceipt(receiptData) {
    const paymentForm = document.getElementById('payment-form');
    const receipt = document.getElementById('payment-receipt');
    const summary = document.getElementById('payment-plan-summary');

    if (!receipt) return;
    if (paymentForm) paymentForm.style.display = 'none';
    if (summary) summary.innerText = 'Your payment receipt is ready.';

    receipt.innerHTML = `
        <div class="receipt-header">
            <div>
                <div class="font-label-caps text-secondary" style="margin-bottom: 8px;">THE DREAM GYM</div>
                <h3 class="font-display-md uppercase">Payment Receipt</h3>
                <p class="font-body-sm" style="color: var(--on-surface-variant); margin-top: 8px;">Keep this transaction ID for your records.</p>
            </div>
            <span class="receipt-status font-label-caps">${escapeHtml(receiptData.status)}</span>
        </div>
        <div class="receipt-grid">
            <div class="receipt-line"><span>Name</span><strong>${escapeHtml(receiptData.name)}</strong></div>
            <div class="receipt-line"><span>Transaction ID</span><strong>${escapeHtml(receiptData.paymentId)}</strong></div>
            <div class="receipt-line"><span>Plan</span><strong>${escapeHtml(receiptData.plan)} (${escapeHtml(receiptData.billingCycle)})</strong></div>
            <div class="receipt-line"><span>Amount</span><strong>Rs ${escapeHtml(receiptData.amount)}</strong></div>
            <div class="receipt-line"><span>Payment Time</span><strong>${escapeHtml(formatIndiaTime(receiptData.paidAt))}</strong></div>
            <div class="receipt-line"><span>Order ID</span><strong>${escapeHtml(receiptData.orderId || 'Not created in demo mode')}</strong></div>
        </div>
        <div class="receipt-actions">
            <button type="button" class="btn-secondary font-label-caps" onclick="printPaymentReceipt()">PRINT RECEIPT</button>
            <button type="button" class="btn-primary font-label-caps" onclick="closeModal('payment-modal')">DONE</button>
        </div>
    `;
    receipt.hidden = false;
}

function printPaymentReceipt() {
    const receipt = document.getElementById('payment-receipt');
    if (!receipt || receipt.hidden) return;

    const printableFrame = document.createElement('iframe');
    printableFrame.setAttribute('title', 'Payment receipt print frame');
    printableFrame.style.position = 'fixed';
    printableFrame.style.right = '0';
    printableFrame.style.bottom = '0';
    printableFrame.style.width = '0';
    printableFrame.style.height = '0';
    printableFrame.style.border = '0';
    document.body.appendChild(printableFrame);

    const receiptHtml = receipt.innerHTML;
    const printDocument = printableFrame.contentWindow.document;
    printDocument.open();
    printDocument.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>The Dream Gym Payment Receipt</title>
            <style>
                * {
                    box-sizing: border-box;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                @page {
                    size: A4;
                    margin: 16mm;
                }
                body {
                    margin: 0;
                    min-height: 100vh;
                    background: #15130a;
                    color: #e8e2d1;
                    font-family: Arial, Helvetica, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .print-wrap {
                    width: min(100%, 720px);
                    padding: 28px;
                    background:
                        radial-gradient(circle at top left, rgba(230, 208, 45, 0.14), transparent 260px),
                        #15130a;
                    border: 1px solid rgba(230, 208, 45, 0.35);
                    border-radius: 18px;
                    box-shadow: 0 22px 70px rgba(0, 0, 0, 0.35);
                }
                .payment-receipt {
                    border: 0;
                    background: transparent;
                    padding: 0;
                    color: #e8e2d1;
                }
                .receipt-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 20px;
                    padding-bottom: 18px;
                    margin-bottom: 18px;
                    border-bottom: 1px solid rgba(75, 71, 52, 0.65);
                }
                .font-label-caps {
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.14em;
                }
                .font-display-md {
                    font-size: 34px;
                    line-height: 1.1;
                    margin: 0;
                    text-transform: uppercase;
                }
                .font-body-sm {
                    font-size: 14px;
                    line-height: 1.6;
                }
                .text-secondary {
                    color: #e6d02d;
                }
                .receipt-status {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8px 12px;
                    border-radius: 9999px;
                    background-color: rgba(76, 175, 80, 0.16);
                    color: #8ee59a;
                    border: 1px solid rgba(76, 175, 80, 0.45);
                    white-space: nowrap;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                }
                .receipt-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 14px;
                    margin-bottom: 22px;
                }
                .receipt-line {
                    padding: 14px;
                    border: 1px solid rgba(75, 71, 52, 0.55);
                    border-radius: 12px;
                    background-color: rgba(34, 32, 21, 0.92);
                    min-height: 76px;
                }
                .receipt-line span {
                    display: block;
                    color: #cdc7ad;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    margin-bottom: 6px;
                }
                .receipt-line strong {
                    display: block;
                    color: #e8e2d1;
                    overflow-wrap: anywhere;
                    font-size: 15px;
                    line-height: 1.35;
                }
                .receipt-actions {
                    display: none !important;
                }
                @media print {
                    body {
                        background: #15130a !important;
                    }
                    .print-wrap {
                        box-shadow: none;
                    }
                }
            </style>
        </head>
        <body>
            <main class="print-wrap">
                <section class="payment-receipt">${receiptHtml}</section>
            </main>
        </body>
        </html>
    `);
    printDocument.close();

    setTimeout(() => {
        printableFrame.contentWindow.focus();
        printableFrame.contentWindow.print();
        setTimeout(() => printableFrame.remove(), 1000);
    }, 150);
}

// Contact Form Submission
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('contact-submit-btn');
            const originalText = btn.innerText;
            btn.innerText = 'SENDING...';
            btn.disabled = true;

            const payload = {
                name: document.getElementById('contact-name').value,
                email: document.getElementById('contact-email').value,
                phone: document.getElementById('contact-phone').value,
                message: document.getElementById('contact-message').value
            };

            try {
                const res = await fetch('/api/contacts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    btn.innerText = 'APPLICATION SENT!';
                    btn.style.backgroundColor = '#4caf50';
                    btn.style.color = 'white';
                    contactForm.reset();
                    
                    setTimeout(() => {
                        closeModal('contact-modal');
                        btn.innerText = originalText;
                        btn.style.backgroundColor = 'var(--secondary)';
                        btn.style.color = 'var(--background)';
                        btn.disabled = false;
                    }, 2000);
                } else {
                    throw new Error('Failed to submit');
                }
            } catch (error) {
                console.error('Submission error:', error);
                btn.innerText = 'ERROR. TRY AGAIN.';
                btn.style.backgroundColor = '#f44336';
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.backgroundColor = 'var(--secondary)';
                    btn.disabled = false;
                }, 3000);
            }
        });
    }

    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('payment-submit-btn');
            const originalText = btn.innerText;
            btn.innerText = 'SAVING...';
            btn.disabled = true;

            const payload = {
                plan_name: document.getElementById('payment-plan-name').value,
                billing_cycle: document.getElementById('payment-billing-cycle').value,
                amount: document.getElementById('payment-amount').value,
                name: document.getElementById('payment-name').value,
                email: document.getElementById('payment-email').value,
                phone: document.getElementById('payment-phone').value
            };

            try {
                const res = await fetch('/api/payment-requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    throw new Error('Failed to save payment request');
                }

                const paymentRequest = await res.json();
                const amountInPaise = Number(String(payload.amount).replace(/[^\d.]/g, '')) * 100;

                btn.innerText = 'PREPARING PAYMENT...';
                await loadRazorpayScript();

                const configRes = await fetch('/api/razorpay-key');
                if (!configRes.ok) {
                    throw new Error('Failed to load Razorpay key');
                }

                const razorpayConfig = await configRes.json();
                if (!razorpayConfig.key_id) {
                    throw new Error('Razorpay key is not configured');
                }

                if (!razorpayConfig.orders_enabled) {
                    throw new Error('Razorpay order creation is not configured');
                }

                const orderRes = await fetch('/api/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        payment_request_id: paymentRequest.id,
                        amount: amountInPaise,
                        currency: 'INR',
                        receipt: `tdg_${paymentRequest.id}`,
                        plan_name: payload.plan_name,
                        billing_cycle: payload.billing_cycle
                    })
                });

                const razorpayOrder = await orderRes.json();
                if (!orderRes.ok) {
                    throw new Error(razorpayOrder.error || 'Failed to create Razorpay order');
                }

                const checkoutOptions = {
                    key: razorpayConfig.key_id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    name: 'The Dream Gym',
                    description: `${payload.plan_name} ${payload.billing_cycle} Membership`,
                    order_id: razorpayOrder.order_id,
                    prefill: {
                        name: payload.name,
                        email: payload.email,
                        contact: payload.phone
                    },
                    notes: {
                        payment_request_id: String(paymentRequest.id),
                        plan: payload.plan_name,
                        billing_cycle: payload.billing_cycle
                    },
                    theme: {
                        color: '#e6d02d'
                    },
                    handler: async (response) => {
                        try {
                            const verifyRes = await fetch('/api/verify-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    payment_request_id: paymentRequest.id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature
                                })
                            });

                            const verifyData = await verifyRes.json();
                            if (!verifyRes.ok) {
                                throw new Error(verifyData.error || 'Payment verification failed');
                            }

                            btn.innerText = 'PAYMENT SUCCESS!';
                            btn.style.backgroundColor = '#4caf50';
                            btn.style.color = 'white';
                            paymentForm.reset();
                            btn.innerText = originalText;
                            btn.style.backgroundColor = 'var(--secondary)';
                            btn.style.color = 'var(--background)';
                            btn.disabled = false;

                            showPaymentReceipt({
                                name: payload.name,
                                plan: payload.plan_name,
                                billingCycle: payload.billing_cycle,
                                amount: payload.amount,
                                paymentId: response.razorpay_payment_id,
                                orderId: response.razorpay_order_id || razorpayOrder.order_id || '',
                                status: 'Paid',
                                paidAt: verifyData.paid_at || new Date().toISOString()
                            });
                        } catch (error) {
                            console.error('Payment verification error:', error);
                            btn.innerText = 'VERIFY FAILED';
                            btn.style.backgroundColor = '#f44336';
                            btn.style.color = 'white';
                            setTimeout(() => {
                                btn.innerText = originalText;
                                btn.style.backgroundColor = 'var(--secondary)';
                                btn.style.color = 'var(--background)';
                                btn.disabled = false;
                            }, 3000);
                        }
                    },
                    modal: {
                        ondismiss: async () => {
                            await fetch(`/api/payment-requests/${paymentRequest.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'CANCELLED' })
                            });

                            btn.innerText = originalText;
                            btn.style.backgroundColor = 'var(--secondary)';
                            btn.style.color = 'var(--background)';
                            btn.disabled = false;
                        }
                    }
                };

                const checkout = new Razorpay(checkoutOptions);
                checkout.on('payment.failed', async (response) => {
                    await fetch(`/api/payment-requests/${paymentRequest.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            status: 'FAILED',
                            razorpay_payment_id: response.error?.metadata?.payment_id || ''
                        })
                    });

                    btn.innerText = response.error?.description || 'PAYMENT FAILED';
                    btn.style.backgroundColor = '#f44336';
                    btn.style.color = 'white';
                    setTimeout(() => {
                        btn.innerText = originalText;
                        btn.style.backgroundColor = 'var(--secondary)';
                        btn.style.color = 'var(--background)';
                        btn.disabled = false;
                    }, 3500);
                });

                checkout.open();
            } catch (error) {
                console.error('Payment request error:', error);
                btn.innerText = 'ERROR. TRY AGAIN.';
                btn.style.backgroundColor = '#f44336';
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.backgroundColor = 'var(--secondary)';
                    btn.disabled = false;
                }, 3000);
            }
        });
    }
});
