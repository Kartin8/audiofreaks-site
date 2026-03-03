'use strict';

(function() {
  var dateInput = document.getElementById('event-date');
  if (dateInput) {
    var today = new Date().toISOString().split('T')[0];
    var maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);
    dateInput.min = today;
    dateInput.max = maxDate.toISOString().split('T')[0];
    
    dateInput.addEventListener('change', function() {
      var selected = new Date(this.value);
      var now = new Date();
      now.setHours(0, 0, 0, 0);
      if (selected < now) {
        this.value = today;
      }
    });
  }
})();

var SLIDE_W = 320, SLIDE_G = 16, VIDEO_W = 326, VIDEO_G = 16;

var uaToastTimer   = null;
var currentLang    = localStorage.getItem('af-lang') || detectBrowserLang();
var lbImages       = [];
var lbIndex        = 0;
var videoCarIdx    = 0;
var pendingEvIndex = null;
var carState       = { karaoke: 0, live: 0, wesela: 0 };

var SVG_ICONS = {
  mic: '<svg class="icon-svg icon-large" viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>',
  ring: '<svg class="icon-svg icon-large" viewBox="0 0 24 24"><circle cx="12" cy="11" r="8"/><circle cx="12" cy="11" r="2"/><path d="M12 3V1"/></svg>',
  guitar: '<svg class="icon-svg icon-large" viewBox="0 0 24 24"><path d="m16 2-2 2 7 7-2 2"/><path d="m9 18 5-5"/><path d="M2 22s.5-5.5 5-10l4 4c-4.5 4.5-10 5-10 5Z"/><circle cx="8.5" cy="15.5" r="1.5"/></svg>',
  podcast: '<svg class="icon-svg icon-large" viewBox="0 0 24 24"><path d="M12 8a2 2 0 0 0-2 2v4a2 2 0 1 0 4 0v-4a2 2 0 0 0-2-2Z"/><path d="M2 10v3a10 10 0 0 0 20 0v-3"/><path d="M12 19v3"/></svg>',
  speaker: '<svg class="icon-svg icon-large" viewBox="0 0 24 24"><rect width="16" height="20" x="4" y="2" rx="2"/><circle cx="12" cy="14" r="3"/><line x1="12" x2="12.01" y1="7" y2="7"/></svg>',
  party: '<svg class="icon-svg icon-large" viewBox="0 0 24 24"><path d="M14 21h7V4a2 2 0 0 0-2-2h-7"/><path d="M10 2H3a2 2 0 0 0-2 2v17h7"/><path d="M10 7H5"/><path d="M10 11H5"/><path d="M10 15H5"/><path d="M19 7h-1"/><path d="M19 11h-1"/><path d="M19 15h-1"/><path d="M10 2v19"/></svg>',
  laptop: '<svg class="icon-svg icon-large" viewBox="0 0 24 24"><rect width="18" height="12" x="3" y="4" rx="2"/><line x1="2" x2="22" y1="20" y2="20"/></svg>',
  list: '<svg class="icon-svg icon-large" viewBox="0 0 24 24"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>'
};

var PRICE_DATA = {
  p1: { icon: SVG_ICONS.mic, nameKey:'p1_name', descKey:'p1_desc' },
  p2: { icon: SVG_ICONS.ring, nameKey:'p2_name', descKey:'p2_desc' },
  p3: { icon: SVG_ICONS.guitar, nameKey:'p3_name', descKey:'p3_desc' },
};

var CARD_ICONS = { 
  s1: SVG_ICONS.mic, s2: SVG_ICONS.ring, s3: SVG_ICONS.guitar, 
  s4: SVG_ICONS.podcast, s5: SVG_ICONS.speaker, s6: SVG_ICONS.party, 
  vf1: SVG_ICONS.speaker, vf2: SVG_ICONS.laptop, vf3: SVG_ICONS.mic, vf4: SVG_ICONS.list 
};

