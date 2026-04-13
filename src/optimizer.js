/**
 * optimizer.js — Pure SVG optimization functions (string-based, no DOM required)
 * All functions are pure transformations: string → string
 */

/**
 * Remove HTML/XML comments: <!-- ... -->
 * @param {string} svg
 * @returns {string}
 */
export function removeComments(svg) {
  return svg.replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * Remove XML declaration: <?xml ... ?>
 * @param {string} svg
 * @returns {string}
 */
export function removeXMLDeclaration(svg) {
  return svg.replace(/<\?xml[\s\S]*?\?>/gi, '');
}

/**
 * Remove DOCTYPE declaration: <!DOCTYPE ... >
 * @param {string} svg
 * @returns {string}
 */
export function removeDoctype(svg) {
  return svg.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
}

/**
 * Collapse multiple whitespace/newlines into a single space.
 * Preserves single spaces between attributes.
 * @param {string} svg
 * @returns {string}
 */
export function collapseWhitespace(svg) {
  // Collapse whitespace between tags
  return svg
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Remove empty attributes: attr=""
 * @param {string} svg
 * @returns {string}
 */
export function removeEmptyAttrs(svg) {
  return svg.replace(/\s+[\w:.-]+=(?:""|'')/g, '');
}

/**
 * Remove default attribute values that SVG uses as defaults.
 * Common defaults: opacity="1", fill-opacity="1", stroke="none", stroke-width="1",
 * display="inline", visibility="visible", overflow="visible",
 * fill-rule="nonzero", clip-rule="nonzero"
 * @param {string} svg
 * @returns {string}
 */
export function removeDefaultAttrs(svg) {
  const defaults = [
    // opacity defaults
    /\s+opacity="1(?:\.0+)?"/g,
    /\s+fill-opacity="1(?:\.0+)?"/g,
    /\s+stroke-opacity="1(?:\.0+)?"/g,
    // stroke defaults
    /\s+stroke="none"/g,
    /\s+stroke-width="1(?:\.0+)?"/g,
    /\s+stroke-linecap="butt"/g,
    /\s+stroke-linejoin="miter"/g,
    /\s+stroke-miterlimit="4(?:\.0+)?"/g,
    /\s+stroke-dasharray="none"/g,
    /\s+stroke-dashoffset="0(?:\.0+)?"/g,
    // fill defaults
    /\s+fill-rule="nonzero"/g,
    /\s+clip-rule="nonzero"/g,
    // visibility
    /\s+display="inline"/g,
    /\s+visibility="visible"/g,
    /\s+overflow="visible"/g,
    /\s+pointer-events="visiblePainted"/g,
    // color interpolation
    /\s+color-interpolation="sRGB"/g,
    /\s+color-interpolation-filters="linearRGB"/g,
    // paint order
    /\s+paint-order="normal"/g,
  ];
  let result = svg;
  for (const pattern of defaults) {
    result = result.replace(pattern, '');
  }
  return result;
}

/**
 * Round numeric values in SVG attributes to the given decimal places.
 * Affects attributes like d, x, y, width, height, r, cx, cy, viewBox, etc.
 * @param {string} svg
 * @param {number} decimals
 * @returns {string}
 */
export function roundNumbers(svg, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return svg.replace(/(-?\d+\.\d+)/g, (match) => {
    const rounded = Math.round(parseFloat(match) * factor) / factor;
    // Remove trailing zeros after decimal point if they're all zero
    return String(rounded);
  });
}

/**
 * Remove <metadata>, <title>, and <desc> elements and their content.
 * @param {string} svg
 * @returns {string}
 */
export function removeMetadata(svg) {
  return svg
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, '')
    .replace(/<title[\s\S]*?<\/title>/gi, '')
    .replace(/<desc[\s\S]*?<\/desc>/gi, '');
}

/**
 * Remove editor-specific IDs and attributes.
 * Targets common patterns from Inkscape, Sketch, Figma, Illustrator.
 * @param {string} svg
 * @returns {string}
 */
export function removeEditorIds(svg) {
  let result = svg;

  // Remove Inkscape-specific attributes
  result = result.replace(/\s+inkscape:[\w-]+="[^"]*"/g, '');
  result = result.replace(/\s+sodipodi:[\w-]+="[^"]*"/g, '');

  // Remove Sketch-specific attributes
  result = result.replace(/\s+sketch:type="[^"]*"/g, '');
  result = result.replace(/\s+data-sketch-[\w-]+="[^"]*"/g, '');

  // Remove Figma-specific attributes
  result = result.replace(/\s+data-figma-[\w-]+="[^"]*"/g, '');
  result = result.replace(/\s+figma-[\w-]+="[^"]*"/g, '');

  // Remove Illustrator-specific attributes
  result = result.replace(/\s+i:[\w-]+="[^"]*"/g, '');
  result = result.replace(/\s+illustrator:[\w-]+="[^"]*"/g, '');
  result = result.replace(/\s+x:xmpmeta[\s\S]*?<\/x:xmpmeta>/g, '');

  // Remove common editor-generated layer/group IDs like layer1, layer2, Layer_1
  // and Sketch/Figma IDs like "Bitmap", "Group", "Rectangle-Copy"
  result = result.replace(/\s+id="(?:layer\d+|Layer_\d+|Bitmap|Group[-\w]*|Rectangle[-\w]*|Path[-\w]*|Oval[-\w]*|Text[-\w]*)"/gi, '');

  return result;
}

/**
 * Remove unused namespace declarations from the <svg> element.
 * Detects which namespace prefixes are actually used in the document.
 * @param {string} svg
 * @returns {string}
 */
export function removeUnusedNamespaces(svg) {
  // Find all namespace declarations in the svg element
  const nsDeclPattern = /\s+xmlns:([\w-]+)="([^"]*)"/g;
  const declared = [];
  let match;
  while ((match = nsDeclPattern.exec(svg)) !== null) {
    declared.push({ prefix: match[1], decl: match[0] });
  }

  let result = svg;
  for (const { prefix, decl } of declared) {
    // Check if the prefix is used anywhere (as attribute prefix or element prefix)
    const usagePattern = new RegExp(`(?:^|[^\\w])${prefix}:`, 'g');
    // Count uses outside the declaration itself
    const withoutDecl = svg.replace(decl, '');
    if (!usagePattern.test(withoutDecl)) {
      result = result.replace(decl, '');
    }
  }
  return result;
}

