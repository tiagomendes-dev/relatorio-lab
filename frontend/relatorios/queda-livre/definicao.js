/* DEFINIÇÃO DO RELATÓRIO "Relatório: queda livre".
   Descreve os dados deste experimento. O funcionamento (desenhar, coletar, enviar) está em assets/js/relatorio/.
   Tipos de coluna em "c": t=texto, n=número digitado, d=calculado, f=rótulo fixo (lista "fix"), m=calculado único.
   "pre" lista colunas pré-preenchidas (editáveis) quando o cálculo automático está ligado. */
(function () {
  const { okn, fmt } = Lab.util;
  window.RELATORIO = {
    experimento: "Relatório Queda Livre",   // deve ser igual ao nome em LAB_CONFIG.RELATORIOS
    titulo: "Relatório: queda livre",
    autoCalculo: false,       // false: o aluno preenche tudo. true: usa calcular() abaixo
    fotos: ["Experimento de queda livre", "Gráfico Y × t² (papel milimetrado)"],
    tabelas: {
      "queda": {
        "k": "1b) Medidas de queda livre",
        "cab": [
          "Intervalo entre os sensores",
          "Distância ΔY (m)",
          "Δt<sub>1</sub> (s)",
          "Δt<sub>2</sub> (s)",
          "Δt<sub>3</sub> (s)",
          "Δt<sub>4</sub> (s)",
          "Δt<sub>MÉDIO</sub> (s)"
        ],
        "c": "fnnnnnd",
        "n": 4,
        "fix": [
          "ΔY = Y<sub>1</sub> − Y<sub>0</sub>",
          "ΔY = Y<sub>2</sub> − Y<sub>1</sub>",
          "ΔY = Y<sub>3</sub> − Y<sub>2</sub>",
          "ΔY = Y<sub>4</sub> − Y<sub>3</sub>"
        ]
      },
      "y3": {
        "k": "3a) Y e t² médio",
        "cab": [
          "Y (m)",
          "t<sup>2</sup> médio (s<sup>2</sup>)"
        ],
        "c": "nd",
        "n": 4,
        "pre": [
          0
        ]
      },
      "coefm": {
        "k": "3c) Coeficiente angular m (método gráfico)",
        "cab": [
          "Coeficiente angular m (m/s²)"
        ],
        "c": "n",
        "n": 1
      },
      "gg": {
        "k": "3d) g = 2m",
        "cab": [
          "g (m/s²) = 2m"
        ],
        "c": "d",
        "n": 1
      },
      "mmq": {
        "k": "4a) MMQ: dados",
        "cab": [
          "Δt<sup>2</sup>",
          "ΔY",
          "Δt<sup>2</sup> · ΔY",
          "(Δt<sup>2</sup>)<sup>2</sup>",
          "N (número de operações)"
        ],
        "c": "ddddm",
        "n": 4
      },
      "soma": {
        "k": "4a) MMQ: somatórios",
        "cab": [
          "∑Δt<sup>2</sup>",
          "∑ΔY",
          "∑Δt<sup>2</sup> · ΔY",
          "∑(Δt<sup>2</sup>)<sup>2</sup>"
        ],
        "c": "dddd",
        "n": 1
      },
      "mmqr": {
        "k": "4a) MMQ: resultado",
        "cab": [
          "Valor de m",
          "Valor de n",
          "Y = mΔt² + n"
        ],
        "c": "ddd",
        "n": 1
      },
      "gmmq": {
        "k": "4b) g pelo MMQ",
        "cab": [
          "g (m/s²) = 2m (MMQ)"
        ],
        "c": "d",
        "n": 1
      },
      "d5a": {
        "k": "5a) Diferença percentual (método gráfico)",
        "cab": [
          "g<sub>T</sub> (m/s²)",
          "g<sub>E</sub> (m/s²)",
          "D (%)"
        ],
        "c": "ddd",
        "n": 1
      },
      "d5b": {
        "k": "5b) Diferença percentual (MMQ)",
        "cab": [
          "g<sub>T</sub> (m/s²)",
          "g<sub>E</sub> (m/s²)",
          "D (%)"
        ],
        "c": "ddd",
        "n": 1
      }
    },
    calcular(R, g, put, stat, pre) {
    const pts=[];
    for(let r=0;r<4;r++){
      const ts=[2,3,4,5].map(c=>g("queda_"+r+"_"+c)).filter(v=>v!==null);
      if(ts.length) put("queda_"+r+"_6", ts.reduce((s,x)=>s+x,0)/ts.length);
      pre("y3_"+r+"_0", g("queda_"+r+"_1"));
      const tm=R["queda_"+r+"_6"]; if(okn(tm)) put("y3_"+r+"_1", tm*tm);
      const Y=g("y3_"+r+"_0"), t2=R["y3_"+r+"_1"];
      if(Y!==null && okn(t2)){ put("mmq_"+r+"_0",t2); put("mmq_"+r+"_1",Y); put("mmq_"+r+"_2",t2*Y); put("mmq_"+r+"_3",t2*t2); pts.push([t2,Y]); }
    }
    const N=pts.length, S1=pts.reduce((s,p)=>s+p[0],0), S2=pts.reduce((s,p)=>s+p[1],0), S3=pts.reduce((s,p)=>s+p[0]*p[1],0), S4=pts.reduce((s,p)=>s+p[0]*p[0],0);
    if(N){ put("mmq_m_4",N); put("soma_0_0",S1); put("soma_0_1",S2); put("soma_0_2",S3); put("soma_0_3",S4); }
    const den=N*S4-S1*S1; let gm=null;
    if(N>1 && den!==0){
      const m=(N*S3-S1*S2)/den, n=(S4*S2-S1*S3)/den; gm=2*m;
      put("mmqr_0_0",m); put("mmqr_0_1",n); put("mmqr_0_2","Y = "+fmt(m)+"Δt² "+(n<0?"− ":"+ ")+fmt(Math.abs(n))); put("gmmq_0_0",gm);
    }
    const mg=g("coefm_0_0"), gg=mg!==null ? 2*mg : null; put("gg_0_0",gg);
    const gT=9.79;
    [["d5a",gg],["d5b",gm]].forEach(([p,ge])=>{ put(p+"_0_0",gT); put(p+"_0_1",ge); if(okn(ge)) put(p+"_0_2",(gT-ge)/gT*100); });
    }
  };
})();
