// Microsoft Clarity loader
// Load Clarity on all environments except local development and staging.
// ID resolution order:
//  - window.__CLARITY_ID__ (runtime override)
//  - import.meta.env.VITE_CLARITY_ID (build-time env)
//  - hardcoded fallback (provided by user)
try {
  const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
  if (isBrowser) {
    const hostname = window.location.hostname || "";
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
    const isStaging = hostname === "staging.swiper.fit";
    const shouldLoadClarity = !isLocal && !isStaging;

    const clarityId = (window.__CLARITY_ID__ || import.meta.env.VITE_CLARITY_ID || "theg96gjel");

    if (shouldLoadClarity && clarityId && !window.clarity) {
      (function (c, l, a, r, i, t, y) {
        c[a] = c[a] || function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
        t = l.createElement(r);
        t.async = 1;
        t.src = "https://www.clarity.ms/tag/" + i;
        y = l.getElementsByTagName(r)[0];
        y.parentNode.insertBefore(t, y);
      })(window, document, "clarity", "script", clarityId);
    }
  }
} catch (_) {
  // no-op
}


