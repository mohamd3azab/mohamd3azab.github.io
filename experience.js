/* Optional motion. The portfolio remains fully readable without this script. */
(() => {
  'use strict';
  const root = document.querySelector('.experience-home');
  if (!root) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const scene = root.querySelector('.architectural-scene');
  const motionButton = root.querySelector('[data-motion-toggle]');
  const motionLabel = motionButton?.querySelector('[data-motion-label]');
  const progress = root.querySelector('.experience-progress');
  let preference = null;
  try { preference = sessionStorage.getItem('azab-motion'); } catch (_) { /* Storage is optional. */ }
  let paused = preference === 'off' || reduced.matches;
  const animations = new Set();
  function applyMotion() {
    const off = paused || reduced.matches;
    root.dataset.motion = off ? 'off' : 'on';
    motionButton?.setAttribute('aria-pressed', String(off));
    if (motionLabel) motionLabel.textContent = off ? 'Motion off' : 'Motion on';
    if (motionButton) {
      motionButton.disabled = reduced.matches;
      motionButton.title = reduced.matches ? 'Motion is disabled by your device preference' : 'Toggle scene movement';
    }
    if (off) {
      scene?.style.setProperty('--mx', '0');
      scene?.style.setProperty('--my', '0');
      animations.forEach(animation => animation.cancel());
      animations.clear();
    }
  }
  applyMotion();
  motionButton?.addEventListener('click', () => {
    paused = !paused;
    try { sessionStorage.setItem('azab-motion', paused ? 'off' : 'on'); } catch (_) { /* Storage is optional. */ }
    applyMotion();
  });
  reduced.addEventListener('change', applyMotion);
  if (scene) {
    let frame = 0, x = 0, y = 0;
    scene.addEventListener('pointermove', event => {
      if (paused || reduced.matches || !finePointer.matches) return;
      const rect = scene.getBoundingClientRect();
      x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      if (!frame) frame = requestAnimationFrame(() => {
        scene.style.setProperty('--mx', x.toFixed(3));
        scene.style.setProperty('--my', y.toFixed(3));
        frame = 0;
      });
    }, { passive: true });
    scene.addEventListener('pointerleave', () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      scene.style.setProperty('--mx', '0');
      scene.style.setProperty('--my', '0');
    });
  }
  let scrollFrame = 0;
  function updateProgress() {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const amount = height > 0 ? Math.max(0, Math.min(1, window.scrollY / height)) : 0;
    if (progress) progress.style.transform = `scaleX(${amount})`;
    const hero = root.querySelector('.hero');
    root.classList.toggle('is-scrolled', Boolean(hero && window.scrollY > hero.offsetHeight - 80));
    scrollFrame = 0;
  }
  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateProgress);
  }, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();
  if ('IntersectionObserver' in window) {
    const navLinks = [...root.querySelectorAll('.navlinks a[href^="#"]')];
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -65% 0px' });
    root.querySelectorAll('main > section[id]').forEach(section => sectionObserver.observe(section));
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        revealObserver.unobserve(entry.target);
        if (paused || reduced.matches || !entry.target.animate) return;
        const animation = entry.target.animate([
          { opacity: .75, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' });
        animations.add(animation);
        animation.finished.then(() => animations.delete(animation)).catch(() => animations.delete(animation));
      });
    }, { threshold: .08 });
    root.querySelectorAll('.section-head, .work-card, .cap, .about-preview-layout').forEach(element => revealObserver.observe(element));
  }
})();
