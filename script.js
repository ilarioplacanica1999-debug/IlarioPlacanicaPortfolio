(() => {
    const body = document.body;

    const ui = {
        menuToggle: document.querySelector('.menu-toggle'),
        siteNav: document.querySelector('.site-nav'),
        revealItems: [...document.querySelectorAll('.reveal')],
        indexItems: [...document.querySelectorAll('.project-index-item')],
        previewContainer: document.querySelector('.project-index-preview'),
        previewImage: document.getElementById('index-preview-image'),
        previewVideo: document.getElementById('index-preview-video'),
        previewVideoSource: document.querySelector('#index-preview-video source'),
        lightbox: document.getElementById('lightbox'),
        lightboxStage: document.getElementById('lightbox-stage'),
        lightboxCaption: document.getElementById('lightbox-caption'),
        lightboxClose: document.querySelector('.lightbox-close'),
        lightboxTriggers: [...document.querySelectorAll('.js-open-lightbox')]
    };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const previewState = {
        type: '',
        src: ''
    };

    function setMenuState(isOpen) {
        if (!ui.menuToggle) return;
        body.classList.toggle('menu-open', isOpen);
        ui.menuToggle.setAttribute('aria-expanded', String(isOpen));
    }

    function initMenu() {
        if (!ui.menuToggle) return;

        ui.menuToggle.addEventListener('click', () => {
            const expanded = ui.menuToggle.getAttribute('aria-expanded') === 'true';
            setMenuState(!expanded);
        });

        ui.siteNav?.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => setMenuState(false));
        });
    }

    function initRevealObserver() {
        if (!ui.revealItems.length) return;

        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            ui.revealItems.forEach((item) => item.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver(
            (entries, currentObserver) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-visible');
                    currentObserver.unobserve(entry.target);
                });
            },
            {
                threshold: 0.16,
                rootMargin: '0px 0px -6% 0px'
            }
        );

        ui.revealItems.forEach((item) => observer.observe(item));
    }

    function stopPreviewVideo() {
        if (!ui.previewVideo) return;
        ui.previewVideo.pause();
    }

    function playPreviewVideo() {
        if (!ui.previewVideo || prefersReducedMotion) return;
        const playPromise = ui.previewVideo.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => { });
        }
    }

    function setProjectIndexPreview(type, src, poster = '') {
        const { previewContainer, previewImage, previewVideo, previewVideoSource } = ui;
        if (!previewContainer || !previewImage || !previewVideo || !previewVideoSource || !src) return;

        if (
            previewState.type === type &&
            previewState.src === src &&
            previewVideo.getAttribute('poster') === (poster || previewVideo.getAttribute('poster'))
        ) {
            return;
        }

        const isVideo = type === 'video';
        previewContainer.classList.toggle('is-image', !isVideo);

        if (isVideo) {
            stopPreviewVideo();

            if (poster) {
                previewVideo.setAttribute('poster', poster);
            }

            if (previewVideoSource.getAttribute('src') !== src) {
                previewVideoSource.setAttribute('src', src);
                previewVideo.load();
            }

            previewVideo.currentTime = 0;
            playPreviewVideo();
        } else {
            if (previewImage.getAttribute('src') !== src) {
                previewImage.setAttribute('src', src);
            }
            stopPreviewVideo();
        }

        previewState.type = type;
        previewState.src = src;
    }

    function activateIndexItem(item) {
        if (!item) return;

        ui.indexItems.forEach((entry) => entry.classList.remove('is-active'));
        item.classList.add('is-active');

        setProjectIndexPreview(
            item.dataset.previewType || 'image',
            item.dataset.previewSrc || '',
            item.dataset.previewPoster || ''
        );
    }

    function initProjectIndex() {
        if (!ui.indexItems.length) return;

        const initialItem =
            ui.indexItems.find((item) => item.classList.contains('is-active')) || ui.indexItems[0];

        activateIndexItem(initialItem);

        ui.indexItems.forEach((item) => {
            const activate = () => activateIndexItem(item);
            item.addEventListener('mouseenter', activate);
            item.addEventListener('focus', activate);
            item.addEventListener('touchstart', activate, { passive: true });
        });
    }

    let lightboxItems = [];
    let lightboxIndex = -1;

    function clearLightboxStage() {
        if (!ui.lightboxStage) return;

        const activeMedia = ui.lightboxStage.querySelector('video, iframe');
        if (activeMedia) {
            if (activeMedia.tagName === 'VIDEO') {
                activeMedia.pause();
                activeMedia.removeAttribute('src');
                activeMedia.load();
            }

            if (activeMedia.tagName === 'IFRAME') {
                activeMedia.setAttribute('src', 'about:blank');
            }
        }

        ui.lightboxStage.querySelectorAll('img, video, iframe').forEach((node) => node.remove());
    }

    function createLightboxMedia(type, src, caption) {
        let mediaNode;

        if (type === 'video') {
            mediaNode = document.createElement('video');
            mediaNode.controls = true;
            mediaNode.autoplay = !prefersReducedMotion;
            mediaNode.loop = true;
            mediaNode.playsInline = true;
            mediaNode.preload = 'metadata';
            mediaNode.src = src;
        } else if (type === 'tour') {
            mediaNode = document.createElement('iframe');
            mediaNode.src = src;
            mediaNode.loading = 'lazy';
            mediaNode.allow = 'fullscreen';
            mediaNode.title = caption || 'Interactive tour';
        } else {
            mediaNode = document.createElement('img');
            mediaNode.src = src;
            mediaNode.alt = caption || 'Portfolio media';
            mediaNode.loading = 'eager';
        }

        return mediaNode;
    }

    function updateLightboxNav() {
        const prevButton = document.querySelector('.lightbox-nav--prev');
        const nextButton = document.querySelector('.lightbox-nav--next');

        if (!prevButton || !nextButton) return;

        const showNav = lightboxItems.length > 1;
        prevButton.classList.toggle('is-hidden', !showNav);
        nextButton.classList.toggle('is-hidden', !showNav);
    }

    function renderLightboxItem(index) {
        const { lightboxStage, lightboxCaption } = ui;
        if (!lightboxStage || !lightboxCaption) return;
        if (!lightboxItems.length || index < 0 || index >= lightboxItems.length) return;

        lightboxIndex = index;
        clearLightboxStage();

        const item = lightboxItems[lightboxIndex];
        const mediaNode = createLightboxMedia(item.type, item.src, item.caption);

        lightboxStage.appendChild(mediaNode);
        lightboxCaption.textContent = item.caption || '';
        updateLightboxNav();
    }

    function openLightboxGroup(items, startIndex = 0) {
        const { lightbox } = ui;
        if (!lightbox || !items.length) return;

        lightboxItems = items;
        renderLightboxItem(startIndex);

        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        body.classList.add('lightbox-open');
    }

    function openLightbox(type, src, caption = '') {
        openLightboxGroup([{ type, src, caption }], 0);
    }

    function showPreviousLightboxItem() {
        if (lightboxItems.length <= 1) return;
        const nextIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
        renderLightboxItem(nextIndex);
    }

    function showNextLightboxItem() {
        if (lightboxItems.length <= 1) return;
        const nextIndex = (lightboxIndex + 1) % lightboxItems.length;
        renderLightboxItem(nextIndex);
    }

    function closeLightbox() {
        if (!ui.lightbox) return;
        clearLightboxStage();
        ui.lightbox.classList.remove('is-open');
        ui.lightbox.setAttribute('aria-hidden', 'true');
        body.classList.remove('lightbox-open');
        lightboxItems = [];
        lightboxIndex = -1;
    }

    function initLightbox() {
        if (!ui.lightboxTriggers.length) return;

        ui.lightboxTriggers.forEach((trigger) => {
            trigger.addEventListener('click', (event) => {
                event.preventDefault();

                const gallery = trigger.closest('.project-gallery');
                if (gallery) {
                    const galleryTriggers = [...gallery.querySelectorAll('.js-open-lightbox')];
                    const items = galleryTriggers.map((item) => ({
                        type: item.dataset.type || 'image',
                        src: item.dataset.src || '',
                        caption: item.dataset.caption || ''
                    }));
                    const startIndex = galleryTriggers.indexOf(trigger);

                    openLightboxGroup(items, startIndex);
                    return;
                }

                openLightbox(
                    trigger.dataset.type || 'image',
                    trigger.dataset.src || '',
                    trigger.dataset.caption || ''
                );
            });

            if (trigger.tagName !== 'BUTTON' && trigger.tagName !== 'A') {
                trigger.addEventListener('keydown', (event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    trigger.click();
                });
            }
        });

        ui.lightboxClose?.addEventListener('click', closeLightbox);

        document.querySelector('.lightbox-nav--prev')?.addEventListener('click', (event) => {
            event.stopPropagation();
            showPreviousLightboxItem();
        });

        document.querySelector('.lightbox-nav--next')?.addEventListener('click', (event) => {
            event.stopPropagation();
            showNextLightboxItem();
        });

        ui.lightbox?.addEventListener('click', (event) => {
            if (event.target === ui.lightbox) {
                closeLightbox();
            }
        });
    }

    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeLightbox();
                setMenuState(false);
            }

            if (!ui.lightbox?.classList.contains('is-open')) return;

            if (event.key === 'ArrowLeft') {
                showPreviousLightboxItem();
            }

            if (event.key === 'ArrowRight') {
                showNextLightboxItem();
            }
        });
    }

    function init() {
        initMenu();
        initRevealObserver();
        initProjectIndex();
        initLightbox();
        initKeyboardShortcuts();
    }

    init();
})();