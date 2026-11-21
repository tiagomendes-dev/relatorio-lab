/* "Meus relatórios": o aluno entra com o código do perfil e vê o que enviou, o que falta e as notas. */
(function () {
  const { $, esc, fn } = Lab.util;
  const RELATORIOS = (window.LAB_CONFIG || {}).RELATORIOS || [];
  let codigo = "";

  function cartao(nome, e, link) {
    const url = link ? esc(link) + "#" + codigo : "";
    let h = '<section><div class="rh"><h2 style="margin:0">' + esc(nome) + '</h2>';
    if (!e) {
      h += '<span class="badge">Ainda não enviado</span></div>' + (link ? '<a class="btn" href="' + url + '">Preencher relatório</a>' : '') + '</section>';
      return h;
    }
    h += e.estado === "liberado" ? '<span class="badge ok">Avaliado</span></div>' : '<span class="badge">Aguardando avaliação</span></div>';
    h += '<div class="hint">Enviado em ' + esc(e.data) + '</div>';
    if (e.reenvio) h += '<p><span class="badge">O professor autorizou um novo envio deste relatório.</span></p>' + (link ? '<a class="btn" href="' + url + '">Enviar novamente</a>' : '');
    if (e.estado !== "liberado") return h + '<p>O professor ainda não liberou a avaliação. Volte mais tarde.</p></section>';
    h += '<div class="big">' + (e.nota === "" ? "—" : fn(e.nota)) + ' <span class="hint" style="font-size:1rem;font-weight:400">de ' + fn(e.max) + '</span></div>';
    h += '<div class="grid-wrap"><table class="grid"><thead><tr><th>Questão</th><th>Nota</th><th>Comentário do professor</th></tr></thead><tbody>' +
      e.itens.map(i => '<tr><td class="l">' + (i.q === "Fotos" ? "" : esc(i.q) + " · ") + esc(i.nome) + '</td><td>' + (i.pts === null ? '—' : fn(i.pts)) + ' / ' + fn(i.max) + '</td><td class="l">' + esc(i.com) + '</td></tr>').join("") + '</tbody></table></div>';
    if (e.comentario) h += '<h3>Comentário geral</h3><p>' + esc(e.comentario) + '</p>';
    return h + '</section>';
  }

  function mostrar(d) {
    if (d.estado !== "ok") { $("erro").textContent = "Código não encontrado. Confira com o professor."; $("res").innerHTML = ""; return; }
    $("entrada").style.display = "none";
    let h = '<section><div class="rh"><div><h2 style="margin:0">' + esc(d.nome) + '</h2><div class="hint">' + esc(d.turma) + ' · ' + d.integrantes.map(i => esc(i.nome)).join(", ") + '</div></div><button type="button" class="mini" id="atual">Atualizar</button></div></section>';
    const usados = [];
    RELATORIOS.filter(r => r.aberto).forEach(r => {
      const e = d.envios.find(x => x.experimento === r.nome);
      if (e) usados.push(e);
      h += cartao(r.nome, e, "../relatorios/" + r.id + "/");
    });
    d.envios.filter(e => usados.indexOf(e) < 0).forEach(e => { h += cartao(e.experimento, e, ""); });
    $("res").innerHTML = h;
    $("atual").onclick = consultar;
  }

  async function consultar() {
    const erro = $("erro"); erro.textContent = "";
    if (!codigo) { erro.textContent = "Digite o código."; return; }
    $("ver").disabled = true;
    try { mostrar(await Lab.api.json({ acao: "minhas", codigo: codigo })); }
    catch (e) { erro.textContent = e.message === "SEM_ENDPOINT" ? "Sistema não configurado: falta o endereço do Apps Script (ENDPOINT em assets/js/config.js)." : "Não foi possível consultar agora. Tente de novo em instantes."; }
    $("ver").disabled = false;
  }

  $("ver").onclick = () => { codigo = $("cod").value.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""); consultar(); };
  $("cod").onkeydown = e => { if (e.key === "Enter") $("ver").click(); };
  if (location.hash.length > 1) { $("cod").value = decodeURIComponent(location.hash.slice(1)); $("ver").click(); }
})();
