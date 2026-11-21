/* Entrada com a senha e botão Atualizar. */
function entrar(){
  if (typeof google === "undefined" || !google.script || !google.script.run) {
    $("lerro").textContent = "O painel não está conectado ao Apps Script. Abra-o pelo endereço /exec da implantação (não como arquivo nem em outro site). Se já está nele, atualize a página (Ctrl+F5).";
    return;
  }
  SENHA = $("senha").value; $("lerro").textContent = ""; $("entrar").disabled = true;
  run(function(d){
    DADOS = d;
    run(function(pf){
      PERFIS = pf; $("entrar").disabled = false; $("login").hidden = true; $("cab").hidden = false; montarFiltros(); mostrar("r");
    }, function(e){ $("entrar").disabled = false; $("lerro").textContent = msgErro(e); }).listarPerfis(SENHA);
  }, function(e){ $("entrar").disabled = false; $("lerro").textContent = msgErro(e); }).listar(SENHA);
}
$("entrar").onclick = entrar;
$("senha").onkeydown = function(e){ if(e.key==="Enter") entrar(); };
$("atualizar").onclick = function(){
  $("atualizar").disabled = true;
  var falha=function(e){$("atualizar").disabled=false;alert(msgErro(e));};
  run(function(d){DADOS=d;run(function(pf){PERFIS=pf;$("atualizar").disabled=false;montarFiltros();mostrar(TAB);},falha).listarPerfis(SENHA);},falha).listar(SENHA);
};
