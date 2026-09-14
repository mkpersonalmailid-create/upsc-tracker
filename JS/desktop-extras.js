// desktop-extras.js — sirf Tauri desktop app me chalta hai
(function () {
  var isTauri = !!(window.__TAURI_INTERNALS__ || window.__TAURI__);
  if (!isTauri) return;

  function addBackButton() {
    if (!document.body) {
      setTimeout(addBackButton, 100);
      return;
    }
    if (document.getElementById('__dt_back')) return;

    var btn = document.createElement('button');
    btn.id = '__dt_back';
    btn.innerHTML = '←';
    btn.title = 'Back';
    btn.style.cssText =
      'position:fixed;top:14px;left:14px;width:44px;height:44px;' +
      'border-radius:50%;background:rgba(25,25,40,0.78);color:#fff;' +
      'border:1px solid rgba(255,255,255,0.15);font-size:22px;line-height:1;' +
      'cursor:pointer;z-index:2147483647;backdrop-filter:blur(10px);' +
      '-webkit-backdrop-filter:blur(10px);box-shadow:0 4px 14px rgba(0,0,0,0.4);' +
      'display:flex;align-items:center;justify-content:center;padding:0;' +
      'transition:transform 0.15s ease;';
    btn.onmouseenter = function () {
      btn.style.transform = 'scale(1.1)';
    };
    btn.onmouseleave = function () {
      btn.style.transform = 'scale(1)';
    };
    btn.onclick = function () {
      window.history.back();
    };

    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addBackButton);
  } else {
    addBackButton();
  }
})();
