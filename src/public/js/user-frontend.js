/**
 * Neleeri Sneakers - User / Customer Frontend Script
 * Handles storefront interactions, shoe size selectors, bag updates, and quick filters.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('👟 Neleeri User Frontend Initialized');

  // 1. Shoe Size Selector
  const sizePills = document.querySelectorAll('.size-select-pill');
  const hiddenSizeInput = document.getElementById('selectedShoeSize');

  if (sizePills.length && hiddenSizeInput) {
    sizePills.forEach((pill) => {
      pill.addEventListener('click', () => {
        sizePills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        hiddenSizeInput.value = pill.getAttribute('data-size');
      });
    });
  }

  // 2. Quantity Increment / Decrement
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const qtyInput = document.getElementById('quantityInput');

  if (qtyMinus && qtyPlus && qtyInput) {
    qtyMinus.addEventListener('click', () => {
      const current = parseInt(qtyInput.value, 10) || 1;
      if (current > 1) qtyInput.value = current - 1;
    });

    qtyPlus.addEventListener('click', () => {
      const current = parseInt(qtyInput.value, 10) || 1;
      const max = parseInt(qtyInput.getAttribute('max'), 10) || 99;
      if (current < max) qtyInput.value = current + 1;
    });
  }

  // 3. Dynamic Bag Total calculation in Cart
  const cartItemRows = document.querySelectorAll('.cart-item-row');
  if (cartItemRows.length) {
    console.log(`Cart contains ${cartItemRows.length} active sneaker items.`);
  }

  // 4. Live Sneaker Search Input
  const liveSearchInput = document.getElementById('catalogLiveSearch');
  if (liveSearchInput) {
    liveSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const productCards = document.querySelectorAll('.product-card');

      productCards.forEach((card) => {
        const title = (card.querySelector('.product-name')?.textContent || '').toLowerCase();
        const brand = (card.querySelector('.product-brand')?.textContent || '').toLowerCase();
        const category = (card.querySelector('.product-badge')?.textContent || '').toLowerCase();

        if (title.includes(query) || brand.includes(query) || category.includes(query)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // 5. Toast / Notification Auto-Dismiss
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach((alert) => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      alert.style.opacity = '0';
      alert.style.transform = 'translateY(-10px)';
      setTimeout(() => alert.remove(), 600);
    }, 4500);
  });
});
