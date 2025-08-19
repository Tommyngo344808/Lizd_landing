/* =========================
   CẤU HÌNH ENDPOINT
========================= */
const API_PRODUCTS = '/api/products';
const API_UPLOAD   = '/api/upload-image'; // POST base64 -> { url }
const API_ADD      = '/api/add-product';  // POST product -> { ok: true }

/* =========================
   TIỆN ÍCH
========================= */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const fmt = (n) => (+n || 0).toLocaleString('vi-VN') + ' đ';
const slug = (s) => (s||'').toString().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

function fileToDataUrl(file){
  return new Promise((res,rej)=>{
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// hiển thị toast đơn giản
function toast(msg){ alert(msg); }

/* =========================
   HERO (local & upload)
========================= */
const hero = {
  title: $('#heroTitle'),
  sub:   $('#heroSub'),
  image: $('#heroImage'),

  inputTitle: $('#heroTitleInput'),
  inputSub:   $('#heroSubInput'),
  inputUrl:   $('#heroUrlInput'),
  inputFile:  $('#heroFile'),
  btnUpload:  $('#btnHeroUpload'),
  btnApply:   $('#btnHeroApply'),
  btnSaveLocal: $('#btnHeroSaveLocal'),

  set(title, sub, url){
    if(title) this.title.textContent = title;
    if(sub)   this.sub.textContent   = sub;
    if(url)   this.image.style.backgroundImage = `url("${url}")`;
    else     this.image.style.backgroundImage = '';
  },

  getLocal(){
    try { return JSON.parse(localStorage.getItem('hero-config')||'{}'); }
    catch { return {}; }
  },
  saveLocal(obj){
    localStorage.setItem('hero-config', JSON.stringify(obj||{}));
    toast('Đã lưu hero vào trình duyệt.');
  },
  applyFromLocal(){
    const cfg = this.getLocal();
    this.set(cfg.title, cfg.sub, cfg.url);
    if(cfg.title) this.inputTitle.value = cfg.title;
    if(cfg.sub)   this.inputSub.value   = cfg.sub;
    if(cfg.url)   this.inputUrl.value   = cfg.url;
  }
};

// Áp dụng hero từ local khi mở trang
hero.applyFromLocal();

// Upload ảnh hero -> storage
hero.btnUpload.addEventListener('click', async ()=>{
  try {
    const adm = $('#adminToken').value.trim();
    const f = hero.inputFile.files?.[0];
    const folder = 'hero';

    if(!f) return toast('Chọn ảnh trước!');
    const dataUrl = await fileToDataUrl(f);

    const r = await fetch(API_UPLOAD, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'x-admin-token': adm },
      body: JSON.stringify({ dataUrl, filename: f.name, folder })
    });
    const j = await r.json();
    if(!r.ok) throw new Error(j.error||'Upload lỗi');
    hero.inputUrl.value = j.url;
    toast('Upload ảnh bìa thành công!');
  } catch(e){ toast(`Upload lỗi: ${e.message}`); }
});

// Áp dụng hero ra trang
hero.btnApply.addEventListener('click', ()=>{
  hero.set(hero.inputTitle.value, hero.inputSub.value, hero.inputUrl.value);
});

// Lưu hero vào localStorage
hero.btnSaveLocal.addEventListener('click', ()=>{
  hero.saveLocal({
    title: hero.inputTitle.value,
    sub:   hero.inputSub.value,
    url:   hero.inputUrl.value
  });
});

/* =========================
   NẠP SẢN PHẨM VÀ HIỂN THỊ
========================= */
async function loadProducts(){
  try {
    const r = await fetch(API_PRODUCTS);
    const j = await r.json();

    $('#loadNote').textContent = '';
    renderProducts(j?.data||[]);
  } catch (e){
    $('#loadNote').textContent = 'Không tải được dữ liệu từ server, đang hiển thị dữ liệu gần nhất.';
  }
}

function renderProducts(items){
  const wrap = $('#productGrid');
  wrap.innerHTML = '';
  if(!items.length){
    wrap.innerHTML = '<p class="muted">Chưa có sản phẩm.</p>';
    return;
  }

  for(const it of items){
    const pics = it.image_urls?.length ? it.image_urls : (it.image_url ? [it.image_url] : []);
    const cover = pics[0] || '';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="cover" style="background-image:url('${cover}')"></div>
      <div class="body">
        <strong>${it.name||''}</strong>
        <div class="muted">${it.desc||''}</div>
        <div style="display:flex; align-items:center; gap:.5rem; margin-top:.25rem">
          ${it.list_price ? `<span class="list-price">${fmt(it.list_price)}</span>` : ''}
          <span class="price">${fmt(it.price || it.list_price)}</span>
        </div>
        <div style="display:flex; gap:8px; margin-top:.5rem">
          <button class="btn secondary">Xem chi tiết</button>
          <button class="btn">Đặt nhanh</button>
        </div>
      </div>
    `;
    wrap.appendChild(card);
  }
}

/* =========================
   THÊM SẢN PHẨM (UPLOAD + CREATE)
========================= */
const uploaded = []; // các URL đã upload cho sản phẩm

$('#btnUploadProdImgs').addEventListener('click', async ()=>{
  try{
    const adm = $('#adminToken').value.trim();
    const files = $('#pImages').files;
    if(!files?.length) return toast('Chọn ảnh trước!');

    const folder = `products/${slug($('#pName').value||'san-pham')}`;
    for(const f of files){
      const dataUrl = await fileToDataUrl(f);
      const r = await fetch(API_UPLOAD, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-admin-token': adm },
        body: JSON.stringify({ dataUrl, filename: f.name, folder })
      });
      const j = await r.json();
      if(!r.ok) throw new Error(j.error||'Upload ảnh lỗi');

      uploaded.push(j.url);
      addChip(j.url);
    }

    toast('Đã upload ảnh sản phẩm xong.');
  }catch(e){ toast(`Upload ảnh lỗi: ${e.message}`); }
});

$('#btnClearUploaded').addEventListener('click', ()=>{
  uploaded.length = 0;
  $('#uploadedChips').innerHTML = '';
});

function addChip(url){
  const c = document.createElement('span');
  c.className = 'chip';
  c.textContent = url.split('/').pop();
  $('#uploadedChips').appendChild(c);
}

$('#btnCreateProduct').addEventListener('click', async ()=>{
  try{
    const adm = $('#adminToken').value.trim();
    const name = $('#pName').value.trim();
    const list_price = +$('#pListPrice').value || 0;
    const price = +$('#pPrice').value || 0;
    const desc = $('#pDesc').value.trim();

    if(!name) return toast('Nhập tên sản phẩm!');
    if(!uploaded.length) return toast('Bạn chưa upload ảnh sản phẩm!');

    const body = { name, list_price, price, desc, image_urls: uploaded, active: true };

    const r = await fetch(API_ADD, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'x-admin-token': adm },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    if(!r.ok) throw new Error(j.error||'Tạo sản phẩm lỗi');

    toast('Đã tạo sản phẩm thành công!');
    // reset form nhẹ
    $('#pName').value = '';
    $('#pListPrice').value = '';
    $('#pPrice').value = '';
    $('#pDesc').value = '';
    $('#pImages').value = '';
    $('#uploadedChips').innerHTML = '';
    uploaded.length = 0;

    // nạp lại danh sách
    loadProducts();
  }catch(e){ toast(`Lỗi: ${e.message}`); }
});

/* =========================
   KHỞI TẠO
========================= */
loadProducts();
