(() => {
  document.querySelectorAll('[data-project-filter]').forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.projectFilter;
      document.querySelectorAll('[data-project-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      document.querySelectorAll('[data-project-category]').forEach(card => { card.hidden = filter !== 'all' && card.dataset.projectCategory !== filter; });
    });
  });
  const dialog = document.querySelector('.sheet-dialog');
  if (!dialog) return;
  const sheets = [...document.querySelectorAll('.sheet-open')];
  const stage = dialog.querySelector('.sheet-stage'), image = dialog.querySelector('#sheet-enlarged');
  const previous = dialog.querySelector('[data-prev]'), next = dialog.querySelector('[data-next]');
  const zoomIn = dialog.querySelector('[data-zoom="in"]'), zoomOut = dialog.querySelector('[data-zoom="out"]');
  let selected = 0, zoom = 1, trigger = null;
  function applyZoom() {
    image.style.width = `${zoom * 100}%`;
    zoomOut.disabled = zoom <= 1;
    zoomIn.disabled = zoom >= 3;
  }
  function show(index) {
    if (index < 0 || index >= sheets.length) return;
    selected = index; zoom = 1;
    const sheet = sheets[selected];
    image.src = sheet.querySelector('img').getAttribute('src');
    image.alt = sheet.dataset.title;
    dialog.querySelector('#sheet-title').textContent = sheet.dataset.title;
    dialog.querySelector('#sheet-count').textContent = `${selected + 1} / ${sheets.length} · Portfolio sheet ${String(sheet.dataset.sheet).padStart(3, '0')}`;
    dialog.querySelector('#sheet-original').href = image.src;
    previous.disabled = selected === 0;
    next.disabled = selected === sheets.length - 1;
    applyZoom(); stage.scrollTo(0, 0);
  }
  function open(index, source) {
    trigger = source; show(index); dialog.showModal(); document.body.style.overflow = 'hidden';
  }
  sheets.forEach((sheet, index) => sheet.addEventListener('click', () => open(index, sheet)));
  document.querySelectorAll('[data-archive-sheet]').forEach(button => button.addEventListener('click', () => {
    const index = sheets.findIndex(sheet => sheet.dataset.sheet === button.dataset.archiveSheet);
    if (index >= 0) open(index, button);
  }));
  previous.addEventListener('click', () => show(selected - 1));
  next.addEventListener('click', () => show(selected + 1));
  zoomIn.addEventListener('click', () => { zoom = Math.min(3, zoom + .5); applyZoom(); });
  zoomOut.addEventListener('click', () => { zoom = Math.max(1, zoom - .5); applyZoom(); });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; trigger?.focus(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); show(selected + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(selected - 1); }
    if (event.key === '+' || event.key === '=') zoomIn.click();
    if (event.key === '-') zoomOut.click();
  });
})();
