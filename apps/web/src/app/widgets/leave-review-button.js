/* eslint-disable */
/**
 * Credible "Leave a Review" Button Widget — drop-in CTA.
 *
 * Usage:
 *   <div class="credible-leave-review"
 *        data-business-id="<id>"
 *        data-business-slug="<slug>"
 *        data-text="Leave a review"
 *        data-color="blue|green|black"
 *        data-size="sm|md|lg"></div>
 *   <script async src="https://credible.com/widgets/leave-review-button.js"></script>
 */
(function () {
  if (typeof window === 'undefined') return;
  if (window.__credibleLeaveReviewLoaded) return;
  window.__credibleLeaveReviewLoaded = true;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var STYLE_ID = 'credible-leave-review-styles';
    function injectStyles() {
      if (document.getElementById(STYLE_ID)) return;
      var css = [
        '.clr-btn{font-family:Inter,Arial,sans-serif;border:none;border-radius:8px;cursor:pointer;font-weight:600;display:inline-flex;align-items:center;gap:8px;text-decoration:none;transition:filter .15s ease}',
        '.clr-btn:hover{filter:brightness(0.95)}',
        '.clr-sm{padding:6px 10px;font-size:13px}',
        '.clr-md{padding:8px 14px;font-size:14px}',
        '.clr-lg{padding:10px 18px;font-size:16px}',
        '.clr-blue{background:#1a56db;color:#fff}',
        '.clr-green{background:#10b981;color:#fff}',
        '.clr-black{background:#111827;color:#fff}',
      ].join('');
      var tag = document.createElement('style');
      tag.id = STYLE_ID;
      tag.appendChild(document.createTextNode(css));
      document.head.appendChild(tag);
    }

    function build(target, opts) {
      target.innerHTML = '';
      target.setAttribute('data-loaded', 'true');
      var a = document.createElement('a');
      var slug = opts.slug || opts.businessId;
      a.className =
        'clr-btn clr-' + (opts.color || 'blue') + ' clr-' + (opts.size || 'md');
      a.textContent = '★ ' + (opts.text || 'Leave a review');
      var url = 'https://credible.com/submit-review/' + encodeURIComponent(slug) + '?utm_source=widget';
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      target.appendChild(a);
    }

    function loadOne(target) {
      var businessId = target.getAttribute('data-business-id');
      var slug = target.getAttribute('data-business-slug') || businessId;
      if (!businessId && !slug) return;
      build(target, {
        text: target.getAttribute('data-text'),
        color: target.getAttribute('data-color') || 'blue',
        size: target.getAttribute('data-size') || 'md',
        businessId: businessId,
        slug: slug,
      });
    }

    injectStyles();
    document
      .querySelectorAll('.credible-leave-review')
      .forEach(function (t) {
        if (t.getAttribute('data-business-id') || t.getAttribute('data-business-slug')) loadOne(t);
      });
  });
})();