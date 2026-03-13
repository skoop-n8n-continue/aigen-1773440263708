/* ═══════════════════════════════════════════════
   QUALITY ROOTS — DEALS PROMO ANIMATION
   Engine: GSAP 3
   Concept: "GREEN LIGHT" — Dramatic spotlight deal reveals
   Canvas: 1920 × 1080
   ═══════════════════════════════════════════════ */

gsap.registerPlugin(CustomEase, SplitText, DrawSVGPlugin);

/* ─── CUSTOM EASES ───────────────────────────── */
CustomEase.create('slam',      'M0,0 C0.12,0 0.08,1.15 1,1');
CustomEase.create('slam-soft', 'M0,0 C0.25,0 0.05,1.08 1,1');
CustomEase.create('hard-out',  'M0,0 C0.55,0 0.95,0.85 1,1');

/* ─── CONFIG ─────────────────────────────────── */
const PRODUCTS_PER_CYCLE = 1;   // Solo spotlight — max drama per deal
const CYCLE_DURATION     = 9.8; // seconds per product
const ENTRANCE_END       = 2.8; // when entrance sequence finishes
const IDLE_START         = 2.8;
const EXIT_START         = 8.2; // when exit sequence begins

/* ─── STATE ──────────────────────────────────── */
let PRODUCTS    = [];
let currentBatch = 0;
let tickerTween  = null;

/* ═══════════════════════════════════════════════
   PRODUCT ADAPTATION
   Handles rich product data AND simple format
   ═══════════════════════════════════════════════ */
function adaptProduct(p) {
  const origPrice = parseFloat(p.price) || 0;
  const discPrice = (p.discounted_price != null && p.discounted_price !== '')
    ? parseFloat(p.discounted_price)
    : null;

  const hasDiscount = discPrice !== null && discPrice < origPrice && origPrice > 0;
  const discPercent = hasDiscount
    ? Math.round((1 - discPrice / origPrice) * 100)
    : 0;

  const formatPrice = (val) => {
    if (val == null) return null;
    const n = parseFloat(val);
    return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
  };

  // Derive meta from available fields if no explicit meta
  const metaParts = [];
  if (p.strain_type || p.strain) metaParts.push((p.strain_type || p.strain).toUpperCase());
  if (p.lab_thc_value > 0) metaParts.push(`${p.lab_thc_value}${p.lab_thc_unit || ''} THC`);
  if (p.category) metaParts.push(p.category.toUpperCase());

  return {
    name:            p.name || p.online_title || p.meta || 'Product',
    brand:           (p.brand || '').toUpperCase(),
    originalPrice:   origPrice > 0 ? formatPrice(origPrice) : null,
    salePrice:       hasDiscount ? formatPrice(discPrice) : formatPrice(origPrice),
    discountPercent: hasDiscount ? discPercent : 0,
    savingsAmount:   hasDiscount ? formatPrice(origPrice - discPrice) : null,
    imageUrl:        p.image_url || '',
    strain:          (p.strain_type || p.strain || '').toUpperCase(),
    thc:             p.lab_thc_value > 0 ? `${p.lab_thc_value}${p.lab_thc_unit || ''} THC` : null,
    category:        (p.category || '').toUpperCase(),
    vendor:          (p.vendor || ''),
    hasDiscount,
  };
}

/* ═══════════════════════════════════════════════
   PRODUCT NAME FORMATTING
   Smart line-breaking into max 3 lines
   ═══════════════════════════════════════════════ */
function splitProductName(name) {
  const words  = name.split(' ');
  const lines  = [];
  let   cur    = '';
  const limit  = 18; // ~18 chars per line fits within 820px column

  for (let wi = 0; wi < words.length; wi++) {
    const w       = words[wi];
    const attempt = cur ? `${cur} ${w}` : w;
    if (attempt.length > limit && cur.length > 0) {
      lines.push(cur);
      cur = w;
      if (lines.length >= 3) {
        // Append this word and all remaining onto the last line
        const remaining = words.slice(wi);
        lines[2] += ` ${remaining.join(' ')}`;
        cur = '';
        break;
      }
    } else {
      cur = attempt;
    }
  }
  if (cur) lines.push(cur);

  // Choose font size class based on longest line length
  const maxLen  = Math.max(...lines.map(l => l.length));
  let sizeClass = 'size-xl';               // ≤ 10 chars
  if (maxLen > 10) sizeClass = 'size-lg'; // ≤ 14 chars
  if (maxLen > 14) sizeClass = 'size-md'; // ≤ 18 chars
  if (maxLen > 18) sizeClass = 'size-sm'; // ≤ 23 chars
  if (maxLen > 23) sizeClass = 'size-xs'; // any length

  return { lines, sizeClass };
}

