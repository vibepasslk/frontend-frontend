/* ═══════════════════════════════════════════════
   VibePass.lk — Main Script
═══════════════════════════════════════════════ */

'use strict';

// ─── DATA ────────────────────────────────────────────────────────────
const EVENTS = [
  { id: 1, name: "Colombo Jazz Night", category: "music", emoji: "🎷", venue: "Lionel Wendt Theatre", date: "Jun 12, 2025", price: 1500, seats: 3, total: 250, color: "#1a0a3d", tagBg: "rgba(123,92,240,0.2)", tagColor: "#9E7FF5" },
  { id: 2, name: "Romeo & Juliet", category: "theatre", emoji: "🎭", venue: "BMICH Auditorium", date: "Jun 15, 2025", price: 2000, seats: 42, total: 500, color: "#1a1000", tagBg: "rgba(251,146,60,0.2)", tagColor: "#FB923C" },
  { id: 3, name: "Stand-up Colombo", category: "comedy", emoji: "😂", venue: "Galadari Hotel", date: "Jun 20, 2025", price: 1200, seats: 18, total: 200, color: "#001a0a", tagBg: "rgba(52,211,153,0.2)", tagColor: "#34D399" },
  { id: 4, name: "Kandyan Classics", category: "dance", emoji: "💃", venue: "Nelum Pokuna", date: "Jun 28, 2025", price: 1800, seats: 0, total: 800, color: "#1a0020", tagBg: "rgba(244,114,182,0.2)", tagColor: "#F472B6" },
  { id: 5, name: "Reggae on the Beach", category: "music", emoji: "🎸", venue: "Galle Face Hotel", date: "Jul 4, 2025", price: 2500, seats: 120, total: 400, color: "#001020", tagBg: "rgba(123,92,240,0.2)", tagColor: "#9E7FF5" },
  { id: 6, name: "Art Exhibition 2025", category: "art", emoji: "🎨", venue: "National Art Gallery", date: "Jul 8, 2025", price: 500, seats: 200, total: 300, color: "#0a1020", tagBg: "rgba(96,165,250,0.2)", tagColor: "#60A5FA" },
  { id: 7, name: "Vesak Light Show", category: "art", emoji: "🏮", venue: "Beira Lake", date: "Jul 10, 2025", price: 800, seats: 55, total: 600, color: "#1a1000", tagBg: "rgba(251,191,36,0.2)", tagColor: "#FBBF24" },
  { id: 8, name: "Colombo Fringe Fest", category: "theatre", emoji: "🎪", venue: "Barefoot Gallery", date: "Jul 15, 2025", price: 1000, seats: 30, total: 150, color: "#1a0010", tagBg: "rgba(251,146,60,0.2)", tagColor: "#FB923C" },
];

const INVITE_TEMPLATES = [
  { id: 1, label: "Birthday Party", count: "12 templates", emoji: "🎂", bg: "linear-gradient(135deg,#2d1048,#4a1060)", nameColor: "#D8ABFF" },
  { id: 2, label: "Wedding", count: "18 templates", emoji: "💍", bg: "linear-gradient(135deg,#1a0520,#301040)", nameColor: "#F3D0FF" },
  { id: 3, label: "Concert Invite", count: "8 templates", emoji: "🎵", bg: "linear-gradient(135deg,#0a1535,#1a2860)", nameColor: "#93C5FD" },
  { id: 4, label: "Corporate Event", count: "10 templates", emoji: "🏢", bg: "linear-gradient(135deg,#0f1520,#1e2d40)", nameColor: "#94A3B8" },
  { id: 5, label: "Baby Shower", count: "9 templates", emoji: "👶", bg: "linear-gradient(135deg,#1a0a2d,#2d1545)", nameColor: "#C4B5FD" },
  { id: 6, label: "Graduation", count: "7 templates", emoji: "🎓", bg: "linear-gradient(135deg,#001a10,#003020)", nameColor: "#6EE7B7" },
];

const TESTIMONIALS = [
  { text: "Sold out 450 tickets in under 48 hours. VibePass made our theatre event incredibly easy to manage.", name: "Priyanka Fernando", role: "Event Organizer, Colombo", stars: 5, initials: "PF", color: "#7B5CF0" },
  { text: "The digital invitation builder is gorgeous. My wedding invites looked like designer cards — all for free!", name: "Nimasha Perera", role: "Bride, Kandy", stars: 5, initials: "NP", color: "#EC4899" },
  { text: "Bought tickets for the Jazz Night in 2 minutes. Got the QR code on my phone and walked straight in.", name: "Kasun Rathnayake", role: "Music fan, Colombo", stars: 5, initials: "KR", color: "#F97316" },
  { text: "As a venue manager, having real-time seat analytics is a game changer. Highly recommend VibePass.", name: "Dilani Silva", role: "Venue Manager, BMICH", stars: 5, initials: "DS", color: "#10B981" },
  { text: "Created a Vesak party invite on my phone in 10 minutes. All 40 guests got it via WhatsApp instantly.", name: "Ruwan Jayawardena", role: "Party host, Gampaha", stars: 4, initials: "RJ", color: "#3B82F6" },
  { text: "Finally a Sri Lankan platform that actually works. Payments are smooth, tickets are instant.", name: "Tharushi Bandara", role: "Regular attendee", stars: 5, initials: "TB", color: "#8B5CF6" },
];