var CARD_KEYS  = {
  s1:{title:'s1_title',desc:'s1_desc'}, s2:{title:'s2_title',desc:'s2_desc'},
  s3:{title:'s3_title',desc:'s3_desc'}, s4:{title:'s4_title',desc:'s4_desc'},
  s5:{title:'s5_title',desc:'s5_desc'}, s6:{title:'s6_title',desc:'s6_desc'},
  vf1:{title:'vf1_title',desc:'vf1_desc'}, vf2:{title:'vf2_title',desc:'vf2_desc'},
  vf3:{title:'vf3_title',desc:'vf3_desc'}, vf4:{title:'vf4_title',desc:'vf4_desc'},
};


function detectBrowserLang() {
  var r = (navigator.language || 'pl').toLowerCase();
  if (r.startsWith('uk') || r.startsWith('ua')) return 'ua';
  if (r.startsWith('en')) return 'en';
  return 'pl';
}

function showUaToast() {
  var t = document.getElementById('ua-toast');
  if (!t) return;
  t.classList.add('show');
  clearTimeout(uaToastTimer);
  uaToastTimer = setTimeout(closeUaToast, 7000);
}

function closeUaToast() {
  clearTimeout(uaToastTimer);
  var t = document.getElementById('ua-toast');
  if (t) t.classList.remove('show');
}

function applyLang(lang) {
  if (!T[lang]) lang = 'pl';
  currentLang = lang;
  localStorage.setItem('af-lang', lang);
  document.documentElement.lang = lang === 'ua' ? 'uk' : lang;

  var t = T[lang];

  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var k = el.getAttribute('data-i18n');
    if (t[k] !== undefined) el.innerHTML = t[k];
  });

  document.querySelectorAll('[data-i18n-ph]').forEach(function(el) {
    var k = el.getAttribute('data-i18n-ph');
    if (t[k] !== undefined) el.placeholder = t[k];
  });

  document.querySelectorAll('.lang-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.lang === lang);
  });

  var mobileSelect = document.getElementById('mobileLangInline');
  if (mobileSelect) mobileSelect.value = lang;

  var un = document.getElementById('uaContactNotice');
  if (un) un.style.display = (lang === 'ua') ? 'flex' : 'none';

  clearTimeout(uaToastTimer);
  var toast = document.getElementById('ua-toast');
  if (toast) {
    if (lang === 'ua') {
      toast.style.display = 'flex';
      setTimeout(function() { toast.classList.add('show'); }, 10);
      if (!sessionStorage.getItem('ua-toast-shown')) {
        sessionStorage.setItem('ua-toast-shown', '1');
        clearTimeout(uaToastTimer);
        uaToastTimer = setTimeout(closeUaToast, 7000);
      }
    } else {
      toast.classList.remove('show');
      toast.style.display = 'none';
    }
  }
}

var htmlEl      = document.documentElement;
var themeToggle = document.getElementById('themeToggle');
var themeIcon   = themeToggle.querySelector('.theme-icon');

var ICON_SUN  = '<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
var ICON_MOON = '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';

function setTheme(t) {
  htmlEl.setAttribute('data-theme', t);
  themeIcon.innerHTML = t === 'dark' ? ICON_SUN : ICON_MOON;
  localStorage.setItem('af-theme', t);
  
  var mainLogo = document.getElementById('mainLogo');
  if (mainLogo) {
    mainLogo.src = t === 'dark' ? 'assets/images/logo_big.png' : 'assets/images/logo_big_dark.png';
  }
}

(function initTheme() {
  var saved = localStorage.getItem('af-theme');
  setTheme(saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
})();

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
  if (!localStorage.getItem('af-theme')) setTheme(e.matches ? 'dark' : 'light');
});

