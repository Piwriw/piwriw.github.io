/**
 * Categories Page Enhancement - Modern Bento Grid v2.0
 * Refined card-based layout with glassmorphism
 */

(function() {
  'use strict';

  // Only run on categories page
  // Check if the page has type-categories class on body-wrap or page element
  const bodyWrap = document.getElementById('body-wrap');
  const page = document.getElementById('page');
  const isCategoriesPage = bodyWrap?.classList.contains('type-categories') ||
                           page?.classList.contains('type-categories');

  if (!isCategoriesPage) {
    return;
  }

  // Category icons mapping (emoji-style)
  const CATEGORY_ICONS = {
    // Tech & Programming
    'go': '🔷',
    'golang': '🔷',
    'python': '🐍',
    'javascript': '💛',
    'typescript': '💙',
    'java': '☕',
    'rust': '🦀',
    'cpp': '⚡',
    'c++': '⚡',
    'web': '🌐',
    'frontend': '🎨',
    'backend': '⚙️',
    'fullstack': '🔄',

    // Cloud & DevOps
    'kubernetes': '☸️',
    'k8s': '☸️',
    'docker': '🐳',
    'cloud': '☁️',
    'aws': '🟠',
    'devops': '🔧',
    'ci': '🔄',
    'cd': '🚀',
    'prometheus': '📊',
    'monitoring': '📈',

    // Development Tools
    'tools': '🛠️',
    'git': '📚',
    'vim': '✏️',
    'ide': '💻',
    'editor': '✏️',

    // Knowledge & Learning
    'basic': '📖',
    'basics': '📖',
    'learning': '📚',
    'tutorial': '📝',
    'meeting': '💼',
    'interview': '🎯',

    // Creative
    'poem': '🎭',
    'poetry': '🎭',
    'art': '🎨',
    'design': '🎨',
    'creative': '✨',

    // Life & Others
    'life': '🌱',
    'thought': '💭',
    'experience': '🌟',
    'travel': '✈️',
    'food': '🍜',
    'music': '🎵',
    'game': '🎮',
    'movie': '🎬',
    'book': '📚',

    // Default
    'default': '📁'
  };

  // Get icon for category
  function getCategoryIcon(name) {
    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }
    return CATEGORY_ICONS.default;
  }

  /**
   * Initialize the enhancements
   */
  function init() {
    const categoryLists = document.querySelector('.category-lists');
    if (!categoryLists) return;

    // Inject header with search and stats
    injectHeader(categoryLists);

    // Enhance category items with icons
    enhanceCategoryItems();

    // Add toggle buttons to categories with children
    addToggleButtons();

    // Setup event listeners
    setupEventListeners();

    // Calculate and display stats
    updateStats();
  }

  /**
   * Inject search and stats header
   */
  function injectHeader(container) {
    const header = document.createElement('div');
    header.className = 'categories-bento-header';
    header.innerHTML = `
      <div class="categories-search-card">
        <div class="categories-search-wrapper">
          <svg class="categories-search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            class="categories-search-input"
            placeholder="搜索分类..."
            autocomplete="off"
            aria-label="搜索分类"
          />
          <button class="categories-search-clear" aria-label="清除搜索">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div class="categories-stats-grid">
        <div class="categories-stat-card">
          <div class="categories-stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
            </svg>
          </div>
          <div>
            <span class="categories-stat-value" id="categories-total">0</span>
            <span class="categories-stat-label">分类</span>
          </div>
        </div>
        <div class="categories-stat-card">
          <div class="categories-stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <div>
            <span class="categories-stat-value" id="posts-total">0</span>
            <span class="categories-stat-label">文章</span>
          </div>
        </div>
      </div>
    `;

    container.insertBefore(header, container.firstChild);
  }

  /**
   * Enhance category items with icons and better structure
   */
  function enhanceCategoryItems() {
    const items = document.querySelectorAll('.category-list > .category-list-item');

    items.forEach(item => {
      const link = item.querySelector(':scope > .category-list-link');
      if (!link) return;

      const countElement = link.querySelector('.category-list-count');
      const categoryName = countElement
        ? link.textContent.replace(countElement.textContent, '').trim()
        : link.textContent.trim();

      // Create wrapper for name
      const nameWrapper = document.createElement('span');
      nameWrapper.className = 'category-name';

      // Create icon
      const icon = document.createElement('span');
      icon.className = 'category-icon';
      icon.textContent = getCategoryIcon(categoryName);

      // Create name text
      const nameText = document.createElement('span');
      nameText.className = 'category-name-text';
      nameText.textContent = categoryName;

      // Clear and rebuild link content: icon -> count -> name
      link.innerHTML = '';
      link.appendChild(icon);
      // Add count after icon (right side of icon)
      if (countElement) {
        link.appendChild(countElement);
      }
      nameWrapper.appendChild(nameText);
      link.appendChild(nameWrapper);
    });
  }

  /**
   * Add expand/collapse toggle buttons
   */
  function addToggleButtons() {
    const items = document.querySelectorAll('.category-list > .category-list-item');

    items.forEach(item => {
      const hasChildren = item.querySelector('.category-list-child');
      if (!hasChildren) return;

      const link = item.querySelector(':scope > .category-list-link');
      if (!link) return;

      // Create toggle button
      const toggle = document.createElement('button');
      toggle.className = 'category-toggle-btn';
      toggle.setAttribute('aria-label', '展开/折叠');
      toggle.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      `;

      link.appendChild(toggle);

      // Add click handler
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleCategory(item);
      });

      // Also allow clicking the link to toggle (but still navigate)
      link.addEventListener('click', (e) => {
        // If clicking directly on the toggle button, don't navigate
        if (e.target.closest('.category-toggle-btn')) {
          e.preventDefault();
          return;
        }
        // Otherwise, let the link navigate but also toggle
        setTimeout(() => toggleCategory(item), 100);
      });
    });

    // Enhance child items with icons
    enhanceChildItems();
  }

  /**
   * Enhance child category items
   */
  function enhanceChildItems() {
    const childItems = document.querySelectorAll('.category-list-child .category-list-item');

    childItems.forEach(item => {
      const link = item.querySelector('.category-list-link');
      if (!link) return;

      const countElement = link.querySelector('.category-list-count');
      const categoryName = countElement
        ? link.textContent.replace(countElement.textContent, '').trim()
        : link.textContent.trim();

      // Create icon
      const icon = document.createElement('span');
      icon.className = 'category-icon';
      icon.textContent = getCategoryIcon(categoryName);

      // Create wrapper for name
      const nameWrapper = document.createElement('span');
      nameWrapper.className = 'category-name';

      // Create name text
      const nameText = document.createElement('span');
      nameText.className = 'category-name-text';
      nameText.textContent = categoryName;

      // Clear and rebuild link content
      link.innerHTML = '';
      // Clear and rebuild link content: icon -> count -> name
      link.innerHTML = '';
      link.appendChild(icon);
      // Add count after icon (right side of icon)
      if (countElement) {
        link.appendChild(countElement);
      }
      nameWrapper.appendChild(nameText);
      link.appendChild(nameWrapper);
    });
  }

  /**
   * Toggle category expansion with smooth animation
   */
  function toggleCategory(item) {
    const isExpanded = item.classList.contains('expanded');
    const childList = item.querySelector(':scope > .category-list-child');

    if (isExpanded) {
      // Collapse
      if (childList) {
        childList.style.maxHeight = childList.scrollHeight + 'px';
        // Force reflow
        childList.offsetHeight;
        childList.style.maxHeight = '0px';
      }
      item.classList.remove('expanded');
    } else {
      // Expand
      item.classList.add('expanded');
      if (childList) {
        childList.style.maxHeight = '0px';
        // Force reflow
        childList.offsetHeight;
        childList.style.maxHeight = childList.scrollHeight + 'px';
        // Remove inline style after animation completes
        setTimeout(() => {
          if (item.classList.contains('expanded')) {
            childList.style.maxHeight = '';
          }
        }, 400);
      }
    }
  }

  /**
   * Setup all event listeners
   */
  function setupEventListeners() {
    const searchInput = document.querySelector('.categories-search-input');
    const searchClear = document.querySelector('.categories-search-clear');

    if (searchInput) {
      searchInput.addEventListener('input', debounce(handleSearch, 200));
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          handleSearch({ target: { value: '' } });
        }
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
          handleSearch({ target: { value: '' } });
        }
      });
    }
  }

  /**
   * Handle search input with smooth filtering
   */
  function handleSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    const searchClear = document.querySelector('.categories-search-clear');
    const items = document.querySelectorAll('.category-list > .category-list-item');
    const noResults = ensureNoResultsElement();

    // Show/hide clear button
    if (searchClear) {
      searchClear.classList.toggle('visible', query.length > 0);
    }

    let visibleCount = 0;

    items.forEach((item, index) => {
      const nameText = item.querySelector('.category-name-text');
      const categoryName = nameText ? nameText.textContent.trim().toLowerCase() : '';
      const childItems = item.querySelectorAll('.category-list-child .category-list-item');

      let matches = categoryName.includes(query);

      // Also check child categories
      if (!matches && childItems.length > 0) {
        childItems.forEach(child => {
          const childNameText = child.querySelector('.category-name-text');
          const childName = childNameText ? childNameText.textContent.trim().toLowerCase() : '';
          if (childName.includes(query)) {
            matches = true;
            // Auto-expand if matched
            if (!item.classList.contains('expanded')) {
              toggleCategory(item);
            }
          }
        });
      }

      // Show/hide category with animation
      if (matches) {
        item.style.animationDelay = `${index * 50}ms`;
        item.classList.remove('hidden');
        item.style.animation = 'none';
        item.offsetHeight; // Force reflow
        item.style.animation = 'bentoFadeIn 0.4s ease-out forwards';
        visibleCount++;
      } else {
        item.classList.add('hidden');
      }
    });

    // Show no results message
    noResults.classList.toggle('visible', visibleCount === 0 && query.length > 0);
  }

  /**
   * Ensure no results element exists
   */
  function ensureNoResultsElement() {
    let noResults = document.querySelector('.categories-no-results');
    if (!noResults) {
      noResults = document.createElement('div');
      noResults.className = 'categories-no-results';
      noResults.innerHTML = `
        <div class="categories-no-results-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <h3>未找到匹配的分类</h3>
        <p>请尝试其他关键词</p>
      `;
      document.querySelector('.category-lists').appendChild(noResults);
    }
    return noResults;
  }

  /**
   * Calculate and update statistics
   */
  function updateStats() {
    const categoriesTotal = document.getElementById('categories-total');
    const postsTotal = document.getElementById('posts-total');

    if (!categoriesTotal || !postsTotal) return;

    // Count unique categories (top level)
    const topLevelCategories = document.querySelectorAll('.category-list > .category-list-item');
    const categoryCount = topLevelCategories.length;

    // Count total posts
    let postCount = 0;
    const allCounts = document.querySelectorAll('.category-list-count');
    allCounts.forEach(count => {
      const num = parseInt(count.textContent.trim());
      if (!isNaN(num)) {
        postCount += num;
      }
    });

    // Animate the numbers
    animateNumber(categoriesTotal, categoryCount);
    animateNumber(postsTotal, postCount);
  }

  /**
   * Animate number counting with smooth easing
   */
  function animateNumber(element, target) {
    const duration = 800;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    let frame = 0;

    // Easing function (ease-out cubic)
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const counter = setInterval(() => {
      frame++;
      const progress = easeOut(frame / totalFrames);
      const current = Math.round(target * progress);

      element.textContent = current;

      if (frame === totalFrames) {
        clearInterval(counter);
        element.textContent = target;
      }
    }, frameDuration);
  }

  /**
   * Debounce function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();