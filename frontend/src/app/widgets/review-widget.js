/* eslint-disable */
/**
 * Credible Review Widget — drop-in client loader.
 *
 * Usage on third-party sites:
 *
 *   <div class="credible-review-widget"
 *        data-business-id="<id>"
 *        data-theme="light|dark"
 *        data-max-reviews="5"
 *        data-show-rating="true"></div>
 *   <script async src="https://credible.com/widgets/review-widget.js"></script>
 *
 * Fetches `GET /api/v1/public/business/:idOrSlug/widget` and renders an inline
 * summary card with the average rating, review count, and up to N reviews.
 */
(function () {
  if (typeof window === 'undefined') return;
  if (window.__credibleReviewWidgetLoaded) return;
  window.__credibleReviewWidgetLoaded = true;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var script = document.currentScript || document.querySelector('script[data-credible-review-widget]');
    var api = (script && script.getAttribute('data-api-url')) || 'https://api.credible.com/api/v1';

    var STYLE_ID = 'credible-review-widget-styles';
    function injectStyles() {
      if (document.getElementById(STYLE_ID)) return;
      var css = [
        '.crw{font-family:Inter,Arial,sans-serif;color:#111827;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:16px;max-width:420px;box-sizing:border-box}',
        '.crw.dark,.crw.dark .crw-name,.crw.dark .crw-meta{color:#f9fafb}',
        '.crw.dark{background:#111827;border-color:#374151}',
        '.crw *{box-sizing:border-box}',
        '.crw-header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px}',
        '.crw-id{display:flex;align-items:center;gap:8px;min-width:0}',
        '.crw-logo{height:32px;width:32px;border-radius:8px;object-fit:cover;flex:0 0 32px}',
        '.crw-name{font-weight:600;font-size:14px;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        '.crw-meta{font-size:12px;color:#6b7280;display:flex;align-items:center;gap:6px}',
        '.crw-stars{color:#f59e0b;letter-spacing:1px;font-size:14px;line-height:1}',
        '.crw-list{display:flex;flex-direction:column;gap:10px;margin-top:12px;border-top:1px solid #e5e7eb;padding-top:12px}',
        '.crw.dark .crw-list{border-color:#374151}',
        '.crw-item{font-size:13px;line-height:1.4}',
        '.crw-item-head{display:flex;align-items:center;gap:8px;margin-bottom:4px}',
        '.crw-author{font-weight:600;color:#111827}',
        '.crw.dark .crw-author{color:#f9fafb}',
        '.crw-stars-sm{color:#f59e0b;font-size:11px;letter-spacing:1px}',
        '.crw-comment{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#374151}',
        '.crw.dark .crw-comment{color:#d1d5db}',
        '.crw-date{font-size:11px;color:#9ca3af;margin-top:2px}',
        '.crw-footer{margin-top:12px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:11px;color:#6b7280;text-align:right}',
        '.crw.dark .crw-footer{border-color:#374151}',
        '.crw-footer a{color:#1a56db;text-decoration:none}',
        '.crw-footer a:hover{text-decoration:underline}',
        '.crw-loading{color:#6b7280;font-size:13px}',
      ].join('');
      var tag = document.createElement('style');
      tag.id = STYLE_ID;
      tag.appendChild(document.createTextNode(css));
      document.head.appendChild(tag);
    }

    function stars(n) {
      n = Math.round(Number(n) || 0);
      return '★'.repeat(Math.max(0, Math.min(5, n))) + '☆'.repeat(Math.max(0, 5 - n));
    }

    function fmtDate(iso) {
      if (!iso) return '';
      try {
        var d = new Date(iso);
        return d.toLocaleDateString();
      } catch (e) {
        return '';
      }
    }

    function buildCard(target, opts, data) {
      target.innerHTML = '';
      target.setAttribute('data-loaded', 'true');
      var root = document.createElement('div');
      root.className = 'crw' + (opts.theme === 'dark' ? ' dark' : '');

      var header = document.createElement('div');
      header.className = 'crw-header';

      var idWrap = document.createElement('div');
      idWrap.className = 'crw-id';
      if (data.business.logo) {
        var img = document.createElement('img');
        img.className = 'crw-logo';
        img.alt = '';
        img.src = data.business.logo;
        idWrap.appendChild(img);
      }
      var name = document.createElement('div');
      name.className = 'crw-name';
      name.textContent = data.business.name;
      idWrap.appendChild(name);
      header.appendChild(idWrap);

      if (opts.showRating !== false) {
        var meta = document.createElement('div');
        meta.className = 'crw-meta';
        var starsEl = document.createElement('span');
        starsEl.className = 'crw-stars';
        starsEl.textContent = stars(data.business.averageRating);
        starsEl.setAttribute('aria-label', data.business.averageRating + ' out of 5');
        meta.appendChild(starsEl);
        var scoreEl = document.createElement('span');
        scoreEl.textContent = (data.business.averageRating || 0).toFixed(1);
        meta.appendChild(scoreEl);
        var countEl = document.createElement('span');
        countEl.textContent = '(' + (data.business.totalReviews || 0) + ' reviews)';
        meta.appendChild(countEl);
        header.appendChild(meta);
      }
      root.appendChild(header);

      if (Array.isArray(data.reviews) && data.reviews.length > 0) {
        var list = document.createElement('div');
        list.className = 'crw-list';
        data.reviews.slice(0, opts.maxReviews).forEach(function (r) {
          var item = document.createElement('div');
          item.className = 'crw-item';
          var head = document.createElement('div');
          head.className = 'crw-item-head';
          var author = document.createElement('span');
          author.className = 'crw-author';
          author.textContent = r.customerName || 'Anonymous';
          head.appendChild(author);
          var rs = document.createElement('span');
          rs.className = 'crw-stars-sm';
          rs.textContent = stars(r.rating);
          head.appendChild(rs);
          item.appendChild(head);
          var comment = document.createElement('div');
          comment.className = 'crw-comment';
          comment.textContent = r.comment || '';
          item.appendChild(comment);
          var date = document.createElement('div');
          date.className = 'crw-date';
          date.textContent = fmtDate(r.createdAt);
          item.appendChild(date);
          list.appendChild(item);
        });
        root.appendChild(list);
      }

      var footer = document.createElement('div');
      footer.className = 'crw-footer';
      var link = document.createElement('a');
      link.href = (data.business.profileUrl || 'https://credible.com') + '?utm_source=widget';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Powered by Credible';
      footer.appendChild(link);
      root.appendChild(footer);

      target.appendChild(root);
    }

    function renderError(target, msg) {
      target.innerHTML = '';
      target.setAttribute('data-loaded', 'error');
      var root = document.createElement('div');
      root.className = 'crw';
      var span = document.createElement('span');
      span.className = 'crw-loading';
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
      var maxReviews = parseInt(target.getAttribute('data-max-reviews') || '5', 10);
      var showRating = target.getAttribute('data-show-rating') !== 'false';
      var url = api.replace(/\/$/, '') + '/public/business/' + encodeURIComponent(businessId) + '/widget';
      fetch(url, { credentials: 'omit', mode: 'cors' })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (body) {
          if (!body || !body.success || !body.data) throw new Error('bad-payload');
          buildCard(target, { theme: theme, maxReviews: maxReviews, showRating: showRating }, body.data);
        })
        .catch(function () {
          renderError(target, 'Reviews unavailable');
        });
    }

    injectStyles();
    document.querySelectorAll('.credible-review-widget[data-business-id]').forEach(loadOne);
  });
})();
