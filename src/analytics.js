// Microsoft Clarity loader - production only, enabled via VITE_CLARITY_ID
// To exclude staging/preview/demo: set VITE_CLARITY_ID only in Production env
if (import.meta.env.PROD && import.meta.env.VITE_CLARITY_ID) {
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () {
      (c[a].q = c[a].q || []).push(arguments);
    };
    t = l.createElement(r);
    t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", import.meta.env.VITE_CLARITY_ID);
}


