// PTMS UNO SaaS Landing Page Script

document.addEventListener('DOMContentLoaded', () => {
    // 1. Sticky Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Desktop vs Mobile Display Switcher
    window.switchPreviewMode = function(mode) {
        const desktopView = document.getElementById('preview-desktop-view');
        const mobileView = document.getElementById('preview-mobile-view');
        const btnDesktop = document.getElementById('btn-desktop-view');
        const btnMobile = document.getElementById('btn-mobile-view');

        if (mode === 'desktop') {
            if (desktopView) desktopView.style.display = 'block';
            if (mobileView) mobileView.style.display = 'none';
            if (btnDesktop) btnDesktop.classList.add('active');
            if (btnMobile) btnMobile.classList.remove('active');
        } else if (mode === 'mobile') {
            if (desktopView) desktopView.style.display = 'none';
            if (mobileView) mobileView.style.display = 'block';
            if (btnDesktop) btnDesktop.classList.remove('active');
            if (btnMobile) btnMobile.classList.add('active');
        }
    };

    // 3. Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            const isHidden = getComputedStyle(navLinks).display === 'none';
            navLinks.style.display = isHidden ? 'flex' : 'none';
            if (isHidden) {
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.right = '0';
                navLinks.style.background = '#ffffff';
                navLinks.style.padding = '20px';
                navLinks.style.borderBottom = '1px solid #cbd5e1';
            }
        });
    }

    // 4. FAQ Accordion Handler
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');
            faqItems.forEach(i => i.classList.remove('active'));
            if (!isOpen) {
                item.classList.add('active');
            }
        });
    });

    // 5. Download Modal Trigger Handler
    const downloadModal = document.getElementById('download-modal');
    const modalTitle = document.getElementById('modal-platform-title');
    const modalDesc = document.getElementById('modal-platform-desc');
    const modalClose = document.querySelector('.modal-close');
    const confirmDownloadBtn = document.getElementById('confirm-download-btn');

    let currentPlatform = 'exe';

    window.triggerDownloadModal = function(platform) {
        currentPlatform = platform;
        if (platform === 'exe') {
            modalTitle.innerHTML = '<i class="fa-brands fa-windows" style="color:#2563eb;"></i> PTMS UNO for Windows (.EXE)';
            modalDesc.textContent = 'Version v2.4.0 (64-bit Installer) for Windows 10 & 11. Includes auto-updates and desktop notifications.';
            confirmDownloadBtn.innerHTML = '<i class="fa-solid fa-download"></i> Download PTMS_Setup_v2.4.0.exe';
        } else if (platform === 'apk') {
            modalTitle.innerHTML = '<i class="fa-brands fa-android" style="color:#10b981;"></i> PTMS UNO for Android (.APK)';
            modalDesc.textContent = 'Version v2.4.0 APK for Android 8.0+. Direct install package with mobile push notifications support.';
            confirmDownloadBtn.innerHTML = '<i class="fa-solid fa-download"></i> Download PTMS_v2.4.0.apk';
        } else {
            modalTitle.innerHTML = '<i class="fa-solid fa-globe" style="color:#2563eb;"></i> PTMS Cloud Web App';
            modalDesc.textContent = 'Instant cloud access directly in your browser. No installation required.';
            confirmDownloadBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Open Web Dashboard';
        }

        if (downloadModal) {
            downloadModal.classList.add('open');
        }
    };

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            downloadModal.classList.remove('open');
        });
    }

    if (downloadModal) {
        downloadModal.addEventListener('click', (e) => {
            if (e.target === downloadModal) {
                downloadModal.classList.remove('open');
            }
        });
    }

    if (confirmDownloadBtn) {
        confirmDownloadBtn.addEventListener('click', () => {
            alert(`Starting download for ${currentPlatform.toUpperCase()} package...`);
            downloadModal.classList.remove('open');
        });
    }
});