themeToggle.addEventListener('click', function() {
  setTheme(htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

function slide(id, dir) {
  var track   = document.getElementById('track-' + id);
  if (!track) return;
  var slides  = track.querySelectorAll('.c-slide');
  var vpWidth = track.parentElement.offsetWidth;
  var visible = Math.max(1, Math.floor(vpWidth / (SLIDE_W + SLIDE_G)));
  var max     = Math.max(0, slides.length - visible);
  carState[id] = Math.min(Math.max(carState[id] + dir, 0), max);
  track.style.transform = 'translateX(-' + (carState[id] * (SLIDE_W + SLIDE_G)) + 'px)';
}

document.querySelectorAll('.carousel-viewport').forEach(function(vp) {
  if (vp.id === 'video-viewport') return;
  var sx = 0;
  vp.addEventListener('touchstart', function(e) { sx = e.touches[0].clientX; }, { passive: true });
  vp.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) < 50) return;
    var trackId = vp.querySelector('.carousel-track').id.replace('track-', '');
    slide(trackId, dx < 0 ? 1 : -1);
  }, { passive: true });
});

function slideVideo(dir) {
  var track = document.getElementById('track-video');
  var vp    = document.getElementById('video-viewport');
  if (!track || !vp) return;
  var slides  = track.querySelectorAll('.v-slide');
  var visible = Math.max(1, Math.floor(vp.offsetWidth / (VIDEO_W + VIDEO_G)));
  var max     = Math.max(0, slides.length - visible);
  videoCarIdx = Math.min(Math.max(videoCarIdx + dir, 0), max);
  track.style.transform = 'translateX(-' + (videoCarIdx * (VIDEO_W + VIDEO_G)) + 'px)';
}

var lbTouchStartX = 0;
var lbCurrentTranslate = 0;
var lbIsDragging = false;
var lbTrack = null;
var lbViewport = null;

function imgError(img) {
  var sl = img.closest('.c-slide');
  if (!sl) return;

  img.style.display = 'none';
  sl.classList.add('no-photo');
  sl.onclick = null;

  var emptyMsg = T[currentLang].gallery_empty || 'Wkrótce nowe zdjęcia :)';

sl.innerHTML = `
    <svg class="no-photo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <circle cx="9" cy="9" r="2"/>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
    <div class="no-photo-text">${emptyMsg}</div>
  `;
}

function openLightbox(el) {
  var track = el.closest('.carousel-track');
  if (!track) return;
  
  var imgs = Array.from(track.querySelectorAll('.c-slide:not(.no-photo) img'));
  if (!imgs.length) return;
  
  lbImages = imgs.map(function(i) { return i.src; });
  var clImg = el.querySelector('img');
  lbIndex = clImg ? imgs.indexOf(clImg) : 0;
  if (lbIndex < 0) lbIndex = 0;
  
  lbTrack = document.getElementById('lb-track');
  lbViewport = document.getElementById('lb-viewport');
  
  if (lbTrack) {
    lbTrack.innerHTML = '';
    lbImages.forEach(function(src) {
      var imgEl = document.createElement('img');
      imgEl.src = src;
      lbTrack.appendChild(imgEl);
    });
    lbTrack.classList.remove('is-animating');
    updateLbPosition();
  }
  
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
  
  initLightboxTouch();
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow = '';
}

document.getElementById('lightbox').addEventListener('click', function(e) {
  if (
    e.target === this || 
    e.target.classList.contains('lb-backdrop') || 
    e.target.classList.contains('lb-viewport') ||
    e.target.tagName === 'IMG'
  ) {
    closeLightbox();
  }
});

function closeLocModal(e) {
  if (e) {
    var isOverlayClick = e.target === e.currentTarget || e.target.id === 'loc-modal';
    var isCloseBtnClick = !!e.target.closest('.card-modal-close');
    
    if (!isOverlayClick && !isCloseBtnClick) {
      return;
    }
  }
  
  var modal = document.getElementById('loc-modal');
  if (modal) {
    modal.classList.remove('active');
  }
  
  var iframe = document.getElementById('lm-iframe');
  if (iframe) {
    iframe.src = '';
  }
  
  document.body.style.overflow = '';
}

