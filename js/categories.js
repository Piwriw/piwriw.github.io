/**
 * Progressive enhancement for the Hexo categories directory.
 */

(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ICONS = [
    { match: ['cloud', 'k8s', 'kubernetes'], icon: 'fa-cloud' },
    { match: ['web', 'go', 'golang'], icon: 'fa-code' },
    { match: ['database', 'mysql'], icon: 'fa-database' },
    { match: ['tools', 'tool'], icon: 'fa-wrench' },
    { match: ['basic', '基础'], icon: 'fa-book-open' },
    { match: ['poem', '诗'], icon: 'fa-feather-alt' },
    { match: ['braveheart'], icon: 'fa-compass' }
  ];

  function initCategoriesPage() {
    const bodyWrap = document.getElementById('body-wrap');
    if (!bodyWrap?.classList.contains('type-categories')) return;

    const categoryLists = document.querySelector('#page .category-lists');
    const categoryList = categoryLists?.querySelector(':scope > .category-list');
    if (!categoryLists || !categoryList || categoryLists.dataset.categoriesEnhanced === 'true') return;

    const meta = collectCategoryMeta(categoryList);
    categoryLists.dataset.categoriesEnhanced = 'true';

    enhancePageHero(meta);
    enhanceCategoryTree(categoryList, meta);
    const controls = buildDirectoryLayout(categoryLists, categoryList, meta);
    initDirectoryInteractions(categoryLists, meta, controls);
    initCardReveal(meta.topItems);
  }

  function initCategoryDetailPage() {
    const bodyWrap = document.getElementById('body-wrap');
    const category = document.getElementById('category');
    const articleSort = category?.querySelector(':scope > .article-sort');
    if (!bodyWrap || bodyWrap.classList.contains('type-categories') || !category || !articleSort || category.dataset.categoryDetailEnhanced === 'true') return;

    bodyWrap.classList.add('category-detail-page');
    category.classList.add('category-detail');
    decorateCategoryDetailItems(articleSort);
    const meta = collectCategoryDetailMeta(category, articleSort);
    enhanceCategoryDetailHero(meta);
    const controls = buildCategoryDetailLayout(category, articleSort, meta);
    initCategoryDetailInteractions(category, meta, controls);
    initDetailReveal(articleSort);
    category.dataset.categoryDetailEnhanced = 'true';
  }

  function collectCategoryDetailMeta(category, articleSort) {
    const titleElement = category.querySelector(':scope > .article-sort-title');
    const rawTitle = titleElement?.textContent.trim() || document.querySelector('#site-title')?.textContent.trim() || '分类';
    const name = rawTitle.replace(/^分类\s*[-：:]\s*/u, '').trim() || rawTitle;
    const items = Array.from(articleSort.children);
    const articleItems = items.filter(item => !item.classList.contains('year'));
    const years = [];
    let currentYear = null;

    items.forEach(item => {
      if (!item.classList.contains('year')) return;
      currentYear = item.textContent.trim();
      years.push({ year: currentYear, count: 0 });
    });

    articleItems.forEach(item => {
      const year = item.dataset.categoryYear;
      const yearMeta = years.find(entry => entry.year === year);
      if (yearMeta) yearMeta.count += 1;
    });

    const pageNumbers = Array.from(category.querySelectorAll('#pagination .page-number'))
      .map(item => Number.parseInt(item.textContent.trim(), 10))
      .filter(Number.isFinite);
    const currentPage = Number.parseInt(category.querySelector('#pagination .current')?.textContent.trim(), 10) || 1;

    return {
      name,
      articleCount: articleItems.length,
      yearCount: years.length,
      years,
      latest: articleItems[0]?.querySelector('time')?.textContent.trim() || '--',
      currentPage,
      totalPages: pageNumbers.length ? Math.max(...pageNumbers) : currentPage
    };
  }

  function enhanceCategoryDetailHero(meta) {
    const header = document.querySelector('#page-header');
    const siteInfo = header?.querySelector('#page-site-info');
    if (!header || !siteInfo || header.dataset.categoryDetailHeroEnhanced === 'true') return;

    header.classList.add('category-detail-page-hero');
    siteInfo.innerHTML = `
      <div class="category-detail-hero-content">
        <p class="category-detail-hero-kicker"><span>CATEGORY DOSSIER</span><i aria-hidden="true"></i><span>${escapeHtml(meta.name)}</span></p>
        <h1 id="site-title">${escapeHtml(meta.name)}</h1>
        <p class="category-detail-hero-lede">沿着一个主题深入，把相关的实践、源码和流程分析集中到同一条路径上。</p>
        <dl class="category-detail-hero-facts" aria-label="分类详情统计">
          <div><dt>本页文章</dt><dd>${meta.articleCount}</dd></div>
          <div><dt>时间跨度</dt><dd>${meta.yearCount} 年</dd></div>
          <div><dt>最新记录</dt><dd>${escapeHtml(meta.latest)}</dd></div>
        </dl>
      </div>
    `;

    const scrollLink = document.createElement('a');
    scrollLink.className = 'category-detail-hero-scroll';
    scrollLink.href = '#category-detail-overview';
    scrollLink.title = '浏览分类文章';
    scrollLink.setAttribute('aria-label', '浏览分类文章');
    scrollLink.innerHTML = '<i class="fas fa-arrow-down" aria-hidden="true"></i>';
    scrollLink.addEventListener('click', event => {
      event.preventDefault();
      scrollToElement(document.getElementById('category-detail-overview'));
    });
    header.appendChild(scrollLink);
    header.dataset.categoryDetailHeroEnhanced = 'true';
  }

  function buildCategoryDetailLayout(category, articleSort, meta) {
    const titleElement = category.querySelector(':scope > .article-sort-title');
    const pagination = category.querySelector(':scope > #pagination');
    const overview = document.createElement('header');
    const toolbar = document.createElement('section');
    const feed = document.createElement('section');
    const feedHeader = document.createElement('div');
    const empty = document.createElement('div');

    overview.className = 'category-detail-overview';
    overview.id = 'category-detail-overview';
    overview.innerHTML = `
      <div class="category-detail-overview-copy">
        <p class="category-detail-kicker">PATH / ${escapeHtml(meta.name)}</p>
        <h2>沿着 ${escapeHtml(meta.name)} 深入</h2>
        <p>从最新记录回看这个分类里的关键节点，按年份和标题快速定位需要的文章。</p>
      </div>
      <dl class="category-detail-facts" aria-label="分类文章概览">
        <div><dt>当前页</dt><dd>${meta.currentPage} / ${meta.totalPages}</dd></div>
        <div><dt>本页文章</dt><dd>${meta.articleCount}</dd></div>
        <div><dt>最近更新</dt><dd>${escapeHtml(meta.latest)}</dd></div>
      </dl>
    `;

    toolbar.className = 'category-detail-toolbar';
    toolbar.setAttribute('aria-label', '分类文章筛选');
    toolbar.innerHTML = `
      <div class="category-detail-search-field">
        <label for="category-detail-search">查找文章</label>
        <div class="category-detail-search-control">
          <i class="fas fa-search" aria-hidden="true"></i>
          <input id="category-detail-search" type="search" placeholder="输入文章标题" autocomplete="off" spellcheck="false">
          <button class="category-detail-search-clear" type="button" aria-label="清除搜索" title="清除搜索"><i class="fas fa-times" aria-hidden="true"></i></button>
        </div>
      </div>
      <div class="category-detail-years" role="group" aria-label="按年份筛选">
        <span>年份</span>
        <div class="category-detail-year-buttons">
          <button type="button" class="is-active" data-year="all" aria-pressed="true">全部</button>
          ${meta.years.map(entry => `<button type="button" data-year="${escapeHtml(entry.year)}" aria-pressed="false">${escapeHtml(entry.year)}</button>`).join('')}
        </div>
      </div>
      <p class="category-detail-filter-status" aria-live="polite">显示 ${meta.articleCount} / ${meta.articleCount}</p>
    `;

    feed.className = 'category-detail-feed';
    feed.setAttribute('aria-labelledby', 'category-detail-list-title');
    feedHeader.className = 'category-detail-feed-header';
    feedHeader.innerHTML = `
      <div><p>ARTICLE LOG</p><h2 id="category-detail-list-title">文章列表</h2></div>
      <span>${meta.articleCount} ARTICLES</span>
    `;

    empty.className = 'category-detail-empty';
    empty.setAttribute('role', 'status');
    empty.hidden = true;
    empty.innerHTML = '<i class="fas fa-search" aria-hidden="true"></i><h3>没有匹配的文章</h3><p>换一个标题或年份继续查找。</p>';

    category.replaceChildren(overview, toolbar, feed);
    feed.append(feedHeader, articleSort);
    if (pagination) feed.appendChild(pagination);
    feed.appendChild(empty);
    titleElement?.remove();

    return {
      input: toolbar.querySelector('#category-detail-search'),
      clear: toolbar.querySelector('.category-detail-search-clear'),
      yearButtons: Array.from(toolbar.querySelectorAll('[data-year]')),
      status: toolbar.querySelector('.category-detail-filter-status'),
      empty,
      selectedYear: 'all'
    };
  }

  function initCategoryDetailInteractions(category, meta, controls) {
    const articleItems = Array.from(category.querySelectorAll('.category-detail-item'));
    const yearItems = Array.from(category.querySelectorAll('.category-detail-year'));

    const applyFilters = () => {
      const query = controls.input.value.trim().toLowerCase();
      let visible = 0;

      articleItems.forEach(item => {
        const matchesQuery = !query || item.textContent.toLowerCase().includes(query);
        const matchesYear = controls.selectedYear === 'all' || item.dataset.categoryYear === controls.selectedYear;
        const visibleItem = matchesQuery && matchesYear;
        item.classList.toggle('is-filtered-out', !visibleItem);
        if (visibleItem) visible += 1;
      });

      yearItems.forEach(yearItem => {
        const hasVisibleArticle = articleItems.some(item => item.dataset.categoryYear === yearItem.dataset.categoryYear && !item.classList.contains('is-filtered-out'));
        yearItem.classList.toggle('is-filtered-out', !hasVisibleArticle);
      });

      controls.clear.classList.toggle('is-visible', Boolean(query));
      controls.status.textContent = `显示 ${visible} / ${meta.articleCount}`;
      controls.empty.hidden = visible !== 0;
    };

    controls.input.addEventListener('input', applyFilters);
    controls.input.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      controls.input.value = '';
      applyFilters();
    });
    controls.clear.addEventListener('click', () => {
      controls.input.value = '';
      controls.input.focus();
      applyFilters();
    });
    controls.yearButtons.forEach(button => {
      button.addEventListener('click', () => {
        controls.selectedYear = button.dataset.year || 'all';
        controls.yearButtons.forEach(item => {
          const active = item === button;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', String(active));
        });
        applyFilters();
      });
    });
  }

  function decorateCategoryDetailItems(articleSort) {
    let currentYear = '';
    Array.from(articleSort.children).forEach(item => {
      if (item.classList.contains('year')) {
        currentYear = item.textContent.trim();
        item.classList.add('category-detail-year');
        item.dataset.categoryYear = currentYear;
        return;
      }

      item.classList.add('category-detail-item');
      item.dataset.categoryYear = currentYear;
    });
  }

  function initDetailReveal(articleSort) {
    const items = Array.from(articleSort.querySelectorAll('.category-detail-item'));
    if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
      items.forEach(item => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -5% 0px' });

    items.forEach((item, index) => {
      item.style.setProperty('--category-detail-reveal-delay', `${(index % 6) * 28}ms`);
      observer.observe(item);
    });
  }

  function collectCategoryMeta(categoryList) {
    const topItems = directChildren(categoryList, 'category-list-item');
    const allItems = Array.from(categoryList.querySelectorAll('.category-list-item'));
    const topCategories = topItems.map(item => {
      const link = directChild(item, 'category-list-link');
      const count = directChild(item, 'category-list-count');
      const names = Array.from(item.querySelectorAll('.category-list-link'))
        .map(categoryLink => categoryLink.textContent.trim());

      return {
        item,
        name: link?.textContent.trim() || '',
        count: Number.parseInt(count?.textContent.trim(), 10) || 0,
        searchText: names.join(' ').toLowerCase()
      };
    });
    const largestCategory = topCategories.reduce((largest, current) => {
      return !largest || current.count > largest.count ? current : largest;
    }, null);

    return {
      topItems,
      topCategories,
      topCount: topItems.length,
      categoryCount: allItems.length,
      childCount: Math.max(allItems.length - topItems.length, 0),
      postCount: topCategories.reduce((sum, category) => sum + category.count, 0),
      largestCategory
    };
  }

  function enhancePageHero(meta) {
    const header = document.querySelector('#page-header');
    const siteInfo = header?.querySelector('#page-site-info');
    if (!header || !siteInfo || header.dataset.categoryHeroEnhanced === 'true') return;

    header.classList.add('category-page-hero');
    siteInfo.innerHTML = `
      <div class="category-hero-content">
        <p class="category-hero-kicker">
          <span>KNOWLEDGE MAP</span>
          <i aria-hidden="true"></i>
          <span>${meta.categoryCount} TOPICS</span>
        </p>
        <h1 id="site-title">分类</h1>
        <p class="category-hero-lede">让知识各归其位，也让不同路径在这里相遇。</p>
        <dl class="category-hero-facts" aria-label="分类统计">
          <div>
            <dt>分类</dt>
            <dd>${meta.categoryCount}</dd>
          </div>
          <div>
            <dt>文章</dt>
            <dd>${meta.postCount}</dd>
          </div>
        </dl>
      </div>
    `;

    const scrollLink = document.createElement('a');
    scrollLink.className = 'category-hero-scroll';
    scrollLink.href = '#categories-overview';
    scrollLink.title = '浏览分类';
    scrollLink.setAttribute('aria-label', '浏览分类');
    scrollLink.innerHTML = '<i class="fas fa-arrow-down" aria-hidden="true"></i>';
    scrollLink.addEventListener('click', event => {
      event.preventDefault();
      scrollToElement(document.getElementById('categories-overview'));
    });
    header.appendChild(scrollLink);
    header.dataset.categoryHeroEnhanced = 'true';
  }

  function enhanceCategoryTree(categoryList, meta) {
    meta.topCategories.forEach((category, index) => {
      const item = category.item;
      const link = directChild(item, 'category-list-link');
      const count = directChild(item, 'category-list-count');
      const childList = directChild(item, 'category-list-child');
      if (!link || !count) return;

      item.classList.add('category-card');
      item.dataset.categorySearch = category.searchText;
      if (category === meta.largestCategory) item.classList.add('is-featured');

      const header = document.createElement('div');
      header.className = 'category-card-header';

      const categoryIndex = document.createElement('span');
      categoryIndex.className = 'category-card-index';
      categoryIndex.textContent = String(index + 1).padStart(2, '0');

      link.classList.add('category-card-link');
      link.replaceChildren(
        createIcon(category.name, 'category-card-icon'),
        createText(category.name, 'category-card-name')
      );

      count.classList.add('category-card-count');
      count.setAttribute('aria-label', `${category.count} 篇文章`);

      header.append(categoryIndex, link, count);

      if (childList) {
        const panelId = `category-children-${index + 1}`;
        const toggle = document.createElement('button');
        const panel = document.createElement('div');

        toggle.className = 'category-toggle';
        toggle.type = 'button';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-controls', panelId);
        toggle.setAttribute('aria-label', `展开 ${category.name} 子分类`);
        toggle.innerHTML = '<i class="fas fa-chevron-down" aria-hidden="true"></i>';

        panel.className = 'category-child-panel';
        panel.id = panelId;
        panel.setAttribute('aria-hidden', 'true');
        decorateChildList(childList, 1);
        panel.appendChild(childList);
        header.appendChild(toggle);
        item.replaceChildren(header, panel);
      } else {
        item.classList.add('has-no-children');
        item.replaceChildren(header);
      }
    });
  }

  function decorateChildList(list, depth) {
    directChildren(list, 'category-list-item').forEach(item => {
      const link = directChild(item, 'category-list-link');
      const count = directChild(item, 'category-list-count');
      const childList = directChild(item, 'category-list-child');
      if (!link || !count) return;

      const name = link.textContent.trim();
      const row = document.createElement('div');
      row.className = 'category-child-row';
      row.style.setProperty('--category-depth', String(depth));

      link.classList.add('category-child-link');
      link.replaceChildren(
        createIcon(name, 'category-child-icon'),
        createText(name, 'category-child-name')
      );
      count.classList.add('category-child-count');
      count.setAttribute('aria-label', `${count.textContent.trim()} 篇文章`);
      row.append(link, count);

      item.replaceChildren(row);
      if (childList) {
        item.classList.add('has-nested-children');
        decorateChildList(childList, depth + 1);
        item.appendChild(childList);
      }
    });
  }

  function buildDirectoryLayout(categoryLists, categoryList, meta) {
    const overview = document.createElement('header');
    const toolbar = document.createElement('section');
    const directory = document.createElement('section');
    const directoryHeader = document.createElement('div');
    const noResults = document.createElement('div');
    const footer = document.createElement('footer');

    overview.className = 'categories-overview';
    overview.id = 'categories-overview';
    overview.innerHTML = `
      <div class="categories-overview-copy">
        <p class="categories-kicker">EDITORIAL CATALOG / ${meta.categoryCount}</p>
        <h2>知识的分支，彼此相连</h2>
        <p>从基础语言到云原生架构，按主题重新找到每一篇记录。</p>
      </div>
      <dl class="categories-facts" aria-label="分类概览">
        <div>
          <dt>主分类</dt>
          <dd>${meta.topCount}</dd>
        </div>
        <div>
          <dt>子分类</dt>
          <dd>${meta.childCount}</dd>
        </div>
        <div class="categories-fact-wide">
          <dt>最大分支</dt>
          <dd>${meta.largestCategory?.name || '--'} <span>${meta.largestCategory?.count || 0} 篇</span></dd>
        </div>
      </dl>
    `;

    toolbar.className = 'categories-toolbar';
    toolbar.setAttribute('aria-label', '分类筛选');
    toolbar.innerHTML = `
      <div class="categories-search-field">
        <label for="categories-search">查找分类</label>
        <div class="categories-search-control">
          <i class="fas fa-search" aria-hidden="true"></i>
          <input id="categories-search" type="search" placeholder="输入分类名称" autocomplete="off" spellcheck="false">
          <button class="categories-search-clear" type="button" aria-label="清除搜索" title="清除搜索">
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      <p class="categories-filter-status" aria-live="polite">显示 ${meta.topCount} / ${meta.topCount}</p>
    `;

    directory.className = 'categories-directory';
    directory.setAttribute('aria-labelledby', 'categories-directory-title');
    directoryHeader.className = 'categories-directory-header';
    directoryHeader.innerHTML = `
      <div>
        <p>PRIMARY BRANCHES</p>
        <h2 id="categories-directory-title">主分类</h2>
      </div>
      <span>${meta.topCount} BRANCHES</span>
    `;
    directory.append(directoryHeader, categoryList);

    noResults.className = 'categories-no-results';
    noResults.setAttribute('role', 'status');
    noResults.innerHTML = `
      <i class="fas fa-search" aria-hidden="true"></i>
      <h3>没有匹配的分类</h3>
      <p>换一个关键词继续查找。</p>
    `;
    directory.appendChild(noResults);

    footer.className = 'categories-end';
    footer.id = 'categories-end';
    footer.innerHTML = `
      <div class="categories-end-copy">
        <p>END OF CATALOG</p>
        <h2>从一个分类，继续深入</h2>
        <span>${meta.categoryCount} 个分类，共收录 ${meta.postCount} 篇文章。</span>
      </div>
      <div class="categories-end-actions">
        <a href="/archives/">
          <i class="fas fa-stream" aria-hidden="true"></i>
          <span>查看时间轴</span>
        </a>
        <button class="categories-back-top" type="button">
          <i class="fas fa-arrow-up" aria-hidden="true"></i>
          <span>回到顶部</span>
        </button>
      </div>
    `;

    categoryLists.replaceChildren(overview, toolbar, directory, footer);

    return {
      input: toolbar.querySelector('#categories-search'),
      clear: toolbar.querySelector('.categories-search-clear'),
      status: toolbar.querySelector('.categories-filter-status'),
      noResults,
      backToTop: footer.querySelector('.categories-back-top')
    };
  }

  function initDirectoryInteractions(categoryLists, meta, controls) {
    categoryLists.addEventListener('click', event => {
      const toggle = event.target.closest('.category-toggle');
      if (!toggle) return;

      const card = toggle.closest('.category-card');
      if (card) toggleCategory(card, toggle);
    });

    const runSearch = debounce(() => {
      const query = controls.input.value.trim().toLowerCase();
      let visible = 0;

      meta.topItems.forEach(item => {
        const matches = !query || item.dataset.categorySearch.includes(query);
        item.classList.toggle('is-filtered-out', !matches);
        if (matches) visible += 1;

        if (query && matches && !item.classList.contains('is-expanded')) {
          const toggle = item.querySelector('.category-toggle');
          if (toggle) toggleCategory(item, toggle);
        }
      });

      controls.clear.classList.toggle('is-visible', Boolean(query));
      controls.status.textContent = `显示 ${visible} / ${meta.topCount}`;
      controls.noResults.classList.toggle('is-visible', visible === 0);
    }, 120);

    controls.input.addEventListener('input', runSearch);
    controls.input.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      controls.input.value = '';
      runSearch();
    });
    controls.clear.addEventListener('click', () => {
      controls.input.value = '';
      controls.input.focus();
      runSearch();
    });
    controls.backToTop.addEventListener('click', () => {
      scrollToElement(document.getElementById('categories-overview'));
    });
  }

  function toggleCategory(card, toggle) {
    const panel = document.getElementById(toggle.getAttribute('aria-controls'));
    if (!panel) return;

    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    const categoryName = card.querySelector('.category-card-name')?.textContent.trim() || '分类';
    toggle.setAttribute('aria-expanded', String(!expanded));
    toggle.setAttribute('aria-label', `${expanded ? '展开' : '收起'} ${categoryName} 子分类`);
    toggle.querySelector('i')?.classList.toggle('fa-chevron-down', expanded);
    toggle.querySelector('i')?.classList.toggle('fa-chevron-up', !expanded);
    panel.setAttribute('aria-hidden', String(expanded));
    card.classList.toggle('is-expanded', !expanded);
  }

  function initCardReveal(items) {
    if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
      items.forEach(item => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    items.forEach((item, index) => {
      item.style.setProperty('--category-reveal-delay', `${(index % 4) * 45}ms`);
      observer.observe(item);
    });
  }

  function createIcon(name, className) {
    const iconWrap = document.createElement('span');
    const icon = document.createElement('i');
    const lowerName = name.toLowerCase();
    const iconName = ICONS.find(entry => entry.match.some(keyword => lowerName.includes(keyword)))?.icon || 'fa-folder';

    iconWrap.className = className;
    iconWrap.setAttribute('aria-hidden', 'true');
    icon.className = `fas ${iconName}`;
    iconWrap.appendChild(icon);
    return iconWrap;
  }

  function createText(text, className) {
    const element = document.createElement('span');
    element.className = className;
    element.textContent = text;
    return element;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function directChildren(element, className) {
    return Array.from(element.children).filter(child => child.classList.contains(className));
  }

  function directChild(element, className) {
    return directChildren(element, className)[0] || null;
  }

  function scrollToElement(target) {
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
  }

  function debounce(callback, delay) {
    let timeout;
    return function(...args) {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => callback.apply(this, args), delay);
    };
  }

  function run() {
    const initAllCategoryPages = () => {
      initCategoriesPage();
      initCategoryDetailPage();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAllCategoryPages, { once: true });
    } else {
      initAllCategoryPages();
    }

    if (!window.__piwriwCategoriesPjaxBound) {
      document.addEventListener('pjax:complete', initAllCategoryPages);
      window.__piwriwCategoriesPjaxBound = true;
    }
  }

  run();
})();
