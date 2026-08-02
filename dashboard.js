document.addEventListener('DOMContentLoaded', async () => {
    const escapeAdminHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
    const formatAdminTime = (value) => {
        if (!value) return 'Not available';
        const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
            ? value.replace(' ', 'T') + 'Z'
            : value;
        const date = new Date(normalized);
        if (Number.isNaN(date.getTime())) return value;

        return new Intl.DateTimeFormat('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'medium',
            timeZone: 'Asia/Kolkata'
        }).format(date);
    };

    // Check if logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin';
        return;
    }

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin';
    });

    // Elements
    const bannerText = document.getElementById('banner-text');
    const bannerSpeed = document.getElementById('banner-speed');
    const bannerToggle = document.getElementById('banner-toggle');
    const bannerBtnText = document.getElementById('banner-btn-text');
    const bannerBtnUrl = document.getElementById('banner-btn-url');
    const saveBannerBtn = document.getElementById('save-banner');
    const bannerStatus = document.getElementById('banner-status');
    const heroVideoUrl = document.getElementById('hero-video-url');
    const saveHeroVideoBtn = document.getElementById('save-hero-video');
    const heroVideoStatus = document.getElementById('hero-video-status');
    const deployToggle = document.getElementById('deploy-toggle');
    const maintenanceToggle = document.getElementById('maintenance-toggle');
    const saveSystemSettingsBtn = document.getElementById('save-system-settings');
    const systemSettingsStatus = document.getElementById('system-settings-status');
    const restartServerBtn = document.getElementById('restart-server-btn');
    const restartStatus = document.getElementById('restart-status');

    // Promo Popup Elements
    const popupToggle = document.getElementById('popup-toggle');
    const popupDesktopFile = document.getElementById('popup-desktop-file');
    const popupMobileFile = document.getElementById('popup-mobile-file');
    const popupDesktopPreview = document.getElementById('popup-desktop-preview');
    const popupDesktopPlaceholder = document.getElementById('popup-desktop-placeholder');
    const popupMobilePreview = document.getElementById('popup-mobile-preview');
    const popupMobilePlaceholder = document.getElementById('popup-mobile-placeholder');
    const popupLinkUrl = document.getElementById('popup-link-url');
    const popupDelay = document.getElementById('popup-delay');
    const savePopupForm = document.getElementById('save-popup-form');
    const deletePopupBtn = document.getElementById('delete-popup-btn');
    const popupStatus = document.getElementById('popup-status');

    // Scrollspy for Sidebar (Highlight active section)
    const mainContent = document.querySelector('main');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sections = document.querySelectorAll('section[id]');

    if (mainContent && sidebarLinks.length > 0 && sections.length > 0) {
        mainContent.addEventListener('scroll', () => {
            let currentSectionId = '';
            
            // Check if we are scrolled to the very bottom
            const isAtBottom = mainContent.scrollTop + mainContent.clientHeight >= mainContent.scrollHeight - 20;

            if (isAtBottom) {
                currentSectionId = sections[sections.length - 1].getAttribute('id');
            } else {
                sections.forEach(section => {
                    const sectionTop = section.offsetTop;
                    if (mainContent.scrollTop >= (sectionTop - 150)) {
                        currentSectionId = section.getAttribute('id');
                    }
                });
            }

            if (currentSectionId) {
                sidebarLinks.forEach(link => {
                    link.classList.remove('active', 'bg-surface-container-highest/50', 'text-secondary');
                    link.classList.add('text-on-surface-variant');
                    
                    const href = link.getAttribute('href');
                    if (href && href.includes(currentSectionId)) {
                        link.classList.add('active', 'bg-surface-container-highest/50', 'text-secondary');
                        link.classList.remove('text-on-surface-variant');
                    }
                });
            }
        });
    }

    // Fetch initial settings
    try {
        const response = await fetch('/api/settings');
        const settings = await response.json();
        
        if (bannerText && settings.banner_text) {
            bannerText.value = settings.banner_text;
        }
        if (bannerSpeed && settings.banner_speed) {
            bannerSpeed.value = settings.banner_speed;
        }
        if (bannerToggle && settings.banner_active === '1') {
            bannerToggle.checked = true;
        }
        if (bannerBtnText && settings.banner_btn_text !== undefined) {
            bannerBtnText.value = settings.banner_btn_text;
        }
        if (bannerBtnUrl && settings.banner_btn_url !== undefined) {
            bannerBtnUrl.value = settings.banner_btn_url;
        }
        if (heroVideoUrl && settings.hero_video_url) {
            heroVideoUrl.value = settings.hero_video_url;
        }
        if (deployToggle) {
            deployToggle.checked = settings.site_deployed !== '0';
        }
        if (maintenanceToggle) {
            maintenanceToggle.checked = settings.maintenance_mode === '1';
        }

        // Load Popup settings
        if (popupToggle) {
            popupToggle.checked = settings.popup_enabled === '1';
        }
        if (popupLinkUrl && settings.popup_link_url !== undefined) {
            popupLinkUrl.value = settings.popup_link_url;
        }
        if (popupDelay && settings.popup_delay !== undefined) {
            popupDelay.value = settings.popup_delay;
        }
        if (popupDesktopPreview && settings.popup_desktop_image) {
            popupDesktopPreview.src = settings.popup_desktop_image;
            popupDesktopPreview.classList.remove('hidden');
            if (popupDesktopPlaceholder) popupDesktopPlaceholder.classList.add('hidden');
        }
        if (popupMobilePreview && settings.popup_mobile_image) {
            popupMobilePreview.src = settings.popup_mobile_image;
            popupMobilePreview.classList.remove('hidden');
            if (popupMobilePlaceholder) popupMobilePlaceholder.classList.add('hidden');
        }
    } catch (error) {
        console.error('Failed to load settings', error);
    }

    if (saveBannerBtn) {
        saveBannerBtn.addEventListener('click', async () => {
            const text = bannerText.value;
            const speed = bannerSpeed.value || '120';
            const active = bannerToggle.checked ? '1' : '0';
            const btnText = bannerBtnText.value.trim();
            const btnUrl = bannerBtnUrl.value.trim();

            try {
                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'banner_text', value: text })
                });

                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'banner_speed', value: speed })
                });

                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'banner_active', value: active })
                });

                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'banner_btn_text', value: btnText })
                });

                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'banner_btn_url', value: btnUrl })
                });

                // Show success message
                bannerStatus.style.opacity = '1';
                setTimeout(() => {
                    bannerStatus.style.opacity = '0';
                }, 3000);

            } catch (error) {
                console.error('Failed to save settings', error);
                alert('Failed to save settings');
            }
        });
    }

    if (saveHeroVideoBtn) {
        saveHeroVideoBtn.addEventListener('click', async () => {
            const videoUrl = heroVideoUrl.value.trim();

            try {
                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'hero_video_url', value: videoUrl })
                });

                heroVideoStatus.style.opacity = '1';
                setTimeout(() => {
                    heroVideoStatus.style.opacity = '0';
                }, 3000);
            } catch (error) {
                console.error('Failed to save hero video URL', error);
                alert('Failed to save video link');
            }
        });
    }

    if (saveSystemSettingsBtn) {
        saveSystemSettingsBtn.addEventListener('click', async () => {
            const siteDeployed = deployToggle.checked ? '1' : '0';
            const maintenanceMode = maintenanceToggle.checked ? '1' : '0';

            try {
                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'site_deployed', value: siteDeployed })
                });

                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'maintenance_mode', value: maintenanceMode })
                });

                systemSettingsStatus.style.opacity = '1';
                setTimeout(() => {
                    systemSettingsStatus.style.opacity = '0';
                }, 3000);
            } catch (error) {
                console.error('Failed to save system settings', error);
                alert('Failed to save settings');
            }
        });
    }

    if (restartServerBtn) {
        restartServerBtn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to restart the live server? This will reload all process dependencies and configurations.')) {
                return;
            }

            try {
                restartStatus.textContent = 'Restarting...';
                restartStatus.style.opacity = '1';
                
                const response = await fetch('/api/system/restart', {
                    method: 'POST'
                });
                const result = await response.json();
                
                restartStatus.textContent = result.message || 'Restart triggered successfully!';
                
                setTimeout(() => {
                    restartStatus.style.opacity = '0';
                }, 5000);
            } catch (error) {
                console.error('Failed to trigger restart', error);
                alert('Failed to trigger server restart.');
            }
        });
    }

    // Image Preview Handlers for Promo Popup
    if (popupDesktopFile) {
        popupDesktopFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    popupDesktopPreview.src = event.target.result;
                    popupDesktopPreview.classList.remove('hidden');
                    if (popupDesktopPlaceholder) popupDesktopPlaceholder.classList.add('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (popupMobileFile) {
        popupMobileFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    popupMobilePreview.src = event.target.result;
                    popupMobilePreview.classList.remove('hidden');
                    if (popupMobilePlaceholder) popupMobilePlaceholder.classList.add('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Save Promo Popup Settings
    if (savePopupForm) {
        savePopupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const enabled = popupToggle.checked ? '1' : '0';
            const linkUrl = popupLinkUrl.value.trim();
            const delay = popupDelay.value || '3';

            try {
                // 1. Handle file uploads if any
                const formData = new FormData();
                let hasFiles = false;

                if (popupDesktopFile && popupDesktopFile.files[0]) {
                    formData.append('popup_desktop_image', popupDesktopFile.files[0]);
                    hasFiles = true;
                }
                if (popupMobileFile && popupMobileFile.files[0]) {
                    formData.append('popup_mobile_image', popupMobileFile.files[0]);
                    hasFiles = true;
                }

                if (hasFiles) {
                    const uploadResponse = await fetch('/api/settings/upload', {
                        method: 'POST',
                        body: formData
                    });
                    const uploadResult = await uploadResponse.json();
                    if (!uploadResult.success) {
                        throw new Error(uploadResult.error || 'Upload failed');
                    }
                }

                // 2. Save text settings
                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'popup_enabled', value: enabled })
                });

                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'popup_link_url', value: linkUrl })
                });

                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'popup_delay', value: delay })
                });

                // Clear files inputs so they aren't uploaded again on subsequent saves
                if (popupDesktopFile) popupDesktopFile.value = '';
                if (popupMobileFile) popupMobileFile.value = '';

                // Clear session storage to allow instant testing
                sessionStorage.removeItem('promoPopupShown');

                // Refresh previews with final paths from backend
                const refreshRes = await fetch('/api/settings');
                const updatedSettings = await refreshRes.json();
                if (popupDesktopPreview && updatedSettings.popup_desktop_image) {
                    popupDesktopPreview.src = updatedSettings.popup_desktop_image;
                    popupDesktopPreview.classList.remove('hidden');
                    if (popupDesktopPlaceholder) popupDesktopPlaceholder.classList.add('hidden');
                }
                if (popupMobilePreview && updatedSettings.popup_mobile_image) {
                    popupMobilePreview.src = updatedSettings.popup_mobile_image;
                    popupMobilePreview.classList.remove('hidden');
                    if (popupMobilePlaceholder) popupMobilePlaceholder.classList.add('hidden');
                }

                // Show success
                popupStatus.style.opacity = '1';
                setTimeout(() => {
                    popupStatus.style.opacity = '0';
                }, 3000);

            } catch (err) {
                console.error('Failed to save popup settings', err);
                alert('Failed to save popup settings: ' + err.message);
            }
        });
    }

    // Delete/Reset Promo Popup
    if (deletePopupBtn) {
        deletePopupBtn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to delete and reset the promo popup settings?')) {
                return;
            }

            try {
                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'popup_enabled', value: '0' })
                });

                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'popup_desktop_image', value: '' })
                });

                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'popup_mobile_image', value: '' })
                });

                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'popup_link_url', value: '' })
                });

                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'popup_delay', value: '3' })
                });

                // Reset UI
                popupToggle.checked = false;
                popupLinkUrl.value = '';
                popupDelay.value = '3';
                if (popupDesktopFile) popupDesktopFile.value = '';
                if (popupMobileFile) popupMobileFile.value = '';

                if (popupDesktopPreview) {
                    popupDesktopPreview.src = '';
                    popupDesktopPreview.classList.add('hidden');
                }
                if (popupDesktopPlaceholder) {
                    popupDesktopPlaceholder.classList.remove('hidden');
                }

                if (popupMobilePreview) {
                    popupMobilePreview.src = '';
                    popupMobilePreview.classList.add('hidden');
                }
                if (popupMobilePlaceholder) {
                    popupMobilePlaceholder.classList.remove('hidden');
                }

                popupStatus.textContent = 'Reset successfully!';
                popupStatus.style.opacity = '1';
                setTimeout(() => {
                    popupStatus.style.opacity = '0';
                    popupStatus.textContent = 'Saved successfully!';
                }, 3000);

            } catch (err) {
                console.error('Failed to reset popup settings', err);
                alert('Failed to reset popup settings');
            }
        });
    }

    // Reviews logic
    const reviewsList = document.getElementById('reviews-list');
    const addReviewForm = document.getElementById('add-review-form');
    const reviewFormTitle = document.getElementById('review-form-title');
    const reviewSubmitBtn = document.getElementById('review-submit-btn');
    const cancelReviewEditBtn = document.getElementById('cancel-review-edit');
    let currentReviews = [];

    const loadReviews = async () => {
        if (!reviewsList) return;
        try {
            const response = await fetch('/api/reviews');
            currentReviews = await response.json();
            reviewsList.innerHTML = '';
            currentReviews.forEach(review => {
                const div = document.createElement('div');
                div.className = 'flex items-center justify-between p-4 bg-surface-container-highest rounded-lg border border-outline-variant/30';
                div.innerHTML = `
                    <div class="flex items-center gap-4">
                        <img src="${review.image}" alt="${review.name}" class="w-12 h-12 rounded-full object-cover">
                        <div>
                            <div class="font-bold text-on-surface">${review.name} <span class="text-xs text-secondary ml-2">${review.rating} Stars</span></div>
                            <div class="text-sm text-on-surface-variant">${review.role}</div>
                            <div class="text-sm mt-1 max-w-lg truncate" title="${review.content}">${review.content}</div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="text-on-surface-variant hover:text-secondary transition-colors px-3 py-2 border border-outline-variant rounded" onclick="editReview(${review.id})">
                            <span class="material-symbols-outlined align-middle mr-1">edit</span> Edit
                        </button>
                        <button class="text-red-400 hover:text-red-300 transition-colors px-3 py-2 border border-outline-variant rounded hover:border-red-400" onclick="deleteReview(${review.id})">
                            <span class="material-symbols-outlined align-middle mr-1">delete</span> Delete
                        </button>
                    </div>
                `;
                reviewsList.appendChild(div);
            });
        } catch (error) {
            console.error('Failed to load reviews', error);
        }
    };

    const resetReviewForm = () => {
        document.getElementById('review-edit-id').value = '';
        if (addReviewForm) addReviewForm.reset();
        if (reviewFormTitle) reviewFormTitle.innerText = 'Add New Review';
        if (reviewSubmitBtn) reviewSubmitBtn.innerText = 'Add Review';
        if (cancelReviewEditBtn) cancelReviewEditBtn.classList.add('hidden');
    };

    window.editReview = (id) => {
        const review = currentReviews.find(item => Number(item.id) === Number(id));
        if (!review || !addReviewForm) return;

        document.getElementById('review-edit-id').value = review.id;
        document.getElementById('review-name').value = review.name || '';
        document.getElementById('review-role').value = review.role || '';
        document.getElementById('review-content').value = review.content || '';
        document.getElementById('review-rating').value = review.rating || 5;
        document.getElementById('review-image').value = review.image || '';
        if (reviewFormTitle) reviewFormTitle.innerText = `Edit Review: ${review.name || ''}`;
        if (reviewSubmitBtn) reviewSubmitBtn.innerText = 'Save Review';
        if (cancelReviewEditBtn) cancelReviewEditBtn.classList.remove('hidden');
        addReviewForm.scrollIntoView({ behavior: 'smooth' });
    };

    window.deleteReview = async (id) => {
        if (!confirm('Are you sure you want to delete this review?')) return;
        try {
            await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
            loadReviews();
        } catch (error) {
            console.error('Failed to delete review', error);
        }
    };

    if (cancelReviewEditBtn) {
        cancelReviewEditBtn.addEventListener('click', resetReviewForm);
    }

    if (addReviewForm) {
        addReviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const editId = document.getElementById('review-edit-id').value;
            const name = document.getElementById('review-name').value;
            const role = document.getElementById('review-role').value;
            const content = document.getElementById('review-content').value;
            const rating = document.getElementById('review-rating').value;
            const image = document.getElementById('review-image').value;

            try {
                const formData = new FormData();
                formData.append('name', name);
                formData.append('role', role);
                formData.append('content', content);
                formData.append('rating', rating);
                formData.append('image_url', image);

                await fetch(editId ? `/api/reviews/${editId}` : '/api/reviews', {
                    method: editId ? 'PUT' : 'POST',
                    body: formData
                });
                
                resetReviewForm();
                loadReviews();
            } catch (error) {
                console.error('Failed to save review', error);
            }
        });
    }

    loadReviews();



    // Pricing Management
    const pricingList = document.getElementById('pricing-list');
    const pricingEditForm = document.getElementById('pricing-edit-form');
    let currentPricingPlans = [];

    const loadPricing = async () => {
        if (!pricingList) return;
        try {
            const response = await fetch('/api/pricing');
            currentPricingPlans = await response.json();

            const groups = [
                { category: 'membership', title: 'Membership Fee' },
                { category: 'subscription', title: 'Subscription Plans' },
                { category: 'personal-training', title: 'Personal Training Plans' }
            ];

            pricingList.innerHTML = groups.map(group => {
                const plans = currentPricingPlans.filter(plan => plan.category === group.category);
                return `
                    <div class="bg-surface-container-highest/50 border border-outline-variant/30 rounded-xl p-5">
                        <div class="flex items-center justify-between mb-4">
                            <h4 class="text-secondary font-display font-bold uppercase tracking-wide">${group.title}</h4>
                            <span class="text-xs text-on-surface-variant">${plans.length} item${plans.length === 1 ? '' : 's'}</span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${plans.map(plan => {
                                const active = plan.is_active === undefined || Number(plan.is_active) === 1;
                                return `
                                    <div class="bg-surface-container-highest border ${active ? (plan.is_popular ? 'border-secondary' : 'border-outline-variant') : 'border-red-500/40 opacity-70'} rounded-lg p-5">
                                        <div class="flex items-start justify-between gap-3 mb-3">
                                            <div>
                                                <h5 class="font-bold text-lg text-on-surface">${escapeAdminHtml(plan.name)} ${plan.period ? '- ' + escapeAdminHtml(plan.period) : ''}</h5>
                                                <div class="text-xs uppercase tracking-widest ${active ? 'text-green-400' : 'text-red-400'} mt-1">${active ? 'Enabled' : 'Disabled'}</div>
                                            </div>
                                            <div class="flex flex-wrap justify-end gap-2">
                                                ${plan.is_popular ? '<span class="text-xs bg-secondary text-on-secondary font-bold px-2 py-1 rounded">POPULAR</span>' : ''}
                                                ${plan.show_home ? '<span class="text-xs bg-green-400 text-black font-bold px-2 py-1 rounded">HOME</span>' : ''}
                                            </div>
                                        </div>
                                        <div class="text-sm text-on-surface-variant mb-1">Price: â‚¹${escapeAdminHtml(plan.price || '')}</div>
                                        ${plan.cut_price ? `<div class="text-sm text-on-surface-variant mb-1">Cut Price: â‚¹${escapeAdminHtml(plan.cut_price)}</div>` : ''}
                                        <div class="text-sm text-on-surface-variant mb-4">Badge: ${escapeAdminHtml(plan.badge || 'None')}</div>
                                        <div class="flex flex-wrap gap-2">
                                            <button onclick="editPricing(${plan.id})" class="text-on-surface hover:text-secondary transition-colors px-3 py-2 border border-outline-variant rounded hover:border-secondary">
                                                <span class="material-symbols-outlined align-middle mr-1">edit</span> Edit
                                            </button>
                                            <button onclick="togglePricingActive(${plan.id})" class="${active ? 'text-red-400 hover:border-red-400' : 'text-green-400 hover:border-green-400'} transition-colors px-3 py-2 border border-outline-variant rounded">
                                                <span class="material-symbols-outlined align-middle mr-1">${active ? 'visibility_off' : 'visibility'}</span> ${active ? 'Disable' : 'Enable'}
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('') || '<p class="text-on-surface-variant italic">No plans in this section.</p>'}
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Failed to load pricing', error);
        }
    };

    window.editPricing = (id) => {
        const plan = currentPricingPlans.find(p => p.id === id);
        if (!plan) return;
        
        document.getElementById('edit-pricing-id').value = plan.id;
        document.getElementById('pricing-edit-title').innerText = `Edit Plan: ${plan.name} ${plan.period || ''}`;
        document.getElementById('edit-pricing-name').value = plan.name || '';
        document.getElementById('edit-pricing-category').value = plan.category || 'subscription';
        document.getElementById('edit-pricing-period').value = plan.period || '';
        document.getElementById('edit-pricing-price').value = plan.price || '';
        document.getElementById('edit-pricing-cut-price').value = plan.cut_price || '';
        document.getElementById('edit-pricing-badge').value = plan.badge || '';
        document.getElementById('edit-pricing-sort-order').value = plan.sort_order || 0;
        document.getElementById('edit-pricing-popular').checked = Number(plan.is_popular) === 1;
        document.getElementById('edit-pricing-show-home').checked = Number(plan.show_home) === 1;
        document.getElementById('edit-pricing-active').checked = plan.is_active === undefined || Number(plan.is_active) === 1;
        
        let features = plan.features;
        if (typeof features === 'string') {
            try { features = JSON.parse(features); } catch(e) {}
        }
        document.getElementById('edit-features').value = Array.isArray(features) ? features.join(', ') : '';
        
        pricingEditForm.classList.remove('hidden');
        pricingEditForm.scrollIntoView({ behavior: 'smooth' });
    };

    window.togglePricingActive = async (id) => {
        const plan = currentPricingPlans.find(p => p.id === id);
        if (!plan) return;

        const nextActive = !(plan.is_active === undefined || Number(plan.is_active) === 1);
        let features = plan.features;
        if (typeof features === 'string') {
            try { features = JSON.parse(features); } catch(e) { features = []; }
        }

        try {
            await fetch(`/api/pricing/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...plan,
                    is_active: nextActive ? 1 : 0,
                    features: Array.isArray(features) ? features : []
                })
            });
            loadPricing();
        } catch (error) {
            console.error('Failed to toggle pricing plan', error);
            alert('Failed to update plan visibility');
        }
    };

    const cancelPricingBtn = document.getElementById('cancel-pricing-btn');
    if (cancelPricingBtn) {
        cancelPricingBtn.addEventListener('click', () => {
            pricingEditForm.classList.add('hidden');
        });
    }

    const savePricingBtn = document.getElementById('save-pricing-btn');
    if (savePricingBtn) {
        savePricingBtn.addEventListener('click', async () => {
            const id = document.getElementById('edit-pricing-id').value;
            const name = document.getElementById('edit-pricing-name').value;
            const category = document.getElementById('edit-pricing-category').value;
            const period = document.getElementById('edit-pricing-period').value;
            const price = document.getElementById('edit-pricing-price').value;
            const cut_price = document.getElementById('edit-pricing-cut-price').value;
            const badge = document.getElementById('edit-pricing-badge').value;
            const sort_order = document.getElementById('edit-pricing-sort-order').value;
            const is_popular = document.getElementById('edit-pricing-popular').checked ? 1 : 0;
            const show_home = document.getElementById('edit-pricing-show-home').checked ? 1 : 0;
            const is_active = document.getElementById('edit-pricing-active').checked ? 1 : 0;
            const featuresText = document.getElementById('edit-features').value;
            
            const featuresArray = featuresText.split(',').map(s => s.trim()).filter(s => s);
            
            try {
                await fetch(`/api/pricing/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        category,
                        period,
                        price,
                        cut_price,
                        badge,
                        is_popular,
                        show_home,
                        is_active,
                        sort_order,
                        features: featuresArray
                    })
                });
                
                pricingEditForm.classList.add('hidden');
                loadPricing();
            } catch (error) {
                console.error('Failed to save pricing', error);
                alert('Failed to save pricing plan');
            }
        });
    }

    loadPricing();

    // Gallery Management
    const galleryList = document.getElementById('gallery-list');
    const addGalleryForm = document.getElementById('add-gallery-form');
    const galleryFormTitle = document.getElementById('gallery-form-title');
    const gallerySubmitBtn = document.getElementById('gallery-submit-btn');
    const cancelGalleryEditBtn = document.getElementById('cancel-gallery-edit');
    let currentGalleryItems = [];

    window.toggleGalleryInputs = () => {
        const type = document.getElementById('gallery-type').value;
        document.getElementById('gallery-input-file').style.display = 'none';
        document.getElementById('gallery-input-url').style.display = 'none';
        document.getElementById('gallery-input-text').style.display = 'none';
        
        if (type === 'image_upload') {
            document.getElementById('gallery-input-file').style.display = 'block';
        } else if (type === 'text') {
            document.getElementById('gallery-input-text').style.display = 'block';
        } else {
            document.getElementById('gallery-input-url').style.display = 'block';
        }
    };

    const loadGallery = async () => {
        if (!galleryList) return;
        try {
            const res = await fetch('/api/gallery');
            currentGalleryItems = await res.json();
            
            galleryList.innerHTML = currentGalleryItems.map(item => `
                <div class="bg-background border border-outline-variant rounded-lg p-4 flex items-center justify-between">
                    <div class="flex items-center gap-4 flex-1">
                        <div class="w-16 h-16 rounded overflow-hidden bg-surface-container flex-shrink-0 flex items-center justify-center">
                            ${item.type === 'image' ? `<img src="${item.content}" class="w-full h-full object-cover">` : 
                              item.type === 'youtube' ? `<span class="material-symbols-outlined">play_circle</span>` : 
                              item.type === 'instagram' ? `<span class="material-symbols-outlined">camera_alt</span>` : 
                              `<span class="material-symbols-outlined">notes</span>`}
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold truncate text-on-surface">${item.title || '(No Title)'}</h4>
                            <div class="text-xs text-on-surface-variant flex gap-4 mt-1">
                                <span class="bg-surface-container px-2 py-0.5 rounded uppercase">${item.type}</span>
                                <span>${item.grid_column} x ${item.grid_row}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2 ml-4 shrink-0">
                        <button onclick="editGalleryItem(${item.id})" class="text-on-surface-variant hover:text-secondary transition-colors px-3 py-2 border border-outline-variant rounded hover:border-secondary">
                            <span class="material-symbols-outlined align-middle mr-1">edit</span> Edit
                        </button>
                        <button onclick="deleteGalleryItem(${item.id})" class="text-on-surface-variant hover:text-red-400 transition-colors px-3 py-2 border border-outline-variant rounded hover:border-red-400">
                            <span class="material-symbols-outlined align-middle mr-1">delete</span> Delete
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load gallery', error);
        }
    };

    const resetGalleryForm = () => {
        document.getElementById('gallery-edit-id').value = '';
        if (addGalleryForm) addGalleryForm.reset();
        if (galleryFormTitle) galleryFormTitle.innerText = 'Add New Gallery Item';
        if (gallerySubmitBtn) gallerySubmitBtn.innerText = 'Add to Grid';
        if (cancelGalleryEditBtn) cancelGalleryEditBtn.classList.add('hidden');
        toggleGalleryInputs();
    };

    window.editGalleryItem = (id) => {
        const item = currentGalleryItems.find(galleryItem => Number(galleryItem.id) === Number(id));
        if (!item || !addGalleryForm) return;

        document.getElementById('gallery-edit-id').value = item.id;
        document.getElementById('gallery-type').value = item.type || 'image';
        document.getElementById('gallery-size').value = `${item.grid_column || 'span 1'},${item.grid_row || 'span 1'}`;
        document.getElementById('gallery-title').value = item.title || '';
        document.getElementById('gallery-file').value = '';
        document.getElementById('gallery-url').value = item.type === 'text' ? '' : (item.content || '');
        document.getElementById('gallery-text').value = item.type === 'text' ? (item.content || '') : '';
        if (galleryFormTitle) galleryFormTitle.innerText = `Edit Gallery Item: ${item.title || item.type || ''}`;
        if (gallerySubmitBtn) gallerySubmitBtn.innerText = 'Save Gallery Item';
        if (cancelGalleryEditBtn) cancelGalleryEditBtn.classList.remove('hidden');
        toggleGalleryInputs();
        addGalleryForm.scrollIntoView({ behavior: 'smooth' });
    };

    window.deleteGalleryItem = async (id) => {
        try {
            await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
            loadGallery();
        } catch (error) {
            console.error('Failed to delete gallery item', error);
        }
    };

    if (cancelGalleryEditBtn) {
        cancelGalleryEditBtn.addEventListener('click', resetGalleryForm);
    }

    if (addGalleryForm) {
        addGalleryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const editId = document.getElementById('gallery-edit-id').value;
            const typeSelect = document.getElementById('gallery-type').value;
            const sizeValue = document.getElementById('gallery-size').value;
            const title = document.getElementById('gallery-title').value;
            
            const [gridCol, gridRow] = sizeValue.split(',');
            let actualType = typeSelect;
            let content = '';
            
            const formData = new FormData();
            formData.append('title', title);
            formData.append('grid_column', gridCol);
            formData.append('grid_row', gridRow);
            
            if (typeSelect === 'image_upload') {
                actualType = 'image';
                const file = document.getElementById('gallery-file').files[0];
                if (file) {
                    if (file.size > 1024 * 1024) {
                        alert('Image file size must be less than 1MB.');
                        return;
                    }
                    formData.append('image', file);
                } else if (editId) {
                    const existingItem = currentGalleryItems.find(item => Number(item.id) === Number(editId));
                    content = existingItem?.content || '';
                }
            } else if (typeSelect === 'text') {
                content = document.getElementById('gallery-text').value;
            } else {
                content = document.getElementById('gallery-url').value;
            }
            
            formData.append('type', actualType);
            formData.append('content', content);

            try {
                await fetch(editId ? `/api/gallery/${editId}` : '/api/gallery', {
                    method: editId ? 'PUT' : 'POST',
                    body: formData
                });
                
                resetGalleryForm();
                loadGallery();
            } catch (error) {
                console.error('Failed to save gallery item', error);
            }
        });
    }

    loadGallery();

    // About Carousel Management
    const aboutImagesList = document.getElementById('about-images-list');
    const addAboutImageForm = document.getElementById('add-about-image-form');

    const loadAboutImages = async () => {
        if (!aboutImagesList) return;
        try {
            const res = await fetch('/api/about_images');
            const images = await res.json();
            aboutImagesList.innerHTML = images.length === 0 ? '<p class="text-on-surface-variant italic col-span-full">No images yet.</p>' : images.map(img => `
                <div class="relative group rounded-lg overflow-hidden border border-outline-variant/30 aspect-square">
                    <img src="${img.image_url}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="deleteAboutImage(${img.id})" class="bg-red-500/80 text-white p-2 rounded-full hover:bg-red-500 transition-colors">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load about images', error);
        }
    };

    window.deleteAboutImage = async (id) => {
        if (!confirm('Delete this image?')) return;
        try {
            await fetch(`/api/about_images/${id}`, { method: 'DELETE' });
            loadAboutImages();
        } catch (error) {
            console.error('Failed to delete about image', error);
        }
    };

    if (addAboutImageForm) {
        addAboutImageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const imageUrl = document.getElementById('about-image-url').value;
            const file = document.getElementById('about-image-file').files[0];

            if (file && file.size > 1024 * 1024) {
                alert('Image file size must be less than 1MB.');
                return;
            }

            const formData = new FormData();
            if (imageUrl) formData.append('image_url', imageUrl);
            if (file) formData.append('image', file);

            try {
                await fetch('/api/about_images', {
                    method: 'POST',
                    body: formData
                });
                addAboutImageForm.reset();
                loadAboutImages();
            } catch (error) {
                console.error('Failed to add about image', error);
            }
        });
    }

    loadAboutImages();

    // Trainers Management
    const trainersList = document.getElementById('trainers-list');
    const addTrainerForm = document.getElementById('add-trainer-form');
    const trainerFormTitle = document.getElementById('trainer-form-title');
    const trainerSubmitBtn = document.getElementById('trainer-submit-btn');
    const cancelTrainerEditBtn = document.getElementById('cancel-trainer-edit');
    let currentTrainers = [];

    const loadTrainers = async () => {
        if (!trainersList) return;
        try {
            const res = await fetch('/api/trainers');
            currentTrainers = await res.json();
            trainersList.innerHTML = currentTrainers.length === 0 ? '<p class="text-on-surface-variant italic">No trainers yet.</p>' : currentTrainers.map(t => `
                <div class="bg-surface-container-highest border border-outline-variant rounded-lg p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div class="flex items-center gap-4">
                        <img src="${t.image_url}" alt="${t.name}" class="w-16 h-16 rounded-lg object-cover bg-surface-container">
                        <div>
                            <h4 class="font-bold text-lg text-secondary">${t.name}</h4>
                            <div class="text-sm text-on-surface-variant">${t.role}</div>
                            <div class="text-xs text-on-surface-variant mt-1">Delay: ${t.delay}</div>
                        </div>
                    </div>
                    <div class="flex gap-2 mt-4 md:mt-0">
                        <button onclick="editTrainer(${t.id})" class="text-on-surface-variant hover:text-secondary transition-colors px-4 py-2 border border-outline-variant rounded hover:border-secondary">
                            <span class="material-symbols-outlined align-middle mr-1">edit</span> Edit
                        </button>
                        <button onclick="deleteTrainer(${t.id})" class="text-on-surface-variant hover:text-red-400 transition-colors px-4 py-2 border border-outline-variant rounded hover:border-red-400">
                            <span class="material-symbols-outlined align-middle mr-1">delete</span> Delete
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load trainers', error);
        }
    };

    const resetTrainerForm = () => {
        document.getElementById('trainer-edit-id').value = '';
        if (addTrainerForm) addTrainerForm.reset();
        if (trainerFormTitle) trainerFormTitle.innerText = 'Add New Trainer';
        if (trainerSubmitBtn) trainerSubmitBtn.innerText = 'Add Trainer';
        if (cancelTrainerEditBtn) cancelTrainerEditBtn.classList.add('hidden');
    };

    window.editTrainer = (id) => {
        const trainer = currentTrainers.find(item => Number(item.id) === Number(id));
        if (!trainer || !addTrainerForm) return;

        document.getElementById('trainer-edit-id').value = trainer.id;
        document.getElementById('trainer-name').value = trainer.name || '';
        document.getElementById('trainer-role').value = trainer.role || '';
        document.getElementById('trainer-image-url').value = trainer.image_url || '';
        document.getElementById('trainer-file').value = '';
        document.getElementById('trainer-delay').value = trainer.delay || '0s';
        if (trainerFormTitle) trainerFormTitle.innerText = `Edit Trainer: ${trainer.name || ''}`;
        if (trainerSubmitBtn) trainerSubmitBtn.innerText = 'Save Trainer';
        if (cancelTrainerEditBtn) cancelTrainerEditBtn.classList.remove('hidden');
        addTrainerForm.scrollIntoView({ behavior: 'smooth' });
    };

    window.deleteTrainer = async (id) => {
        if (!confirm('Delete this trainer?')) return;
        try {
            await fetch(`/api/trainers/${id}`, { method: 'DELETE' });
            loadTrainers();
        } catch (error) {
            console.error('Failed to delete trainer', error);
        }
    };

    if (cancelTrainerEditBtn) {
        cancelTrainerEditBtn.addEventListener('click', resetTrainerForm);
    }

    if (addTrainerForm) {
        addTrainerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const editId = document.getElementById('trainer-edit-id').value;
            const name = document.getElementById('trainer-name').value;
            const role = document.getElementById('trainer-role').value;
            const imageUrl = document.getElementById('trainer-image-url').value;
            const file = document.getElementById('trainer-file').files[0];
            const delay = document.getElementById('trainer-delay').value;

            if (file && file.size > 1024 * 1024) {
                alert('Image file size must be less than 1MB.');
                return;
            }

            const formData = new FormData();
            formData.append('name', name);
            formData.append('role', role);
            if (imageUrl) formData.append('image_url', imageUrl);
            if (file) formData.append('image', file);
            if (delay) formData.append('delay', delay);

            try {
                await fetch(editId ? `/api/trainers/${editId}` : '/api/trainers', {
                    method: editId ? 'PUT' : 'POST',
                    body: formData
                });
                resetTrainerForm();
                loadTrainers();
            } catch (error) {
                console.error('Failed to save trainer', error);
            }
        });
    }

    loadTrainers();

    // Contacts Management & Notifications
    const contactsList = document.getElementById('contacts-list');
    const contactNotification = document.getElementById('contact-notification');
    let lastContactCount = -1;

    const loadContacts = async () => {
        if (!contactsList) return;
        try {
            const res = await fetch('/api/contacts');
            const contacts = await res.json();
            
            // Notification Logic
            if (lastContactCount !== -1 && contacts.length > lastContactCount) {
                const newContact = contacts[0]; // assuming sorted by newest first
                if (contactNotification) {
                    contactNotification.innerText = `New application from ${newContact.name}!`;
                    contactNotification.classList.remove('hidden');
                    setTimeout(() => {
                        contactNotification.classList.add('hidden');
                    }, 5000);
                }
            }
            lastContactCount = contacts.length;
            
            contactsList.innerHTML = contacts.length === 0 ? '<p class="text-on-surface-variant italic">No applications yet.</p>' : contacts.map(c => `
                <div class="bg-surface-container-highest border border-outline-variant rounded-lg p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                        <h4 class="font-bold text-lg text-secondary">${escapeAdminHtml(c.name)}</h4>
                        <div class="text-sm text-on-surface-variant flex gap-4 mt-1">
                            <span><span class="material-symbols-outlined text-[16px] align-middle mr-1">mail</span>${escapeAdminHtml(c.email)}</span>
                            <span><span class="material-symbols-outlined text-[16px] align-middle mr-1">call</span>${escapeAdminHtml(c.phone)}</span>
                        </div>
                        <div class="mt-4 text-on-surface p-4 bg-background rounded border border-outline-variant/30">
                            "${escapeAdminHtml(c.message)}"
                        </div>
                        <div class="text-xs text-on-surface-variant mt-2">Application Time: ${formatAdminTime(c.created_at)}</div>
                    </div>
                    <button onclick="deleteContact(${c.id})" class="text-on-surface-variant hover:text-red-400 transition-colors mt-4 md:mt-0 px-4 py-2 border border-outline-variant rounded hover:border-red-400">
                        <span class="material-symbols-outlined align-middle mr-1">delete</span> Delete
                    </button>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Failed to load contacts', error);
        }
    };

    window.deleteContact = async (id) => {
        if(!confirm('Delete this application?')) return;
        try {
            await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
            // reduce count so it doesn't trigger notification
            lastContactCount--;
            loadContacts();
        } catch (error) {
            console.error('Failed to delete contact', error);
        }
    };

    loadContacts();
    // Poll for new contacts every 10 seconds
    setInterval(loadContacts, 10000);

    // Payment Requests Management & Notifications
    const paymentRequestsList = document.getElementById('payment-requests-list');
    const paymentNotification = document.getElementById('payment-notification');
    let lastPaymentRequestCount = -1;
    let adminPaymentRequests = [];
    const getAdminReceiptHtml = (request, includeActions = true) => `
        <div class="bg-background border border-secondary/40 rounded-xl p-6 text-on-surface shadow-2xl">
            <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-outline-variant/60 pb-5 mb-5">
                <div>
                    <div class="text-secondary text-xs font-bold uppercase tracking-[0.18em] mb-2">THE DREAM GYM</div>
                    <h3 class="font-display text-3xl font-bold uppercase">Payment Receipt</h3>
                    <p class="text-on-surface-variant text-sm mt-2">Keep this transaction ID for your records.</p>
                </div>
                <span class="self-start text-xs bg-green-500/15 border border-green-500/50 text-green-300 font-bold uppercase tracking-widest px-3 py-2 rounded-full">${escapeAdminHtml(request.status || 'PENDING')}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="bg-surface-container-highest border border-outline-variant/60 rounded-lg p-4"><div class="text-[11px] text-on-surface-variant uppercase tracking-widest mb-1">Name</div><strong>${escapeAdminHtml(request.name)}</strong></div>
                <div class="bg-surface-container-highest border border-outline-variant/60 rounded-lg p-4"><div class="text-[11px] text-on-surface-variant uppercase tracking-widest mb-1">Transaction ID</div><strong class="break-all">${escapeAdminHtml(request.razorpay_payment_id || 'Not paid yet')}</strong></div>
                <div class="bg-surface-container-highest border border-outline-variant/60 rounded-lg p-4"><div class="text-[11px] text-on-surface-variant uppercase tracking-widest mb-1">Plan</div><strong>${escapeAdminHtml(request.plan_name)} (${escapeAdminHtml(request.billing_cycle)})</strong></div>
                <div class="bg-surface-container-highest border border-outline-variant/60 rounded-lg p-4"><div class="text-[11px] text-on-surface-variant uppercase tracking-widest mb-1">Amount</div><strong>â‚¹${escapeAdminHtml(request.amount)}</strong></div>
                <div class="bg-surface-container-highest border border-outline-variant/60 rounded-lg p-4"><div class="text-[11px] text-on-surface-variant uppercase tracking-widest mb-1">Payment Time</div><strong>${formatAdminTime(request.paid_at)}</strong></div>
                <div class="bg-surface-container-highest border border-outline-variant/60 rounded-lg p-4"><div class="text-[11px] text-on-surface-variant uppercase tracking-widest mb-1">Order ID</div><strong class="break-all">${escapeAdminHtml(request.razorpay_order_id || 'Not created in demo mode')}</strong></div>
            </div>
            ${includeActions ? `
                <div class="flex flex-col sm:flex-row gap-3 mt-6">
                    <button onclick="printAdminPaymentReceipt()" class="flex-1 bg-secondary text-on-secondary font-bold uppercase tracking-widest px-4 py-3 rounded-lg">Print Receipt</button>
                    <button onclick="closeAdminPaymentReceipt()" class="flex-1 border border-outline-variant text-on-surface font-bold uppercase tracking-widest px-4 py-3 rounded-lg">Close</button>
                </div>
            ` : ''}
        </div>
    `;
    const ensureAdminReceiptModal = () => {
        let modal = document.getElementById('admin-payment-receipt-modal');
        if (modal) return modal;

        modal = document.createElement('div');
        modal.id = 'admin-payment-receipt-modal';
        modal.className = 'hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm items-center justify-center p-4';
        modal.innerHTML = '<div id="admin-payment-receipt-content" class="w-full max-w-3xl"></div>';
        document.body.appendChild(modal);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) window.closeAdminPaymentReceipt();
        });
        return modal;
    };

    const loadPaymentRequests = async () => {
        if (!paymentRequestsList) return;
        try {
            const res = await fetch('/api/payment-requests');
            const paymentRequests = await res.json();
            adminPaymentRequests = paymentRequests;

            if (lastPaymentRequestCount !== -1 && paymentRequests.length > lastPaymentRequestCount) {
                const newest = paymentRequests[0];
                if (paymentNotification) {
                    paymentNotification.innerText = `New payment request from ${newest.name}!`;
                    paymentNotification.classList.remove('hidden');
                    setTimeout(() => {
                        paymentNotification.classList.add('hidden');
                    }, 5000);
                }
            }
            lastPaymentRequestCount = paymentRequests.length;

            paymentRequestsList.innerHTML = paymentRequests.length === 0 ? '<p class="text-on-surface-variant italic">No payment requests yet.</p>' : paymentRequests.map(request => `
                <div class="bg-surface-container-highest border border-outline-variant rounded-lg p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                        <div class="flex items-center gap-3 flex-wrap">
                            <h4 class="font-bold text-lg text-secondary">${escapeAdminHtml(request.plan_name)}</h4>
                            <span class="text-xs bg-background border border-outline-variant text-on-surface-variant px-3 py-1 rounded-full uppercase">${escapeAdminHtml(request.billing_cycle)}</span>
                            <span class="text-xs bg-secondary text-on-secondary font-bold px-3 py-1 rounded-full uppercase">${escapeAdminHtml(request.status)}</span>
                        </div>
                        <div class="text-3xl font-display font-bold mt-3">â‚¹${escapeAdminHtml(request.amount)}</div>
                        <div class="text-sm text-on-surface-variant flex flex-col md:flex-row gap-2 md:gap-4 mt-3">
                            <span><span class="material-symbols-outlined text-[16px] align-middle mr-1">person</span>${escapeAdminHtml(request.name)}</span>
                            <span><span class="material-symbols-outlined text-[16px] align-middle mr-1">mail</span>${escapeAdminHtml(request.email)}</span>
                            <span><span class="material-symbols-outlined text-[16px] align-middle mr-1">call</span>${escapeAdminHtml(request.phone)}</span>
                        </div>
                        ${request.razorpay_payment_id ? `<div class="text-xs text-secondary mt-3">Razorpay Payment ID: ${escapeAdminHtml(request.razorpay_payment_id)}</div>` : ''}
                        ${request.razorpay_order_id ? `<div class="text-xs text-on-surface-variant mt-1">Razorpay Order ID: ${escapeAdminHtml(request.razorpay_order_id)}</div>` : ''}
                        ${request.paid_at ? `<div class="text-xs text-green-400 mt-2">Payment Time: ${formatAdminTime(request.paid_at)}</div>` : ''}
                        <div class="text-xs text-on-surface-variant mt-3">Request Time: ${formatAdminTime(request.created_at)}</div>
                    </div>
                    <div class="flex flex-col sm:flex-row md:flex-col gap-2 mt-4 md:mt-0">
                        <button onclick="showAdminPaymentReceipt(${request.id})" ${request.razorpay_payment_id ? '' : 'disabled'} class="text-on-surface hover:text-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-4 py-2 border border-outline-variant rounded hover:border-secondary">
                            <span class="material-symbols-outlined align-middle mr-1">receipt_long</span> Receipt
                        </button>
                        ${request.razorpay_order_id && !request.razorpay_payment_id ? `
                            <button onclick="syncPaymentRequest(${request.id})" class="text-on-surface hover:text-secondary transition-colors px-4 py-2 border border-outline-variant rounded hover:border-secondary">
                                <span class="material-symbols-outlined align-middle mr-1">sync</span> Sync Payment
                            </button>
                        ` : ''}
                        <button onclick="deletePaymentRequest(${request.id})" class="text-on-surface-variant hover:text-red-400 transition-colors px-4 py-2 border border-outline-variant rounded hover:border-red-400">
                            <span class="material-symbols-outlined align-middle mr-1">delete</span> Delete
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load payment requests', error);
        }
    };

    window.deletePaymentRequest = async (id) => {
        if (!confirm('Delete this payment request?')) return;
        try {
            await fetch(`/api/payment-requests/${id}`, { method: 'DELETE' });
            lastPaymentRequestCount--;
            loadPaymentRequests();
        } catch (error) {
            console.error('Failed to delete payment request', error);
        }
    };

    window.syncPaymentRequest = async (id) => {
        try {
            const res = await fetch(`/api/payment-requests/${id}/sync`, { method: 'POST' });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Payment sync failed');

            alert(result.already_paid ? 'Payment is already marked as paid.' : 'Payment synced successfully.');
            loadPaymentRequests();
        } catch (error) {
            alert(error.message || 'No captured payment found for this order yet.');
            console.error('Failed to sync payment request', error);
        }
    };

    window.showAdminPaymentReceipt = (id) => {
        const request = adminPaymentRequests.find(item => Number(item.id) === Number(id));
        if (!request) return;
        const modal = ensureAdminReceiptModal();
        document.getElementById('admin-payment-receipt-content').innerHTML = getAdminReceiptHtml(request);
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    };

    window.closeAdminPaymentReceipt = () => {
        const modal = document.getElementById('admin-payment-receipt-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
    };

    window.printAdminPaymentReceipt = () => {
        const content = document.getElementById('admin-payment-receipt-content');
        if (!content) return;
        const frame = document.createElement('iframe');
        frame.style.position = 'fixed';
        frame.style.width = '0';
        frame.style.height = '0';
        frame.style.border = '0';
        document.body.appendChild(frame);

        const doc = frame.contentWindow.document;
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>The Dream Gym Payment Receipt</title>
                <style>
                    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    @page { size: A4; margin: 16mm; }
                    body { margin: 0; min-height: 100vh; background: #15130a; color: #e8e2d1; font-family: Arial, Helvetica, sans-serif; display: flex; align-items: center; justify-content: center; }
                    .print-wrap { width: min(100%, 720px); padding: 28px; background: #15130a; border: 1px solid rgba(230, 208, 45, 0.4); border-radius: 18px; }
                    .bg-background { background: #15130a; }
                    .bg-surface-container-highest { background: #373529; }
                    .border { border-style: solid; border-width: 1px; }
                    .border-secondary\\/40, .border-outline-variant\\/60 { border-color: rgba(230, 208, 45, 0.35); }
                    .rounded-xl, .rounded-lg { border-radius: 12px; }
                    .p-6 { padding: 24px; }
                    .p-4 { padding: 16px; }
                    .text-on-surface { color: #e8e2d1; }
                    .text-on-surface-variant { color: #cdc7ad; }
                    .text-secondary { color: #e6d02d; }
                    .text-green-300 { color: #8ee59a; }
                    .text-xs { font-size: 12px; }
                    .text-sm { font-size: 14px; }
                    .text-3xl { font-size: 32px; }
                    .font-bold { font-weight: 700; }
                    .uppercase { text-transform: uppercase; }
                    .tracking-widest, .tracking-\\[0\\.18em\\] { letter-spacing: 0.14em; }
                    .mb-1 { margin-bottom: 4px; }
                    .mb-2 { margin-bottom: 8px; }
                    .mb-5 { margin-bottom: 20px; }
                    .mt-2 { margin-top: 8px; }
                    .pb-5 { padding-bottom: 20px; }
                    .gap-3 { gap: 12px; }
                    .gap-4 { gap: 16px; }
                    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
                    .flex { display: flex; }
                    .justify-between { justify-content: space-between; }
                    .break-all { word-break: break-all; }
                    button, .mt-6 { display: none !important; }
                </style>
            </head>
            <body><main class="print-wrap">${content.innerHTML}</main></body>
            </html>
        `);
        doc.close();
        setTimeout(() => {
            frame.contentWindow.focus();
            frame.contentWindow.print();
            setTimeout(() => frame.remove(), 1000);
        }, 150);
    };

    loadPaymentRequests();
    setInterval(loadPaymentRequests, 10000);
});
