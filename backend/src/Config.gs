// CONFIGURAÇÃO DO BACK-END: o professor edita só este arquivo.

var VERSAO = "1.0.0";                        // versão do sistema (aparece no painel e no diagnóstico)
var SENHA_PROFESSOR = "troque-esta-senha";   // senha do painel
var NOTA_MAXIMA = 10;                        // nota total de cada relatório
// Pesos opcionais por questão (valores relativos). Questão não listada vale 1.
// Exemplo: "Relatório Lei de Hooke": { "3b": 2, "7": 2 }
var PESOS = {};

// ---- Estrutura das planilhas (não mude depois de ter dados; a aba antiga é preservada se mudar) ----
var NOME_ABA = "Respostas";
var ABA_PERFIS = "Perfis";
var CABECALHO = ["Data e hora", "Turma", "Experimento", "Integrantes", "Nota", "Comentário geral",
                 "Liberado ao aluno", "Código do perfil", "Fotos", "Dados (JSON)", "Avaliação (JSON)",
                 "Reenvio autorizado", "Substituída"];
var CAB_PERFIS = ["Código de acesso", "Turma", "Nome do perfil", "Tipo", "Integrantes (JSON)", "Criado em", "Ativo"];
