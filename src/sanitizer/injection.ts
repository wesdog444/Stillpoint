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
  const ruleScript = rule.script ?? '';

  return `(function() {
  try {
    var selectors = ${selectorsLiteral};
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
    }
    cleanStillpointSurfaces();
    setInterval(cleanStillpointSurfaces, 1200);
    ${ruleScript}
  } catch (e) {}
})();
true;`;
}
