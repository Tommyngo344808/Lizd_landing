
(function(){
  /* ===== HERO ===== */
  fetch('/data/hero.json', {cache:'no-store'})
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(h => {
      const set = (id, v) => { const el=document.getElementById(id); if(el && v) el.textContent=v; };
      set('hero-kicker', h.kicker);
      set('hero-title',  h.title);
      set('hero-desc',   h.desc || h.subtitle);
      const a1=document.getElementById('hero-cta1'); if(a1 && h.cta1){ a1.textContent=h.cta1.text||a1.textContent; a1.href=h.cta1.href||a1.href; }
      const a2=document.getElementById('hero-cta2'); if(a2 && h.cta2){ a2.textContent=h.cta2.text||a2.textContent; a2.href=h.cta2.href||a2.href; }
      const hero=document.getElementById('hero'); const bg=h.bg||h.image||h.background;
      if(hero && bg){ hero.style.backgroundImage = "linear-gradient(100deg, rgba(255,154,22,.85), rgba(255,106,0,.85)), url('"+bg+"')"; hero.style.backgroundSize='cover'; hero.style.backgroundPosition='center'; }
    }).catch(()=>{});

  /* ===== PRODUCTS ===== */
  const note = document.getElementById('loadNote');
  const grid = document.getElementById('productGrid');

  const money = v => (v && v>0) ? new Intl.NumberFormat('vi-VN').format(v)+'đ' : '';
  function derivePrices(p){
    const sale = (p.price ?? p.price_min ?? p.base_price ?? 0) * 1;
    const orig = (p.original_price ?? p.list_price ?? p.msrp ?? p.compare_at ?? 0) * 1;
    const hasRange = (p.price_min && p.price_max && p.price_min !== p.price_max);
    const pct = (orig>0 && sale>0 && orig>sale) ? Math.round((orig - sale)/orig*100) : 0;
    return {sale, orig, hasRange, pct};
  }

  function priceHtml(p){
    const {sale, orig, hasRange, pct} = derivePrices(p);
    if(hasRange){
      return `<div class="price-main">${money(p.price_min)} – ${money(p.price_max)}</div>`;
    }
    if(!sale){ return `<div class="price-row"><span class="price-main">Liên hệ</span></div>`; }
    const old = (orig>sale) ? `<span class="price-old">${money(orig)}</span>` : '';
    const off = (pct>0) ? `<span class="badge-off">-${pct}%</span>` : '';
    return `<div class="price-row"><span class="price-main">${money(sale)}</span> ${old} ${off}</div>`;
  }

  function card(p, i){
    const img = p.image_url || p.image || '';
    const name = p.name || '';
    return `
      <article class="card" data-idx="${i}">
        <a href="#" class="media open-detail" data-idx="${i}"><img loading="lazy" src="${img}" alt="${name.replace(/"/g,'&quot;')}"></a>
        <div class="p">
          <h3><a class="open-detail" data-idx="${i}" href="#">${name}</a></h3>
          ${priceHtml(p)}
          <div class="desc-sm"></div>
        </div>
      </article>`;
  }

  let arr = [];
  try{
    const raw = document.getElementById('__PRODUCTS__').textContent.trim();
    const data = JSON.parse(raw);
    arr = Array.isArray(data) ? data
      : (Array.isArray(data.groups) ? data.groups.flatMap(g => g.items||[]) : (data.items||[]));
  }catch(e){ arr=[]; console.warn(e); }

  grid.innerHTML = arr.map(card).join('');
  if(note) note.textContent = 'Đã nạp ' + arr.length + ' sản phẩm (nhúng trực tiếp).';

  /* ===== MODAL ===== */
  const modal = document.getElementById('modal');
  const mImg = document.getElementById('mImg');
  const mName = document.getElementById('mName');
  const mDesc = document.getElementById('mDesc');
  const mPrice = document.getElementById('mPrice');
  const mOld = document.getElementById('mOld');
  const mOff = document.getElementById('mOff');
  const mBuy = document.getElementById('mBuy');
  const mClose = document.getElementById('mClose');

  function openModal(p){
    const {sale, orig, hasRange, pct} = derivePrices(p);
    mImg.src = p.image_url || p.image || '';
    mName.textContent = p.name || '';
    mDesc.textContent = p.desc || '';
    if(hasRange){
      mPrice.textContent = money(p.price_min) + ' – ' + money(p.price_max);
      mOld.textContent=''; mOff.style.display='none';
    } else {
      mPrice.textContent = sale ? money(sale) : 'Liên hệ';
      if(orig>sale && sale){ mOld.textContent = money(orig); mOff.style.display='inline-block'; mOff.textContent='-'+pct+'%'; }
      else { mOld.textContent=''; mOff.style.display='none'; }
    }
    mBuy.href = p.url || '#';
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
  }
  function closeModal(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }

  grid.addEventListener('click', function(e){
    const t = e.target.closest('.open-detail');
    if(!t) return;
    e.preventDefault();
    const idx = Number(t.dataset.idx);
    if(Number.isFinite(idx) && arr[idx]) openModal(arr[idx]);
  });
  modal.addEventListener('click', function(e){ if(e.target.id==='modal') closeModal(); });
  mClose.addEventListener('click', closeModal);
  window.addEventListener('keydown', e => { if(e.key==='Escape') closeModal(); });

  /* Admin button safety: ensure trailing slash to avoid SPA rewrites */
  const adminBtn = document.querySelector('a.admin-fab');
  if(adminBtn) adminBtn.href = '/admin/';
})();
