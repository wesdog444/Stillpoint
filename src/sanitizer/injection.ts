import type { SanitizerRule } from './types';

/**
 * Compiles a sanitizer rule into a single JavaScript string for the WebView's
 * injectedJavaScript prop. The script injects a stylesheet hiding the rule's
 * selectors, then runs the optional rule script.
 */
export function buildInjection(rule: SanitizerRule): string {
  const selectorsLiteral = `[${rule.hideSelectors
    .map((selector) => `'${selector.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`)
    .join(', ')}]`;
  const textBlocklistLiteral = `[${rule.textBlocklist
    .map((label) => `'${label.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`)
    .join(', ')}]`;
  const disableVideos = rule.disableVideoAutoplay ? 'true' : 'false';
  const ruleScript = rule.script ?? '';

  return `(function() {
  try {
    var selectors = ${selectorsLiteral};
    var textBlocklist = ${textBlocklistLiteral};
    var disableVideos = ${disableVideos};
    var css = selectors.join(',\\n') + ' { display: none !important; }';
    var style = document.createElement('style');
    style.setAttribute('data-stillpoint', 'sanitizer');
    style.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(style);
    function cleanStillpointSurfaces() {
      selectors.forEach(function(selector) {
        try {
          document.querySelectorAll(selector).forEach(function(node) {
            node.setAttribute('data-stillpoint-hidden', 'true');
            node.style.setProperty('display', 'none', 'important');
            node.style.setProperty('visibility', 'hidden', 'important');
          });
        } catch (e) {}
      });
      hideByStillpointLabel();
      hideInstagramReelsNav();
      if (disableVideos) disableStillpointVideos();
    }
    function hideNode(node) {
      if (!node || !node.style) return;
      node.setAttribute('data-stillpoint-hidden', 'true');
      node.style.setProperty('display', 'none', 'important');
      node.style.setProperty('visibility', 'hidden', 'important');
    }
    function hideByStillpointLabel() {
      var candidates = document.querySelectorAll('a, button, nav *, [role="button"], [role="link"], h2, h3, span, div');
      candidates.forEach(function(node) {
        var text = (node.innerText || node.textContent || '').trim();
        if (!text) return;
        var matched = textBlocklist.some(function(label) {
          return text.toLowerCase().indexOf(label.toLowerCase()) !== -1;
        });
        if (!matched) return;
        var surface = node.closest('a, button, nav, aside, article, section, [role="tab"], [role="navigation"], [data-e2e], ytd-rich-section-renderer, ytd-reel-shelf-renderer') || node;
        hideNode(surface);
      });
    }
    function hideInstagramReelsNav() {
      var iconNodes = document.querySelectorAll('svg[aria-label*="Reels"], svg[aria-label*="reels"], a[href*="/reels"], a[href*="/reel"]');
      iconNodes.forEach(function(node) {
        var label = (node.getAttribute && (node.getAttribute('aria-label') || node.getAttribute('href'))) || '';
        if (label.toLowerCase().indexOf('reel') === -1 && label.toLowerCase().indexOf('/reels') === -1) return;
        var surface = node.closest('a, button, [role="tab"], [role="button"], nav > *, div') || node;
        hideNode(surface);
      });
    }
    function disableStillpointVideos() {
      document.querySelectorAll('video').forEach(function(video) {
        try {
          video.autoplay = false;
          video.muted = true;
          video.pause();
          video.removeAttribute('autoplay');
        } catch (e) {}
      });
    }
    cleanStillpointSurfaces();
    setInterval(cleanStillpointSurfaces, 1200);
    ${ruleScript}
  } catch (e) {}
})();
true;`;
}
