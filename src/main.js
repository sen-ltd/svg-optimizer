/**
 * main.js — DOM, events, rendering for SVG Optimizer
 */

import { optimize, getSizeStats, defaultOptions } from './optimizer.js';
import { getT } from './i18n.js';

// ── State ────────────────────────────────────────────────────────────────────
let lang = 'en';
let theme = 'light';
let currentSvg = '';
let optimizedSvg = '';

// ── DOM refs ─────────────────────────────────────────────────────────────────
const inputArea       = document.getElementById('input-area');
const outputArea      = document.getElementById('output-area');
const fileInput       = document.getElementById('file-input');
const uploadBtn       = document.getElementById('upload-btn');
const optimizeBtn     = document.getElementById('optimize-btn');
const downloadBtn     = document.getElementById('download-btn');
const copyBtn         = document.getElementById('copy-btn');
const clearBtn        = document.getElementById('clear-btn');
const langToggle      = document.getElementById('lang-toggle');
const themeToggle     = document.getElementById('theme-toggle');
const statsBar        = document.getElementById('stats-bar');
const originalPreview = document.getElementById('preview-original');
const optimizedPreview= document.getElementById('preview-optimized');
const dropZone        = document.getElementById('drop-zone');

// Options checkboxes & round decimals input
const optionKeys = [
  'removeComments', 'removeXMLDeclaration', 'removeDoctype',
  'collapseWhitespace', 'removeEmptyAttrs', 'removeDefaultAttrs',
  'roundNumbers', 'removeMetadata', 'removeEditorIds',
  'removeUnusedNamespaces', 'minify',
];
const roundDecimalsInput = document.getElementById('opt-roundDecimals');

// ── Helpers ──────────────────────────────────────────────────────────────────
function getOptions() {
  const opts = {};
  for (const key of optionKeys) {
    const el = document.getElementById(`opt-${key}`);
    if (el) opts[key] = el.checked;
  }
  opts.roundDecimals = parseInt(roundDecimalsInput?.value ?? '2', 10) || 2;
  return opts;
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

function renderStats(stats) {
  const t = getT(lang);
  const { originalBytes, optimizedBytes, savedBytes, savedPercent } = stats;
  const sign = savedBytes >= 0 ? '-' : '+';
  const absSaved = Math.abs(savedBytes);
  const color = savedBytes >= 0 ? 'var(--color-green)' : 'var(--color-red)';

  statsBar.innerHTML = `
    <span class="stat-item">
      <span class="stat-label">${t.originalLabel}</span>
      <span class="stat-value">${formatBytes(originalBytes)}</span>
    </span>
    <span class="stat-arrow">→</span>
    <span class="stat-item">
      <span class="stat-label">${t.optimizedLabel}</span>
      <span class="stat-value">${formatBytes(optimizedBytes)}</span>
    </span>
    <span class="stat-savings" style="color:${color}">
      ${sign}${formatBytes(absSaved)} (${sign}${Math.abs(savedPercent)}%)
    </span>
  `;
  statsBar.classList.remove('hidden');
}

function clearStats() {
  statsBar.classList.add('hidden');
  statsBar.innerHTML = '';
}

function renderPreview(container, svgStr) {
  container.innerHTML = '';
  if (!svgStr) return;
  const blob = new Blob([svgStr], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const img = document.createElement('img');
  img.src = url;
  img.alt = 'SVG preview';
  img.onload = () => URL.revokeObjectURL(url);
  container.appendChild(img);
}

function doOptimize() {
  const raw = inputArea.value.trim();
  if (!raw) {
    outputArea.value = '';
    clearStats();
    renderPreview(originalPreview, '');
    renderPreview(optimizedPreview, '');
    return;
  }

  currentSvg = raw;
  const options = getOptions();
  optimizedSvg = optimize(currentSvg, options);

  outputArea.value = optimizedSvg;
  renderStats(getSizeStats(currentSvg, optimizedSvg));
  renderPreview(originalPreview, currentSvg);
  renderPreview(optimizedPreview, optimizedSvg);
  downloadBtn.disabled = false;
  copyBtn.disabled = false;
}

function applyTranslations() {
  const t = getT(lang);
  document.title = t.title;
  document.querySelector('.app-title').textContent = t.title;
  document.querySelector('.app-subtitle').textContent = t.subtitle;
  document.querySelector('[data-label="input"]').textContent = t.inputLabel;
  document.querySelector('[data-label="output"]').textContent = t.outputLabel;
  inputArea.placeholder = t.placeholderText;
  uploadBtn.textContent = t.uploadBtn;
  optimizeBtn.textContent = t.optimizeBtn;
  downloadBtn.textContent = t.downloadBtn;
  clearBtn.textContent = t.clearBtn;
  langToggle.textContent = t.langToggle;
  themeToggle.textContent = t.themeToggle;
  document.querySelector('.options-title').textContent = t.optionsTitle;
  document.querySelector('[data-section="preview"]').textContent = t.previewTitle;
  document.querySelector('[data-section="stats"]').textContent = t.statsTitle;
  document.querySelector('.drop-hint').textContent = t.dropHint;

  for (const key of optionKeys) {
    const label = document.querySelector(`label[for="opt-${key}"]`);
    if (label) {
      // Keep the checkbox in place, update text node
      const checkbox = label.querySelector('input[type="checkbox"]');
      if (checkbox) {
        label.textContent = '';
        label.appendChild(checkbox);
        label.append(` ${t.options[key]}`);
      }
    }
  }
  const decimalsLabel = document.querySelector('label[for="opt-roundDecimals"]');
  if (decimalsLabel) {
    decimalsLabel.childNodes.forEach(n => {
      if (n.nodeType === Node.TEXT_NODE) n.remove();
    });
    // Rebuild text around the input
    const inp = decimalsLabel.querySelector('input[type="number"]');
    decimalsLabel.textContent = '';
    decimalsLabel.append(`${t.options.roundDecimals}: `);
    decimalsLabel.appendChild(inp);
  }

  // Copy button
  const t2 = getT(lang);
  if (copyBtn.textContent !== t2.copiedBtn) {
    copyBtn.textContent = t2.copyBtn;
  }
}

// ── Event handlers ────────────────────────────────────────────────────────────
optimizeBtn.addEventListener('click', doOptimize);

inputArea.addEventListener('input', () => {
  // Auto-optimize on paste/type after first use
  if (inputArea.value.trim()) doOptimize();
  else {
    outputArea.value = '';
    clearStats();
    renderPreview(originalPreview, '');
    renderPreview(optimizedPreview, '');
    downloadBtn.disabled = true;
    copyBtn.disabled = true;
  }
});

uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    inputArea.value = e.target.result;
    doOptimize();
  };
  reader.readAsText(file);
});

