// ACESSO ÀS PLANILHAS E AO DRIVE.
// Colunas de "Respostas": 1 data, 2 turma, 3 experimento, 4 integrantes, 5 nota, 6 comentário geral,
// 7 liberado, 8 código do perfil, 9 fotos, 10 dados, 11 avaliação, 12 reenvio autorizado, 13 substituída.

function preparar(nome, cab, antigaPrefixo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getSheetByName(nome);
  if (aba && aba.getLastRow() > 0) {
    var atual = aba.getRange(1, 1, 1, cab.length).getValues()[0];
    if (atual.join("|") !== cab.join("|")) {   // estrutura antiga: preserva com outro nome
      aba.setName(antigaPrefixo + " " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmm"));
      aba = null;
    }
  }
  if (!aba) aba = ss.getSheetByName(nome) || ss.insertSheet(nome);
  if (aba.getLastRow() === 0) {
    aba.appendRow(cab);
    aba.getRange(1, 1, 1, cab.length).setFontWeight("bold").setBackground("#e6f2ee");
    aba.setFrozenRows(1);
  }
  return aba;
}

function abaRespostas() { return preparar(NOME_ABA, CABECALHO, "Respostas antiga"); }

function abaPerfis() { return preparar(ABA_PERFIS, CAB_PERFIS, "Perfis antiga"); }

function pastaFotos() {
  var it = DriveApp.getFoldersByName("Fotos dos relatórios");
  return it.hasNext() ? it.next() : DriveApp.createFolder("Fotos dos relatórios");
}
