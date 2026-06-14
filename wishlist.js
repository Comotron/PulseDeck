const wishlistGrid = document.querySelector("#wishlistGrid");
const wishlistEmpty = document.querySelector("#wishlistEmpty");
const wishlistUpdated = document.querySelector("#wishlistUpdated");
const refreshWishlistButton = document.querySelector("#refreshWishlist");
const wishlistTotal = document.querySelector("#wishlistTotal");
const wishlistOpen = document.querySelector("#wishlistOpen");
const wishlistPurchased = document.querySelector("#wishlistPurchased");
const PURCHASED_STATUS = "Purchased";
const NOT_PURCHASED_STATUS = "Not Purchased";

let wishlistItems = [];
let wishlistLoading = false;

document.addEventListener("DOMContentLoaded", initWishlist);

function initWishlist() {
  renderSkeletonCards();
  refreshWishlistButton.addEventListener("click", () => loadWishlist(true));
  loadWishlist();
  refreshIcons();
}

async function loadWishlist(force = false) {
  if (wishlistLoading) {
    return;
  }

  wishlistLoading = true;
  setRefreshState(true);
  wishlistUpdated.textContent = "Syncing";

  try {
    const query = force ? "?force=1" : "";
    const response = await fetch(`/api/wishlist${query}`, {
      headers: {
        "Accept": "application/json"
      }
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "Wishlist sync failed.");
    }

    wishlistItems = Array.isArray(payload.items) ? payload.items : [];
    renderWishlist();
    wishlistUpdated.textContent = `Updated ${formatTime(payload.asOf)}`;
  } catch (error) {
    renderError(error);
    wishlistUpdated.textContent = "Offline";
  } finally {
    wishlistLoading = false;
    setRefreshState(false);
  }
}

function renderWishlist() {
  wishlistGrid.innerHTML = "";

  wishlistItems.forEach((item) => {
    wishlistGrid.appendChild(renderWishlistCard(item));
  });

  wishlistEmpty.hidden = wishlistItems.length > 0;
  updateSummary();
  refreshIcons();
}

function renderWishlistCard(item) {
  const card = document.createElement("article");
  card.className = `wishlist-card${item.purchased ? " card-purchased" : ""}`;
  card.dataset.itemId = item.id;

  const media = item.linkUrl ? document.createElement("a") : document.createElement("div");
  media.className = "card-media";

  if (item.linkUrl) {
    media.href = item.linkUrl;
    media.target = "_blank";
    media.rel = "noopener noreferrer";
    media.setAttribute("aria-label", `Open ${item.title}`);
  }

  if (item.imageUrl) {
    const image = document.createElement("img");
    image.src = item.imageUrl;
    image.alt = item.title;
    image.loading = "lazy";
    image.addEventListener("error", () => {
      image.replaceWith(renderImagePlaceholder());
      refreshIcons();
    }, { once: true });
    media.appendChild(image);
  } else {
    media.appendChild(renderImagePlaceholder());
  }

  const statusTag = document.createElement("span");
  statusTag.className = `status-tag status-${item.statusClass}`;
  statusTag.dataset.role = "status";
  statusTag.textContent = item.status;
  media.appendChild(statusTag);

  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("h2");
  title.className = "card-title";
  title.textContent = item.title;

  const meta = document.createElement("div");
  meta.className = "card-meta";

  const price = document.createElement("strong");
  price.className = "card-price";
  price.textContent = formatCurrency(item.price);

  const link = document.createElement("a");
  link.className = "card-link";
  link.href = item.linkUrl || item.notionUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.innerHTML = `<i data-lucide="external-link"></i><span>Open item</span>`;

  meta.append(price, link);
  body.append(title, meta);

  const button = document.createElement("button");
  button.className = "purchase-button";
  button.type = "button";
  setCardButtonContent(button, item);
  button.addEventListener("click", () => togglePurchasedState(item, card));

  card.append(media, body, button);
  return card;
}