function closePriceModal(e) {
  if (e) {
    var isOverlayClick = e.target === e.currentTarget || e.target.id === 'price-modal';
    var isCloseBtnClick = !!e.target.closest('.card-modal-close');
    
    if (!isOverlayClick && !isCloseBtnClick) {
      return;
    }
  }
  
  var modal = document.getElementById('price-modal');
  if (modal) {
    modal.classList.remove('active');
  }
  
  document.body.style.overflow = '';
}

function updateLbPosition() {
  if (!lbTrack) return;
  lbCurrentTranslate = -100 * lbIndex;
  lbTrack.style.transform = 'translateX(' + lbCurrentTranslate + '%)';
}

function lbNav(e, dir) {
  if (e && e.stopPropagation) e.stopPropagation();
  lbIndex = (lbIndex + dir + lbImages.length) % lbImages.length;
  if (lbTrack) {
    lbTrack.classList.add('is-animating');
    updateLbPosition();
  }
}

function initLightboxTouch() {
  if (!lbViewport || lbViewport.dataset.touchBound) return;
  lbViewport.dataset.touchBound = "true";

  lbViewport.addEventListener('touchstart', function(e) {
    if (e.target.closest('.lb-prev') || e.target.closest('.lb-next') || e.target.closest('.lb-close')) return;
    
    lbIsDragging = true;
    lbTouchStartX = e.touches[0].clientX;
    lbTrack.classList.remove('is-animating');
  }, { passive: true });

  lbViewport.addEventListener('touchmove', function(e) {
    if (!lbIsDragging) return;
    var currentX = e.touches[0].clientX;
    var diffX = currentX - lbTouchStartX;
    
    var diffPercent = (diffX / window.innerWidth) * 100;
    var newTranslate = (-100 * lbIndex) + diffPercent;
    
    lbTrack.style.transform = 'translateX(' + newTranslate + '%)';
  }, { passive: true });

  lbViewport.addEventListener('touchend', function(e) {
    if (!lbIsDragging) return;
    lbIsDragging = false;
    
    var diffX = e.changedTouches[0].clientX - lbTouchStartX;
    
    lbTrack.classList.add('is-animating');
    
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length;
      } else {
        lbIndex = (lbIndex + 1) % lbImages.length;
      }
    }
    
    updateLbPosition();
  }, { passive: true });
}

