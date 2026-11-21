# Arquitetura

## Visão geral
```
 Aluno (navegador)                     Professor (navegador)
 frontend/ (páginas estáticas)         painel servido pelo Apps Script (/exec)
        │  POST texto/JSON                    │  google.script.run
        └────────────────┐     ┌──────────────┘
                         ▼     ▼
                 Google Apps Script (backend/src)
                         │
        Planilha Google ("Respostas", "Perfis") + Drive (fotos privadas)
```

## Camadas do front-end
| Camada | Arquivos | Responsabilidade |
|---|---|---|
| Tema | `css/tema.css` | cores e fontes (variáveis) |
| Estilo | `css/base.css`, `componentes.css`, `aluno.css` | aparência sem regra de negócio |
| Núcleo | `js/core/util.js`, `api.js` | funções puras e comunicação com o servidor |
| Motor do relatório | `js/relatorio/` | `shell` (casca da tela), `engine` (tabelas, coleta, envio), `acesso` (código do perfil) |
| Portal | `js/portal/portal.js` | "Meus relatórios" |
| Dados do experimento | `relatorios/<id>/definicao.js` + `index.html` | tabelas, fotos, cálculos e texto das questões |

Os módulos ficam no objeto global `Lab` (`Lab.util`, `Lab.api`, `Lab.shell`, `Lab.relatorio`, `Lab.acesso`). A ordem de carga dos scripts está nas páginas.

## Camadas do back-end (`backend/src`)
| Arquivo | Responsabilidade |
|---|---|
| `Config.gs` | senha, nota máxima, pesos, estrutura das planilhas |
| `Main.gs` | `doGet` (painel) e `doPost` (roteador das ações dos alunos) |
| `Perfis.gs` | cadastro de perfis e códigos de acesso |
| `Envios.gs` | receber relatórios, regra de envio único e reenvio, consultas |
| `Avaliacao.gs` | questões avaliáveis, notas por questão, liberação |
| `Planilha.gs` | abas, cabeçalhos, pasta de fotos |
| `Util.gs`, `Setup.gs` | utilidades e autorização inicial |
| `PainelEmbutido.gs` | recebe o painel montado pelo build |

O **painel** (`backend/painel/`) é montado em `index.html` + `painel.css` + módulos `js/` e embutido no `Code.gs` pelo build, junto com `tema.css`, `base.css` e `componentes.css`.

## Modelo de dados (planilha)
- **Perfis:** código de acesso, turma, nome, tipo (Individual/Grupo), integrantes (JSON), criado em, ativo.
- **Respostas:** uma linha por envio. Contém os dados completos (JSON), a avaliação por questão (JSON), nota, liberado ao aluno, reenvio autorizado e substituída. Envios substituídos ficam como histórico.

## Protocolo (alunos → `/exec`, POST `text/plain` com JSON)
| `acao` | Corpo | Resposta |
|---|---|---|
| `perfil` | `codigo`, `experimento` | JSON: `estado` (`ok`, `enviado`, `reenvio`, `nao`), turma, nome, integrantes |
| *(envio)* | `codigo`, `experimento`, `tabelas`, `textos`, `fotos`, `data` | texto: `ok`, `ja enviado`, `codigo invalido` ou `erro: ...` |
| `minhas` | `codigo` | JSON com perfil e envios; a avaliação só aparece se liberada |

As ações do painel (listar, avaliar, cadastrar, autorizar reenvio...) são funções públicas chamadas por `google.script.run` e exigem a senha em cada chamada.

## Regras de negócio no servidor
1. Só perfis ativos enviam; a identificação dos integrantes vem do cadastro.
2. Um envio por perfil e relatório; novo envio só com autorização do professor, que move o anterior para o histórico.
3. A nota de cada questão é limitada ao máximo da questão; a nota total é a soma.
4. O aluno só vê a avaliação depois de liberada.

## Segurança e limites
- A senha do professor fica no `Config.gs`; é verificada no servidor em toda chamada do painel.
- Todo texto vindo de alunos é escapado antes de ser exibido (proteção contra HTML malicioso).
- O código de acesso é o segredo do perfil: orientar os alunos a não compartilhar.
- Limites do Apps Script: cota diária de execuções e 50.000 caracteres por célula; fotos são reduzidas no navegador antes do envio.
- Evolução natural: autenticação por conta Google, e-mail de aviso ao enviar, exportação de notas, outro banco de dados atrás da mesma API.
