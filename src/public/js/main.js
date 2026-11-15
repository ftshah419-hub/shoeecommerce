// Neleeri Sneakers Client Script
document.addEventListener('DOMContentLoaded', () => {
  // Size selector buttons on product detail page
  const sizeButtons = document.querySelectorAll('.size-select-btn');
  const sizeInput = document.getElementById('selectedSizeInput');

  if (sizeButtons.length && sizeInput) {
    sizeButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        sizeButtons.forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        sizeInput.value = btn.dataset.size;
      });
    });
  }

  // Auto-dismiss alert messages after 5 seconds
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach((alert) => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.5s ease';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 500);
    }, 5000);
  });
});
