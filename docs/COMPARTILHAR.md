# Como transformar isto em um projeto que outros professores possam adotar

## 1. O modelo: cada professor instala a sua própria cópia
Em vez de um sistema central, cada professor (do Norte, do Sul, de qualquer escola) tem o **seu** back-end na **sua** conta Google e hospeda o **seu** front-end. Isso traz:
- **Custo zero** e nenhum servidor para você manter.
- **Escala linear:** mil professores = mil instalações independentes, sem gargalo comum.
- **Dados do próprio professor** (planilha e Drive dele), o que simplifica a privacidade dos alunos.
- **Autonomia:** cada um muda turmas, senha, relatórios e tema sem pedir nada a ninguém.

O que um professor novo precisa: uma conta Google, uns 15 minutos e uma hospedagem gratuita. O roteiro está em `docs/INSTALACAO.md`, e a página `/diagnostico/` aponta o que está errado quando algo falha (endereço, acesso, versão antiga, relatório não publicado).

## 2. Como publicar o projeto
1. **Repositório no GitHub** (público) e marcado como *template repository*: o outro professor clica em "Use this template" e já tem a própria cópia.
2. **Versões:** use números do tipo `1.0.0`, `1.1.0`. Atualize `VERSAO` em `backend/src/Config.gs` e em `frontend/assets/js/config.js`, registre no `CHANGELOG.md` e crie uma *release* com o `.zip`. O painel e o diagnóstico mostram a versão instalada, o que facilita o suporte.
3. **Catálogo de relatórios:** cada relatório é uma pasta com `meta.json` (título, disciplina, autor, licença, fonte). Professores contribuem com novos relatórios sem tocar no motor (veja `CONTRIBUTING.md` e `docs/NOVO-RELATORIO.md`). Use a pasta `_modelo` como ponto de partida.
4. **Material de apoio:** um vídeo curto de instalação e um canal de dúvidas (Issues do GitHub ou um grupo de mensagens) reduzem muito o suporte individual.

## 3. Decisões suas antes de publicar
- **Direitos autorais dos roteiros.** Os relatórios de Prensa Hidráulica, Lei de Hooke e Queda Livre reproduzem questões de um material didático ("Física Experimental com Taxonomia de Bloom"). Antes de publicá-los num repositório aberto, confirme a autorização do autor ou da instituição. Se não houver, publique só o sistema e o `_modelo`, e deixe cada professor adicionar seus próprios roteiros. O `meta.json` de cada relatório já traz esse lembrete no campo `fonte`.
- **Licença.** Ainda não há arquivo `LICENSE`: a escolha é sua. Opções comuns: MIT (permissiva), AGPL-3.0 (derivados também precisam ser abertos) e, para o conteúdo dos relatórios, uma licença Creative Commons. Código e conteúdo podem ter licenças diferentes.
- **Privacidade (LGPD).** O sistema guarda nome, matrícula e fotos de alunos, que podem ser menores de idade. Recomenda-se: informar os alunos e responsáveis sobre o uso dos dados, manter o acesso só com o professor (fotos já ficam privadas no Drive), definir quando os dados são apagados ao fim do período e alinhar com a escola. Isto não é aconselhamento jurídico: consulte o encarregado de dados da instituição.
- **Senha inicial.** O sistema vem com `troque-esta-senha`. Deixe isso bem destacado na instalação.

## 4. Limites atuais e como crescer
- O Apps Script tem **cotas diárias** do Google (consulte a documentação atual): atende bem turmas de escola, mas não é o ideal para milhares de envios simultâneos.
- Os textos estão em português. Para outros idiomas, o caminho é extrair as frases para um arquivo de textos (`strings.js`) por idioma.
- **Próximos passos naturais:** exportar notas em CSV, aviso por e-mail ao enviar, cálculo automático opcional por relatório (já existe no motor), testes de interface automatizados e uma versão para escolas/redes com vários professores.
- **Se um dia precisar de um serviço central** (vários professores num só lugar, login por conta Google, painel da coordenação), a API entre front-end e back-end já está isolada em `core/api.js` e no protocolo descrito em `docs/ARQUITETURA.md`. Troca-se o back-end (por exemplo, um banco com autenticação) sem reescrever as telas.

## 5. Checklist de lançamento
- [ ] Autorização (ou remoção) dos roteiros de terceiros
- [ ] Licença escolhida e arquivo `LICENSE` criado
- [ ] Senha padrão destacada na instalação
- [ ] Autor e licença preenchidos em cada `meta.json`
- [ ] `node tests/run.js` passando
- [ ] `python3 scripts/build_backend.py` executado e `dist/` atualizado
- [ ] Instalação testada do zero por outra pessoa, seguindo só a documentação
- [ ] `CHANGELOG.md` e versão atualizados; release criada
