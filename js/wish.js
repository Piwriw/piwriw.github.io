/* Annual intentions ledger interactions. */

(function() {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function initWishPage() {
    const root = document.querySelector('#body-wrap.type-wish #wish-root');
    if (!root) return;

    const data = readWishData(root);
    enhanceHero(data);

    if (root.dataset.wishEnhanced === 'true') return;

    renderDashboard(root, data);
    renderLists(root, data);
    initFilters(root);
    initReveal(root);
    root.dataset.wishEnhanced = 'true';
  }

  function readWishData(root) {
    try {
      const source = root.querySelector('#wish-data');
      const data = JSON.parse(source?.textContent || '{}');
      return {
        year: String(data.year || new Date().getFullYear()),
        completed: Array.isArray(data.completed) ? data.completed : [],
        pending: Array.isArray(data.pending) ? data.pending : []
      };
    } catch (error) {
      console.error('Failed to parse wish data:', error);
      return { year: String(new Date().getFullYear()), completed: [], pending: [] };
    }
  }

  function enhanceHero(data) {
    const header = document.querySelector('#body-wrap.type-wish #page-header');
    const siteInfo = header?.querySelector('#page-site-info');
    if (!header || !siteInfo || header.dataset.wishHeroEnhanced === 'true') return;

    const total = data.completed.length + data.pending.length;
    const progress = total ? Math.round((data.completed.length / total) * 100) : 0;
    header.classList.add('wish-page-hero');
    siteInfo.innerHTML =
      '<div class="wish-hero-content">' +
        '<p class="wish-hero-kicker"><span>WISH LEDGER</span><i aria-hidden="true"></i><span>' + escapeHtml(data.year) + '</span></p>' +
        '<h1 id="site-title">Keep Doing</h1>' +
        '<p class="wish-hero-lede">把愿望写成可以回看的行动记录，给正在发生的生活留一个清晰的坐标。</p>' +
        '<div class="wish-hero-meta" aria-label="愿望完成情况">' +
          '<span>' + data.completed.length + ' 已完成</span>' +
          '<span>' + data.pending.length + ' 待完成</span>' +
          '<span>' + progress + '% 已兑现</span>' +
        '</div>' +
      '</div>';

    const scrollLink = document.createElement('a');
    scrollLink.className = 'wish-hero-scroll';
    scrollLink.href = '#wish-overview';
    scrollLink.title = '查看愿望清单';
    scrollLink.setAttribute('aria-label', '查看愿望清单');
    scrollLink.innerHTML = '<i class="fas fa-arrow-down" aria-hidden="true"></i>';
    scrollLink.addEventListener('click', function(event) {
      event.preventDefault();
      scrollToElement(document.getElementById('wish-overview'));
    });
    header.appendChild(scrollLink);
    header.dataset.wishHeroEnhanced = 'true';
  }

  function renderDashboard(root, data) {
    const completed = data.completed.length;
    const pending = data.pending.length;
    const total = completed + pending;
    const progress = total ? Math.round((completed / total) * 100) : 0;

    setText(root, '[data-year]', data.year);
    setText(root, '[data-completed-count]', completed);
    setText(root, '[data-pending-count]', pending);
    setText(root, '[data-total-count]', total);
    setText(root, '[data-progress]', progress + '%');
    setText(root, '[data-progress-copy]', progress ? '已经走出第一步，继续保持节奏。' : '从今天开始，给愿望一个动作。');

    const progressBar = root.querySelector('[data-progress-bar]');
    if (progressBar) {
      requestAnimationFrame(function() {
        progressBar.style.width = progress + '%';
      });
    }
  }

  function renderLists(root, data) {
    renderList(root.querySelector('[data-wish-list="completed"]'), data.completed, 'completed');
    renderList(root.querySelector('[data-wish-list="pending"]'), data.pending, 'pending');
    setText(root, '[data-section-count="completed"]', String(data.completed.length).padStart(2, '0'));
    setText(root, '[data-section-count="pending"]', String(data.pending.length).padStart(2, '0'));
  }

  function renderList(list, wishes, status) {
    if (!list) return;
    if (!wishes.length) {
      list.innerHTML = '<p class="wish-list-empty">这一栏暂时没有记录。</p>';
      return;
    }

    list.innerHTML = wishes.map(function(wish, index) {
      const text = escapeHtml(wish.text);
      const date = escapeHtml(wish.date);
      const icon = status === 'completed' ? 'fa-check' : 'fa-arrow-right';
      const note = status === 'completed' ? '已归档' : '待兑现';
      return (
        '<article class="wish-item ' + status + '" data-status="' + status + '" data-search="' + text.toLocaleLowerCase() + '">' +
          '<span class="wish-item-index">' + String(index + 1).padStart(2, '0') + '</span>' +
          '<div class="wish-item-main">' +
            '<span class="wish-item-text">' + text + '</span>' +
            '<span class="wish-item-meta"><i class="fas ' + icon + '" aria-hidden="true"></i>' + note + '</span>' +
          '</div>' +
          '<span class="wish-date">' + date + '</span>' +
          '<span class="wish-item-status wish-item-status-' + status + '" aria-label="' + note + '"><i class="fas ' + icon + '" aria-hidden="true"></i></span>' +
        '</article>'
      );
    }).join('');
  }

  function initFilters(root) {
    const buttons = Array.from(root.querySelectorAll('[data-filter]'));
    const search = root.querySelector('[data-filter-search]');
    const status = root.querySelector('[data-filter-status]');
    const items = Array.from(root.querySelectorAll('.wish-item'));
    const sections = Array.from(root.querySelectorAll('[data-list-section]'));
    let activeFilter = 'all';

    function applyFilter() {
      const query = (search?.value || '').trim().toLocaleLowerCase();
      let visible = 0;
      items.forEach(function(item) {
        const matchesStatus = activeFilter === 'all' || item.dataset.status === activeFilter;
        const matchesQuery = !query || (item.dataset.search || '').includes(query);
        const shouldShow = matchesStatus && matchesQuery;
        item.classList.toggle('is-hidden', !shouldShow);
        if (shouldShow) visible += 1;
      });

      sections.forEach(function(section) {
        const hasVisibleItems = section.querySelector('.wish-item:not(.is-hidden)');
        section.hidden = activeFilter !== 'all' && section.dataset.listSection !== activeFilter && !hasVisibleItems;
      });

      if (status) status.textContent = '显示 ' + visible + ' / ' + items.length + ' 条记录';
    }

    buttons.forEach(function(button) {
      button.addEventListener('click', function() {
        activeFilter = button.dataset.filter || 'all';
        buttons.forEach(function(item) {
          item.setAttribute('aria-selected', String(item === button));
        });
        applyFilter();
      });
    });

    search?.addEventListener('input', applyFilter);
    applyFilter();
  }

  function initReveal(root) {
    const elements = Array.from(root.querySelectorAll('.wish-reveal'));
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      elements.forEach(function(element) { element.classList.add('is-visible'); });
      return;
    }

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });

    elements.forEach(function(element) { observer.observe(element); });
  }

  function setText(root, selector, value) {
    const element = root.querySelector(selector);
    if (element) element.textContent = value;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function scrollToElement(target) {
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top: top, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWishPage, { once: true });
  } else {
    initWishPage();
  }

  document.addEventListener('pjax:complete', initWishPage);
})();
