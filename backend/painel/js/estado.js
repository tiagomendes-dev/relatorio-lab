/* Estado global, utilitários e chamada ao servidor (google.script.run). */
var SENHA = "", DADOS = {turmas:[],linhas:[],nota_maxima:10}, VIS = [], PERFIS = [], TAB = "r";
function $(id){return document.getElementById(id);}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function msgErro(e){return (e && e.message ? e.message : String(e)).replace(/^Error:\s*/,"");}
function fn(n){return (Math.round(n*100)/100).toString().replace(".",",");}
function pn(s){var n=parseFloat(String(s).replace(",","."));return isNaN(n)?null:n;}
function run(ok,fail){return google.script.run.withSuccessHandler(ok).withFailureHandler(fail||function(e){alert(msgErro(e));});}