// ─── DOM READY ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  renderEvents('all');
  renderInviteTemplates();
  renderTestimonials();
  initCategoryFilters();
  initScrollAnimations();
  initCounters();
});

// ─── NAVBAR ──────────────────────────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  // Scroll effect
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    const icon = hamburger.querySelector('i');
    icon.className = mobileMenu.classList.contains('open') ? 'ti ti-x' : 'ti ti-menu-2';
  });

  // Close mobile menu on link click
  document.querySelectorAll('.mob-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.querySelector('i').className = 'ti ti-menu-2';
    });
  });
}

// ─── EVENTS ──────────────────────────────────────────────────────────
function renderEvents(cat) {
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;

  const filtered = cat === 'all' ? EVENTS : EVENTS.filter(e => e.category === cat);

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-3);">
      <i class="ti ti-calendar-off" style="font-size:40px;display:block;margin-bottom:12px;"></i>
      No events found in this category yet. Check back soon!
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(e => {
    const pct = Math.round(((e.total - e.seats) / e.total) * 100);
    const soldOut = e.seats === 0;
    const low = e.seats > 0 && e.seats <= 20;
    return `
    <article class="event-card fade-in" data-id="${e.id}" onclick="openEvent(${e.id})" role="button" tabindex="0" aria-label="Book ${e.name}">
      <div class="ec-banner" style="background:${e.color};">
        <span style="font-size:44px;">${e.emoji}</span>
        <span class="ec-cat" style="background:${e.tagBg};color:${e.tagColor};">${capitalize(e.category)}</span>
      </div>
      <div class="ec-body">
        <div class="ec-name">${e.name}</div>
        <div class="ec-venue"><i class="ti ti-map-pin"></i>${e.venue}</div>
        <div class="ec-date"><i class="ti ti-calendar"></i>${e.date}</div>
        <div class="ec-footer">
          <div>
            <div class="ec-price">LKR ${e.price.toLocaleString()} <span>/ person</span></div>
            <div class="ec-avail ${low ? 'low' : ''}">${soldOut ? '🔴 Sold out' : low ? `🔥 Only ${e.seats} seats left` : `${e.seats} seats available`}</div>
          </div>
          ${soldOut
            ? `<span class="ec-sold">Sold out</span>`
            : `<button class="ec-btn" onclick="event.stopPropagation();openEvent(${e.id})">Book now</button>`
          }
        </div>
      </div>
    </article>`;
  }).join('');

  // Trigger animations
  requestAnimationFrame(() => {
    document.querySelectorAll('.fade-in').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 60);
    });
  });
}

function initCategoryFilters() {
  const filters = document.getElementById('catFilters');
  if (!filters) return;
  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-btn');
    if (!btn) return;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderEvents(btn.dataset.cat);
  });
}

function openEvent(id) {
  // In full implementation: navigate to event detail page
  window.location.href = `pages/event-detail.html?id=${id}`;
}

// ─── INVITATIONS ─────────────────────────────────────────────────────
function renderInviteTemplates() {
  const el = document.getElementById('inviteTemplates');
  if (!el) return;
  el.innerHTML = INVITE_TEMPLATES.map(t => `
    <div class="invite-tpl fade-in" onclick="openInvite(${t.id})" role="button" tabindex="0" aria-label="Use ${t.label} template">
      <div class="it-banner" style="background:${t.bg};">
        <div class="it-emoji">${t.emoji}</div>
        <div class="it-tname" style="color:${t.nameColor};">${t.label}</div>
      </div>
      <div class="it-overlay"><span>Use template →</span></div>
      <div class="it-foot">
        <div class="it-label">${t.label}</div>
        <div class="it-count">${t.count}</div>
      </div>
    </div>
  `).join('');

  requestAnimationFrame(() => {
    document.querySelectorAll('.fade-in').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 80);
    });
  });
}

