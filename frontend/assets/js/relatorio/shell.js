/* Monta a "casca" comum de todo relatório: título, acesso, identificação, fotos, envio e confirmação.
   O conteúdo das questões vem do <template id="conteudo"> da página de cada relatório. */
Lab.shell = (function () {
  const { $, esc } = Lab.util;
  function montar(def) {
    document.title = def.titulo;
    $("app").innerHTML =
      '<div id="form">' +
        '<h1>' + esc(def.titulo) + '</h1>' +
        '<p class="sub">Preencha tudo e clique em Enviar relatório no final. Só o professor recebe as respostas.</p>' +
        '<section id="acesso"><h2>Acesso do grupo</h2>' +
          '<p class="hint" style="margin-top:0">Entre com o código de acesso que o professor cadastrou para você ou para o seu grupo.</p>' +
          '<label for="codigo" style="margin-top:0">Código de acesso</label>' +
          '<input id="codigo" autocomplete="off" maxlength="12" style="max-width:240px;text-transform:uppercase">' +
          '<p><button type="button" id="entrarPerfil">Entrar</button></p>' +
          '<div class="err" id="aerro" role="alert"></div>' +
          '<p class="hint" id="perfilinfo"></p>' +
          '<p class="hint"><a href="../../acompanhar/">Ver meus relatórios e notas</a></p>' +
        '</section>' +
        '<section><label for="data" style="margin-top:0">Data</label><input type="date" id="data" style="max-width:200px">' +
          '<h2 style="margin-top:20px">Integrantes</h2><div data-t="nomes"></div></section>' +
        '<div id="slot"></div>' +
        '<section><h2>Anexe as fotos</h2><div id="fotos"></div></section>' +
        '<div class="err" id="erro" role="alert"></div>' +
        '<button type="button" id="enviar">Enviar relatório</button>' +
      '</div>' +
      '<section id="ok"><h2>Relatório enviado</h2>' +
        '<p>O professor recebeu o relatório de <strong id="quem"></strong>.</p>' +
        '<div id="cod"><p class="hint">Para acompanhar a avaliação, entre em <a href="../../acompanhar/">Meus relatórios</a> com o mesmo código de acesso.</p></div>' +
      '</section>';
    $("slot").replaceWith($("conteudo").content.cloneNode(true));
  }
  return { montar };
})();
