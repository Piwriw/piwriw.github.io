/**
 * Charts Renderer for Statistics Page
 * 使用 ECharts 渲染文章统计图表
 */

(function() {
  'use strict';

  // 文章发布趋势图
  function renderPostsChart(data) {
    const container = document.getElementById('posts-chart');
    if (!container || !data || !data.length) {
      console.warn('Posts chart container not found or no data');
      return;
    }

    // 调试：检查容器尺寸
    const rect = container.getBoundingClientRect();
    console.log('Posts chart container size:', rect.width, 'x', rect.height);

    // 销毁旧实例
    if (chartInstances['posts-chart']) {
      chartInstances['posts-chart'].dispose();
    }

    // 确保容器有高度
    if (rect.height === 0) {
      container.style.minHeight = '320px';
      container.style.height = '320px';
    }

    const chart = echarts.init(container);
    chartInstances['posts-chart'] = chart;
    const option = {
      grid: { top: 40, right: 20, bottom: 30, left: 50 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 64, 175, 0.9)',
        borderColor: '#3B82F6',
        textStyle: { color: '#fff' }
      },
      xAxis: {
        type: 'category',
        data: data.map(d => d[0]),
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: { color: '#64748B', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: { color: '#64748B' },
        splitLine: { lineStyle: { color: '#E2E8F0', type: 'dashed' } }
      },
      series: [{
        name: '文章数',
        type: 'line',
        smooth: true,
        data: data.map(d => d[1]),
        lineStyle: { color: '#1E40AF', width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(30, 64, 175, 0.3)' },
              { offset: 1, color: 'rgba(30, 64, 175, 0.05)' }
            ]
          }
        },
        itemStyle: { color: '#1E40AF' },
        emphasis: { itemStyle: { color: '#F59E0B' } }
      }]
    };
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
    console.log('Posts chart rendered successfully');
  }

  // 标签分布图
  function renderTagsChart(data) {
    const container = document.getElementById('tags-chart');
    if (!container || !data || !data.length) {
      console.warn('Tags chart container not found or no data');
      return;
    }

    // 确保容器有高度
    if (container.offsetHeight === 0) {
      container.style.minHeight = '320px';
      container.style.height = '320px';
    }

    // 只显示前 10 个标签
    const displayData = data.slice(0, 10);

    // 销毁旧实例
    if (chartInstances['tags-chart']) {
      chartInstances['tags-chart'].dispose();
    }
    const chart = echarts.init(container);
    chartInstances['tags-chart'] = chart;
    const colors = ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE',
                    '#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7'];
    const option = {
      grid: { top: 10, right: 80, bottom: 20, left: 80 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(30, 64, 175, 0.9)',
        borderColor: '#3B82F6',
        textStyle: { color: '#fff' }
      },
      xAxis: {
        type: 'value',
        show: false
      },
      yAxis: {
        type: 'category',
        data: displayData.map(d => d.name).reverse(),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#475569', fontSize: 12 }
      },
      series: [{
        type: 'bar',
        data: displayData.map(d => d.value).reverse(),
        itemStyle: {
          color: function(params) {
            return colors[params.dataIndex % colors.length];
          },
          borderRadius: [0, 8, 8, 0]
        },
        label: {
          show: true,
          position: 'right',
          color: '#1E3A8A',
          fontSize: 12,
          fontWeight: 'bold'
        },
        barWidth: '60%'
      }]
    };
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
    console.log('Tags chart rendered successfully');
  }

  // 分类分布图
  function renderCategoriesChart(data) {
    const container = document.getElementById('categories-chart');
    if (!container || !data || !data.length) {
      console.warn('Categories chart container not found or no data');
      return;
    }

    // 确保容器有高度
    if (container.offsetHeight === 0) {
      container.style.minHeight = '380px';
      container.style.height = '380px';
    }

    // 销毁旧实例
    if (chartInstances['categories-chart']) {
      chartInstances['categories-chart'].dispose();
    }

    // 只显示前 10 个分类，其余归为"其他"
    const displayData = data.slice(0, 10);
    const otherCount = data.slice(10).reduce((sum, d) => sum + d.value, 0);
    if (otherCount > 0) {
      displayData.push({ name: '其他', value: otherCount });
    }

    const chart = echarts.init(container);
    chartInstances['categories-chart'] = chart;
    const colors = ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE',
                    '#F59E0B', '#FBBF24', '#FCD34D', '#10B981', '#8B5CF6'];
    const option = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(30, 64, 175, 0.9)',
        borderColor: '#3B82F6',
        textStyle: { color: '#fff' },
        formatter: '{b}: {c} ({d}%)'
      },
      series: [{
        type: 'pie',
        radius: ['30%', '55%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          color: '#1E3A8A',
          fontSize: 11,
          lineHeight: 16
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 15
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#1E3A8A'
          }
        },
        data: displayData.map((d, i) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: colors[i % colors.length] }
        }))
      }]
    };
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
    console.log('Categories chart rendered successfully');
  }

  // 更新统计卡片数字
  function updateStatCards(data) {
    console.log('Updating stat cards with data:', data);

    // 获取所有统计卡片
    const statCards = document.querySelectorAll('.prism-stat-value');
    console.log('Found stat cards:', statCards.length);

    // 更新文章总数 (第1个卡片)
    if (statCards[0]) {
      animateNumber(statCards[0], data.total || 0);
      console.log('Updated total posts:', data.total);
    }

    // 更新标签数量 (第2个卡片)
    if (statCards[1]) {
      animateNumber(statCards[1], data.tags ? data.tags.length : 0);
      console.log('Updated tags count:', data.tags ? data.tags.length : 0);
    }

    // 更新分类数量 (第3个卡片)
    if (statCards[2]) {
      animateNumber(statCards[2], data.categories ? data.categories.length : 0);
      console.log('Updated categories count:', data.categories ? data.categories.length : 0);
    }

    // 更新总字数 (第4个卡片) - 使用网站信息卡片中的字数作为备用
    if (statCards[3]) {
      const wordCount = data.totalWords || 0;
      animateNumber(statCards[3], Math.round(wordCount / 1000));
      console.log('Updated total words:', wordCount);
    }
  }

  // 数字动画
  function animateNumber(element, target) {
    const duration = 1500;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * easeOut);

      element.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // 存储图表实例，用于 Pjax 切换时销毁
  const chartInstances = {};

  // 销毁已有图表实例
  function disposeCharts() {
    Object.keys(chartInstances).forEach(id => {
      if (chartInstances[id]) {
        chartInstances[id].dispose();
        delete chartInstances[id];
      }
    });
  }

  // 初始化图表
  function initCharts() {
    console.log('=== Charts Debug Info ===');
    console.log('document.readyState:', document.readyState);
    console.log('typeof echarts:', typeof echarts);
    console.log('ECharts version:', echarts ? echarts.version : 'NOT LOADED');

    // 检查 ECharts 是否加载
    if (typeof echarts === 'undefined') {
      console.warn('ECharts not loaded yet, retrying...');
      setTimeout(initCharts, 200);
      return;
    }

    // 检查 DOM 元素是否存在
    const postsChart = document.getElementById('posts-chart');
    const tagsChart = document.getElementById('tags-chart');
    const categoriesChart = document.getElementById('categories-chart');

    if (!postsChart || !tagsChart || !categoriesChart) {
      console.warn('Chart containers not ready, retrying...');
      console.log('posts-chart:', !!postsChart);
      console.log('tags-chart:', !!tagsChart);
      console.log('categories-chart:', !!categoriesChart);
      setTimeout(initCharts, 200);
      return;
    }

    console.log('All conditions met, loading data...');

    // 销毁旧图表实例，避免 Pjax 切换后无法获取元素
    disposeCharts();

    // 等待 DOM 完全渲染
    return new Promise(resolve => setTimeout(resolve, 50)).then(() => {

    // 加载图表数据
    fetch('/charts-data.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Charts data loaded successfully:', data);

        // 渲染图表
        renderPostsChart(data.posts);
        renderTagsChart(data.tags);
        renderCategoriesChart(data.categories);
        updateStatCards(data);

        // 隐藏骨架屏
        document.querySelectorAll('.prism-skeleton').forEach(el => {
          el.classList.add('hidden');
        });

        // 图表渲染后确保尺寸正确
        setTimeout(() => {
          Object.values(chartInstances).forEach(chart => {
            if (chart) chart.resize();
          });
        }, 100);
      })
      .catch(err => {
        console.error('Failed to load charts data:', err);
        // 隐藏骨架屏即使加载失败
        document.querySelectorAll('.prism-skeleton').forEach(el => {
          el.classList.add('hidden');
        });
      });
    }); // 关闭 Promise
  }

  // 页面加载完成后初始化
  if (document.readyState === 'complete') {
    // 页面已完全加载
    setTimeout(initCharts, 100);
  } else if (document.readyState === 'interactive') {
    // DOM 已加载，但资源可能还在加载
    window.addEventListener('load', initCharts);
  } else {
    // 页面还在加载中
    window.addEventListener('load', initCharts);
  }

  // Pjax 支持
  document.addEventListener('pjax:complete', function() {
    // 检查当前页面是否包含图表容器
    const postsChart = document.getElementById('posts-chart');
    if (postsChart) {
      // 页面包含图表，等待 DOM 稳定后初始化
      setTimeout(initCharts, 300);
    }
  });

})();
