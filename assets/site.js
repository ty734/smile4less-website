// Smile 4 Less — sitewide behaviors (vanilla, no dependencies)
(function(){
  // scroll reveal ("float in") — staggered, reduced-motion aware
  if(!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
    var blocks=document.querySelectorAll('main .center, main .split .txt, main .split > img, .band h2, .band p, .trust .lbl');
    Array.prototype.forEach.call(blocks,function(el){el.classList.add('reveal');});
    var groups=document.querySelectorAll('.grid2, .grid3, .grid4, .steps, .revs, .locs, .logos, .docs, .team, .faq, .gal, .ba');
    Array.prototype.forEach.call(groups,function(g){
      Array.prototype.forEach.call(g.children,function(ch,i){ch.classList.add('reveal');ch.style.setProperty('--d',(Math.min(i,8)*70)+'ms');});
    });
    var items=document.querySelectorAll('.reveal');
    if(!('IntersectionObserver' in window)){Array.prototype.forEach.call(items,function(el){el.classList.add('in');});}
    else{
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px',threshold:.08});
      Array.prototype.forEach.call(items,function(el){io.observe(el);});
    }
    // anything already in view on load
  }

  // consultation / contact forms
  // TODO(Tyler): set data-endpoint on the <form> to the GHL / webhook URL. Until then the form
  // validates, captures UTMs, and redirects to /thank-you so the flow can be reviewed end to end.
  function q(n){try{return new URLSearchParams(location.search).get(n)||''}catch(e){return ''}}
  Array.prototype.forEach.call(document.querySelectorAll('form[data-lead]'),function(f){
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid'].forEach(function(k){
      var v=q(k);if(!v)return;var i=document.createElement('input');i.type='hidden';i.name=k;i.value=v;f.appendChild(i);
    });
    var p=document.createElement('input');p.type='hidden';p.name='page';p.value=location.pathname;f.appendChild(p);
    f.addEventListener('submit',function(ev){
      ev.preventDefault();
      if(f.querySelector('.hp input')&&f.querySelector('.hp input').value)return; // honeypot
      var btn=f.querySelector('button[type=submit]');if(btn){btn.disabled=true;btn.textContent='Sending…';}
      var data={};new FormData(f).forEach(function(v,k){data[k]=v;});
      var ep=f.getAttribute('data-endpoint');
      var done=function(){location.href='/thank-you';};
      if(!ep){setTimeout(done,400);return;}
      fetch(ep,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(done).catch(done);
    });
  });

  // phone format helper
  Array.prototype.forEach.call(document.querySelectorAll('input[type=tel]'),function(i){
    i.addEventListener('input',function(){var d=i.value.replace(/\D/g,'').slice(0,10);var o=d;if(d.length>6)o='('+d.slice(0,3)+') '+d.slice(3,6)+'-'+d.slice(6);else if(d.length>3)o='('+d.slice(0,3)+') '+d.slice(3);i.value=o;});
  });
})();
