/**
 * ECharts Dashboard Style Tags Page
 * Data Visualization Inspired Interactive Features
 */

(function() {
  'use strict';

  function initEChartsTags() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initEChartsTags);
      return;
    }

    const tagsContainer = document.querySelector('#tags');
    if (!tagsContainer) return;

    // Wrap content in container
    wrapContent(tagsContainer);

    // Create stats dashboard
    createStatsDashboard(tagsContainer);

    // Enhance tag cloud
    enhanceTagCloud();

    // Add size classes to tags
    addTagSizeClasses();
  }

  function wrapContent(tagsContainer) {
    if (tagsContainer.querySelector('.tags-container')) return;

    const container = document.createElement('div');
    container.className = 'tags-container';

    // Move all children to container
    const children = Array.from(tagsContainer.children);
    children.forEach(child => {
      container.appendChild(child);
    });

    tagsContainer.appendChild(container);
  }

  function createStatsDashboard(tagsContainer) {
    // Collect tag data
    const tagLinks = document.querySelectorAll('.tag-cloud-list a');
    const totalTags = tagLinks.length;

    // Calculate total posts
    let totalPosts = 0;
    tagLinks.forEach(link => {
      const countText = link.querySelector('.tag-count');
      if (countText) {
        totalPosts += parseInt(countText.textContent) || 0;
      }
    });

    // Find most used tag
    let maxCount = 0;
    let mostUsedTag = '';
    tagLinks.forEach(link => {
      const countText = link.querySelector('.tag-count');
      if (countText) {
        const count = parseInt(countText.textContent) || 0;
        if (count > maxCount) {
          maxCount = count;
          mostUsedTag = link.textContent.replace(countText.textContent, '').trim();
        }
      }
    });

    const avgPosts = totalTags > 0 ? Math.round(totalPosts / totalTags) : 0;

    const statsData = [
      { label: 'Total Tags', value: totalTags, type: 'primary' },
      { label: 'Total Posts', value: totalPosts, type: '' },
      { label: 'Avg/Tag', value: avgPosts, type: '' }
    ];

    // Create stats HTML
    const statsContainer = document.createElement('div');
    statsContainer.className = 'tags-stats';

    statsData.forEach((stat, index) => {
      const card = document.createElement('div');
      card.className = `tag-stat-card ${stat.type}`;
      card.style.animationDelay = `${index * 0.1}s`;
      card.innerHTML = `
        <div class="tag-stat-label">${stat.label}</div>
        <div class="tag-stat-value ${stat.type}">${stat.value}</div>
      `;
      statsContainer.appendChild(card);
    });

    // Insert after title
    const container = tagsContainer.querySelector('.tags-container');
    const title = container.querySelector('.tags-title, .page-title');
    const tagCloud = container.querySelector('.tag-cloud-list');

    if (title) {
      title.insertAdjacentElement('afterend', statsContainer);
    } else if (tagCloud) {
      tagCloud.insertAdjacentElement('beforebegin', statsContainer);
    }
  }

  function enhanceTagCloud() {
    const tagCloud = document.querySelector('.tag-cloud-list');
    if (!tagCloud) return;

    // Add container class
    tagCloud.classList.add('tags-cloud');
  }

  function addTagSizeClasses() {
    const tagLinks = document.querySelectorAll('.tag-cloud-list a');

    if (tagLinks.length === 0) return;

    // Get all counts
    const counts = [];
    tagLinks.forEach(link => {
      const countText = link.querySelector('.tag-count');
      if (countText) {
        counts.push(parseInt(countText.textContent) || 0);
      } else {
        counts.push(1);
      }
    });

    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);

    // Assign size classes based on count
    tagLinks.forEach((link, index) => {
      const count = counts[index];
      let sizeClass = 'size-1';

      if (maxCount === minCount) {
        sizeClass = 'size-3';
      } else {
        const ratio = (count - minCount) / (maxCount - minCount);
        if (ratio < 0.2) {
          sizeClass = 'size-1';
        } else if (ratio < 0.4) {
          sizeClass = 'size-2';
        } else if (ratio < 0.6) {
          sizeClass = 'size-3';
        } else if (ratio < 0.8) {
          sizeClass = 'size-4';
        } else {
          sizeClass = 'size-5';
        }
      }

      link.classList.add(sizeClass);
    });
  }

  // Initialize
  function init() {
    const isTagsPage = document.querySelector('.tag-cloud-list') ||
                       document.querySelector('#tags') ||
                       location.pathname.includes('/tags/');

    if (isTagsPage) {
      initEChartsTags();
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