function renderImagePlaceholder() {
  const placeholder = document.createElement("div");
  placeholder.className = "card-media-placeholder";
  placeholder.innerHTML = `<i data-lucide="gift"></i>`;
  return placeholder;
}

async function togglePurchasedState(item, card) {
  const previousStatus = item.status;
  const previousStatusClass = item.statusClass;
  const previousPurchased = item.purchased;
  const nextStatus = item.purchased ? NOT_PURCHASED_STATUS : PURCHASED_STATUS;

  applyWishlistStatus(item, card, nextStatus, { isUpdating: true });

  try {
    const response = await fetch(`/api/wishlist/items/${encodeURIComponent(item.id)}/status`, {
      method: "PATCH",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: nextStatus
      })
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "Purchase update failed.");
    }

    if (payload.item) {
      replaceWishlistItem(payload.item);
      updateCardFromItem(card, payload.item);
    }

    wishlistUpdated.textContent = `Updated ${formatTime(payload.asOf)}`;
  } catch (error) {
    item.status = previousStatus;
    item.statusClass = previousStatusClass;
    item.purchased = previousPurchased;
    item.isUpdating = false;
    updateCardFromItem(card, item);
    wishlistUpdated.textContent = "Update failed";
  }
}

function applyWishlistStatus(item, card, status, { isUpdating = false } = {}) {
  item.status = status;
  item.statusClass = slugifyStatus(status);
  item.purchased = status === PURCHASED_STATUS;
  item.isUpdating = isUpdating;
  updateCardFromItem(card, item);
  replaceWishlistItem(item);
}

function updateCardFromItem(card, item) {
  card.classList.toggle("card-purchased", item.purchased);

  const statusTag = card.querySelector("[data-role='status']");
  if (statusTag) {
    statusTag.className = `status-tag status-${item.statusClass}`;
    statusTag.textContent = item.status;
  }

  const button = card.querySelector(".purchase-button");
  if (button) {
    button.disabled = Boolean(item.isUpdating);
    setCardButtonContent(button, item);
  }

  updateSummary();
  refreshIcons();
}

function setCardButtonContent(button, item) {
  const icon = item.purchased ? "rotate-ccw" : "check";
  const label = item.purchased ? "Undo purchase" : "I bought this";
  button.innerHTML = `<i data-lucide="${icon}"></i><span>${label}</span>`;
  button.setAttribute("aria-label", `${label}: ${item.title}`);
}

function replaceWishlistItem(nextItem) {
  wishlistItems = wishlistItems.map((item) => (
    item.id === nextItem.id ? { ...item, ...nextItem, isUpdating: false } : item
  ));
}

function updateSummary() {
  const total = wishlistItems.length;
  const purchased = wishlistItems.filter((item) => item.purchased).length;

  wishlistTotal.textContent = total.toLocaleString();
  wishlistOpen.textContent = (total - purchased).toLocaleString();
  wishlistPurchased.textContent = purchased.toLocaleString();
}

function renderSkeletonCards() {
  wishlistGrid.innerHTML = "";
  wishlistEmpty.hidden = true;

  for (let index = 0; index < 6; index += 1) {
    const card = document.createElement("article");
    card.className = "wishlist-card skeleton-card";
    wishlistGrid.appendChild(card);
  }
}

function renderError(error) {
  wishlistGrid.innerHTML = "";
  wishlistEmpty.hidden = false;
  wishlistEmpty.querySelector("strong").textContent = error?.message || "Wishlist unavailable.";
  wishlistTotal.textContent = "--";
  wishlistOpen.textContent = "--";
  wishlistPurchased.textContent = "--";
  refreshIcons();
}

function setRefreshState(isLoading) {
  refreshWishlistButton.disabled = isLoading;
  refreshWishlistButton.classList.toggle("is-loading", isLoading);
}

function formatCurrency(value) {
  if (!Number.isFinite(value)) {
    return "Price pending";
  }

  return new Intl.NumberFormat([], {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatTime(value) {
  const date = new Date(value || Date.now());

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function slugifyStatus(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "unknown";
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