function openCardModal(key) {
  var t = T[currentLang];
  var k = CARD_KEYS[key];
  if (!k) return;
  
  document.getElementById('modal-icon').innerHTML  = CARD_ICONS[key] || '';
  document.getElementById('modal-title').innerHTML = t[k.title] || '';
  document.getElementById('modal-desc').textContent= t[k.desc]  || '';
  
  document.getElementById('card-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCardModal(e) {
  if (e) {
    var isOverlayClick = e.target === e.currentTarget || e.target.id === 'card-modal';
    var isCloseBtnClick = !!e.target.closest('.card-modal-close');
    
    if (!isOverlayClick && !isCloseBtnClick) {
      return;
    }
  }
  
  var modal = document.getElementById('card-modal');
  if (modal) {
    modal.classList.remove('active');
  }
  document.body.style.overflow = '';
}

function openPriceModal(key, evIndex) {
  var t  = T[currentLang];
  var pd = PRICE_DATA[key];
  if (!pd) return;
  
  pendingEvIndex = evIndex;
  document.getElementById('pm-icon').innerHTML    = pd.icon;
  document.getElementById('pm-title').innerHTML   = t[pd.nameKey] || '';
  document.getElementById('pm-desc').textContent  = t[pd.descKey] || '';
  
  document.getElementById('price-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function goToContactWithEvent(evIndex) {
  var idx = (evIndex !== undefined) ? evIndex : pendingEvIndex;
  document.getElementById('price-modal').classList.remove('active');
  document.body.style.overflow = '';
  document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
  if (idx !== null && idx !== undefined) {
    setTimeout(function() {
      var sel = document.getElementById('event-select');
      if (sel) {
        var opts = sel.options;
        for (var i = 0; i < opts.length; i++) {
          if (String(i) === String(idx) || opts[i].value === String(idx)) {
            sel.selectedIndex = i;
            break;
          }
        }
      }
    }, 450);
  }
}

function openLocModal(card) {
  var t = T[currentLang];
  document.getElementById('lm-num').textContent     = card.dataset.locNum || '';
  document.getElementById('lm-name').textContent    = card.dataset.locName || '';
  document.getElementById('lm-address').textContent = card.dataset.locAddress || '';
  document.getElementById('lm-type').innerHTML      = t[card.dataset.locTypeKey] || '';
  document.getElementById('lm-link').href           = card.dataset.locGmaps || '#';
  document.getElementById('lm-iframe').src          = card.dataset.locMaps || '';
  document.getElementById('loc-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('[data-modal-key]').forEach(function(c) {
    c.style.cursor = 'pointer';
    c.addEventListener('click', function() { openCardModal(c.getAttribute('data-modal-key')); });
  });

  document.querySelectorAll('.pricelist-row[data-modal-price]').forEach(function(row) {
    row.style.cursor = 'pointer';
    row.addEventListener('click', function(e) {
      if (e.target.closest('.pl-want-btn')) return;
      openPriceModal(row.getAttribute('data-modal-price'), parseInt(row.getAttribute('data-ev-index'), 10));
    });
    var wb = row.querySelector('.pl-want-btn');
    if (wb) wb.addEventListener('click', function(e) {
      e.stopPropagation();
      goToContactWithEvent(parseInt(row.getAttribute('data-ev-index'), 10));
    });
  });

  document.querySelectorAll('.location-card[data-loc-name]').forEach(function(c) {
    c.style.cursor = 'pointer';
    c.addEventListener('click', function() { openLocModal(c); });
  });

  applyLang(currentLang);
});

  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      applyLang(btn.getAttribute('data-lang'));
    });
  });

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (document.getElementById('lightbox').classList.contains('active')) { closeLightbox(); return; }
    if (document.getElementById('card-modal').classList.contains('active')) {
      document.getElementById('card-modal').classList.remove('active');
      document.body.style.overflow = ''; return;
    }
    if (document.getElementById('price-modal').classList.contains('active')) {
      document.getElementById('price-modal').classList.remove('active');
      document.body.style.overflow = ''; return;
    }
    if (document.getElementById('loc-modal').classList.contains('active')) {
      document.getElementById('lm-iframe').src = '';
      document.getElementById('loc-modal').classList.remove('active');
      document.body.style.overflow = ''; return;
    }
  }
  if (document.getElementById('lightbox').classList.contains('active')) {
    if (e.key === 'ArrowRight') lbNav({ stopPropagation: function(){} }, 1);
    if (e.key === 'ArrowLeft')  lbNav({ stopPropagation: function(){} }, -1);
  }
});

function handleSubmit(e) {
  e.preventDefault();
  var form    = e.target;
  var btn     = document.getElementById('submit-btn');
  var msgOk   = document.getElementById('form-msg');
  var msgErr  = document.getElementById('form-err');

  msgOk.style.display  = 'none';
  msgErr.style.display = 'none';

  btn.disabled    = true;
  btn.textContent = currentLang === 'pl' ? '⏳ Wysyłanie...' : (currentLang === 'ua' ? '⏳ Надсилаємо...' : '⏳ Sending...');

  var data = new FormData(form);

  fetch(form.action, {
    method:  'POST',
    body:    data,
    headers: { 'Accept': 'application/json' }
  })
  .then(function(res) {
    btn.disabled    = false;
    btn.textContent = T[currentLang].form_submit || 'Wyślij zapytanie';
    
    if (res.ok) {
      msgOk.style.display = 'block';
      form.reset();
      setTimeout(function() { msgOk.style.display = 'none'; }, 6000);
    } else {
      msgErr.style.display = 'block';
      setTimeout(function() { msgErr.style.display = 'none'; }, 8000);
    }
  })
  .catch(function() {
    btn.disabled    = false;
    btn.textContent = T[currentLang].form_submit || 'Wyślij zapytanie';
    msgErr.style.display = 'block';
    setTimeout(function() { msgErr.style.display = 'none'; }, 8000);
  });
}

