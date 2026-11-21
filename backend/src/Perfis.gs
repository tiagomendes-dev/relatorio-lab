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
