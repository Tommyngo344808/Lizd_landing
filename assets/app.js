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
  const MAX_REASONABLE = 50000000; // 50 triệu

  function toNumber(v){
    if (typeof v === 'number' && isFinite(v)) return v;
    if (typeof v === 'string'){
      const n = Number(v.replace(/[^\d]/g,'')); // chỉ lấy chữ số
      return isFinite(n) ? n : 0;
    }
    return 0;
  }

  function derivePrices(p){
    let sale = toNumber(p.price ?? p.price_min ?? p.base_price ?? 0);
    let orig = toNumber(p.original_price ?? p.list_price ?? p.msrp ?? p.compare_at ?? 0);

    const minN = toNumber(p.price_min);
    const maxN = toNumber(p.price_max);
    const hasRange = (minN && maxN && minN !== maxN);

    // loại giá bất thường (số điện thoại…)
    if (sale > MAX_REASONABLE) sale = 0;
    if (orig > MAX_REASONABLE) orig = 0;

    if (orig && sale && orig <= sale) orig = 0; // nếu giá gốc <= giá sale thì bỏ

    const pct = (orig>0 && sale>0 && orig>sale) ? Math.round((orig - sale)/orig*100) : 0;
    return {sale, orig, hasRange, pct, minN, maxN};
  }

  function priceHtml(p){
    const {sale, orig, hasRange, pct, minN, maxN} = derivePrices(p);
    if(hasRange){
      return `<div class="price-main">${money(minN)} – ${money(maxN)}</div>`;
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
        <a href="#" class="media open-detail" data-idx="${i}">
          <img loading="lazy" src="${img}" alt="${name.replace(/"/g,'&quot;')}"
               onerror="this.src='/assets/noimg.svg';this.closest('article').classList.add('noimg')">
        </a>
        <div class="p">
          <h3><a class="open-detail" data-idx="${i}" href="#">${name}</a></h3>
          ${priceHtml(p)}
          <div class="desc-sm"></div>
        </div>
      </article>`;
  }

  const BAD_NAME = /trang bạn yêu cầu không tồn tại/i;
  const BAD_IMG  = /(appstore\.png|placeholder|noimage)/i;

  let arr = [];
  try{
    const raw = document.getElementById('__PRODUCTS__').textContent.trim();
    const data = JSON.parse(raw);
    arr = Array.isArray(data) ? data
      : (Array.isArray(data.groups) ? data.groups.flatMap(g => g.items||[]) : (data.items||[]));
  }catch(e){ arr=[]; console.warn(e); }

  // Lọc item lỗi: tên xấu, thiếu ảnh, ảnh placeholder
  arr = arr.filter(p => {
    const name = (p.name||'').trim();
    if (!name || BAD_NAME.test(name)) return false;
    const img = ((p.image_url||p.image||'')+'').trim();
    if (!img || BAD_IMG.test(img)) return false;
    return true;
  });

  // Render
  grid.innerHTML = arr.map(card).join('');
  if(note) note.textContent = 'Đã nạp ' + arr.length + ' sản phẩm (nhúng trực tiếp).';

  /* ===== MODAL ===== */
  const modal = document.getElementById('modal');
  const mImg   = document.getElementById('mImg');
  const mName  = document.getElementById('mName');
  const mDesc  = document.getElementById('mDesc');
  const mPrice = document.getElementById('mPrice');
  const mOld   = document.getElementById('mOld');
  const mOff   = document.getElementById('mOff');
  const mBuy   = document.getElementById('mBuy');
  const mClose = document.getElementById('mClose');

  function cleanDesc(s){
    if (!s) return '';
    const low = s.toLowerCase();
    if (low.includes('trang bạn yêu cầu không tồn tại')) return '';
    return s;
  }

  function openModal(p){
    const {sale, orig, hasRange, pct, minN, maxN} = derivePrices(p);
    mImg.src = p.image_url || p.image || '/assets/noimg.svg';
    mName.textContent = p.name || '';
    mDesc.textContent = cleanDesc(p.desc || '');
    if(hasRange){
      mPrice.textContent = money(minN) + ' – ' + money(maxN);
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

  // Admin button ensure trailing slash
  const adminBtn = document.querySelector('a.admin-fab');
  if(adminBtn) adminBtn.href = '/admin/';
})();
