/* ═══════════════════════════════════════════
   CUSTOM CONFIRM MODAL
   Beautiful replacement for native confirm()
   ═══════════════════════════════════════════ */

(function() {
  'use strict';
  
  /**
   * Show a beautiful confirm dialog
   * @param {Object} opts - Options
   * @param {string} opts.title - Title text
   * @param {string} opts.message - Message text
   * @param {string} opts.confirmText - Confirm button text
   * @param {string} opts.cancelText - Cancel button text
   * @param {string} opts.icon - Emoji icon
   * @param {string} opts.type - 'default' | 'danger' | 'warning'
   * @returns {Promise<boolean>} - true if confirmed, false if cancelled
   */
  window.customConfirm = function(opts) {
    opts = opts || {};
    
    const title = opts.title || 'Are you sure?';
    const message = opts.message || '';
    const confirmText = opts.confirmText || 'Confirm';
    const cancelText = opts.cancelText || 'Cancel';
    const icon = opts.icon || '❓';
    const type = opts.type || 'default'; // default, danger, warning
    
    return new Promise(function(resolve) {
      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'custom-confirm-overlay';
      
      // Build HTML
      overlay.innerHTML = `
        <div class="custom-confirm-box">
          <div class="custom-confirm-icon ${type !== 'default' ? type : ''}">
            ${icon}
          </div>
          <div class="custom-confirm-title">${title}</div>
          ${message ? `<div class="custom-confirm-message">${message}</div>` : ''}
          <div class="custom-confirm-actions">
            <button class="custom-confirm-btn cancel" data-cfm-cancel>${cancelText}</button>
            <button class="custom-confirm-btn ${type === 'danger' ? 'danger' : 'confirm'}" data-cfm-confirm>${confirmText}</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      // Show with animation
      requestAnimationFrame(function() {
        overlay.classList.add('active');
      });
      
      // Get buttons
      const confirmBtn = overlay.querySelector('[data-cfm-confirm]');
      const cancelBtn = overlay.querySelector('[data-cfm-cancel]');
      
      // Cleanup helper
      function close(result) {
        overlay.classList.remove('active');
        setTimeout(function() {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
          resolve(result);
        }, 200);
      }
      
      // Event listeners
      confirmBtn.addEventListener('click', function() { close(true); });
      cancelBtn.addEventListener('click', function() { close(false); });
      
      // Backdrop click = cancel
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) close(false);
      });
      
      // Escape key = cancel
      function escHandler(e) {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', escHandler);
          close(false);
        }
      }
      document.addEventListener('keydown', escHandler);
      
      // Auto focus confirm button
      setTimeout(function() {
        confirmBtn.focus();
      }, 100);
      
      // Enter key = confirm
      function enterHandler(e) {
        if (e.key === 'Enter') {
          document.removeEventListener('keydown', enterHandler);
          close(true);
        }
      }
      confirmBtn.addEventListener('keydown', enterHandler);
    });
  };
  
  console.log('✅ Custom confirm modal loaded');
  
})();