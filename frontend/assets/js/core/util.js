/* Utilitários puros, usados por todas as telas. Expostos em Lab.util. */
window.Lab = window.Lab || {};
Lab.util = (function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const num = v => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? null : n; };
  const okn = x => typeof x === "number" && isFinite(x);
  const fmt = n => typeof n === "number" ? String(+n.toPrecision(4)).replace(".", ",") : n;   // 4 algarismos significativos
  const fn = n => (Math.round(n * 100) / 100).toString().replace(".", ",");                    // até 2 casas (notas)
  const plain = s => String(s).replace(/<[^>]+>/g, "");                                        // remove tags (índices <sub>)
  return { $, esc, num, okn, fmt, fn, plain };
})();
