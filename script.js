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

    // 2. Mobile Menu Toggle
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

    // 3. FAQ Accordion Handler
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

    // 4. Download Modal Trigger Handler
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
            showCustomAlert('Download Started', `Starting download for ${currentPlatform.toUpperCase()} package...`, false);
            downloadModal.classList.remove('open');
        });
    }
});

// =========================================
// ORGANIZATION REGISTRATION MODAL LOGIC
// =========================================

// Track registered orgs/admins to perform real-time duplicate check
const existingOrgs = ['dataevol', 'unotag', 'enterprise', 'acme', 'demo'];
const existingAdmins = ['admin@dataevol', 'admin@unotag', 'chetan@gmail.com', 'admin@enterprise'];

window.openOrgRegisterModal = function() {
    const modal = document.getElementById('org-register-modal');
    if (modal) {
        modal.classList.add('open');
        goToStep(1);
    }
};

window.closeOrgRegisterModal = function() {
    const modal = document.getElementById('org-register-modal');
    if (modal) {
        modal.classList.remove('open');
    }
};

window.goToStep = function(stepNum) {
    const section1 = document.getElementById('form-section-1');
    const section2 = document.getElementById('form-section-2');
    const indicator1 = document.getElementById('step-indicator-1');
    const indicator2 = document.getElementById('step-indicator-2');
    const line1 = document.getElementById('step-line-1');

    if (stepNum === 2) {
        // Validate Section 1 Fields First
        const fname = document.getElementById('reg-fname').value.trim();
        const lname = document.getElementById('reg-lname').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const designation = document.getElementById('reg-designation').value.trim();

        if (!fname || !lname || !email || !phone || !designation) {
            showCustomAlert('⚠️ Missing Personal Information', 'Please complete all required fields in Section 1 before proceeding to Organization Details.', true);
            return;
        }

        if (!email.includes('@') || !email.includes('.')) {
            showCustomAlert('⚠️ Invalid Work Email', 'Please enter a valid work email address (e.g. rahul@company.com).', true);
            return;
        }

        section1.classList.remove('active');
        section2.classList.add('active');
        indicator1.classList.remove('active');
        indicator1.classList.add('completed');
        indicator2.classList.add('active');
        line1.classList.add('active');
    } else {
        section2.classList.remove('active');
        section1.classList.add('active');
        indicator2.classList.remove('active');
        indicator1.classList.remove('completed');
        indicator1.classList.add('active');
        line1.classList.remove('active');
    }
};

window.updateAdminSuggestion = function() {
    const orgInput = document.getElementById('reg-orgname').value.trim();
    const adminInput = document.getElementById('reg-adminid');
    const suggestedFormat = document.getElementById('suggested-format');

    if (!orgInput) {
        suggestedFormat.textContent = 'admin@company';
        return;
    }

    const cleanOrg = orgInput.toLowerCase().replace(/[^a-z0-9]/g, '');
    const suggestion = `admin@${cleanOrg}`;
    suggestedFormat.textContent = suggestion;

    if (!adminInput.value || adminInput.value.startsWith('admin@')) {
        adminInput.value = suggestion;
    }
};

window.handleOrgRegisterSubmit = function(event) {
    event.preventDefault();

    const fname = document.getElementById('reg-fname').value.trim();
    const lname = document.getElementById('reg-lname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const designation = document.getElementById('reg-designation').value.trim();
    const orgName = document.getElementById('reg-orgname').value.trim();
    const adminId = document.getElementById('reg-adminid').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;
    const cpassword = document.getElementById('reg-cpassword').value;

    // 1. Password Match Validation
    if (password !== cpassword) {
        showCustomAlert('⚠️ Password Mismatch', 'The Admin Account Password and Confirm Password do not match. Please re-enter passwords carefully.', true);
        return;
    }

    if (password.length < 4) {
        showCustomAlert('⚠️ Weak Password', 'Admin Password must be at least 4 characters long.', true);
        return;
    }

    // 2. Duplicate Organization Name Check
    const cleanOrg = orgName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (existingOrgs.includes(cleanOrg)) {
        showCustomAlert('⚠️ Organization Name Unavailable', `The Organization Name "${orgName}" is already registered in PTMS UNO. Please choose a different unique Organization Name.`, true);
        return;
    }

    // 3. Duplicate Admin ID Check
    if (existingAdmins.includes(adminId) || existingAdmins.includes(email.toLowerCase())) {
        showCustomAlert('⚠️ Admin ID Unavailable', `The Admin ID / Email "${adminId}" is already in use by another organization admin. Please choose a unique Admin ID (e.g. ${adminId}123).`, true);
        return;
    }

    // Register successfully & Save to memory list
    existingOrgs.push(cleanOrg);
    existingAdmins.push(adminId);

    // Show Success Modal
    closeOrgRegisterModal();

    document.getElementById('succ-org-name').textContent = orgName;
    document.getElementById('succ-admin-id').textContent = adminId;

    const successModal = document.getElementById('org-success-modal');
    if (successModal) {
        successModal.classList.add('open');
    }

    // Reset Form
    document.getElementById('org-register-form').reset();
};

window.closeOrgSuccessModal = function() {
    const successModal = document.getElementById('org-success-modal');
    if (successModal) {
        successModal.classList.remove('open');
    }
};

// =========================================
// CUSTOM POPUP ALERT SYSTEM
// =========================================
window.showCustomAlert = function(title, message, isError = false) {
    const modal = document.getElementById('custom-alert-modal');
    const alertTitle = document.getElementById('alert-title');
    const alertMessage = document.getElementById('alert-message');
    const alertIcon = document.getElementById('alert-icon');

    if (alertTitle) alertTitle.textContent = title;
    if (alertMessage) alertMessage.textContent = message;

    if (alertIcon) {
        if (isError) {
            alertIcon.style.color = '#ef4444';
            alertIcon.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
        } else {
            alertIcon.style.color = '#10b981';
            alertIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        }
    }

    if (modal) {
        modal.classList.add('open');
    }
};

window.closeCustomAlert = function() {
    const modal = document.getElementById('custom-alert-modal');
    if (modal) {
        modal.classList.remove('open');
    }
};
