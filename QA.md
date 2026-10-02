# Release checks — 3 October 2026

## Responsive layout and browser coverage

Tested in installed Google Chrome (Chromium) and Playwright WebKit (Safari's rendering engine). The automated suite checks 15 CSS viewports per engine: 320×568, 390×844, 768×1024, 1024×640, 1280×720, 1366×768, 1440×900, 1600×900, 1708×960, 1800×1125, 2400×1350, 1093×614, 911×512, 683×384 and 455×256.

These include layout equivalents for laptop zoom at 80%, 125%, 150%, 200% and 300%. Physical laptop size does not determine CSS layout; available viewport dimensions and scaling do. This is browser-engine testing, not a claim of testing every device or using each browser's zoom UI.

- No page or tested card/text overflow in the matrix. The narrow scoreboard intentionally scrolls horizontally and is keyboard focusable.
- Six route stops occupy six desktop columns and stack on narrow windows.
- Reviewed desktop, 80%-equivalent hero/route, and mobile calculator screenshots.
- Spider-Man narration, greeting, voice toggle and speech bubbles removed. The personal voice-note example remains user initiated.
- Silent guide navigation, landing, resize cancellation, safe placement, and motion pause tested. He hides when there is no clear space and while the viewport is scrolling.

## Functional and accessibility checks

- Filler-word game, before/after controls, seven model switches, reset and extreme India-share inputs.
- All eight interview questions and responses.
- Week tabs with arrow/Home/End keys; focusable transcript, audio seek control and scoreboard.
- Voice-note play/pause and keyboard seeking.
- Internal anchor destinations, local resource responses and no unexpected external resource requests.
- Reduced-motion and no-JavaScript readable-content fallback.
- Automated axe-core WCAG 2 A/AA and 2.1 AA checks: zero reported violations in the tested states. This does not certify universal accessibility.
- No JavaScript exceptions in the tested flows.

## Security and privacy

- HTTPS enforced by GitHub Pages; the live host supplies HSTS.
- Early Content Security Policy restricts scripts, fonts, media, images and connections to this origin; objects, frames, workers, forms and base-URL changes are blocked.
- Harmless injection tests confirm inline scripts and inline event handlers are blocked.
- Styles allow inline declarations because the SVG animation and charts set styles dynamically; script execution does not allow `unsafe-inline` or `unsafe-eval`.
- Fonts are self-hosted, removing the Google Fonts runtime connection. No analytics, cookies, local-storage tracking, remote scripts, authentication, payment or data-submission endpoints.
- External new-tab links use `noopener noreferrer`, and the page sets a no-referrer policy.
- Dynamic HTML uses fixed local content, numeric values or escaped text; no URL/query-string or remote input is interpolated into HTML.
- `npm audit` reports zero known vulnerabilities, including development tooling. There are no production npm dependencies.
- Local backups, dependency folders and credentials are not committed for deployment.

## Limits that remain

GitHub Pages does not provide project-level custom response headers. The HTML policy cannot supply header-only protections such as `frame-ancestors`, `X-Frame-Options`, `X-Content-Type-Options` or `Permissions-Policy`. Those would require a host/proxy with configurable response headers. A meta tag is not a substitute for `frame-ancestors`: see [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors). HTTPS enforcement follows [GitHub's Pages guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).

The four cited source/job links returned HTTP 200 during the check. LinkedIn returned its automated-access block (999), so that external profile could not be verified automatically. External pages can change independently.

This is a targeted code, dependency, browser and accessibility audit, not a penetration test or a guarantee that every possible defect or vulnerability has been eliminated. The application content and business estimates were preserved; the underlying business claims were not independently re-researched in this release.
