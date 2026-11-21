/* CONFIGURAÇÃO DO FRONT-END: o único arquivo que o professor edita aqui. */
window.LAB_CONFIG = {
  VERSAO: "1.0.0",   // versão do front-end (o diagnóstico compara com a do back-end)

  // Endereço terminado em /exec da implantação do Apps Script (vale para TODAS as páginas).
  ENDPOINT: "https://script.google.com/macros/s/AKfycbxIw1AI_e-SfPkwX7IJEPud0FAu50FHjt8w1adwLqVZimHXj0c4fMTIkMjcYFIqYKdUwg/exec",

  // Relatórios exibidos em "Meus relatórios". "id" = nome da pasta em /relatorios/.
  // "nome" deve ser igual ao campo "experimento" do arquivo definicao.js do relatório.
  // Use aberto:false para esconder um relatório até a semana dele.
  RELATORIOS: [
    { id: "prensa-hidraulica", nome: "Relatório Prensa Hidráulica", aberto: true },
    { id: "lei-de-hooke",      nome: "Relatório Lei de Hooke",      aberto: true },
    { id: "queda-livre",       nome: "Relatório Queda Livre",       aberto: true }
  ]
};
