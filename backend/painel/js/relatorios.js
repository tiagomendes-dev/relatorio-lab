/* Aba Relatórios: cartões por turma, filtros e lista. */
function experimentos(){var ex=[];DADOS.linhas.forEach(function(r){if(r.experimento&&ex.indexOf(r.experimento)<0)ex.push(r.experimento);});return ex.sort();}
function montarFiltros(){
  var ft=$("fturma").value, fe=$("fexp").value;
  $("fexp").innerHTML='<option value="">Todos os experimentos</option>'+experimentos().map(function(t){return '<option>'+esc(t)+'</option>';}).join("");
  $("fturma").innerHTML='<option value="">Todas as turmas</option>'+DADOS.turmas.map(function(t){return '<option>'+esc(t)+'</option>';}).join("");
  $("fexp").value=fe; $("fturma").value=ft;
  ["fexp","fturma","fstatus"].forEach(function(i){$(i).onchange=desenhar;}); $("busca").oninput=desenhar;
}
function aval(r){return r.nota!=="";}

function desenhar(){
  $("detalhe").hidden = true; $("cadastro").hidden = true; $("acomp").hidden = true; $("lista").hidden = false;
  var fe=$("fexp").value, ft=$("fturma").value, fs=$("fstatus").value, b=$("busca").value.trim().toLowerCase();
  // painel de grupos: um bloco por experimento, um cartão por turma
  $("grupos").innerHTML = experimentos().map(function(ex){
    return '<div class="grupo"><h3>'+esc(ex)+'</h3><div class="cards">'+DADOS.turmas.map(function(t){
      var a=DADOS.linhas.filter(function(r){return r.experimento===ex&&r.turma===t&&!r.substituida;}), v=a.filter(aval).length, l=a.filter(function(r){return r.liberado;}).length;
      return '<button class="cardt'+(a.length?'':' zero')+(fe===ex&&ft===t?' on':'')+'" data-e="'+esc(ex)+'" data-t="'+esc(t)+'"><b>'+esc(t)+'</b><div class="bar"><i style="width:'+(a.length?v/a.length*100:0)+'%"></i></div>'+
        '<span class="muted">'+a.length+' recebido(s) · '+v+' avaliado(s) · '+l+' liberado(s)</span></button>';
    }).join("")+'</div></div>';
  }).join("");
  [].forEach.call($("grupos").querySelectorAll(".cardt"),function(c){c.onclick=function(){
    var on=c.classList.contains("on"); $("fexp").value=on?"":c.dataset.e; $("fturma").value=on?"":c.dataset.t; desenhar();};});

  VIS = DADOS.linhas.filter(function(r){
    if(fs==="h"?!r.substituida:r.substituida) return false;
    if(fe&&r.experimento!==fe) return false; if(ft&&r.turma!==ft) return false;
    if(fs==="p"&&aval(r)) return false; if(fs==="a"&&!aval(r)) return false;
    if(fs==="o"&&!(aval(r)&&!r.liberado)) return false; if(fs==="l"&&!r.liberado) return false;
    return !b||String(r.integrantes).toLowerCase().indexOf(b)>=0;
  }).sort(function(a,b){return b.linha-a.linha;});
  $("corpo").innerHTML = VIS.map(function(r,i){
    return '<tr data-i="'+i+'"><td>'+esc(r.data)+'</td><td>'+esc(r.experimento)+'</td><td>'+esc(r.turma)+'</td><td>'+esc(r.integrantes)+'</td><td>'+
      (aval(r)?'<span class="badge ok">Nota '+esc(fn(pn(r.nota)))+'</span>':'<span class="badge">Sem avaliação</span>')+(r.reenvio?' <span class="badge">Novo envio autorizado</span>':'')+(r.substituida?' <span class="badge">Substituído</span>':'')+'</td><td>'+(r.liberado?'<span class="badge ok">Liberado</span>':'<span class="muted">Oculto</span>')+'</td></tr>';
  }).join("");
  $("vazio").hidden = VIS.length>0;
  var pend=VIS.filter(function(r){return aval(r)&&!r.liberado;});
  $("conta").textContent = VIS.length+' relatório(s) na lista · '+pend.length+' avaliado(s) ainda oculto(s)';
  $("liberarTodos").disabled = !pend.length;
  [].forEach.call($("corpo").children,function(tr){tr.onclick=function(){abrir(+tr.dataset.i);};});
}
$("liberarTodos").onclick=function(){
  var p=VIS.filter(function(r){return aval(r)&&!r.liberado;}); if(!p.length)return;
  if(!confirm("Liberar a avaliação de "+p.length+" relatório(s) desta lista para os alunos?"))return;
  run(function(){p.forEach(function(r){r.liberado=true;});desenhar();}).liberarLote(SENHA,p.map(function(r){return r.linha;}),true);
};
