/* =====================================================================
   OWNER MODE — редактор сайта прямо в браузере.
   Открывается кнопкой «Owner access» внизу сайта (или по адресу сайта с #owner).
   Изменения сохраняются коммитом в GitHub-репозиторий через GitHub API,
   поэтому нужен личный токен GitHub с правом записи в этот репозиторий.
   Токен хранится только в этом браузере и отправляется только на api.github.com.
   ===================================================================== */
(function () {
  const REPO = { owner: 'vvvvvv111111', name: 'vvvvvv111111.github.io', branch: 'main' };
  const API = 'https://api.github.com';
  const TOKEN_KEY = 'owner-github-token';
  const APP = window.APP;

  /* ---------- tiny helpers ---------- */
  const el = (tag, attrs, ...kids) => {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(c => c != null && n.append(c));
    return n;
  };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const store = {
    get() { try { return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || ''; } catch (_) { return ''; } },
    set(t, remember) { try { (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, t); } catch (_) {} },
    clear() { try { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); } catch (_) {} }
  };

  /* ---------- styles ---------- */
  const css = `
  .ow-back{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.45);opacity:0;visibility:hidden;transition:opacity .4s,visibility .4s}
  .ow-back.open{opacity:1;visibility:visible}
  .ow{position:fixed;top:0;right:0;bottom:0;z-index:91;width:min(560px,100vw);display:flex;flex-direction:column;
      background:rgba(12,12,12,.94);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-left:1px solid rgba(255,255,255,.1);
      color:#eee;font:15px/1.45 "Helvetica Neue",Helvetica,Arial,sans-serif;transform:translateX(102%);transition:transform .6s cubic-bezier(.16,1,.3,1)}
  .ow.open{transform:none}
  .ow *{box-sizing:border-box}
  .ow [hidden]{display:none!important}
  .ow button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
  .ow-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 22px;border-bottom:1px solid rgba(255,255,255,.08)}
  .ow-head h2{font-size:18px;font-weight:500;letter-spacing:-.01em}
  .ow-head small{display:block;color:#7d7d7d;font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:4px}
  .ow-x{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.14);font-size:18px;transition:background .3s,color .3s}
  .ow-x:hover{background:#f2f2f2;color:#111}
  .ow-tabs{display:flex;gap:6px;padding:14px 22px 0}
  .ow-tab{padding:9px 14px;border-radius:6px;color:#9a9a9a;border:1px solid transparent;transition:.25s}
  .ow-tab:hover{color:#fff}
  .ow-tab.on{background:#f2f2f2;color:#111}
  .ow-body{flex:1;overflow:auto;padding:18px 22px 30px;overscroll-behavior:contain}
  .ow-foot{display:flex;align-items:center;gap:10px;padding:16px 22px;border-top:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.35)}
  .ow-status{flex:1;color:#9a9a9a;font-size:13px;min-width:0}
  .ow-status.ok{color:#9fdca8}.ow-status.err{color:#ff9b8f}.ow-status.dirty{color:#e8d48a}
  .ow-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 16px;border-radius:7px;border:1px solid rgba(255,255,255,.16);white-space:nowrap;transition:background .25s,color .25s,border-color .25s,opacity .25s}
  .ow-btn:hover{border-color:rgba(255,255,255,.4)}
  .ow-btn.primary{background:#f2f2f2;color:#111;border-color:#f2f2f2}
  .ow-btn.primary:hover{background:#fff}
  .ow-btn.small{height:32px;padding:0 11px;font-size:13px}
  .ow-btn.danger:hover{border-color:#ff9b8f;color:#ff9b8f}
  .ow-btn[disabled]{opacity:.45;pointer-events:none}
  .ow-icon{width:30px;height:30px;border-radius:6px;border:1px solid rgba(255,255,255,.12);display:inline-grid;place-items:center;font-size:14px;color:#bbb;transition:.2s}
  .ow-icon:hover{background:#f2f2f2;color:#111}
  .ow-icon.danger:hover{background:#ff9b8f;color:#111}
  .ow-field{display:block;margin-top:14px}
  .ow-field>span{display:block;color:#8d8d8d;font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}
  .ow input[type=text],.ow input[type=password],.ow input[type=url],.ow textarea{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:7px;color:#f2f2f2;font:inherit;padding:10px 12px;outline:none;transition:border-color .2s,background .2s}
  .ow input:focus,.ow textarea:focus{border-color:rgba(255,255,255,.45);background:rgba(255,255,255,.06)}
  .ow textarea{min-height:96px;resize:vertical}
  .ow-row{display:flex;gap:10px}.ow-row>*{flex:1;min-width:0}
  .ow-card{border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.025);margin-top:14px;overflow:hidden}
  .ow-card-h{display:flex;align-items:center;gap:12px;padding:12px 12px 12px 14px;cursor:pointer}
  .ow-card-h .t{flex:1;min-width:0}
  .ow-card-h .t b{display:block;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ow-card-h .t small{color:#8a8a8a;font-size:12px}
  .ow-card-h img,.ow-card-h .ph{width:64px;height:40px;border-radius:5px;object-fit:cover;background:#1a1a1a;flex:none}
  .ow-card-b{padding:0 14px 16px;border-top:1px solid rgba(255,255,255,.06)}
  .ow-imgs{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:10px;margin-top:8px}
  .ow-img{position:relative;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,.1);background:#141414;aspect-ratio:16/10}
  .ow-img img{width:100%;height:100%;object-fit:contain}
  .ow-img .badge{position:absolute;left:6px;top:6px;padding:2px 7px;border-radius:4px;background:#f2f2f2;color:#111;font-size:11px}
  .ow-img .new{position:absolute;right:6px;top:6px;padding:2px 7px;border-radius:4px;background:#e8d48a;color:#111;font-size:11px}
  .ow-img .tools{position:absolute;inset:auto 0 0 0;display:flex;justify-content:center;gap:4px;padding:6px;background:linear-gradient(transparent,rgba(0,0,0,.85));opacity:0;transition:opacity .2s}
  .ow-img:hover .tools,.ow-img:focus-within .tools{opacity:1}
  .ow-img .tools .ow-icon{width:26px;height:26px;background:rgba(0,0,0,.6)}
  .ow-drop{display:grid;place-items:center;text-align:center;gap:4px;margin-top:10px;padding:18px;border:1px dashed rgba(255,255,255,.22);border-radius:10px;color:#a5a5a5;font-size:14px;cursor:pointer;transition:.25s}
  .ow-drop:hover,.ow-drop.over{border-color:#f2f2f2;color:#fff;background:rgba(255,255,255,.04)}
  .ow-drop small{color:#777;font-size:12px}
  .ow-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
  .ow-chip{display:inline-flex;align-items:center;gap:8px;height:34px;padding:0 6px 0 14px;border-radius:17px;border:1px solid rgba(255,255,255,.16)}
  .ow-chip button{width:22px;height:22px;border-radius:50%;color:#aaa}.ow-chip button:hover{background:#ff9b8f;color:#111}
  .ow-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:6px}
  .ow-h h3{font-size:13px;color:#8d8d8d;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
  .ow-note{margin-top:12px;color:#8d8d8d;font-size:13px}
  .ow-steps{margin:14px 0 0 18px;color:#c9c9c9;font-size:14px}
  .ow-steps li{margin-top:8px}
  .ow-steps b{color:#fff;font-weight:500}
  .ow a.ow-link{color:#fff;text-decoration:underline;text-underline-offset:3px}
  .ow-check{display:flex;align-items:center;gap:10px;margin-top:14px;color:#bbb;font-size:14px;cursor:pointer}
  .ow-spin{width:14px;height:14px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;animation:owspin .7s linear infinite}
  @keyframes owspin{to{transform:rotate(360deg)}}
  @media (max-width:600px){.ow-foot{flex-wrap:wrap}.ow-status{flex-basis:100%}}
  `;

  /* ---------- GitHub API ---------- */
  let token = store.get();
  async function gh(path, opts = {}) {
    const res = await fetch(API + path, {
      ...opts,
      headers: { 'Accept': 'application/vnd.github+json', 'Authorization': 'Bearer ' + token, 'X-GitHub-Api-Version': '2022-11-28', ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) }
    });
    if (!res.ok) {
      let msg = ''; try { msg = (await res.json()).message || ''; } catch (_) {}
      const e = new Error(msg || ('HTTP ' + res.status)); e.status = res.status; throw e;
    }
    return res.status === 204 ? null : res;
  }
  const ghJSON = async (path, opts) => (await gh(path, opts)).json();
  const R = `/repos/${REPO.owner}/${REPO.name}`;

  async function loadRemoteContent() {
    const res = await gh(`${R}/contents/content.js?ref=${REPO.branch}`, { headers: { Accept: 'application/vnd.github.raw+json' } });
    const text = await res.text();
    const sandbox = {};
    new Function('window', text)(sandbox);
    if (!sandbox.SITE) throw new Error('content.js без window.SITE');
    return sandbox.SITE;
  }

  async function commitFiles(files, message) {
    // files: [{ path, content, encoding: 'utf-8' | 'base64' }]
    for (let attempt = 0; attempt < 2; attempt++) {
      const ref = await ghJSON(`${R}/git/ref/heads/${REPO.branch}`);
      const head = ref.object.sha;
      const commit = await ghJSON(`${R}/git/commits/${head}`);
      const tree = [];
      for (const f of files) {
        const blob = await ghJSON(`${R}/git/blobs`, { method: 'POST', body: JSON.stringify({ content: f.content, encoding: f.encoding }) });
        tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
      }
      const newTree = await ghJSON(`${R}/git/trees`, { method: 'POST', body: JSON.stringify({ base_tree: commit.tree.sha, tree }) });
      const newCommit = await ghJSON(`${R}/git/commits`, { method: 'POST', body: JSON.stringify({ message, tree: newTree.sha, parents: [head] }) });
      try {
        await gh(`${R}/git/refs/heads/${REPO.branch}`, { method: 'PATCH', body: JSON.stringify({ sha: newCommit.sha, force: false }) });
        return newCommit.sha;
      } catch (e) {
        if (e.status === 422 && attempt === 0) continue;  // branch moved meanwhile — rebuild on the new head
        throw e;
      }
    }
  }

  /* ---------- images ---------- */
  const pending = new Map();   // path -> { base64, url }
  const slug = (s) => (s || '').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'image';
  const toBase64 = (blob) => new Promise((ok, fail) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = fail; r.readAsDataURL(blob); });
  async function prepareImage(file, hint) {
    let blob = file, ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const keep = file.type === 'image/gif' || file.type === 'image/svg+xml' || (file.size <= 700 * 1024 && /image\/(png|jpe?g|webp)/.test(file.type));
    if (!keep) {
      const bmp = await new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = URL.createObjectURL(file); });
      const max = 2560, k = Math.min(1, max / Math.max(bmp.naturalWidth, bmp.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.round(bmp.naturalWidth * k); c.height = Math.round(bmp.naturalHeight * k);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      URL.revokeObjectURL(bmp.src);
      blob = await new Promise(ok => c.toBlob(ok, 'image/webp', .9));
      if (!blob || blob.type !== 'image/webp') { blob = await new Promise(ok => c.toBlob(ok, 'image/png')); ext = 'png'; } else ext = 'webp';
    }
    if (ext === 'jpeg') ext = 'jpg';
    const path = `works/${slug(hint || file.name)}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}.${ext}`;
    pending.set(path, { base64: await toBase64(blob), url: URL.createObjectURL(blob) });
    return path;
  }
  const src = (path) => (pending.get(path) || published.get(path) || {}).url || path;
  const published = new Map();  // images uploaded this session (kept as blob URLs until GitHub Pages redeploys)

  /* ---------- state ---------- */
  let draft = null, saved = null, dirty = false, tab = 'works', saving = false;
  const openCards = new WeakSet();

  function normalise(S) {
    const s = clone(S || {});
    s.logo = s.logo || ''; s.role = s.role || ''; s.heroTitle = s.heroTitle || ''; s.heroTitleSoft = s.heroTitleSoft || ''; s.heroSub = s.heroSub || ''; s.about = s.about || '';
    if (typeof s.discord === 'string') s.discord = { username: s.discord, link: '' };
    s.discord = s.discord || { username: '', link: '' };
    s.currencies = Array.isArray(s.currencies) ? s.currencies : [];
    s.services = (Array.isArray(s.services) ? s.services : []).map(v => ({ name: v.name || '', description: v.description || '', prices: v.prices || {} }));
    s.projects = (Array.isArray(s.projects) ? s.projects : []).map(p => {
      const images = (p.images && p.images.length ? p.images : [p.cover]).filter(Boolean);
      if (p.cover && !images.includes(p.cover)) images.unshift(p.cover);
      return { title: p.title || '', category: p.category || '', type: p.type || '', description: p.description || '', cover: images[0] || '', images };
    });
    return s;
  }
  function forSite(s) {
    const out = clone(s);
    out.projects.forEach(p => { p.cover = p.images[0] || ''; });
    out.services.forEach(v => {
      const prices = {};
      out.currencies.forEach(c => {
        let val = v.prices[c];
        if (val === undefined || val === null || String(val).trim() === '') return;
        val = String(val).trim();
        prices[c] = /^\d+(\.\d+)?$/.test(val) ? Number(val) : val;
      });
      v.prices = prices;
    });
    return out;
  }
  function previewState() {
    const s = forSite(draft);
    s.projects.forEach(p => { p.images = p.images.map(src); p.cover = src(p.cover); });
    return s;
  }
  let pt;
  function changed() {
    dirty = true; setStatus('Есть несохранённые изменения', 'dirty');
    clearTimeout(pt); pt = setTimeout(() => APP.render(previewState()), 150);
  }

  /* ---------- DOM ---------- */
  let root, back, body, foot, statusEl, saveBtn, tabsEl, headSub;
  function build() {
    document.head.appendChild(el('style', { text: css }));
    back = el('div', { class: 'ow-back', onclick: close });
    headSub = el('small', { text: 'Owner mode' });
    tabsEl = el('div', { class: 'ow-tabs' });
    body = el('div', { class: 'ow-body' });
    statusEl = el('div', { class: 'ow-status' });
    saveBtn = el('button', { class: 'ow-btn primary', onclick: save, text: 'Сохранить на сайт' });
    foot = el('div', { class: 'ow-foot' }, statusEl, saveBtn);
    root = el('aside', { class: 'ow', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Редактор сайта' },
      el('div', { class: 'ow-head' },
        el('div', null, headSub, el('h2', { text: 'Редактор сайта' })),
        el('div', { class: 'ow-row', style: 'flex:none;gap:8px' },
          el('button', { class: 'ow-btn small', text: 'Выйти', title: 'Забыть токен на этом устройстве', onclick: logout }),
          el('button', { class: 'ow-x', 'aria-label': 'Закрыть', text: '×', onclick: close }))),
      tabsEl, body, foot);
    document.body.append(back, root);
    addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('open')) close(); });
    addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  }
  function setStatus(text, kind) { statusEl.className = 'ow-status' + (kind ? ' ' + kind : ''); statusEl.textContent = text; }

  /* ---------- views ---------- */
  function showLogin(error) {
    tabsEl.hidden = true; foot.hidden = true;
    const input = el('input', { type: 'password', placeholder: 'github_pat_…', autocomplete: 'off', spellcheck: 'false' });
    const remember = el('input', { type: 'checkbox', checked: true });
    const btn = el('button', { class: 'ow-btn primary', style: 'margin-top:18px;width:100%', text: 'Войти' });
    const err = el('p', { class: 'ow-note', style: 'color:#ff9b8f', text: error || '' });
    const go = async () => {
      const t = input.value.trim(); if (!t) return input.focus();
      btn.disabled = true; btn.textContent = 'Проверяю…'; err.textContent = '';
      token = t;
      try { await connect(); store.set(t, remember.checked); }
      catch (e) { token = ''; btn.disabled = false; btn.textContent = 'Войти'; err.textContent = explain(e); }
    };
    btn.onclick = go;
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    body.replaceChildren(
      el('p', { style: 'color:#cfcfcf', text: 'Чтобы редактор мог сохранять изменения на сайт, ему нужен ключ доступа к твоему репозиторию на GitHub. Его нужно создать один раз:' }),
      el('ol', { class: 'ow-steps' },
        el('li', null, 'Открой ', el('a', { class: 'ow-link', href: 'https://github.com/settings/personal-access-tokens/new', target: '_blank', rel: 'noopener', text: 'создание токена на GitHub' }), '.'),
        el('li', null, el('b', { text: 'Token name' }), ' — любое, например «portfolio». ', el('b', { text: 'Expiration' }), ' — 1 год (или дольше).'),
        el('li', null, el('b', { text: 'Repository access' }), ' → «Only select repositories» → ', el('b', { text: REPO.name }), '.'),
        el('li', null, el('b', { text: 'Permissions' }), ' → «Add permissions» → ', el('b', { text: 'Contents' }), ' → ', el('b', { text: 'Read and write' }), '.'),
        el('li', null, 'Нажми «Generate token», скопируй ключ и вставь сюда.')),
      el('label', { class: 'ow-field' }, el('span', { text: 'Токен GitHub' }), input),
      el('label', { class: 'ow-check' }, remember, 'Запомнить на этом устройстве'),
      btn, err,
      el('p', { class: 'ow-note', text: 'Ключ хранится только в этом браузере и отправляется только на api.github.com. Никому его не показывай — с ним можно менять сайт.' })
    );
    setTimeout(() => input.focus(), 400);
  }
  function explain(e) {
    if (e.status === 401) return 'GitHub не принял токен. Проверь, что скопировал его целиком.';
    if (e.status === 403) return 'У токена нет нужного доступа. Нужно разрешение Contents: Read and write для ' + REPO.name + '.';
    if (e.status === 404) return 'Токен не видит репозиторий ' + REPO.name + '. Выбери его в «Repository access».';
    if (e.status === 409 || e.status === 422) return 'GitHub отклонил сохранение (' + e.message + '). Попробуй ещё раз.';
    return 'Ошибка: ' + (e.message || e) + '. Проверь интернет и попробуй ещё раз.';
  }
  async function connect() {
    await ghJSON(R);
    let S;
    try { S = await loadRemoteContent(); } catch (_) { S = APP.state; }
    draft = normalise(S); saved = clone(draft); dirty = false;
    APP.render(previewState());
    showEditor();
    setStatus('Подключено к ' + REPO.name);
  }

  function showEditor() {
    tabsEl.hidden = false; foot.hidden = false;
    const tabs = [['works', 'Работы'], ['pricing', 'Цены и услуги'], ['profile', 'Профиль']];
    tabsEl.replaceChildren(...tabs.map(([id, label]) => el('button', { class: 'ow-tab' + (tab === id ? ' on' : ''), text: label, onclick: () => { tab = id; showEditor(); } })));
    const scroll = body.scrollTop;
    body.replaceChildren(...(tab === 'works' ? viewWorks() : tab === 'pricing' ? viewPricing() : viewProfile()).filter(Boolean));
    body.scrollTop = scroll;
  }

  const field = (label, value, onInput, opts = {}) => {
    const input = opts.multiline ? el('textarea', { rows: opts.rows || 4 }) : el('input', { type: opts.type || 'text', placeholder: opts.placeholder || '', list: opts.list || null });
    input.value = value || '';
    input.addEventListener('input', () => { onInput(input.value); changed(); if (opts.after) opts.after(); });
    return el('label', { class: 'ow-field' }, el('span', { text: label }), input);
  };
  const move = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return false; [arr[i], arr[j]] = [arr[j], arr[i]]; return true; };
  const iconBtn = (label, title, fn, danger) => el('button', { class: 'ow-icon' + (danger ? ' danger' : ''), type: 'button', title, 'aria-label': title, text: label, onclick: (e) => { e.stopPropagation(); fn(); } });

  /* works */
  function viewWorks() {
    const cats = [...new Set(draft.projects.map(p => p.category).filter(Boolean))];
    const dl = el('datalist', { id: 'ow-cats' }, cats.map(c => el('option', { value: c })));
    const add = el('button', { class: 'ow-btn', text: '+ Добавить работу', onclick: () => {
      const p = { title: 'New project', category: cats[0] || 'Cartoon', type: 'Game UI', description: '', cover: '', images: [] };
      draft.projects.unshift(p); openCards.add(p); changed(); showEditor();
    } });
    const list = draft.projects.map((p, i) => projectCard(p, i));
    return [
      el('div', { class: 'ow-h' }, el('h3', { text: 'Работы · ' + draft.projects.length }), add),
      el('p', { class: 'ow-note', text: 'Первая работа в списке показывается первой на сайте. Первая картинка проекта — обложка.' }),
      dl, ...list,
      !draft.projects.length ? el('p', { class: 'ow-note', text: 'Работ пока нет — нажми «Добавить работу».' }) : null
    ];
  }
  function projectCard(p, i) {
    const isOpen = openCards.has(p);
    const thumb = p.images[0] ? el('img', { src: src(p.images[0]), alt: '' }) : el('div', { class: 'ph' });
    const title = el('b', { text: p.title || 'Без названия' });
    const sub = el('small', { text: [p.category, p.type].filter(Boolean).join(' / ') + ' · ' + p.images.length + ' img' });
    const head = el('div', { class: 'ow-card-h', onclick: () => { isOpen ? openCards.delete(p) : openCards.add(p); showEditor(); } },
      thumb, el('div', { class: 't' }, title, sub),
      iconBtn('↑', 'Выше', () => { if (move(draft.projects, i, -1)) { changed(); showEditor(); } }),
      iconBtn('↓', 'Ниже', () => { if (move(draft.projects, i, 1)) { changed(); showEditor(); } }),
      iconBtn('✕', 'Удалить работу', () => { if (confirm('Удалить работу «' + (p.title || 'Без названия') + '»?')) { draft.projects.splice(i, 1); changed(); showEditor(); } }, true));
    const card = el('div', { class: 'ow-card' }, head);
    if (!isOpen) return card;

    const refreshHead = () => { title.textContent = p.title || 'Без названия'; sub.textContent = [p.category, p.type].filter(Boolean).join(' / ') + ' · ' + p.images.length + ' img'; };
    const imgs = el('div', { class: 'ow-imgs' }, p.images.map((path, k) => el('div', { class: 'ow-img' },
      el('img', { src: src(path), alt: '' }),
      k === 0 ? el('span', { class: 'badge', text: 'обложка' }) : null,
      pending.has(path) ? el('span', { class: 'new', text: 'новая' }) : null,
      el('div', { class: 'tools' },
        iconBtn('←', 'Левее', () => { if (move(p.images, k, -1)) { changed(); showEditor(); } }),
        iconBtn('★', 'Сделать обложкой', () => { p.images.unshift(p.images.splice(k, 1)[0]); changed(); showEditor(); }),
        iconBtn('→', 'Правее', () => { if (move(p.images, k, 1)) { changed(); showEditor(); } }),
        iconBtn('✕', 'Убрать картинку', () => { p.images.splice(k, 1); changed(); showEditor(); }, true)))));

    const fileInput = el('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true });
    const drop = el('div', { class: 'ow-drop', tabindex: '0', role: 'button' },
      el('div', { text: 'Перетащи сюда картинки из Figma или нажми, чтобы выбрать' }),
      el('small', { text: 'PNG / JPG / WebP / GIF · большие картинки сжимаются автоматически' }));
    const addFiles = async (files) => {
      files = [...files].filter(f => f.type.startsWith('image/')); if (!files.length) return;
      drop.firstChild.textContent = 'Обрабатываю ' + files.length + '…';
      for (const f of files) { try { p.images.push(await prepareImage(f, p.title)); } catch (_) { alert('Не получилось открыть ' + f.name); } }
      changed(); showEditor();
    };
    drop.onclick = () => fileInput.click();
    drop.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } };
    fileInput.onchange = () => addFiles(fileInput.files);
    drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
    drop.ondragleave = () => drop.classList.remove('over');
    drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); addFiles(e.dataTransfer.files); };

    card.appendChild(el('div', { class: 'ow-card-b' },
      field('Название', p.title, v => p.title = v, { after: refreshHead }),
      el('div', { class: 'ow-row' },
        field('Раздел (для фильтра)', p.category, v => p.category = v, { list: 'ow-cats', after: refreshHead, placeholder: 'Cartoon' }),
        field('Тип', p.type, v => p.type = v, { after: refreshHead, placeholder: 'Game UI' })),
      field('Описание (необязательно)', p.description, v => p.description = v, { multiline: true, rows: 3 }),
      el('label', { class: 'ow-field' }, el('span', { text: 'Картинки · ' + p.images.length })),
      imgs, drop, fileInput));
    return card;
  }

  /* pricing */
  function viewPricing() {
    const newCur = el('input', { type: 'text', placeholder: 'Новая валюта, например USD' });
    const addCur = () => {
      const c = newCur.value.trim(); if (!c || draft.currencies.includes(c)) return;
      draft.currencies.push(c); changed(); showEditor();
    };
    newCur.addEventListener('keydown', e => { if (e.key === 'Enter') addCur(); });
    const chips = el('div', { class: 'ow-chips' }, draft.currencies.map((c, i) => el('span', { class: 'ow-chip' }, c,
      el('button', { type: 'button', title: 'Убрать валюту', 'aria-label': 'Убрать ' + c, text: '✕', onclick: () => {
        if (!confirm('Убрать валюту ' + c + '? Её цены у всех услуг тоже удалятся.')) return;
        draft.currencies.splice(i, 1); draft.services.forEach(s => delete s.prices[c]); changed(); showEditor();
      } }))));
    const addSvc = el('button', { class: 'ow-btn', text: '+ Добавить услугу', onclick: () => {
      draft.services.push({ name: 'New service', description: '', prices: {} }); changed(); showEditor();
    } });
    return [
      el('div', { class: 'ow-h' }, el('h3', { text: 'Валюты' })),
      chips,
      el('div', { class: 'ow-row', style: 'margin-top:10px' }, newCur, el('button', { class: 'ow-btn', style: 'flex:none', text: 'Добавить', onclick: addCur })),
      el('div', { class: 'ow-h', style: 'margin-top:30px' }, el('h3', { text: 'Услуги · ' + draft.services.length }), addSvc),
      ...draft.services.map((s, i) => {
        const name = el('b', { text: s.name || 'Без названия' });
        return el('div', { class: 'ow-card' },
          el('div', { class: 'ow-card-h', style: 'cursor:default' },
            el('div', { class: 't' }, name, el('small', { text: String(i + 1).padStart(2, '0') })),
            iconBtn('↑', 'Выше', () => { if (move(draft.services, i, -1)) { changed(); showEditor(); } }),
            iconBtn('↓', 'Ниже', () => { if (move(draft.services, i, 1)) { changed(); showEditor(); } }),
            iconBtn('✕', 'Удалить услугу', () => { if (confirm('Удалить услугу «' + (s.name || 'Без названия') + '»?')) { draft.services.splice(i, 1); changed(); showEditor(); } }, true)),
          el('div', { class: 'ow-card-b' },
            field('Название услуги', s.name, v => s.name = v, { after: () => name.textContent = s.name || 'Без названия' }),
            field('Описание (необязательно)', s.description, v => s.description = v, { multiline: true, rows: 2 }),
            el('div', { class: 'ow-row', style: 'flex-wrap:wrap' }, draft.currencies.map(c =>
              field('Цена, ' + c, s.prices[c] == null ? '' : String(s.prices[c]), v => s.prices[c] = v, { placeholder: 'пусто — не показывать' }))),
          ));
      }),
      el('p', { class: 'ow-note', text: 'Если цену в какой-то валюте оставить пустой, эта строка у услуги не показывается.' })
    ];
  }

  /* profile */
  function viewProfile() {
    return [
      el('div', { class: 'ow-h' }, el('h3', { text: 'Первый экран' })),
      field('Логотип', draft.logo, v => draft.logo = v),
      field('Подпись над заголовком', draft.role, v => draft.role = v, { placeholder: 'Game UI Designer' }),
      el('div', { class: 'ow-row' },
        field('Заголовок', draft.heroTitle, v => draft.heroTitle = v),
        field('Заголовок (серый)', draft.heroTitleSoft, v => draft.heroTitleSoft = v)),
      field('Подзаголовок', draft.heroSub, v => draft.heroSub = v),
      el('div', { class: 'ow-h', style: 'margin-top:30px' }, el('h3', { text: 'Обо мне' })),
      field('Описание', draft.about, v => draft.about = v, { multiline: true, rows: 6 }),
      el('div', { class: 'ow-h', style: 'margin-top:30px' }, el('h3', { text: 'Discord' })),
      field('Ник (копируется по клику)', draft.discord.username, v => draft.discord.username = v, { placeholder: '.dinastyy' }),
      field('Ссылка (необязательно)', draft.discord.link, v => draft.discord.link = v, { type: 'url', placeholder: 'https://discord.gg/…' })
    ];
  }

  /* ---------- save ---------- */
  async function save() {
    if (saving || !draft) return;
    const S = forSite(draft);
    const empty = S.projects.filter(p => !p.images.length).map(p => p.title || 'Без названия');
    if (empty.length && !confirm('У этих работ нет картинок: ' + empty.join(', ') + '. Всё равно сохранить?')) return;
    saving = true; saveBtn.disabled = true; saveBtn.replaceChildren(el('span', { class: 'ow-spin' }), 'Сохраняю…');
    setStatus('Отправляю на GitHub…');
    try {
      const used = new Set(S.projects.flatMap(p => p.images));
      const files = [];
      for (const [path, img] of pending) if (used.has(path)) files.push({ path, content: img.base64, encoding: 'base64' });
      const text = '/* Контент сайта. Проще всего менять его через кнопку «Owner access» внизу сайта.\n'
                 + '   Можно править и вручную — см. README.md. */\n\n'
                 + 'window.SITE = ' + JSON.stringify(S, null, 2) + ';\n';
      files.push({ path: 'content.js', content: text, encoding: 'utf-8' });
      const sha = await commitFiles(files, 'Update site content' + (files.length > 1 ? ` (+${files.length - 1} image${files.length > 2 ? 's' : ''})` : ''));
      for (const f of files) if (pending.has(f.path)) { published.set(f.path, pending.get(f.path)); pending.delete(f.path); }
      saved = clone(draft); dirty = false;
      setStatus('Сохранено ✓ Сайт обновится через 1–2 минуты.', 'ok');
      statusEl.append(' ', el('a', { class: 'ow-link', href: `https://github.com/${REPO.owner}/${REPO.name}/commit/${sha}`, target: '_blank', rel: 'noopener', text: 'коммит' }));
      showEditor();
    } catch (e) {
      setStatus(explain(e), 'err');
      if (e.status === 401) { store.clear(); token = ''; }
    } finally {
      saving = false; saveBtn.disabled = false; saveBtn.textContent = 'Сохранить на сайт';
    }
  }

  /* ---------- open / close ---------- */
  async function open() {
    if (!root) build();
    back.classList.add('open'); root.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (draft) return showEditor();
    if (!token) return showLogin();
    body.replaceChildren(el('p', { class: 'ow-note', text: 'Подключаюсь к GitHub…' }));
    tabsEl.hidden = true; foot.hidden = true;
    try { await connect(); }
    catch (e) { if (e.status === 401 || e.status === 403 || e.status === 404) store.clear(); token = store.get(); showLogin(explain(e)); }
  }
  function close() {
    if (!root) return;
    back.classList.remove('open'); root.classList.remove('open');
    document.body.style.overflow = '';
  }
  function logout() {
    if (dirty && !confirm('Есть несохранённые изменения. Выйти без сохранения?')) return;
    if (saved) { draft = saved; APP.render(previewState()); }   // drop unsaved preview changes
    store.clear(); token = ''; draft = null; saved = null; dirty = false;
    setStatus('');
    showLogin();
  }

  window.OWNER = { open, close };
})();