/**
 * Minify SVG: remove all non-essential whitespace around tags,
 * leading/trailing whitespace per line, etc.
 * @param {string} svg
 * @returns {string}
 */
export function minify(svg) {
  return svg
    .replace(/\r\n|\r|\n/g, ' ')   // flatten newlines
    .replace(/>\s+</g, '><')        // remove space between tags
    .replace(/\s{2,}/g, ' ')        // collapse multiple spaces
    .replace(/\s*\/>/g, '/>')       // remove space before />
    .replace(/\s*>/g, '>')          // remove space before >
    .replace(/="\s+/g, '="')        // remove space after ="
    .replace(/\s+"/g, '"')          // remove space before closing "
    .trim();
}

/**
 * @typedef {Object} OptimizeOptions
 * @property {boolean} [removeComments]          - Remove HTML comments (default: true)
 * @property {boolean} [removeXMLDeclaration]    - Remove <?xml?> (default: true)
 * @property {boolean} [removeDoctype]           - Remove <!DOCTYPE> (default: true)
 * @property {boolean} [collapseWhitespace]      - Collapse whitespace (default: true)
 * @property {boolean} [removeEmptyAttrs]        - Remove empty attributes (default: true)
 * @property {boolean} [removeDefaultAttrs]      - Remove default attribute values (default: true)
 * @property {boolean} [roundNumbers]            - Round numbers (default: true)
 * @property {number}  [roundDecimals]           - Decimal places for rounding (default: 2)
 * @property {boolean} [removeMetadata]          - Remove metadata/title/desc (default: true)
 * @property {boolean} [removeEditorIds]         - Remove editor IDs (default: true)
 * @property {boolean} [removeUnusedNamespaces]  - Remove unused namespaces (default: true)
 * @property {boolean} [minify]                  - Final minification pass (default: false)
 */

/** @type {OptimizeOptions} */
export const defaultOptions = {
  removeComments: true,
  removeXMLDeclaration: true,
  removeDoctype: true,
  collapseWhitespace: true,
  removeEmptyAttrs: true,
  removeDefaultAttrs: true,
  roundNumbers: true,
  roundDecimals: 2,
  removeMetadata: true,
  removeEditorIds: true,
  removeUnusedNamespaces: true,
  minify: false,
};

/**
 * Apply selected optimizations to an SVG string.
 * @param {string} svg
 * @param {OptimizeOptions} [options]
 * @returns {string}
 */
export function optimize(svg, options = {}) {
  const opts = { ...defaultOptions, ...options };
  let result = svg;

  if (opts.removeComments)         result = removeComments(result);
  if (opts.removeXMLDeclaration)   result = removeXMLDeclaration(result);
  if (opts.removeDoctype)          result = removeDoctype(result);
  if (opts.removeMetadata)         result = removeMetadata(result);
  if (opts.removeEditorIds)        result = removeEditorIds(result);
  if (opts.removeUnusedNamespaces) result = removeUnusedNamespaces(result);
  if (opts.removeEmptyAttrs)       result = removeEmptyAttrs(result);
  if (opts.removeDefaultAttrs)     result = removeDefaultAttrs(result);
  if (opts.roundNumbers)           result = roundNumbers(result, opts.roundDecimals ?? 2);
  if (opts.collapseWhitespace)     result = collapseWhitespace(result);
  if (opts.minify)                 result = minify(result);

  return result;
}

/**
 * Compute size statistics between original and optimized SVG.
 * @param {string} original
 * @param {string} optimized
 * @returns {{ originalBytes: number, optimizedBytes: number, savedBytes: number, savedPercent: number }}
 */
export function getSizeStats(original, optimized) {
  const enc = new TextEncoder();
  const originalBytes = enc.encode(original).length;
  const optimizedBytes = enc.encode(optimized).length;
  const savedBytes = originalBytes - optimizedBytes;
  const savedPercent = originalBytes > 0
    ? Math.round((savedBytes / originalBytes) * 1000) / 10
    : 0;
  return { originalBytes, optimizedBytes, savedBytes, savedPercent };
}
