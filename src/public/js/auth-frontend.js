/**
 * Neleeri Sneakers - Authentication Frontend Utilities
 * Handles interactive client-side UX:
 * - Password Show/Hide toggles
 * - Live Password Strength Meter
 * - Password confirmation matching
 * - 6-Digit OTP auto-focus and clipboard paste
 * - Resend OTP 60s cooldown timer
 * - Form submit loading states
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Password Visibility Toggles
  const toggleButtons = document.querySelectorAll('.password-toggle-btn');
  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      // Toggle Eye Icon
      btn.innerHTML = isPassword
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  });

  // 2. Interactive Password Strength Meter
  const passwordInput = document.getElementById('password');
  const meterFill = document.getElementById('passwordMeterFill');
  const reqMinLength = document.getElementById('reqMinLength');
  const reqNumber = document.getElementById('reqNumber');
  const reqSpecial = document.getElementById('reqSpecial');

  if (passwordInput && meterFill) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      const minLen = val.length >= 8;
      const hasNum = /\d/.test(val);
      const hasSpec = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val);
      const hasUpper = /[A-Z]/.test(val);

      if (reqMinLength) reqMinLength.classList.toggle('met', minLen);
      if (reqNumber) reqNumber.classList.toggle('met', hasNum);
      if (reqSpecial) reqSpecial.classList.toggle('met', hasSpec);

      let passedCount = 0;
      if (minLen) passedCount++;
      if (hasNum) passedCount++;
      if (hasSpec) passedCount++;
      if (hasUpper) passedCount++;

      meterFill.className = 'password-meter-fill';
      if (val.length === 0) {
        meterFill.style.width = '0%';
      } else if (passedCount <= 1) {
        meterFill.classList.add('weak');
      } else if (passedCount === 2) {
        meterFill.classList.add('fair');
      } else if (passedCount === 3) {
        meterFill.classList.add('good');
      } else {
        meterFill.classList.add('strong');
      }
    });
  }

  // 3. Confirm Password Match Checker
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const passwordMatchNotice = document.getElementById('passwordMatchNotice');

  if (passwordInput && confirmPasswordInput && passwordMatchNotice) {
    const checkMatch = () => {
      const pass = passwordInput.value;
      const conf = confirmPasswordInput.value;
      if (!conf) {
        passwordMatchNotice.style.display = 'none';
        return;
      }
      passwordMatchNotice.style.display = 'block';
      if (pass === conf) {
        passwordMatchNotice.style.color = 'var(--success)';
        passwordMatchNotice.textContent = '✓ Passwords match';
      } else {
        passwordMatchNotice.style.color = 'var(--danger)';
        passwordMatchNotice.textContent = '✕ Passwords do not match';
      }
    };

    passwordInput.addEventListener('input', checkMatch);
    confirmPasswordInput.addEventListener('input', checkMatch);
  }

  // 4. 6-Digit OTP Input Handler
  const otpContainer = document.querySelector('.otp-container');
  if (otpContainer) {
    const digits = otpContainer.querySelectorAll('.otp-digit');
    const hiddenOtpInput = document.getElementById('otpCode');
    const submitBtn = document.getElementById('otpSubmitBtn');

    const updateFullOtp = () => {
      let code = '';
      digits.forEach((d) => (code += d.value));
      if (hiddenOtpInput) hiddenOtpInput.value = code;
      if (submitBtn) submitBtn.disabled = code.length !== digits.length;
    };

    digits.forEach((digit, index) => {
      digit.addEventListener('input', (e) => {
        // Enforce numeric only
        digit.value = digit.value.replace(/[^0-9]/g, '');
        if (digit.value && index < digits.length - 1) {
          digits[index + 1].focus();
        }
        updateFullOtp();
      });

      digit.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !digit.value && index > 0) {
          digits[index - 1].focus();
        }
      });

      // Handle paste
      digit.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text').trim();
        const cleanDigits = pasted.replace(/[^0-9]/g, '').slice(0, digits.length);
        if (cleanDigits) {
          cleanDigits.split('').forEach((ch, i) => {
            if (digits[i]) digits[i].value = ch;
          });
          const nextFocus = Math.min(cleanDigits.length, digits.length - 1);
          digits[nextFocus].focus();
          updateFullOtp();
        }
      });
    });

    // Auto-focus first digit
    if (digits[0]) digits[0].focus();
  }

  // 5. Resend OTP Cooldown Timer
  const resendBtn = document.getElementById('resendOtpBtn');
  const countdownSpan = document.getElementById('resendCountdown');
  if (resendBtn && countdownSpan) {
    let timeLeft = parseInt(resendBtn.getAttribute('data-cooldown') || '60', 10);

    const updateCountdown = () => {
      if (timeLeft > 0) {
        resendBtn.disabled = true;
        countdownSpan.textContent = ` (${timeLeft}s)`;
        timeLeft--;
        setTimeout(updateCountdown, 1000);
      } else {
        resendBtn.disabled = false;
        countdownSpan.textContent = '';
      }
    };

    updateCountdown();
  }

  // 6. Form Submission Loading States
  const authForms = document.querySelectorAll('form[data-auth-form]');
  authForms.forEach((form) => {
    form.addEventListener('submit', () => {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.classList.add('btn-loading');
        submitBtn.setAttribute('data-original-text', submitBtn.innerText);
      }
    });
  });
});
