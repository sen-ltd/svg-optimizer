/**
 * i18n.js — Japanese / English translations
 */

export const translations = {
  ja: {
    title: 'SVG 最適化',
    subtitle: 'クライアントサイド SVG オプティマイザ',
    inputLabel: 'SVG 入力',
    outputLabel: '最適化後',
    placeholderText: 'ここに SVG をペーストするか、ファイルをドロップしてください',
    uploadBtn: 'ファイルを選択',
    optimizeBtn: '最適化',
    downloadBtn: 'ダウンロード',
    copyBtn: 'コピー',
    copiedBtn: 'コピー済み',
    clearBtn: 'クリア',
    optionsTitle: '最適化オプション',
    previewTitle: 'プレビュー',
    statsTitle: '統計',
    originalLabel: '元のサイズ',
    optimizedLabel: '最適化後',
    savedLabel: '削減',
    noInput: 'SVG をペーストして最適化してください',
    errorInvalidSVG: '有効な SVG ではありません',
    errorEmpty: '入力が空です',
    options: {
      removeComments: 'コメントを削除',
      removeXMLDeclaration: 'XML 宣言を削除',
      removeDoctype: 'DOCTYPE を削除',
      collapseWhitespace: '空白を折りたたむ',
      removeEmptyAttrs: '空の属性を削除',
      removeDefaultAttrs: 'デフォルト属性値を削除',
      roundNumbers: '数値を丸める',
      roundDecimals: '小数点以下桁数',
      removeMetadata: 'メタデータ / title / desc を削除',
      removeEditorIds: 'エディタ固有 ID を削除（Sketch / Figma / Inkscape）',
      removeUnusedNamespaces: '未使用 namespace を削除',
      minify: '最終 minify パス',
    },
    bytes: 'バイト',
    langToggle: 'EN',
    themeToggle: 'ダーク',
    dropHint: 'SVG ファイルをドラッグ＆ドロップ',
  },
  en: {
    title: 'SVG Optimizer',
    subtitle: 'Client-side SVG optimization tool',
    inputLabel: 'SVG Input',
    outputLabel: 'Optimized',
    placeholderText: 'Paste SVG here or drop a file',
    uploadBtn: 'Choose File',
    optimizeBtn: 'Optimize',
    downloadBtn: 'Download',
    copyBtn: 'Copy',
    copiedBtn: 'Copied',
    clearBtn: 'Clear',
    optionsTitle: 'Optimization Options',
    previewTitle: 'Preview',
    statsTitle: 'Statistics',
    originalLabel: 'Original',
    optimizedLabel: 'Optimized',
    savedLabel: 'Saved',
    noInput: 'Paste an SVG to start optimizing',
    errorInvalidSVG: 'Not a valid SVG',
    errorEmpty: 'Input is empty',
    options: {
      removeComments: 'Remove comments',
      removeXMLDeclaration: 'Remove XML declaration',
      removeDoctype: 'Remove DOCTYPE',
      collapseWhitespace: 'Collapse whitespace',
      removeEmptyAttrs: 'Remove empty attributes',
      removeDefaultAttrs: 'Remove default attribute values',
      roundNumbers: 'Round numbers',
      roundDecimals: 'Decimal places',
      removeMetadata: 'Remove metadata / title / desc',
      removeEditorIds: 'Remove editor IDs (Sketch / Figma / Inkscape)',
      removeUnusedNamespaces: 'Remove unused namespaces',
      minify: 'Final minify pass',
    },
    bytes: 'bytes',
    langToggle: 'JA',
    themeToggle: 'Dark',
    dropHint: 'Drag & drop SVG file here',
  },
};

/**
 * Get translation object for the given language.
 * @param {'ja'|'en'} lang
 * @returns {object}
 */
export function getT(lang) {
  return translations[lang] ?? translations.en;
}
