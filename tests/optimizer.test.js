/**
 * optimizer.test.js — Tests for optimizer.js
 * Run: node --test tests/optimizer.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Node.js doesn't have TextEncoder in older versions — polyfill if needed
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder } = await import('node:util');
  globalThis.TextEncoder = TextEncoder;
}

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
  optimize,
  getSizeStats,
} from '../src/optimizer.js';

// ── removeComments ────────────────────────────────────────────────────────────
describe('removeComments', () => {
  it('removes a single comment', () => {
    const svg = '<svg><!-- a comment --><rect/></svg>';
    assert.equal(removeComments(svg), '<svg><rect/></svg>');
  });

  it('removes multiple comments', () => {
    const svg = '<svg><!-- first --><!-- second --><rect/></svg>';
    assert.equal(removeComments(svg), '<svg><rect/></svg>');
  });

  it('removes multiline comment', () => {
    const svg = '<svg><!--\n  multiline\n  comment\n--><rect/></svg>';
    assert.equal(removeComments(svg), '<svg><rect/></svg>');
  });

  it('returns original when no comments present', () => {
    const svg = '<svg><rect width="10" height="10"/></svg>';
    assert.equal(removeComments(svg), svg);
  });

  it('handles empty string', () => {
    assert.equal(removeComments(''), '');
  });
});

// ── removeXMLDeclaration ──────────────────────────────────────────────────────
describe('removeXMLDeclaration', () => {
  it('removes standard XML declaration', () => {
    const svg = '<?xml version="1.0" encoding="UTF-8"?>\n<svg></svg>';
    const result = removeXMLDeclaration(svg);
    assert.ok(!result.includes('<?xml'));
    assert.ok(result.includes('<svg>'));
  });

  it('removes standalone declaration', () => {
    const svg = '<?xml version="1.0" standalone="no"?><svg></svg>';
    assert.ok(!removeXMLDeclaration(svg).includes('<?xml'));
  });

  it('does nothing if no declaration', () => {
    const svg = '<svg><path d="M0 0"/></svg>';
    assert.equal(removeXMLDeclaration(svg), svg);
  });
});

// ── removeDoctype ─────────────────────────────────────────────────────────────
describe('removeDoctype', () => {
  it('removes DOCTYPE declaration', () => {
    const svg = '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg></svg>';
    const result = removeDoctype(svg);
    assert.ok(!result.includes('<!DOCTYPE'));
    assert.ok(result.includes('<svg>'));
  });

  it('does nothing if no DOCTYPE', () => {
    const svg = '<svg><rect/></svg>';
    assert.equal(removeDoctype(svg), svg);
  });
});

// ── collapseWhitespace ────────────────────────────────────────────────────────
describe('collapseWhitespace', () => {
  it('collapses multiple spaces to one', () => {
    const svg = '<svg   width="100"   height="100"/>';
    const result = collapseWhitespace(svg);
    assert.ok(!result.includes('   '));
  });

  it('removes whitespace between tags', () => {
    const svg = '<svg>\n  <rect/>\n</svg>';
    const result = collapseWhitespace(svg);
    assert.ok(!result.includes('  '));
    assert.ok(result.includes('<rect/>'));
  });

  it('trims leading/trailing whitespace', () => {
    const svg = '  <svg></svg>  ';
    assert.equal(collapseWhitespace(svg).trim(), '<svg></svg>');
  });
});

// ── removeEmptyAttrs ──────────────────────────────────────────────────────────
describe('removeEmptyAttrs', () => {
  it('removes empty string attributes', () => {
    const svg = '<rect id="" class="box" stroke=""/>';
    const result = removeEmptyAttrs(svg);
    assert.ok(!result.includes('id=""'));
    assert.ok(!result.includes('stroke=""'));
    assert.ok(result.includes('class="box"'));
  });

  it('does not remove non-empty attributes', () => {
    const svg = '<rect id="r1" width="10"/>';
    assert.equal(removeEmptyAttrs(svg), svg);
  });
});

// ── removeDefaultAttrs ────────────────────────────────────────────────────────
describe('removeDefaultAttrs', () => {
  it('removes opacity="1"', () => {
    const svg = '<rect opacity="1" width="10"/>';
    const result = removeDefaultAttrs(svg);
    assert.ok(!result.includes('opacity="1"'));
    assert.ok(result.includes('width="10"'));
  });

  it('removes fill-opacity="1"', () => {
    const svg = '<path fill-opacity="1" d="M0 0"/>';
    assert.ok(!removeDefaultAttrs(svg).includes('fill-opacity="1"'));
  });

  it('removes stroke="none"', () => {
    const svg = '<circle stroke="none" r="5"/>';
    assert.ok(!removeDefaultAttrs(svg).includes('stroke="none"'));
  });

  it('removes display="inline"', () => {
    const svg = '<g display="inline"><rect/></g>';
    assert.ok(!removeDefaultAttrs(svg).includes('display="inline"'));
  });

  it('preserves non-default values', () => {
    const svg = '<rect opacity="0.5" fill-opacity="0.8"/>';
    const result = removeDefaultAttrs(svg);
    assert.ok(result.includes('opacity="0.5"'));
    assert.ok(result.includes('fill-opacity="0.8"'));
  });
});

// ── roundNumbers ─────────────────────────────────────────────────────────────
describe('roundNumbers', () => {
  it('rounds float to 2 decimals by default', () => {
    const svg = '<path d="M1.23456 7.89012"/>';
    const result = roundNumbers(svg, 2);
    assert.ok(result.includes('1.23'));
    assert.ok(result.includes('7.89'));
    assert.ok(!result.includes('1.234'));
  });

  it('rounds to 0 decimals (integers)', () => {
    const svg = '<rect x="1.7" y="2.3" width="10.999"/>';
    const result = roundNumbers(svg, 0);
    assert.ok(result.includes('x="2"'));
    assert.ok(result.includes('y="2"'));
    assert.ok(result.includes('width="11"'));
  });

  it('keeps integers unchanged', () => {
    const svg = '<rect x="10" y="20"/>';
    const result = roundNumbers(svg, 2);
    assert.ok(result.includes('x="10"'));
    assert.ok(result.includes('y="20"'));
  });

  it('rounds to 3 decimals when specified', () => {
    const svg = '<path d="M1.23456789"/>';
    const result = roundNumbers(svg, 3);
    assert.ok(result.includes('1.235'));
  });

  it('handles negative numbers', () => {
    const svg = '<path d="M-1.23456"/>';
    const result = roundNumbers(svg, 2);
    assert.ok(result.includes('-1.23'));
  });
});

// ── removeMetadata ────────────────────────────────────────────────────────────
describe('removeMetadata', () => {
  it('removes <metadata> element', () => {
    const svg = '<svg><metadata><rdf:RDF/></metadata><rect/></svg>';
    assert.ok(!removeMetadata(svg).includes('<metadata>'));
  });

  it('removes <title> element', () => {
    const svg = '<svg><title>My Icon</title><rect/></svg>';
    const result = removeMetadata(svg);
    assert.ok(!result.includes('<title>'));
    assert.ok(!result.includes('My Icon'));
    assert.ok(result.includes('<rect/>'));
  });

  it('removes <desc> element', () => {
    const svg = '<svg><desc>A description</desc><path d="M0 0"/></svg>';
    const result = removeMetadata(svg);
    assert.ok(!result.includes('<desc>'));
    assert.ok(!result.includes('A description'));
  });

  it('removes all three at once', () => {
    const svg = '<svg><title>T</title><desc>D</desc><metadata>M</metadata><g/></svg>';
    const result = removeMetadata(svg);
    assert.ok(!result.includes('<title>'));
    assert.ok(!result.includes('<desc>'));
    assert.ok(!result.includes('<metadata>'));
    assert.ok(result.includes('<g/>'));
  });
});

// ── collapseWhitespace edge ───────────────────────────────────────────────────
describe('collapseWhitespace edge cases', () => {
  it('handles already collapsed input', () => {
    const svg = '<svg><rect/></svg>';
    const result = collapseWhitespace(svg);
    assert.equal(result, svg);
  });
});

// ── minify ────────────────────────────────────────────────────────────────────
describe('minify', () => {
  it('reduces size of formatted SVG', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="100">
      <rect
        x="10"
        y="10"
        width="80"
        height="80"
        fill="red"
      />
    </svg>`;
    const result = minify(svg);
    assert.ok(result.length < svg.length);
  });

  it('removes spaces between tags', () => {
    const svg = '<svg> <rect/> <circle/> </svg>';
    const result = minify(svg);
    assert.ok(!result.includes('> <'));
  });

  it('removes space before self-closing tag', () => {
    const svg = '<rect width="10" />';
    const result = minify(svg);
    assert.equal(result, '<rect width="10"/>');
  });
});

// ── getSizeStats ──────────────────────────────────────────────────────────────
describe('getSizeStats', () => {
  it('returns correct byte counts', () => {
    const original = '<svg><!-- comment --><rect/></svg>';
    const optimized = '<svg><rect/></svg>';
    const stats = getSizeStats(original, optimized);
    assert.ok(stats.originalBytes > stats.optimizedBytes);
    assert.ok(stats.savedBytes > 0);
  });

  it('savedPercent is positive when optimized is smaller', () => {
    const original = 'a'.repeat(100);
    const optimized = 'a'.repeat(50);
    const stats = getSizeStats(original, optimized);
    assert.equal(stats.savedPercent, 50);
  });

  it('savedPercent is 0 for identical strings', () => {
    const svg = '<svg><rect/></svg>';
    const stats = getSizeStats(svg, svg);
    assert.equal(stats.savedBytes, 0);
    assert.equal(stats.savedPercent, 0);
  });

  it('handles empty original gracefully', () => {
    const stats = getSizeStats('', '');
    assert.equal(stats.savedPercent, 0);
    assert.equal(stats.originalBytes, 0);
  });

  it('originalBytes equals length for ASCII strings', () => {
    const svg = '<svg><rect/></svg>';
    const stats = getSizeStats(svg, svg);
    assert.equal(stats.originalBytes, svg.length);
  });
});

// ── optimize (integration) ────────────────────────────────────────────────────
describe('optimize', () => {
  const fullSvg = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="100" height="100" viewBox="0 0 100 100"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape">
  <!-- Generated by Inkscape -->
  <title>My Icon</title>
  <desc>A test SVG icon</desc>
  <metadata><rdf:RDF/></metadata>
  <rect id="layer1" x="10.12345" y="20.98765" width="80.00001" height="80.99999"
        fill="black" opacity="1" stroke="none" display="inline" empty=""/>
</svg>`;

  it('applies all default optimizations', () => {
    const result = optimize(fullSvg);
    assert.ok(!result.includes('<?xml'));
    assert.ok(!result.includes('<!DOCTYPE'));
    assert.ok(!result.includes('<!-- Generated'));
    assert.ok(!result.includes('<title>'));
    assert.ok(!result.includes('<desc>'));
    assert.ok(!result.includes('<metadata>'));
  });

  it('removes empty attrs in default mode', () => {
    const result = optimize(fullSvg);
    assert.ok(!result.includes('empty=""'));
  });

  it('produces smaller output than input', () => {
    const result = optimize(fullSvg);
    assert.ok(result.length < fullSvg.length);
  });

  it('respects disabled options', () => {
    const result = optimize(fullSvg, { removeComments: false, removeXMLDeclaration: false });
    assert.ok(result.includes('<?xml'));
    assert.ok(result.includes('<!-- Generated'));
  });

  it('handles empty string input', () => {
    const result = optimize('');
    assert.equal(result, '');
  });

  it('handles SVG with no optimizable content', () => {
    const svg = '<svg><rect fill="blue"/></svg>';
    const result = optimize(svg);
    // Should at least return valid SVG-like content
    assert.ok(result.includes('<svg>'));
    assert.ok(result.includes('<rect'));
  });

  it('rounds numbers when roundNumbers is enabled', () => {
    const svg = '<svg><rect x="1.23456" y="7.89012"/></svg>';
    const result = optimize(svg, { roundNumbers: true, roundDecimals: 2 });
    assert.ok(result.includes('1.23'));
    assert.ok(result.includes('7.89'));
  });

  it('does not round numbers when disabled', () => {
    const svg = '<svg><rect x="1.23456"/></svg>';
    const result = optimize(svg, { roundNumbers: false });
    assert.ok(result.includes('1.23456'));
  });
});

// ── removeEditorIds ────────────────────────────────────────────────────────────
describe('removeEditorIds', () => {
  it('removes Inkscape-specific attributes', () => {
    const svg = '<svg><g inkscape:label="Layer 1" inkscape:groupmode="layer"><rect/></g></svg>';
    const result = removeEditorIds(svg);
    assert.ok(!result.includes('inkscape:label'));
    assert.ok(!result.includes('inkscape:groupmode'));
  });

  it('removes Sketch type attribute', () => {
    const svg = '<g sketch:type="MSLayerGroup"><rect/></g>';
    const result = removeEditorIds(svg);
    assert.ok(!result.includes('sketch:type'));
  });

  it('removes common layer IDs', () => {
    const svg = '<g id="layer1"><rect/></g>';
    const result = removeEditorIds(svg);
    assert.ok(!result.includes('id="layer1"'));
  });

  it('preserves semantic IDs', () => {
    const svg = '<rect id="main-content"/>';
    const result = removeEditorIds(svg);
    assert.ok(result.includes('id="main-content"'));
  });
});

// ── removeUnusedNamespaces ────────────────────────────────────────────────────
describe('removeUnusedNamespaces', () => {
  it('removes namespace not used in document', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:dc="http://purl.org/dc/elements/1.1/"><rect/></svg>';
    const result = removeUnusedNamespaces(svg);
    assert.ok(!result.includes('xmlns:dc'));
  });

  it('keeps namespace that is used', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><image xlink:href="img.png"/></svg>';
    const result = removeUnusedNamespaces(svg);
    assert.ok(result.includes('xmlns:xlink'));
  });
});
