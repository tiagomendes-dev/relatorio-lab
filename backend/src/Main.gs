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
