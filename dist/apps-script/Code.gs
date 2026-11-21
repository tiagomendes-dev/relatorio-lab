// ===== Config.gs =====
// CONFIGURAÇÃO DO BACK-END: o professor edita só este arquivo.

var VERSAO = "1.0.0";                        // versão do sistema (aparece no painel e no diagnóstico)
var SENHA_PROFESSOR = "troque-esta-senha";   // senha do painel
var NOTA_MAXIMA = 10;                        // nota total de cada relatório
// Pesos opcionais por questão (valores relativos). Questão não listada vale 1.
// Exemplo: "Relatório Lei de Hooke": { "3b": 2, "7": 2 }
var PESOS = {};

// ---- Estrutura das planilhas (não mude depois de ter dados; a aba antiga é preservada se mudar) ----
var NOME_ABA = "Respostas";
var ABA_PERFIS = "Perfis";
var CABECALHO = ["Data e hora", "Turma", "Experimento", "Integrantes", "Nota", "Comentário geral",
                 "Liberado ao aluno", "Código do perfil", "Fotos", "Dados (JSON)", "Avaliação (JSON)",
                 "Reenvio autorizado", "Substituída"];
var CAB_PERFIS = ["Código de acesso", "Turma", "Nome do perfil", "Tipo", "Integrantes (JSON)", "Criado em", "Ativo"];

// ===== Util.gs =====
// UTILIDADES gerais (respostas HTTP, JSON, senha).

// ---- Auxiliares ----
function checar(senha) {
  if (String(senha) !== SENHA_PROFESSOR) throw new Error("Senha incorreta.");
}

function lerJson(s) {
  try { return JSON.parse(s); } catch (e) { return null; }
}

function resposta(txt) { return ContentService.createTextOutput(txt); }

function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// ===== Planilha.gs =====
// ACESSO ÀS PLANILHAS E AO DRIVE.
// Colunas de "Respostas": 1 data, 2 turma, 3 experimento, 4 integrantes, 5 nota, 6 comentário geral,
// 7 liberado, 8 código do perfil, 9 fotos, 10 dados, 11 avaliação, 12 reenvio autorizado, 13 substituída.

function preparar(nome, cab, antigaPrefixo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getSheetByName(nome);
  if (aba && aba.getLastRow() > 0) {
    var atual = aba.getRange(1, 1, 1, cab.length).getValues()[0];
    if (atual.join("|") !== cab.join("|")) {   // estrutura antiga: preserva com outro nome
      aba.setName(antigaPrefixo + " " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmm"));
      aba = null;
    }
  }
  if (!aba) aba = ss.getSheetByName(nome) || ss.insertSheet(nome);
  if (aba.getLastRow() === 0) {
    aba.appendRow(cab);
    aba.getRange(1, 1, 1, cab.length).setFontWeight("bold").setBackground("#e6f2ee");
    aba.setFrozenRows(1);
  }
  return aba;
}

function abaRespostas() { return preparar(NOME_ABA, CABECALHO, "Respostas antiga"); }

function abaPerfis() { return preparar(ABA_PERFIS, CAB_PERFIS, "Perfis antiga"); }

function pastaFotos() {
  var it = DriveApp.getFoldersByName("Fotos dos relatórios");
  return it.hasNext() ? it.next() : DriveApp.createFolder("Fotos dos relatórios");
}

// ===== Perfis.gs =====
// PERFIS: cadastro de alunos (individual ou grupo) e seus códigos de acesso.

// ---- Perfis (cadastro de alunos) ----
function acharPerfil(cod) {
  if (!cod) return null;
  var aba = abaPerfis(), n = aba.getLastRow();
  if (n < 2) return null;
  var v = aba.getRange(2, 1, n - 1, 7).getValues();
  for (var i = 0; i < v.length; i++) {
    if (String(v[i][0]).toUpperCase() === cod && v[i][6] !== "não") return perfilDe(v[i]);
  }
  return null;
}

function perfilDe(r) {
  return { codigo: String(r[0]), turma: String(r[1]), nome: String(r[2]), tipo: String(r[3]),
           integrantes: lerJson(r[4]) || [], ativo: r[6] !== "não" };
}

function estadoPerfil(cod, exp) {
  var p = acharPerfil(cod);
  if (!p) return { estado: "nao" };
  var at = envioAtivo(abaRespostas(), cod, exp);
  return { estado: at ? (at.reenvio ? "reenvio" : "enviado") : "ok", turma: p.turma, nome: p.nome, integrantes: p.integrantes };
}

// ---- Funções chamadas pelo painel ----
function listarPerfis(senha) {
  checar(senha);
  var aba = abaPerfis(), n = aba.getLastRow();
  if (n < 2) return [];
  return aba.getRange(2, 1, n - 1, 7).getValues().map(perfilDe);
}

// integrantes: [{nome, matricula}] (1 = individual, 2 a 5 = grupo)
function criarPerfil(senha, turma, nome, integrantes) {
  checar(senha);
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { return novoPerfil(String(turma || "").trim(), String(nome || "").trim(), integrantes); }
  finally { lock.releaseLock(); }
}

// texto: uma linha por aluno, "Nome;Matrícula" -> um perfil individual para cada
function criarLote(senha, turma, texto) {
  checar(senha);
  turma = String(turma || "").trim();
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var criados = [];
    String(texto || "").split(/\r?\n/).forEach(function (linha) {
      linha = linha.trim();
      if (!linha) return;
      var partes = linha.split(/[;\t]/);
      criados.push(novoPerfil(turma, "", [{ nome: partes[0].trim(), matricula: (partes[1] || "").trim() }]));
    });
    return criados;
  } finally { lock.releaseLock(); }
}

function novoPerfil(turma, nome, integrantes) {
  if (!turma) throw new Error("Informe a turma.");
  var ig = (integrantes || []).map(function (i) {
    return { nome: String(i.nome || "").trim().slice(0, 120), matricula: String(i.matricula || "").trim().slice(0, 40) };
  }).filter(function (i) { return i.nome; });
  if (!ig.length) throw new Error("Informe pelo menos um nome.");
  if (ig.length > 5) throw new Error("No máximo 5 integrantes por perfil.");
  var aba = abaPerfis();
  var p = { codigo: novoCodigo(aba), turma: turma, nome: nome || (ig.length === 1 ? ig[0].nome : ig.map(function (i) { return i.nome.split(" ")[0]; }).join(", ")),
            tipo: ig.length === 1 ? "Individual" : "Grupo", integrantes: ig, ativo: true };
  aba.appendRow([p.codigo, p.turma, p.nome, p.tipo, JSON.stringify(ig), new Date(), "sim"]);
  return p;
}

function alternarPerfil(senha, codigo, ativo) {
  checar(senha);
  var aba = abaPerfis(), n = aba.getLastRow();
  if (n < 2) return false;
  var v = aba.getRange(2, 1, n - 1, 1).getValues();
  for (var i = 0; i < v.length; i++) {
    if (String(v[i][0]) === String(codigo)) { aba.getRange(i + 2, 7).setValue(ativo ? "sim" : "não"); return true; }
  }
  return false;
}

