export default function CommunityFilter(mapInstance) {
  const selects = document.querySelectorAll('.js-filter-select');
  if (!selects.length) return;

  const cardsWrap  = document.querySelector('.community-view__cards');
  const countEl    = document.querySelector('.community-view__count');
  const noResults  = document.querySelector('.community-view__no-results');
  if (!cardsWrap || !countEl) return;

  // ── Dropdown open / close ─────────────────────────────────────

  function openSelect(sel) {
    sel.classList.add('is-open');
  }

  function closeSelect(sel) {
    sel.classList.remove('is-open');
  }

  function closeAll(except) {
    selects.forEach(s => { if (s !== except) closeSelect(s); });
  }

  selects.forEach(sel => {
    const trigger = sel.querySelector('.filter-select__trigger');
    const items   = sel.querySelectorAll('.filter-select__item');
    const label   = sel.querySelector('.filter-select__label');
    const prefix  = sel.dataset.prefix || '';
    const placeholder = sel.dataset.placeholder || '';

    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const wasOpen = sel.classList.contains('is-open');
      closeAll(null);
      wasOpen ? closeSelect(sel) : openSelect(sel);
    });

    items.forEach(item => {
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('is-active'));
        item.classList.add('is-active');
        sel.dataset.value = item.dataset.value;

        const display = item.dataset.value
          ? (prefix + item.textContent.trim())
          : (prefix + placeholder);
        label.textContent = display;

        closeSelect(sel);
        fetchResults();
      });
    });
  });

  document.addEventListener('click', () => closeAll(null));

  // ── AJAX fetch ────────────────────────────────────────────────

  function getParams() {
    const params = {};
    selects.forEach(sel => {
      const param = sel.dataset.param;
      const val   = sel.dataset.value || '';
      if (param && val) params[param] = val;
    });
    return params;
  }

  function fetchResults() {
    const params  = getParams();
    const body    = new FormData();
    body.append('action', 'community_filter');
    body.append('nonce',  window.site.community_filter_nonce);

    selects.forEach(sel => {
      body.append(sel.dataset.param, sel.dataset.value || '');
    });

    cardsWrap.style.opacity = '0.4';
    cardsWrap.style.pointerEvents = 'none';

    fetch(window.site.ajax_url, { method: 'POST', body })
      .then(r => r.json())
      .then(res => {
        if (!res.success) return;
        cardsWrap.innerHTML  = res.data.html;
        countEl.textContent  = res.data.label;
        if (mapInstance && res.data.markers) {
          mapInstance.updateMarkers(res.data.markers);
        }
      })
      .catch(() => {})
      .finally(() => {
        cardsWrap.style.opacity = '';
        cardsWrap.style.pointerEvents = '';
      });
  }
}
