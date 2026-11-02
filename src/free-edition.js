/* MorningBoard — unrestricted personal edition.
 * Removes local subscription UI and exposes every built-in feature.
 * Online collaboration still uses the app's existing Firebase/room flow.
 */
(function () {
  'use strict';

  var alwaysPro = function () { return true; };
  var ignoreUpgrade = function () { return false; };

  function pinGlobal(name, value) {
    try {
      Object.defineProperty(window, name, {
        configurable: false,
        enumerable: true,
        get: function () { return value; },
        set: function () { /* Paid-plan state is disabled in this edition. */ }
      });
    } catch (error) {
      try { window[name] = value; } catch (_) {}
    }
  }

  // These are the feature-entitlement hooks used throughout the whiteboard
  // and PDF page manager. Keep the function available before main.js starts.
  pinGlobal('isProUser', alwaysPro);
  pinGlobal('openProUpgradeModal', ignoreUpgrade);
  window.isPro = true;
  window.__morningBoardFreeEdition = true;

  var removalSelectors = [
    '#login-overlay',
    '#btn-top-subscribe',
    '#btn-choose-pro',
    '#card-choose-pro',
    '#auth-view-plans',
    '#auth-view-already',
    '#box-subscribe-google',
    '#box-subscribe-desktop',
    '#btn-subscribe-google',
    '#btn-activate-submit',
    '.sapah-auth-overlay',
    '.sapah-plans-grid',
    '.sapah-plan-card',
    '.pro-crown-tag',
    '.crown-mini',
    '.pro-badge',
    '.pro-tag',
    '.pro-tag-crown',
    '.pro-crown-icon',
    '.cartoon-card-pro-crown'
  ].join(',');

  function removePaidUi(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.matches && root.matches(removalSelectors)) {
      root.remove();
      return;
    }
    if (root.querySelectorAll) {
      root.querySelectorAll(removalSelectors).forEach(function (element) {
        element.remove();
      });
    }
  }

  function activateFreeEdition() {
    document.documentElement.classList.add('free-edition');
    if (document.body) {
      document.body.classList.add('free-edition', 'is-pro-user', 'is-pro');
      removePaidUi(document.body);
    }

    // Reuse the app's own free-entry path to dismiss the loader and initialize
    // the canvas normally. It also stores the local plan as "free".
    try {
      if (typeof window.enterFreeWhiteboardDirectly === 'function') {
        window.enterFreeWhiteboardDirectly();
      }
    } catch (error) {
      console.warn('[MorningBoard Free Edition] Free startup fallback:', error);
    }

    removePaidUi(document.body);
  }

  var freeStyle = document.createElement('style');
  freeStyle.id = 'morningboard-free-edition-style';
  freeStyle.textContent = [
    '.free-edition .pro-crown-tag,',
    '.free-edition .crown-mini,',
    '.free-edition .pro-badge,',
    '.free-edition .pro-tag,',
    '.free-edition .pro-tag-crown,',
    '.free-edition .pro-crown-icon,',
    '.free-edition #btn-top-subscribe,',
    '.free-edition .sapah-auth-overlay { display: none !important; }'
  ].join('');
  (document.head || document.documentElement).appendChild(freeStyle);

  if (document.readyState === 'complete') {
    activateFreeEdition();
  } else {
    window.addEventListener('load', activateFreeEdition, { once: true });
  }

  // Remove any legacy subscription/upgrade UI if another app module attempts
  // to recreate it later; normal tools and collaboration UI are left untouched.
  if (typeof MutationObserver === 'function') {
    window.addEventListener('load', function () {
      if (!document.body) return;
      var observer = new MutationObserver(function (records) {
        records.forEach(function (record) {
          record.addedNodes.forEach(removePaidUi);
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }, { once: true });
  }
})();
