# SVG Optimizer

Client-side SVG optimizer with configurable transformations. Paste or upload an SVG, choose which optimizations to apply, and download the result — all in the browser, no server required.

**Live demo**: https://sen.ltd/portfolio/svg-optimizer/

## Features

- **Paste or upload** SVG content
- **Configurable optimizations** — toggle each one independently:
  - Remove comments
  - Remove XML declaration and DOCTYPE
  - Collapse whitespace
  - Remove empty attributes
  - Remove default attribute values (`opacity="1"`, `stroke="none"`, etc.)
  - Round numbers to configurable decimal places
  - Remove metadata / title / desc
  - Remove editor IDs (Sketch, Figma, Inkscape attributes)
  - Remove unused namespace declarations
  - Minify (final whitespace removal pass)
- **Visual diff** — side-by-side original vs optimized preview
- **Size stats** — original bytes, optimized bytes, savings %
- **Download** optimized SVG
- **Copy** to clipboard
- **Japanese / English UI**
- **Dark / light theme**
- Zero dependencies, no build step

## Usage

### Browser

```sh
npm run serve
# Open http://localhost:8080
```

### Tests

```sh
node --test tests/optimizer.test.js
```

## File structure

```
svg-optimizer/
├── index.html         # Main app
├── style.css          # All styles (light + dark theme)
├── src/
│   ├── main.js        # DOM, events, rendering
│   ├── optimizer.js   # Pure optimization functions
│   └── i18n.js        # ja/en translations
├── tests/
│   └── optimizer.test.js
├── package.json
├── LICENSE
└── README.md
```

## API

All optimizer functions are pure string transformations exported from `src/optimizer.js`:

```js
import {
  removeComments,
  removeXMLDeclaration,
  removeDoctype,
  collapseWhitespace,
  removeEmptyAttrs,
  removeDefaultAttrs,
  roundNumbers,
  removeMetadata,
  removeEditorIds,
  removeUnusedNamespaces,
  minify,
  optimize,         // apply selected optimizations
  getSizeStats,     // { originalBytes, optimizedBytes, savedBytes, savedPercent }
  defaultOptions,
} from './src/optimizer.js';

const result = optimize(svgString, {
  removeComments: true,
  roundNumbers: true,
  roundDecimals: 2,
  minify: false,
  // ... all options
});

const stats = getSizeStats(original, result);
console.log(`Saved ${stats.savedPercent}%`);
```

## License

MIT © 2026 SEN LLC (SEN 合同会社)

<!-- sen-publish:links -->
## Links

- 🌐 Demo: https://sen.ltd/portfolio/svg-optimizer/
- 📝 dev.to: https://dev.to/sendotltd/a-client-side-svg-optimizer-that-never-sends-your-files-anywhere-4pad
<!-- /sen-publish:links -->
