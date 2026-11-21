/* Aba Acompanhamento: quem enviou e quem falta, por relatório e turma. */
// ---- Acompanhamento: quem enviou e quem falta, por relatório e turma ----
function envioDe(p,ex){return DADOS.linhas.filter(function(x){return x.codigo===p.codigo&&x.experimento===ex&&!x.substituida;})[0];}
function irPara(linha){
  var x=DADOS.linhas.filter(function(l){return l.linha===linha;})[0]; if(!x)return;
  $("fexp").value=x.experimento; $("fturma").value=""; $("fstatus").value=""; $("busca").value="";
  mostrar("r");
  for(var i=0;i<VIS.length;i++){ if(VIS[i].linha===linha){abrir(i);break;} }
}
function desenharAcomp(){
  var exs=experimentos(), ts=turmasTodas(), fe=$("aexp").value||exs[0]||"", ft=$("aturma").value, fs=$("asit").value;
  $("aexp").innerHTML=exs.map(function(t){return '<option>'+esc(t)+'</option>';}).join(""); $("aexp").value=fe;
  $("aturma").innerHTML='<option value="">Todas as turmas</option>'+ts.map(function(t){return '<option>'+esc(t)+'</option>';}).join(""); $("aturma").value=ft;
  ["aexp","aturma","asit"].forEach(function(i){$(i).onchange=desenharAcomp;});
  if(!exs.length){ $("acorpo").innerHTML=""; $("aresumo").textContent=""; $("apend").value=""; $("avazio").hidden=false; $("avazio").textContent="Nenhum relatório foi enviado ainda."; return; }
  var L=PERFIS.filter(function(p){return p.ativo&&(!ft||p.turma===ft);}).map(function(p){return {p:p,r:envioDe(p,fe)};});
  var env=L.filter(function(x){return x.r;}), av=env.filter(function(x){return aval(x.r);}), lib=env.filter(function(x){return x.r.liberado;});
  $("aresumo").textContent=esc0(fe)+": "+env.length+" de "+L.length+" perfil(is) enviaram · "+av.length+" avaliado(s) · "+lib.length+" liberado(s) · "+(L.length-env.length)+" pendente(s)";
  var V=L.filter(function(x){return !fs||(fs==="e")===!!x.r;});
  $("acorpo").innerHTML=V.map(function(x){
    var s=!x.r?'<span class="badge">Não enviou</span>':
      (aval(x.r)?'<span class="badge ok">Nota '+esc(fn(pn(x.r.nota)))+'</span>':'<span class="badge">Aguardando avaliação</span>')+
      (x.r.liberado?' <span class="badge ok">Liberado</span>':'')+(x.r.reenvio?' <span class="badge">Novo envio autorizado</span>':'');
    return '<tr><td>'+esc(x.p.turma)+'</td><td><b>'+esc(x.p.nome)+'</b><div class="muted">'+esc(x.p.tipo)+'</div></td><td>'+x.p.integrantes.map(function(i){return esc(i.nome);}).join('<br>')+'</td><td>'+s+'</td><td>'+
      (x.r?'<button class="sec mini" data-l="'+x.r.linha+'">Abrir</button>':'')+'</td></tr>';
  }).join("");
  $("avazio").hidden=V.length>0; $("avazio").textContent="Nenhum perfil nesta situação.";
  [].forEach.call($("acorpo").querySelectorAll("button[data-l]"),function(bt){bt.onclick=function(){irPara(+bt.dataset.l);};});
  $("apend").value=L.filter(function(x){return !x.r;}).map(function(x){return x.p.integrantes.map(function(i){return i.nome;}).join(", ")+" ("+x.p.turma+")";}).join("\n");
}
function esc0(s){return String(s);}
