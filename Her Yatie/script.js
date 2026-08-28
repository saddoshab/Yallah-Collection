/* ============ CONFIG ============ */
const WHATSAPP_NUMBER = "211912488233"; // Yallah Collections business WhatsApp number
const CURRENCY = "SSP";
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQPN9y_HjscC51UWn78BbMN26kiBKXHFQhzGsvvr0kAfOS8ADGMC-SrFCW48Dex-0-56kSNqNwXPzzm/pub?output=csv";

/* Converts a pasted image reference into a usable image URL.
   - Google Drive "share" links (drive.google.com/file/d/FILE_ID/... or
     ?id=FILE_ID) are rewritten into Drive's direct-thumbnail format.
   - Anything else (imgbb, postimages, any plain image URL) is passed through unchanged. */
function resolveImageUrl(raw) {
  const url = String(raw || "").trim();
  if (!url) return "";

  let fileId = "";
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  const idMatch = url.match(/[?&]id=([^&]+)/);
  if (fileMatch) fileId = fileMatch[1];
  else if (idMatch) fileId = idMatch[1];

  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }
  return url;
}

/* ============ PRODUCT DATA ============ */
/* Fallback sample list — used only if SHEET_CSV_URL above is blank or the
   sheet can't be reached. Once your Google Sheet is connected, this list
   is ignored and products load from there instead. */
let PRODUCTS = [
  { id: "sh1", name: "Amara Block Heel", category: "Shoes", price: 45000, desc: "Black block heel, comfortable enough for a full day out.", isNew: true },
  { id: "sh2", name: "Nadia Strap Sandal", category: "Shoes", price: 32000, desc: "Gold-buckle sandal, pairs with everything." },
  { id: "sh3", name: "Layla Pointed Flat", category: "Shoes", price: 28000, desc: "Soft leather flat with a sharp, elegant toe." },
  { id: "bg1", name: "Zahra Tote", category: "Bags", price: 68000, desc: "Structured black tote with gold hardware, fits a laptop.", isNew: true },
  { id: "bg2", name: "Mira Crossbody", category: "Bags", price: 41000, desc: "Compact crossbody for everyday essentials." },
  { id: "bg3", name: "Salma Clutch", category: "Bags", price: 35000, desc: "Evening clutch with a slim gold chain strap." },
  { id: "ac1", name: "Habiba Silk Scarf", category: "Accessories", price: 15000, desc: "Lightweight silk scarf, hand-finished edges." },
  { id: "ac2", name: "Rania Statement Earrings", category: "Accessories", price: 12000, desc: "Gold-tone drop earrings for evening wear.", isNew: true },
  { id: "ac3", name: "Farida Woven Belt", category: "Accessories", price: 18000, desc: "Woven leather belt with an antique-gold buckle." }
];

const ICONS = {
  Shoes: `<svg viewBox="0 0 24 24" fill="none" stroke="#16130F" stroke-width="1.1"><path d="M3 17c0-1.5.8-2.2 2-2.6 1.6-.5 2.6-1.2 3.3-2.6.4-.8 1-1.3 1.9-1.1.7.1 1 .7 1 1.4 0 .8.4 1.2 1.1 1.5 1.6.6 3.6 1.1 5.2 1.6.9.3 1.5 1 1.5 2v2.3c0 .5-.4.9-.9.9H3.9c-.5 0-.9-.4-.9-.9V17Z"/><path d="M8 12.5V7.8c0-.9.5-1.5 1.3-1.7.9-.2 1.7.3 2 1.1"/></svg>`,
  Bags: `<svg viewBox="0 0 24 24" fill="none" stroke="#16130F" stroke-width="1.1"><rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M8 9V6.5A4 4 0 0 1 16 6.5V9"/></svg>`,
  Accessories: `<svg viewBox="0 0 24 24" fill="none" stroke="#16130F" stroke-width="1.1"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.6"/></svg>`
};

/* ============ STATE ============ */
let cart = loadCart();
let activeFilter = "All";
const PAGE_SIZE = 6;
let visibleCount = PAGE_SIZE;

