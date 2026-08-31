(function(){
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------------- NAV ---------------- */
  var nav = document.getElementById('nav');
  function onScrollNav(){
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive:true });

  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobileMenu');
  hamburger.addEventListener('click', function(){
    var open = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  mobileMenu.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded','false');
    });
  });

  /* ---------------- HERO TEXT REVEAL ON SCROLL ---------------- */
  var heroContent = document.getElementById('heroContent');
  var hero = document.querySelector('.hero');

  function easeInOutSine(t){
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  function updateHero(){
    if (!hero) return;
    var h = hero.offsetHeight;
    var threshold = Math.min(h * 0.95, 680);
    var t = Math.max(0, Math.min(1, window.scrollY / threshold));
    var eased = easeInOutSine(t);
    var translate = 34 * (1 - eased);
    var scale = 0.96 + 0.04 * eased;
    heroContent.style.opacity = eased;
    heroContent.style.transform = 'translateY(' + translate + 'px) scale(' + scale + ')';
  }
  if (reduceMotion){
    heroContent.style.opacity = 1;
    heroContent.style.transform = 'none';
  } else {
    updateHero();
    window.addEventListener('scroll', function(){ requestAnimationFrame(updateHero); }, { passive:true });
  }

  /* subtle mouse parallax on hero scene */
  var heroScene = document.getElementById('heroScene');
  if (canHover && !reduceMotion && heroScene){
    hero.addEventListener('mousemove', function(e){
      var rect = hero.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      heroScene.style.transform = 'translate(' + (x * 14) + 'px,' + (y * 10) + 'px) scale(1.03)';
    });
    hero.addEventListener('mouseleave', function(){
      heroScene.style.transform = 'translate(0,0) scale(1.03)';
    });
  }

  /* ---------------- SCROLL REVEAL ---------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          var el = entry.target;
          var siblingIndex = Array.prototype.indexOf.call(el.parentElement.children, el);
          var delay = Math.min(siblingIndex, 5) * 90;
          el.style.transitionDelay = reduceMotion ? '0ms' : delay + 'ms';
          el.classList.add('is-visible');
          io.unobserve(el);
        }
      });
    }, { threshold:0.15, rootMargin:'0px 0px -60px 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
  }

  /* ---------------- TILT CARDS ---------------- */
  if (canHover && !reduceMotion){
    document.querySelectorAll('.tilt-card').forEach(function(card){
      var inner = card.querySelector('.tilt-card-inner');
      card.addEventListener('mousemove', function(e){
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transform = 'perspective(1200px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg) translateY(-6px) scale(1.02)';
      });
      card.addEventListener('mouseleave', function(){
        inner.style.transform = 'perspective(1200px) rotateY(0) rotateX(0) translateY(0) scale(1)';
      });
    });
  }

  /* ---------------- BEFORE / AFTER SLIDERS ---------------- */
  document.querySelectorAll('.ba-slider').forEach(function(slider){
    var before = slider.querySelector('.ba-before');
    var line = slider.querySelector('.ba-line');
    var handle = slider.querySelector('.ba-handle');
    var dragging = false;

    function setPos(px){
      var rect = slider.getBoundingClientRect();
      var pct = Math.max(2, Math.min(98, (px / rect.width) * 100));
      before.style.width = pct + '%';
      line.style.left = pct + '%';
      handle.style.left = pct + '%';
      handle.setAttribute('aria-valuenow', Math.round(pct));
    }

    function fromEvent(e){
      var rect = slider.getBoundingClientRect();
      var clientX = (e.touches ? e.touches[0].clientX : e.clientX);
      setPos(clientX - rect.left);
    }

    slider.addEventListener('pointerdown', function(e){
      dragging = true;
      fromEvent(e);
      slider.setPointerCapture && e.pointerId != null && slider.setPointerCapture(e.pointerId);
    });
    slider.addEventListener('pointermove', function(e){ if (dragging) fromEvent(e); });
    window.addEventListener('pointerup', function(){ dragging = false; });

    handle.addEventListener('keydown', function(e){
      var rect = slider.getBoundingClientRect();
      var current = parseFloat(before.style.width) || 50;
      if (e.key === 'ArrowLeft'){ setPos((current - 5) / 100 * rect.width); e.preventDefault(); }
      if (e.key === 'ArrowRight'){ setPos((current + 5) / 100 * rect.width); e.preventDefault(); }
    });

    setPos(slider.getBoundingClientRect().width * 0.5);
  });

  /* ---------------- CALENDAR / BOOKING WIZARD ---------------- */
  var calMonthLabel = document.getElementById('calMonthLabel');
  var calGrid = document.getElementById('calGrid');
  var calPrev = document.getElementById('calPrev');
  var calNext = document.getElementById('calNext');
  var toStep2 = document.getElementById('toStep2');
  var toStep3 = document.getElementById('toStep3');
  var toStep4 = document.getElementById('toStep4');
  var dateHint = document.getElementById('dateHint');

  var monthNames = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  var today = new Date(); today.setHours(0,0,0,0);
  var viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
  var selectedDate = null;
  var selectedTime = null;
  var unavailableDays = [5, 13, 19, 27];

  function sameDay(a,b){ return a && b && a.getTime() === b.getTime(); }

  function renderCalendar(){
    calMonthLabel.textContent = monthNames[viewDate.getMonth()] + ' ' + viewDate.getFullYear();
    calGrid.innerHTML = '';
    var firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    var startOffset = (firstDay.getDay() + 6) % 7; // Monday-first
    var daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 0).getDate();

    for (var i=0;i<startOffset;i++){
      var empty = document.createElement('div');
      empty.className = 'cal-day empty';
      calGrid.appendChild(empty);
    }

    for (var d=1; d<=daysInMonth; d++){
      var thisDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
      var cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cal-day';
      cell.textContent = d;

      var isPast = thisDate < today;
      var isSunday = thisDate.getDay() === 0;
      var isUnavailable = unavailableDays.indexOf(d) !== -1;
      var disabled = isPast || isSunday || isUnavailable;

      if (disabled){
        cell.classList.add('disabled');
        cell.disabled = true;
      } else {
        cell.classList.add('selectable');
        cell.addEventListener('click', function(dt, el){
          return function(){
            selectedDate = dt;
            document.querySelectorAll('.cal-day.selected').forEach(function(x){ x.classList.remove('selected'); });
            el.classList.add('selected');
            dateHint.textContent = dt.toLocaleDateString('de-DE', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
            toStep2.disabled = false;
          };
        }(thisDate, cell));
      }

      if (sameDay(thisDate, today)) cell.classList.add('today');
      if (sameDay(thisDate, selectedDate)) cell.classList.add('selected');

      calGrid.appendChild(cell);
    }
  }
  renderCalendar();

  calPrev.addEventListener('click', function(){
    viewDate.setMonth(viewDate.getMonth()-1);
    renderCalendar();
  });
  calNext.addEventListener('click', function(){
    viewDate.setMonth(viewDate.getMonth()+1);
    renderCalendar();
  });

  /* time chips */
  document.querySelectorAll('.time-chip').forEach(function(chip){
    chip.addEventListener('click', function(){
      document.querySelectorAll('.time-chip').forEach(function(c){ c.classList.remove('selected'); });
      chip.classList.add('selected');
      selectedTime = chip.getAttribute('data-time');
      toStep3.disabled = false;
    });
  });

  var serviceSelect = document.getElementById('serviceSelect');
  serviceSelect.addEventListener('change', function(){
    toStep4.disabled = !serviceSelect.value;
  });

  /* step navigation */
  var steps = document.querySelectorAll('.b-step');
  var panels = document.querySelectorAll('.b-panel');

  function goToStep(n){
    panels.forEach(function(p){ p.classList.toggle('active', p.getAttribute('data-panel') === String(n)); });
    steps.forEach(function(s){
      var sn = parseInt(s.getAttribute('data-step'),10);
      s.classList.toggle('active', sn === n);
      s.classList.toggle('done', sn < n);
    });
    if (n === 4) updateSummary();
  }

  toStep2.addEventListener('click', function(){ goToStep(2); });
  toStep3.addEventListener('click', function(){ goToStep(3); });
  toStep4.addEventListener('click', function(){ goToStep(4); });
  document.querySelectorAll('[data-back]').forEach(function(btn){
    btn.addEventListener('click', function(){ goToStep(parseInt(btn.getAttribute('data-back'),10)); });
  });

  function updateSummary(){
    var summary = document.getElementById('bookingSummary');
    var dateStr = selectedDate ? selectedDate.toLocaleDateString('de-DE', { day:'numeric', month:'long', year:'numeric' }) : '–';
    summary.innerHTML = '📅 ' + dateStr + ' &nbsp;·&nbsp; 🕒 ' + (selectedTime || '–') + ' &nbsp;·&nbsp; 🌿 ' + (serviceSelect.value || '–');
  }

  var bookingForm = document.getElementById('bookingForm');
  var bSuccess = document.getElementById('bSuccess');
  var bReset = document.getElementById('bReset');

  bookingForm.addEventListener('submit', function(e){
    e.preventDefault();
    if (!bookingForm.checkValidity()){
      bookingForm.reportValidity();
      return;
    }
    bookingForm.style.display = 'none';
    document.querySelector('.booking-steps').style.display = 'none';
    bSuccess.classList.add('show');
  });

  bReset.addEventListener('click', function(){
    bookingForm.reset();
    selectedDate = null; selectedTime = null;
    document.querySelectorAll('.cal-day.selected').forEach(function(x){ x.classList.remove('selected'); });
    document.querySelectorAll('.time-chip.selected').forEach(function(x){ x.classList.remove('selected'); });
    toStep2.disabled = true; toStep3.disabled = true; toStep4.disabled = true;
    dateHint.textContent = 'Bitte wählen Sie ein Datum';
    bSuccess.classList.remove('show');
    bookingForm.style.display = '';
    document.querySelector('.booking-steps').style.display = '';
    goToStep(1);
  });

  /* ---------------- CONTACT FORM ---------------- */
  var contactForm = document.getElementById('contactForm');
  var contactSuccess = document.getElementById('contactSuccess');
  contactForm.addEventListener('submit', function(e){
    e.preventDefault();
    if (!contactForm.checkValidity()){
      contactForm.reportValidity();
      return;
    }
    contactSuccess.classList.add('show');
    contactForm.reset();
  });

})();
