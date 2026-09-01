/* eslint-disable */
/**
 * Credible Verified badge widget — drop-in client loader.
 *
 * Usage on third-party sites:
 *
 *   <div class="credible-badge"
 *        data-business-id="<id>"
 *        data-badge-id="<id>"></div>
 *   <script async src="https://credible.com/widgets/badge.js"></script>
 *
 * The widget:
 *   1. Reads `data-business-id` and `data-badge-id` from the placeholder.
 *   2. Calls the public Credible verification endpoint.
 *   3. Renders an inline badge that links to the public verification page.
 *
 * No third-party CSS required — minimal styling is injected.
 */
(function () {
  if (typeof window === 'undefined') return;
  if (window.__credibleBadgeLoaded) return;
  window.__credibleBadgeLoaded = true;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var api = (function () {
      var script = document.currentScript || document.querySelector('script[data-credible-widget]');
      var fromAttr = script && script.getAttribute && script.getAttribute('data-api-url');
      return fromAttr || 'https://api.credible.com/api/v1';
    })();

    var STYLE_ID = 'credible-badge-styles';
    function injectStyles() {
      if (document.getElementById(STYLE_ID)) return;
      var css = [
        '.credible-badge{display:inline-flex;align-items:center;gap:8px;border:1px solid #e5e7eb;border-radius:8px;padding:8px 12px;font-family:Inter,Arial,sans-serif;font-size:14px;color:#111827;background:#fff;text-decoration:none}',
        '.credible-badge:hover{background:#f9fafb}',
        '.credible-badge img{height:24px;display:block}',
        '.credible-badge .cb-text{display:flex;flex-direction:column;line-height:1.1}',
        '.credible-badge .cb-name{font-weight:600;color:#111827}',
        '.credible-badge .cb-tier{font-size:11px;color:#1a56db;font-weight:600}',
        '.credible-badge .cb-icon{flex:0 0 24px;height:24px;width:24px}',
      ].join('');
      var tag = document.createElement('style');
      tag.id = STYLE_ID;
      tag.appendChild(document.createTextNode(css));
      document.head.appendChild(tag);
    }

    function render(target, info) {
      target.innerHTML = '';
      target.setAttribute('data-loaded', 'true');

      var a = document.createElement('a');
      a.className = 'credible-badge';
      a.href = info.verificationUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', info.businessName + ' is Credible Verified');

      var img = document.createElement('img');
      img.className = 'cb-icon';
      img.alt = '';
      img.src =
        'data:image/svg+xml;utf8,' +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">' +
            '<circle cx="12" cy="12" r="11" fill="#1A56DB"/>' +
            '<path d="M6 12l4 4 8-8" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
            '</svg>',
        );
      a.appendChild(img);

      var wrap = document.createElement('span');
      wrap.className = 'cb-text';
      var name = document.createElement('span');
      name.className = 'cb-name';
      name.textContent = info.businessName;
      var tier = document.createElement('span');
      tier.className = 'cb-tier';
      tier.textContent = info.tier;
      wrap.appendChild(name);
      wrap.appendChild(tier);
      a.appendChild(wrap);

      target.appendChild(a);
    }

    function renderError(target, info) {
      target.innerHTML = '';
      target.setAttribute('data-loaded', 'error');
      var span = document.createElement('span');
      span.className = 'credible-badge';
      span.style.color = '#6B7280';
      span.textContent = info.message;
      target.appendChild(span);
    }

    function loadOne(target) {
      var businessId = target.getAttribute('data-business-id');
      var badgeId = target.getAttribute('data-badge-id') || businessId;
      if (!businessId) {
        renderError(target, { message: 'Missing data-business-id' });
        return;
      }
      fetch(api.replace(/\/$/, '') + '/verify/' + encodeURIComponent(badgeId), {
        credentials: 'omit',
        mode: 'cors',
      })
        .then(function (res) {
          if (!res.ok) throw new Error('not-found');
          return res.json();
        })
        .then(function (body) {
          if (!body.success) throw new Error('not-found');
          render(target, {
            businessName: body.data.businessName,
            tier: body.data.badgeType === 'NONE' ? 'Verified' : body.data.badgeType,
            verificationUrl: body.data.verificationUrl,
          });
        })
        .catch(function () {
          renderError(target, { message: 'Badge not available' });
        });
    }

    injectStyles();

    var targets = document.querySelectorAll('.credible-badge');
    targets.forEach(function (t) {
      if (t.getAttribute('data-business-id')) loadOne(t);
    });
  });
})();
