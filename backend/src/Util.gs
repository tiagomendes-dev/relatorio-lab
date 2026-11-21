// UTILIDADES gerais (respostas HTTP, JSON, senha).

// ---- Auxiliares ----
function checar(senha) {
  if (String(senha) !== SENHA_PROFESSOR) throw new Error("Senha incorreta.");
}

function lerJson(s) {
  try { return JSON.parse(s); } catch (e) { return null; }
}

function resposta(txt) { return ContentService.createTextOutput(txt); }

function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
