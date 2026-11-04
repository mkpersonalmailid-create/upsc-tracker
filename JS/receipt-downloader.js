/* ═══════════════════════════════════════════════════════
   RECEIPT DOWNLOADER — Generates PDF for Payment History
   File: JS/receipt-downloader.js
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.log('[receipt-downloader] loaded');

  // 1. लाइब्रेरी लोड करें
  if (typeof html2pdf === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    document.head.appendChild(script);
  }

  // 2. छिपा हुआ (Hidden) Receipt Template बनाएं
  function injectTemplate() {
    if (document.getElementById('receiptTemplate')) return;

    const template = document.createElement('div');
    template.id = 'receiptTemplate';
    template.style.cssText =
      'display: none; width: 800px; padding: 40px; background: #ffffff; color: #333333; font-family: "Inter", sans-serif; box-sizing: border-box; position: absolute; left: -9999px;';

    template.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #A855F7; padding-bottom: 20px; margin-bottom: 30px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="https://i.ibb.co/vxGqtDqg/upsc-study-tracker-logo-1.png" alt="Logo" style="width: 50px; height: 50px; border-radius: 10px;">
          <div>
            <h1 style="margin: 0; font-size: 24px; color: #111; font-weight: 800;">UPSC Study Tracker</h1>
            <p style="margin: 0; font-size: 13px; color: #666;">upscstudytracker.co.in</p>
          </div>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 20px; color: #A855F7;">PAYMENT RECEIPT</h2>
          <p style="margin: 5px 0 0; font-size: 13px; color: #666;">Date: <span id="rcptDate"></span></p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <h3 style="margin: 0 0 8px; font-size: 14px; color: #888; text-transform: uppercase;">Billed To:</h3>
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #111;" id="rcptName"></p>
          <p style="margin: 4px 0 0; font-size: 14px; color: #555;" id="rcptEmail"></p>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0 0 8px; font-size: 14px; color: #888; text-transform: uppercase;">Payment Details:</h3>
          <p style="margin: 0; font-size: 14px; color: #555;"><strong>Payment ID:</strong> <span id="rcptPayId"></span></p>
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
              <p style="margin: 0; font-size: 15px; font-weight: 600;" id="rcptPlan"></p>
              <p style="margin: 4px 0 0; font-size: 13px; color: #666;">Premium Subscription Plan</p>
            </td>
            <td style="padding: 16px 12px; text-align: right; font-size: 15px; font-weight: 600; border-bottom: 1px solid #E5E7EB;" id="rcptAmount"></td>
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
          <h2 style="margin: 5px 0 0; font-size: 28px; color: #111; font-weight: 900;" id="rcptTotal"></h2>
        </div>
      </div>
    `;
    document.body.appendChild(template);
  }

  // 3. PDF जनरेट करने का फंक्शन
  window.downloadReceiptPDF = function (payment) {
    if (typeof html2pdf === 'undefined') {
      if (typeof toast === 'function') toast('Please wait, generating PDF...', 'info');
      setTimeout(() => window.downloadReceiptPDF(payment), 1000);
      return;
    }

    const pDate = payment.created_at ? new Date(payment.created_at) : new Date();
    document.getElementById('rcptDate').innerText = pDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    document.getElementById('rcptName').innerText = window.state?.profile?.name || 'User';
    document.getElementById('rcptEmail').innerText = window.state?.user?.email || '';
    document.getElementById('rcptPayId').innerText = payment.razorpay_payment_id || '—';

    let planName = 'Premium Plan';
    if (payment.plan === 'monthly_once') planName = 'Monthly Premium';
    if (payment.plan === 'yearly') planName = 'Yearly Premium';
    if (payment.plan === 'monthly_auto') planName = 'Monthly Auto (UPI)';
    document.getElementById('rcptPlan').innerText = planName;

    const amt = '₹' + ((payment.amount || 0) / 100).toFixed(2);
    document.getElementById('rcptAmount').innerText = amt;
    document.getElementById('rcptTotal').innerText = amt;

    const element = document.getElementById('receiptTemplate');
    // टेम्प्लेट को दिखाओ ताकि PDF बन सके
    element.style.display = 'block';
    element.style.left = '0';
    element.style.zIndex = '-9999';

    const opt = {
      margin: 0,
      filename: `UPSC_Receipt_${payment.razorpay_payment_id || Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'px', format: [800, 1000], orientation: 'portrait' },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        element.style.display = 'none';
        element.style.left = '-9999px';
        if (typeof toast === 'function') toast('Receipt downloaded!', 'ok');
      })
      .catch((e) => {
        element.style.display = 'none';
        element.style.left = '-9999px';
        console.error('PDF Error:', e);
      });
  };

  // 4. DOM में बटन जोड़ने का सबसे पक्का तरीका (MutationObserver)
  function attachButtons() {
    const container = document.getElementById('paymentHistory');
    if (!container) return;

    // पेमेंट हिस्ट्री का डेटा मंगाओ (ताकि बटन में सही ऑब्जेक्ट जाए)
    if (typeof window.loadPaymentHistory !== 'function') return;

    window.loadPaymentHistory().then((history) => {
      if (!history || history.length === 0) return;

      // पेमेंट हिस्ट्री के सारे रो (Row) ढूंढो
      const rows = container.querySelectorAll('div[style*="display:flex"]');

      rows.forEach((row, index) => {
        // अगर इस रो में पहले से बटन है तो स्किप करो
        if (row.querySelector('.pdf-receipt-btn')) return;
        if (!history[index]) return;

        // नया बटन बनाओ
        const btn = document.createElement('button');
        btn.className = 'pdf-receipt-btn';
        btn.innerHTML = '📥 PDF';
        btn.style.cssText =
          'padding: 6px 12px; margin-left: 10px; font-size: 0.75rem; background: rgba(168,85,247,0.15); color: #c4b5fd; border: 1px solid rgba(168,85,247,0.3); border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s; display: flex; align-items: center; gap: 4px;';

        // Hover effect
        btn.onmouseover = () => {
          btn.style.background = 'var(--purple)';
          btn.style.color = 'white';
        };
        btn.onmouseout = () => {
          btn.style.background = 'rgba(168,85,247,0.15)';
          btn.style.color = '#c4b5fd';
        };

        btn.onclick = function (e) {
          e.preventDefault();
          window.downloadReceiptPDF(history[index]);
        };

        row.appendChild(btn);
      });
    });
  }

  // 5. Installer (MutationObserver लगाओ)
  function install() {
    injectTemplate();

    // जब भी 'paymentHistory' डिब्बा बने या उसमें कुछ बदले, तब बटन लगाओ
    let attempts = 0;
    const interval = setInterval(() => {
      const container = document.getElementById('paymentHistory');
      if (container) {
        clearInterval(interval);

        // जैसे ही डिब्बा खाली से भरेगा, observer पकड़ लेगा
        const observer = new MutationObserver(() => {
          attachButtons();
        });
        observer.observe(container, { childList: true, subtree: true });

        // एक बार शुरुआत में भी चला दो
        setTimeout(attachButtons, 500);
      }

      if (++attempts > 20) clearInterval(interval);
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();