/* ═══════════════════════════════════════════════
   RENDER PRODUCT BATCH
   ═══════════════════════════════════════════════ */
function renderBatch(products) {
  const container = document.getElementById('products-container');
  container.innerHTML = '';

  products.forEach((product) => {
    const { lines, sizeClass } = splitProductName(product.name);

    const nameHtml = lines
      .map(line => `<div class="product-name-line">${line.toUpperCase()}</div>`)
      .join('');

    const hasDiscount = product.hasDiscount;

    const el = document.createElement('div');
    el.className = 'product';
    el.innerHTML = `
      <div class="product-left">

        <div class="brand-name">${product.brand}</div>

        <div class="product-name-wrap ${sizeClass}">${nameHtml}</div>

        <div class="price-block">
          ${hasDiscount ? `
            <div class="price-was-row">
              <span class="was-label">WAS</span>
              <div class="original-price-box">
                <span class="original-price">${product.originalPrice}</span>
                <div class="strike-bar"></div>
              </div>
            </div>
          ` : ''}
          <div class="price-now-row">
            <span class="now-label">${hasDiscount ? 'NOW' : 'ONLY'}</span>
            <span class="sale-price">${product.salePrice || ''}</span>
          </div>
          ${hasDiscount ? `
            <div class="discount-badge">
              <span class="discount-text">${product.discountPercent}%</span>
              <span class="discount-sub">OFF</span>
            </div>
          ` : ''}
        </div>

        <div class="product-tags">
          ${product.strain   ? `<div class="tag tag-strain">${product.strain}</div>` : ''}
          ${product.thc      ? `<div class="tag tag-thc">${product.thc}</div>` : ''}
          ${product.category ? `<div class="tag tag-category">${product.category}</div>` : ''}
        </div>

      </div>

      <div class="product-right">
        <div class="product-image-glow"></div>
        <div class="product-image-wrapper">
          <img class="product-image"
               src="${product.imageUrl}"
               alt="${product.name}"
               crossorigin="anonymous">
        </div>
      </div>
    `;

    container.appendChild(el);
  });
}

/* ═══════════════════════════════════════════════
   MAIN CYCLE ANIMATION
   ═══════════════════════════════════════════════ */
