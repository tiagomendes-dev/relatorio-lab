/* Diagnóstico de instalação: ajuda quem instala o sistema (e quem dá suporte) a achar o problema. */
(function () {
  const { $, esc } = Lab.util;
  const cfg = window.LAB_CONFIG || {};
  const ICONE = { ok: "OK", aviso: "ATENÇÃO", erro: "ERRO" };

  async function testar() {
    const R = [];
    if (!cfg.ENDPOINT) R.push({ n: "erro", t: "ENDPOINT vazio em assets/js/config.js.", d: "Cole o endereço /exec da implantação do Apps Script." });
    else {
      R.push({ n: "ok", t: "ENDPOINT preenchido." });
      if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(cfg.ENDPOINT))
        R.push({ n: "aviso", t: "O endereço não tem o formato esperado.", d: "Deve ser https://script.google.com/macros/s/.../exec (URL do app da Web, terminada em /exec)." });
      try {
        const t = await Lab.api.enviar({ acao: "ping" });
        if (t.charAt(0) === "{") {
          const d = JSON.parse(t);
          R.push({ n: "ok", t: "Back-end respondeu (versão " + d.versao + ")." });
          if (String(d.versao).split(".")[0] !== String(cfg.VERSAO).split(".")[0])
            R.push({ n: "aviso", t: "Versões incompatíveis: front-end " + cfg.VERSAO + " e back-end " + d.versao + ".", d: "Atualize o Code.gs e o front-end para a mesma versão principal." });
        }
        else if (t === "codigo invalido") R.push({ n: "erro", t: "O back-end responde, mas é uma versão antiga.", d: "Cole o Code.gs mais recente e publique uma Nova versão da implantação." });
        else if (t.charAt(0) === "<") R.push({ n: "erro", t: "O Google recusou o acesso.", d: "Em Implantar > Gerenciar implantações: acesso 'Qualquer pessoa' e versão mais recente." });
        else R.push({ n: "erro", t: "Resposta inesperada: " + t.slice(0, 120) });
      } catch (e) {
        R.push({ n: "erro", t: "Não foi possível falar com o endereço.", d: "Verifique a internet e se o endereço /exec está correto." });
      }
    }
    for (const r of cfg.RELATORIOS || []) {
      try {
        const x = await fetch("../relatorios/" + r.id + "/definicao.js", { cache: "no-store" });
        R.push(x.ok ? { n: "ok", t: "Relatório publicado: " + r.nome + "." } : { n: "erro", t: "Relatório não encontrado: " + r.nome + ".", d: "A pasta relatorios/" + r.id + " não foi publicada." });
      } catch (e) {
        R.push({ n: "aviso", t: "Não foi possível verificar: " + r.nome + ".", d: "Abra esta página pela hospedagem, não como arquivo no computador." });
      }
    }
    $("saida").innerHTML = R.map(i => '<p><span class="badge' + (i.n === "ok" ? " ok" : "") + '">' + ICONE[i.n] + '</span> ' + esc(i.t) + (i.d ? '<br><span class="hint">' + esc(i.d) + '</span>' : '') + '</p>').join("");
  }
  $("testar").onclick = async () => { $("testar").disabled = true; await testar(); $("testar").disabled = false; };
})();
