/**
 * ECharts Dashboard Style Archive Timeline
 * Data Visualization Inspired Interactive Features
 */

(function() {
  'use strict';

  const CONFIG = {
    scrollThreshold: 0.1,
    staggerDelay: 40,
    smoothScrollDuration: 800
  };

  function initEChartsArchive() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initEChartsArchive);
      return;
    }

    const archiveContainer = document.querySelector('#archive');
    if (!archiveContainer) return;

    const articleSort = archiveContainer.querySelector('.article-sort');
    if (!articleSort) return;

    // Add container structure
    addContainerStructure(archiveContainer, articleSort);

    // Collect year data
    const years = collectYearData(articleSort);

    // Create stats dashboard
    createStatsDashboard(years, archiveContainer);

    // Create timeline navigation
    createTimelineNav(years, archiveContainer);

    // Enhance year headers
    enhanceYearHeaders(years);

    // Add article decorations
    addArticleDecorations();

    // Initialize collapse functionality
    initCollapseFunctionality();

    // Initialize scroll spy
    initScrollSpy();

    // Initialize scroll animations
    initScrollAnimations();
  }

  function addContainerStructure(archiveContainer, articleSort) {
    // Check if already wrapped
    if (archiveContainer.querySelector('.archive-container')) return;

    // Create main container
    const container = document.createElement('div');
    container.className = 'archive-container';

    // Move article-sort to container
    const contentArea = document.createElement('div');
    contentArea.className = 'archive-content';

    const articlesArea = document.createElement('div');
    articlesArea.className = 'archive-articles';

    // Move article-sort to articles area
    articlesArea.appendChild(articleSort);
    contentArea.appendChild(articlesArea);

    container.appendChild(contentArea);
    archiveContainer.appendChild(container);

    // Move title if exists
    const title = archiveContainer.querySelector('.article-sort-title');
    if (title) {
      container.insertBefore(title, contentArea);
    }
  }

  function collectYearData(articleSort) {
    const yearItems = articleSort.querySelectorAll('.article-sort-item.year');
    const years = [];

    yearItems.forEach(yearItem => {
      const yearText = yearItem.textContent.trim();
      const year = parseInt(yearText);
      if (!isNaN(year)) {
        years.push({
          year: year,
          element: yearItem,
          articles: []
        });
      }
    });

    years.sort((a, b) => b.year - a.year);

    // Count articles per year
    let currentYear = null;
    let currentArticles = [];

    const allItems = articleSort.querySelectorAll('.article-sort-item');
    allItems.forEach(item => {
      if (item.classList.contains('year')) {
        if (currentYear && currentArticles.length > 0) {
          const yearData = years.find(y => y.year === currentYear);
          if (yearData) {
            yearData.articles = currentArticles;
          }
        }
        currentYear = parseInt(item.textContent.trim());
        currentArticles = [];
      } else if (!item.classList.contains('year')) {
        currentArticles.push(item);
      }
    });

    if (currentYear && currentArticles.length > 0) {
      const yearData = years.find(y => y.year === currentYear);
      if (yearData) {
        yearData.articles = currentArticles;
      }
    }

    return years;
  }

  function createStatsDashboard(years, archiveContainer) {
    // Calculate stats
    const totalArticles = years.reduce((sum, y) => sum + y.articles.length, 0);
    const totalYears = years.length;
    const currentYear = new Date().getFullYear();
    const articlesThisYear = years.find(y => y.year === currentYear)?.articles.length || 0;
    const avgArticlesPerYear = totalYears > 0 ? Math.round(totalArticles / totalYears) : 0;

    const statsData = [
      { label: 'Total Posts', value: totalArticles, type: 'primary' },
      { label: 'Years', value: totalYears, type: '' },
      { label: 'This Year', value: articlesThisYear, type: 'accent' },
      { label: 'Avg/Year', value: avgArticlesPerYear, type: '' }
    ];

    // Create stats HTML
    const statsContainer = document.createElement('div');
    statsContainer.className = 'archive-stats';

    statsData.forEach((stat, index) => {
      const card = document.createElement('div');
      card.className = `stat-card ${stat.type}`;
      card.style.animationDelay = `${index * 0.1}s`;
      card.innerHTML = `
        <div class="stat-label">${stat.label}</div>
        <div class="stat-value ${stat.type}">${stat.value}</div>
      `;
      statsContainer.appendChild(card);
    });

    // Insert after title
    const container = archiveContainer.querySelector('.archive-container');
    const title = container.querySelector('.article-sort-title');
    const content = container.querySelector('.archive-content');

    if (content) {
      container.insertBefore(statsContainer, content);
    }
  }

  function createTimelineNav(years, archiveContainer) {
    const content = archiveContainer.querySelector('.archive-content');
    if (!content) return;

    const sidebar = document.createElement('aside');
    sidebar.className = 'archive-timeline';
    sidebar.innerHTML = `
      <div class="timeline-header">
        <h2 class="timeline-title">Timeline</h2>
        <p class="timeline-subtitle">Navigate by year</p>
      </div>
      <nav id="archive-timeline-nav" class="timeline-nav"></nav>
    `;

    content.insertBefore(sidebar, content.firstChild);

    const timelineNav = document.getElementById('archive-timeline-nav');
    if (!timelineNav) return;

    years.forEach((yearData) => {
      const link = document.createElement('a');
      link.href = `#year-${yearData.year}`;
      link.className = 'timeline-link';
      link.setAttribute('data-year', yearData.year);

      link.innerHTML = `
        <span class="timeline-year">${yearData.year}</span>
        <span class="timeline-count">${yearData.articles.length}</span>
      `;

      link.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.getElementById(`year-${yearData.year}`);
        if (target) {
          smoothScrollTo(target, CONFIG.smoothScrollDuration);
        }
      });

      timelineNav.appendChild(link);
    });
  }

  function enhanceYearHeaders(years) {
    const yearItems = document.querySelectorAll('.article-sort-item.year');

    yearItems.forEach((yearItem) => {
      const yearText = yearItem.textContent.trim();
      const year = parseInt(yearText);
      if (isNaN(year)) return;

      if (yearItem.classList.contains('archive-year-header')) return;

      if (!yearItem.id) {
        yearItem.id = `year-${year}`;
      }
      yearItem.classList.add('archive-year-header');

      const articleCount = years.find(y => y.year === year)?.articles.length || 0;

      yearItem.innerHTML = `
        <div class="year-marker">
          <span class="year-dot"></span>
        </div>
        <span class="year-title">${year}</span>
        <span class="year-count">${articleCount} posts</span>
        <button class="year-toggle" data-year="${year}" aria-expanded="true" aria-label="Toggle ${year} articles">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      `;
    });
  }

  function addArticleDecorations() {
    const articles = document.querySelectorAll('.article-sort-item:not(.year)');

    articles.forEach((article, index) => {
      // Add info wrapper if not exists
      if (!article.querySelector('.article-sort-item-info')) {
        const img = article.querySelector('.article-sort-item-img');
        const title = article.querySelector('.article-sort-item-title');
        const time = article.querySelector('.article-sort-item-time');

        const info = document.createElement('div');
        info.className = 'article-sort-item-info';

        if (time) info.appendChild(time);
        if (title) info.appendChild(title);

        // Create tags container if not exists
        let tags = article.querySelector('.article-sort-item-tags');
        if (!tags) {
          tags = document.createElement('div');
          tags.className = 'article-sort-item-tags';
          // Look for tags in content
          const existingTags = article.querySelectorAll('.article-tag, .tag-link');
          existingTags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'article-tag';
            tagSpan.textContent = tag.textContent.trim();
            tags.appendChild(tagSpan);
          });
          if (tags.children.length > 0) {
            info.appendChild(tags);
          }
        } else {
          info.appendChild(tags);
        }

        if (img && title) {
          article.insertBefore(info, title);
        }
      }
    });
  }

  function initCollapseFunctionality() {
    const yearWrappers = document.querySelectorAll('.archive-year-header');

    yearWrappers.forEach(wrapper => {
      if (wrapper.dataset.initialized) return;

      const toggleBtn = wrapper.querySelector('.year-toggle');
      const yearItem = wrapper.closest('.article-sort-item.year');
      const yearContent = getNextUntil(yearItem, '.article-sort-item.year');

      if (toggleBtn && yearContent && yearContent.length > 0) {
        let contentContainer = yearItem.nextElementSibling;
        if (contentContainer && contentContainer.classList.contains('year-content')) {
          wrapper.addEventListener('click', handleToggle);
          wrapper.dataset.initialized = 'true';
          return;
        }

        contentContainer = document.createElement('div');
        contentContainer.className = 'year-content';
        contentContainer.setAttribute('data-year', toggleBtn.getAttribute('data-year'));

        yearContent.forEach(article => {
          if (!article.classList.contains('year')) {
            contentContainer.appendChild(article);
          }
        });

        yearItem.parentNode.insertBefore(contentContainer, yearItem.nextSibling);

        wrapper.addEventListener('click', handleToggle);
        wrapper.dataset.initialized = 'true';
      }
    });

    function handleToggle(e) {
      if (e.target.closest('.year-toggle') || e.target.closest('.archive-year-header')) {
        const wrapper = this;
        const toggleBtn = wrapper.querySelector('.year-toggle');
        const yearItem = wrapper.closest('.article-sort-item.year');
        const contentContainer = yearItem.nextElementSibling;

        if (!contentContainer || !contentContainer.classList.contains('year-content')) return;

        const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-expanded', !isExpanded);
        contentContainer.classList.toggle('collapsed', isExpanded);
        toggleBtn.classList.toggle('rotated', isExpanded);

        if (!contentContainer.classList.contains('collapsed')) {
          setTimeout(() => {
            contentContainer.querySelectorAll('.article-sort-item:not(.year)').forEach((item) => {
              item.classList.add('in-view');
            });
          }, 100);
        }
      }
    }
  }

  function getNextUntil(element, selector) {
    const nodes = [];
    let current = element.nextElementSibling;

    while (current) {
      if (current.matches && current.matches(selector)) break;
      nodes.push(current);
      current = current.nextElementSibling;
    }

    return nodes;
  }

  function initScrollSpy() {
    const yearHeaders = document.querySelectorAll('.archive-year-header');
    const timelineLinks = document.querySelectorAll('.timeline-link');

    if (yearHeaders.length === 0 || timelineLinks.length === 0) return;

    const clearActiveStates = () => {
      yearHeaders.forEach(header => header.classList.remove('active'));
      timelineLinks.forEach(link => link.classList.remove('active'));
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const year = entry.target.querySelector('.year-toggle')?.getAttribute('data-year');
          if (year) {
            clearActiveStates();

            const activeLink = document.querySelector(`.timeline-link[data-year="${year}"]`);
            if (activeLink) {
              activeLink.classList.add('active');
            }

            entry.target.classList.add('active');
          }
        }
      });
    }, {
      rootMargin: '-10% 0px -90% 0px',
      threshold: 0.1
    });

    yearHeaders.forEach(header => observer.observe(header));
  }

  function initScrollAnimations() {
    const articles = document.querySelectorAll('.article-sort-item:not(.year)');

    if (articles.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: CONFIG.scrollThreshold
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.classList.contains('in-view')) {
          entry.target.classList.add('in-view');
        }
      });
    }, observerOptions);

    articles.forEach((article, index) => {
      article.style.transitionDelay = `${(index % 10) * CONFIG.staggerDelay}ms`;
      observer.observe(article);
    });
  }

  function smoothScrollTo(target, duration) {
    const targetPosition = target.getBoundingClientRect().top + window.scrollY - 100;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      // Ease-out cubic
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(1 - progress, 3);

      window.scrollTo(0, startPosition + distance * easeProgress);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    }

    requestAnimationFrame(animation);
  }

  // Initialize
  function init() {
    const isArchivePage = document.querySelector('.article-sort') ||
                        location.pathname.includes('/archives/');

    if (isArchivePage) {
      initEChartsArchive();
    }
  }

  init();

  // Pjax support
  document.addEventListener('pjax:complete', init);

  // Re-init on visibility change
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      init();
    }
  });
})();
