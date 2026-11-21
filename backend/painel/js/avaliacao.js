/* Detalhe de um relatório: avaliação por questão, liberação e novo envio. */
function tabelaHtml(t){
  return '<h4>'+esc(t.titulo)+'</h4><div class="tw"><table class="grid"><thead><tr>'+t.cab.map(function(c){return '<th>'+esc(c)+'</th>';}).join("")+'</tr></thead><tbody>'+
    t.linhas.map(function(l){return '<tr>'+l.map(function(v){return '<td>'+esc(v)+'</td>';}).join("")+'</tr>';}).join("")+'</tbody></table></div>';
}

function abrir(i){
  var r=VIS[i], d=r.dados, h='', tot=DADOS.nota_maxima||10;
  h+='<div class="nav"><button class="sec" id="voltar">Voltar à lista</button><span><button class="sec" id="ant"'+(i<=0?' disabled':'')+'>Anterior</button> <button class="sec" id="prox"'+(i>=VIS.length-1?' disabled':'')+'>Próximo</button></span></div>';
  h+='<div class="card"><h2>'+esc(r.integrantes)+'</h2><div class="muted">'+esc(r.experimento)+' · '+esc(r.turma)+' · enviado em '+esc(r.data)+(d&&d.data?' · experimento realizado em '+esc(d.data.split("-").reverse().join("/")):'')+' · código de acesso: <b class="cod">'+esc(r.codigo)+'</b></div>';
  if(d) (d.tabelas||[]).forEach(function(t){ if(t.id==="nomes") h+=tabelaHtml(t); });
  h+='</div>';
  if(!d) h+='<div class="card">Os dados deste envio não puderam ser lidos.</div>';
  (r.itens||[]).forEach(function(it,j){
    var a=r.aval[it.q]||{};
    h+='<div class="card"><div class="ih"><h3 style="margin:0">'+(it.q==="Fotos"?'':'Questão '+esc(it.q)+' · ')+esc(it.nome)+'</h3><span class="muted">vale '+fn(it.max)+' ponto(s)</span></div>';
    it.t.forEach(function(x){ h+=tabelaHtml(d.tabelas[x]); });
    it.k.forEach(function(k){ h+='<h4>'+esc(k)+'</h4><div class="resp">'+esc(d.textos[k])+'</div>'; });
    if(it.f) h+='<div class="fotos">'+(d.fotos||[]).map(function(f,n){return '<figure><figcaption class="muted">'+esc(f.nome)+'</figcaption><div class="ph" id="ft'+n+'">Carregando foto…</div></figure>';}).join("")+'</div>';
    h+='<div class="aval"><div class="l1"><label for="p'+j+'"><b>Pontos</b></label><input class="pt" id="p'+j+'" data-q="'+esc(it.q)+'" data-max="'+it.max+'" inputmode="decimal" value="'+(a.p===null||a.p===undefined?'':esc(fn(a.p)))+'"><span class="muted">de '+fn(it.max)+'</span>'+
       '<button class="sec mini" data-m="'+j+'">Nota máxima</button><button class="sec mini" data-z="'+j+'">Zero</button></div>'+
       '<textarea id="c'+j+'" data-q="'+esc(it.q)+'" placeholder="Comentário para o aluno sobre esta questão (opcional)">'+esc(a.c||'')+'</textarea></div></div>';
  });
  h+='<div class="card"><h3 style="margin-top:0">Comentário geral</h3><textarea id="cg" placeholder="Comentário geral para o grupo (opcional)">'+esc(r.comentario)+'</textarea></div>';
  h+='<div class="barra"><span class="tot">Nota: <b id="tot">0</b> / '+fn(tot)+' <span class="muted" id="qtd"></span></span>'+
     '<label><input type="checkbox" id="lib"'+(r.liberado?' checked':'')+'> Liberar para o aluno ver</label>'+
     (r.substituida?'':'<button class="sec" id="reenv">'+(r.reenvio?'Cancelar novo envio':'Autorizar novo envio')+'</button>')+'<button class="sec" id="salvar">Salvar</button><button id="salvarprox"'+(i>=VIS.length-1?' disabled':'')+'>Salvar e ir ao próximo</button><span class="muted" id="smsg"></span></div>';
  $("detalhe").innerHTML=h; $("lista").hidden=true; $("detalhe").hidden=false; window.scrollTo(0,0);

  function soma(){
    var t=0,n=0,tt=0; [].forEach.call($("detalhe").querySelectorAll("input.pt"),function(e){
      tt++; var v=pn(e.value),mx=+e.dataset.max; e.classList.toggle("bad",v!==null&&(v<0||v>mx+1e-9));
      if(v!==null){t+=Math.max(0,Math.min(mx,v));n++;}});
    $("tot").textContent=fn(t); $("qtd").textContent="("+n+" de "+tt+" questões avaliadas)";
  }
  soma();
  $("detalhe").oninput=soma;
  [].forEach.call($("detalhe").querySelectorAll("button[data-m],button[data-z]"),function(b){b.onclick=function(){
    var j=b.dataset.m!==undefined?b.dataset.m:b.dataset.z, e=$("p"+j); e.value=b.dataset.m!==undefined?fn(+e.dataset.max):"0"; soma();};});
  $("voltar").onclick=desenhar; $("ant").onclick=function(){abrir(i-1);}; $("prox").onclick=function(){abrir(i+1);};
  function salvar(depois){
    var av={}; [].forEach.call($("detalhe").querySelectorAll("input.pt"),function(e){av[e.dataset.q]={p:e.value.trim(),c:""};});
    [].forEach.call($("detalhe").querySelectorAll("textarea[data-q]"),function(e){(av[e.dataset.q]=av[e.dataset.q]||{p:""}).c=e.value.trim();});
    var com=$("cg").value.trim(), lib=$("lib").checked; $("salvar").disabled=true; $("salvarprox").disabled=true; $("smsg").textContent="Salvando…";
    run(function(res){
      r.aval=res.aval; r.nota=res.nota; r.comentario=com; r.liberado=lib; $("salvar").disabled=false; $("salvarprox").disabled=(i>=VIS.length-1);
      if(depois&&i<VIS.length-1){abrir(i+1);} else {$("smsg").textContent="Salvo. Nota "+(res.nota===""?"—":fn(pn(res.nota)))+".";}
    },function(e){$("salvar").disabled=false;$("salvarprox").disabled=false;$("smsg").textContent="Erro: "+msgErro(e);}).salvarAvaliacao(SENHA,r.linha,av,com,lib);
  }
  $("salvar").onclick=function(){salvar(false);}; $("salvarprox").onclick=function(){salvar(true);};
  if($("reenv")) $("reenv").onclick=function(){
    var novo=!r.reenvio;
    if(novo&&!confirm("Autorizar este perfil a enviar este relatório novamente? O envio atual passa para o histórico quando o novo chegar."))return;
    run(function(){r.reenvio=novo;$("reenv").textContent=novo?"Cancelar novo envio":"Autorizar novo envio";$("smsg").textContent=novo?"Novo envio autorizado.":"Autorização cancelada.";},function(e){$("smsg").textContent="Erro: "+msgErro(e);}).autorizarReenvio(SENHA,r.linha,novo);
  };
  if(d) (d.fotos||[]).forEach(function(f,n){
    run(function(url){var el=$("ft"+n);if(el)el.outerHTML='<img src="'+url+'" alt="'+esc(f.nome)+'">';},
        function(){var el=$("ft"+n);if(el)el.textContent="Não foi possível carregar a foto.";}).foto(SENHA,f.id);
  });
}
