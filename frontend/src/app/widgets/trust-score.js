/* eslint-disable */
/**
 * Credible Trust Score Widget — drop-in client loader.
 *
 * Usage:
 *   <div class="credible-trust-score"
 *        data-business-id="<id>"
 *        data-theme="light|dark"
 *        data-show-details="true|false"></div>
 *   <script async src="https://credible.com/widgets/trust-score.js"></script>
 *
 * Renders a circular gauge with the trust score (0-100) and an optional details
 * panel (review count, verification status, response rate).
 */
(function () {
  if (typeof window === 'undefined') return;
  if (window.__credibleTrustScoreLoaded) return;
  window.__credibleTrustScoreLoaded = true;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var script = document.currentScript || document.querySelector('script[data-credible-trust-score]');
    var api = (script && script.getAttribute('data-api-url')) || 'https://api.credible.com/api/v1';

    var STYLE_ID = 'credible-trust-score-styles';
    function injectStyles() {
      if (document.getElementById(STYLE_ID)) return;
      var css = [
        '.cts{font-family:Inter,Arial,sans-serif;color:#111827;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;max-width:340px;box-sizing:border-box;display:flex;gap:16px;align-items:center}',
        '.cts.dark,.cts.dark .cts-label{color:#f9fafb}',
        '.cts.dark{background:#111827;border-color:#374151}',
        '.cts *{box-sizing:border-box}',
        '.cts-gauge{position:relative;width:88px;height:88px;flex:0 0 88px}',
        '.cts-gauge svg{transform:rotate(-90deg)}',
        '.cts-score{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:22px;line-height:1;color:inherit}',
        '.cts-score sup{font-size:11px;font-weight:500;margin-left:2px;align-self:flex-start;margin-top:6px;color:#6b7280}',
        '.cts-info{display:flex;flex-direction:column;gap:4px;min-width:0}',
        '.cts-title{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;margin-bottom:2px}',
        '.cts-rating{font-weight:600;font-size:14px;color:inherit}',
        '.cts-row{font-size:12px;color:#374151;display:flex;gap:6px;align-items:center}',
        '.cts.dark .cts-row{color:#d1d5db}',
        '.cts-loading{color:#6b7280;font-size:13px}',
      ].join('');
      var tag = document.createElement('style');
      tag.id = STYLE_ID;
      tag.appendChild(document.createTextNode(css));
      document.head.appendChild(tag);
    }

    function colorFor(score) {
      if (score >= 80) return '#10b981';
      if (score >= 60) return '#f59e0b';
      if (score >= 40) return '#f97316';
      return '#ef4444';
    }
    function labelFor(score) {
      if (score >= 80) return 'Excellent';
      if (score >= 60) return 'Good';
      if (score >= 40) return 'Average';
      return 'Needs improvement';
    }

    function buildCard(target, opts, data) {
      target.innerHTML = '';
      target.setAttribute('data-loaded', 'true');
      var root = document.createElement('div');
      root.className = 'cts' + (opts.theme === 'dark' ? ' dark' : '');

      var gauge = document.createElement('div');
      gauge.className = 'cts-gauge';
      var score = Math.max(0, Math.min(100, Number(data.score) || 0));
      var c = 2 * Math.PI * 36; // r=36
      var offset = c * (1 - score / 100);
      gauge.innerHTML =
        '<svg width="88" height="88" viewBox="0 0 88 88">' +
        '<circle cx="44" cy="44" r="36" stroke="#e5e7eb" stroke-width="8" fill="none"/>' +
        '<circle cx="44" cy="44" r="36" stroke="' + colorFor(score) + '" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + offset.toFixed(2) + '"/>' +
        '</svg>';
      var scoreEl = document.createElement('div');
      scoreEl.className = 'cts-score';
      scoreEl.innerHTML = score + '<sup>/100</sup>';
      gauge.appendChild(scoreEl);
      root.appendChild(gauge);

      var info = document.createElement('div');
      info.className = 'cts-info';
      var title = document.createElement('div');
      title.className = 'cts-title';
      title.textContent = 'Trust score';
      info.appendChild(title);
      var rating = document.createElement('div');
      rating.className = 'cts-rating';
      rating.textContent = labelFor(score);
      rating.style.color = colorFor(score);
      info.appendChild(rating);
      if (opts.showDetails === true) {
        var rows = [
          { l: 'Reviews', v: data.reviewCount },
          { l: 'Verified', v: data.isVerified ? '✅' : '❌' },
          { l: 'Response rate', v: (data.responseRate || 0) + '%' },
        ];
        rows.forEach(function (r) {
          var row = document.createElement('div');
          row.className = 'cts-row';
          var l = document.createElement('span');
          l.textContent = r.l + ':';
          var v = document.createElement('span');
          v.textContent = String(r.v);
          row.appendChild(l);
          row.appendChild(v);
          info.appendChild(row);
        });
      }
      root.appendChild(info);

      target.appendChild(root);
    }

    function renderError(target, msg) {
      target.innerHTML = '';
      target.setAttribute('data-loaded', 'error');
      var root = document.createElement('div');
      root.className = 'cts';
      var span = document.createElement('span');
      span.className = 'cts-loading';
      span.textContent = msg;
      root.appendChild(span);
      target.appendChild(root);
    }

    function loadOne(target) {
      var businessId = target.getAttribute('data-business-id');
      if (!businessId) {
        renderError(target, 'Missing data-business-id');
        return;
      }
      var theme = target.getAttribute('data-theme') || 'light';
      var showDetails = target.getAttribute('data-show-details') === 'true';
      var url = api.replace(/\/$/, '') + '/public/business/' + encodeURIComponent(businessId) + '/trust-score';
      fetch(url, { credentials: 'omit', mode: 'cors' })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (body) {
          if (!body || !body.success || !body.data) throw new Error('bad-payload');
          buildCard(target, { theme: theme, showDetails: showDetails }, body.data);
        })
        .catch(function () {
          renderError(target, 'Score unavailable');
        });
    }

    injectStyles();
    document.querySelectorAll('.credible-trust-score[data-business-id]').forEach(loadOne);
  });
})();