function animateCycle(batchIndex) {
  /* ── Get products ── */
  const start = (batchIndex * PRODUCTS_PER_CYCLE) % Math.max(PRODUCTS.length, 1);
  const batch = [];
  for (let i = 0; i < PRODUCTS_PER_CYCLE; i++) {
    if (PRODUCTS.length > 0) batch.push(PRODUCTS[(start + i) % PRODUCTS.length]);
  }

  renderBatch(batch);

  /* ── Grab DOM refs ── */
  const card          = document.querySelector('.product');
  const brandEl       = card.querySelector('.brand-name');
  const nameLines     = card.querySelectorAll('.product-name-line');
  const priceBlock    = card.querySelector('.price-block');
  const wasRow        = card.querySelector('.price-was-row');
  const origPriceEl   = card.querySelector('.original-price');
  const strikeBar     = card.querySelector('.strike-bar');
  const nowRow        = card.querySelector('.price-now-row');
  const salePrice     = card.querySelector('.sale-price');
  const discBadge     = card.querySelector('.discount-badge');
  const tags          = card.querySelectorAll('.tag');
  const imgWrapper    = card.querySelector('.product-image-wrapper');
  const imgGlow       = card.querySelector('.product-image-glow');
  const flash         = document.getElementById('flash-overlay');
  const scanLine      = document.getElementById('scan-line');

  /* ── Set initial states ── */
  gsap.set(card,        { x: 0, opacity: 1 });
  gsap.set(brandEl,     { x: -180, opacity: 0 });
  gsap.set(nameLines,   { x: -200, opacity: 0 });
  gsap.set(priceBlock,  { opacity: 0 });
  if (wasRow)     gsap.set(wasRow,    { x: -120, opacity: 0 });
  if (strikeBar)  gsap.set(strikeBar, { width: '0%' });
  gsap.set(nowRow,      { y: 80, opacity: 0 });
  if (discBadge)    gsap.set(discBadge,   { scale: 0, rotation: -20, opacity: 0 });
  gsap.set(tags,        { y: 50, opacity: 0 });
  gsap.set(imgWrapper,  { y: -560, opacity: 0, rotation: -5, scale: 0.9 });
  gsap.set(imgGlow,     { scale: 0.3, opacity: 0 });
  gsap.set(scanLine,    { opacity: 0, x: 0 });

  /* ════════════════════════════════
     TIMELINE
     ════════════════════════════════ */
  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete: () => animateCycle(batchIndex + 1),
  });

  /* ── FLASH IN ─────────────────── */
  tl.fromTo(flash,
    { opacity: 0.85, backgroundColor: '#7dce2a' },
    { opacity: 0, duration: 0.4, ease: 'power2.out' },
    0
  );

  /* ── BRAND SLAMS IN ───────────── */
  tl.to(brandEl, { x: 0, opacity: 1, duration: 0.45, ease: 'slam' }, 0.12);

  /* ── NAME LINES CASCADE ───────── */
  tl.to(nameLines, {
    x: 0, opacity: 1, duration: 0.5,
    stagger: 0.10, ease: 'slam-soft',
  }, 0.28);

  /* ── IMAGE DROPS FROM ABOVE ─────  */
  tl.to(imgWrapper, {
    y: 0, opacity: 1, rotation: 0, scale: 1,
    duration: 0.75, ease: 'back.out(1.5)',
  }, 0.35);

  /* ── GLOW EXPANDS ────────────── */
  tl.to(imgGlow, { scale: 1, opacity: 1, duration: 0.9, ease: 'power2.out' }, 0.7);

  /* ── PRICE BLOCK APPEARS ──────── */
  tl.to(priceBlock, { opacity: 1, duration: 0.05 }, 0.85);

  /* ── WAS price slides in ─────── */
  if (wasRow) {
    tl.to(wasRow, { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, 0.88);

    /* Strike bar draws across original price */
    if (strikeBar) {
      tl.to(strikeBar, {
        width: '110%',
        duration: 0.45, ease: 'power2.inOut',
      }, 1.28);
    }
  }

  /* ── NOW / SALE PRICE SLAMS ─────  */
  tl.to(nowRow, {
    y: 0, opacity: 1, duration: 0.55,
    ease: 'slam',
  }, wasRow ? 1.55 : 0.92);

  /* ── DISCOUNT BADGE POPS ─────── */
  if (discBadge) {
    tl.to(discBadge, {
      scale: 1, rotation: 0, opacity: 1,
      duration: 0.6, ease: 'elastic.out(1.1, 0.45)',
    }, wasRow ? 1.85 : 1.25);
  }

  /* ── TAGS RISE UP ────────────── */
  tl.to(tags, {
    y: 0, opacity: 1, duration: 0.4, stagger: 0.08,
  }, 2.1);

  /* ════════════════════════════════
     IDLE PHASE (2.8 – 8.2s)
     ════════════════════════════════ */

  /* Image float oscillation (up then back to start before exit) */
  tl.to(imgWrapper, {
    y: '-=18', duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: 1,
  }, IDLE_START);

  /* Glow breathe */
  tl.to(imgGlow, {
    scale: 1.1, opacity: 0.8, duration: 2.0, ease: 'sine.inOut', yoyo: true, repeat: 1,
  }, IDLE_START + 0.3);

  /* Sale price neon glow pulse */
  tl.to(salePrice, {
    textShadow: '0 0 40px rgba(123,206,42,0.9), 0 0 80px rgba(123,206,42,0.4)',
    duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: 2,
  }, IDLE_START + 0.2);

  /* Badge slow rock */
  if (discBadge) {
    tl.to(discBadge, {
      rotation: 6, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: 2,
    }, IDLE_START + 0.5);
  }

  /* Scan line sweeps across the right half (once, dramatic) */
  tl.to(scanLine, { opacity: 1, x: 1050, duration: 0 }, IDLE_START + 1.2);
  tl.to(scanLine, {
    x: 1920, opacity: 1, duration: 1.2, ease: 'power1.inOut',
  }, IDLE_START + 1.2);
  tl.to(scanLine, { opacity: 0, duration: 0.3 }, IDLE_START + 2.4);

  /* Second scan at mid-idle */
  tl.to(scanLine, { opacity: 1, x: 1050, duration: 0 }, IDLE_START + 3.5);
  tl.to(scanLine, {
    x: 1920, opacity: 0.6, duration: 1.0, ease: 'power1.inOut',
  }, IDLE_START + 3.5);
  tl.to(scanLine, { opacity: 0, duration: 0.2 }, IDLE_START + 4.5);

  /* Accent bars flash pulse */
  tl.to(['#accent-bar-top', '#accent-bar-bottom'], {
    scaleX: 1.0, opacity: 0.3, duration: 0.1,
    yoyo: true, repeat: 1, ease: 'none',
  }, IDLE_START + 2.0);

  /* ════════════════════════════════
     EXIT (8.2 – 9.8s)
     ════════════════════════════════ */

  /* Flash slam */
  tl.to(flash, {
    opacity: 1, backgroundColor: '#7dce2a',
    duration: 0.18, ease: 'power4.in',
  }, EXIT_START);

  /* Everything wipes left */
  tl.to(card, {
    x: -1980, duration: 0.4, ease: 'hard-out',
  }, EXIT_START + 0.08);

  /* Flash fades to clear */
  tl.to(flash, {
    opacity: 0, duration: 0.4, ease: 'power2.out',
  }, EXIT_START + 0.35);
}

