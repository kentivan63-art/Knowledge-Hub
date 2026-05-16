// ================================
// KNOWLEDGEHUB — MAIN JAVASCRIPT
// ================================

// ---- THEME TOGGLE ----
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

const savedTheme = localStorage.getItem('kh-theme') || 'light';
html.setAttribute('data-theme', savedTheme);

themeToggle?.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('kh-theme', next);
});

// ---- NAVBAR SCROLL ----
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) navbar?.classList.add('scrolled');
  else navbar?.classList.remove('scrolled');
});

// ---- HAMBURGER MENU ----
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger?.addEventListener('click', () => {
  mobileMenu?.classList.toggle('open');
});

// ---- REVEAL ON SCROLL ----
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => revealObserver.observe(el));

// ---- COUNTER ANIMATION ----
function animateCount(el, target) {
  let current = 0;
  const increment = target / 60;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = Math.floor(current).toLocaleString();
  }, 25);
}
const statNums = document.querySelectorAll('.stat-num');
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = parseInt(entry.target.dataset.target);
      animateCount(entry.target, target);
      statObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
statNums.forEach(el => statObserver.observe(el));

// ---- CHAT WIDGET ----
const chatBubble = document.getElementById('chatBubble');
const chatWindow = document.getElementById('chatWindow');
const chatClose = document.getElementById('chatClose');
const chatSend = document.getElementById('chatSend');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');

const botReplies = [
  "Great question! Our team will get back to you shortly. 😊",
  "Thanks for reaching out! You can also check our FAQ page for quick answers.",
  "We love hearing from our community! Is there anything else I can help with?",
  "Awesome! Feel free to explore our blog while you wait for a response.",
  "Our support team is online Mon–Fri, 9AM–6PM. Leave your email and we'll follow up!"
];
let replyIndex = 0;

chatBubble?.addEventListener('click', () => chatWindow?.classList.toggle('open'));
chatClose?.addEventListener('click', () => chatWindow?.classList.remove('open'));

function sendChatMessage() {
  const msg = chatInput?.value.trim();
  if (!msg) return;
  const userMsg = document.createElement('div');
  userMsg.className = 'chat-msg user';
  userMsg.textContent = msg;
  chatMessages?.appendChild(userMsg);
  chatInput.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;
  setTimeout(() => {
    const botMsg = document.createElement('div');
    botMsg.className = 'chat-msg bot';
    botMsg.textContent = botReplies[replyIndex % botReplies.length];
    replyIndex++;
    chatMessages?.appendChild(botMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 700);
}
chatSend?.addEventListener('click', sendChatMessage);
chatInput?.addEventListener('keydown', e => { if (e.key === 'Enter') sendChatMessage(); });

// ---- FAQ ACCORDION ----
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// ---- LOGIN TABS ----
const tabBtns = document.querySelectorAll('.tab-btn');
const loginForms = document.querySelectorAll('.login-form-panel');
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.tab;
    loginForms.forEach(form => {
      form.style.display = form.id === target ? 'flex' : 'none';
    });
  });
});

// ---- GALLERY LIGHTBOX ----
document.querySelectorAll('.gallery-grid-item').forEach(item => {
  item.addEventListener('click', () => {
    const label = item.querySelector('span')?.textContent || 'Gallery Image';
    const color = item.style.background || 'linear-gradient(135deg,#7C3AED,#A855F7)';
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;cursor:pointer;`;
    overlay.innerHTML = `<div style="background:${color};width:80vw;max-width:700px;height:420px;border-radius:20px;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:800;font-family:'Syne',sans-serif;">${label}</div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', () => overlay.remove());
  });
});

// ---- CONTACT FORM ----
const contactForm = document.getElementById('contactForm');
contactForm?.addEventListener('submit', e => {
  e.preventDefault();
  const btn = contactForm.querySelector('button[type="submit"]');
  btn.textContent = '✅ Message Sent!';
  btn.style.background = 'linear-gradient(135deg,#059669,#10B981)';
  setTimeout(() => {
    btn.textContent = 'Send Message';
    btn.style.background = '';
    contactForm.reset();
  }, 3000);
});

// ---- LOGIN / REGISTER FORM ----
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
loginForm?.addEventListener('submit', e => {
  e.preventDefault();
  alert('✅ Welcome back to KnowledgeHub!');
});
registerForm?.addEventListener('submit', e => {
  e.preventDefault();
  alert('🎉 Account created! Welcome to KnowledgeHub!');
});

// ---- APPLY SAVED THEME ON ALL PAGES ----
(function() {
  const t = localStorage.getItem('kh-theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);
})();
