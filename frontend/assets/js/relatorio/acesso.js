/* Entrada do aluno pelo código de acesso do perfil cadastrado pelo professor. */
Lab.acesso = (function () {
  const { $ } = Lab.util;
  const def = window.RELATORIO;
  const estado = { perfil: null };

  async function entrar() {
    const cod = $("codigo").value.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""), erro = $("aerro"); erro.textContent = "";
    if (!cod) { erro.textContent = "Digite o código de acesso."; return; }
    $("entrarPerfil").disabled = true;
    try {
      const d = await Lab.api.json({ acao: "perfil", codigo: cod, experimento: def.experimento });
      if (d.estado === "nao") erro.textContent = "Código não encontrado. Confira com o professor.";
      else if (d.estado === "enviado") erro.textContent = "Este perfil já enviou este relatório. Para enviar de novo, o professor precisa autorizar.";
      else {
        estado.perfil = Object.assign({ codigo: cod }, d);
        $("codigo").value = cod; $("codigo").readOnly = true; $("entrarPerfil").style.display = "none";
        $("perfilinfo").textContent = "Perfil: " + d.nome + " · " + d.turma + (d.estado === "reenvio" ? " · novo envio autorizado pelo professor" : "");
        for (let i = 0; i < 5; i++) {
          const n = $("nomes_" + i + "_0"), m = $("nomes_" + i + "_1"), p = d.integrantes[i];
          if (p) { n.value = p.nome; m.value = p.matricula || ""; n.readOnly = true; m.readOnly = true; }
          else n.closest("tr").style.display = "none";
        }
        document.body.classList.add("logado");
      }
    } catch (e) {
      erro.textContent = e.message === "SEM_ENDPOINT" ? "Sistema não configurado: falta o endereço do Apps Script (ENDPOINT em assets/js/config.js)." : "Não foi possível verificar o código agora. Tente de novo.";
    }
    $("entrarPerfil").disabled = false;
  }

  function iniciar() {
    $("entrarPerfil").onclick = entrar;
    $("codigo").onkeydown = e => { if (e.key === "Enter") entrar(); };
    if (location.hash.length > 1) { $("codigo").value = decodeURIComponent(location.hash.slice(1)); entrar(); }   // vindo de "Meus relatórios"
  }
  return { iniciar, get perfil() { return estado.perfil; } };
})();
