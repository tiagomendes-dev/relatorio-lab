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