function novoCodigo(abaP) {
  var n = abaP.getLastRow(), usados = {};
  if (n >= 2) abaP.getRange(2, 1, n - 1, 1).getValues().forEach(function (r) { usados[String(r[0])] = 1; });
  var letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", c;
  do {
    c = "";
    for (var i = 0; i < 6; i++) c += letras.charAt(Math.floor(Math.random() * letras.length));
  } while (usados[c]);
  return c;
}

// ===== Envios.gs =====
// ENVIOS: receber relatórios, consultas do aluno e listagem do professor.

// Registra um relatório enviado por um perfil e devolve o texto de resposta ao navegador.
function receberEnvio(d, cod) {
  var p = acharPerfil(cod);
  if (!p) return "codigo invalido";
  var exp = String(d.experimento || "");
  var aba = abaRespostas();
  var ativo = envioAtivo(aba, cod, exp);
  if (ativo && !ativo.reenvio) return "ja enviado";

  var arquivos = salvarFotos(d.fotos, p);
  var tabelas = d.tabelas || [];
  tabelas.forEach(function (t) {   // a identificação vem do cadastro, não do aluno
    if (t.id === "nomes") t.linhas = p.integrantes.map(function (i) { return [i.nome, i.matricula || ""]; });
  });
  var dados = { data: d.data, experimento: exp, tabelas: tabelas, textos: d.textos, fotos: arquivos.fotos };
  if (ativo) aba.getRange(ativo.linha, 12, 1, 2).setValues([["", "sim"]]);   // envio anterior vai para o histórico
  aba.appendRow([new Date(), p.turma, exp, p.integrantes.map(function (i) { return i.nome; }).join(", "), "", "", "",
                 cod, arquivos.links.join("\n"), JSON.stringify(dados), "", "", ""]);
  return "ok";
}

// Salva as fotos no Drive do professor (arquivos privados).
function salvarFotos(lista, p) {
  var fotos = [], links = [];
  if (!lista || !lista.length) return { fotos: fotos, links: links };
  var pasta = pastaFotos();
  var base = p.nome.replace(/[^A-Za-z0-9]+/g, "_");
  lista.forEach(function (f) {
    var bytes = Utilities.base64Decode(f.dados.split(",")[1]);
    var nome = base + "_" + f.nome.replace(/[^A-Za-z0-9]+/g, "_") + ".jpg";
    var arq = pasta.createFile(Utilities.newBlob(bytes, "image/jpeg", nome));
    fotos.push({ nome: f.nome, id: arq.getId() });
    links.push(arq.getUrl());
  });
  return { fotos: fotos, links: links };
}

// Envio vigente do perfil para o experimento (ignora os substituídos).
function envioAtivo(aba, cod, exp) {
  var n = aba.getLastRow();
  if (n < 2) return null;
  var v = aba.getRange(2, 1, n - 1, 13).getValues();
  for (var i = v.length - 1; i >= 0; i--) {
    var r = v[i];
    if (String(r[7]).toUpperCase() === cod && String(r[2]) === exp && r[12] !== "sim") return { linha: i + 2, reenvio: r[11] === "sim" };
  }
  return null;
}

function minhas(cod) {
  var p = acharPerfil(cod);
  if (!p) return { estado: "nao" };
  var aba = abaRespostas(), n = aba.getLastRow(), tz = Session.getScriptTimeZone(), envios = [];
  if (n >= 2) {
    aba.getRange(2, 1, n - 1, 13).getValues().forEach(function (r) {
      if (String(r[7]).toUpperCase() !== cod || r[12] === "sim") return;
      var e = { experimento: r[2], data: r[0] instanceof Date ? Utilities.formatDate(r[0], tz, "dd/MM/yyyy HH:mm") : String(r[0]),
                reenvio: r[11] === "sim", estado: r[6] === "sim" ? "liberado" : "recebido" };
      if (e.estado === "liberado") {
        var dados = lerJson(r[9]), aval = lerJson(r[10]) || {};
        e.nota = r[4] === "" ? "" : Number(r[4]);
        e.max = NOTA_MAXIMA;
        e.comentario = String(r[5]);
        e.itens = (dados ? itensDe(r[2], dados) : []).map(function (it) {
          var a = aval[it.q] || {};
          return { q: it.q, nome: it.nome, max: it.max, pts: (a.p === undefined || a.p === null) ? null : a.p, com: a.c || "" };
        });
      }
      envios.push(e);
    });
  }
  envios.reverse();
  return { estado: "ok", nome: p.nome, turma: p.turma, integrantes: p.integrantes, envios: envios };
}

function listar(senha) {
  checar(senha);
  var aba = abaRespostas(), n = aba.getLastRow(), linhas = [], turmas = {};
  if (n >= 2) {
    var tz = Session.getScriptTimeZone();
    aba.getRange(2, 1, n - 1, 13).getValues().forEach(function (r, i) {
      var dados = lerJson(r[9]);
      turmas[r[1]] = 1;
      linhas.push({
        linha: i + 2,
        data: r[0] instanceof Date ? Utilities.formatDate(r[0], tz, "dd/MM/yyyy HH:mm") : String(r[0]),
        turma: r[1], experimento: r[2], integrantes: r[3],
        nota: r[4] === "" ? "" : String(r[4]), comentario: String(r[5]),
        liberado: r[6] === "sim", codigo: String(r[7]),
        reenvio: r[11] === "sim", substituida: r[12] === "sim",
        dados: dados, aval: lerJson(r[10]) || {}, itens: dados ? itensDe(r[2], dados) : []
      });
    });
  }
  return { turmas: Object.keys(turmas).sort(), nota_maxima: NOTA_MAXIMA, linhas: linhas };
}

// O professor libera (ou cancela) um novo envio do mesmo relatório para o perfil.
function autorizarReenvio(senha, linha, sim) {
  checar(senha);
  var aba = abaRespostas();
  linha = Number(linha);
  if (!(linha >= 2 && linha <= aba.getLastRow())) throw new Error("Linha inválida.");
  if (aba.getRange(linha, 13).getValue() === "sim") throw new Error("Este envio já foi substituído.");
  aba.getRange(linha, 12).setValue(sim ? "sim" : "");
  return true;
}

function foto(senha, id) {
  checar(senha);
  if (!/^[\w-]{20,}$/.test(id)) throw new Error("Foto inválida.");
  var b = DriveApp.getFileById(id).getBlob();
  return "data:" + b.getContentType() + ";base64," + Utilities.base64Encode(b.getBytes());
}

// ===== Avaliacao.gs =====
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

// ===== Main.gs =====
// PONTO DE ENTRADA: roteia os pedidos que chegam pelo endereço /exec.

// GET: abre o painel do professor (pede a senha).
function doGet() {
  return HtmlService.createHtmlOutput(PAINEL_HTML)
    .setTitle("Painel do professor")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

// POST: ações dos alunos. As ações do painel usam google.script.run (funções públicas em Perfis/Envios/Avaliacao).
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    var cod = String(d.codigo || "").trim().toUpperCase();
    switch (d.acao) {
      case "ping":   return json({ ok: true, versao: VERSAO });                      // teste de instalação
      case "perfil": return json(estadoPerfil(cod, String(d.experimento || "")));   // entrada do aluno
      case "minhas": return json(minhas(cod));                                      // "Meus relatórios"
      default:       return resposta(receberEnvio(d, cod));                         // envio de relatório
    }
  } catch (err) {
    return resposta("erro: " + err);
  } finally {
    lock.releaseLock();
  }
}

