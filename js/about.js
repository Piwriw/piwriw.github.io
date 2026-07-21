/* Progressive enhancement for the About page. */

(function() {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function initAboutPage() {
    const root = document.querySelector('.page.type-about');
    const header = document.querySelector('#page-header');
    const siteInfo = header?.querySelector('#page-site-info');
    if (!root || !header || !siteInfo) return;

    if (header.dataset.aboutHeroEnhanced !== 'true') {
      header.classList.add('about-page-hero');
      siteInfo.innerHTML = `
        <div class="about-hero-content">
          <p class="about-hero-kicker"><span>PERSONAL ARCHIVE</span><i aria-hidden="true"></i><span>JOohwan</span></p>
          <h1 id="site-title">Joohwan</h1>
          <p class="about-hero-lede">后端工程师，云原生实践者，也是一个持续写作的人。</p>
          <div class="about-hero-meta" aria-label="个人信息">
            <span>GO / CLOUD NATIVE</span>
            <span>杭州 / 中国</span>
          </div>
        </div>
      `;

      const scrollLink = document.createElement('a');
      scrollLink.className = 'about-hero-scroll';
      scrollLink.href = '#about-intro';
      scrollLink.title = '浏览个人档案';
      scrollLink.setAttribute('aria-label', '浏览个人档案');
      scrollLink.innerHTML = '<i class="fas fa-arrow-down" aria-hidden="true"></i>';
      scrollLink.addEventListener('click', event => {
        event.preventDefault();
        scrollToElement(document.getElementById('about-intro'));
      });
      header.appendChild(scrollLink);
      header.dataset.aboutHeroEnhanced = 'true';
    }

    initReveal(root);
    initSectionNav(root);
  }

  function initReveal(root) {
    const elements = Array.from(root.querySelectorAll('.about-reveal'));
    if (!elements.length) return;

    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      elements.forEach(element => element.classList.add('is-visible'));
      return;
    }

    if (root._aboutRevealObserver) {
      root._aboutRevealObserver.disconnect();
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });

    elements.forEach(element => observer.observe(element));
    root._aboutRevealObserver = observer;
  }

  function initSectionNav(root) {
    const nav = root.querySelector('.about-section-nav');
    if (!nav) return;

    const links = Array.from(nav.querySelectorAll('[data-about-section]'));
    const sections = links
      .map(link => document.getElementById(link.dataset.aboutSection))
      .filter(Boolean);
    if (!links.length || !sections.length) return;

    if (window._aboutSectionScrollHandler) {
      window.removeEventListener('scroll', window._aboutSectionScrollHandler);
      window.removeEventListener('resize', window._aboutSectionScrollHandler);
    }

    function setActiveSection(id) {
      links.forEach(link => {
        const active = link.dataset.aboutSection === id;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }

    function updateSectionState() {
      let activeId = sections[0].id;
      const activationLine = Math.min(220, window.innerHeight * 0.34);

      sections.forEach(section => {
        if (section.getBoundingClientRect().top <= activationLine) {
          activeId = section.id;
        }
      });

      const maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, (window.scrollY - root.offsetTop) / maxScroll));
      nav.style.setProperty('--about-progress', progress.toFixed(4));
      setActiveSection(activeId);
    }

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateSectionState();
        ticking = false;
      });
    };

    if (nav.dataset.aboutNavReady !== 'true') {
      nav.addEventListener('click', event => {
        const link = event.target.closest('a[data-about-section]');
        if (!link) return;
        event.preventDefault();
        scrollToElement(document.getElementById(link.dataset.aboutSection));
      });
      nav.dataset.aboutNavReady = 'true';
    }

    window._aboutSectionScrollHandler = handleScroll;
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    updateSectionState();
  }

  function scrollToElement(target) {
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAboutPage, { once: true });
  } else {
    initAboutPage();
  }

  document.addEventListener('pjax:complete', initAboutPage);
})();
