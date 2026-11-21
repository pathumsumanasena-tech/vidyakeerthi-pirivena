/* Vidyakeerthi Public CMS: safe read-only access to published content. */
(() => {
  'use strict';
  const config = window.VIDYA_CMS_CONFIG || {};
  if (!/^https:\/\/[a-z0-9.-]+\.supabase\.co\/?$/i.test(config.url || '') ||
      !config.anonKey || config.anonKey.startsWith('YOUR_')) return;
  const base = config.url.replace(/\/$/, '') + '/rest/v1/';
  const headers = { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}` };
  let news = [];
  let currentLanguage = document.querySelector('.lang-option.active')?.dataset.lang || 'si';
  const categories = {
    events: { si:'වැඩසටහන්',en:'Events',ta:'நிகழ்வுகள்' },
    achievements:{si:'ජයග්‍රහණ',en:'Achievements',ta:'சாதனைகள்'},
    education:{si:'අධ්‍යාපනය',en:'Education',ta:'கல்வி'},
    announcements:{si:'නිවේදන',en:'Announcements',ta:'அறிவிப்புகள்'},
    religious:{si:'ශාසනික',en:'Religious',ta:'மதச் செய்திகள்'},
    other:{si:'වෙනත්',en:'Other',ta:'மற்றவை'}
  };
  const languageName = (item, prefix) => item[`${prefix}_${currentLanguage}`] || item[`${prefix}_si`] || '';
  const safeUrl = url => /^https:\/\//i.test(url || '') || /^(?:\.\/)?assets\/[A-Za-z0-9._/-]+$/.test(url || '');
  async function get(table, params='') {
    const response = await fetch(base + table + '?'+params, { headers, cache:'no-store' });
    if (!response.ok) throw Error(`${table}: ${response.status}`);
    return response.json();
  }

  function renderPageOverrides(rows) {
    for (const row of rows) {
      const el = [...document.querySelectorAll('[data-cms-key],[data-cms-caption]')].find(e => e.dataset.cmsKey === row.content_key || e.dataset.cmsCaption === row.content_key);
      if (!el) continue;
      if (el.dataset.cmsCaption) {
        el.dataset.captionSi = row.si;
        el.dataset.captionEn = row.en;
        el.dataset.captionTa = row.ta;
      } else {
        el.dataset.si = row.si;
        el.dataset.en = row.en;
        el.dataset.ta = row.ta;
      }
    }
    // Website's original language handler remains the single owner of translations.
    document.querySelector('.lang-option.active')?.click();
  }
  function renderMedia(rows) {
    for (const row of rows) {
      if (!safeUrl(row.url)) continue;
      const target = [...document.querySelectorAll('[data-cms-media],[data-cms-poster]')]
        .find(el => el.dataset.cmsMedia === row.content_key || el.dataset.cmsPoster === row.content_key);
      if (!target) continue;
      if (target.dataset.cmsPoster) target.setAttribute('poster', row.url);
      else if (target.tagName === 'A') target.href = row.url;
      else {
        target.src = row.url;
        const galleryButton = target.closest('button.gallery-item');
        if (galleryButton && target.tagName === 'IMG') galleryButton.dataset.image = row.url;
        if (target.tagName === 'SOURCE') target.closest('video')?.load();
      }
    }
  }
  const el = (type, className, content) => {
    const node = document.createElement(type);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  };
  const dateLabel = value => {
    const locale = currentLanguage === 'ta' ? 'ta-LK' : (currentLanguage === 'en'?'en-LK':'si-LK');
    return value ? new Date(value).toLocaleDateString(locale, { year:'numeric', month:'short', day:'numeric' }): '';
  };

  function newsModal() {
    let modal = document.getElementById('cms-article-modal');
    if (modal) return modal;
    modal = el('dialog','cms-article-modal');modal.id='cms-article-modal';
    modal.innerHTML='<div class="cms-article-shell"><button class="cms-close" type="button" aria-label="Close">×</button><div class="cms-article-content"></div></div>';
    document.body.append(modal);
    modal.querySelector('button.cms-close').onclick=()=>modal.close();
    modal.addEventListener('click',e=>{if(e.target===modal)modal.close();});
    return modal;
  }
  function openArticle(id) {
    const article = news.find(row=>row.id===id);
    if (!article) return;
    const modal=newsModal();
    const content=modal.querySelector('.cms-article-content');content.replaceChildren();
    if (safeUrl(article.cover_url)) {
      const img=el('img','cms-article-cover');img.src=article.cover_url;img.alt=languageName(article,'title');content.append(img);
    }
    const meta=el('p','cms-meta',`${categories[article.category]?.[currentLanguage] || article.category}  ·  ${dateLabel(article.published_at)}`);
    content.append(meta,el('h2','cms-article-title',languageName(article,'title')),
      el('p','cms-article-summary',languageName(article,'summary')),
      el('div','cms-article-body',languageName(article,'body')));
    if (typeof modal.showModal==='function') modal.showModal();
    else modal.setAttribute('open','');
  }
  function renderArticles(container, items) {
    container.replaceChildren();
    for (const article of items) {
      const card=el('article','cms-news-card');
      const button=el('button','cms-news-button');button.type='button';
      if (safeUrl(article.cover_url)) {
        const img=el('img','cms-news-image');img.src=article.cover_url;img.alt='';img.loading='lazy';button.append(img);
      } else button.append(el('div','cms-news-placeholder','✺'));
      const copy=el('div','cms-news-copy');
      copy.append(el('span','cms-news-category',(categories[article.category]?.[currentLanguage]||article.category)+(article.featured?' · ★':'')));
      copy.append(el('h3','',languageName(article,'title')));
      copy.append(el('p','',languageName(article,'summary')));
      copy.append(el('small','cms-news-date',dateLabel(article.published_at)));
      button.append(copy);button.onclick=()=>openArticle(article.id);card.append(button);container.append(card);
    }
  }
  function renderNews() {
    const section=document.getElementById('news'),grid=document.getElementById('cms-news-grid');
    if (section && grid && news.length) {
      section.hidden=false;
      renderArticles(grid,news.slice(0,6));
      if (!document.querySelector('.nav-links a[href="#news"]')) {
        const link=el('a','',({si:'පුවත්',en:'News',ta:'செய்திகள்'})[currentLanguage]);
        link.href='#news';link.dataset.cmsNewsLink='';
        const galleryLink=document.querySelector('.nav-links a[href="#gallery"]');
        (galleryLink||document.querySelector('.nav-links')).before(link);
        link.addEventListener('click',()=>{
          const menu=document.getElementById('nav-links');menu?.classList.remove('is-open');
          document.getElementById('menu-toggle')?.setAttribute('aria-expanded','false');
        });
      }
    }
    const archive=document.getElementById('cms-news-archive');
    if (archive) renderArticles(archive,news);
    const navLink=document.querySelector('[data-cms-news-link]');
    if (navLink) navLink.textContent=({si:'පුවත්',en:'News',ta:'செய்திகள்'})[currentLanguage];
  }
  function renderGallery(rows) {
    const target=document.querySelector('#gallery .gallery-grid');
    if (!target) return;
    target.querySelectorAll('[data-cms-added-gallery]').forEach(x=>x.remove());
    for (const row of rows) {
      if (!safeUrl(row.image_url)) continue;
      const button=el('button','gallery-item cms-added-gallery');button.type='button';
      button.dataset.cmsAddedGallery='';
      button.dataset.image=row.image_url;
      button.dataset.captionSi=row.caption_si || '';
      button.dataset.captionEn=row.caption_en || '';
      button.dataset.captionTa=row.caption_ta || '';
      const img=el('img','');img.src=row.image_url;img.alt=row.caption_si||'Gallery';img.loading='lazy';
      const overlay=el('span','gallery-overlay',row.caption_si||'Gallery');
      button.append(img,overlay);
      button.addEventListener('click',()=>{
        const dialog=document.getElementById('gallery-dialog');
        document.getElementById('gallery-large').src=row.image_url;
        document.getElementById('gallery-caption').textContent=row[`caption_${currentLanguage}`] || row.caption_si;
        document.getElementById('gallery-open-original').href=row.image_url;
        if (dialog?.showModal) dialog.showModal();
      });
      target.append(button);
    }
  }
  function findHashArticle() {
    const m=location.hash.match(/^#article-([0-9a-f-]{36})$/);
    if (m) openArticle(m[1]);
  }
  document.addEventListener('vidya:language',e=>{
    currentLanguage=e.detail.language;
    renderNews();
  });
  async function init() {
    // Independent calls: even if one fails, the rest still work.
    const tasks=[
      get('cms_text','select=content_key,si,en,ta&limit=500').then(renderPageOverrides),
      get('cms_media','select=content_key,url&limit=200').then(renderMedia),
      get('cms_timeline','select=year,payload&limit=30').then(rows=>{
        if (window.VIDYA_APPLY_TIMELINE) window.VIDYA_APPLY_TIMELINE(Object.fromEntries(rows.map(r=>[r.year,r.payload])));
      }),
      get('cms_gallery','select=*&order=sort_order.asc,created_at.desc&limit=100').then(renderGallery),
      get('cms_news','select=*&status=eq.published&order=featured.desc,published_at.desc&limit=100').then(rows=>{
        news=rows;renderNews();findHashArticle();
      })
    ];
    await Promise.allSettled(tasks);
  }
  window.addEventListener('hashchange',findHashArticle);
  init();
})();