/* ============ HELPERS ============ */
function formatPrice(n) {
  return `${CURRENCY} ${n.toLocaleString()}`;
}
function loadCart() {
  try {
    const raw = localStorage.getItem("yallah_cart");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
function saveCart() {
  try { localStorage.setItem("yallah_cart", JSON.stringify(cart)); } catch (e) { /* ignore */ }
}
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ============ RENDER PRODUCTS ============ */
function renderProducts() {
  const grid = document.getElementById("productGrid");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const allItems = PRODUCTS.filter(p => activeFilter === "All" || p.category === activeFilter);
  const items = allItems.slice(0, visibleCount);

  grid.innerHTML = items.map(p => `
    <div class="product-card">
            <div class="product-media" style="${p.inStock ? '' : 'opacity:0.45;'}">
        ${p.isNew && p.inStock ? '<span class="tag-new">New</span>' : ''}
        ${!p.inStock ? '<span class="tag-new" style="background:var(--ink);">Sold Out</span>' : ''}
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">`
          : `<span class="ring" aria-hidden="true"></span>${ICONS[p.category] || ""}`
        }
      </div>
      <div class="product-body">
        <span class="p-cat">${p.category}</span>
        <h3>${p.name}</h3>
        <p class="p-desc">${p.desc}</p>
        <div class="product-footer">
          <span class="price">${formatPrice(p.price)}</span>
          <button class="add-btn" data-id="${p.id}" ${p.inStock ? '' : 'disabled style="opacity:0.5;cursor:not-allowed;"'}>${p.inStock ? 'Add to Cart' : 'Sold Out'}</button>
        </div>
      </div>
    </div>
  `).join("");

  grid.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      addToCart(btn.getAttribute("data-id"));
      btn.textContent = "Added";
      btn.classList.add("added");
      setTimeout(() => { btn.textContent = "Add to Cart"; btn.classList.remove("added"); }, 1200);
    });
  });

  if (allItems.length > visibleCount) {
    loadMoreBtn.style.display = "inline-flex";
    loadMoreBtn.textContent = `Load More (${allItems.length - visibleCount} more)`;
  } else {
    loadMoreBtn.style.display = "none";
  }
}

/* ============ CART LOGIC ============ */
function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
  const p = PRODUCTS.find(p => p.id === id);
  showToast(`${p.name} added to cart`);
}
function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id] += delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCart();
}
function removeFromCart(id) {
  delete cart[id];
  saveCart();
  renderCart();
}
function cartCount() {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}
function cartSubtotal() {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = PRODUCTS.find(p => p.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);
}
function renderCart() {
  document.getElementById("cartCount").textContent = cartCount();
  const body = document.getElementById("drawerBody");
  const foot = document.getElementById("drawerFoot");
  const entries = Object.entries(cart);

  if (entries.length === 0) {
    body.innerHTML = `<p class="empty-cart">Your cart is empty. Browse the collection and add something you love.</p>`;
    foot.style.display = "none";
    return;
  }

  foot.style.display = "block";
  body.innerHTML = entries.map(([id, qty]) => {
    const p = PRODUCTS.find(p => p.id === id);
    if (!p) return "";
    return `
      <div class="cart-item" data-id="${id}">
        <div class="thumb">${p.image ? `<img src="${p.image}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : (ICONS[p.category] || "")}</div>
        <div>
          <h4>${p.name}</h4>
          <div class="qty-row">
            <button class="qty-btn" data-action="dec" aria-label="Decrease quantity">&minus;</button>
            <span>${qty}</span>
            <button class="qty-btn" data-action="inc" aria-label="Increase quantity">&plus;</button>
          </div>
          <button class="remove-btn" data-action="remove">Remove</button>
        </div>
        <div class="item-total">${formatPrice(p.price * qty)}</div>
      </div>
    `;
  }).join("");

  body.querySelectorAll(".cart-item").forEach(el => {
    const id = el.getAttribute("data-id");
    el.querySelector('[data-action="inc"]').addEventListener("click", () => changeQty(id, 1));
    el.querySelector('[data-action="dec"]').addEventListener("click", () => changeQty(id, -1));
    el.querySelector('[data-action="remove"]').addEventListener("click", () => removeFromCart(id));
  });

  const subtotal = cartSubtotal();
  document.getElementById("sumSubtotal").textContent = formatPrice(subtotal);
  document.getElementById("sumTotal").textContent = formatPrice(subtotal);
}

/* ============ DRAWER ============ */
function openDrawer() {
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("overlay").classList.add("open");
}
function closeDrawer() {
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("overlay").classList.remove("open");
}

/* ============ CHECKOUT MODAL ============ */
function openModal() {
  if (cartCount() === 0) {
    showToast("Your cart is empty");
    return;
  }
  const lines = Object.entries(cart).map(([id, qty]) => {
    const p = PRODUCTS.find(p => p.id === id);
    return `${qty} &times; ${p.name} &mdash; ${formatPrice(p.price * qty)}`;
  }).join("<br>");
  document.getElementById("modalSummary").innerHTML = `<strong>Order summary</strong><br>${lines}<br><br><strong>Total: ${formatPrice(cartSubtotal())}</strong>`;
  document.getElementById("modalOverlay").classList.add("open");
  closeDrawer();
}
function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
}

