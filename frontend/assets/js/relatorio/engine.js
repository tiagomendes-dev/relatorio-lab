/* Motor dos relatórios: desenha as tabelas da definição, coleta as respostas e envia.
   Nada aqui é específico de um experimento: o que muda de um relatório para outro fica em definicao.js. */
Lab.relatorio = (function () {
  const { $, num, okn, fmt, plain } = Lab.util;
  const def = window.RELATORIO;

  // Tabelas presentes em todo relatório (identificação e instrumentos)
  const PADRAO = {
    nomes: { k: "Nomes e matrículas", cab: ["Nomes", "Nº matrícula"], c: "tt", n: 5 },
    ins:   { k: "1a) Instrumentos de medida", cab: ["Nome do instrumento de medida", "Precisão", "Erro"], c: "ttt", n: 3 }
  };
  const T = Object.assign({}, PADRAO, def.tabelas);
  const AUTO = !!def.autoCalculo && typeof def.calcular === "function";
  const DER = [];   // ids das células calculadas

  /* Tipos de coluna (campo "c" de cada tabela): t=texto, n=número digitado, d=calculado,
     f=rótulo fixo (vem de "fix"), m=célula calculada única que ocupa todas as linhas. */
  function inp(id, ty, lab, pre) {
    return '<input id="' + id + '" data-ty="' + ty + '"' + (pre ? ' data-pre="1"' : '') + ' aria-label="' + lab + '" autocomplete="off"' + (ty === "n" ? ' inputmode="decimal"' : '') + '>';
  }
  function build(id) {
    const t = T[id];
    let h = '<table class="grid"><thead><tr><th></th>' + t.cab.map(c => '<th>' + c + '</th>').join("") + '</tr></thead><tbody>';
    for (let r = 0; r < t.n; r++) {
      h += '<tr><td class="n">' + (r + 1) + '</td>';
      for (let c = 0; c < t.c.length; c++) {
        const ty = t.c[c], cid = id + "_" + r + "_" + c;
        if (ty === "f") h += '<td class="fx">' + t.fix[r] + '</td>';
        else if (ty === "m") { if (r === 0) { h += '<td rowspan="' + t.n + '">' + inp(id + "_m_" + c, "m", plain(t.cab[c])) + '</td>'; DER.push(id + "_m_" + c); } }
        else { h += '<td>' + inp(cid, ty, plain(t.cab[c]) + " linha " + (r + 1), t.pre && t.pre.indexOf(c) >= 0) + '</td>'; if (ty === "d") DER.push(cid); }
      }
      h += '</tr>';
    }
    return h + '</tbody></table>';
  }

  // Cálculo automático (opcional; desligado por padrão: o aluno preenche tudo)
  function calc() {
    if (!AUTO) return {};
    const R = {}, g = id => num($(id).value);
    const put = (id, v) => { if (okn(v) || typeof v === "string") R[id] = v; };
    const pre = (id, v) => { const e = $(id); if (!e.dataset.t) e.value = okn(v) ? fmt(v) : ""; };
    const stat = (arr, p) => {
      const a = arr.filter(okn); if (!a.length) return;
      const m = a.reduce((s, x) => s + x, 0) / a.length;
      const s = Math.sqrt(a.reduce((t, x) => t + (x - m) * (x - m), 0) / a.length);
      put(p + "_0_0", m); put(p + "_0_1", s); put(p + "_0_2", fmt(m) + " ± " + fmt(s));
    };
    def.calcular(R, g, put, stat, pre);
    DER.forEach(id => { const e = $(id); e.readOnly = true; e.value = id in R ? fmt(R[id]) : ""; });
    return R;
  }

  function coletar() {
    const tabelas = [], textos = {}; let vazias = 0;
    for (const id in T) {
      if (!document.querySelector('[data-t="' + id + '"]')) continue;
      const t = T[id], linhas = [];
      for (let r = 0; r < t.n; r++) {
        const row = []; let algum = false;
        for (let c = 0; c < t.c.length; c++) {
          const ty = t.c[c];
          if (ty === "f") { row.push(plain(t.fix[r])); continue; }
          const v = $(ty === "m" ? id + "_m_" + c : id + "_" + r + "_" + c).value.trim();
          if (v) algum = true; else if (ty !== "t" && (ty !== "m" || r === 0)) vazias++;
          row.push(v);
        }
        if ((id !== "nomes" && id !== "ins") || algum) linhas.push(row);
      }
      tabelas.push({ id: id, titulo: t.k, cab: t.cab.map(plain), linhas: linhas });
    }
    document.querySelectorAll("textarea[data-k]").forEach(q => textos[q.dataset.k] = q.value.trim());
    return { tabelas, textos, vazias };
  }

  function comprimir(file) {
    return new Promise((ok, no) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const s = Math.min(1, 1100 / Math.max(img.width, img.height)), c = document.createElement("canvas");
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          ok(c.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = no; img.src = fr.result;
      };
      fr.onerror = no; fr.readAsDataURL(file);
    });
  }

  async function enviar() {
    const erro = $("erro"), btn = $("enviar"); erro.textContent = "";
    const falha = m => { erro.textContent = m; erro.scrollIntoView({ block: "center" }); };
    const perfil = Lab.acesso.perfil;
    if (!perfil) return falha("Entre com o código de acesso do grupo antes de enviar.");
    const { tabelas, textos, vazias } = (calc(), coletar());
    for (const q of document.querySelectorAll("textarea[data-k]")) if (!q.value.trim()) { q.focus(); return falha("Responda: " + q.dataset.k); }
    for (let i = 0; i < def.fotos.length; i++) if (!$("foto" + i).files[0]) return falha("Anexe a foto: " + def.fotos[i] + ".");
    const nomes = perfil.integrantes.map(i => i.nome);
    if (!confirm((vazias ? vazias + " célula(s) de tabela em branco. " : "") + "Enviar o relatório de " + nomes.join(", ") + "? Depois de enviado, não dá para editar.")) return;

    btn.disabled = true; btn.textContent = "Enviando…";
    const volta = m => { btn.disabled = false; btn.textContent = "Enviar relatório"; falha(m); };
    const fotos = [];
    try { for (let i = 0; i < def.fotos.length; i++) fotos.push({ nome: def.fotos[i], dados: await comprimir($("foto" + i).files[0]) }); }
    catch (e) { return volta("Não foi possível ler as fotos. Escolha arquivos de imagem."); }

    try {
      const t = await Lab.api.enviar({ codigo: perfil.codigo, experimento: def.experimento, integrantes: nomes, data: $("data").value, tabelas, textos, fotos });
      if (t === "ok" || t.indexOf("ok:") === 0) {
        $("quem").textContent = nomes.join(", ");
        $("form").style.display = "none"; $("ok").style.display = "block"; window.scrollTo(0, 0);
      }
      else if (t === "ja enviado") volta("Este perfil já enviou este relatório. O professor precisa autorizar um novo envio.");
      else if (t === "codigo invalido") volta("Código de acesso inválido. Confira com o professor.");
      else if (t.charAt(0) === "<") volta("O Google recusou o envio. O professor precisa conferir se a implantação está com acesso para Qualquer pessoa e na versão mais recente.");
      else volta("O script do professor respondeu com erro: " + t.slice(0, 150));
    } catch (e) {
      volta(e.message === "SEM_ENDPOINT" ? "Sistema não configurado: falta o endereço do Apps Script (ENDPOINT em assets/js/config.js)." : "Não foi possível confirmar o envio. Verifique a internet e tente de novo.");
    }
  }

  function iniciar() {
    document.querySelectorAll("[data-t]").forEach(d => { if (T[d.dataset.t]) d.innerHTML = '<div class="grid-wrap">' + build(d.dataset.t) + '</div>'; });
    if (AUTO) document.body.classList.add("auto");
    $("data").value = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
    $("fotos").innerHTML = def.fotos.map((f, i) => '<label for="foto' + i + '">' + f + '</label><input type="file" id="foto' + i + '" accept="image/*">').join("");
    document.addEventListener("input", e => { if (e.target.dataset && e.target.dataset.pre) e.target.dataset.t = "1"; calc(); });
    $("enviar").onclick = enviar;
    calc();
  }
  return { iniciar, coletar, tabelas: T };
})();
