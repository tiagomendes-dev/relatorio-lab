/* Aba Cadastro de alunos: perfis individuais, grupos e lote. */
function turmasTodas(){var t=[];PERFIS.forEach(function(p){if(p.turma&&t.indexOf(p.turma)<0)t.push(p.turma);});DADOS.turmas.forEach(function(x){if(x&&t.indexOf(x)<0)t.push(x);});return t.sort();}
function addMembro(){
  if($("cmembros").children.length>=5)return;
  var d=document.createElement("div"); d.className="mem";
  d.innerHTML='<input class="mn" placeholder="Nome completo" aria-label="Nome do integrante"><input class="mm" placeholder="Matrícula" aria-label="Matrícula" style="max-width:180px">';
  $("cmembros").appendChild(d);
}
$("cadd").onclick=addMembro;
$("ccriar").onclick=function(){
  var ig=[].map.call($("cmembros").children,function(d){return {nome:d.querySelector(".mn").value.trim(),matricula:d.querySelector(".mm").value.trim()};}).filter(function(i){return i.nome;});
  var turma=$("cturma").value.trim(); $("cmsg").textContent="";
  if(!turma){$("cmsg").textContent="Informe a turma.";return;}
  if(!ig.length){$("cmsg").textContent="Informe pelo menos um nome.";return;}
  $("ccriar").disabled=true;
  run(function(p){PERFIS.push(p);$("ccriar").disabled=false;$("cmembros").innerHTML="";$("cnome").value="";addMembro();desenharCad();$("cmsg").textContent="Perfil criado. Código de acesso: "+p.codigo;},
      function(e){$("ccriar").disabled=false;$("cmsg").textContent="Erro: "+msgErro(e);}).criarPerfil(SENHA,turma,$("cnome").value.trim(),ig);
};
$("cloteBtn").onclick=function(){
  var turma=$("cturma").value.trim(), txt=$("clote").value; $("clmsg").textContent="";
  if(!turma){$("clmsg").textContent="Informe a turma no campo acima.";return;}
  if(!txt.trim()){$("clmsg").textContent="Cole a lista de alunos.";return;}
  $("cloteBtn").disabled=true;
  run(function(l){PERFIS=PERFIS.concat(l);$("cloteBtn").disabled=false;$("clote").value="";$("cfturma").value=turma;desenharCad();$("clmsg").textContent=l.length+" perfil(is) criado(s).";},
      function(e){$("cloteBtn").disabled=false;$("clmsg").textContent="Erro: "+msgErro(e);}).criarLote(SENHA,turma,txt);
};
$("cfturma").onchange=function(){desenharCad();}; $("cbusca").oninput=function(){desenharCad();};
function desenharCad(){
  var ts=turmasTodas(), ft=$("cfturma").value;
  $("dturmas").innerHTML=ts.map(function(t){return '<option value="'+esc(t)+'">';}).join("");
  $("cfturma").innerHTML='<option value="">Todas as turmas</option>'+ts.map(function(t){return '<option>'+esc(t)+'</option>';}).join(""); $("cfturma").value=ft;
  if(!$("cmembros").children.length) addMembro();
  var b=$("cbusca").value.trim().toLowerCase();
  var L=PERFIS.filter(function(p){return (!ft||p.turma===ft)&&(!b||(p.nome+" "+p.integrantes.map(function(i){return i.nome;}).join(" ")).toLowerCase().indexOf(b)>=0);});
  $("cperfis").innerHTML=L.map(function(p){
    var n=DADOS.linhas.filter(function(r){return r.codigo===p.codigo&&!r.substituida;}).length;
    return '<tr'+(p.ativo?'':' style="opacity:.55"')+'><td><span class="cod">'+esc(p.codigo)+'</span></td><td>'+esc(p.turma)+'</td><td><b>'+esc(p.nome)+'</b><div class="muted">'+esc(p.tipo)+(p.ativo?'':' · desativado')+'</div></td><td>'+
      p.integrantes.map(function(i){return esc(i.nome)+(i.matricula?' ('+esc(i.matricula)+')':'');}).join('<br>')+'</td><td>'+n+'</td><td><button class="sec mini" data-c="'+esc(p.codigo)+'">'+(p.ativo?'Desativar':'Ativar')+'</button></td></tr>';
  }).join("");
  $("cvazio").hidden=L.length>0;
  [].forEach.call($("cperfis").querySelectorAll("button[data-c]"),function(bt){bt.onclick=function(){
    var p=PERFIS.filter(function(x){return x.codigo===bt.dataset.c;})[0], novo=!p.ativo;
    run(function(){p.ativo=novo;desenharCad();}).alternarPerfil(SENHA,p.codigo,novo);};});
  $("ccopia").value=L.map(function(p){return p.integrantes.map(function(i){return i.nome;}).join(", ")+"\t"+p.codigo;}).join("\n");
}
