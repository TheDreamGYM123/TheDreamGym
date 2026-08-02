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
        
        // --- Promotion Popup Helper Functions ---
        function openPromotionPopup() {
            let popupModal = document.getElementById('promo-popup-modal');
            if (!popupModal) {
                popupModal = document.createElement('div');
                popupModal.id = 'promo-popup-modal';
                popupModal.style.position = 'fixed';
                popupModal.style.top = '0';
                popupModal.style.left = '0';
                popupModal.style.width = '100%';
                popupModal.style.height = '100%';
                popupModal.style.backgroundColor = 'rgba(21, 19, 10, 0.85)';
                popupModal.style.backdropFilter = 'blur(8px)';
                popupModal.style.webkitBackdropFilter = 'blur(8px)';
                popupModal.style.zIndex = '99999';
                popupModal.style.display = 'flex';
                popupModal.style.alignItems = 'center';
                popupModal.style.justifyContent = 'center';
                popupModal.style.opacity = '0';
                popupModal.style.transition = 'opacity 0.4s ease';
                
                popupModal.innerHTML = `
                    <div style="position: relative; max-width: 550px; width: 90%; background-color: #222015; border: 2px solid #e6d02d; border-radius: 16px; overflow: hidden; box-shadow: 0 0 30px rgba(230, 208, 45, 0.25);">
                        <button id="promo-popup-close" style="position: absolute; top: 12px; right: 16px; background: transparent; border: none; color: #cdc7ad; font-size: 28px; cursor: pointer; transition: color 0.2s; z-index: 10;">&times;</button>
                        <a id="promo-popup-link" href="#" style="display: block; width: 100%; height: 100%; outline: none;">
                            <img id="promo-popup-img" src="" alt="Exclusive Offer" style="width: 100%; height: auto; display: block; object-fit: cover;">
                        </a>
                    </div>
                `;
                document.body.appendChild(popupModal);
                
                document.getElementById('promo-popup-close').addEventListener('click', (e) => {
                    e.preventDefault();
                    closePromotionPopup();
                });
                
                popupModal.addEventListener('click', (e) => {
                    if (e.target === popupModal) {
                        closePromotionPopup();
                    }
                });
            }
            
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            const desktopImg = settings.popup_desktop_image;
            const mobileImg = settings.popup_mobile_image;
            const activeImg = isMobile ? (mobileImg || desktopImg) : (desktopImg || mobileImg);
            const redirectUrl = settings.popup_link_url || '#';
            
            if (!activeImg) return;
            
            document.getElementById('promo-popup-img').src = activeImg;
            document.getElementById('promo-popup-link').href = redirectUrl;
            
            popupModal.style.display = 'flex';
            setTimeout(() => {
                popupModal.style.opacity = '1';
            }, 10);
            
            sessionStorage.setItem('promoPopupShown', 'true');
        }

        function closePromotionPopup() {
            const popupModal = document.getElementById('promo-popup-modal');
            if (popupModal) {
                popupModal.style.opacity = '0';
                setTimeout(() => {
                    popupModal.style.display = 'none';
                }, 400);
            }
        }

        if (mainMarquee && marqueeContent) {
            if (settings.banner_active === '1') {
                const text = settings.banner_text || '';
                const btnText = settings.banner_btn_text || '';
                const btnUrl = settings.banner_btn_url || '#';
                
                const isPopupTrigger = settings.popup_enabled === '1';
                const buttonTag = 'span'; // Use span for consistent display inside animated text
                
                let repeatedText = '';
                for(let i=0; i<15; i++) {
                    repeatedText += `${text}`;
                    if (btnText) {
                        repeatedText += ` <span class="marquee-btn" data-href="${btnUrl}" style="color: inherit; font-weight: 900; text-transform: uppercase; cursor: pointer; text-decoration: none; display: inline-block; vertical-align: middle; margin: 0 20px; position: relative; z-index: 101; pointer-events: auto; font-size: 14px; letter-spacing: 0.05em;">${btnText}</span>`;
                    }
                    repeatedText += ` &nbsp;•&nbsp; `;
                }
                
                marqueeContent.innerHTML = `<span>${repeatedText}</span><span>${repeatedText}</span>`;
                
                if (settings.banner_speed) {
                    marqueeContent.style.animationDuration = `${settings.banner_speed}s`;
                }
                mainMarquee.style.display = 'flex';
                if(header) header.style.top = '40px';
                
                // Add click listener to all buttons in the marquee
                marqueeContent.querySelectorAll('.marquee-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isPopupTrigger) {
                            openPromotionPopup();
                        } else {
                            const destUrl = btn.getAttribute('data-href');
                            if (destUrl && destUrl !== '#') {
                                window.location.href = destUrl;
                            }
                        }
                    });
                });
            } else {
                mainMarquee.style.display = 'none';
                if(header) header.style.top = '0px';
            }
        }

        // Auto show popup on page load if enabled
        if (settings.popup_enabled === '1') {
            const delaySec = parseInt(settings.popup_delay || '3', 10);
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            const hasImage = isMobile ? (settings.popup_mobile_image || settings.popup_desktop_image) : (settings.popup_desktop_image || settings.popup_mobile_image);
            
            if (hasImage && !sessionStorage.getItem('promoPopupShown')) {
                setTimeout(() => {
                    openPromotionPopup();
                }, delaySec * 1000);
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
            const activePlans = plans.filter(plan => plan.is_active === undefined || Number(plan.is_active) === 1);
            const membershipPlan = activePlans.find(plan => plan.category === 'membership');
            const trainingPlans = activePlans.filter(plan => plan.category !== 'membership');
            const homepageMarkedPlans = trainingPlans.filter(plan => Number(plan.show_home) === 1).slice(0, 3);
            const popularPlans = trainingPlans.filter(plan => Number(plan.is_popular) === 1).slice(0, 3);
            const homepagePlans = (homepageMarkedPlans.length ? homepageMarkedPlans : (popularPlans.length ? popularPlans : trainingPlans)).slice(0, 3);
            const formatPlanAmount = (amount) => Number(String(amount).replace(/[^\d.]/g, '') || 0).toLocaleString('en-IN');
            const renderCutPrice = (amount) => {
                const value = Number(String(amount || '').replace(/[^\d.]/g, '') || 0);
                return value ? `<div class="pricing-cut-price">₹${value.toLocaleString('en-IN')}</div>` : '';
            };
            const renderPlanCard = (plan, featured = false, catalog = false) => `
                <div class="pricing-card ${featured ? 'elite' : ''} ${catalog ? 'catalog-plan-card' : ''}">
                    ${featured ? '<div class="elite-glow"></div><div class="font-label-caps elite-badge">POPULAR</div>' : ''}
                    <div>
                        <div class="font-label-caps pricing-plan-name uppercase">${plan.name}</div>
                        <div class="pricing-period-label">${plan.period || ''}</div>
                        <div class="pricing-plan-badge">${plan.badge || plan.period}</div>
                        ${renderCutPrice(plan.cut_price)}
                        <div class="pricing-amount text-secondary">₹${formatPlanAmount(plan.price)}<span class="font-label-caps"> / ${String(plan.period || '').toUpperCase()}</span></div>
                    </div>
                    <ul class="pricing-features font-body-sm">
                        ${(plan.features || []).map(feature => `<li><span class="material-symbols-outlined text-secondary">check_circle</span> ${feature}</li>`).join('')}
                    </ul>
                    <button class="${featured ? 'btn-pricing-elite font-label-caps font-display-md' : 'btn-pricing font-label-caps'}" data-plan-name="${plan.name}" data-billing-cycle="${plan.period}" data-amount="${plan.price}">
                        ${featured ? 'GET STARTED' : 'SELECT PLAN'}
                    </button>
                </div>
            `;
            const renderMembershipHero = (plan) => plan ? `
                <div class="catalog-membership-hero">
                    <div>
                        <h3>One-Time Membership Fee</h3>
                        <p class="font-label-caps">${plan.badge || 'Architects of performance initiation'}</p>
                        <button class="btn-pricing membership-fee-btn membership-fee-btn-desktop" data-plan-name="${plan.name}" data-billing-cycle="${plan.period}" data-amount="${plan.price}">PAY MEMBERSHIP FEE</button>
                    </div>
                    <div class="catalog-membership-price">
                        ${renderCutPrice(plan.cut_price)}
                        <strong>₹${formatPlanAmount(plan.price)}</strong>
                        <button class="btn-pricing membership-fee-btn membership-fee-btn-mobile" data-plan-name="${plan.name}" data-billing-cycle="${plan.period}" data-amount="${plan.price}">PAY MEMBERSHIP FEE</button>
                    </div>
                </div>
            ` : '';
            if (membershipPlan) {
                const membershipPanel = document.querySelector('.membership-fee-panel');
                if (membershipPanel) {
                    membershipPanel.style.display = '';
                    membershipPanel.innerHTML = `
                        <div class="home-membership-copy">
                            <span class="font-label-caps">One-time membership fee</span>
                            <p>${membershipPlan.badge || 'Architects of performance initiation'}</p>
                            <button class="btn-pricing membership-fee-btn membership-fee-btn-desktop" data-plan-name="${membershipPlan.name}" data-billing-cycle="${membershipPlan.period}" data-amount="${membershipPlan.price}">PAY MEMBERSHIP FEE</button>
                        </div>
                        <div class="home-membership-price">
                            ${renderCutPrice(membershipPlan.cut_price)}
                            <strong>₹${formatPlanAmount(membershipPlan.price)}</strong>
                            <button class="btn-pricing membership-fee-btn membership-fee-btn-mobile" data-plan-name="${membershipPlan.name}" data-billing-cycle="${membershipPlan.period}" data-amount="${membershipPlan.price}">PAY MEMBERSHIP FEE</button>
                        </div>
                    `;
                }
            } else {
                const membershipPanel = document.querySelector('.membership-fee-panel');
                if (membershipPanel) membershipPanel.style.display = 'none';
            }

            pricingGrid.innerHTML = homepagePlans.map((plan, index) => renderPlanCard(plan, index === 1)).join('');
            const allPlansGrid = document.getElementById('all-pricing-plans-grid');
            if (allPlansGrid) {
                const groupLabels = {
                    subscription: 'Subscription Plans',
                    'personal-training': 'Personal Training Plans'
                };
                const planGroupsHtml = Object.entries(groupLabels).map(([category, title]) => {
                    const categoryPlans = trainingPlans.filter(plan => plan.category === category);
                    if (categoryPlans.length === 0) return '';
                    return `
                        <div class="pricing-plan-group">
                            <div class="pricing-group-heading">
                                <span class="font-label-caps">${category === 'subscription' ? 'Gym membership' : 'Coach-led plan'}</span>
                                <h3 class="font-display-md uppercase">${title}</h3>
                            </div>
                            <div class="pricing-card-row">
                                ${categoryPlans.map(plan => renderPlanCard(plan, Number(plan.is_popular) === 1, true)).join('')}
                            </div>
                        </div>
                    `;
                }).join('');
                allPlansGrid.innerHTML = `
                    ${renderMembershipHero(membershipPlan)}
                    ${planGroupsHtml}
                `;
                setupPlansAutoScroll(allPlansGrid);
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
                
                if (trainers.length < 4) {
                    coachesGrid.classList.add('justify-center-flex');
                } else {
                    coachesGrid.classList.remove('justify-center-flex');
                }

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

function setupPlansAutoScroll(container) {
    const rows = container.querySelectorAll('.pricing-card-row');
    rows.forEach(row => {
        if (row.dataset.autoScrollReady === 'true') return;
        row.dataset.autoScrollReady = 'true';

        let stopped = false;
        let intervalId = null;
        let lastPosition = 0;
        let isAutoScrolling = false;

        const stopAutoScroll = () => {
            stopped = true;
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        };

        ['pointerdown', 'touchstart', 'wheel', 'keydown', 'focusin'].forEach(eventName => {
            row.addEventListener(eventName, stopAutoScroll, { passive: true });
        });

        intervalId = setInterval(() => {
            const modal = row.closest('.modal');
            if (stopped || !modal || !modal.classList.contains('active') || row.scrollWidth <= row.clientWidth + 8) return;

            const card = row.querySelector('.pricing-card');
            const gap = parseFloat(getComputedStyle(row).gap) || 18;
            const step = card ? card.getBoundingClientRect().width + gap : row.clientWidth * 0.8;
            const maxScroll = row.scrollWidth - row.clientWidth;
            const nextPosition = row.scrollLeft + step >= maxScroll - 8 ? 0 : row.scrollLeft + step;

            lastPosition = nextPosition;
            isAutoScrolling = true;
            row.scrollTo({ left: nextPosition, behavior: 'smooth' });
            setTimeout(() => { isAutoScrolling = false; }, 900);
        }, 2800);

        row.addEventListener('scroll', () => {
            if (!isAutoScrolling && Math.abs(row.scrollLeft - lastPosition) > 24) {
                stopAutoScroll();
            }
        }, { passive: true });
    });
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function openMembershipPlans(event) {
    if (event) event.preventDefault();

    const pricingSection = document.getElementById('pricing');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenu) {
        mobileMenu.classList.remove('open');
    }

    if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        window.location.hash = 'pricing';
    }

    window.setTimeout(() => {
        openModal('plans-modal');
    }, 450);
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
        summary.innerText = `${planName || 'Membership'} - ${billingCycle || 'Monthly'} - ₹${amount || ''}`;
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
            <div class="receipt-line"><span>Amount</span><strong>₹${escapeHtml(receiptData.amount)}</strong></div>
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