downloadBtn.addEventListener('click', () => {
  if (!optimizedSvg) return;
  const blob = new Blob([optimizedSvg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'optimized.svg';
  a.click();
  URL.revokeObjectURL(url);
});

copyBtn.addEventListener('click', async () => {
  if (!optimizedSvg) return;
  await navigator.clipboard.writeText(optimizedSvg);
  const t = getT(lang);
  copyBtn.textContent = t.copiedBtn;
  setTimeout(() => { copyBtn.textContent = t.copyBtn; }, 2000);
});

clearBtn.addEventListener('click', () => {
  inputArea.value = '';
  outputArea.value = '';
  optimizedSvg = '';
  clearStats();
  renderPreview(originalPreview, '');
  renderPreview(optimizedPreview, '');
  downloadBtn.disabled = true;
  copyBtn.disabled = true;
});

langToggle.addEventListener('click', () => {
  lang = lang === 'en' ? 'ja' : 'en';
  applyTranslations();
  // Re-render stats if present
  if (optimizedSvg) renderStats(getSizeStats(currentSvg, optimizedSvg));
});

themeToggle.addEventListener('click', () => {
  theme = theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  const t = getT(lang);
  themeToggle.textContent = theme === 'light' ? t.themeToggle : (lang === 'ja' ? 'ライト' : 'Light');
});

// Option change → re-optimize
for (const key of optionKeys) {
  const el = document.getElementById(`opt-${key}`);
  if (el) el.addEventListener('change', doOptimize);
}
roundDecimalsInput?.addEventListener('input', doOptimize);

// Drag & drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    inputArea.value = ev.target.result;
    doOptimize();
  };
  reader.readAsText(file);
});

// ── Init ──────────────────────────────────────────────────────────────────────
// Set default options
for (const [key, val] of Object.entries(defaultOptions)) {
  const el = document.getElementById(`opt-${key}`);
  if (el && el.type === 'checkbox') el.checked = !!val;
}
if (roundDecimalsInput) roundDecimalsInput.value = defaultOptions.roundDecimals ?? 2;

downloadBtn.disabled = true;
copyBtn.disabled = true;

applyTranslations();
