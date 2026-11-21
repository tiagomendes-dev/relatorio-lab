#!/usr/bin/env python3
"""Gera dist/apps-script/Code.gs: todos os .gs do back-end + o painel do professor embutido.

Uso (na raiz do projeto):  python3 scripts/build_backend.py
O arquivo gerado é o único que precisa ser colado no Apps Script.
"""
import json, os, re, shutil

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def ler(*p):
    with open(os.path.join(RAIZ, *p), encoding="utf-8") as f:
        return f.read()

# ordem de junção dos arquivos .gs (Config primeiro; PainelEmbutido por último)
GS = ["Config", "Util", "Planilha", "Perfis", "Envios", "Avaliacao", "Main", "Setup", "PainelEmbutido"]

def montar_painel():
    css = "\n".join(ler("frontend", "assets", "css", n) for n in ("tema.css", "base.css", "componentes.css"))
    css += "\n" + ler("backend", "painel", "painel.css")
    ordem = [l.strip() for l in ler("backend", "painel", "ordem.txt").splitlines() if l.strip()]
    js = "\n".join(ler("backend", "painel", "js", n) for n in ordem)
    html = ler("backend", "painel", "index.html")
    assert "</script>" not in js, "o JS do painel não pode conter </script>"
    versao = re.search(r'var VERSAO = "([^"]+)"', ler("backend", "src", "Config.gs")).group(1)
    return html.replace("/*{{CSS}}*/", css).replace("/*{{JS}}*/", js).replace("{{VERSAO}}", versao)

def main():
    partes = []
    for nome in GS:
        txt = ler("backend", "src", nome + ".gs").rstrip() + "\n"
        if nome == "PainelEmbutido":
            txt = txt.replace('var PAINEL_HTML = "";', "var PAINEL_HTML = " + json.dumps(montar_painel(), ensure_ascii=True) + ";")
        partes.append("// ===== " + nome + ".gs =====\n" + txt)
    saida = os.path.join(RAIZ, "dist", "apps-script")
    os.makedirs(saida, exist_ok=True)
    with open(os.path.join(saida, "Code.gs"), "w", encoding="utf-8") as f:
        f.write("\n".join(partes))
    shutil.copy(os.path.join(RAIZ, "backend", "appsscript.json"), os.path.join(saida, "appsscript.json"))
    print("OK: dist/apps-script/Code.gs gerado")

if __name__ == "__main__":
    main()
