/* ═══════════════════════════════════════════════════════
   RECEIPT DOWNLOADER — Standalone File (Ultimate Fix)
   File: JS/receipt-downloader.js
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[receipt-downloader] Script Loaded');

  // 1. html2pdf लाइब्रेरी लोड करें
  if (typeof html2pdf === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    document.head.appendChild(script);
  }

  // 2. PDF जनरेट करने का फंक्शन
  window.__generatePDFReceipt = function (payment) {
    if (!payment) return;
    if (typeof html2pdf === 'undefined') {
      if (typeof toast === 'function') toast('Please wait, loading PDF engine...', 'info');
      return setTimeout(() => window.__generatePDFReceipt(payment), 1000);
    }

    // ─── लोडिंग स्क्रीन (Overlay) बनाएं ───
    const overlay = document.createElement('div');
    overlay.id = 'pdf-generation-overlay';
    overlay.style.cssText =
      'position: fixed; inset: 0; background: rgba(8, 4, 15, 0.95); z-index: 999999; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(5px);';

    const spinner = document.createElement('div');
    spinner.style.cssText =
      'width: 50px; height: 50px; border: 4px solid rgba(168, 85, 247, 0.3); border-top-color: #A855F7; border-radius: 50%; animation: spin 1s linear infinite;';

    const text = document.createElement('div');
    text.style.cssText =
      'color: white; font-family: "Inter", sans-serif; margin-top: 20px; font-weight: 600; font-size: 1.1rem;';
    text.innerText = 'Generating your receipt...';

    overlay.appendChild(spinner);
    overlay.appendChild(text);

    // स्पिन एनिमेशन के लिए स्टाइल जोड़ें
    if (!document.getElementById('spin-style')) {
      const style = document.createElement('style');
      style.id = 'spin-style';
      style.innerHTML = '@keyframes spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }

    document.body.appendChild(overlay);

    // ─── रसीद (Receipt) का टेम्पलेट बनाएं ───
    const template = document.createElement('div');
    // ⚠️ इसे ओवरले के अंदर रखेंगे ताकि यह DOM में रेंडर हो सके और html2canvas इसे पढ़ सके
    template.style.cssText =
      'width: 800px; padding: 40px; background: #ffffff; color: #333333; font-family: "Inter", sans-serif; box-sizing: border-box; position: absolute; top: -9999px;'; // स्क्रीन से ऊपर छिपा हुआ, लेकिन DOM में मौजूद

    const pDate = payment.created_at ? new Date(payment.created_at) : new Date();
    const dateStr = pDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const name = window.state && window.state.profile && window.state.profile.name ? window.state.profile.name : 'User';
    const email = window.state && window.state.user ? window.state.user.email : '';
    const payId = payment.razorpay_payment_id || '—';

    let planName = 'Premium Plan';
    if (payment.plan === 'monthly_once') planName = 'Monthly Premium';
    if (payment.plan === 'yearly') planName = 'Yearly Premium';
    if (payment.plan === 'monthly_auto') planName = 'Monthly Auto (UPI)';

    const amt = '₹' + ((payment.amount || 0) / 100).toFixed(2);

    template.innerHTML = `
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
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #111;">${name}</p>
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
          <p style="margin: 10px 0 0;">For any queries, contact support@upscstudytracker.co.in</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 14px; color: #666;">Total Paid</p>
          <h2 style="margin: 5px 0 0; font-size: 28px; color: #111; font-weight: 900;">${amt}</h2>
        </div>
      </div>
    `;

    // टेम्पलेट को बॉडी में जोड़ें
    document.body.appendChild(template);

    // ─── इमेज लोड होने का इंतज़ार करें और PDF जनरेट करें ───
    const img = template.querySelector('img');
    const generate = () => {
      const opt = {
        margin: 0,
        filename: `UPSC_Receipt_${payId || Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 800 },
        jsPDF: { unit: 'px', format: [800, 1050], orientation: 'portrait' },
      };

      html2pdf()
        .set(opt)
        .from(template)
        .save()
        .then(() => {
          // सफल होने पर सब कुछ साफ करें
          template.remove();
          overlay.remove();
          if (typeof toast === 'function') toast('Receipt downloaded!', 'ok');
        })
        .catch((e) => {
          template.remove();
          overlay.remove();
          console.error('PDF Error:', e);
          if (typeof toast === 'function') toast('Failed to generate PDF', 'err');
        });
    };

    // अगर इमेज लोड हो चुकी है तो सीधे जनरेट करें, वरना लोड होने का इंतजार करें
    if (img && !img.complete) {
      img.onload = generate;
      img.onerror = generate;
    } else {
      setTimeout(generate, 400); // 400ms का बफर ताकि फॉन्ट और बाकी चीजें लोड हो जाएं
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

  // 5. Main Loop
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