function submitOrder(e) {
  e.preventDefault();
  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  const note = document.getElementById("custNote").value.trim();

  const itemLines = Object.entries(cart).map(([id, qty]) => {
    const p = PRODUCTS.find(p => p.id === id);
    return `- ${qty} x ${p.name} (${formatPrice(p.price * qty)})`;
  }).join("\n");

  const message =
`New order from Yallah Collections website

Name: ${name}
Phone: ${phone}
Delivery address: ${address}
${note ? "Note: " + note + "\n" : ""}
Items:
${itemLines}

Total: ${formatPrice(cartSubtotal())}
Payment: Cash on delivery`;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");

  cart = {};
  saveCart();
  renderCart();
  closeModal();
  document.getElementById("checkoutForm").reset();
  showToast("Order sent — check WhatsApp to confirm");
}

/* ============ FILTERS ============ */
function setFilter(filter) {
  activeFilter = filter;
  visibleCount = PAGE_SIZE;
  document.querySelectorAll(".filter-btn").forEach(b => {
    b.classList.toggle("active", b.getAttribute("data-filter") === filter);
  });
  renderProducts();
}

/* ============ HERO SLIDER ============ */
function initHeroSlider() {
  const slider = document.getElementById("heroSlider");
  if (!slider) return;
  const slides = Array.from(slider.querySelectorAll(".slide"));
  const dotsWrap = document.getElementById("sliderDots");
  let current = 0;
  let timer;

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.setAttribute("aria-label", `Show slide ${i + 1}`);
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.querySelectorAll("button"));

  function goTo(i) {
    slides[current].classList.remove("active");
    dots[current].classList.remove("active");
    current = i;
    slides[current].classList.add("active");
    dots[current].classList.add("active");
  }
  function next() { goTo((current + 1) % slides.length); }

  function start() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer = setInterval(next, 4000);
  }
  function stop() { clearInterval(timer); }

  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);
  start();
}

/* ============ LOAD PRODUCTS FROM GOOGLE SHEET ============ */
function loadProducts() {
  return new Promise((resolve) => {
    if (!SHEET_CSV_URL) { resolve(); return; }

    Papa.parse(SHEET_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data
            .filter(r => r.id && r.name && r.price)
            .map(r => ({
              id: String(r.id).trim(),
              name: String(r.name).trim(),
              category: String(r.category || "").trim(),
              price: parseFloat(String(r.price).replace(/[^0-9.]/g, "")) || 0,
              desc: String(r.desc || "").trim(),
              isNew: String(r.isNew).trim().toUpperCase() === "TRUE",
              inStock: String(r.inStock).trim().toUpperCase() !== "FALSE",
              image: resolveImageUrl(r.image)
            }));
          if (rows.length) PRODUCTS = rows;
        } catch (e) {
          console.error("Could not parse product sheet, using fallback list.", e);
        }
        resolve();
      },
      error: (err) => {
        console.error("Could not load product sheet, using fallback list.", err);
        resolve();
      }
    });
  });
}

/* ============ INIT ============ */
document.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();
  renderProducts();
  renderCart();
  initHeroSlider();

  document.getElementById("cartToggle").addEventListener("click", openDrawer);
  document.getElementById("drawerClose").addEventListener("click", closeDrawer);
  document.getElementById("overlay").addEventListener("click", () => { closeDrawer(); closeModal(); });
  document.getElementById("checkoutBtn").addEventListener("click", openModal);
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("checkoutForm").addEventListener("submit", submitOrder);
  document.getElementById("loadMoreBtn").addEventListener("click", () => {
    visibleCount += PAGE_SIZE;
    renderProducts();
  });

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => setFilter(btn.getAttribute("data-filter")));
  });
  document.querySelectorAll(".cat-card").forEach(btn => {
    btn.addEventListener("click", () => {
      setFilter(btn.getAttribute("data-filter"));
      document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeDrawer(); closeModal(); }
  });
});