function openInvite(id) {
  window.location.href = `pages/invitations.html?template=${id}`;
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────
function renderTestimonials() {
  const el = document.getElementById('testiGrid');
  if (!el) return;
  el.innerHTML = TESTIMONIALS.map(t => `
    <div class="testi-card fade-in">
      <div class="testi-stars">${'★'.repeat(t.stars)}${'☆'.repeat(5 - t.stars)}</div>
      <p class="testi-text">"${t.text}"</p>
      <div class="testi-author">
        <div class="testi-avatar" style="background:${t.color};">${t.initials}</div>
        <div>
          <div class="testi-name">${t.name}</div>
          <div class="testi-role">${t.role}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ─── SCROLL ANIMATIONS ───────────────────────────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  // Observe sections
  document.querySelectorAll('.party-card, .testi-card, .invite-tpl, .event-card').forEach(el => {
    observer.observe(el);
  });

  // Add fade-in to section titles
  document.querySelectorAll('.section-title, .section-label, .org-text, .org-visual').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });
}

// ─── COUNTER ANIMATION ───────────────────────────────────────────────
function initCounters() {
  const counters = document.querySelectorAll('.hstat-num[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const duration = 1800;
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
    const current = Math.round(ease * target);
    el.textContent = current >= 1000 ? (current / 1000).toFixed(1) + 'k' : current;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target >= 1000 ? (target / 1000).toFixed(0) + 'k' : target;
  }
  requestAnimationFrame(step);
}

// ─── UTILS ───────────────────────────────────────────────────────────
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── KEYBOARD ACCESSIBILITY ──────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const el = e.target;
    if (el.matches('.event-card, .invite-tpl')) el.click();
  }
});

// API-backed event rendering with static fallback.
const STATIC_EVENTS = EVENTS;

renderEvents = async function renderEventsFromApi(cat) {
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;

  const sourceEvents = await loadPublicEvents();
  const filtered = cat === 'all' ? sourceEvents : sourceEvents.filter((eventItem) => eventItem.category === cat);

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-3);">
      <i class="ti ti-calendar-off" style="font-size:40px;display:block;margin-bottom:12px;"></i>
      No events found in this category yet. Check back soon.
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map((eventItem) => {
    const soldOut = Number(eventItem.seats) === 0;
    const low = Number(eventItem.seats) > 0 && Number(eventItem.seats) <= 20;
    return `
    <article class="event-card fade-in" data-id="${eventItem.id}" onclick="openEvent('${eventItem.id}')" role="button" tabindex="0" aria-label="Book ${eventItem.name}">
      <div class="ec-banner" style="background:${eventItem.color};">
        <span style="font-size:44px;">${eventItem.emoji}</span>
        <span class="ec-cat" style="background:${eventItem.tagBg};color:${eventItem.tagColor};">${capitalize(eventItem.category || 'event')}</span>
      </div>
      <div class="ec-body">
        <div class="ec-name">${eventItem.name}</div>
        <div class="ec-venue"><i class="ti ti-map-pin"></i>${eventItem.venue || 'Venue pending'}</div>
        <div class="ec-date"><i class="ti ti-calendar"></i>${eventItem.date}</div>
        <div class="ec-footer">
          <div>
            <div class="ec-price">LKR ${Number(eventItem.price || 0).toLocaleString()} <span>/ person</span></div>
            <div class="ec-avail ${low ? 'low' : ''}">${soldOut ? 'Sold out' : low ? `Only ${eventItem.seats} seats left` : `${eventItem.seats || 0} seats available`}</div>
          </div>
          ${soldOut
            ? `<span class="ec-sold">Sold out</span>`
            : `<button class="ec-btn" onclick="event.stopPropagation();openEvent('${eventItem.id}')">Book now</button>`
          }
        </div>
      </div>
    </article>`;
  }).join('');

  requestAnimationFrame(() => {
    document.querySelectorAll('.fade-in').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 60);
    });
  });
};

async function loadPublicEvents() {
  const apiBase = window.VibePass?.API_BASE || localStorage.getItem('vibepass_api_base') || (
    ['vibepass.lk', 'www.vibepass.lk'].includes(window.location.hostname) || window.location.hostname.endsWith('.vercel.app')
      ? 'https://api.vibepass.lk/api'
      : 'http://localhost:5000/api'
  );

  try {
    const response = await fetch(`${apiBase}/events?limit=12`, { headers: { Accept: 'application/json' } });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error('Events API unavailable');
    const events = payload.data.events || [];
    if (!events.length) return STATIC_EVENTS;
    return events.map(normalizeApiEvent);
  } catch (_error) {
    return STATIC_EVENTS;
  }
}

function normalizeApiEvent(eventItem) {
  const category = eventItem.category || 'music';
  const colorByCategory = {
    music: '#1a0a3d',
    theatre: '#1a1000',
    comedy: '#001a0a',
    dance: '#1a0020',
    art: '#0a1020'
  };
  return {
    id: eventItem.id || eventItem.slug,
    name: eventItem.title,
    category,
    emoji: category === 'music' ? 'M' : category === 'theatre' ? 'T' : category === 'comedy' ? 'C' : category === 'dance' ? 'D' : 'A',
    venue: eventItem.venue,
    date: eventItem.start_date ? new Date(eventItem.start_date).toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date pending',
    price: eventItem.min_price || 0,
    seats: eventItem.available_tickets || 0,
    total: eventItem.available_tickets || 0,
    color: colorByCategory[category] || '#13111E',
    tagBg: 'rgba(123,92,240,0.2)',
    tagColor: '#9E7FF5'
  };
}

openInvite = function openInviteBuilder(id) {
  const inPages = window.location.pathname.includes('/pages/');
  window.location.href = `${inPages ? '' : 'pages/'}invitation-builder.html?template=${id}`;
};
