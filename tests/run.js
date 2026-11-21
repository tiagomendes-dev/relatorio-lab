#!/usr/bin/env node
/* Testes automáticos do projeto (sem dependências): node tests/run.js
   Verificam a consistência das definições dos relatórios, os cálculos, a lógica de notas do back-end e o build. */
const fs = require("fs"), path = require("path"), vm = require("vm"), assert = require("assert");
const RAIZ = path.resolve(__dirname, "..");
const ler = (...p) => fs.readFileSync(path.join(RAIZ, ...p), "utf8");
let ok = 0;
const teste = (nome, fn) => { try { fn(); ok++; console.log("  ok  " + nome); } catch (e) { console.error("  FALHOU  " + nome + "\n    " + e.message); process.exitCode = 1; } };

const okn = x => typeof x === "number" && isFinite(x);
const fmt = n => typeof n === "number" ? String(+n.toPrecision(4)).replace(".", ",") : n;
function carregarDef(id) {
  const ctx = { window: {}, Lab: { util: { okn, fmt } } };
  vm.runInNewContext(ler("frontend", "relatorios", id, "definicao.js"), ctx);
  return ctx.window.RELATORIO;
}
const config = (() => { const ctx = { window: {} }; vm.runInNewContext(ler("frontend", "assets", "js", "config.js"), ctx); return ctx.window.LAB_CONFIG; })();
const pastas = fs.readdirSync(path.join(RAIZ, "frontend", "relatorios"));

console.log("Definições dos relatórios");
pastas.forEach(id => {
  const def = carregarDef(id), html = ler("frontend", "relatorios", id, "index.html");
  teste(id + ": estrutura das tabelas", () => {
    for (const [tid, t] of Object.entries(def.tabelas)) {
      assert.strictEqual(t.cab.length, t.c.length, tid + ": cabeçalhos e colunas diferem");
      assert(/^[tndfm]+$/.test(t.c), tid + ": tipo de coluna inválido");
      if (t.c.includes("f")) assert(t.fix && t.fix.length >= t.n, tid + ": faltam rótulos em fix");
      if (t.k) assert(/^\d+[a-z]?\) /.test(t.k), tid + ": título deve começar com o número da questão, ex. '3a) ...'");
    }
  });
  teste(id + ": a página usa só tabelas definidas", () => {
    const usadas = [...html.matchAll(/data-t="(\w+)"/g)].map(m => m[1]);
    usadas.forEach(u => assert(def.tabelas[u] || ["nomes", "ins"].includes(u), "tabela sem definição: " + u));
    Object.keys(def.tabelas).forEach(k => assert(usadas.includes(k), "tabela definida mas não usada na página: " + k));
  });
  teste(id + ": perguntas de texto numeradas e únicas", () => {
    const ks = [...html.matchAll(/data-k="([^"]+)"/g)].map(m => m[1]);
    assert(ks.length > 0);
    assert.strictEqual(new Set(ks).size, ks.length, "pergunta repetida");
    ks.forEach(k => assert(/^\d+[a-z]?\) /.test(k), "pergunta sem número: " + k));
  });
  if (!id.startsWith("_")) teste(id + ": registrado em config.js e com meta.json", () => {
    const meta = JSON.parse(ler("frontend", "relatorios", id, "meta.json"));
    ["titulo", "disciplina", "autor", "licenca", "fonte", "versao"].forEach(k => assert(k in meta, "meta.json sem o campo " + k));
    const r = config.RELATORIOS.find(x => x.id === id);
    assert(r, "falta em LAB_CONFIG.RELATORIOS");
    assert.strictEqual(r.nome, def.experimento, "nome diferente do experimento da definição");
  });
});

