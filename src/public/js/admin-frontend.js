/**
 * Neleeri Sneakers - Admin Frontend Script
 * Handles admin dashboard operations, real-time table filtering, image previews & status management.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('🛡️ Neleeri Admin Frontend Initialized');

  // 1. Live Sneaker Image Preview on Add Sneaker Form
  const imageUrlInput = document.getElementById('adminSneakerImageUrl');
  const imagePreviewContainer = document.getElementById('adminSneakerImagePreview');

  if (imageUrlInput && imagePreviewContainer) {
    const updatePreview = () => {
      const url = imageUrlInput.value.trim();
      if (url) {
        imagePreviewContainer.innerHTML = `
          <div style="margin-top: 0.75rem;">
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.35rem;">Live Image Preview:</p>
            <img src="${url}" alt="Sneaker Preview" style="width: 140px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border);" onerror="this.src='https://placehold.co/140x100?text=Invalid+Image';">
          </div>
        `;
      } else {
        imagePreviewContainer.innerHTML = '';
      }
    };

    imageUrlInput.addEventListener('input', updatePreview);
    // Initial trigger if value already populated
    if (imageUrlInput.value) updatePreview();
  }

  // 2. Real-time Search for Admin Tables (Products, Orders, Users)
  const adminTableSearch = document.getElementById('adminTableSearch');
  if (adminTableSearch) {
    adminTableSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('.table tbody tr');

      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        if (text.includes(query)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }

  // 3. Highlight Status Badges Automatically
  const statusBadges = document.querySelectorAll('.order-status-badge');
  statusBadges.forEach((badge) => {
    const status = badge.textContent.trim().toUpperCase();
    if (status === 'DELIVERED') {
      badge.style.color = '#10b981';
      badge.style.borderColor = '#10b981';
    } else if (status === 'CANCELLED') {
      badge.style.color = '#ef4444';
      badge.style.borderColor = '#ef4444';
    } else if (status === 'SHIPPED') {
      badge.style.color = '#3b82f6';
      badge.style.borderColor = '#3b82f6';
    } else {
      badge.style.color = '#f59e0b';
      badge.style.borderColor = '#f59e0b';
    }
  });

  // 4. Safe Delete Confirmation
  const deleteForms = document.querySelectorAll('.confirm-delete-form');
  deleteForms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      const confirmed = window.confirm('⚠️ Are you sure you want to permanently delete this sneaker from the catalog?');
      if (!confirmed) {
        e.preventDefault();
      }
    });
  });

  // 5. User Role Update Confirmation
  const roleForms = document.querySelectorAll('.role-change-form');
  roleForms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      const roleSelect = form.querySelector('select[name="role"]');
      const chosenRole = roleSelect ? roleSelect.value : 'new role';
      const confirmed = window.confirm(`Change this user's account role to "${chosenRole}"?`);
      if (!confirmed) {
        e.preventDefault();
      }
    });
  });
});
