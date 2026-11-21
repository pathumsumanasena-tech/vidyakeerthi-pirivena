/* Vidyakeerthi Editorial Studio v1 | Supabase Auth + RLS. No secret keys client-side. */
const byId = id => document.getElementById(id);
const all = selector => [...document.querySelectorAll(selector)];
const val = id => byId(id).value.trim();
const node = (tag, cls='', content) => {
  const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e;
};
const safeUrl = url => /^https:\/\//i.test(url||'') || /^(?:\.\/)?assets\/[A-Za-z0-9._/-]+$/.test(url||'');
const relativeUrl = url => /^(?:\.\/)?assets\//.test(url||'') ? '../'+url.replace(/^\.\//,'') : url;
const state={supabase:null,session:null,member:null,manifest:null,news:[],texts:{},media:{},timeline:{},gallery:[],team:[],selectedText:null,selectedMedia:null,selectedYear:'1959'};
let noticeTimeout;
function notice(message, error=false) {
  const box=byId('notice');box.textContent=message;box.classList.toggle('error',error);box.hidden=false;
  clearTimeout(noticeTimeout);noticeTimeout=setTimeout(()=>{box.hidden=true;},5500);
}
function report(err) { const msg=err?.message || String(err);console.error(err);notice(msg,true); }
function busy(button,promise) {
  button.disabled=true;
  return Promise.resolve(promise).finally(()=>{button.disabled=false;});
}
const isAdmin=()=>state.member?.role==='admin';
function showAuth() {byId('login-screen').hidden=false;byId('pending-screen').hidden=true;byId('studio').hidden=true;}
function showPending() {byId('login-screen').hidden=true;byId('pending-screen').hidden=false;byId('studio').hidden=true;}
function showStudio() {byId('login-screen').hidden=true;byId('pending-screen').hidden=true;byId('studio').hidden=false;}
function empty(holder, message) {holder.replaceChildren(node('p','empty-list',message));}
function take(name) {return state.supabase.from(name);}
async function must(result) {if(result.error) throw result.error;return result.data;}

