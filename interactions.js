(()=>{
 const button=document.querySelector('.menu-button'),nav=document.querySelector('.navlinks');
 const close=()=>{nav?.classList.remove('open');button?.setAttribute('aria-expanded','false');if(button)button.textContent='Menu +'};
 button?.addEventListener('click',()=>{const active=nav.classList.toggle('open');button.setAttribute('aria-expanded',String(active));button.textContent=active?'Close −':'Menu +'});
 nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&button?.getAttribute('aria-expanded')==='true'){close();button.focus()}});
 document.addEventListener('click',e=>{if(!e.target.closest('.topbar'))close()});
 window.addEventListener('resize',()=>{if(innerWidth>700)close()});
 document.querySelectorAll('[data-filter]').forEach(filter=>filter.addEventListener('click',()=>{
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===filter)));
  let count=0;document.querySelectorAll('[data-category]').forEach(item=>{item.hidden=filter.dataset.filter!=='all'&&item.dataset.category!==filter.dataset.filter;if(!item.hidden)count++});
  document.getElementById('filter-status').textContent=`${count} projects shown`;
 }));
 document.querySelectorAll('[data-video]').forEach(button=>button.addEventListener('click',()=>{
  const frame=document.createElement('iframe');frame.src=`https://www.youtube-nocookie.com/embed/${button.dataset.video}?autoplay=1`;frame.title=button.dataset.title;frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.referrerPolicy='strict-origin-when-cross-origin';frame.allowFullscreen=true;button.replaceWith(frame);
 }));
 if(document.querySelector('[data-image]')){
  const dialog=document.createElement('dialog');dialog.className='lightbox';dialog.innerHTML='<button type="button" autofocus>Close ×</button><img alt="Project rendering, full frame">';document.body.append(dialog);
  dialog.querySelector('button').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{dialog.querySelector('img').src=button.dataset.image;dialog.showModal()}));
 }
 if(document.querySelector('.detail-hero')){const bar=document.createElement('div');bar.className='reading-progress';bar.setAttribute('aria-hidden','true');document.body.append(bar);const update=()=>{const distance=document.documentElement.scrollHeight-innerHeight;bar.style.width=(distance>0?scrollY/distance*100:0)+'%'};addEventListener('scroll',update,{passive:true});update()}
})();