/* ═══════════════════════════════════════════════
   BACKGROUND WATERMARK
   ═══════════════════════════════════════════════ */
function buildWatermark() {
  const wrap    = document.getElementById('bg-watermark');
  const phrase  = '  QUALITY ROOTS  ·  QUALITY ROOTS  ·  ';
  const rowH    = 84;  // px per row (matches CSS font-size 80px + 4px gap)
  const rows    = Math.ceil(1080 / rowH) + 1;

  for (let r = 0; r < rows; r++) {
    const row     = document.createElement('div');
    row.className = 'watermark-row';
    // Offset alternating rows slightly
    const offset  = r % 2 === 0 ? 0 : -220;
    row.style.marginLeft = `${offset}px`;
    row.textContent = phrase.repeat(3);
    wrap.appendChild(row);
  }
}

/* ═══════════════════════════════════════════════
   BOTTOM TICKER
   ═══════════════════════════════════════════════ */
function buildTicker() {
  const track   = document.getElementById('ticker-track');
  const phrases = [
    'QUALITY ROOTS', 'EXCLUSIVE DEALS', 'SAVE BIG',
    'PREMIUM CANNABIS', 'TODAY ONLY', 'SHOP NOW',
  ];

  // Duplicate enough for seamless loop at 1920px
  const repeat = 6;
  for (let r = 0; r < repeat; r++) {
    phrases.forEach((p) => {
      const item = document.createElement('span');
      item.className = 'ticker-item';
      item.textContent = p;
      track.appendChild(item);

      const dot = document.createElement('span');
      dot.className = 'ticker-dot';
      dot.textContent = '✦';
      track.appendChild(dot);
    });
  }

  // Measure total width then animate
  requestAnimationFrame(() => {
    const totalW  = track.scrollWidth / 2; // half because we doubled
    if (tickerTween) tickerTween.kill();
    tickerTween = gsap.to(track, {
      x: `-${totalW}px`,
      duration: totalW / 90,   // 90px/s scroll speed
      ease: 'none',
      repeat: -1,
    });
  });
}

/* ═══════════════════════════════════════════════
   AMBIENT BG LIGHT ANIMATION
   ═══════════════════════════════════════════════ */
function animateAmbient() {
  gsap.to('#bg-light-slice', {
    opacity: 0.6, duration: 3.5, ease: 'sine.inOut',
    yoyo: true, repeat: -1,
  });

  // Accent bars entrance
  gsap.from('#accent-bar-top',    { scaleX: 0, duration: 1.2, ease: 'power3.out', delay: 0.1 });
  gsap.from('#accent-bar-bottom', { scaleX: 0, duration: 1.2, ease: 'power3.out', delay: 0.2 });
}

/* ═══════════════════════════════════════════════
   LOGO ENTRANCE
   ═══════════════════════════════════════════════ */
function animateLogo() {
  gsap.from('#qr-logo',      { x: -80, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.3 });
  gsap.from('#deals-corner', { x:  80, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.4 });
  gsap.from('#center-divider', { scaleY: 0, duration: 1.2, ease: 'power2.out', delay: 0.5 });
}

/* ═══════════════════════════════════════════════
   PRODUCT LOADING
   ═══════════════════════════════════════════════ */
async function loadProducts() {
  try {
    const res  = await fetch('./products.json', { cache: 'no-store' });
    const data = await res.json();
    const raw  = Array.isArray(data) ? data : (data.products || []);
    PRODUCTS   = raw.map(adaptProduct);
  } catch (err) {
    console.warn('Could not load products.json — using empty list.', err);
    PRODUCTS = [];
  }

  if (PRODUCTS.length > 0) {
    animateCycle(0);
  }
}

/* ═══════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  buildWatermark();
  buildTicker();
  animateAmbient();
  animateLogo();
  loadProducts();
});
