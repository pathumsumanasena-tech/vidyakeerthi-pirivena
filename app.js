(() => {
  'use strict';

  let language = 'si';
  const languageButtons = [...document.querySelectorAll('.lang-option')];
  const tamilTranslations = window.VIDYA_TAMIL || {};
  const menuButton = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  const header = document.querySelector('.site-header');

  const milestones = {
    '1959': {
      index: '01 / THE FOUNDATION', tag: '25 JULY 1959', image: 'assets/founder.jpg',
      altSi: 'විද්‍යාකීර්ති පිරිවෙනේ ආරම්භක ගුරු පරපුර නියෝජනය කරන ඓතිහාසික ඡායාරූපයක්', altEn: 'Archival photograph of a monk from the founding generation',
      si: ['විද්‍යාකීර්ති පිරිවෙනේ ආරම්භය', '1959 ජූලි මස 25 වැනිදා තිස්සපෑල පින්බිමේ පිරිවෙන ආරම්භ විය. ආදි කර්තෘ ස්වාමීන් වහන්සේලාගේ සහ ගිහි පැවිදි දායකයන්ගේ කැපවීමෙන් ධර්ම ශාස්ත්‍රීය අධ්‍යාපනයේ නව පරිච්ඡේදයක් ඇරඹුණි.'],
      en: ['The founding of Vidyakeerthi', 'On 25 July 1959, the pirivena was established in Tissapela. The dedication of its founding monks and lay supporters began a new chapter in Buddhist and classical education.'],
      ta: ['வித்யாகீர்த்தி பிரிவெனாவின் தொடக்கம்', '1959 ஜூலை 25 அன்று திஸ்ஸபேலவில் இப்பிரிவெனா நிறுவப்பட்டது. நிறுவனர் பிக்குகள் மற்றும் பொதுமக்களின் அர்ப்பணிப்புடன் பௌத்த, சாஸ்திரக் கல்வியில் புதிய அத்தியாயம் தொடங்கியது.']
    },
    '1980': {
      index: '02 / AN IMPORTANT MILESTONE', tag: '17 JULY 1980', image: 'assets/elder-monk.jpg',
      altSi: 'විද්‍යාකීර්ති පිරිවෙනේ ආදී ගුරු පරපුරේ ස්වාමීන් වහන්සේ නමක්', altEn: 'Archival portrait of a senior monk',
      si: ['මහා පිරිවෙනක් ලෙස උසස්වීම', 'අධ්‍යාපනික මෙහෙවරේ වැදගත් සන්ධිස්ථානයක් සනිටුහන් කරමින් 1980 ජූලි මස 17 වැනිදා විද්‍යාකීර්ති පිරිවෙන මහා පිරිවෙනක් බවට උසස් විය. එය අඛණ්ඩව වැඩුණු ශාස්ත්‍රීය සේවාවට ලැබුණු විශේෂ පිළිගැනීමකි.'],
      en: ['Recognition as a Maha Pirivena', 'On 17 July 1980, Vidyakeerthi was elevated to the status of Maha Pirivena — an important milestone acknowledging its growing educational mission.'],
      ta: ['மகா பிரிவெனாவாக உயர்வு', '1980 ஜூலை 17 அன்று வித்யாகீர்த்தி பிரிவெனா மகா பிரிவெனா என்ற நிலைக்கு உயர்த்தப்பட்டது. கல்விப் பணியின் வளர்ச்சியை அங்கீகரித்த முக்கியமான வரலாற்றுத் தருணமாக இது அமைந்தது.']
    },
    '2009': {
      index: '03 / GOLDEN JUBILEE', tag: '50 YEARS · 2009', image: 'assets/leader-one.jpg',
      altSi: '67 වන සංවත්සර ලේඛනයට සුබ පැතුම් එක් කළ ස්වාමීන් වහන්සේ නමක්', altEn: 'Portrait of a senior monk featured in the commemorative publication',
      si: ['ස්වර්ණ ජයන්තියෙන් නව අභිමානයක්', '1959 ආරම්භ වූ සේවාව වසර 50ක් සපිරූ 2009 දී ස්වර්ණ ජයන්තිය සැමරූ අතර, එම ශාස්ත්‍රීය හා ශාසනික උරුමය සංවත්සර ලේඛන තුළ ද සටහන් විය.'],
      en: ['Celebrating the golden jubilee', 'The year 2009 marked 50 years since the founding of the pirivena. Its golden jubilee celebrated the institution’s scholarly and religious heritage.'],
      ta: ['பொன்விழா கொண்டாட்டம்', '1959 ஆம் ஆண்டு தொடங்கிய சேவை 50 ஆண்டுகளை நிறைவு செய்த 2009 இல் பொன்விழா கொண்டாடப்பட்டது. அந்நிறுவனத்தின் கல்வி மற்றும் சமய மரபு நினைவு ஆவணங்களிலும் பதிவு செய்யப்பட்டது.']
    },
    '2012': {
      index: '04 / SCHOLARLY CONTINUITY', tag: 'SCHOLARSHIP · 2012', image: 'assets/leader-two.jpg',
      altSi: 'සංවත්සර ලේඛනයේ සඳහන් පිරිවෙන් අධ්‍යාපනික නායක ස්වාමීන් වහන්සේ නමක්', altEn: 'Monastic educator pictured in the commemorative publication',
      si: ['ශාස්ත්‍රීය ගමනේ තවත් පරිච්ඡේදයක්', '2012 වසරේ ශාස්ත්‍රීය ප්‍රකාශන සහ පිරිවෙන් සේවා ඇගයීම් හරහා විද්‍යාකීර්ති පිරිවෙනේ අධ්‍යාපනික හා සම්ප්‍රදායික මෙහෙවර තවදුරටත් සනිටුහන් විය.'],
      en: ['Another chapter in scholarship', 'Scholarly publications and recognition during 2012 added another chapter to the pirivena’s educational and cultural contributions.'],
      ta: ['கல்விப் பயணத்தின் மற்றொரு அத்தியாயம்', '2012 ஆம் ஆண்டில் வெளியான கல்விசார் படைப்புகளும் பிரிவெனாவின் சேவைக்குக் கிடைத்த பாராட்டுகளும் அதன் கல்வி மற்றும் பண்பாட்டுப் பங்களிப்பை மேலும் உறுதிப்படுத்தின.']
    },
    '2026': {
      index: '05 / THE LEGACY CONTINUES', tag: '67 YEARS · 2026', image: 'assets/2026-results.jpg',
      altSi: '2026 වසරේ විද්‍යාකීර්ති දහම් පාසල් ජයග්‍රහණ පෝස්ටරය', altEn: '2026 Dhamma-school student achievements poster',
      si: ['අභිමානවත් 67 වැනි සංවත්සරය', '2026 ජූලි මස 25 වැනිදාට වසර 67ක් සම්පූර්ණ කළ විද්‍යාකීර්ති මහා පිරිවෙන, ශිෂ්‍ය ජයග්‍රහණ, ආගමික හා සමාජ සත්කාර සහ අනාගත සැලසුම් සමඟ නව පරපුරකට සිය උරුමය පවරයි.'],
      en: ['67 years of Vidyakeerthi', 'On 25 July 2026, Vidyakeerthi Maha Pirivena completed 67 years, looking ahead through student achievements, religious and community service, and plans for the future.'],
      ta: ['பெருமைமிகு 67ஆம் ஆண்டு நிறைவு', '2026 ஜூலை 25 அன்று வித்யாகீர்த்தி மகா பிரிவெனா 67 ஆண்டுகளை நிறைவு செய்தது. மாணவர்களின் சாதனைகள், சமய மற்றும் சமூகச் சேவைகள், எதிர்காலத் திட்டங்கள் ஆகியவற்றுடன் தனது மரபை அடுத்த தலைமுறைக்குக் கொண்டு செல்கிறது.']
    }
  };

  const timelineButtons = [...document.querySelectorAll('.timeline-step')];
  let currentYear = '1959';
  function renderMilestone(year) {
    const item = milestones[year];
    if (!item) return;
    currentYear = year;
    timelineButtons.forEach(button => {
      const selected = button.dataset.year === year;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    document.getElementById('timeline-overline').textContent = item.index;
    document.getElementById('timeline-year').textContent = year;
    document.getElementById('timeline-heading').textContent = item[language][0];
    document.getElementById('timeline-description').textContent = item[language][1];
    document.getElementById('timeline-tag').textContent = item.tag;
    const timelineImage = document.getElementById('timeline-image');
    timelineImage.src = item.image;
    timelineImage.alt = language === 'si' ? item.altSi : item.altEn;
    document.getElementById('timeline-art-note').textContent = `VIDYAKEERTHI / ${year}`;
    const textPanel = document.querySelector('.timeline-text');
    textPanel.style.animation = 'none';
    // Restart the tiny content transition without shifting the page layout.
    void textPanel.offsetWidth;
    textPanel.style.animation = '';
  }
  timelineButtons.forEach((button, index) => {
    button.addEventListener('click', () => renderMilestone(button.dataset.year));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = timelineButtons.length - 1;
      else next = (index + (event.key === 'ArrowRight' ? 1 : -1) + timelineButtons.length) % timelineButtons.length;
      timelineButtons[next].focus();
      renderMilestone(timelineButtons[next].dataset.year);
    });
  });

  function updateLanguage() {
    document.documentElement.lang = language;
    document.body.classList.toggle('lang-en', language === 'en');
    document.body.classList.toggle('lang-ta', language === 'ta');
    document.querySelectorAll('[data-si][data-en]').forEach(element => {
      element.textContent = language === 'ta'
        ? (tamilTranslations[element.dataset.si] || element.dataset.si)
        : element.dataset[language];
    });
    languageButtons.forEach(button => {
      const selected = button.dataset.lang === language;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    document.title = language === 'si'
      ? 'විද්‍යාකීර්ති මහා පිරිවෙන | තිස්සපෑල'
      : language === 'ta'
        ? 'வித்யாகீர்த்தி மகா பிரிவெனா | திஸ்ஸபேல'
        : 'Vidyakeerthi Maha Pirivena | Tissapela';
    renderMilestone(currentYear);
  }
  languageButtons.forEach(button => button.addEventListener('click', () => {
    language = button.dataset.lang;
    updateLanguage();
  }));

  function closeMenu() {
    navLinks.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
  }
  menuButton.addEventListener('click', () => {
    const willOpen = !navLinks.classList.contains('is-open');
    navLinks.classList.toggle('is-open', willOpen);
    menuButton.setAttribute('aria-expanded', String(willOpen));
    menuButton.setAttribute('aria-label', willOpen ? 'Close navigation' : 'Open navigation');
  });
  document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => {
    if (!navLinks.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

  function updateHeader() { header.classList.toggle('scrolled', window.scrollY > 35); }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const sections = [...document.querySelectorAll('main section[id]')];
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      }
    }, { threshold: .08, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));

    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        document.querySelectorAll('[data-nav]').forEach(link => {
          link.classList.toggle('active', link.dataset.nav === entry.target.id);
        });
      });
    }, { rootMargin: '-24% 0px -58% 0px' });
    sections.forEach(section => navObserver.observe(section));
  } else {
    document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible'));
  }

  const photoDialog = document.getElementById('gallery-dialog');
  const photoImage = document.getElementById('gallery-large');
  const photoCaption = document.getElementById('gallery-caption');
  const fullSizeLink = document.getElementById('gallery-open-original');
  document.querySelectorAll('.gallery-item').forEach(button => {
    button.addEventListener('click', () => {
      photoImage.src = button.dataset.image;
      photoImage.alt = button.querySelector('img')?.alt ?? '';
      fullSizeLink.href = button.dataset.image;
      photoCaption.textContent = language === 'si'
        ? button.dataset.captionSi
        : language === 'ta'
          ? (tamilTranslations[button.dataset.captionSi] || button.dataset.captionSi)
          : button.dataset.captionEn;
      if (typeof photoDialog.showModal === 'function') photoDialog.showModal();
      else window.open(button.dataset.image, '_blank', 'noopener');
    });
  });
  document.getElementById('gallery-close').addEventListener('click', () => photoDialog.close());
  photoDialog.addEventListener('click', event => {
    if (event.target === photoDialog) photoDialog.close();
  });
  photoDialog.addEventListener('close', () => { photoImage.removeAttribute('src'); });
  updateLanguage();
})();