async function login(event) {
  event.preventDefault();const btn=event.target.querySelector('button[type=submit]');
  byId('auth-error').textContent='';
  try {
    await busy(btn,(async()=>{
      const {data,error}=await state.supabase.auth.signInWithPassword({email:val('login-email'),password:byId('login-password').value});
      if(error) throw error;
      await loadMember(data.user);
    })());
  } catch(e) {byId('auth-error').textContent=e.message;}
}
async function signup() {
  byId('auth-error').textContent='';
  const email=val('login-email'),password=byId('login-password').value;
  if(!email||password.length<6) {byId('auth-error').textContent='Email එක සහ අකුරු 6ක් හෝ වැඩි Password එකක් දෙන්න.';return;}
  try {
    const {error}=await state.supabase.auth.signUp({email,password});
    if(error) throw error;
    notice('Account request ලැබුණා. Email verification තිබේ නම් Verify කර Admin වෙත Email එක දැනුම් දෙන්න.');
    byId('auth-error').textContent='Account එක සෑදුණා නම් Email Verify කරන්න. Super Admin අවසර ලබාදිය යුතුයි.';
  } catch(e) {byId('auth-error').textContent=e.message;}
}
async function loadMember(user) {
  if(!user) return showAuth();
  state.session={user};
  const result=await take('cms_memberships').select('user_id,email,role').eq('user_id',user.id).maybeSingle();
  if(result.error) {report(result.error);return showPending();}
  state.member=result.data;
  if(!state.member) return showPending();
  showStudio();
  byId('role-chip').textContent=state.member.role==='admin'?'SUPER ADMIN':'EDITOR';
  byId('account-label').textContent=user.email;
  all('.admin-only').forEach(el=>el.hidden=!isAdmin());
  showPage('dashboard');
  await loadAll();
}
async function signout() {
  const {error}=await state.supabase.auth.signOut();if(error) return report(error);
  state.member=null;state.session=null;showAuth();notice('Logout සාර්ථකයි.');
}
function showPage(name) {
  if(!isAdmin() && !['dashboard','news'].includes(name)) name='dashboard';
  all('.page').forEach(page=>page.classList.toggle('visible',page.dataset.page===name));
  all('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.target===name));
  const selected=all('.nav-item').find(button=>button.dataset.target===name);
  byId('current-page-title').textContent=selected?.textContent.trim() || 'Dashboard';
  byId('studio').classList.remove('menu-open');
  window.scrollTo(0,0);
}
async function loadAll() {
  try {
    if(!state.manifest) {
      const response=await fetch('../cms-manifest.json',{cache:'no-store'});
      if(!response.ok) throw new Error('cms-manifest.json missing');
      state.manifest=await response.json();
    }
    const queries=[take('cms_news').select('*').order('updated_at',{ascending:false}).limit(250)];
    if(isAdmin()) queries.push(take('cms_text').select('*').limit(500),take('cms_media').select('*').limit(250),take('cms_timeline').select('*').limit(30),take('cms_gallery').select('*').order('sort_order',{ascending:true}).limit(250),take('cms_memberships').select('*').order('created_at',{ascending:true}));
    const results=await Promise.all(queries);results.forEach(r=>{if(r.error)throw r.error;});
    state.news=results[0].data;
    if(isAdmin()) {
      state.texts=Object.fromEntries(results[1].data.map(x=>[x.content_key,x]));
      state.media=Object.fromEntries(results[2].data.map(x=>[x.content_key,x]));
      state.timeline=Object.fromEntries(results[3].data.map(x=>[x.year,x.payload]));
      state.gallery=results[4].data;state.team=results[5].data;
    }
    renderDashboard();renderNews();
    if(isAdmin()) {renderText();renderMedia();renderTimeline();renderGallery();renderTeam();}
  } catch(e){report(e);}
}
function statusChip(status) {return node('span','status-pill'+(status==='draft'?' draft':''),status==='published'?'PUBLISHED':'DRAFT');}
function newsRow(item, mini=false) {
  const row=node('div','feed-row'), main=node('div','feed-main');
  main.append(node('strong','',item.title_si||item.title_en||'Untitled'));
  const date=new Date(item.updated_at).toLocaleDateString('en-LK');
  main.append(node('small','',`${item.category} · ${date}`));row.append(main,statusChip(item.status));
  const editable=isAdmin()||item.created_by===state.session.user.id;
  if(!mini&&editable) {const btn=node('button','outline-btn','Edit');btn.type='button';btn.onclick=()=>openArticle(item);row.append(btn);}
  return row;
}
function renderDashboard() {
  byId('kpi-all').textContent=state.news.length;
  byId('kpi-live').textContent=state.news.filter(x=>x.status==='published').length;
  byId('kpi-draft').textContent=state.news.filter(x=>x.status==='draft').length;
  const feed=byId('dashboard-latest');feed.replaceChildren();
  if(!state.news.length)return empty(feed,'තවම පුවත් එකතු කර නැහැ. + අලුත් පුවතක් ඔබන්න.');
  state.news.slice(0,5).forEach(row=>feed.append(newsRow(row,true)));
}
function renderNews() {
  const query=val('news-search').toLocaleLowerCase(),filter=byId('news-filter').value;
  const filtered=state.news.filter(item=>(filter==='all'||item.status===filter)&&[item.title_si,item.title_en,item.title_ta,item.category].join(' ').toLocaleLowerCase().includes(query));
  const list=byId('news-list');list.replaceChildren();
  if(!filtered.length)return empty(list,'ගැළපෙන පුවත් නැහැ.');
  filtered.forEach(row=>list.append(newsRow(row)));
}
function resetArticle() {
  byId('article-form').reset();byId('article-id').value='';
  byId('article-cover-preview').replaceChildren();
  byId('delete-article-btn').hidden=true;byId('editor-title').textContent='නව පුවතක්';
}
function openArticle(item=null) {
  showPage('news');resetArticle();
  if(item) {
    for(const lang of ['si','en','ta']) for(const field of ['title','summary','body'])
      byId(`article-${field}-${lang}`).value=item[`${field}_${lang}`]||'';
    byId('article-id').value=item.id;
    byId('article-category').value=item.category;
    byId('article-featured').checked=Boolean(item.featured);
    byId('article-cover').value=item.cover_url||'';
    byId('delete-article-btn').hidden=false;
    byId('editor-title').textContent='පුවත සංස්කරණය';
    displayPreviewImage(byId('article-cover-preview'),item.cover_url,'image');
  }
  byId('article-editor').hidden=false;byId('article-editor').scrollIntoView({behavior:'smooth',block:'start'});
}
async function upload(file) {
  if(!file) return null;
  const allowed=['image/jpeg','image/png','image/webp','image/gif','video/mp4','application/pdf'];
  if(!allowed.includes(file.type)) throw new Error('JPEG / PNG / WebP / GIF / MP4 / PDF ගොනු පමණක් භාවිත කරන්න.');
  if(file.size>20*1024*1024) throw new Error('File එක 20 MB ට වඩා ලොකුයි. Compress කරන්න.');
  const ext=file.name.split('.').at(-1).toLowerCase().replace(/[^a-z0-9]/g,'')||'file';
  const path=`${state.session.user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const {data,error}=await state.supabase.storage.from('cms-media').upload(path,file,{cacheControl:'3600',contentType:file.type,upsert:false});
  if(error) throw error;
  const {data:link}=state.supabase.storage.from('cms-media').getPublicUrl(data.path);
  return link.publicUrl;
}
function displayPreviewImage(holder,url,kind) {
  holder.replaceChildren();if(!url||!safeUrl(url))return;
  const resolved=relativeUrl(url);
  if(kind==='video') {const video=node('video');video.controls=true;video.preload='none';video.src=resolved;holder.append(video);}
  else if(kind==='document') {const a=node('a','','Open PDF / File ↗');a.href=resolved;a.target='_blank';a.rel='noopener';holder.append(a);}
  else {const image=node('img');image.src=resolved;image.alt='Preview';holder.append(image);}
}
async function saveArticle(status) {
  const submit=byId(status==='draft'?'save-draft-btn':'publish-btn');
  const title=val('article-title-si');if(title.length<3) {notice('සිංහල මාතෘකාව අකුරු 3ක් හෝ වැඩි කරන්න.',true);return;}
  try {
    await busy(submit,(async()=>{
      const payload={category:val('article-category'),featured:byId('article-featured').checked,status,
        cover_url:val('article-cover')};
      for (const lang of ['si','en','ta']) for(const field of ['title','summary','body'])
        payload[`${field}_${lang}`]=val(`article-${field}-${lang}`);
      const file=byId('article-cover-file').files[0];
      if(file) payload.cover_url=await upload(file);
      if(payload.cover_url&&!safeUrl(payload.cover_url))throw new Error('Photo URL එක HTTPS විය යුතුයි.');
      const id=val('article-id');
      if(id) {
        await must(await take('cms_news').update(payload).eq('id',id).select('id'));
      } else {
        payload.created_by=state.session.user.id;
        await must(await take('cms_news').insert(payload).select('id'));
      }
      notice(status==='published'?'පුවත Publish කළා! Website එකේ දැන් පෙනෙයි.':'Draft එක Save කළා.');
      byId('article-editor').hidden=true;await loadAll();
    })());
  }catch(e){report(e);}
}
async function deleteArticle() {
  const id=val('article-id');if(!id||!confirm('මෙම පුවත සම්පූර්ණයෙන් ඉවත් කරන්නද?'))return;
  try {await must(await take('cms_news').delete().eq('id',id));notice('පුවත ඉවත් කළා.');byId('article-editor').hidden=true;await loadAll();}
  catch(e){report(e);}
}
function previewArticle() {
  const dialog=byId('preview-dialog'),content=byId('preview-content');content.replaceChildren();
  const url=val('article-cover');if(safeUrl(url)){const img=node('img');img.src=relativeUrl(url);content.append(img);}
  content.append(node('small','',val('article-category')),node('h2','',val('article-title-si')),node('p','',val('article-summary-si')),node('p','',val('article-body-si')));
  dialog.showModal();
}

const sectionNames={home:'මුල් පිටුව / Hero',header:'Header / Menu',history:'ඉතිහාසය',about:'අප ගැන',education:'අධ්‍යාපනය',leadership:'නායකත්වය',achievements:'ජයග්‍රහණ',gallery:'ඡායාරූප',vision:'අනාගත දැක්ම',guide:'QR මඟපෙන්වීම',archive:'ඉතිහාස PDF',affiliates:'අනුබද්ධ ආයතන',location:'පිහිටීම',footer:'Footer',general:'වෙනත්',news:'පුවත්'};
function selectOptions(id,items) {
  const sel=byId(id);if(sel.options.length>1)return;
  [...new Set(items.map(x=>x.section))].forEach(key=>{const op=node('option','',sectionNames[key]||key);op.value=key;sel.append(op);});
}
function pickerButton(item,selected,subtitle,onclick,label) {
  const btn=node('button','picker-item'+(selected?' selected':''));btn.type='button';
  btn.append(node('strong','',label),node('small','',subtitle));btn.onclick=onclick;return btn;
}
function renderText() {
  if(!state.manifest)return;
  byId('text-count').textContent=`${state.manifest.text.length} ITEMS`;
  selectOptions('text-section',state.manifest.text);
  const section=byId('text-section').value, q=val('text-search').toLocaleLowerCase();
  const list=byId('text-list');list.replaceChildren();
  const items=state.manifest.text.filter(x=>(section==='all'||x.section===section)&&[x.si,x.en,x.ta].join(' ').toLocaleLowerCase().includes(q));
  items.forEach(item=>{
    const modified=Boolean(state.texts[item.key]);
    list.append(pickerButton(item,state.selectedText===item.key,`${sectionNames[item.section]||item.section} ${modified?'· UPDATED':''}`,()=>openText(item),item.si.slice(0,100)||item.en.slice(0,100)||'(blank)'));
  });
  if(!items.length)empty(list,'මෙම අංශයේ විස්තර හමු වුණේ නැහැ.');
}
function openText(item) {
  state.selectedText=item.key;
  byId('text-empty').hidden=true;byId('text-editor').hidden=false;
  byId('text-edit-section').textContent=sectionNames[item.section]||item.section;
  byId('text-edit-title').textContent=item.si.slice(0,80)||'Edit Content';
  const current=state.texts[item.key]||item;
  for(const lang of ['si','en','ta'])byId(`text-${lang}`).value=current[lang]||'';
  renderText();
}
async function saveText(event) {
  event.preventDefault();const item=state.manifest.text.find(x=>x.key===state.selectedText);if(!item)return;
  const payload={content_key:item.key,si:val('text-si'),en:val('text-en'),ta:val('text-ta'),updated_by:state.session.user.id};
  try{await must(await take('cms_text').upsert(payload));state.texts[item.key]=payload;renderText();notice('වෙනස්කම් Save කළා. Website එක Refresh කළාම පෙනෙයි.');}
  catch(e){report(e);}
}
async function resetText() {
  const k=state.selectedText;if(!k)return;
  try {if(state.texts[k]) await must(await take('cms_text').delete().eq('content_key',k));
    delete state.texts[k];openText(state.manifest.text.find(x=>x.key===k));notice('මුල් විස්තරය නැවත ලබාගත්තා.');}catch(e){report(e);}
}
function renderMedia() {
  const items=state.manifest.media;byId('media-count').textContent=`${items.length} ASSETS`;
  selectOptions('media-section',items);
  const section=byId('media-section').value, list=byId('media-list');list.replaceChildren();
  items.filter(x=>section==='all'||x.section===section).forEach(item=>{
    const modified=Boolean(state.media[item.key]);
    list.append(pickerButton(item,state.selectedMedia===item.key,`${sectionNames[item.section]||item.section} · ${item.kind}${modified?' · UPDATED':''}`,()=>openMedia(item),item.label));
  });
}
function openMedia(item) {
  state.selectedMedia=item.key;byId('media-empty').hidden=true;byId('media-editor').hidden=false;
  byId('media-edit-section').textContent=sectionNames[item.section]||item.section;
  byId('media-edit-title').textContent=item.label;
  const url=state.media[item.key]?.url||item.url;
  byId('media-url').value=url.startsWith('assets/')?'':url;
  byId('media-file').value='';
  displayPreviewImage(byId('media-preview'),url,item.kind);
  renderMedia();
}
async function saveMedia(event) {
  event.preventDefault();const item=state.manifest.media.find(x=>x.key===state.selectedMedia);if(!item)return;
  const btn=event.submitter||event.target.querySelector('button[type=submit]');
  try {await busy(btn,(async()=>{
    let url=val('media-url');const file=byId('media-file').files[0];if(file) url=await upload(file);
    if(!url)throw Error('File එකක් තෝරන්න හෝ HTTPS URL එකක් දෙන්න.');
    if(!safeUrl(url))throw Error('HTTPS URL එකක් දෙන්න.');
    await must(await take('cms_media').upsert({content_key:item.key,url,updated_by:state.session.user.id}));
    state.media[item.key]={url};openMedia(item);notice('Photo / File එක Update කළා.');
  })());}catch(e){report(e);}
}
async function resetMedia() {
  const k=state.selectedMedia;if(!k)return;
  try {if(state.media[k])await must(await take('cms_media').delete().eq('content_key',k));delete state.media[k];openMedia(state.manifest.media.find(x=>x.key===k));notice('මුල් Photo / File එක Restore කළා.');}catch(e){report(e);}
}
function renderTimeline() {
  const holder=byId('timeline-year-buttons');holder.replaceChildren();
  Object.keys(state.manifest.timeline).forEach(year=>{
    const button=node('button',year===state.selectedYear?'selected':'',year);button.type='button';button.onclick=()=>{state.selectedYear=year;renderTimeline();};holder.append(button);
  });
  const year=state.selectedYear, payload=state.timeline[year]||state.manifest.timeline[year];
  byId('timeline-title').textContent=`${year} · ${payload.si[0]}`;
  byId('timeline-tag').value=payload.tag||'';
  byId('timeline-image').value=payload.image||'';
  byId('timeline-file').value='';
  for(const lang of ['si','en','ta']){
    byId('timeline-title-'+lang).value=payload[lang]?.[0]||'';
    byId('timeline-body-'+lang).value=payload[lang]?.[1]||'';
  }
}
async function saveTimeline(event) {
  event.preventDefault();const year=state.selectedYear;
  const base=structuredClone(state.timeline[year]||state.manifest.timeline[year]);
  base.tag=val('timeline-tag');base.image=val('timeline-image');
  for(const lang of ['si','en','ta'])base[lang]=[val('timeline-title-'+lang),val('timeline-body-'+lang)];
  const btn=event.submitter;
  try{await busy(btn,(async()=>{
    if(byId('timeline-file').files[0])base.image=await upload(byId('timeline-file').files[0]);
    if(!safeUrl(base.image))throw Error('Photo සඳහා HTTPS URL හෝ assets/ path එකක් භාවිත කරන්න.');
    await must(await take('cms_timeline').upsert({year,payload:base,updated_by:state.session.user.id}));
    state.timeline[year]=base;renderTimeline();notice('Timeline එක Update කළා.');
  })());}catch(e){report(e);}
}
async function resetTimeline() {
  const year=state.selectedYear;
  try {if(state.timeline[year])await must(await take('cms_timeline').delete().eq('year',year));delete state.timeline[year];renderTimeline();notice('මුල් Timeline විස්තර නැවත ලබාගත්තා.');}catch(e){report(e);}
}
async function addGallery(event) {
  event.preventDefault();const btn=event.submitter;
  try{await busy(btn,(async()=>{
    let url=val('gallery-url');if(byId('gallery-file').files[0])url=await upload(byId('gallery-file').files[0]);
    if(!url||!safeUrl(url))throw Error('Photo file එකක් හෝ HTTPS URL එකක් දෙන්න.');
    await must(await take('cms_gallery').insert({image_url:url,caption_si:val('gallery-caption-si'),caption_en:val('gallery-caption-en'),caption_ta:val('gallery-caption-ta'),sort_order:Number(val('gallery-sort'))||0}));
    event.target.reset();notice('නව Photo එක Gallery එකට එක් කළා.');await loadAll();
  })());}catch(e){report(e);}
}
function renderGallery() {
  const holder=byId('gallery-list');holder.replaceChildren();
  if(!state.gallery.length)return empty(holder,'අමතර Photo තවම එකතු කර නැහැ. මුල් Gallery ඡායාරූප එලෙසම තියෙනවා.');
  state.gallery.forEach(item=>{
    const card=node('div','gallery-admin-card');
    if(safeUrl(item.image_url)){const img=node('img');img.src=relativeUrl(item.image_url);img.alt=item.caption_si||'Gallery';card.append(img);}
    card.append(node('p','',item.caption_si||'Gallery Photo'));
    const btn=node('button','','Remove');btn.type='button';btn.onclick=async()=>{
      if(!confirm('මෙම Gallery Photo එක ඉවත් කරන්නද?'))return;
      try{await must(await take('cms_gallery').delete().eq('id',item.id));notice('Photo එක Gallery එකෙන් ඉවත් කළා.');await loadAll();}catch(e){report(e);}
    };card.append(btn);holder.append(card);
  });
}
function renderTeam() {
  const holder=byId('team-list');holder.replaceChildren();
  state.team.forEach(item=>{
    const row=node('div','feed-row'),main=node('div','feed-main');
    main.append(node('strong','',item.email),node('small','',item.role.toUpperCase()));row.append(main);
    if(item.user_id!==state.session.user.id){const btn=node('button','danger-link','Revoke');btn.type='button';btn.onclick=async()=>{
      if(!confirm(`Revoke access for ${item.email}?`))return;
      try {await must(await state.supabase.rpc('cms_remove_member',{p_user_id:item.user_id}));notice('Editor අවසර ඉවත් කළා.');await loadAll();}catch(e){report(e);}
    };row.append(btn);}holder.append(row);
  });
}
async function grantMember(event) {
  event.preventDefault();const btn=event.submitter;
  try{await busy(btn,(async()=>{
    await must(await state.supabase.rpc('cms_grant_member',{p_email:val('team-email'),p_role:val('team-role')}));
    byId('team-form').reset();notice('අවසර ලබාදුන්නා. දැන් Editor ට Login වෙන්න පුළුවන්.');await loadAll();
  })());}catch(e){report(e);}
}
function bind() {
  byId('login-form').addEventListener('submit',login);
  byId('signup-button').addEventListener('click',signup);
  byId('pending-logout').addEventListener('click',signout);
  byId('logout-button').addEventListener('click',signout);
  byId('mobile-menu').onclick=()=>byId('studio').classList.toggle('menu-open');
  all('.nav-item').forEach(button=>button.onclick=()=>showPage(button.dataset.target));
  byId('quick-news').onclick=()=>openArticle();
  byId('view-news').onclick=()=>showPage('news');
  byId('new-article-btn').onclick=()=>openArticle();
  byId('close-article').onclick=()=>byId('article-editor').hidden=true;
  byId('news-search').addEventListener('input',renderNews);
  byId('news-filter').addEventListener('change',renderNews);
  byId('article-cover').addEventListener('change',()=>displayPreviewImage(byId('article-cover-preview'),val('article-cover'),'image'));
  byId('article-form').addEventListener('submit',e=>{e.preventDefault();saveArticle('published');});
  byId('save-draft-btn').onclick=()=>saveArticle('draft');
  byId('delete-article-btn').onclick=deleteArticle;
  byId('preview-article-btn').onclick=previewArticle;
  byId('preview-close').onclick=()=>byId('preview-dialog').close();
  byId('text-search').addEventListener('input',renderText);
  byId('text-section').addEventListener('change',renderText);
  byId('text-editor').addEventListener('submit',saveText);
  byId('reset-text').onclick=resetText;
  byId('media-section').addEventListener('change',renderMedia);
  byId('media-editor').addEventListener('submit',saveMedia);
  byId('reset-media').onclick=resetMedia;
  byId('timeline-form').addEventListener('submit',saveTimeline);
  byId('reset-timeline').onclick=resetTimeline;
  byId('gallery-form').addEventListener('submit',addGallery);
  byId('team-form').addEventListener('submit',grantMember);
}
async function init() {
  bind();
  const cfg=window.VIDYA_CMS_CONFIG||{};
  if(!/^https:\/\/[a-z0-9.-]+\.supabase\.co\/?$/i.test(cfg.url||'') || !cfg.anonKey || cfg.anonKey.startsWith('YOUR_')){
    byId('auth-error').textContent='Setup ඉතිරිව ඇත: cms-config.js එකේ Supabase Project URL සහ Publishable Key එක ඇතුළු කරන්න.';
    byId('login-form').querySelector('button[type=submit]').disabled=true;
    byId('signup-button').disabled=true;
    return;
  }
  try{
    const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    state.supabase=createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true}});
    const {data,error}=await state.supabase.auth.getUser();
    if(error&&error.name!=='AuthSessionMissingError') console.warn(error.message);
    if(data?.user) await loadMember(data.user);
    // Watch session expiry, logout, and external sign-in without recursive auth calls.
    state.supabase.auth.onAuthStateChange((event,session)=>{
      if(event==='SIGNED_OUT'){state.member=null;state.session=null;showAuth();}
      if(event==='SIGNED_IN'&&session?.user&&!state.member) setTimeout(()=>loadMember(session.user).catch(report),0);
    });
  }catch(e) {byId('auth-error').textContent='Supabase Library Connect වුණේ නැහැ. Internet connection එක සහ URL පරීක්ෂා කරන්න. '+e.message;}
}
init();
