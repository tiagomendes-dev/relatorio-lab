# Instalação

## 1. Back-end (Google)
1. Crie uma **planilha Google** só sua (as respostas e perfis ficam nela).
2. **Extensões → Apps Script**. Apague o código existente.
3. Abra `backend/src/Config.gs`, defina `SENHA_PROFESSOR` (e, se quiser, `NOTA_MAXIMA` e `PESOS`).
4. Rode `python3 scripts/build_backend.py`. Isso gera `dist/apps-script/Code.gs` com tudo, inclusive o painel.
   (O projeto já traz um `Code.gs` gerado com a senha padrão `troque-esta-senha`; se usá-lo, troque a senha na primeira linha do arquivo.)
5. Cole o conteúdo de `dist/apps-script/Code.gs` no editor e salve.
6. Escolha a função **autorizar** e clique em **Executar**; aceite as permissões (planilha e Drive).
7. **Implantar → Nova implantação → App da Web**: Executar como **Eu**, acesso **Qualquer pessoa**. Copie o endereço terminado em `/exec`.

Ao mudar o back-end depois: gere o `Code.gs` de novo, cole, e use **Implantar → Gerenciar implantações → lápis → Nova versão**. O endereço não muda.

## 2. Front-end
1. Abra `frontend/assets/js/config.js` e cole o endereço `/exec` em `ENDPOINT` (um único lugar para todas as páginas).
2. Hospede a pasta **`frontend`** inteira (Netlify: arraste a pasta em app.netlify.com/drop; GitHub Pages também serve).
3. Links para os alunos: `.../` ou `.../acompanhar/` (portal) e `.../relatorios/<nome>/`.

### Hospedar na Vercel
Publique **somente a pasta `frontend`** (não o zip, nem `backend`, `dist`, `tests`, `docs` ou `scripts`). O arquivo `frontend/vercel.json` já vem pronto: ele garante que os endereços terminem em `/`, o que as páginas precisam para achar seus arquivos.

Antes: preencha o `ENDPOINT` em `frontend/assets/js/config.js`.

**Opção A: pelo computador (CLI)**
```
cd frontend
npx vercel          # responda: diretório "./", framework "Other", sem comando de build
npx vercel --prod   # publica em produção
```
**Opção B: pelo GitHub**
1. Suba o projeto para um repositório. Se ele for público, **não** deixe a senha real do professor escrita no código: troque a senha só dentro do editor do Apps Script, ou use repositório privado.
2. Na Vercel: Add New > Project > importe o repositório.
3. Configure **Root Directory = `frontend`**, Framework Preset **Other**, e deixe Build Command e Output Directory vazios. Clique em Deploy.

Depois de publicar, abra `https://SEU-PROJETO.vercel.app/diagnostico/` e clique em **Testar agora**. Se os alunos virem uma tela de login da Vercel, desative a proteção em Settings > Deployment Protection. Para atualizar o site depois, publique de novo.

## 3. Teste a instalação
Abra `.../diagnostico/` na sua hospedagem e clique em **Testar agora**. Ele confere o endereço, a versão do back-end e se os relatórios foram publicados, e diz o que corrigir.

## 4. Primeiro uso
1. Abra o endereço `/exec` no navegador: é o **painel do professor**. Entre com a senha.
2. Aba **Cadastro de alunos**: crie perfis (individual ou grupo) ou cole uma lista `Nome;Matrícula`. Distribua os códigos.
3. Os alunos entram com o código, preenchem e enviam. Acompanhe na aba **Acompanhamento** e avalie na aba **Relatórios**.

## Problemas comuns
- **"Sistema não configurado":** `ENDPOINT` vazio em `config.js`.
- **O painel não abre:** use o endereço `/exec` (não `/dev`) e nunca abra arquivos do painel direto no computador. Janela anônima ajuda se o Google reclamar de contas.
- **"O Google recusou o envio":** implantação com acesso diferente de "Qualquer pessoa", ou versão desatualizada (publique uma Nova versão).
- **Mudou a estrutura das planilhas:** o script renomeia a aba antiga ("Respostas antiga ...") e cria uma nova; nada é apagado.
