/**
 * Progressive enhancement for the Hexo archive page.
 */

(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let archiveDataPromise;

  async function initArchive() {
    const archive = document.querySelector('#archive');
    if (!archive || archive.dataset.archiveEnhanced === 'true' || archive.dataset.archiveEnhancing === 'true') return;

    const articleSort = archive.querySelector('.article-sort');
    if (!articleSort) return;

    archive.dataset.archiveEnhancing = 'true';
    const archiveData = await loadArchiveData();
    delete archive.dataset.archiveEnhancing;
    if (!archive.isConnected) return;

    const years = collectYearData(articleSort);
    const meta = collectArchiveMeta(archive, articleSort, years, archiveData);
    const layout = buildArchiveLayout(archive, articleSort);

    enhancePageHero(meta);
    createOverview(layout.container, meta);
    createTimelineNav(layout.content, years, meta);
    enhanceYearSections(articleSort, years, meta);
    createArchiveFooter(layout.container, layout.pagination, meta);
    enhancePagination(layout.pagination, meta);
    initYearToggles(articleSort);
    initScrollSpy(articleSort);
    initScrollReveal(articleSort);

    archive.dataset.archiveEnhanced = 'true';
  }

  function loadArchiveData() {
    if (!archiveDataPromise) {
      archiveDataPromise = fetch('/archive-data.json', { credentials: 'same-origin' })
        .then(response => response.ok ? response.json() : null)
        .catch(() => null);
    }

    return archiveDataPromise;
  }

  function collectYearData(articleSort) {
    const years = [];
    let currentYear = null;

    articleSort.querySelectorAll(':scope > .article-sort-item').forEach(item => {
      if (item.classList.contains('year')) {
        const year = Number.parseInt(item.textContent.trim(), 10);
        if (Number.isNaN(year)) {
          currentYear = null;
          return;
        }

        currentYear = { year, element: item, articles: [] };
        years.push(currentYear);
        return;
      }

      if (currentYear) currentYear.articles.push(item);
    });

    return years;
  }

  function collectArchiveMeta(archive, articleSort, years, archiveData) {
    const originalTitle = archive.querySelector('.article-sort-title');
    const totalMatch = originalTitle?.textContent.match(/(\d[\d,]*)\s*$/);
    const totalArticles = totalMatch
      ? Number.parseInt(totalMatch[1].replace(/,/g, ''), 10)
      : articleSort.querySelectorAll('.article-sort-item:not(.year)').length;
    const visibleArticles = years.reduce((sum, item) => sum + item.articles.length, 0);
    const currentPage = Number.parseInt(archive.querySelector('#pagination .current')?.textContent, 10) || 1;
    const pageNumbers = Array.from(archive.querySelectorAll('#pagination .page-number'))
      .map(item => Number.parseInt(item.textContent, 10))
      .filter(Number.isFinite);
    const totalPages = pageNumbers.length ? Math.max(...pageNumbers) : currentPage;
    const newestYear = years[0]?.year;
    const oldestYear = years[years.length - 1]?.year;
    const yearRange = newestYear && oldestYear
      ? (newestYear === oldestYear ? String(newestYear) : `${newestYear} - ${oldestYear}`)
      : '--';
    const allYears = Array.isArray(archiveData?.years) && archiveData.years.length
      ? archiveData.years
      : years.map(item => ({ year: item.year, count: item.articles.length }));

    return {
      totalArticles,
      globalTotal: archiveData?.total || totalArticles,
      visibleArticles,
      currentPage,
      totalPages,
      yearRange,
      allYearRange: archiveData?.yearRange || yearRange,
      allYearCount: archiveData?.yearCount || allYears.length,
      allYears,
      pageOffset: currentPage === totalPages
        ? Math.max(totalArticles - visibleArticles, 0)
        : (currentPage - 1) * visibleArticles
    };
  }

  function enhancePageHero(meta) {
    const header = document.querySelector('#page-header');
    const siteInfo = header?.querySelector('#page-site-info');
    if (!header || !siteInfo || header.dataset.archiveHeroEnhanced === 'true') return;

    header.classList.add('archive-page-hero');
    siteInfo.innerHTML = `
      <div class="archive-hero-content">
        <p class="archive-hero-kicker">
          <span>PIWRIW JOURNAL</span>
          <i aria-hidden="true"></i>
          <span>${meta.allYearRange}</span>
        </p>
        <h1 id="site-title">时间轴</h1>
        <p class="archive-hero-lede">把技术、思考与日常，按年份一页页留下。</p>
        <dl class="archive-hero-facts" aria-label="全站归档统计">
          <div>
            <dt>文章</dt>
            <dd>${meta.globalTotal}</dd>
          </div>
          <div>
            <dt>年份</dt>
            <dd>${meta.allYearCount}</dd>
          </div>
        </dl>
      </div>
    `;

    const scrollLink = document.createElement('a');
    scrollLink.className = 'archive-hero-scroll';
    scrollLink.href = '#archive-overview';
    scrollLink.title = '浏览归档';
    scrollLink.setAttribute('aria-label', '浏览归档');
    scrollLink.innerHTML = '<i class="fas fa-arrow-down" aria-hidden="true"></i>';
    scrollLink.addEventListener('click', event => {
      event.preventDefault();
      scrollToElement(document.getElementById('archive-overview'));
    });
    header.appendChild(scrollLink);
    header.dataset.archiveHeroEnhanced = 'true';
  }

  function buildArchiveLayout(archive, articleSort) {
    const originalTitle = archive.querySelector('.article-sort-title');
    const pagination = archive.querySelector('#pagination');
    const container = document.createElement('div');
    const content = document.createElement('div');
    const articles = document.createElement('section');

    container.className = 'archive-container';
    content.className = 'archive-content';
    articles.className = 'archive-articles';
    articles.id = 'archive-list';
    articles.setAttribute('aria-labelledby', 'archive-heading');

    articles.appendChild(articleSort);
    content.appendChild(articles);
    container.appendChild(content);
    archive.appendChild(container);
    originalTitle?.remove();

    return { container, content, articles, pagination };
  }

  function createOverview(container, meta) {
    const overview = document.createElement('header');
    overview.className = 'archive-overview';
    overview.id = 'archive-overview';
    overview.innerHTML = `
      <div class="archive-overview-copy">
        <p class="archive-kicker">
          <span>FIELD NOTES</span>
          <span>ARCHIVE ${padNumber(meta.currentPage)} / ${padNumber(meta.totalPages)}</span>
        </p>
        <h2 id="archive-heading">知识随时间沉淀</h2>
        <p class="archive-lede">记录云原生、Go 与分布式系统，也收藏一路上的思考。</p>
      </div>
      <dl class="archive-facts" aria-label="归档概览">
        <div class="archive-fact">
          <dt>全部文章</dt>
          <dd>${meta.globalTotal}</dd>
        </div>
        <div class="archive-fact">
          <dt>本页收录</dt>
          <dd>${meta.visibleArticles}</dd>
        </div>
        <div class="archive-fact archive-fact-range">
          <dt>全部年份</dt>
          <dd>${meta.allYearRange}</dd>
        </div>
      </dl>
      <div class="archive-overview-mark" aria-hidden="true">
        <span>${meta.allYearCount} YEARS</span>
        <i></i>
      </div>
    `;

    container.insertBefore(overview, container.firstChild);
  }

  function createTimelineNav(content, years, meta) {
    const sidebar = document.createElement('aside');
    sidebar.className = 'archive-timeline';
    sidebar.setAttribute('aria-label', '年份导航');
    sidebar.innerHTML = `
      <div class="timeline-header">
        <p class="timeline-eyebrow">YEARS</p>
        <h2 class="timeline-title">年份索引</h2>
        <p class="timeline-subtitle">${meta.allYearCount} 个年份 / ${meta.globalTotal} 篇记录</p>
      </div>
      <nav class="timeline-nav" aria-label="跳转到年份"></nav>
      <a class="timeline-skip" href="#archive-end">
        <span>前往页尾</span>
        <i class="fas fa-arrow-down" aria-hidden="true"></i>
      </a>
    `;

    const nav = sidebar.querySelector('.timeline-nav');
    const visibleYears = new Set(years.map(item => item.year));
    meta.allYears.forEach(({ year, count }, index) => {
      const link = document.createElement('a');
      link.href = visibleYears.has(year) ? `#year-${year}` : `/archives/${year}/`;
      link.className = 'timeline-link';
      link.dataset.year = String(year);
      if (!visibleYears.has(year)) link.classList.add('is-year-link');
      link.innerHTML = `
        <span class="timeline-index">${padNumber(index + 1)}</span>
        <span class="timeline-year">${year}</span>
        <span class="timeline-count" aria-label="${count} 篇文章">${count}</span>
      `;
      nav.appendChild(link);
    });

    sidebar.addEventListener('click', event => {
      const anchor = event.target.closest('a[href^="#"]');
      if (!anchor) return;

      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;

      event.preventDefault();
      scrollToElement(target);
      window.history.replaceState(null, '', anchor.getAttribute('href'));
    });

    content.insertBefore(sidebar, content.firstChild);
  }

  function enhanceYearSections(articleSort, years, meta) {
    let visibleIndex = meta.pageOffset;

    years.forEach(({ year, element, articles }, yearIndex) => {
      const contentId = `year-content-${year}`;
      const content = document.createElement('div');
      const inner = document.createElement('div');

      element.id = `year-${year}`;
      element.dataset.year = String(year);
      element.classList.add('archive-year-header');
      element.innerHTML = `
        <span class="year-chapter">CHAPTER ${padNumber(yearIndex + 1)}</span>
        <span class="year-marker" aria-hidden="true"><i></i></span>
        <h2 class="year-title">${year}</h2>
        <span class="year-count">${articles.length} 篇</span>
        <button class="year-toggle" type="button" aria-expanded="true" aria-controls="${contentId}" aria-label="收起 ${year} 年文章">
          <i class="fas fa-chevron-up" aria-hidden="true"></i>
        </button>
      `;

      content.className = 'year-content';
      content.id = contentId;
      content.dataset.year = String(year);
      inner.className = 'year-content-inner';
      inner.setAttribute('role', 'list');

      articles.forEach(article => {
        visibleIndex += 1;
        article.setAttribute('role', 'listitem');
        article.dataset.entry = padNumber(visibleIndex, 3);
        inner.appendChild(article);
      });

      content.appendChild(inner);
      element.after(content);
    });
  }

  function createArchiveFooter(container, pagination, meta) {
    const footer = document.createElement('footer');
    footer.className = 'archive-end';
    footer.id = 'archive-end';
    footer.innerHTML = `
      <div class="archive-end-copy">
        <p class="archive-end-index">END OF PAGE ${padNumber(meta.currentPage)}</p>
        <h2>本页记录，到这里</h2>
        <p>继续翻阅更早的记录，或回到时间轴起点。</p>
      </div>
      <div class="archive-end-actions"></div>
    `;

    const actions = footer.querySelector('.archive-end-actions');
    if (pagination) actions.appendChild(pagination);

    const backToTop = document.createElement('button');
    backToTop.className = 'archive-back-top';
    backToTop.type = 'button';
    backToTop.innerHTML = `
      <i class="fas fa-arrow-up" aria-hidden="true"></i>
      <span>回到顶部</span>
    `;
    backToTop.addEventListener('click', () => {
      scrollToElement(document.getElementById('archive-overview'));
    });
    actions.appendChild(backToTop);
    container.appendChild(footer);
  }

  function enhancePagination(pagination, meta) {
    if (!pagination) return;

    pagination.setAttribute('aria-label', '归档分页');
    pagination.querySelectorAll('.page-number').forEach(link => {
      const page = link.textContent.trim();
      if (link.classList.contains('current')) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.setAttribute('aria-label', `前往第 ${page} 页`);
      }
    });

    pagination.querySelector('.extend.prev')?.setAttribute('aria-label', '上一页');
    pagination.querySelector('.extend.next')?.setAttribute('aria-label', '下一页');
    pagination.style.setProperty('--archive-page-progress', `${(meta.currentPage / meta.totalPages) * 100}%`);
  }

  function initYearToggles(articleSort) {
    articleSort.addEventListener('click', event => {
      const toggle = event.target.closest('.year-toggle');
      if (!toggle) return;

      const header = toggle.closest('.archive-year-header');
      const content = document.getElementById(toggle.getAttribute('aria-controls'));
      if (!header || !content) return;

      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      toggle.setAttribute('aria-label', `${expanded ? '展开' : '收起'} ${header.dataset.year} 年文章`);
      toggle.querySelector('i')?.classList.toggle('fa-chevron-up', !expanded);
      toggle.querySelector('i')?.classList.toggle('fa-chevron-down', expanded);
      content.classList.toggle('is-collapsed', expanded);
      header.classList.toggle('is-collapsed', expanded);
    });
  }

  function initScrollSpy(articleSort) {
    const headers = Array.from(articleSort.querySelectorAll('.archive-year-header'));
    const links = Array.from(document.querySelectorAll('.timeline-link'));
    if (!headers.length || !links.length) return;

    const activateYear = year => {
      headers.forEach(header => header.classList.toggle('is-active', header.dataset.year === year));
      links.forEach(link => {
        const active = link.dataset.year === year;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };

    activateYear(headers[0].dataset.year);
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(entries => {
      const visibleHeader = entries.find(entry => entry.isIntersecting);
      if (visibleHeader) activateYear(visibleHeader.target.dataset.year);
    }, {
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    });

    headers.forEach(header => observer.observe(header));
  }

  function initScrollReveal(articleSort) {
    const articles = Array.from(articleSort.querySelectorAll('.article-sort-item:not(.year)'));
    if (!articles.length) return;

    if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
      articles.forEach(article => article.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08
    });

    articles.forEach((article, index) => {
      article.style.setProperty('--reveal-delay', `${(index % 6) * 35}ms`);
      observer.observe(article);
    });
  }

  function scrollToElement(target) {
    const top = target.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({
      top,
      behavior: prefersReducedMotion.matches ? 'auto' : 'smooth'
    });
  }

  function padNumber(value, size = 2) {
    return String(value).padStart(size, '0');
  }

  function run() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initArchive, { once: true });
    } else {
      initArchive();
    }

    if (!window.__piwriwArchivePjaxBound) {
      document.addEventListener('pjax:complete', initArchive);
      window.__piwriwArchivePjaxBound = true;
    }
  }

  run();
})();
