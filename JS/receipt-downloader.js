/* ═══════════════════════════════════════════════════════
   RECEIPT DOWNLOADER — Final Standalone Version
   File: JS/receipt-downloader.js
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[receipt-downloader] Final Script Loaded');

  // 1. लाइब्रेरी लोड करें (अगर पहले से नहीं है)
  if (typeof html2pdf === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    document.head.appendChild(script);
  }

  // 2. PDF जनरेट करने का मुख्य फंक्शन
  window.__generatePDFReceipt = function (payment) {
    if (!payment) return;

    if (typeof html2pdf === 'undefined') {
      if (typeof toast === 'function') toast('Loading PDF engine...', 'info');
      return setTimeout(() => window.__generatePDFReceipt(payment), 1000);
    }

    if (typeof toast === 'function') toast('Generating PDF...', 'info');

    // ─── डेटा तैयार करें ───
    const pDate = payment.created_at ? new Date(payment.created_at) : new Date();
    const dateStr = pDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    // ⬇️ स्मार्ट नाम और ईमेल लॉजिक ⬇️
    let name = 'User';
    let email = 'N/A';
    try {
      const s = typeof state !== 'undefined' ? state : window.state || null;
      if (s) {
        if (s.user && s.user.email) {
          email = s.user.email;
        }

        let rawName = s.profile?.name || s.user?.user_metadata?.full_name;

        if (rawName && rawName.trim() !== '') {
          name = rawName; // अगर नाम डाला है
        } else if (email !== 'N/A') {
          name = email.split('@')[0]; // अगर नाम नहीं डाला, तो ईमेल से नाम बनाओ
        }
      }
    } catch (e) {
      console.warn('User details fetch error:', e);
    }

    const payId = payment.razorpay_payment_id || '—';

    let planName = 'Premium Plan';
    if (payment.plan === 'monthly_once') planName = 'Monthly Premium';
    if (payment.plan === 'yearly') planName = 'Yearly Premium';
    if (payment.plan === 'monthly_auto') planName = 'Monthly Auto (UPI)';

    const amt = '₹' + ((payment.amount || 0) / 100).toFixed(2);

    // ─── एक छिपा हुआ (Hidden Overlay) कंटेनर बनाएं ───
    const wrapper = document.createElement('div');
    wrapper.style.cssText =
      'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 999999; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; pointer-events: none;';

    const receiptDiv = document.createElement('div');
    receiptDiv.style.cssText =
      'width: 800px; background: #ffffff; color: #333333; padding: 40px; box-sizing: border-box; font-family: "Inter", sans-serif;';

    receiptDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #A855F7; padding-bottom: 20px; margin-bottom: 30px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="https://i.ibb.co/vxGqtDqg/upsc-study-tracker-logo-1.png" alt="Logo" style="width: 50px; height: 50px; border-radius: 10px;" crossorigin="anonymous">
          <div>
            <h1 style="margin: 0; font-size: 24px; color: #111; font-weight: 800;">UPSC Study Tracker</h1>
            <p style="margin: 0; font-size: 13px; color: #666;">upscstudytracker.co.in</p>
          </div>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 20px; color: #A855F7;">PAYMENT RECEIPT</h2>
          <p style="margin: 5px 0 0; font-size: 13px; color: #666;">Date: ${dateStr}</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <h3 style="margin: 0 0 8px; font-size: 14px; color: #888; text-transform: uppercase;">Billed To:</h3>
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #111; text-transform: capitalize;">${name}</p>
          <p style="margin: 4px 0 0; font-size: 14px; color: #555;">${email}</p>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0 0 8px; font-size: 14px; color: #888; text-transform: uppercase;">Payment Details:</h3>
          <p style="margin: 0; font-size: 14px; color: #555;"><strong>Payment ID:</strong> ${payId}</p>
          <p style="margin: 4px 0 0; font-size: 14px; color: #555;"><strong>Status:</strong> <span style="color: #10B981; font-weight: bold;">PAID</span></p>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
        <thead>
          <tr style="background: #F3F4F6; color: #333;">
            <th style="padding: 12px; text-align: left; font-size: 14px; border-bottom: 2px solid #E5E7EB;">Description</th>
            <th style="padding: 12px; text-align: right; font-size: 14px; border-bottom: 2px solid #E5E7EB;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 16px 12px; border-bottom: 1px solid #E5E7EB;">
              <p style="margin: 0; font-size: 15px; font-weight: 600;">${planName}</p>
              <p style="margin: 4px 0 0; font-size: 13px; color: #666;">Premium Subscription Plan</p>
            </td>
            <td style="padding: 16px 12px; text-align: right; font-size: 15px; font-weight: 600; border-bottom: 1px solid #E5E7EB;">${amt}</td>
          </tr>
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between; align-items: flex-end;">
        <div style="font-size: 12px; color: #888; max-width: 300px;">
          <p style="margin: 0;"><strong>Note:</strong> This is a computer-generated receipt.</p>
          <!-- ⬇️ यहाँ सपोर्ट ईमेल बदल दिया गया है ⬇️ -->
          <p style="margin: 10px 0 0;">For any queries, contact us at <strong>upscstudytracker@gmail.com</strong></p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 14px; color: #666;">Total Paid</p>
          <h2 style="margin: 5px 0 0; font-size: 28px; color: #111; font-weight: 900;">${amt}</h2>
        </div>
      </div>
    `;

    wrapper.appendChild(receiptDiv);
    document.body.appendChild(wrapper);

    // ─── इमेज लोड होने का इंतज़ार करें और PDF बनाएं ───
    const img = receiptDiv.querySelector('img');
    const doPDF = () => {
      const opt = {
        margin: 0,
        filename: `UPSC_Receipt_${payId}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        },
        jsPDF: { unit: 'px', format: [800, 1000], orientation: 'portrait' },
      };

      html2pdf()
        .set(opt)
        .from(receiptDiv)
        .save()
        .then(() => {
          wrapper.remove();
          if (typeof toast === 'function') toast('Receipt downloaded successfully!', 'ok');
        })
        .catch((err) => {
          console.error('PDF Gen Error:', err);
          wrapper.remove();
          if (typeof toast === 'function') toast('Failed to generate PDF', 'err');
        });
    };

    if (img && !img.complete) {
      img.onload = () => setTimeout(doPDF, 200);
      img.onerror = () => setTimeout(doPDF, 200);
    } else {
      setTimeout(doPDF, 300);
    }
  };

  // 3. पेमेंट हिस्ट्री का डेटा कैश (Cache) करें
  let originalLoadPaymentHistory = null;
  function hijackHistory() {
    if (typeof window.loadPaymentHistory === 'function' && !originalLoadPaymentHistory) {
      originalLoadPaymentHistory = window.loadPaymentHistory;
      window.loadPaymentHistory = async function () {
        const history = await originalLoadPaymentHistory.apply(this, arguments);
        window.__paymentHistoryCache = history;
        return history;
      };
    }
  }

  // 4. DOM में बटन जोड़ें (MutationObserver)
  function setupObserver() {
    const container = document.getElementById('paymentHistory');
    if (!container) return false;
    if (container.dataset.receiptObserver) return true;
    container.dataset.receiptObserver = 'true';

    const addButtons = () => {
      if (!window.__paymentHistoryCache) return;
      const children = Array.from(container.children);

      children.forEach((row, index) => {
        if (row.querySelector('.pdf-receipt-btn')) return;
        if (!window.__paymentHistoryCache[index]) return;

        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary btn-sm pdf-receipt-btn';
        btn.innerHTML = '📥 PDF';
        btn.style.cssText =
          'padding: 6px 10px; margin-left: auto; font-size: 0.75rem; background: rgba(168,85,247,0.15); color: #c4b5fd; border: 1px solid rgba(168,85,247,0.3); border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; font-weight: bold; transition: 0.2s;';

        btn.onmouseover = () => {
          btn.style.background = 'var(--purple)';
          btn.style.color = 'white';
        };
        btn.onmouseout = () => {
          btn.style.background = 'rgba(168,85,247,0.15)';
          btn.style.color = '#c4b5fd';
        };

        btn.onclick = (e) => {
          e.preventDefault();
          window.__generatePDFReceipt(window.__paymentHistoryCache[index]);
        };
        row.appendChild(btn);
      });
    };

    const observer = new MutationObserver(() => addButtons());
    observer.observe(container, { childList: true });
    return true;
  }

  // 5. Main Loop (लगातार चेक करेगा कि ऐप लोड हुआ या नहीं)
  let attempts = 0;
  const interval = setInterval(() => {
    hijackHistory();
    if (setupObserver()) {
      const container = document.getElementById('paymentHistory');
      if (container && window.__paymentHistoryCache) {
        const children = Array.from(container.children);
        children.forEach((row, index) => {
          if (row.querySelector('.pdf-receipt-btn')) return;
          if (!window.__paymentHistoryCache[index]) return;
          const btn = document.createElement('button');
          btn.className = 'btn btn-secondary btn-sm pdf-receipt-btn';
          btn.innerHTML = '📥 PDF';
          btn.style.cssText =
            'padding: 6px 10px; margin-left: auto; font-size: 0.75rem; background: rgba(168,85,247,0.15); color: #c4b5fd; border: 1px solid rgba(168,85,247,0.3); border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; font-weight: bold; transition: 0.2s;';
          btn.onmouseover = () => {
            btn.style.background = 'var(--purple)';
            btn.style.color = 'white';
          };
          btn.onmouseout = () => {
            btn.style.background = 'rgba(168,85,247,0.15)';
            btn.style.color = '#c4b5fd';
          };
          btn.onclick = (e) => {
            e.preventDefault();
            window.__generatePDFReceipt(window.__paymentHistoryCache[index]);
          };
          row.appendChild(btn);
        });
      }
    }
    if (++attempts > 20) clearInterval(interval);
  }, 500);
})();
