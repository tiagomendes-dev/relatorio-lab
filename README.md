# Sistema de relatórios de laboratório

Plataforma para turmas de física experimental: o professor cadastra alunos e grupos, cada perfil envia os relatórios por um código de acesso (um envio por relatório), o professor avalia **questão por questão** e libera as notas, e o aluno acompanha tudo em "Meus relatórios".

- **Front-end** (páginas estáticas, hospedagem gratuita): relatórios dos alunos e "Meus relatórios".
- **Back-end** (Google Apps Script + Planilha Google): recebe os envios, guarda os dados e serve o painel do professor.
- Sem servidor para manter e sem custo.

## Estrutura do projeto

```
sistema-laboratorio/
├─ frontend/                      -> o que vai para a hospedagem (Netlify, GitHub Pages...)
│  ├─ index.html                  -> entrada (leva a "Meus relatórios")
│  ├─ acompanhar/index.html       -> "Meus relatórios" (portal do aluno)
│  ├─ diagnostico/index.html      -> testa a instalação (endereço, versão, relatórios publicados)
│  ├─ relatorios/
│  │  ├─ prensa-hidraulica/       -> um relatório = uma pasta
│  │  │  ├─ index.html            -> texto das questões
│  │  │  └─ definicao.js          -> tabelas, fotos e cálculos do experimento
│  │  ├─ _modelo/                 -> relatório em branco para copiar
│  │  ├─ lei-de-hooke/
│  │  └─ queda-livre/
│  └─ assets/
│     ├─ css/                     -> tema.css (cores), base.css, componentes.css, aluno.css
│     └─ js/
│        ├─ config.js             -> ENDPOINT e lista de relatórios (único arquivo a editar)
│        ├─ core/                 -> util.js (funções puras), api.js (conversa com o servidor)
│        ├─ relatorio/            -> shell.js, engine.js, acesso.js, main.js
│        └─ portal/               -> portal.js
├─ backend/                       -> código-fonte do Apps Script
│  ├─ src/                        -> Config, Util, Planilha, Perfis, Envios, Avaliacao, Main, Setup (.gs)
│  ├─ painel/                     -> painel do professor: index.html, painel.css e js/ em módulos
│  └─ appsscript.json
├─ scripts/build_backend.py       -> junta tudo em dist/apps-script/Code.gs
├─ dist/apps-script/Code.gs       -> ARQUIVO GERADO: é o único que se cola no Apps Script
├─ tests/run.js                   -> testes automáticos (node tests/run.js)
└─ docs/                          -> ARQUITETURA.md, INSTALACAO.md, NOVO-RELATORIO.md
```

## Compartilhar com outros professores
Cada professor instala a sua própria cópia (custo zero, dados próprios). Veja [docs/COMPARTILHAR.md](docs/COMPARTILHAR.md): modelo de adoção, como publicar o projeto, pontos a decidir antes (direitos dos roteiros, licença, LGPD) e checklist de lançamento.

## Começando
1. Siga [docs/INSTALACAO.md](docs/INSTALACAO.md) (cerca de 15 minutos).
2. Para criar o relatório da próxima semana, veja [docs/NOVO-RELATORIO.md](docs/NOVO-RELATORIO.md).
3. Para entender as camadas e o protocolo, veja [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

## Comandos
```
python3 scripts/build_backend.py   # regenera dist/apps-script/Code.gs depois de editar backend/
node tests/run.js                  # roda os testes (definições, cálculos, notas, build)
```
(ou `npm run build` / `npm test`, se tiver o npm instalado)

## Princípios do projeto
- **Um relatório novo não exige programar o sistema:** copia-se uma pasta e edita-se `definicao.js` e o texto das questões.
- **Visual separado do funcionamento:** trocar o tema é editar `tema.css`.
- **Segurança no servidor:** senha do professor, códigos de acesso e regras de envio único são verificados no Apps Script, nunca só no navegador.
- **Código em módulos pequenos**, cada um com uma responsabilidade, e testes para as regras de cálculo e de nota.
