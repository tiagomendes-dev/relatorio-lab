/* Comunicação com o Apps Script. Todas as telas falam com o servidor só por aqui. */
Lab.api = (function () {
  async function enviar(corpo) {
    const url = (window.LAB_CONFIG || {}).ENDPOINT;
    if (!url) throw new Error("SEM_ENDPOINT");
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(corpo) });
    return (await r.text()).trim();
  }
  async function json(corpo) {
    const t = await enviar(corpo);
    if (t.charAt(0) !== "{") throw new Error("RESPOSTA_INVALIDA");
    return JSON.parse(t);
  }
  return { enviar, json };
})();
