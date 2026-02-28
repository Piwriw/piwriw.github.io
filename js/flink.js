/**
 * ECharts Dashboard Style Friends Link Page
 * Data Visualization Inspired Interactive Features
 */

(function() {
  'use strict';

  function initEChartsFlink() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initEChartsFlink);
      return;
    }

    const flinkContainer = document.querySelector('#article-container');
    if (!flinkContainer) return;

    const isFlinkPage = document.querySelector('.flink') ||
                        location.pathname.includes('/link/');

    if (!isFlinkPage) return;

    // Add container class
    flinkContainer.classList.add('flink-container');

    // Restructure cards
    restructureCards();

    // Create stats dashboard
    createStatsDashboard(flinkContainer);

    // Initialize scroll animations
    initScrollAnimations();
  }

  function restructureCards() {
    const cards = document.querySelectorAll('.flink-list-item');

    cards.forEach(card => {
      // Check if already restructured
      if (card.querySelector('.flink-item-info')) return;

      const icon = card.querySelector('.flink-item-icon');
      const name = card.querySelector('.flink-item-name');
      const desc = card.querySelector('.flink-item-desc');
      const link = card.querySelector('a');

      if (icon && name) {
        // Create info wrapper
        const info = document.createElement('div');
        info.className = 'flink-item-info';

        info.appendChild(name);
        if (desc) {
          info.appendChild(desc);
        }

        card.appendChild(info);
      }
    });
  }

  function createStatsDashboard(flinkContainer) {
    if (flinkContainer.querySelector('.flink-stats')) return;

    const flinkLists = document.querySelectorAll('.flink-list');
    let totalLinks = 0;
    let totalCategories = flinkLists.length;

    flinkLists.forEach(list => {
      const items = list.querySelectorAll('.flink-list-item');
      totalLinks += items.length;
    });

    const statsData = [
      { label: 'Total Friends', value: totalLinks, type: 'primary' },
      { label: 'Categories', value: totalCategories, type: '' },
      { label: 'Links', value: totalLinks, type: '' }
    ];

    const statsContainer = document.createElement('div');
    statsContainer.className = 'flink-stats';

    statsData.forEach((stat, index) => {
      const card = document.createElement('div');
      card.className = `flink-stat-card ${stat.type}`;
      card.style.animationDelay = `${index * 0.1}s`;
      card.innerHTML = `
        <div class="flink-stat-label">${stat.label}</div>
        <div class="flink-stat-value ${stat.type}">${stat.value}</div>
      `;
      statsContainer.appendChild(card);
    });

    const flink = flinkContainer.querySelector('.flink');
    if (flink) {
      flink.insertBefore(statsContainer, flink.firstChild);
    }
  }

  /**
   * Scroll-triggered animations using Intersection Observer
   */
  function initScrollAnimations() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Observe friend cards
    const cards = document.querySelectorAll('.flink-list-item:not(.animate-ready)');
    cards.forEach((card, index) => {
      card.classList.add('animate-ready');
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      card.style.transitionDelay = `${index * 0.05}s`;
    });

    // Observe category sections
    const categories = document.querySelectorAll('.flink-list:not(.animate-ready)');
    categories.forEach((category, index) => {
      category.classList.add('animate-ready');
      category.style.opacity = '0';
      category.style.transform = 'translateY(20px)';
      category.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      category.style.transitionDelay = `${index * 0.15}s`;
    });

    // Create Intersection Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe all cards and categories
    document.querySelectorAll('.flink-list-item.animate-ready, .flink-list.animate-ready').forEach(el => {
      observer.observe(el);
    });

    // Re-observe after PJAX navigation
    document.querySelectorAll('.flink-list-item, .flink-list').forEach(el => {
      if (!el.classList.contains('animate-ready')) {
        observer.observe(el);
      }
    });
  }

  function init() {
    const isFlinkPage = document.querySelector('.flink') ||
                       location.pathname.includes('/link/');

    if (isFlinkPage) {
      initEChartsFlink();
    }
  }

  init();
  document.addEventListener('pjax:complete', init);
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      init();
    }
  });
})();
