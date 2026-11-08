/* Presentación TDAH. Funciona sin conexión a Internet. */
(() => {
  'use strict';
  const slides = [...document.querySelectorAll('.slide')];
  const stage = document.getElementById('stage');
  const viewport = document.getElementById('viewport');
  const count = document.getElementById('slide-count');
  const progress = document.getElementById('progress-fill');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const overlay = document.getElementById('overlay');
  const overlayContent = document.getElementById('overlay-content');
  const overlayDialog = document.querySelector('.overlay-dialog');
  const flyLayer = document.getElementById('fly-layer');
  const flyGif = document.getElementById('fly-gif');
  const toast = document.getElementById('toast');
  const indicator = document.getElementById('sound-indicator');
  let current = 0;
  let flyActive = false;
  let flyTimer = null;
  let flyPrevious = { x: 15, y: 25 };
  let blurTimer = null;
  let toastTimer = null;
  let soundTimer = null;

  // Ajuste exacto a un lienzo 16:9 fijo: todas las diapositivas mantienen su composición.
  function resizeStage() {
    const rect = viewport.getBoundingClientRect();
    const availableWidth = Math.max(320, rect.width - 30);
    const availableHeight = Math.max(250, rect.height - 24);
    const scale = Math.min(availableWidth / 1440, availableHeight / 810);
    stage.style.setProperty('--stage-scale', String(scale));
  }

  function notify(message, duration = 2200) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
  }

  function showSlide(index) {
    if (index < 0 || index >= slides.length || index === current) return;
    resetEffects(true);
    resetStrategyEffects();
    slides[current].classList.remove('is-active');
    slides[current].setAttribute('aria-hidden', 'true');
    current = index;
    slides[current].classList.add('is-active');
    slides[current].removeAttribute('aria-hidden');
    updateNavigation();
    document.dispatchEvent(new CustomEvent('tdah:slidechange', {detail:{index:current}}));
  }

  function updateNavigation() {
    count.innerHTML = `${String(current + 1).padStart(2, '0')} <span>/ ${slides.length}</span>`;
    progress.style.width = `${((current + 1) / slides.length) * 100}%`;
    prev.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    document.title = `${slides[current].dataset.title} | TDAH · Presentación interactiva`;
  }

  function moveFly() {
    if (!flyActive) return;
    const imageSize = flyGif.offsetWidth;
    const sw = Math.max(50, window.innerWidth - imageSize), sh = Math.max(50, window.innerHeight - imageSize);
    let x = 0, y = 0;
    // Se alternan destinos alejados, pequeñas pausas y trayectorias erráticas.
    let attempts = 0;
    do {
      x = Math.round(Math.random() * sw);
      y = Math.round(Math.random() * sh);
      attempts++;
    } while (attempts < 5 && Math.hypot(x - flyPrevious.x, y - flyPrevious.y) < 210);
    const dx = x - flyPrevious.x;
    const angle = Math.max(-32, Math.min(32, dx / 14));
    const scale = 0.72 + Math.random() * 0.4;
    flyGif.style.transform = `translate3d(${x}px,${y}px,0) rotate(${angle}deg) scale(${scale})`;
    flyPrevious = { x, y };
    flyTimer = setTimeout(moveFly, 1160 + Math.floor(Math.random() * 520));
  }

  function setFly(on) {
    if (on === flyActive) return;
    flyActive = on;
    clearTimeout(flyTimer);
    flyLayer.classList.toggle('active', on);
    if (on) {
      flyGif.style.transition = 'none';
      const imageSize = flyGif.offsetWidth;
      flyGif.style.transform = `translate3d(${-imageSize}px,0px,0)`;
      flyPrevious = { x: -imageSize, y: 0 };
      // Fuerza el primer fotograma en la posición inicial.
      void flyGif.offsetWidth;
      flyGif.style.transition = 'transform 1.18s cubic-bezier(.45,.05,.48,.97)';
      moveFly();
    }
  }

  function toggleBlur() {
    if (stage.classList.contains('is-blurred')) {
      clearTimeout(blurTimer);
      stage.classList.remove('is-blurred');
      return;
    }
    stage.classList.add('is-blurred');
    blurTimer = setTimeout(() => stage.classList.remove('is-blurred'), 4000);
  }

  function playSound() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      notify('Este navegador no permite reproducir el efecto de sonido.');
      return;
    }
    try {
      const context = new AudioContextClass();
      if (context.state === 'suspended') context.resume();
      const now = context.currentTime;
      // Aviso digital breve a volumen moderado: no pretende reproducir el TDAH.
      [0, 0.135].forEach((offset, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(index === 0 ? 650 : 825, now + offset);
        gain.gain.setValueAtTime(.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(.035, now + offset + .02);
        gain.gain.exponentialRampToValueAtTime(.0001, now + offset + .12);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(now + offset);
        oscillator.stop(now + offset + .135);
      });
      setTimeout(() => context.close().catch(() => {}), 650);
      indicator.classList.add('show');
      clearTimeout(soundTimer);
      soundTimer = setTimeout(() => indicator.classList.remove('show'), 1500);
    } catch (err) {
      notify('No se ha podido activar el sonido.');
    }
  }

  function resetEffects(silent = false) {
    setFly(false);
    stage.classList.remove('is-blurred');
    clearTimeout(blurTimer);
    indicator.classList.remove('show');
    resetStrategyEffects();
    if (!silent) notify('Efectos desactivados.');
  }

  function openOverlay(content) {
    overlayContent.innerHTML = content;
    overlay.hidden = false;
    document.getElementById('close-overlay').focus();
  }

  function closeOverlay() {
    overlay.hidden = true;
    overlayContent.replaceChildren();
  }

  function openHelp() {
    openOverlay(`<div class="overlay-eyebrow">GUÍA PARA LA EXPOSICIÓN</div>
      <h2 id="overlay-title">Controles de la presentación</h2>
      <p>Puedes utilizar estos recursos cuando quieras mostrar un ejemplo o destacar una idea. Todos se activan de forma manual.</p>
      <div class="overlay-help-grid">
        <div class="help-key"><kbd>← / →</kbd><span>Diapositiva anterior o siguiente. También puedes utilizar la barra inferior.</span></div>
        <div class="help-key"><kbd>Inicio / Fin</kbd><span>Ir a la primera o a la última diapositiva.</span></div>
        <div class="help-key"><kbd>M</kbd><span>Mostrar u ocultar la mosca que cruza la pantalla.</span></div>
        <div class="help-key"><kbd>B</kbd><span>Desenfocar durante unos segundos los textos preparados para el efecto.</span></div>
        <div class="help-key"><kbd>S</kbd><span>Reproducir un aviso sonoro breve, a volumen moderado.</span></div>
        <div class="help-key"><kbd>D</kbd><span>En estrategias: alterar las letras de las seis tarjetas por fases, sin fundidos, y restaurar los textos al terminar.</span></div>
        <div class="help-key"><kbd>F</kbd><span>Activar o salir de pantalla completa.</span></div>
        <div class="help-key"><kbd>1 / 2 / 3</kbd><span>Elegir un efecto sobre el cerebro 3D; pulsa 0 para volver a la vista natural.</span></div>
        <div class="help-key"><kbd>1 / 2 / 3 / 4</kbd><span>Seleccionar los cuatro principios psicopedagógicos en su diapositiva.</span></div>
        <div class="help-key"><kbd>Ratón</kbd><span>En las tarjetas de estrategias: difuminar memoria, alterar la escritura, ampliar el tiempo o activar la mosca.</span></div>
        <div class="help-key"><kbd>R</kbd><span>Detener la mosca y los efectos temporales de la diapositiva.</span></div>
        <div class="help-key"><kbd>Esc</kbd><span>Cerrar esta ayuda y otras ventanas, o cancelar efectos.</span></div>
        <div class="help-key"><kbd>?</kbd><span>Abrir esta guía.</span></div>
      </div>
      <p class="activity-disclaimer">Los recursos ilustran situaciones que pueden dificultar el aprendizaje; no representan la experiencia de todas las personas con TDAH.</p>`);
  }

  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => notify('No se ha podido activar la pantalla completa.'));
    } else {
      document.exitFullscreen?.();
    }
  }

  // Tarjetas educativas: inicialmente ninguna seleccionada.
  const strategyCards = [...document.querySelectorAll('.strategy-card')];
  const memoryCard = strategyCards.find(c => c.dataset.strategy === '0');
  const strategyLabels = strategyCards.map(card => card.querySelector('strong'));
  const strategyOriginalTexts = strategyLabels.map(label => label?.textContent || '');
  const strategiesSlide = document.getElementById('strategies-grid')?.closest('.slide');
  let activeStrategy = -1;
  let scrambleTimers = [];
  let scrambling = false;
  let clockInterval = null, clockEndAt = 0;
  const clockDigital = document.getElementById('strategy-clock-display');
  const clockExtend = document.getElementById('strategy-clock-extend');
  const clockHand = document.querySelector('.strategy-clock-second');
  const clockShell = document.querySelector('.strategy-clock-shell');

  // Altera de forma controlada letras interiores de cada palabra y conserva el texto fuente.
  function disorderedWord(word, phase, wordIndex) {
    const chars = Array.from(word);
    if (chars.length < 4) return word;
    const swaps = chars.length >= 8 && phase > 1 ? 2 : 1;
    for (let i = 0; i < swaps; i++) {
      const inner = Math.max(1, chars.length - 2);
      const at = 1 + ((phase * 3 + wordIndex * 2 + i * 3) % inner);
      const other = Math.min(chars.length - 1, at + 1);
      if (chars[at] === chars[other]) continue;
      [chars[at], chars[other]] = [chars[other], chars[at]];
    }
    return chars.join('');
  }

  function disorderedText(text, phase, cardIndex) {
    let wordIndex = cardIndex;
    return text.replace(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{4,}/g, word => {
      return disorderedWord(word, phase, wordIndex++);
    });
  }

  function restoreStrategyText() {
    scrambleTimers.forEach(clearTimeout);
    scrambleTimers = [];
    scrambling = false;
    strategyLabels.forEach((label, index) => {
      if (label) label.textContent = strategyOriginalTexts[index];
    });
    strategyCards.forEach(card => card.classList.remove('strategy-scrambling','strategy-changing'));
    memoryCard?.classList.remove('strategy-blurred');
  }

  function changeAllStrategyTexts(phase) {
    // Cambio directo: no ocultar, desenfocar ni animar las letras entre fases.
    strategyLabels.forEach((label, index) => {
      if (label) label.textContent = disorderedText(strategyOriginalTexts[index], phase, index);
    });
  }

  function scrambleAllStrategies() {
    if (scrambling) { restoreStrategyText(); return; }
    restoreStrategyText();
    scrambling = true;
    // Cada etapa permanece a la vista para que el público pueda observar el cambio.
    [1, 2, 3, 4].forEach((phase, i) => {
      scrambleTimers.push(setTimeout(() => changeAllStrategyTexts(phase), i * 1500));
    });
    // Se recuperan los textos exactos, sin dejar errores permanentes.
    scrambleTimers.push(setTimeout(restoreStrategyText, 7200));
  }
  function formatClock(seconds) {
    return `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
  }
  function renderClock() {
    const remaining = clockEndAt > 0 ? Math.max(0, Math.ceil((clockEndAt - Date.now()) / 1000)) : 60;
    if (clockDigital) clockDigital.textContent = formatClock(remaining);
    if (clockHand) clockHand.style.transform = `rotate(${((60 - (remaining % 60)) % 60) * 6}deg)`;
    if (clockEndAt && remaining === 0) stopClock(false);
  }
  function stopClock(reset = true) {
    clearInterval(clockInterval);
    clockInterval = null;
    clockShell?.classList.remove('is-running');
    if (reset) { clockEndAt = 0; renderClock(); }
  }
  function startClock() {
    stopClock(true);
    clockEndAt = Date.now() + 60000;
    clockShell?.classList.add('is-running');
    renderClock();
    clockInterval = setInterval(renderClock, 250);
  }
  function extendClock() {
    if (activeStrategy !== 2) activateStrategy(2);
    clockEndAt = Math.max(clockEndAt, Date.now()) + 30000;
    renderClock();
  }
  clockExtend?.addEventListener('click', e => { e.preventDefault();e.stopPropagation();extendClock(); });
  clockExtend?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); e.stopPropagation(); extendClock();
    }
  });
  function resetStrategyEffects() {
    activeStrategy = -1;
    strategyCards.forEach(card => {
      card.classList.remove('chosen'); card.setAttribute('aria-pressed','false');
    });
    restoreStrategyText();
    stopClock(true);
  }
  function activateStrategy(index) {
    const next = activeStrategy === index ? -1 : index;
    restoreStrategyText();
    stopClock(true);
    activeStrategy = next;
    strategyCards.forEach((card,i) => {
      card.classList.toggle('chosen',i === next);
      card.setAttribute('aria-pressed',String(i === next));
    });
    // El botón M conserva su funcionamiento en cualquier diapositiva.
    if (next === 3) setFly(true);
    else if (flyActive) setFly(false);
    if (next === 0) memoryCard?.classList.add('strategy-blurred');
    if (next === 1) scrambleAllStrategies();
    if (next === 2) startClock();
  }
  strategyCards.forEach((card, index) => {
    card.setAttribute('aria-pressed', 'false');
    card.addEventListener('click', () => activateStrategy(index));
  });

  // El índice se puede abrir con ratón o teclado.
  document.querySelectorAll('[data-goto-slide]').forEach(control => {
    const navigate = e => {
      const inner = e?.target?.closest?.('[data-goto-slide]');
      if (inner && inner !== control) return;
      const slideNum = Number(control.dataset.gotoSlide);
      if (!Number.isFinite(slideNum)) return;
      showSlide(slideNum - 1);
    };
    control.addEventListener('click', navigate);
    if (control.tagName !== 'BUTTON') {
      control.addEventListener('keydown', e => {
        if (e.target === control && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault(); navigate(e);
        }
      });
    }
  });

  // Comportamiento de botones y teclado.
  prev.addEventListener('click', () => showSlide(current - 1));
  next.addEventListener('click', () => showSlide(current + 1));
  document.getElementById('help-btn').addEventListener('click', openHelp);
  document.getElementById('fullscreen-btn').addEventListener('click', toggleFullScreen);
  document.getElementById('close-overlay').addEventListener('click', closeOverlay);
  document.querySelector('.overlay-backdrop').addEventListener('click', closeOverlay);

  document.addEventListener('keydown', event => {
    const target = event.target;
    if (target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return;
    if (!overlay.hidden) {
      if (event.key === 'Escape') { event.preventDefault(); closeOverlay(); }
      return;
    }
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    if (key === ' ' && target instanceof HTMLElement && target.closest('button,a,[role="button"],[role="link"]')) return;
    if (key === 'arrowright' || key === 'pagedown' || key === ' ') {event.preventDefault();showSlide(current + 1);}
    else if (key === 'arrowleft' || key === 'pageup') {event.preventDefault();showSlide(current - 1);}
    else if (key === 'home') {event.preventDefault();showSlide(0);}
    else if (key === 'end') {event.preventDefault();showSlide(slides.length - 1);}
    else if (key === 'm') setFly(!flyActive);
    else if (key === 'b') toggleBlur();
    else if (key === 's') playSound();
    else if (key === 'd' && strategiesSlide?.classList.contains('is-active')) {
      event.preventDefault();
      scrambleAllStrategies();
    }
    else if (key === 'h' || key === '?') openHelp();
    else if (key === 'f') toggleFullScreen();
    else if (current === 3 && ['1','2','3','0'].includes(key)) {
      document.dispatchEvent(new CustomEvent('tdah:brainkey', {detail:{key}}));
    }
    else if (key === 'r') resetEffects();
    else if (key === 'escape') resetEffects(true);
  });

  slides.forEach((s, i) => { if (i !== 0) s.setAttribute('aria-hidden', 'true'); });
  const urlParam = new URLSearchParams(window.location.search).get('slide') || window.location.hash.replace('#', '');
  const initialIndex = urlParam ? parseInt(urlParam, 10) - 1 : 0;
  if (!isNaN(initialIndex) && initialIndex >= 0 && initialIndex < slides.length && initialIndex !== 0) {
    slides[0].classList.remove('is-active');
    slides[0].setAttribute('aria-hidden', 'true');
    current = initialIndex;
    slides[current].classList.add('is-active');
    slides[current].removeAttribute('aria-hidden');
  }

  // Características: ningún subtipo seleccionado al entrar.
  const charSlide = document.getElementById('slide-caracteristicas');
  const charButtons = [...document.querySelectorAll('.char-subtype-btn')];
  const charPanels = [...document.querySelectorAll('.char-topic-panel')];
  const charMainPicture = document.getElementById('char-main-picture');
  let charSelected = -1;

  function activateCharPanel(index) {
    // Pulsar la misma opción permite volver a la fotografía original.
    charSelected = index === charSelected ? -1 : index;
    if (charMainPicture) charMainPicture.hidden = charSelected !== -1;
    charButtons.forEach((button, i) => {
      const active = i === charSelected;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    charPanels.forEach((panel, i) => {
      const active = i === charSelected;
      panel.hidden = !active;
      panel.setAttribute('aria-hidden', String(!active));
    });
  }
  charButtons.forEach((button, i) => {
    button.addEventListener('click', () => activateCharPanel(i));
  });
  function resetCharPanels() {
    charSelected = -1;
    if (charMainPicture) charMainPicture.hidden = false;
    charButtons.forEach(button => {
      button.classList.remove('is-active');
      button.setAttribute('aria-pressed', 'false');
    });
    charPanels.forEach(panel => {
      panel.hidden = true;
      panel.setAttribute('aria-hidden', 'true');
    });
  }
  document.addEventListener('tdah:slidechange', e => {
    const charSlideIndex = slides.indexOf(charSlide);
    if (e.detail.index === charSlideIndex) resetCharPanels();
  });
  resetCharPanels();

  updateNavigation();
  resizeStage();
  window.addEventListener('resize', resizeStage);
  document.addEventListener('fullscreenchange', resizeStage);
})();


/* ===== Lógica de la diapositiva de principios psicopedagógicos ===== */

/* slide12.js — Lógica interactiva de la diapositiva 12 (V4)
   Principios psicopedagógicos para alumnado con TDAH.
   Sin dependencias externas. Compatible con el resto de la presentación.
*/
(()=>{
  'use strict';

  const slide12 = document.getElementById('slide-principios');
  if (!slide12) return;

  const layout     = slide12.querySelector('#pp-layout');
  const navBtns    = slide12.querySelectorAll('.pp-nav-btn');
  const panels     = slide12.querySelectorAll('.pp-panel');
  const photoWraps = [
    null, // 01 muestra las dos fotos dentro de su propio panel
    slide12.querySelector('#photo-wrap-1'),
    slide12.querySelector('#photo-wrap-2'),
    slide12.querySelector('#photo-wrap-3'),
  ];

  let currentPP = 0;

  // ── Cambiar principio activo ───────────────────────────────────────
  function activatePP(index) {
    if (index < 0 || index >= navBtns.length) return;
    currentPP = index;

    // Conmutar layout a modo 01 (dos fotos directas) o modo estándar (panel + foto lateral)
    if (layout) {
      layout.classList.toggle('is-mode-0', index === 0);
    }

    // Actualizar botones de navegación
    navBtns.forEach((btn, i) => {
      const isActive = i === index;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    // Actualizar paneles interactivos
    panels.forEach((panel, i) => {
      panel.classList.toggle('is-active', i === index);
    });

    // Actualizar fotografía lateral para 02, 03, 04
    photoWraps.forEach((wrap, i) => {
      if (wrap) {
        wrap.classList.toggle('is-active', i === index);
        wrap.style.display = i === index ? 'flex' : 'none';
      }
    });
  }

  navBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => activatePP(i));
  });

  // ══════════════════════════════════════════════════════════════════
  // PANEL 1 — GAMIFICACIÓN Y LO LÚDICO (SOLO LO DEL MEDIO)
  // ══════════════════════════════════════════════════════════════════
  const GAME_RETOS = [
    { xp: 20, label: 'Lectura activa por parejas' },
    { xp: 30, label: 'Debate y contrastación en equipo' },
    { xp: 50, label: 'Resolución creativa del caso' },
  ];
  const TOTAL_XP = 100;
  let gameXP = 0;
  let gameReto = 0;

  const gameBar    = slide12.querySelector('#pp-game-bar');
  const gameLevel  = slide12.querySelector('#pp-game-level');
  const gameXpLbl  = slide12.querySelector('#pp-game-xp-label');
  const gameReward = slide12.querySelector('#pp-game-reward');
  const rewardTxt  = slide12.querySelector('#pp-reward-text');
  const btnAdvance = slide12.querySelector('#btn-game-advance');

  function gameUpdateUI() {
    if (gameBar)   gameBar.style.width   = Math.min(100, (gameXP / TOTAL_XP * 100)) + '%';
    if (gameXpLbl) gameXpLbl.textContent = `${gameXP} / ${TOTAL_XP} XP`;
    const level = gameXP >= TOTAL_XP ? 2 : 1;
    if (gameLevel) gameLevel.textContent = level;

    GAME_RETOS.forEach((_, i) => {
      const row  = slide12.querySelector(`#reto-${i}`);
      const icon = slide12.querySelector(`#reto-icon-${i}`);
      if (i < gameReto) {
        row?.classList.add('done');
        if (icon) icon.textContent = '✓';
      } else {
        row?.classList.remove('done');
        if (icon) icon.textContent = '○';
      }
    });

    if (btnAdvance) {
      if (gameReto >= GAME_RETOS.length) {
        btnAdvance.innerHTML = '🏆 Misión completada';
        btnAdvance.disabled = true;
      } else {
        btnAdvance.innerHTML = '▶ Superar reto';
        btnAdvance.disabled = false;
      }
    }
  }

  function gameAdvance() {
    if (gameReto >= GAME_RETOS.length) return;
    gameXP += GAME_RETOS[gameReto].xp;
    gameReto++;
    gameUpdateUI();

    if (gameReward) {
      const msgs = [
        '¡Reto 1 superado! +20 XP',
        '¡Excelente debate en equipo! +30 XP',
        '🏆 ¡Misión completada! Nivel 2 desbloqueado (+100 XP)',
      ];
      if (rewardTxt) rewardTxt.textContent = msgs[gameReto - 1] || '¡Reto completado!';
      gameReward.style.display = 'flex';
      setTimeout(() => {
        if (gameReward && gameReto < GAME_RETOS.length) gameReward.style.display = 'none';
      }, 2000);
    }
  }

  function gameReset() {
    gameXP = 0;
    gameReto = 0;
    if (gameReward) gameReward.style.display = 'none';
    gameUpdateUI();
  }

  btnAdvance?.addEventListener('click', gameAdvance);
  slide12.querySelector('#btn-game-reset')?.addEventListener('click', gameReset);

  // ══════════════════════════════════════════════════════════════════
  // PANEL 2 — APOYOS VISUALES (SOLO LO DEL MEDIO, SIN BOTÓN ORIGINAL)
  // ══════════════════════════════════════════════════════════════════
  let visState = 'before';

  const visBefore = slide12.querySelector('#pp-vis-before');
  const visAfter  = slide12.querySelector('#pp-vis-after');
  const visToggle = slide12.querySelector('#btn-vis-toggle');

  function visShow(state) {
    visState = state;
    if (state === 'before') {
      if (visBefore) visBefore.style.display = '';
      if (visAfter)  visAfter.style.display  = 'none';
      if (visToggle) visToggle.innerHTML = '↔ Transformar a visual';
    } else {
      if (visBefore) visBefore.style.display = 'none';
      if (visAfter) {
        visAfter.style.display = '';
        const steps = visAfter.querySelectorAll('.pp-vis-step');
        steps.forEach(s => {
          s.style.animation = 'none';
          void s.offsetWidth;
          s.style.animation = '';
        });
      }
      if (visToggle) visToggle.innerHTML = '↔ Ver instrucción original';
    }
  }

  visToggle?.addEventListener('click', () => visShow(visState === 'before' ? 'after' : 'before'));

  // ══════════════════════════════════════════════════════════════════
  // PANEL 3 — TRÍADA INCLUSIVA (SOLO LA ANIMACIÓN, SIN BOTONES)
  // ══════════════════════════════════════════════════════════════════
  const triadNodes = slide12.querySelectorAll('.tri-node');

  function triadSelect(index) {
    triadNodes.forEach((node, i) => {
      const isSelected = i === index;
      node.classList.toggle('active', isSelected);
      const circle = node.querySelector('circle');
      if (circle) {
        circle.setAttribute('fill', isSelected ? '#c8e0bc' : '#ddecd6');
        circle.setAttribute('stroke', isSelected ? '#2d4e35' : '#7aa876');
        circle.setAttribute('stroke-width', isSelected ? '4' : '2.5');
      }
    });
  }

  triadNodes.forEach((node, i) => {
    node.addEventListener('click', () => triadSelect(i));
  });

  // ══════════════════════════════════════════════════════════════════
  // MODAL — ESTUDIO CIENTÍFICO (CIENCIA LATINA 2026)
  // ══════════════════════════════════════════════════════════════════
  const studyBtn   = slide12.querySelector('#pp-study-btn');
  const modal      = slide12.querySelector('#pp-modal');
  const modalClose = slide12.querySelector('#pp-modal-close');

  function openModal() {
    if (!modal) return;
    modal.hidden = false;
    modalClose?.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    studyBtn?.focus();
  }

  studyBtn?.addEventListener('click', openModal);
  modalClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.hidden) {
      e.stopImmediatePropagation();
      closeModal();
    }
  }, true);

  // ══════════════════════════════════════════════════════════════════
  // NAVEGACIÓN Y TECLADO RÁPIDO (TECLAS 1, 2, 3, 4 EN DIAPO 12)
  // ══════════════════════════════════════════════════════════════════
  const slide12Index = [...document.querySelectorAll('.slide')].indexOf(slide12);
  document.addEventListener('tdah:slidechange', (e) => {
    if (e.detail.index !== slide12Index) return;
    activatePP(0);
    gameReset();
    visShow('before');
    triadSelect(0);
  });

  document.addEventListener('keydown', (e) => {
    if (modal && !modal.hidden) return;
    const isSlide12 = slide12.classList.contains('is-active');
    if (!isSlide12) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (['1', '2', '3', '4'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      activatePP(Number(e.key) - 1);
    }
  }, true);

  // ══════════════════════════════════════════════════════════════════
  // INICIALIZACIÓN
  // ══════════════════════════════════════════════════════════════════
  const urlParams = new URLSearchParams(window.location.search);
  const initialPP = parseInt(urlParams.get('pp'), 10);
  if (!isNaN(initialPP) && initialPP >= 0 && initialPP <= 3) {
    activatePP(initialPP);
  } else {
    activatePP(0);
  }

  gameReset();
  visShow(urlParams.get('vis') === 'after' ? 'after' : 'before');
  triadSelect(0);

  if (urlParams.get('modal') === '1') {
    openModal();
  }
})();
