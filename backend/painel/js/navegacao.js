/* Abas do painel. */
// ---- Cadastro de alunos ----
function mostrar(t){
  TAB=t; $("detalhe").hidden=true; $("lista").hidden=t!=="r"; $("cadastro").hidden=t!=="c"; $("acomp").hidden=t!=="a";
  $("tabR").className=t==="r"?"":"sec"; $("tabA").className=t==="a"?"":"sec"; $("tabC").className=t==="c"?"":"sec";
  if(t==="r") desenhar(); else if(t==="a") desenharAcomp(); else desenharCad();
}
$("tabR").onclick=function(){mostrar("r");}; $("tabA").onclick=function(){mostrar("a");}; $("tabC").onclick=function(){mostrar("c");};
