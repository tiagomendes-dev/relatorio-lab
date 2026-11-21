/* DEFINIÇÃO DO RELATÓRIO "Relatório: Lei de Hooke".
   Descreve os dados deste experimento. O funcionamento (desenhar, coletar, enviar) está em assets/js/relatorio/.
   Tipos de coluna em "c": t=texto, n=número digitado, d=calculado, f=rótulo fixo (lista "fix"), m=calculado único.
   "pre" lista colunas pré-preenchidas (editáveis) quando o cálculo automático está ligado. */
(function () {
  const { okn, fmt } = Lab.util;
  window.RELATORIO = {
    experimento: "Relatório Lei de Hooke",   // deve ser igual ao nome em LAB_CONFIG.RELATORIOS
    titulo: "Relatório: Lei de Hooke",
    autoCalculo: false,       // false: o aluno preenche tudo. true: usa calcular() abaixo
    fotos: ["Experimento da Lei de Hooke", "Gráfico P × ΔX (papel milimetrado)"],
    tabelas: {
      "x0": {
        "k": "1b) Comprimento natural da mola",
        "cab": [
          "x<sub>0</sub> (m)"
        ],
        "c": "n",
        "n": 1
      },
      "hooke": {
        "k": "1b) Medidas da Lei de Hooke",
        "cab": [
          "Peso (N)",
          "Δx<sub>1</sub> (m)",
          "Δx<sub>2</sub> (m)",
          "Δx<sub>3</sub> (m)",
          "Δx<sub>4</sub> (m)",
          "Δx<sub>médio</sub> (m)"
        ],
        "c": "nnnnnd",
        "n": 10
      },
      "ke": {
        "k": "3a) K = P/Δx",
        "cab": [
          "Peso (N)",
          "Δx<sub>médio</sub> (m)",
          "K<sub>e</sub> (N/m) = P/Δx<sub>médio</sub>"
        ],
        "c": "nnd",
        "n": 10,
        "pre": [
          0,
          1
        ]
      },
      "kest": {
        "k": "3b) K médio e desvio padrão",
        "cab": [
          "K̄<sub>e</sub> (N/m)",
          "ΔK<sub>e</sub> (N/m)",
          "K<sub>e</sub> = K̄<sub>e</sub> ± ΔK<sub>e</sub>"
        ],
        "c": "ddd",
        "n": 1
      },
      "coefa": {
        "k": "4a) Coeficiente angular (método gráfico)",
        "cab": [
          "Coeficiente angular a (N/m)"
        ],
        "c": "n",
        "n": 1
      },
      "coefb": {
        "k": "4b) Coeficiente linear (método gráfico)",
        "cab": [
          "Coeficiente linear b (N)"
        ],
        "c": "n",
        "n": 1
      },
      "dif": {
        "k": "6) Diferença percentual D",
        "cab": [
          "K̄<sub>e</sub> (N/m)",
          "K do método gráfico (N/m)",
          "D (%)"
        ],
        "c": "ddd",
        "n": 1
      }
    },
    calcular(R, g, put, stat, pre) {
    for(let r=0;r<10;r++){
      const xs=[1,2,3,4].map(c=>g("hooke_"+r+"_"+c)).filter(v=>v!==null);
      if(xs.length) put("hooke_"+r+"_5", xs.reduce((s,x)=>s+x,0)/xs.length);
    }
    for(let r=0;r<10;r++){ pre("ke_"+r+"_0", g("hooke_"+r+"_0")); pre("ke_"+r+"_1", R["hooke_"+r+"_5"]); }
    const ke=[];
    for(let r=0;r<10;r++){ const P=g("ke_"+r+"_0"), d=g("ke_"+r+"_1"); if(P!==null&&d){ ke.push(P/d); put("ke_"+r+"_2",P/d); } }
    stat(ke,"kest");
    const a=g("coefa_0_0"), km=R.kest_0_0;
    put("dif_0_0",km); put("dif_0_1",a);
    if(okn(km)&&okn(a)&&Math.max(km,a)>0){ const mx=Math.max(km,a); put("dif_0_2",(mx-Math.min(km,a))/mx*100); }
    }
  };
})();
