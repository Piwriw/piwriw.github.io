/**
 * Editorial analytics for the article statistics page.
 */

(function() {
  'use strict';

  if (window.__piwriwChartsRuntime) {
    window.__piwriwChartsRuntime.init();
    return;
  }

  const chartInstances = new Map();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let statsData = null;
  let activeRange = 'all';
  let fetchSequence = 0;
  let resizeTimeout;
  let themeTimeout;

  const runtime = {
    init: initChartsPage,
    destroy: disposeCharts
  };

  window.__piwriwChartsRuntime = runtime;

  function initChartsPage() {
    const dashboard = document.querySelector('.type-charts .stats-dashboard');
    if (!dashboard) {
      disposeCharts();
      return;
    }

    enhancePageHero();
    bindDashboard(dashboard);

    if (statsData) {
      renderDashboard(dashboard, statsData);
      return;
    }

    loadStatsData(dashboard);
  }

  function enhancePageHero() {
    const header = document.querySelector('#page-header');
    const siteInfo = header?.querySelector('#page-site-info');
    if (!header || !siteInfo || header.dataset.chartsHeroEnhanced === 'true') return;

    const barHeights = [18, 32, 24, 48, 38, 59, 42, 68, 52, 78, 63, 88];
    header.classList.add('charts-page-hero');
    siteInfo.innerHTML = `
      <div class="charts-hero-content">
        <div class="charts-hero-copy">
          <p class="charts-hero-kicker">
            <span>WRITING ARCHIVE</span>
            <i aria-hidden="true"></i>
            <span>LIVE DATA</span>
          </p>
          <h1 id="site-title">文章统计</h1>
          <p class="charts-hero-lede">从时间、主题与字数，观察一座知识库如何持续生长。</p>
          <dl class="charts-hero-facts" aria-label="文章统计摘要">
            <div>
              <dt>文章</dt>
              <dd data-hero-stat="posts">--</dd>
            </div>
            <div>
              <dt>跨度</dt>
              <dd data-hero-stat="coverage">--</dd>
            </div>
          </dl>
        </div>
        <div class="charts-hero-figure" aria-hidden="true">
          <div class="charts-hero-bars">
            ${barHeights.map((height, index) => `<i style="height:${height}%;animation-delay:${index * 28}ms"></i>`).join('')}
          </div>
          <p><span>WRITING FREQUENCY</span><strong data-hero-stat="peak">--</strong></p>
        </div>
      </div>
    `;

    const scrollLink = document.createElement('a');
    scrollLink.className = 'charts-hero-scroll';
    scrollLink.href = '#stats-overview';
    scrollLink.title = '查看统计';
    scrollLink.setAttribute('aria-label', '查看统计');
    scrollLink.innerHTML = '<i class="fas fa-arrow-down" aria-hidden="true"></i>';
    scrollLink.addEventListener('click', event => {
      event.preventDefault();
      scrollToElement(document.getElementById('stats-overview'));
    });

    header.appendChild(scrollLink);
    header.dataset.chartsHeroEnhanced = 'true';
  }

  function bindDashboard(dashboard) {
    if (dashboard.dataset.statsBound === 'true') return;

    dashboard.addEventListener('click', event => {
      const rangeButton = event.target.closest('[data-range]');
      if (rangeButton) {
        activeRange = rangeButton.dataset.range || 'all';
        dashboard.querySelectorAll('[data-range]').forEach(button => {
          button.setAttribute('aria-pressed', String(button === rangeButton));
        });
        if (statsData) renderPostsChart(statsData.posts);
        return;
      }

      const retry = event.target.closest('.stats-retry');
      if (retry) loadStatsData(dashboard, true);
    });

    dashboard.dataset.statsBound = 'true';
  }

  async function loadStatsData(dashboard, force = false) {
    const requestId = ++fetchSequence;
    const errorPanel = dashboard.querySelector('.stats-data-error');
    dashboard.dataset.statsState = 'loading';
    if (errorPanel) errorPanel.hidden = true;

    try {
      await waitForEcharts();
      const response = await fetch('/charts-data.json', {
        cache: force ? 'reload' : 'default'
      });
      if (!response.ok) throw new Error(`Statistics request failed: ${response.status}`);

      const data = await response.json();
      if (requestId !== fetchSequence) return;
      if (!Array.isArray(data.posts) || !Array.isArray(data.tags) || !Array.isArray(data.categories)) {
        throw new Error('Statistics response has an invalid shape');
      }

      statsData = data;
      renderDashboard(dashboard, data);
    } catch (error) {
      if (requestId !== fetchSequence) return;
      dashboard.dataset.statsState = 'error';
      if (errorPanel) errorPanel.hidden = false;
      console.error('Failed to initialize article statistics:', error);
    }
  }

  function waitForEcharts(attempt = 0) {
    if (typeof window.echarts !== 'undefined') return Promise.resolve();
    if (attempt >= 30) return Promise.reject(new Error('ECharts is unavailable'));
    return new Promise(resolve => window.setTimeout(resolve, 120))
      .then(() => waitForEcharts(attempt + 1));
  }

  function renderDashboard(dashboard, data) {
    disposeCharts();
    updateHero(data);
    updateMetrics(dashboard, data);
    updateInsights(dashboard, data);

    window.requestAnimationFrame(() => {
      renderPostsChart(data.posts);
      renderTagsChart(data.tags);
      renderCategoriesChart(data.categories);
      dashboard.dataset.statsState = 'ready';
    });
  }

  function updateHero(data) {
    const posts = data.posts || [];
    const firstMonth = posts[0]?.[0];
    const lastMonth = posts[posts.length - 1]?.[0];
    const peak = getPeak(posts);

    setText(document.querySelector('[data-hero-stat="posts"]'), formatNumber(data.total || 0));
    setText(document.querySelector('[data-hero-stat="coverage"]'), getYearSpan(firstMonth, lastMonth));
    setText(document.querySelector('[data-hero-stat="peak"]'), peak ? `${formatMonth(peak[0])} / ${peak[1]}` : '--');

    const bars = document.querySelectorAll('.charts-hero-bars i');
    const recent = posts.slice(-bars.length);
    const max = Math.max(...recent.map(item => item[1]), 1);
    bars.forEach((bar, index) => {
      const item = recent[index - (bars.length - recent.length)];
      const height = item ? Math.max(10, Math.round((item[1] / max) * 100)) : 8;
      bar.style.height = `${height}%`;
    });
  }

  function updateMetrics(dashboard, data) {
    const metrics = [
      ['posts', data.total || 0, formatNumber],
      ['tags', data.tagTotal ?? data.tags.length, formatNumber],
      ['categories', data.categoryTotal ?? data.categories.length, formatNumber],
      ['words', data.totalWords || 0, formatCompact]
    ];

    metrics.forEach(([name, value, formatter]) => {
      const element = dashboard.querySelector(`[data-stat="${name}"]`);
      if (element) animateValue(element, value, formatter);
    });
  }

  function updateInsights(dashboard, data) {
    const posts = data.posts || [];
    const peak = getPeak(posts);
    const firstMonth = posts[0]?.[0];
    const lastMonth = posts[posts.length - 1]?.[0];
    const totalPublished = posts.reduce((total, item) => total + item[1], 0);
    const average = posts.length ? totalPublished / posts.length : 0;
    const topTag = data.tags[0];
    const topCategory = data.categories[0];

    setInsight(dashboard, 'coverage', formatCoverage(firstMonth, lastMonth));
    setInsight(dashboard, 'peak-month', peak ? formatMonth(peak[0]) : '--');
    setInsight(dashboard, 'latest-month', lastMonth ? formatMonth(lastMonth) : '--');
    setInsight(dashboard, 'active-months', `${posts.length} 个月`);
    setInsight(dashboard, 'peak-count', peak ? `${peak[1]} 篇` : '--');
    setInsight(dashboard, 'monthly-average', `${average.toFixed(1)} 篇`);
    setInsight(dashboard, 'top-tag', topTag ? `${topTag.name.trim()} / ${topTag.value}` : '--');
    setInsight(dashboard, 'top-category', topCategory ? `${topCategory.name.trim()} / ${topCategory.value}` : '--');
  }

  function renderPostsChart(posts) {
    const container = document.getElementById('posts-chart');
    if (!container || !posts.length) return;

    const data = filterPostsByRange(posts, activeRange);
    const peak = getPeak(data);
    const colors = getThemeColors();
    const mobile = window.innerWidth <= 680;
    const chart = getChart('posts-chart', container);

    chart.setOption({
      animation: !reducedMotion.matches,
      animationDuration: 650,
      grid: {
        top: 54,
        right: mobile ? 18 : 34,
        bottom: mobile ? 62 : 46,
        left: mobile ? 44 : 58,
        containLabel: false
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
        backgroundColor: colors.tooltip,
        borderColor: colors.primary,
        borderWidth: 1,
        padding: [9, 12],
        textStyle: { color: colors.tooltipText, fontFamily: getBodyFont(), fontSize: 12 },
        formatter(params) {
          const point = params?.[0];
          if (!point) return '';
          return `${escapeHtml(formatMonth(point.axisValue))}<br><strong>${formatNumber(point.value)} 篇文章</strong>`;
        }
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map(item => item[0]),
        axisLine: { lineStyle: { color: colors.axisLine } },
        axisTick: { show: false },
        axisLabel: {
          color: colors.axisLabel,
          fontFamily: getMonoFont(),
          fontSize: mobile ? 9 : 10,
          rotate: mobile ? 45 : 0,
          margin: mobile ? 14 : 12,
          formatter(value) {
            return mobile ? value.slice(2).replace('-', '.') : value.replace('-', '.');
          }
        }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        name: '文章 / 月',
        nameTextStyle: { color: colors.axisLabel, fontFamily: getBodyFont(), fontSize: 10, padding: [0, 0, 4, 0] },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: colors.axisLabel, fontFamily: getMonoFont(), fontSize: 10 },
        splitLine: { lineStyle: { color: colors.splitLine, type: 'dashed' } }
      },
      series: [{
        name: '文章数',
        type: 'line',
        smooth: 0.28,
        showSymbol: data.length <= 18,
        symbol: 'circle',
        symbolSize: 7,
        data: data.map(item => item[1]),
        lineStyle: { color: colors.primary, width: 3 },
        itemStyle: { color: colors.surface, borderColor: colors.primary, borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: colors.areaTop },
            { offset: 1, color: colors.areaBottom }
          ])
        },
        markPoint: peak ? {
          symbol: 'circle',
          symbolSize: mobile ? 34 : 40,
          data: [{ coord: [peak[0], peak[1]], value: peak[1], name: '峰值' }],
          itemStyle: { color: colors.coral },
          label: { color: '#ffffff', fontFamily: getMonoFont(), fontSize: 10, fontWeight: 600 }
        } : undefined,
        markLine: {
          silent: true,
          symbol: 'none',
          data: [{ type: 'average', name: '月均' }],
          lineStyle: { color: colors.brass, type: 'dashed', width: 1 },
          label: {
            formatter: '月均 {c}',
            color: colors.brass,
            fontFamily: getMonoFont(),
            fontSize: 9,
            position: 'insideEndTop'
          }
        }
      }]
    }, true);

    container.setAttribute('aria-label', `文章发布趋势：当前显示 ${data.length} 个活跃月份，峰值为 ${peak?.[1] || 0} 篇`);
  }

  function renderTagsChart(tags) {
    const container = document.getElementById('tags-chart');
    if (!container || !tags.length) return;

    const colors = getThemeColors();
    const mobile = window.innerWidth <= 680;
    const displayData = tags.slice(0, 10).map(item => ({
      name: item.name.trim(),
      value: item.value
    })).reverse();
    const chart = getChart('tags-chart', container);

    chart.setOption(createRankingOption(displayData, {
      colors,
      mobile,
      unit: '篇',
      palette: [colors.primary, colors.secondary, colors.coral]
    }), true);

    container.setAttribute('aria-label', `热门标签排行：${tags[0].name.trim()} 以 ${tags[0].value} 篇居首`);
  }

  function renderCategoriesChart(categories) {
    const container = document.getElementById('categories-chart');
    if (!container || !categories.length) return;

    const colors = getThemeColors();
    const mobile = window.innerWidth <= 680;
    const displayData = categories.slice(0, 10).map(item => ({
      name: item.name.trim(),
      value: item.value
    })).reverse();
    const chart = getChart('categories-chart', container);

    chart.setOption(createRankingOption(displayData, {
      colors,
      mobile,
      unit: '篇关联',
      palette: [colors.brass, colors.coral, colors.primary]
    }), true);

    container.setAttribute('aria-label', `分类关联文章排行：${categories[0].name.trim()} 以 ${categories[0].value} 篇关联居首`);
  }

  function createRankingOption(data, { colors, mobile, unit, palette }) {
    const max = Math.max(...data.map(item => item.value), 1);

    return {
      animation: !reducedMotion.matches,
      animationDuration: 620,
      animationDelay(index) { return index * 32; },
      grid: {
        top: 20,
        right: mobile ? 44 : 58,
        bottom: 20,
        left: mobile ? 102 : 118
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: colors.hoverBand } },
        confine: true,
        backgroundColor: colors.tooltip,
        borderColor: colors.primary,
        borderWidth: 1,
        padding: [9, 12],
        textStyle: { color: colors.tooltipText, fontFamily: getBodyFont(), fontSize: 12 },
        formatter(params) {
          const point = params?.[0];
          if (!point) return '';
          return `${escapeHtml(point.name)}<br><strong>${formatNumber(point.value)} ${unit}</strong>`;
        }
      },
      xAxis: {
        type: 'value',
        max: Math.ceil(max * 1.14),
        show: false
      },
      yAxis: {
        type: 'category',
        data: data.map(item => item.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: colors.text,
          fontFamily: getBodyFont(),
          fontSize: mobile ? 10 : 11,
          width: mobile ? 86 : 102,
          overflow: 'truncate',
          align: 'right',
          margin: 12
        }
      },
      series: [{
        type: 'bar',
        barWidth: mobile ? 9 : 11,
        data: data.map((item, index) => ({
          value: item.value,
          itemStyle: {
            color: index >= data.length - 3
              ? palette[data.length - 1 - index]
              : colors.primarySoft,
            borderRadius: [0, 5, 5, 0]
          }
        })),
        label: {
          show: true,
          position: 'right',
          distance: 8,
          color: colors.text,
          fontFamily: getMonoFont(),
          fontSize: 10,
          formatter: '{c}'
        },
        emphasis: {
          itemStyle: { color: colors.coral }
        }
      }]
    };
  }

  function getChart(id, container) {
    const existing = chartInstances.get(id);
    if (existing && existing.getDom() === container) return existing;
    if (existing) existing.dispose();

    const chart = echarts.init(container, null, { renderer: 'canvas' });
    chartInstances.set(id, chart);
    return chart;
  }

  function disposeCharts() {
    chartInstances.forEach(chart => {
      if (chart && !chart.isDisposed()) chart.dispose();
    });
    chartInstances.clear();
  }

  function getThemeColors() {
    const root = document.querySelector('.type-charts');
    const styles = root ? getComputedStyle(root) : getComputedStyle(document.documentElement);
    const dark = document.documentElement.dataset.theme === 'dark';
    const read = name => styles.getPropertyValue(name).trim();

    return {
      text: read('--stats-ink'),
      axisLabel: read('--stats-muted'),
      axisLine: read('--stats-line-strong'),
      splitLine: read('--stats-line'),
      primary: read('--stats-primary'),
      primarySoft: read('--stats-primary-soft'),
      secondary: read('--stats-secondary'),
      coral: read('--stats-coral'),
      brass: read('--stats-brass'),
      surface: read('--stats-surface'),
      areaTop: dark ? 'rgba(115, 198, 184, 0.32)' : 'rgba(23, 107, 98, 0.24)',
      areaBottom: dark ? 'rgba(115, 198, 184, 0.01)' : 'rgba(23, 107, 98, 0.01)',
      tooltip: dark ? 'rgba(12, 23, 21, 0.96)' : 'rgba(24, 39, 41, 0.94)',
      tooltipText: '#ffffff',
      hoverBand: dark ? 'rgba(115, 198, 184, 0.08)' : 'rgba(23, 107, 98, 0.05)'
    };
  }

  function filterPostsByRange(posts, range) {
    if (range === 'all' || !posts.length) return posts;
    const monthCount = Number.parseInt(range, 10);
    if (!monthCount) return posts;

    const [year, month] = posts[posts.length - 1][0].split('-').map(Number);
    const cutoff = new Date(year, month - monthCount, 1);

    return posts.filter(([key]) => {
      const [itemYear, itemMonth] = key.split('-').map(Number);
      return new Date(itemYear, itemMonth - 1, 1) >= cutoff;
    });
  }

  function getPeak(posts) {
    return posts.reduce((peak, item) => !peak || item[1] > peak[1] ? item : peak, null);
  }

  function animateValue(element, target, formatter) {
    const animationId = `${Date.now()}-${Math.random()}`;
    element.dataset.animationId = animationId;

    if (reducedMotion.matches) {
      element.textContent = formatter(target);
      return;
    }

    const start = performance.now();
    const duration = 820;

    function update(now) {
      if (element.dataset.animationId !== animationId) return;
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatter(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  function setInsight(dashboard, name, value) {
    setText(dashboard.querySelector(`[data-insight="${name}"]`), value);
  }

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('zh-CN').format(Math.round(value));
  }

  function formatCompact(value) {
    if (value >= 100000000) return `${(value / 100000000).toFixed(1)}亿`;
    if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
    return formatNumber(value);
  }

  function formatMonth(value) {
    if (!value) return '--';
    const [year, month] = value.split('-');
    return `${year}.${month}`;
  }

  function formatCoverage(firstMonth, lastMonth) {
    if (!firstMonth || !lastMonth) return '--';
    return `${formatMonth(firstMonth)} — ${formatMonth(lastMonth)}`;
  }

  function getYearSpan(firstMonth, lastMonth) {
    if (!firstMonth || !lastMonth) return '--';
    const firstYear = firstMonth.slice(0, 4);
    const lastYear = lastMonth.slice(0, 4);
    return firstYear === lastYear ? firstYear : `${firstYear}—${lastYear}`;
  }

  function getBodyFont() {
    return "'Fira Sans', 'Noto Sans SC', sans-serif";
  }

  function getMonoFont() {
    return "'Fira Code', monospace";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function scrollToElement(target) {
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }

  function rerenderForEnvironment() {
    if (!statsData || !document.querySelector('.type-charts .stats-dashboard')) return;
    renderPostsChart(statsData.posts);
    renderTagsChart(statsData.tags);
    renderCategoriesChart(statsData.categories);
  }

  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
      chartInstances.forEach(chart => chart.resize());
      rerenderForEnvironment();
    }, 160);
  });

  const themeObserver = new MutationObserver(mutations => {
    if (!mutations.some(mutation => mutation.attributeName === 'data-theme')) return;
    window.clearTimeout(themeTimeout);
    themeTimeout = window.setTimeout(rerenderForEnvironment, 80);
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  document.addEventListener('pjax:complete', initChartsPage);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChartsPage, { once: true });
  } else {
    initChartsPage();
  }
})();
