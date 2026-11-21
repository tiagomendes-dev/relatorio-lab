# Como contribuir

## Novo relatório de laboratório
1. Copie `frontend/relatorios/_modelo/` para uma pasta nova (ex.: `pendulo`).
2. Edite `definicao.js` e o texto em `index.html` (veja `docs/NOVO-RELATORIO.md`).
3. Preencha `meta.json` (título, disciplina, autor, licença, fonte, versão).
4. Registre o relatório em `frontend/assets/js/config.js`.
5. Rode `node tests/run.js`.

**Checklist:** títulos de tabela e perguntas começam com o número da questão (`3a) ...`) · você tem direito de compartilhar o roteiro (ou ele é seu) · autor e licença preenchidos · testes passando.

## Código
- Front-end em `frontend/assets/`, back-end em `backend/src/`, painel em `backend/painel/`.
- Depois de mexer em `backend/`, rode `python3 scripts/build_backend.py`.
- Funções pequenas, uma responsabilidade por arquivo, e um teste em `tests/run.js` para regras de cálculo e de nota.
- Mudanças de comportamento entram no `CHANGELOG.md`.
