/**
 * Pure JavaScript Smooth Scroll-Based Video Frame Animation & Responsive Interactions
 * Richa - MERN Stack Developer
 * Optimized for Phones, Tablets, Laptops & Desktops
 * Total Frames: 190 WebP frames (1280x720)
 */

(function () {
  'use strict';

  // --- Configuration ---
  const TOTAL_FRAMES = 190;
  const FRAME_PREFIX = 'frames/frame_';
  const FRAME_EXT = '.webp';
  const LERP_SPEED = 0.085; // Butter-smooth momentum interpolation
  const VIDEO_WIDTH = 1280;
  const VIDEO_HEIGHT = 720;
  const VIDEO_ASPECT = VIDEO_WIDTH / VIDEO_HEIGHT;

  // --- DOM Elements ---
  const canvas = document.getElementById('animation-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const loaderOverlay = document.getElementById('loader');
  const loaderPercentage = document.getElementById('loader-percentage');
  const loaderBarFill = document.getElementById('loader-bar-fill');
  const scrollHint = document.getElementById('scroll-hint');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const navLinks = document.querySelectorAll('.nav-link');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
  const sections = document.querySelectorAll('section[id]');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-menu-drawer');

  // --- State Variables ---
  const images = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let targetProgress = 0;
  let currentProgress = 0;
  let isAnimating = false;
  let hasScrolled = false;
  let lastDrawnIndex = -1;

  function getFramePath(index) {
    const num = String(index + 1).padStart(4, '0');
    return `${FRAME_PREFIX}${num}${FRAME_EXT}`;
  }

  // Calculate scroll progress [0.0 -> 1.0] across full document height
  function calculateProgress() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
    const clientHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const maxScroll = Math.max(1, scrollHeight - clientHeight);
    return Math.min(Math.max(scrollTop / maxScroll, 0), 1);
  }

  // Handle Retina DPR & Responsive Resizing
  function handleResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = w < 768 ? 'medium' : 'high';
      lastDrawnIndex = -1;
      drawFrame(Math.round(currentProgress * (TOTAL_FRAMES - 1)));
    }
  }

  // Draw frame with object-fit: cover and adaptive composition
  function drawFrame(targetIndex) {
    const clamped = Math.max(0, Math.min(TOTAL_FRAMES - 1, targetIndex));

    let img = images[clamped];
    // If targeted frame isn't loaded yet, fallback to closest loaded frame
    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const prev = clamped - offset;
        const next = clamped + offset;
        if (prev >= 0 && images[prev] && images[prev].complete && images[prev].naturalWidth > 0) {
          img = images[prev];
          break;
        }
        if (next < TOTAL_FRAMES && images[next] && images[next].complete && images[next].naturalWidth > 0) {
          img = images[next];
          break;
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;
    if (lastDrawnIndex === clamped && canvas.dataset.w == canvas.width && canvas.dataset.h == canvas.height) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const canvasAspect = cw / ch;

    let dw, dh, ox, oy;

    if (canvasAspect > VIDEO_ASPECT) {
      // Screen is wider than video (16:9 ultrawide / wide desktop)
      dw = cw;
      dh = cw / VIDEO_ASPECT;
      ox = 0;
      oy = (ch - dh) * 0.32; // Slight vertical bias to keep face in upper third
    } else {
      // Screen is narrower (laptops, tablets, mobile)
      dh = ch;
      dw = ch * VIDEO_ASPECT;

      // Adaptive horizontal framing per device:
      // Laptops / Desktops (>= 1024px): Shift subject to right (74%) to leave left 45% clear for text
      // Tablets (768px - 1023px): Subtle right bias (60%)
      // Phones (< 768px): Centered (50%)
      const screenW = window.innerWidth;
      if (screenW >= 1024) {
        ox = (cw - dw) * 0.74;
      } else if (screenW >= 768) {
        ox = (cw - dw) * 0.60;
      } else {
        ox = (cw - dw) * 0.50;
      }
      oy = 0;
    }

    ctx.drawImage(img, ox, oy, dw, dh);
    lastDrawnIndex = clamped;
    canvas.dataset.w = cw;
    canvas.dataset.h = ch;
  }

  // Smooth LERP Render Loop
  function render() {
    const diff = targetProgress - currentProgress;

    if (Math.abs(diff) > 0.0002) {
      currentProgress += diff * LERP_SPEED;
      const frameIdx = Math.round(currentProgress * (TOTAL_FRAMES - 1));
      drawFrame(frameIdx);
      requestAnimationFrame(render);
      isAnimating = true;
    } else {
      currentProgress = targetProgress;
      drawFrame(Math.round(currentProgress * (TOTAL_FRAMES - 1)));
      isAnimating = false;
    }
  }

  function triggerRender() {
    if (!isAnimating) {
      isAnimating = true;
      requestAnimationFrame(render);
    }
  }

  // Update active navigation link based on scroll position (ScrollSpy)
  function updateScrollSpy() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    const windowHeight = window.innerHeight;
    const scrollHeight = document.documentElement.scrollHeight;

    function setActiveLink(activeId) {
      navLinks.forEach((link) => {
        if (link.getAttribute('href') === `#${activeId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
      mobileNavLinks.forEach((link) => {
        if (link.getAttribute('href') === `#${activeId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }

    // Bottom of the page check
    if (scrollY + windowHeight >= scrollHeight - 40) {
      const lastSection = sections[sections.length - 1];
      if (lastSection) setActiveLink(lastSection.getAttribute('id'));
      return;
    }

    const scrollPos = scrollY + 220;
    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        setActiveLink(id);
      }
    });
  }

  // Scroll Event Handler
  function onScroll() {
    targetProgress = calculateProgress();

    // Top progress bar update
    if (progressBarFill) {
      progressBarFill.style.width = (targetProgress * 100).toFixed(2) + '%';
    }

    // Scroll hint dismiss
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (!hasScrolled && scrollTop > 20) {
      hasScrolled = true;
      if (scrollHint) {
        scrollHint.classList.add('hidden');
      }
    }

    updateScrollSpy();
    triggerRender();
  }

  function hideLoader() {
    if (loaderOverlay && !loaderOverlay.classList.contains('hidden')) {
      loaderOverlay.classList.add('hidden');
    }
  }

  // Background Streaming Preloader
  function startLoading() {
    // 1. Load frame 1 immediately
    const firstImg = new Image();
    firstImg.src = getFramePath(0);
    firstImg.onload = () => {
      images[0] = firstImg;
      loadedCount++;
      handleResize();
      drawFrame(0);
      setTimeout(hideLoader, 150);
    };

    // 2. Load all 190 frames concurrently with batches
    const BATCH_SIZE = 16;
    let nextIndex = 1;

    function loadNext() {
      if (nextIndex >= TOTAL_FRAMES) return;

      const idx = nextIndex++;
      const img = new Image();
      img.src = getFramePath(idx);

      const done = () => {
        images[idx] = img;
        loadedCount++;

        const pct = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
        if (loaderPercentage) loaderPercentage.textContent = pct + '%';
        if (loaderBarFill) loaderBarFill.style.width = pct + '%';

        if (loadedCount >= 10) {
          hideLoader();
        }

        loadNext();
      };

      img.onload = done;
      img.onerror = done;
    }

    for (let i = 0; i < BATCH_SIZE; i++) {
      loadNext();
    }
  }

  // Mobile Menu Drawer Handler
  function setupMobileMenu() {
    if (!mobileMenuBtn || !mobileDrawer) return;

    function toggleMenu(open) {
      const isOpen = open !== undefined ? open : !mobileDrawer.classList.contains('open');
      if (isOpen) {
        mobileDrawer.classList.add('open');
        mobileMenuBtn.classList.add('active');
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      } else {
        mobileDrawer.classList.remove('open');
        mobileMenuBtn.classList.remove('active');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    }

    mobileMenuBtn.addEventListener('click', () => toggleMenu());

    // Close menu when clicking anywhere on drawer background
    mobileDrawer.addEventListener('click', (e) => {
      if (e.target === mobileDrawer) {
        toggleMenu(false);
      }
    });

    // Close menu when clicking any mobile link
    const drawerLinks = mobileDrawer.querySelectorAll('a');
    drawerLinks.forEach((link) => {
      link.addEventListener('click', () => toggleMenu(false));
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer.classList.contains('open')) {
        toggleMenu(false);
      }
    });
  }

  // Smooth click scroll for all navigation links
  function setupNavClick() {
    const allLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    allLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
          const targetElem = document.querySelector(targetId);
          if (targetElem) {
            e.preventDefault();
            targetElem.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }

  // --- Initialize ---
  function init() {
    handleResize();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 100);
    });
    window.addEventListener('wheel', onScroll, { passive: true });
    window.addEventListener('touchmove', onScroll, { passive: true });

    setupMobileMenu();
    setupNavClick();
    onScroll();
    startLoading();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
