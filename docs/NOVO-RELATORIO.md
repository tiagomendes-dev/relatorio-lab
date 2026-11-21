# Como criar um novo relatório

Um relatório é uma pasta em `frontend/relatorios/`. Exemplo: `pendulo`.

## 1. Copie o modelo
Copie `frontend/relatorios/_modelo/` para `frontend/relatorios/pendulo/` (ou outro relatório existente, se for parecido). Preencha também o `meta.json` (título, disciplina, autor, licença, fonte, versão).

## 2. Edite `definicao.js` (os dados do experimento)
```js
window.RELATORIO = {
  experimento: "Relatório Pêndulo",   // nome único; aparece no painel e em "Meus relatórios"
  titulo: "Relatório: pêndulo simples",
  autoCalculo: false,                 // false: o aluno preenche tudo
  fotos: ["Experimento do pêndulo", "Gráfico T² × L"],
  tabelas: {
    medidas: {
      k: "1b) Medidas do pêndulo",    // título começa com o número da questão (ver abaixo)
      cab: ["L (m)", "10 oscilações (s)", "T (s)"],
      c: "nnn",                       // um tipo por coluna
      n: 5                            // número de linhas
    }
  }
};
```
**Tipos de coluna (`c`):** `t` texto · `n` número digitado · `d` calculado (só tem efeito com `autoCalculo:true`) · `f` rótulo fixo (lista `fix`, uma entrada por linha) · `m` célula única calculada que ocupa todas as linhas.
Opções de tabela: `fix` (rótulos), `pre` (colunas pré-preenchidas quando há cálculo automático).
Índices nos cabeçalhos: `X<sub>0</sub>`, `Δt<sup>2</sup>`.

Cálculo automático (opcional): implemente `calcular(R, g, put, stat, pre)`. `g(id)` lê um campo, `put(id, valor)` escreve o resultado, `stat(lista, prefixo)` calcula média e desvio, `pre` pré-preenche. Os ids de célula seguem `tabela_linha_coluna` (ex.: `medidas_0_2`); células `m` usam `tabela_m_coluna`.

## 3. Edite `index.html` (o texto das questões)
Dentro do `<template id="conteudo">`, escreva as seções:
```html
<section>
  <h2>Questão 1</h2>
  <p><b>b)</b> Registre na tabela abaixo...</p>
  <div data-t="medidas"></div>                 <!-- onde a tabela aparece -->
  <textarea data-k="1c) Observações"></textarea>  <!-- resposta de texto -->
</section>
```
Para equações use MathML (veja os relatórios existentes) e `<div class="note">` para dicas.

### Regra importante: numeração das questões
Os títulos de tabela (`k`) e os rótulos de texto (`data-k`) **devem começar com o número da questão e um parêntese**: `1b) ...`, `3a) ...`, `7) ...`. O painel agrupa por esse número para criar as questões avaliáveis (cada número vira uma linha de nota). Fotos formam uma questão "Fotos e anexos".

## 4. Registre em `assets/js/config.js`
```js
{ id: "pendulo", nome: "Relatório Pêndulo", aberto: true }
```
`nome` precisa ser **igual** a `experimento` da definição.

## 5. Teste e publique
```
node tests/run.js
```
Os testes conferem a estrutura das tabelas, a numeração das perguntas e o registro em `config.js`. Depois publique a pasta `frontend`. **Não é preciso mexer no back-end nem no painel.**