// ===== Setup.gs =====
// INSTALAÇÃO

// Execute UMA vez no editor para o Google pedir as permissões de planilha e Drive.
function autorizar() {
  abaRespostas();
  abaPerfis();
  pastaFotos();
  Logger.log("Autorização concluída.");
}

// ===== PainelEmbutido.gs =====
// Preenchido automaticamente por scripts/build_backend.py com o painel montado (HTML+CSS+JS).
var PAINEL_HTML = "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head>\n<base target=\"_top\">\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>Painel do professor</title>\n<style>\n/* TEMA: \u00fanico lugar com cores e fontes. Trocar o visual do sistema = editar s\u00f3 este arquivo. */\n:root{\n  --fundo:#008080;          /* fundo da p\u00e1gina */\n  --janela:#c0c0c0;         /* \"janela\" central */\n  --superficie:#e8e8e8;     /* caixas e se\u00e7\u00f5es */\n  --branco:#ffffff;\n  --destaque:#000080;       /* barras de t\u00edtulo e cabe\u00e7alhos de tabela */\n  --destaque-texto:#ffffff;\n  --barra:#808080;          /* t\u00edtulos de se\u00e7\u00e3o */\n  --texto:#000000;\n  --texto-suave:#333333;\n  --borda:#000000;\n  --borda-suave:#808080;\n  --aviso:#ffffcc;\n  --alerta:#ffff99;\n  --ok:#99ff99;\n  --erro:#cc0000;\n  --erro-fundo:#ffdddd;\n  --fonte-texto:\"Times New Roman\",Times,serif;\n  --fonte-ui:Arial,Helvetica,sans-serif;\n  --fonte-codigo:\"Courier New\",Courier,monospace;\n}\n\n/* BASE: reset, tipografia, formul\u00e1rios e bot\u00f5es. */\n*{box-sizing:border-box;border-radius:0}\nbody{margin:0;background:var(--fundo);color:var(--texto);font:15px/1.4 var(--fonte-texto)}\nh1{margin:0 0 8px;padding:5px 8px;background:var(--destaque);color:var(--destaque-texto);font:bold 20px var(--fonte-ui)}\nh2{margin:0 0 8px;padding:2px 6px;background:var(--barra);color:#fff;font:bold 15px var(--fonte-ui)}\nh3,h4{margin:12px 0 6px;font:bold 14px var(--fonte-ui)}\na{color:#0000ee}\np{margin:10px 0 6px}\nlabel{display:block;font:bold 13px var(--fonte-ui);margin:10px 0 3px}\ninput,select,textarea{font:13px var(--fonte-ui);color:var(--texto);background:var(--branco);border:2px inset #fff;padding:3px 5px}\ntextarea{width:100%;min-height:110px;resize:vertical}\ninput:focus,select:focus,textarea:focus{outline:2px solid var(--destaque)}\nbutton,a.btn{font:bold 13px var(--fonte-ui);color:var(--texto);background:var(--janela);border:2px outset #fff;padding:4px 14px;cursor:pointer;text-decoration:none;display:inline-block}\nbutton:active,a.btn:active{border-style:inset}\nbutton:disabled{color:var(--borda-suave);cursor:default}\nbutton.mini{padding:1px 8px;font-size:12px}\n.muted,.hint,.sub{color:var(--texto-suave);font-size:13px}\n.sub{margin:6px 0 10px}\n.err{color:var(--erro);font-weight:bold;min-height:1.3em;margin:6px 0}\nsub,sup{line-height:0}\nmath{font-size:1.2em}\nsummary{cursor:pointer;font-weight:bold}\n[hidden]{display:none!important}\n\n/* COMPONENTES reutiliz\u00e1veis: avisos, equa\u00e7\u00f5es, selos e tabelas. */\n.note{background:var(--aviso);border:1px solid var(--borda);padding:5px 8px;margin:8px 0;font-size:13px}\n.eq{background:var(--branco);border:1px solid var(--borda);padding:4px 10px;margin:8px 0;overflow-x:auto}\n.badge{display:inline-block;border:1px solid var(--borda);background:var(--alerta);padding:0 5px;font:12px var(--fonte-ui);white-space:nowrap}\n.badge.ok{background:var(--ok)}\n.tw,.grid-wrap{overflow-x:auto;margin:6px 0}\ntable{border-collapse:collapse;width:100%}\n.grid{min-width:520px;background:var(--branco)}\n.grid th,.grid td{border:1px solid var(--borda);padding:0;text-align:center}\n.grid th{background:var(--destaque);color:var(--destaque-texto);font:bold 12px var(--fonte-ui);padding:5px}\n.grid td.n{background:var(--destaque);color:var(--destaque-texto);font:bold 12px var(--fonte-ui);padding:4px;width:34px}\n.grid td.fx{background:#e0e0e0;font:bold 13px var(--fonte-ui);padding:4px;white-space:nowrap}\n.grid td.l{text-align:left;padding:4px 6px}\n.grid input{width:100%;min-width:90px;border:0;background:var(--branco);text-align:center;padding:5px}\nbody.auto input[data-ty=\"d\"],body.auto input[data-ty=\"m\"]{background:var(--aviso)}\n\n/* CSS espec\u00edfico do painel do professor (somado a tema.css, base.css e componentes.css no build). */\nmain{max-width:1040px;margin:0 auto;padding:10px;background:var(--janela);border-left:3px solid #fff;border-right:3px solid #404040;min-height:100vh}\n.card{background:var(--superficie);border:2px outset #fff;padding:8px 10px;margin-bottom:10px}\n.topo{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}\n.topo h1{margin:0}\n.filtros{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0;align-items:center}.filtros input{flex:1;min-width:150px}\n.grupo h3{margin:10px 0 4px}\n.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px}\n.cardt{background:#e0e0e0;border:2px outset #fff;padding:6px 8px;text-align:left;font:13px var(--fonte-ui);display:block;width:100%}\n.cardt.on{background:var(--aviso);border-style:inset}\n.cardt.zero{color:#666}\n.cardt b{display:block}\n.bar{height:10px;background:#fff;border:1px solid var(--borda);margin:5px 0 3px}.bar i{display:block;height:100%;background:var(--destaque)}\n.lista{background:#fff}\n.lista th{background:var(--destaque);color:var(--destaque-texto);font:bold 12px var(--fonte-ui);text-align:left;padding:5px}\n.lista td{border:1px solid var(--borda-suave);padding:5px;text-align:left}\n.lista tbody tr{cursor:pointer}.lista tbody tr:hover{background:var(--aviso)}\n.grid{min-width:380px;margin-bottom:4px}\n.grid td{padding:4px 8px}\n.resp{white-space:pre-wrap;background:#fff;border:1px solid var(--borda);padding:6px 10px}\n.fotos{display:flex;gap:10px;flex-wrap:wrap}\nfigure{margin:0;flex:1;min-width:240px}figure img{width:100%;border:1px solid var(--borda)}\n.ph{background:#fff;border:1px dashed var(--borda-suave);padding:30px 10px;text-align:center;color:#555}\n.ih{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline;border-bottom:1px solid var(--borda-suave);padding-bottom:4px;margin-bottom:6px}\n.ih h3{margin:0}\n.aval{background:#d4d0c8;border:1px solid var(--borda-suave);padding:8px;margin-top:10px;display:grid;gap:6px}\n.aval .l1{display:flex;gap:6px;align-items:center;flex-wrap:wrap}\n.pt{width:80px;text-align:center;font-weight:bold}.pt.bad{border-color:var(--erro);background:var(--erro-fundo)}\n.nav{display:flex;justify-content:space-between;gap:8px;margin:0 0 10px;flex-wrap:wrap}\n.barra{position:sticky;bottom:0;background:var(--janela);border:2px outset #fff;padding:6px 10px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:10px}\n.barra .tot{font:bold 15px var(--fonte-ui);margin-right:auto}\n.cod{font-family:var(--fonte-codigo);font-weight:bold}\n.mem{display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap}.mem input{flex:1;min-width:150px}\n\n</style>\n</head>\n<body>\n<main>\n  <div id=\"login\" class=\"card\" style=\"max-width:420px;margin:60px auto\">\n    <h1>Painel do professor</h1>\n    <p class=\"muted\" id=\"dica\">Digite a senha para ver os relat\u00f3rios.</p>\n    <p class=\"muted\">Vers\u00e3o 1.0.0</p>\n    <input type=\"password\" id=\"senha\" placeholder=\"Senha\" style=\"width:100%;margin-bottom:10px\">\n    <button id=\"entrar\">Entrar</button>\n    <div class=\"err\" id=\"lerro\" role=\"alert\"></div>\n  </div>\n\n  <div id=\"cab\" class=\"topo\" hidden><h1>Painel do professor</h1><span><button id=\"tabR\">Relat\u00f3rios</button> <button class=\"sec\" id=\"tabA\">Acompanhamento</button> <button class=\"sec\" id=\"tabC\">Cadastro de alunos</button> <button class=\"sec\" id=\"atualizar\">Atualizar</button></span></div>\n  <div id=\"lista\" hidden>\n    <div id=\"grupos\"></div>\n    <div class=\"filtros\">\n      <select id=\"fexp\" aria-label=\"Experimento\"></select>\n      <select id=\"fturma\" aria-label=\"Turma\"></select>\n      <select id=\"fstatus\" aria-label=\"Situa\u00e7\u00e3o\"><option value=\"\">Todas as situa\u00e7\u00f5es</option><option value=\"p\">Sem avalia\u00e7\u00e3o</option><option value=\"a\">Avaliados</option><option value=\"o\">Avaliados, n\u00e3o liberados</option><option value=\"l\">Liberados ao aluno</option><option value=\"h\">Hist\u00f3rico (envios substitu\u00eddos)</option></select>\n      <input id=\"busca\" placeholder=\"Buscar por nome do aluno\">\n    </div>\n    <div class=\"topo\"><span class=\"muted\" id=\"conta\"></span><button class=\"sec\" id=\"liberarTodos\">Liberar avaliados desta lista</button></div>\n    <div class=\"card tw\" style=\"padding:6px\">\n      <table class=\"lista\"><thead><tr><th>Enviado em</th><th>Experimento</th><th>Turma</th><th>Integrantes</th><th>Avalia\u00e7\u00e3o</th><th>Aluno v\u00ea</th></tr></thead><tbody id=\"corpo\"></tbody></table>\n      <p class=\"muted\" id=\"vazio\" style=\"padding:12px\" hidden>Nenhum relat\u00f3rio encontrado.</p>\n    </div>\n  </div>\n\n  <div id=\"acomp\" hidden>\n    <div class=\"filtros\" style=\"margin-top:0\"><select id=\"aexp\" aria-label=\"Experimento\"></select><select id=\"aturma\" aria-label=\"Turma\"></select>\n      <select id=\"asit\" aria-label=\"Situa\u00e7\u00e3o\"><option value=\"\">Todas as situa\u00e7\u00f5es</option><option value=\"n\">N\u00e3o enviaram</option><option value=\"e\">Enviaram</option></select></div>\n    <p class=\"muted\" id=\"aresumo\"></p>\n    <div class=\"card tw\" style=\"padding:6px\">\n      <table class=\"lista\"><thead><tr><th>Turma</th><th>Perfil</th><th>Integrantes</th><th>Situa\u00e7\u00e3o</th><th></th></tr></thead><tbody id=\"acorpo\"></tbody></table>\n      <p class=\"muted\" id=\"avazio\" style=\"padding:12px\" hidden></p>\n    </div>\n    <div class=\"card\"><h3 style=\"margin-top:0\">Quem ainda n\u00e3o enviou este relat\u00f3rio</h3><textarea id=\"apend\" readonly style=\"min-height:90px\"></textarea></div>\n  </div>\n\n  <div id=\"cadastro\" hidden>\n    <div class=\"card\">\n      <h2>Novo perfil</h2>\n      <p class=\"muted\">Um perfil \u00e9 um aluno (individual) ou um grupo de at\u00e9 5. Ele recebe um c\u00f3digo de acesso para enviar os relat\u00f3rios.</p>\n      <div class=\"filtros\" style=\"margin-top:0\"><input id=\"cturma\" list=\"dturmas\" placeholder=\"Turma (ex.: 1\u00ba A)\"><datalist id=\"dturmas\"></datalist><input id=\"cnome\" placeholder=\"Nome do grupo (opcional)\"></div>\n      <div id=\"cmembros\"></div>\n      <p><button class=\"sec\" id=\"cadd\">Adicionar integrante</button> <button id=\"ccriar\">Cadastrar perfil</button> <span class=\"muted\" id=\"cmsg\"></span></p>\n    </div>\n    <div class=\"card\">\n      <h2>Cadastrar v\u00e1rios alunos individuais</h2>\n      <p class=\"muted\">Use a turma do campo acima. Um aluno por linha, no formato <b>Nome;Matr\u00edcula</b> (d\u00e1 para colar de uma planilha).</p>\n      <textarea id=\"clote\" placeholder=\"Ana Souza;20261001&#10;Bruno Lima;20261002\"></textarea>\n      <p><button id=\"cloteBtn\">Cadastrar lote</button> <span class=\"muted\" id=\"clmsg\"></span></p>\n    </div>\n    <div class=\"filtros\"><select id=\"cfturma\" aria-label=\"Turma\"></select><input id=\"cbusca\" placeholder=\"Buscar perfil ou aluno\"></div>\n    <div class=\"card tw\" style=\"padding:6px\">\n      <table class=\"lista\"><thead><tr><th>C\u00f3digo</th><th>Turma</th><th>Perfil</th><th>Integrantes</th><th>Relat\u00f3rios enviados</th><th></th></tr></thead><tbody id=\"cperfis\"></tbody></table>\n      <p class=\"muted\" id=\"cvazio\" style=\"padding:12px\" hidden>Nenhum perfil cadastrado.</p>\n    </div>\n    <div class=\"card\"><h3 style=\"margin-top:0\">Lista para distribuir (nome e c\u00f3digo)</h3><textarea id=\"ccopia\" readonly style=\"min-height:110px\"></textarea></div>\n  </div>\n\n  <div id=\"detalhe\" hidden></div>\n</main>\n\n<script>\n/* Estado global, utilit\u00e1rios e chamada ao servidor (google.script.run). */\nvar SENHA = \"\", DADOS = {turmas:[],linhas:[],nota_maxima:10}, VIS = [], PERFIS = [], TAB = \"r\";\nfunction $(id){return document.getElementById(id);}\nfunction esc(s){return String(s==null?\"\":s).replace(/[&<>\"']/g,function(c){return {\"&\":\"&amp;\",\"<\":\"&lt;\",\">\":\"&gt;\",'\"':\"&quot;\",\"'\":\"&#39;\"}[c];});}\nfunction msgErro(e){return (e && e.message ? e.message : String(e)).replace(/^Error:\\s*/,\"\");}\nfunction fn(n){return (Math.round(n*100)/100).toString().replace(\".\",\",\");}\nfunction pn(s){var n=parseFloat(String(s).replace(\",\",\".\"));return isNaN(n)?null:n;}\nfunction run(ok,fail){return google.script.run.withSuccessHandler(ok).withFailureHandler(fail||function(e){alert(msgErro(e));});}\n\n/* Entrada com a senha e bot\u00e3o Atualizar. */\nfunction entrar(){\n  if (typeof google === \"undefined\" || !google.script || !google.script.run) {\n    $(\"lerro\").textContent = \"O painel n\u00e3o est\u00e1 conectado ao Apps Script. Abra-o pelo endere\u00e7o /exec da implanta\u00e7\u00e3o (n\u00e3o como arquivo nem em outro site). Se j\u00e1 est\u00e1 nele, atualize a p\u00e1gina (Ctrl+F5).\";\n    return;\n  }\n  SENHA = $(\"senha\").value; $(\"lerro\").textContent = \"\"; $(\"entrar\").disabled = true;\n  run(function(d){\n    DADOS = d;\n    run(function(pf){\n      PERFIS = pf; $(\"entrar\").disabled = false; $(\"login\").hidden = true; $(\"cab\").hidden = false; montarFiltros(); mostrar(\"r\");\n    }, function(e){ $(\"entrar\").disabled = false; $(\"lerro\").textContent = msgErro(e); }).listarPerfis(SENHA);\n  }, function(e){ $(\"entrar\").disabled = false; $(\"lerro\").textContent = msgErro(e); }).listar(SENHA);\n}\n$(\"entrar\").onclick = entrar;\n$(\"senha\").onkeydown = function(e){ if(e.key===\"Enter\") entrar(); };\n$(\"atualizar\").onclick = function(){\n  $(\"atualizar\").disabled = true;\n  var falha=function(e){$(\"atualizar\").disabled=false;alert(msgErro(e));};\n  run(function(d){DADOS=d;run(function(pf){PERFIS=pf;$(\"atualizar\").disabled=false;montarFiltros();mostrar(TAB);},falha).listarPerfis(SENHA);},falha).listar(SENHA);\n};\n\n/* Aba Relat\u00f3rios: cart\u00f5es por turma, filtros e lista. */\nfunction experimentos(){var ex=[];DADOS.linhas.forEach(function(r){if(r.experimento&&ex.indexOf(r.experimento)<0)ex.push(r.experimento);});return ex.sort();}\nfunction montarFiltros(){\n  var ft=$(\"fturma\").value, fe=$(\"fexp\").value;\n  $(\"fexp\").innerHTML='<option value=\"\">Todos os experimentos</option>'+experimentos().map(function(t){return '<option>'+esc(t)+'</option>';}).join(\"\");\n  $(\"fturma\").innerHTML='<option value=\"\">Todas as turmas</option>'+DADOS.turmas.map(function(t){return '<option>'+esc(t)+'</option>';}).join(\"\");\n  $(\"fexp\").value=fe; $(\"fturma\").value=ft;\n  [\"fexp\",\"fturma\",\"fstatus\"].forEach(function(i){$(i).onchange=desenhar;}); $(\"busca\").oninput=desenhar;\n}\nfunction aval(r){return r.nota!==\"\";}\n\nfunction desenhar(){\n  $(\"detalhe\").hidden = true; $(\"cadastro\").hidden = true; $(\"acomp\").hidden = true; $(\"lista\").hidden = false;\n  var fe=$(\"fexp\").value, ft=$(\"fturma\").value, fs=$(\"fstatus\").value, b=$(\"busca\").value.trim().toLowerCase();\n  // painel de grupos: um bloco por experimento, um cart\u00e3o por turma\n  $(\"grupos\").innerHTML = experimentos().map(function(ex){\n    return '<div class=\"grupo\"><h3>'+esc(ex)+'</h3><div class=\"cards\">'+DADOS.turmas.map(function(t){\n      var a=DADOS.linhas.filter(function(r){return r.experimento===ex&&r.turma===t&&!r.substituida;}), v=a.filter(aval).length, l=a.filter(function(r){return r.liberado;}).length;\n      return '<button class=\"cardt'+(a.length?'':' zero')+(fe===ex&&ft===t?' on':'')+'\" data-e=\"'+esc(ex)+'\" data-t=\"'+esc(t)+'\"><b>'+esc(t)+'</b><div class=\"bar\"><i style=\"width:'+(a.length?v/a.length*100:0)+'%\"></i></div>'+\n        '<span class=\"muted\">'+a.length+' recebido(s) \u00b7 '+v+' avaliado(s) \u00b7 '+l+' liberado(s)</span></button>';\n    }).join(\"\")+'</div></div>';\n  }).join(\"\");\n  [].forEach.call($(\"grupos\").querySelectorAll(\".cardt\"),function(c){c.onclick=function(){\n    var on=c.classList.contains(\"on\"); $(\"fexp\").value=on?\"\":c.dataset.e; $(\"fturma\").value=on?\"\":c.dataset.t; desenhar();};});\n\n  VIS = DADOS.linhas.filter(function(r){\n    if(fs===\"h\"?!r.substituida:r.substituida) return false;\n    if(fe&&r.experimento!==fe) return false; if(ft&&r.turma!==ft) return false;\n    if(fs===\"p\"&&aval(r)) return false; if(fs===\"a\"&&!aval(r)) return false;\n    if(fs===\"o\"&&!(aval(r)&&!r.liberado)) return false; if(fs===\"l\"&&!r.liberado) return false;\n    return !b||String(r.integrantes).toLowerCase().indexOf(b)>=0;\n  }).sort(function(a,b){return b.linha-a.linha;});\n  $(\"corpo\").innerHTML = VIS.map(function(r,i){\n    return '<tr data-i=\"'+i+'\"><td>'+esc(r.data)+'</td><td>'+esc(r.experimento)+'</td><td>'+esc(r.turma)+'</td><td>'+esc(r.integrantes)+'</td><td>'+\n      (aval(r)?'<span class=\"badge ok\">Nota '+esc(fn(pn(r.nota)))+'</span>':'<span class=\"badge\">Sem avalia\u00e7\u00e3o</span>')+(r.reenvio?' <span class=\"badge\">Novo envio autorizado</span>':'')+(r.substituida?' <span class=\"badge\">Substitu\u00eddo</span>':'')+'</td><td>'+(r.liberado?'<span class=\"badge ok\">Liberado</span>':'<span class=\"muted\">Oculto</span>')+'</td></tr>';\n  }).join(\"\");\n  $(\"vazio\").hidden = VIS.length>0;\n  var pend=VIS.filter(function(r){return aval(r)&&!r.liberado;});\n  $(\"conta\").textContent = VIS.length+' relat\u00f3rio(s) na lista \u00b7 '+pend.length+' avaliado(s) ainda oculto(s)';\n  $(\"liberarTodos\").disabled = !pend.length;\n  [].forEach.call($(\"corpo\").children,function(tr){tr.onclick=function(){abrir(+tr.dataset.i);};});\n}\n$(\"liberarTodos\").onclick=function(){\n  var p=VIS.filter(function(r){return aval(r)&&!r.liberado;}); if(!p.length)return;\n  if(!confirm(\"Liberar a avalia\u00e7\u00e3o de \"+p.length+\" relat\u00f3rio(s) desta lista para os alunos?\"))return;\n  run(function(){p.forEach(function(r){r.liberado=true;});desenhar();}).liberarLote(SENHA,p.map(function(r){return r.linha;}),true);\n};\n\n/* Detalhe de um relat\u00f3rio: avalia\u00e7\u00e3o por quest\u00e3o, libera\u00e7\u00e3o e novo envio. */\nfunction tabelaHtml(t){\n  return '<h4>'+esc(t.titulo)+'</h4><div class=\"tw\"><table class=\"grid\"><thead><tr>'+t.cab.map(function(c){return '<th>'+esc(c)+'</th>';}).join(\"\")+'</tr></thead><tbody>'+\n    t.linhas.map(function(l){return '<tr>'+l.map(function(v){return '<td>'+esc(v)+'</td>';}).join(\"\")+'</tr>';}).join(\"\")+'</tbody></table></div>';\n}\n\nfunction abrir(i){\n  var r=VIS[i], d=r.dados, h='', tot=DADOS.nota_maxima||10;\n  h+='<div class=\"nav\"><button class=\"sec\" id=\"voltar\">Voltar \u00e0 lista</button><span><button class=\"sec\" id=\"ant\"'+(i<=0?' disabled':'')+'>Anterior</button> <button class=\"sec\" id=\"prox\"'+(i>=VIS.length-1?' disabled':'')+'>Pr\u00f3ximo</button></span></div>';\n  h+='<div class=\"card\"><h2>'+esc(r.integrantes)+'</h2><div class=\"muted\">'+esc(r.experimento)+' \u00b7 '+esc(r.turma)+' \u00b7 enviado em '+esc(r.data)+(d&&d.data?' \u00b7 experimento realizado em '+esc(d.data.split(\"-\").reverse().join(\"/\")):'')+' \u00b7 c\u00f3digo de acesso: <b class=\"cod\">'+esc(r.codigo)+'</b></div>';\n  if(d) (d.tabelas||[]).forEach(function(t){ if(t.id===\"nomes\") h+=tabelaHtml(t); });\n  h+='</div>';\n  if(!d) h+='<div class=\"card\">Os dados deste envio n\u00e3o puderam ser lidos.</div>';\n  (r.itens||[]).forEach(function(it,j){\n    var a=r.aval[it.q]||{};\n    h+='<div class=\"card\"><div class=\"ih\"><h3 style=\"margin:0\">'+(it.q===\"Fotos\"?'':'Quest\u00e3o '+esc(it.q)+' \u00b7 ')+esc(it.nome)+'</h3><span class=\"muted\">vale '+fn(it.max)+' ponto(s)</span></div>';\n    it.t.forEach(function(x){ h+=tabelaHtml(d.tabelas[x]); });\n    it.k.forEach(function(k){ h+='<h4>'+esc(k)+'</h4><div class=\"resp\">'+esc(d.textos[k])+'</div>'; });\n    if(it.f) h+='<div class=\"fotos\">'+(d.fotos||[]).map(function(f,n){return '<figure><figcaption class=\"muted\">'+esc(f.nome)+'</figcaption><div class=\"ph\" id=\"ft'+n+'\">Carregando foto\u2026</div></figure>';}).join(\"\")+'</div>';\n    h+='<div class=\"aval\"><div class=\"l1\"><label for=\"p'+j+'\"><b>Pontos</b></label><input class=\"pt\" id=\"p'+j+'\" data-q=\"'+esc(it.q)+'\" data-max=\"'+it.max+'\" inputmode=\"decimal\" value=\"'+(a.p===null||a.p===undefined?'':esc(fn(a.p)))+'\"><span class=\"muted\">de '+fn(it.max)+'</span>'+\n       '<button class=\"sec mini\" data-m=\"'+j+'\">Nota m\u00e1xima</button><button class=\"sec mini\" data-z=\"'+j+'\">Zero</button></div>'+\n       '<textarea id=\"c'+j+'\" data-q=\"'+esc(it.q)+'\" placeholder=\"Coment\u00e1rio para o aluno sobre esta quest\u00e3o (opcional)\">'+esc(a.c||'')+'</textarea></div></div>';\n  });\n  h+='<div class=\"card\"><h3 style=\"margin-top:0\">Coment\u00e1rio geral</h3><textarea id=\"cg\" placeholder=\"Coment\u00e1rio geral para o grupo (opcional)\">'+esc(r.comentario)+'</textarea></div>';\n  h+='<div class=\"barra\"><span class=\"tot\">Nota: <b id=\"tot\">0</b> / '+fn(tot)+' <span class=\"muted\" id=\"qtd\"></span></span>'+\n     '<label><input type=\"checkbox\" id=\"lib\"'+(r.liberado?' checked':'')+'> Liberar para o aluno ver</label>'+\n     (r.substituida?'':'<button class=\"sec\" id=\"reenv\">'+(r.reenvio?'Cancelar novo envio':'Autorizar novo envio')+'</button>')+'<button class=\"sec\" id=\"salvar\">Salvar</button><button id=\"salvarprox\"'+(i>=VIS.length-1?' disabled':'')+'>Salvar e ir ao pr\u00f3ximo</button><span class=\"muted\" id=\"smsg\"></span></div>';\n  $(\"detalhe\").innerHTML=h; $(\"lista\").hidden=true; $(\"detalhe\").hidden=false; window.scrollTo(0,0);\n\n  function soma(){\n    var t=0,n=0,tt=0; [].forEach.call($(\"detalhe\").querySelectorAll(\"input.pt\"),function(e){\n      tt++; var v=pn(e.value),mx=+e.dataset.max; e.classList.toggle(\"bad\",v!==null&&(v<0||v>mx+1e-9));\n      if(v!==null){t+=Math.max(0,Math.min(mx,v));n++;}});\n    $(\"tot\").textContent=fn(t); $(\"qtd\").textContent=\"(\"+n+\" de \"+tt+\" quest\u00f5es avaliadas)\";\n  }\n  soma();\n  $(\"detalhe\").oninput=soma;\n  [].forEach.call($(\"detalhe\").querySelectorAll(\"button[data-m],button[data-z]\"),function(b){b.onclick=function(){\n    var j=b.dataset.m!==undefined?b.dataset.m:b.dataset.z, e=$(\"p\"+j); e.value=b.dataset.m!==undefined?fn(+e.dataset.max):\"0\"; soma();};});\n  $(\"voltar\").onclick=desenhar; $(\"ant\").onclick=function(){abrir(i-1);}; $(\"prox\").onclick=function(){abrir(i+1);};\n  function salvar(depois){\n    var av={}; [].forEach.call($(\"detalhe\").querySelectorAll(\"input.pt\"),function(e){av[e.dataset.q]={p:e.value.trim(),c:\"\"};});\n    [].forEach.call($(\"detalhe\").querySelectorAll(\"textarea[data-q]\"),function(e){(av[e.dataset.q]=av[e.dataset.q]||{p:\"\"}).c=e.value.trim();});\n    var com=$(\"cg\").value.trim(), lib=$(\"lib\").checked; $(\"salvar\").disabled=true; $(\"salvarprox\").disabled=true; $(\"smsg\").textContent=\"Salvando\u2026\";\n    run(function(res){\n      r.aval=res.aval; r.nota=res.nota; r.comentario=com; r.liberado=lib; $(\"salvar\").disabled=false; $(\"salvarprox\").disabled=(i>=VIS.length-1);\n      if(depois&&i<VIS.length-1){abrir(i+1);} else {$(\"smsg\").textContent=\"Salvo. Nota \"+(res.nota===\"\"?\"\u2014\":fn(pn(res.nota)))+\".\";}\n    },function(e){$(\"salvar\").disabled=false;$(\"salvarprox\").disabled=false;$(\"smsg\").textContent=\"Erro: \"+msgErro(e);}).salvarAvaliacao(SENHA,r.linha,av,com,lib);\n  }\n  $(\"salvar\").onclick=function(){salvar(false);}; $(\"salvarprox\").onclick=function(){salvar(true);};\n  if($(\"reenv\")) $(\"reenv\").onclick=function(){\n    var novo=!r.reenvio;\n    if(novo&&!confirm(\"Autorizar este perfil a enviar este relat\u00f3rio novamente? O envio atual passa para o hist\u00f3rico quando o novo chegar.\"))return;\n    run(function(){r.reenvio=novo;$(\"reenv\").textContent=novo?\"Cancelar novo envio\":\"Autorizar novo envio\";$(\"smsg\").textContent=novo?\"Novo envio autorizado.\":\"Autoriza\u00e7\u00e3o cancelada.\";},function(e){$(\"smsg\").textContent=\"Erro: \"+msgErro(e);}).autorizarReenvio(SENHA,r.linha,novo);\n  };\n  if(d) (d.fotos||[]).forEach(function(f,n){\n    run(function(url){var el=$(\"ft\"+n);if(el)el.outerHTML='<img src=\"'+url+'\" alt=\"'+esc(f.nome)+'\">';},\n        function(){var el=$(\"ft\"+n);if(el)el.textContent=\"N\u00e3o foi poss\u00edvel carregar a foto.\";}).foto(SENHA,f.id);\n  });\n}\n\n/* Abas do painel. */\n// ---- Cadastro de alunos ----\nfunction mostrar(t){\n  TAB=t; $(\"detalhe\").hidden=true; $(\"lista\").hidden=t!==\"r\"; $(\"cadastro\").hidden=t!==\"c\"; $(\"acomp\").hidden=t!==\"a\";\n  $(\"tabR\").className=t===\"r\"?\"\":\"sec\"; $(\"tabA\").className=t===\"a\"?\"\":\"sec\"; $(\"tabC\").className=t===\"c\"?\"\":\"sec\";\n  if(t===\"r\") desenhar(); else if(t===\"a\") desenharAcomp(); else desenharCad();\n}\n$(\"tabR\").onclick=function(){mostrar(\"r\");}; $(\"tabA\").onclick=function(){mostrar(\"a\");}; $(\"tabC\").onclick=function(){mostrar(\"c\");};\n\n/* Aba Cadastro de alunos: perfis individuais, grupos e lote. */\nfunction turmasTodas(){var t=[];PERFIS.forEach(function(p){if(p.turma&&t.indexOf(p.turma)<0)t.push(p.turma);});DADOS.turmas.forEach(function(x){if(x&&t.indexOf(x)<0)t.push(x);});return t.sort();}\nfunction addMembro(){\n  if($(\"cmembros\").children.length>=5)return;\n  var d=document.createElement(\"div\"); d.className=\"mem\";\n  d.innerHTML='<input class=\"mn\" placeholder=\"Nome completo\" aria-label=\"Nome do integrante\"><input class=\"mm\" placeholder=\"Matr\u00edcula\" aria-label=\"Matr\u00edcula\" style=\"max-width:180px\">';\n  $(\"cmembros\").appendChild(d);\n}\n$(\"cadd\").onclick=addMembro;\n$(\"ccriar\").onclick=function(){\n  var ig=[].map.call($(\"cmembros\").children,function(d){return {nome:d.querySelector(\".mn\").value.trim(),matricula:d.querySelector(\".mm\").value.trim()};}).filter(function(i){return i.nome;});\n  var turma=$(\"cturma\").value.trim(); $(\"cmsg\").textContent=\"\";\n  if(!turma){$(\"cmsg\").textContent=\"Informe a turma.\";return;}\n  if(!ig.length){$(\"cmsg\").textContent=\"Informe pelo menos um nome.\";return;}\n  $(\"ccriar\").disabled=true;\n  run(function(p){PERFIS.push(p);$(\"ccriar\").disabled=false;$(\"cmembros\").innerHTML=\"\";$(\"cnome\").value=\"\";addMembro();desenharCad();$(\"cmsg\").textContent=\"Perfil criado. C\u00f3digo de acesso: \"+p.codigo;},\n      function(e){$(\"ccriar\").disabled=false;$(\"cmsg\").textContent=\"Erro: \"+msgErro(e);}).criarPerfil(SENHA,turma,$(\"cnome\").value.trim(),ig);\n};\n$(\"cloteBtn\").onclick=function(){\n  var turma=$(\"cturma\").value.trim(), txt=$(\"clote\").value; $(\"clmsg\").textContent=\"\";\n  if(!turma){$(\"clmsg\").textContent=\"Informe a turma no campo acima.\";return;}\n  if(!txt.trim()){$(\"clmsg\").textContent=\"Cole a lista de alunos.\";return;}\n  $(\"cloteBtn\").disabled=true;\n  run(function(l){PERFIS=PERFIS.concat(l);$(\"cloteBtn\").disabled=false;$(\"clote\").value=\"\";$(\"cfturma\").value=turma;desenharCad();$(\"clmsg\").textContent=l.length+\" perfil(is) criado(s).\";},\n      function(e){$(\"cloteBtn\").disabled=false;$(\"clmsg\").textContent=\"Erro: \"+msgErro(e);}).criarLote(SENHA,turma,txt);\n};\n$(\"cfturma\").onchange=function(){desenharCad();}; $(\"cbusca\").oninput=function(){desenharCad();};\nfunction desenharCad(){\n  var ts=turmasTodas(), ft=$(\"cfturma\").value;\n  $(\"dturmas\").innerHTML=ts.map(function(t){return '<option value=\"'+esc(t)+'\">';}).join(\"\");\n  $(\"cfturma\").innerHTML='<option value=\"\">Todas as turmas</option>'+ts.map(function(t){return '<option>'+esc(t)+'</option>';}).join(\"\"); $(\"cfturma\").value=ft;\n  if(!$(\"cmembros\").children.length) addMembro();\n  var b=$(\"cbusca\").value.trim().toLowerCase();\n  var L=PERFIS.filter(function(p){return (!ft||p.turma===ft)&&(!b||(p.nome+\" \"+p.integrantes.map(function(i){return i.nome;}).join(\" \")).toLowerCase().indexOf(b)>=0);});\n  $(\"cperfis\").innerHTML=L.map(function(p){\n    var n=DADOS.linhas.filter(function(r){return r.codigo===p.codigo&&!r.substituida;}).length;\n    return '<tr'+(p.ativo?'':' style=\"opacity:.55\"')+'><td><span class=\"cod\">'+esc(p.codigo)+'</span></td><td>'+esc(p.turma)+'</td><td><b>'+esc(p.nome)+'</b><div class=\"muted\">'+esc(p.tipo)+(p.ativo?'':' \u00b7 desativado')+'</div></td><td>'+\n      p.integrantes.map(function(i){return esc(i.nome)+(i.matricula?' ('+esc(i.matricula)+')':'');}).join('<br>')+'</td><td>'+n+'</td><td><button class=\"sec mini\" data-c=\"'+esc(p.codigo)+'\">'+(p.ativo?'Desativar':'Ativar')+'</button></td></tr>';\n  }).join(\"\");\n  $(\"cvazio\").hidden=L.length>0;\n  [].forEach.call($(\"cperfis\").querySelectorAll(\"button[data-c]\"),function(bt){bt.onclick=function(){\n    var p=PERFIS.filter(function(x){return x.codigo===bt.dataset.c;})[0], novo=!p.ativo;\n    run(function(){p.ativo=novo;desenharCad();}).alternarPerfil(SENHA,p.codigo,novo);};});\n  $(\"ccopia\").value=L.map(function(p){return p.integrantes.map(function(i){return i.nome;}).join(\", \")+\"\\t\"+p.codigo;}).join(\"\\n\");\n}\n\n/* Aba Acompanhamento: quem enviou e quem falta, por relat\u00f3rio e turma. */\n// ---- Acompanhamento: quem enviou e quem falta, por relat\u00f3rio e turma ----\nfunction envioDe(p,ex){return DADOS.linhas.filter(function(x){return x.codigo===p.codigo&&x.experimento===ex&&!x.substituida;})[0];}\nfunction irPara(linha){\n  var x=DADOS.linhas.filter(function(l){return l.linha===linha;})[0]; if(!x)return;\n  $(\"fexp\").value=x.experimento; $(\"fturma\").value=\"\"; $(\"fstatus\").value=\"\"; $(\"busca\").value=\"\";\n  mostrar(\"r\");\n  for(var i=0;i<VIS.length;i++){ if(VIS[i].linha===linha){abrir(i);break;} }\n}\nfunction desenharAcomp(){\n  var exs=experimentos(), ts=turmasTodas(), fe=$(\"aexp\").value||exs[0]||\"\", ft=$(\"aturma\").value, fs=$(\"asit\").value;\n  $(\"aexp\").innerHTML=exs.map(function(t){return '<option>'+esc(t)+'</option>';}).join(\"\"); $(\"aexp\").value=fe;\n  $(\"aturma\").innerHTML='<option value=\"\">Todas as turmas</option>'+ts.map(function(t){return '<option>'+esc(t)+'</option>';}).join(\"\"); $(\"aturma\").value=ft;\n  [\"aexp\",\"aturma\",\"asit\"].forEach(function(i){$(i).onchange=desenharAcomp;});\n  if(!exs.length){ $(\"acorpo\").innerHTML=\"\"; $(\"aresumo\").textContent=\"\"; $(\"apend\").value=\"\"; $(\"avazio\").hidden=false; $(\"avazio\").textContent=\"Nenhum relat\u00f3rio foi enviado ainda.\"; return; }\n  var L=PERFIS.filter(function(p){return p.ativo&&(!ft||p.turma===ft);}).map(function(p){return {p:p,r:envioDe(p,fe)};});\n  var env=L.filter(function(x){return x.r;}), av=env.filter(function(x){return aval(x.r);}), lib=env.filter(function(x){return x.r.liberado;});\n  $(\"aresumo\").textContent=esc0(fe)+\": \"+env.length+\" de \"+L.length+\" perfil(is) enviaram \u00b7 \"+av.length+\" avaliado(s) \u00b7 \"+lib.length+\" liberado(s) \u00b7 \"+(L.length-env.length)+\" pendente(s)\";\n  var V=L.filter(function(x){return !fs||(fs===\"e\")===!!x.r;});\n  $(\"acorpo\").innerHTML=V.map(function(x){\n    var s=!x.r?'<span class=\"badge\">N\u00e3o enviou</span>':\n      (aval(x.r)?'<span class=\"badge ok\">Nota '+esc(fn(pn(x.r.nota)))+'</span>':'<span class=\"badge\">Aguardando avalia\u00e7\u00e3o</span>')+\n      (x.r.liberado?' <span class=\"badge ok\">Liberado</span>':'')+(x.r.reenvio?' <span class=\"badge\">Novo envio autorizado</span>':'');\n    return '<tr><td>'+esc(x.p.turma)+'</td><td><b>'+esc(x.p.nome)+'</b><div class=\"muted\">'+esc(x.p.tipo)+'</div></td><td>'+x.p.integrantes.map(function(i){return esc(i.nome);}).join('<br>')+'</td><td>'+s+'</td><td>'+\n      (x.r?'<button class=\"sec mini\" data-l=\"'+x.r.linha+'\">Abrir</button>':'')+'</td></tr>';\n  }).join(\"\");\n  $(\"avazio\").hidden=V.length>0; $(\"avazio\").textContent=\"Nenhum perfil nesta situa\u00e7\u00e3o.\";\n  [].forEach.call($(\"acorpo\").querySelectorAll(\"button[data-l]\"),function(bt){bt.onclick=function(){irPara(+bt.dataset.l);};});\n  $(\"apend\").value=L.filter(function(x){return !x.r;}).map(function(x){return x.p.integrantes.map(function(i){return i.nome;}).join(\", \")+\" (\"+x.p.turma+\")\";}).join(\"\\n\");\n}\nfunction esc0(s){return String(s);}\n\n</script>\n</body>\n</html>\n";
