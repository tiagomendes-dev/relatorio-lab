// AVALIAÇÃO: questões avaliáveis, notas por questão e liberação ao aluno.

// aval: { "1b": {p: "1,5", c: "comentário"}, ... }
function salvarAvaliacao(senha, linha, aval, comentario, liberado) {
  checar(senha);
  var aba = abaRespostas();
  linha = Number(linha);
  if (!(linha >= 2 && linha <= aba.getLastRow())) throw new Error("Linha inválida.");
  var r = aba.getRange(linha, 1, 1, 13).getValues()[0];
  var dados = lerJson(r[9]);
  var itens = dados ? itensDe(r[2], dados) : [];
  var limpo = {}, total = 0, algum = false;
  itens.forEach(function (it) {
    var a = aval && aval[it.q];
    if (!a) return;
    var p = (a.p === "" || a.p === null || a.p === undefined) ? null : Number(String(a.p).replace(",", "."));
    if (p !== null && !isNaN(p)) { p = Math.max(0, Math.min(it.max, p)); total += p; algum = true; } else { p = null; }
    limpo[it.q] = { p: p, c: String(a.c || "").slice(0, 2000) };
  });
  var nota = algum ? Math.round(total * 100) / 100 : "";
  aba.getRange(linha, 5, 1, 3).setValues([[nota, String(comentario || "").slice(0, 4000), liberado ? "sim" : ""]]);
  aba.getRange(linha, 11).setValue(JSON.stringify(limpo));
  return { nota: nota === "" ? "" : String(nota), aval: limpo };
}

function liberarLote(senha, linhas, liberado) {
  checar(senha);
  var aba = abaRespostas(), ult = aba.getLastRow(), c = 0;
  (linhas || []).forEach(function (l) {
    l = Number(l);
    if (l >= 2 && l <= ult) { aba.getRange(l, 7).setValue(liberado ? "sim" : ""); c++; }
  });
  return c;
}

// ---- Questões avaliáveis, deduzidas do próprio relatório ----
function itensDe(exp, dados) {
  var mapa = {}, qs = [], re = /^(\d+[a-z]?)\)\s*(.*)$/;
  function item(q, nome) {
    if (!mapa[q]) { mapa[q] = { q: q, nome: nome, t: [], k: [], f: false }; qs.push(q); }
    return mapa[q];
  }
  (dados.tabelas || []).forEach(function (t, i) { var m = re.exec(t.titulo || ""); if (m) item(m[1], m[2]).t.push(i); });
  Object.keys(dados.textos || {}).forEach(function (k) { var m = re.exec(k); if (m) item(m[1], m[2]).k.push(k); });
  if ((dados.fotos || []).length) item("Fotos", "Fotos e anexos").f = true;
  qs.sort(ordemQ);
  var p = PESOS[exp] || {};
  var w = qs.map(function (q) { return p[q] !== undefined ? Number(p[q]) : 1; });
  var soma = w.reduce(function (a, b) { return a + b; }, 0) || 1;
  return qs.map(function (q, i) { var it = mapa[q]; it.max = w[i] / soma * NOTA_MAXIMA; return it; });
}

function ordemQ(a, b) {
  var ma = /^(\d+)([a-z]?)$/.exec(a), mb = /^(\d+)([a-z]?)$/.exec(b);
  if (!ma) return mb ? 1 : 0;
  if (!mb) return -1;
  return (+ma[1] - +mb[1]) || (ma[2] < mb[2] ? -1 : ma[2] > mb[2] ? 1 : 0);
}
