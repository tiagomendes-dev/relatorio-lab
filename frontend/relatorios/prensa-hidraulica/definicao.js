/* DEFINIÇÃO DO RELATÓRIO "Relatório: prensa hidráulica".
   Descreve os dados deste experimento. O funcionamento (desenhar, coletar, enviar) está em assets/js/relatorio/.
   Tipos de coluna em "c": t=texto, n=número digitado, d=calculado, f=rótulo fixo (lista "fix"), m=calculado único.
   "pre" lista colunas pré-preenchidas (editáveis) quando o cálculo automático está ligado. */
(function () {
  const { okn, fmt } = Lab.util;
  const PRESS = [0.1, 0.2, 0.3];   // pressões fixas do manômetro (kgf/cm²)
  window.RELATORIO = {
    experimento: "Relatório Prensa Hidráulica",   // deve ser igual ao nome em LAB_CONFIG.RELATORIOS
    titulo: "Relatório: prensa hidráulica",
    autoCalculo: false,       // false: o aluno preenche tudo. true: usa calcular() abaixo
    fotos: ["Experimento da Lei de Hooke", "Experimento da prensa hidráulica"],
    tabelas: {
      "hooke": {
        "k": "1b) Lei de Hooke",
        "cab": [
          "Peso (N)",
          "X<sub>0</sub> (cm)",
          "X (cm)",
          "ΔX = (X − X<sub>0</sub>) (cm)"
        ],
        "c": "nnnd",
        "n": 4
      },
      "diam": {
        "k": "1c) Diâmetros das seringas",
        "cab": [
          "Diâmetro da seringa 01 (cm)",
          "Diâmetro da seringa 02 (cm)"
        ],
        "c": "nn",
        "n": 1
      },
      "mola": {
        "k": "1c) Deslocamento das molas na seringa 02",
        "cab": [
          "Pressão no manômetro (kgf/cm²)",
          "ΔX<sub>i</sub> (cm)",
          "ΔX<sub>f</sub> (cm)",
          "ΔX (cm)"
        ],
        "c": "fnnd",
        "n": 3,
        "fix": [
          "0,1",
          "0,2",
          "0,3"
        ]
      },
      "ke": {
        "k": "3a) Ke = P/ΔXm",
        "cab": [
          "Peso (N)",
          "ΔX<sub>m</sub> (m)",
          "K<sub>e</sub> (N/m) = P/ΔX<sub>m</sub>"
        ],
        "c": "nnd",
        "n": 4,
        "pre": [
          0,
          1
        ]
      },
      "kest": {
        "k": "3b) Ke médio e desvio padrão",
        "cab": [
          "K̄<sub>e</sub> (N/m)",
          "ΔK<sub>e</sub> (N/m)",
          "K<sub>e</sub> = K̄<sub>e</sub> ± ΔK<sub>e</sub>"
        ],
        "c": "ddd",
        "n": 1
      },
      "area": {
        "k": "3c) Áreas das bases",
        "cab": [
          "Diâmetro da seringa 01 (cm)",
          "Área da base da seringa 01 (cm²)",
          "Diâmetro da seringa 02 (cm)",
          "Área da base da seringa 02 (cm²)"
        ],
        "c": "dddd",
        "n": 1
      },
      "f1": {
        "k": "3d) Força 1",
        "cab": [
          "Pressão no manômetro (kgf/cm²)",
          "Área da base da seringa 01 (cm²)",
          "Força 1 (kgf)"
        ],
        "c": "fmd",
        "n": 3,
        "fix": [
          "0,1",
          "0,2",
          "0,3"
        ]
      },
      "f2": {
        "k": "3e) Força 2",
        "cab": [
          "Pressão no manômetro (kgf/cm²)",
          "Área da base da seringa 02 (cm²)",
          "Força 2 (kgf)"
        ],
        "c": "fmd",
        "n": 3,
        "fix": [
          "0,1",
          "0,2",
          "0,3"
        ]
      },
      "k2": {
        "k": "3f) K2 = Fk2/ΔXm",
        "cab": [
          "Pressão no manômetro (kgf/cm²)",
          "Força da mola na seringa 2, F<sub>k2</sub> (N)",
          "Deslocamento da mola na seringa 02 (m)",
          "K<sub>2</sub> (N/m) = F<sub>k2</sub>/ΔX<sub>m</sub>"
        ],
        "c": "fddd",
        "n": 3,
        "fix": [
          "0,1",
          "0,2",
          "0,3"
        ]
      },
      "k2st": {
        "k": "3g) K2 médio e desvio padrão",
        "cab": [
          "K̄<sub>2</sub> (N/m)",
          "ΔK<sub>2</sub> (N/m)",
          "K<sub>2</sub> = K̄<sub>2</sub> ± ΔK<sub>2</sub>"
        ],
        "c": "ddd",
        "n": 1
      },
      "dif": {
        "k": "4) Diferença percentual D",
        "cab": [
          "D (%) entre K̄<sub>e</sub> e K̄<sub>2</sub>"
        ],
        "c": "d",
        "n": 1
      }
    },
  calcular(R, g, put, stat, pre) {
    for (let r = 0; r < 4; r++) { const a = g("hooke_" + r + "_1"), b = g("hooke_" + r + "_2"); if (a !== null && b !== null) put("hooke_" + r + "_3", b - a); }
    for (let r = 0; r < 3; r++) { const a = g("mola_" + r + "_1"), b = g("mola_" + r + "_2"); if (a !== null && b !== null) put("mola_" + r + "_3", Math.abs(b - a)); }
    // 3a: peso e ΔXm (em metros) vêm da tabela 1b, mas o aluno pode editar para descartar um dado
    for (let r = 0; r < 4; r++) { const dx = R["hooke_" + r + "_3"]; pre("ke_" + r + "_0", g("hooke_" + r + "_0")); pre("ke_" + r + "_1", okn(dx) ? dx / 100 : null); }
    const ke = [];
    for (let r = 0; r < 4; r++) { const P = g("ke_" + r + "_0"), d = g("ke_" + r + "_1"); if (P !== null && d) { ke.push(P / d); put("ke_" + r + "_2", P / d); } }
    stat(ke, "kest");
    const d1 = g("diam_0_0"), d2 = g("diam_0_1");
    const A1 = d1 !== null ? Math.PI * Math.pow(d1 / 2, 2) : null, A2 = d2 !== null ? Math.PI * Math.pow(d2 / 2, 2) : null;
    put("area_0_0", d1); put("area_0_1", A1); put("area_0_2", d2); put("area_0_3", A2);
    put("f1_m_1", A1); put("f2_m_1", A2);
    const k2 = [];
    for (let r = 0; r < 3; r++) {
      let F1, F2;
      if (okn(A1)) { F1 = PRESS[r] * A1; put("f1_" + r + "_2", F1); }
      if (okn(A1) && A1 && okn(A2) && F1 !== undefined) { F2 = F1 * A2 / A1; put("f2_" + r + "_2", F2); }
      if (F2 !== undefined) {
        const Fk = F2 / 2 * 9.81, dx = R["mola_" + r + "_3"];   // 1 kgf = 9,81 N; força dividida pelas duas molas
        put("k2_" + r + "_1", Fk);
        if (dx) { put("k2_" + r + "_2", dx / 100); put("k2_" + r + "_3", Fk / (dx / 100)); k2.push(Fk / (dx / 100)); }
      }
    }
    stat(k2, "k2st");
    const a = R.kest_0_0, b = R.k2st_0_0;
    if (okn(a) && okn(b)) { const mx = Math.max(a, b); put("dif_0_0", (mx - Math.min(a, b)) / mx * 100); }
  }
  };
})();
