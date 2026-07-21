/**
 * Searchable editorial index for the Hexo tags page.
 */

(function() {
  'use strict';

  if (window.__piwriwTagsRuntime) {
    window.__piwriwTagsRuntime.init();
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
  const sourceByRoot = new WeakMap();
  let tagDataCache = null;
  let requestSequence = 0;

  const runtime = { init: initTagsPage };
  window.__piwriwTagsRuntime = runtime;

  function initTagsPage() {
    const root = document.querySelector('.type-tags #tags');
    if (!root) return;

    enhancePageHero();
    if (root.dataset.tagsEnhanced === 'true') return;

    const sourceTags = collectSourceTags(root);
    if (!sourceTags.length) return;

    sourceByRoot.set(root, sourceTags);
    root.dataset.tagsState = 'loading';
    loadTagData(root, sourceTags);
  }

  function collectSourceTags(root) {
    return Array.from(root.querySelectorAll('.tag-cloud-list > a')).map(link => ({
      link,
      name: link.textContent.trim(),
      href: link.getAttribute('href') || '#'
    }));
  }

  async function loadTagData(root, sourceTags, force = false) {
    const requestId = ++requestSequence;
    root.dataset.tagsState = 'loading';

    try {
      let data = tagDataCache;
      if (!data || force) {
        const response = await fetch('/charts-data.json', { cache: force ? 'reload' : 'default' });
        if (!response.ok) throw new Error(`Tag statistics request failed: ${response.status}`);
        data = await response.json();
        if (!Array.isArray(data.tags)) throw new Error('Tag statistics response has an invalid shape');
        tagDataCache = data;
      }

      if (requestId !== requestSequence || !document.contains(root)) return;
      const tags = mergeCounts(sourceTags, data.tags);
      buildTagIndex(root, tags, true);
    } catch (error) {
      if (requestId !== requestSequence || !document.contains(root)) return;
      const fallbackTags = sourceTags.map(tag => ({ ...tag, count: 0 }));
      buildTagIndex(root, fallbackTags, false);
      console.error('Failed to load tag statistics:', error);
    }
  }

  function mergeCounts(sourceTags, countData) {
    const exactCounts = new Map();
    const foldedCounts = new Map();

    countData.forEach(item => {
      const name = String(item.name || '').trim();
      const count = Number(item.value) || 0;
      exactCounts.set(name, count);

      const foldedName = name.toLocaleLowerCase();
      if (foldedCounts.has(foldedName)) {
        foldedCounts.set(foldedName, null);
      } else {
        foldedCounts.set(foldedName, count);
      }
    });

    return sourceTags.map(tag => {
      const exact = exactCounts.get(tag.name);
      const folded = foldedCounts.get(tag.name.toLocaleLowerCase());
      return {
        ...tag,
        count: exact ?? folded ?? 0
      };
    });
  }

  function buildTagIndex(root, tags, hasCounts) {
    const frequencyOrder = [...tags].sort(compareByFrequency);
    const topTag = frequencyOrder[0];
    const associations = tags.reduce((total, tag) => total + tag.count, 0);
    const highFrequencyCount = tags.filter(tag => getTier(tag.count) === 'high').length;

    const overview = document.createElement('section');
    const toolbar = document.createElement('section');
    const directory = document.createElement('section');
    const list = document.createElement('ol');
    const noResults = document.createElement('div');
    const notice = document.createElement('div');
    const footer = document.createElement('footer');

    overview.className = 'tags-overview';
    overview.id = 'tags-overview';
    overview.setAttribute('aria-labelledby', 'tags-overview-title');
    overview.innerHTML = `
      <div class="tags-overview-copy">
        <p class="tags-kicker">SUBJECT INDEX / ${tags.length}</p>
        <h2 id="tags-overview-title">从关键词，返回文章之间的联系</h2>
        <p>标签记录主题的交叉与复现，让同一条技术线索在不同文章之间重新相遇。</p>
      </div>
      <dl class="tags-overview-facts" aria-label="标签概览">
        <div>
          <dt>全部标签</dt>
          <dd>${formatNumber(tags.length)}</dd>
        </div>
        <div>
          <dt>高频主题</dt>
          <dd>${hasCounts ? formatNumber(highFrequencyCount) : '--'}</dd>
        </div>
        <div class="tags-fact-wide">
          <dt>最高频</dt>
          <dd>${hasCounts && topTag ? `${escapeHtml(topTag.name)} <span>${formatNumber(topTag.count)} 篇</span>` : '--'}</dd>
        </div>
      </dl>
    `;

    toolbar.className = 'tags-toolbar';
    toolbar.setAttribute('aria-label', '标签筛选与排序');
    toolbar.innerHTML = `
      <div class="tags-search-field">
        <label for="tags-search">查找标签</label>
        <div class="tags-search-control">
          <i class="fas fa-search" aria-hidden="true"></i>
          <input id="tags-search" type="search" placeholder="输入标签名称" autocomplete="off" spellcheck="false">
          <button class="tags-search-clear" type="button" aria-label="清除搜索" title="清除搜索">
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      <div class="tags-toolbar-modes">
        <div class="tags-mode-group">
          <span>排序</span>
          <div class="tags-segmented" role="group" aria-label="标签排序">
            <button type="button" data-tag-sort="frequency" aria-pressed="true" ${hasCounts ? '' : 'disabled'}>频次</button>
            <button type="button" data-tag-sort="name" aria-pressed="false">名称</button>
          </div>
        </div>
        <div class="tags-mode-group tags-tier-group">
          <span>层级</span>
          <div class="tags-segmented" role="group" aria-label="标签频次层级">
            <button type="button" data-tag-tier="all" aria-pressed="true">全部</button>
            <button type="button" data-tag-tier="high" aria-pressed="false" ${hasCounts ? '' : 'disabled'}>高频</button>
            <button type="button" data-tag-tier="medium" aria-pressed="false" ${hasCounts ? '' : 'disabled'}>中频</button>
            <button type="button" data-tag-tier="tail" aria-pressed="false" ${hasCounts ? '' : 'disabled'}>长尾</button>
          </div>
        </div>
      </div>
    `;

    notice.className = 'tags-data-notice';
    notice.hidden = hasCounts;
    notice.innerHTML = `
      <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
      <span>频次数据暂未加载，当前按名称浏览。</span>
      <button type="button" class="tags-retry"><i class="fas fa-redo" aria-hidden="true"></i><span>重试</span></button>
    `;

    directory.className = 'tags-directory';
    directory.setAttribute('aria-labelledby', 'tags-directory-title');
    directory.innerHTML = `
      <header class="tags-directory-header">
        <div>
          <p>TAG SPECIMENS</p>
          <h2 id="tags-directory-title">主题索引</h2>
        </div>
        <span class="tags-filter-status" aria-live="polite">显示 ${tags.length} / ${tags.length}</span>
      </header>
    `;

    list.className = 'tag-index-list';
    tags.forEach((tag, index) => list.appendChild(createTagItem(tag, index, frequencyOrder, hasCounts)));

    noResults.className = 'tags-no-results';
    noResults.setAttribute('role', 'status');
    noResults.innerHTML = `
      <i class="fas fa-search" aria-hidden="true"></i>
      <h3>没有匹配的标签</h3>
      <p>换一个关键词或频次层级继续查找。</p>
    `;
    directory.append(list, noResults);

    footer.className = 'tags-end';
    footer.innerHTML = `
      <div class="tags-end-copy">
        <p>END OF INDEX</p>
        <h2>沿着一个关键词继续阅读</h2>
        <span>${tags.length} 个标签，共形成 ${hasCounts ? formatNumber(associations) : '--'} 次文章关联。</span>
      </div>
      <nav class="tags-end-actions" aria-label="继续浏览">
        <a href="/categories/"><i class="fas fa-folder-open" aria-hidden="true"></i><span>查看分类</span></a>
        <a href="/charts/"><i class="fas fa-chart-line" aria-hidden="true"></i><span>文章统计</span></a>
      </nav>
    `;

    root.replaceChildren(overview, toolbar, notice, directory, footer);
    root.dataset.tagsEnhanced = 'true';
    root.dataset.tagsState = hasCounts ? 'ready' : 'degraded';

    updateHero(tags, hasCounts);
    bindInteractions(root, tags, hasCounts);
    applyView(root, { query: '', sort: hasCounts ? 'frequency' : 'name', tier: 'all' });
    initReveal(root.querySelectorAll('.tag-index-item'));
  }

  function createTagItem(tag, index, frequencyOrder, hasCounts) {
    const item = document.createElement('li');
    const tier = hasCounts ? getTier(tag.count) : 'unknown';
    const rank = frequencyOrder.indexOf(tag);
    const maxCount = frequencyOrder[0]?.count || 1;
    const meterWidth = hasCounts ? Math.max(4, Math.round((tag.count / maxCount) * 100)) : 0;
    const link = tag.link;

    item.className = 'tag-index-item';
    item.dataset.tagName = tag.name.toLocaleLowerCase();
    item.dataset.tagLabel = tag.name;
    item.dataset.tagCount = String(tag.count);
    item.dataset.tagTier = tier;
    item.dataset.tagRank = String(rank);
    if (rank < 3 && hasCounts) item.classList.add('is-leading');

    link.className = 'tag-index-link';
    link.removeAttribute('style');
    link.setAttribute('aria-label', hasCounts ? `${tag.name}，关联 ${tag.count} 篇文章` : tag.name);
    link.replaceChildren(
      createText(String(index + 1).padStart(2, '0'), 'tag-entry-index'),
      createTagCopy(tag.name, tier),
      createCount(tag.count, hasCounts),
      createMeter(meterWidth)
    );

    item.appendChild(link);
    return item;
  }

  function createTagCopy(name, tier) {
    const wrapper = document.createElement('span');
    const title = createText(name, 'tag-entry-name');
    const caption = createText(getTierLabel(tier), 'tag-entry-tier');
    wrapper.className = 'tag-entry-copy';
    wrapper.append(title, caption);
    return wrapper;
  }

  function createMeter(width) {
    const meter = document.createElement('span');
    const fill = document.createElement('i');
    meter.className = 'tag-entry-meter';
    meter.setAttribute('aria-hidden', 'true');
    fill.style.setProperty('--tag-meter', `${width}%`);
    meter.appendChild(fill);
    return meter;
  }

  function createCount(count, hasCounts) {
    const wrapper = document.createElement('span');
    const value = createText(hasCounts ? formatNumber(count) : '--', 'tag-entry-count-value');
    const unit = createText('篇', 'tag-entry-count-unit');
    wrapper.className = 'tag-entry-count';
    wrapper.append(value, unit);
    return wrapper;
  }

  function bindInteractions(root, tags, hasCounts) {
    const input = root.querySelector('#tags-search');
    const clear = root.querySelector('.tags-search-clear');
    const retry = root.querySelector('.tags-retry');
    const state = {
      query: '',
      sort: hasCounts ? 'frequency' : 'name',
      tier: 'all'
    };
    const runSearch = debounce(() => {
      state.query = input.value.trim().toLocaleLowerCase();
      clear.classList.toggle('is-visible', Boolean(state.query));
      applyView(root, state);
    }, 100);

    input.addEventListener('input', runSearch);
    input.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      input.value = '';
      runSearch();
    });
    clear.addEventListener('click', () => {
      input.value = '';
      input.focus();
      runSearch();
    });

    root.addEventListener('click', event => {
      const sortButton = event.target.closest('[data-tag-sort]');
      if (sortButton && !sortButton.disabled) {
        state.sort = sortButton.dataset.tagSort;
        setPressed(root, '[data-tag-sort]', sortButton);
        applyView(root, state);
        return;
      }

      const tierButton = event.target.closest('[data-tag-tier]');
      if (tierButton && !tierButton.disabled) {
        state.tier = tierButton.dataset.tagTier;
        setPressed(root, '[data-tag-tier]', tierButton);
        applyView(root, state);
      }
    });

    if (retry) {
      retry.addEventListener('click', () => {
        const sourceTags = sourceByRoot.get(root) || tags;
        loadTagData(root, sourceTags, true);
      });
    }
  }

  function applyView(root, state) {
    const list = root.querySelector('.tag-index-list');
    const items = Array.from(list.querySelectorAll('.tag-index-item'));
    const sortedItems = [...items].sort((a, b) => {
      if (state.sort === 'name') return collator.compare(a.dataset.tagLabel, b.dataset.tagLabel);
      const countDifference = Number(b.dataset.tagCount) - Number(a.dataset.tagCount);
      return countDifference || collator.compare(a.dataset.tagLabel, b.dataset.tagLabel);
    });

    let visible = 0;
    sortedItems.forEach(item => {
      const matchesQuery = !state.query || item.dataset.tagName.includes(state.query);
      const matchesTier = state.tier === 'all' || item.dataset.tagTier === state.tier;
      const matches = matchesQuery && matchesTier;

      item.classList.toggle('is-filtered-out', !matches);
      if (matches) {
        visible += 1;
        const index = item.querySelector('.tag-entry-index');
        if (index) index.textContent = String(visible).padStart(2, '0');
      }
      list.appendChild(item);
    });

    setText(root.querySelector('.tags-filter-status'), `显示 ${visible} / ${items.length}`);
    root.querySelector('.tags-no-results')?.classList.toggle('is-visible', visible === 0);
  }

  function updateHero(tags, hasCounts) {
    const ordered = [...tags].sort(compareByFrequency);
    const associations = tags.reduce((total, tag) => total + tag.count, 0);
    const samples = document.querySelector('.tags-hero-samples');

    setText(document.querySelector('[data-tags-hero="total"]'), formatNumber(tags.length));
    setText(document.querySelector('[data-tags-hero="links"]'), hasCounts ? formatNumber(associations) : '--');

    if (samples) {
      samples.replaceChildren(...ordered.slice(0, 5).map(tag => {
        const item = document.createElement('span');
        item.textContent = hasCounts ? `${tag.name} / ${tag.count}` : tag.name;
        return item;
      }));
    }
  }

  function enhancePageHero() {
    const header = document.querySelector('#page-header');
    const siteInfo = header?.querySelector('#page-site-info');
    if (!header || !siteInfo || header.dataset.tagsHeroEnhanced === 'true') return;

    header.classList.add('tags-page-hero');
    siteInfo.innerHTML = `
      <div class="tags-hero-content">
        <div class="tags-hero-copy">
          <p class="tags-hero-kicker"><span>SUBJECT CATALOG</span><i aria-hidden="true"></i><span>LIVE INDEX</span></p>
          <h1 id="site-title">标签</h1>
          <p class="tags-hero-lede">用关键词串联文章，也标记一条技术线索反复出现的地方。</p>
          <dl class="tags-hero-facts" aria-label="标签统计摘要">
            <div><dt>标签</dt><dd data-tags-hero="total">--</dd></div>
            <div><dt>关联</dt><dd data-tags-hero="links">--</dd></div>
          </dl>
        </div>
        <div class="tags-hero-samples" aria-label="高频标签"></div>
      </div>
    `;

    const scrollLink = document.createElement('a');
    scrollLink.className = 'tags-hero-scroll';
    scrollLink.href = '#tags-overview';
    scrollLink.title = '浏览标签';
    scrollLink.setAttribute('aria-label', '浏览标签');
    scrollLink.innerHTML = '<i class="fas fa-arrow-down" aria-hidden="true"></i>';
    scrollLink.addEventListener('click', event => {
      event.preventDefault();
      scrollToElement(document.getElementById('tags-overview'));
    });
    header.appendChild(scrollLink);
    header.dataset.tagsHeroEnhanced = 'true';
  }

  function getTier(count) {
    if (count >= 20) return 'high';
    if (count >= 5) return 'medium';
    return 'tail';
  }

  function getTierLabel(tier) {
    if (tier === 'high') return 'FOCUS / 高频';
    if (tier === 'medium') return 'ACTIVE / 中频';
    if (tier === 'tail') return 'SPECIFIC / 长尾';
    return 'TAG / 标签';
  }

  function compareByFrequency(a, b) {
    return b.count - a.count || collator.compare(a.name, b.name);
  }

  function setPressed(root, selector, selected) {
    root.querySelectorAll(selector).forEach(button => {
      button.setAttribute('aria-pressed', String(button === selected));
    });
  }

  function initReveal(items) {
    const elements = Array.from(items);
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      elements.forEach(item => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -5% 0px' });

    elements.forEach((item, index) => {
      item.style.setProperty('--tag-reveal-delay', `${(index % 9) * 24}ms`);
      observer.observe(item);
    });
  }

  function scrollToElement(target) {
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }

  function createText(text, className) {
    const element = document.createElement('span');
    element.className = className;
    element.textContent = text;
    return element;
  }

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('zh-CN').format(value);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function debounce(callback, delay) {
    let timeout;
    return function(...args) {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => callback.apply(this, args), delay);
    };
  }

  document.addEventListener('pjax:complete', initTagsPage);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTagsPage, { once: true });
  } else {
    initTagsPage();
  }
})();