var revealObs = new IntersectionObserver(function(entries) {
  entries.forEach(function(en) {
    if (en.isIntersecting) {
      en.target.classList.add('visible');
      revealObs.unobserve(en.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(function(el) { revealObs.observe(el); });

document.querySelectorAll('.card-modal-close').forEach(function(btn) {
  btn.addEventListener('touchend', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var overlay = btn.closest('.card-modal-overlay');
    if (!overlay) return;
    var id = overlay.id;
    if (id === 'card-modal') {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    } else if (id === 'price-modal') {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    } else if (id === 'loc-modal') {
      var iframe = document.getElementById('lm-iframe');
      if (iframe) iframe.src = '';
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }, { passive: false });
});

(function() {
  var vvp = document.getElementById('video-viewport');
  if (!vvp) return;
  var vsx = 0;
  vvp.addEventListener('touchstart', function(e) {
    vsx = e.touches[0].clientX;
  }, { passive: true });
  vvp.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - vsx;
    if (Math.abs(dx) < 45) return;
    slideVideo(dx < 0 ? 1 : -1);
  }, { passive: true });
})();

(function() {
  var eu = 'xinorus32';
  var ed = 'gmail' + '.' + 'com';
  var email = eu + '@' + ed;

  var emailLink    = document.getElementById('email-link');
  var emailDisplay = document.getElementById('email-display');
  var errEmail     = document.getElementById('err-email');

  if (emailLink)    emailLink.addEventListener('click', function(e) { e.preventDefault(); window.location.href = 'mailto:' + email; });
  if (emailDisplay) emailDisplay.textContent = email;
  if (errEmail)     errEmail.textContent = email;

  var mobileEmailLink = document.getElementById('mobile-email-link');
  if (mobileEmailLink) {
    mobileEmailLink.textContent = email;
    mobileEmailLink.addEventListener('click', function(e) { e.preventDefault(); window.location.href = 'mailto:' + email; });
  }

  var p1 = '+48', p2 = '511', p3 = '785', p4 = '481';
  var phone    = p1 + ' ' + p2 + ' ' + p3 + ' ' + p4;
  var phoneTel = p1 + p2 + p3 + p4;

  var phoneLink    = document.getElementById('phone-link');
  var phoneDisplay = document.getElementById('phone-display');

  if (phoneLink)    phoneLink.addEventListener('click', function(e) { e.preventDefault(); window.location.href = 'tel:' + phoneTel; });
  if (phoneDisplay) phoneDisplay.textContent = phone;
})();


(function() {
  var bnItems = document.querySelectorAll('.bn-item[data-section]');
  if (!bnItems.length) return;

  var sections = [];
  bnItems.forEach(function(item) {
    var sec = document.getElementById(item.dataset.section);
    if (sec) sections.push({ el: sec, item: item });
  });

  var activeItem = null;

  function setActive(item) {
    if (activeItem === item) return;
    if (activeItem) activeItem.classList.remove('active');
    activeItem = item;
    if (activeItem) activeItem.classList.add('active');
  }

  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var found = sections.find(function(s) { return s.el === entry.target; });
        if (found) setActive(found.item);
      }
    });
  }, {
    rootMargin: '-20% 0px -75% 0px',
    threshold: 0
  });

  sections.forEach(function(s) { obs.observe(s.el); });
})();