console.log("Cálculos");
function rodar(def, valores) {
  const R = {}, g = id => (id in valores ? valores[id] : null);
  const put = (id, v) => { if (okn(v) || typeof v === "string") R[id] = v; };
  const pre = (id, v) => { valores[id] = okn(v) ? v : null; };
  const stat = (arr, p) => { const a = arr.filter(okn); if (!a.length) return; const m = a.reduce((s, x) => s + x, 0) / a.length; put(p + "_0_0", m); };
  def.calcular(R, g, put, stat, pre);
  return R;
}
teste("queda livre: MMQ recupera g = 9,8", () => {
  const v = {}, ts = [0.10, 0.14, 0.17, 0.20];
  ts.forEach((t, r) => { v["queda_" + r + "_1"] = 4.9 * t * t; [2, 3, 4, 5].forEach(c => v["queda_" + r + "_" + c] = t); });
  v.coefm_0_0 = 4.8;
  const R = rodar(carregarDef("queda-livre"), v);
  assert(Math.abs(R.gmmq_0_0 - 9.8) < 1e-9, "g MMQ = " + R.gmmq_0_0);
  assert(Math.abs(R.gg_0_0 - 9.6) < 1e-9);
  assert.strictEqual(R["mmq_m_4"], 4);
});
teste("lei de Hooke: K médio e diferença percentual", () => {
  const v = {}; for (let r = 0; r < 4; r++) { v["hooke_" + r + "_0"] = 0.5 * (r + 1); [1, 2, 3, 4].forEach(c => v["hooke_" + r + "_" + c] = 0.05 * (r + 1)); }
  v.coefa_0_0 = 9.8;
  const R = rodar(carregarDef("lei-de-hooke"), v);
  assert(Math.abs(R.kest_0_0 - 10) < 1e-9);
  assert(Math.abs(R.dif_0_2 - 2) < 1e-6);
});
teste("prensa hidráulica: K2 = Fk2/ΔX", () => {
  const v = { diam_0_0: 2, diam_0_1: 4 };
  for (let r = 0; r < 3; r++) { v["mola_" + r + "_1"] = 0; v["mola_" + r + "_2"] = 1; }
  const R = rodar(carregarDef("prensa-hidraulica"), v);
  const A1 = Math.PI, A2 = 4 * Math.PI, F1 = 0.1 * A1, F2 = F1 * A2 / A1;
  assert(Math.abs(R.k2_0_3 - (F2 / 2 * 9.81) / 0.01) < 1e-6);
});

console.log("Back-end");
teste("itensDe: agrupa por questão e a soma dos pesos é a nota máxima", () => {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(ler("backend", "src", "Config.gs") + "\n" + ler("backend", "src", "Avaliacao.gs"), ctx);
  const dados = {
    tabelas: [{ titulo: "Nomes e matrículas" }, { titulo: "1b) Medidas" }, { titulo: "3a) K" }, { titulo: "3b) K médio" }],
    textos: { "1d) Operações": "x", "3b) Discussão": "y", "10) Final": "z" }, fotos: [{ nome: "f", id: "a" }]
  };
  const it = vm.runInContext("itensDe", ctx)("Relatório X", dados);
  assert.strictEqual(JSON.stringify(it.map(i => i.q)), JSON.stringify(["1b", "1d", "3a", "3b", "10", "Fotos"]));   // JSON: arrays vêm de outro contexto do vm
  assert(Math.abs(it.reduce((s, i) => s + i.max, 0) - 10) < 1e-9);
  assert.strictEqual(JSON.stringify(it.find(i => i.q === "3b").t), "[3]");
});
teste("build: o Code.gs gerado é válido e traz o painel", () => {
  const c = ler("dist", "apps-script", "Code.gs"); new Function(c);
  const html = JSON.parse(c.match(/var PAINEL_HTML = (.*);\n*$/s)[1]);
  assert(html.includes("Painel do professor") && html.includes("desenharAcomp") && !html.includes("/*{{") && !html.includes("{{VERSAO}}"));
  assert(c.includes('var VERSAO = "' + config.VERSAO + '"'), "versão do back-end diferente da do front-end");
  assert(!c.includes('var PAINEL_HTML = "";'));
});

console.log("\n" + (process.exitCode ? "HÁ FALHAS" : ok + " testes passaram"));
