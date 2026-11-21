/* MODELO DE RELATÓRIO: copie esta pasta, renomeie e edite. Passo a passo em docs/NOVO-RELATORIO.md.
   Tipos de coluna em "c": t=texto, n=número digitado, d=calculado, f=rótulo fixo (lista "fix"), m=calculado único. */
(function () {
  window.RELATORIO = {
    experimento: "Relatório Modelo",   // nome único; deve ser igual ao registrado em assets/js/config.js
    titulo: "Relatório: modelo",
    autoCalculo: false,                // false: o aluno preenche tudo
    fotos: ["Foto do experimento"],
    tabelas: {
      medidas: {
        k: "1b) Medidas",              // o título começa com o número da questão
        cab: ["Massa (kg)", "Tempo (s)", "Velocidade (m/s)"],
        c: "nnn",                      // um tipo por coluna
        n: 5                           // número de linhas
      }
    }
  };
})();
