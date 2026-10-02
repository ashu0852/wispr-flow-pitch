# Wispr Flow pitch

Live site: https://ashu0852.github.io/wispr-flow-pitch/

Static HTML, CSS, SVG and JavaScript, hosted by GitHub Pages from `main`. No production packages, backend, forms, tracking, or external runtime resources. Fonts and their open-source licenses are included locally.

Spider-Man is a silent guide. Clicking him goes to the next section. The numbered rail provides keyboard-accessible navigation. System reduced-motion settings and the footer's Pause animations control are supported.

## Check locally

Use Node.js 22 or newer:

```sh
npm ci
npx playwright install chromium webkit
npm run check
npm test
TEST_ENGINE=webkit npm test
```

If using an existing Google Chrome installation, run `CHROME_CHANNEL=chrome npm test`.

The checks start a temporary local static server. To run against the deployed site, set `SITE_URL=https://ashu0852.github.io/wispr-flow-pitch/`. Browser zoom is tested through equivalent CSS viewports, not physical laptop hardware or browser UI zoom controls.

## Publish

Commit reviewed changes and push `main`; GitHub Pages builds automatically. Verify the build and public URL before sharing. Local backups and `node_modules` are ignored by Git.

See [QA.md](QA.md) for the validation scope and hosting limitations.
