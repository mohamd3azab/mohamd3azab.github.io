(() => {
  'use strict';
  const tabs = [...document.querySelectorAll('[data-curator-panel]')];
  if (!tabs.length) return;
  const panels = tabs.map(tab => document.getElementById(tab.dataset.curatorPanel));
  const tablist = document.querySelector('.curator-tabs');
  tablist.setAttribute('role', 'tablist');
  function select(index, focus = false, update = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus();
    if (update) history.replaceState(null, '', '#' + panels[index].id);
  }
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    panels[index].tabIndex = 0;
    tab.addEventListener('click', () => select(index, false, true));
    tab.addEventListener('keydown', event => {
      let target = index;
      if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') target = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = tabs.length - 1;
      else return;
      event.preventDefault();
      select(target, true, true);
    });
  });
  function fromHash() {
    const index = panels.findIndex(panel => '#' + panel.id === location.hash);
    select(index < 0 ? 0 : index);
  }
  fromHash();
  window.addEventListener('hashchange', fromHash);
  document.querySelectorAll('[data-curator-gallery]').forEach(gallery => {
    const items = [...gallery.children];
    const controls = gallery.nextElementSibling;
    const previous = controls.querySelector('[data-gallery-prev]');
    const next = controls.querySelector('[data-gallery-next]');
    const status = controls.querySelector('[role="status"]');
    let index = 0;
    function render() {
      items.forEach((item, i) => { item.hidden = i !== index; });
      previous.disabled = index === 0;
      next.disabled = index === items.length - 1;
      status.textContent = (index + 1) + ' / ' + items.length;
    }
    previous.addEventListener('click', () => { if (index > 0) { index--; render(); } });
    next.addEventListener('click', () => { if (index < items.length - 1) { index++; render(); } });
    controls.hidden = items.length < 2;
    render();
  });
})();
