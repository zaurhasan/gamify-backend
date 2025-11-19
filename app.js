const API_BASE = "https://gamify-backend-3b23.onrender.com";

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const productGrid = document.getElementById("productGrid");
const toast = document.getElementById("toast");
const cartCount = document.getElementById("cartCount");
const contactForm = document.getElementById("contactForm");
const loginBtn = document.getElementById("loginBtn");
const cartBtn = document.getElementById("cartBtn");
const balanceBtn = document.getElementById("balanceBtn");
const goToProducts = document.getElementById("goToProducts");
const goToDeals = document.getElementById("goToDeals");
const productCardsWithDetail = document.querySelectorAll(".product-card[data-detail]");
const cartBody = document.getElementById("cartBody");
const emptyCart = document.getElementById("emptyCart");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const cartSummary = document.getElementById("cartSummary");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const balanceForm = document.getElementById("balanceForm");

const accountUserName = document.getElementById("accountUserName");
const accountUserEmail = document.getElementById("accountUserEmail");
const accountAvatar = document.getElementById("accountAvatar");
const logoutBtn = document.getElementById("logoutBtn");
const myOrdersBody = document.getElementById("myOrdersBody");
const myOrdersEmpty = document.getElementById("myOrdersEmpty");
const myPaymentsBody = document.getElementById("myPaymentsBody");
const myPaymentsEmpty = document.getElementById("myPaymentsEmpty");
const accountBalanceValue = document.getElementById("accountBalanceValue");

let cartItems = [];
let currentUser = null;

function showToast(message, isError) {
  if (!toast) return;
  toast.textContent = message;
  toast.style.borderColor = isError ? "#f97373" : "rgba(34, 197, 94, 0.6)";
  toast.classList.add("show");
  setTimeout(function () {
    toast.classList.remove("show");
  }, 2200);
}

function loadUserFromStorage() {
  try {
    const raw = localStorage.getItem("gamify_user");
    if (!raw) return;
    const u = JSON.parse(raw);
    if (u && u.email) currentUser = u;
  } catch (e) {}
}

function saveUserToStorage() {
  if (!currentUser) {
    localStorage.removeItem("gamify_user");
    return;
  }
  try {
    localStorage.setItem("gamify_user", JSON.stringify(currentUser));
  } catch (e) {}
}

function updateLoginButtonLabel() {
  if (!loginBtn) return;
  if (currentUser && currentUser.name) {
    loginBtn.textContent = currentUser.name;
  } else {
    loginBtn.textContent = "Daxil ol";
  }
}

function updateAccountHeader() {
  if (accountUserName) {
    if (currentUser && currentUser.name) {
      accountUserName.textContent = currentUser.name;
    } else {
      accountUserName.textContent = "Qonaq";
    }
  }
  if (accountUserEmail) {
    if (currentUser && currentUser.email) {
      accountUserEmail.textContent = currentUser.email;
    } else {
      accountUserEmail.textContent = "";
    }
  }
  if (accountAvatar) {
    let letter = "U";
    if (currentUser && currentUser.name && currentUser.name.trim().length > 0) {
      letter = currentUser.name.trim().charAt(0).toUpperCase();
    }
    accountAvatar.textContent = letter;
  }
}

function updateAccountBalanceDisplay() {
  if (!accountBalanceValue) return;
  const value =
    currentUser && typeof currentUser.balance === "number"
      ? currentUser.balance
      : 0;
  accountBalanceValue.textContent = value.toFixed(2) + " ₼";
}

function refreshCurrentUserFromServer() {
  if (!currentUser || !currentUser.email) {
    updateAccountBalanceDisplay();
    return;
  }
  fetch(API_BASE + "/api/me?email=" + encodeURIComponent(currentUser.email))
    .then(function (res) {
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (data) {
          return { ok: res.ok, data: data };
        });
    })
    .then(function (result) {
      if (!result.ok || !result.data || !result.data.user) {
        updateAccountBalanceDisplay();
        return;
      }
      currentUser = result.data.user;
      saveUserToStorage();
      updateLoginButtonLabel();
      updateAccountHeader();
      updateAccountBalanceDisplay();
    })
    .catch(function () {
      updateAccountBalanceDisplay();
    });
}

function updateCartCount() {
  if (!cartCount) return;
  cartCount.textContent = String(cartItems.length);
}

function renderCartPage() {
  if (!cartBody) return;
  const cartTable = document.getElementById("cartTable");
  if (!cartItems.length) {
    cartBody.innerHTML = "";
    if (emptyCart) emptyCart.style.display = "block";
    if (cartTable) cartTable.style.display = "none";
    if (cartSummary) cartSummary.style.display = "none";
    if (cartTotal) cartTotal.textContent = "0 ₼";
    return;
  }
  if (emptyCart) emptyCart.style.display = "none";
  if (cartTable) cartTable.style.display = "table";
  if (cartSummary) cartSummary.style.display = "block";
  cartBody.innerHTML = "";
  let total = 0;
  cartItems.forEach(function (item, index) {
    const tr = document.createElement("tr");
    const typeLabel =
      item.type === "pubg"
        ? "PUBG Mobile"
        : item.type === "ff"
        ? "Free Fire"
        : item.type === "val"
        ? "Valorant"
        : item.type === "ps"
        ? "PlayStation"
        : "";
    const price = typeof item.price === "number" ? item.price : 0;
    total += price;
    tr.innerHTML =
      "<td>" +
      (index + 1) +
      "</td>" +
      "<td>" +
      (item.name || "") +
      "</td>" +
      "<td>" +
      price.toFixed(2) +
      " ₼</td>" +
      "<td>" +
      typeLabel +
      "</td>" +
      '<td><button class="btn-sm" data-remove-index="' +
      index +
      '">Sil</button></td>';
    cartBody.appendChild(tr);
  });
  if (cartTotal) cartTotal.textContent = total.toFixed(2) + " ₼";
  const removeButtons = cartBody.querySelectorAll("button[data-remove-index]");
  removeButtons.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      const idx = parseInt(btn.getAttribute("data-remove-index"), 10);
      if (!isNaN(idx)) {
        cartItems.splice(idx, 1);
        saveCartToStorage();
        updateCartCount();
        renderCartPage();
      }
      e.stopPropagation();
      e.preventDefault();
    });
  });
}

function loadCartFromStorage() {
  try {
    const storedItems = localStorage.getItem("gamify_cart_items");
    if (storedItems) {
      const parsed = JSON.parse(storedItems);
      if (Array.isArray(parsed)) {
        cartItems = parsed;
      }
    }
  } catch (e) {}
  updateCartCount();
  renderCartPage();
}

function saveCartToStorage() {
  try {
    localStorage.setItem("gamify_cart_items", JSON.stringify(cartItems));
  } catch (e) {}
}

function handleGameIdPrompt(button) {
  let msg = "";
  if (button.classList.contains("uc-order-btn")) {
    msg = "PUBG Mobile oyun ID-ni daxil et:";
  } else if (button.classList.contains("ff-order-btn")) {
    msg = "Free Fire oyun ID-ni daxil et:";
  } else if (button.classList.contains("val-order-btn")) {
    msg = "Riot ID və tag-ı daxil et:";
  } else if (button.classList.contains("ps-order-btn")) {
    msg = "PlayStation hesab e-mail və ya nickname-ni daxil et:";
  }
  if (!msg) return "";
  const result = window.prompt(msg);
  if (!result || !result.trim()) {
    showToast("Məlumat daxil edilmədi", true);
    return null;
  }
  return result.trim();
}

function bindCartButtons() {
  const buttons = document.querySelectorAll(".add-to-cart");
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      e.preventDefault();

      if (!currentUser || !currentUser.email) {
        showToast("Sifariş üçün əvvəlcə hesabına daxil ol", true);
        return;
      }

      let gameId = "";
      if (
        btn.classList.contains("uc-order-btn") ||
        btn.classList.contains("ff-order-btn") ||
        btn.classList.contains("val-order-btn") ||
        btn.classList.contains("ps-order-btn")
      ) {
        const result = handleGameIdPrompt(btn);
        if (result === null) {
          return;
        }
        gameId = result;
      }

      const name = btn.getAttribute("data-product") || "Məhsul";
      const rawPrice = btn.getAttribute("data-price") || "0";
      const price = parseFloat(rawPrice);
      let type = "other";
      if (btn.classList.contains("uc-order-btn")) type = "pubg";
      else if (btn.classList.contains("ff-order-btn")) type = "ff";
      else if (btn.classList.contains("val-order-btn")) type = "val";
      else if (btn.classList.contains("ps-order-btn")) type = "ps";

      const payload = {
        email: currentUser.email,
        item: {
          name: name,
          price: isNaN(price) ? 0 : price,
          type: type,
          gameId: gameId || null
        }
      };

      fetch(API_BASE + "/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res
            .json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              return { ok: res.ok, data: data };
            });
        })
        .then(function (result) {
          if (!result.ok || !result.data || !result.data.ok) {
            const msg =
              (result.data && result.data.message) ||
              "Sifarişi tamamlayarkən xəta baş verdi";
            showToast(msg, true);
            return;
          }

          const response = result.data;

          if (typeof response.balance === "number") {
            currentUser.balance = response.balance;
            saveUserToStorage();
            updateAccountBalanceDisplay();
          }

          const order = response.order;
          const msg =
            order && order.id
              ? "Sifariş qeydə alındı: " + order.id
              : "Sifariş qeydə alındı";
          showToast(msg, false);
          loadMyOrders();
        })
        .catch(function () {
          showToast("Serverə qoşulmaq alınmadı", true);
        });
    });
  });
}

function applyFilters() {
  if (!productGrid) return;
  const cards = productGrid.querySelectorAll(".product-card");
  const term = searchInput ? searchInput.value.toLowerCase() : "";
  const category = categoryFilter ? categoryFilter.value : "all";
  cards.forEach(function (card) {
    const text = card.innerText.toLowerCase();
    const cardCategory = card.getAttribute("data-category") || "all";
    const matchesText = !term || text.includes(term);
    const matchesCategory = category === "all" || category === cardCategory;
    card.style.display = matchesText && matchesCategory ? "" : "none";
  });
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return day + "." + month + "." + year + " " + hh + ":" + mm;
  } catch (e) {
    return iso;
  }
}

function statusLabel(status) {
  if (status === "approved") return "Təsdiqlənib";
  if (status === "rejected") return "Rədd edilib";
  return "Gözləmədə";
}

function statusClass(status) {
  if (status === "approved") return "status-approved";
  if (status === "rejected") return "status-rejected";
  return "status-pending";
}

function loadMyOrders() {
  if (!myOrdersBody) return;
  if (!currentUser || !currentUser.email) {
    myOrdersBody.innerHTML = "";
    if (myOrdersEmpty) {
      myOrdersEmpty.textContent =
        "Sifarişləri görmək üçün əvvəlcə daxİl olmalısan.";
      myOrdersEmpty.style.display = "block";
    }
    return;
  }
  myOrdersBody.innerHTML = "";
  if (myOrdersEmpty) {
    myOrdersEmpty.textContent = "Yüklənir...";
    myOrdersEmpty.style.display = "block";
  }
  fetch(API_BASE + "/api/my-orders?email=" + encodeURIComponent(currentUser.email))
    .then(function (res) {
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (data) {
          return { ok: res.ok, data: data };
        });
    })
    .then(function (result) {
      if (!result.ok) {
        if (myOrdersEmpty) {
          myOrdersEmpty.textContent = "Sifarişləri yükləmək alınmadı.";
          myOrdersEmpty.style.display = "block";
        }
        showToast("Sifarişləri yükləmək alınmadı", true);
        return;
      }
      const list = result.data && Array.isArray(result.data.orders) ? result.data.orders : [];
      if (!list.length) {
        if (myOrdersEmpty) {
          myOrdersEmpty.textContent = "Hələ heç bir sifarişin yoxdur.";
          myOrdersEmpty.style.display = "block";
        }
        return;
      }
      if (myOrdersEmpty) {
        myOrdersEmpty.style.display = "none";
      }
      list
        .slice()
        .reverse()
        .forEach(function (order) {
          const tr = document.createElement("tr");
          const productsText = Array.isArray(order.items)
            ? order.items
                .map(function (item) {
                  const price =
                    typeof item.price === "number"
                      ? item.price.toFixed(2) + " ₼"
                      : "";
                  const gameId = item.gameId ? " [" + item.gameId + "]" : "";
                  return (item.name || "Məhsul") + " (" + price + ")" + gameId;
                })
                .join(", ")
            : "";
          const total = Array.isArray(order.items)
            ? order.items.reduce(function (sum, item) {
                const p = typeof item.price === "number" ? item.price : 0;
                return sum + p;
              }, 0)
            : 0;
          const status = order.status || "pending";
          const statusHtml =
            '<span class="status-badge ' +
            statusClass(status) +
            '">' +
            statusLabel(status) +
            "</span>";
          tr.innerHTML =
            "<td>" +
            order.id +
            "</td>" +
            "<td>" +
            productsText +
            "</td>" +
            "<td>" +
            total.toFixed(2) +
            " ₼</td>" +
            "<td>" +
            statusHtml +
            "</td>" +
            "<td>" +
            formatDate(order.createdAt) +
            "</td>";
          myOrdersBody.appendChild(tr);
        });
    })
    .catch(function () {
      if (myOrdersEmpty) {
        myOrdersEmpty.textContent = "Sifarişləri yükləmək alınmadı.";
        myOrdersEmpty.style.display = "block";
      }
      showToast("Serverə qoşulmaq alınmadı", true);
    });
}

function loadMyPayments() {
  if (!myPaymentsBody) return;
  if (!currentUser || !currentUser.email) {
    myPaymentsBody.innerHTML = "";
    if (myPaymentsEmpty) {
      myPaymentsEmpty.textContent =
        "Ödənişləri görmək üçün əvvəlcə daxil olmalısan.";
      myPaymentsEmpty.style.display = "block";
    }
    return;
  }
  myPaymentsBody.innerHTML = "";
  if (myPaymentsEmpty) {
    myPaymentsEmpty.textContent = "Yüklənir...";
    myPaymentsEmpty.style.display = "block";
  }
  fetch(
    API_BASE +
      "/api/my-balance-requests?email=" +
      encodeURIComponent(currentUser.email)
  )
    .then(function (res) {
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (data) {
          return { ok: res.ok, data: data };
        });
    })
    .then(function (result) {
      if (!result.ok) {
        if (myPaymentsEmpty) {
          myPaymentsEmpty.textContent = "Ödənişləri yükləmək alınmadı.";
          myPaymentsEmpty.style.display = "block";
        }
        showToast("Ödənişləri yükləmək alınmadı", true);
        return;
      }
      const list =
        result.data && Array.isArray(result.data.requests)
          ? result.data.requests
          : [];
      if (!list.length) {
        if (myPaymentsEmpty) {
          myPaymentsEmpty.textContent =
            "Hələ heç bir ödəniş tələbin yoxdur.";
          myPaymentsEmpty.style.display = "block";
        }
        return;
      }
      if (myPaymentsEmpty) {
        myPaymentsEmpty.style.display = "none";
      }
      list
        .slice()
        .reverse()
        .forEach(function (item) {
          const tr = document.createElement("tr");
          const amount = Number(item.amount || 0).toFixed(2) + " ₼";
          const methodLabel =
            item.method === "kapital"
              ? "Kapital Bank"
              : item.method === "leobank"
              ? "Leobank"
              : item.method || "";
          const status = item.status || "pending";
          const statusHtml =
            '<span class="status-badge ' +
            statusClass(status) +
            '">' +
            statusLabel(status) +
            "</span>";
          const receiptHtml = item.receiptUrl
            ? '<a href="http://localhost:4000' +
              item.receiptUrl +
              '" target="_blank">Bax</a>'
            : "-";
          tr.innerHTML =
            "<td>" +
            item.id +
            "</td>" +
            "<td>" +
            amount +
            "</td>" +
            "<td>" +
            methodLabel +
            "</td>" +
            "<td>" +
            statusHtml +
            "</td>" +
            "<td>" +
            formatDate(item.createdAt) +
            "</td>" +
            "<td>" +
            receiptHtml +
            "</td>";
          myPaymentsBody.appendChild(tr);
        });
    })
    .catch(function () {
      if (myPaymentsEmpty) {
        myPaymentsEmpty.textContent = "Ödənişləri yükləmək alınmadı.";
        myPaymentsEmpty.style.display = "block";
      }
      showToast("Serverə qoşulmaq alınmadı", true);
    });
}

if (searchInput) {
  searchInput.addEventListener("input", applyFilters);
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", applyFilters);
}

if (contactForm) {
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("name");
    const email = document.getElementById("email");
    const message = document.getElementById("message");
    if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
      showToast("Zəhmət olmasa bütün xanaları doldur", true);
      return;
    }
    const payload = {
      name: name.value.trim(),
      email: email.value.trim(),
      message: message.value.trim()
    };
    fetch(API_BASE + "/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res
          .json()
          .catch(function () {
            return {};
          })
          .then(function (data) {
            return { ok: res.ok, data: data };
          });
      })
      .then(function (result) {
        if (!result.ok) {
          const msg =
            (result.data && result.data.message) || "Xəta baş verdi";
          showToast(msg, true);
          return;
        }
        name.value = "";
        email.value = "";
        message.value = "";
        showToast("Mesaj serverə göndərildi", false);
      })
      .catch(function () {
        showToast("Serverə qoşulmaq alınmadı", true);
      });
  });
}

if (loginBtn) {
  loginBtn.addEventListener("click", function () {
    if (currentUser && currentUser.email) {
      window.location.href = "account.html";
    } else {
      window.location.href = "auth.html";
    }
  });
}

if (balanceBtn) {
  balanceBtn.addEventListener("click", function () {
    if (!currentUser || !currentUser.email) {
      showToast("Balans artırmaq üçün əvvəlcə daxil olun", true);
      return;
    }
    window.location.href = "balance.html";
  });
}

if (goToProducts) {
  goToProducts.addEventListener("click", function () {
    const section = document.getElementById("products");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  });
}

if (goToDeals) {
  goToDeals.addEventListener("click", function () {
    const section = document.getElementById("deals");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  });
}

if (productCardsWithDetail.length) {
  productCardsWithDetail.forEach(function (card) {
    card.addEventListener("click", function (e) {
      const target = e.target;
      if (target.closest("button")) return;
      const detail = card.getAttribute("data-detail");
      if (detail) window.location.href = detail;
    });
  });
}

if (checkoutBtn) {
  checkoutBtn.addEventListener("click", function () {
    showToast("Səbət sistemi deaktiv edilib. Məhsulu birbaşa sifariş et düyməsi ilə al.", true);
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail");
    const password = document.getElementById("loginPassword");
    if (!email.value.trim() || !password.value.trim()) {
      showToast("Email və şifrəni doldur", true);
      return;
    }
    const payload = {
      email: email.value.trim(),
      password: password.value
    };
    fetch(API_BASE + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res
          .json()
          .catch(function () {
            return {};
          })
          .then(function (data) {
            return { ok: res.ok, data: data };
          });
      })
      .then(function (result) {
        if (!result.ok) {
          const msg =
            (result.data && result.data.message) ||
            "Daxil olarkən xəta baş verdi";
          showToast(msg, true);
          return;
        }
        currentUser = result.data.user;
        saveUserToStorage();
        updateLoginButtonLabel();
        updateAccountHeader();
        updateAccountBalanceDisplay();
        showToast("Xoş gəldin, " + currentUser.name, false);
        setTimeout(function () {
          window.location.href = "index.html";
        }, 900);
      })
      .catch(function () {
        showToast("Serverə qoşulmaq alınmadı", true);
      });
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("registerName");
    const email = document.getElementById("registerEmail");
    const password = document.getElementById("registerPassword");
    if (!name.value.trim() || !email.value.trim() || !password.value.trim()) {
      showToast("Bütün qeydiyyat xanalarını doldur", true);
      return;
    }
    const payload = {
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value
    };
    fetch(API_BASE + "/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res
          .json()
          .catch(function () {
            return {};
          })
          .then(function (data) {
            return { ok: res.ok, data: data };
          });
      })
      .then(function (result) {
        if (!result.ok) {
          const msg =
            (result.data && result.data.message) ||
            "Qeydiyyat zamanı xəta baş verdi";
          showToast(msg, true);
          return;
        }
        const user = result.data.user;
        name.value = "";
        email.value = "";
        password.value = "";
        showToast("Qeydiyyat uğurla tamamlandı", false);
        const loginEmail = document.getElementById("loginEmail");
        if (loginEmail) loginEmail.value = user.email;
        const tabs = document.querySelectorAll(".auth-tab-btn");
        const panels = document.querySelectorAll(".auth-tab-panel");
        tabs.forEach(function (btn) {
          const tab = btn.getAttribute("data-tab");
          const active = tab === "login";
          btn.classList.toggle("active", active);
        });
        panels.forEach(function (panel) {
          const tab = panel.getAttribute("data-tab-panel");
          const active = tab === "login";
          panel.classList.toggle("active", active);
        });
      })
      .catch(function () {
        showToast("Serverə qoşulmaq alınmadı", true);
      });
  });
}

function initBalancePage() {
  if (!balanceForm) return;

  const methodInput = document.getElementById("balanceMethod");
  const idInput = document.getElementById("balanceId");
  const amountInput = document.getElementById("balanceAmount");
  const receiptInput = document.getElementById("balanceReceipt");
  const resultBox = document.getElementById("balanceResult");
  const buttons = document.querySelectorAll(".balance-request-btn");
  const fileNameSpan = document.getElementById("balanceReceiptName");

  if (receiptInput && fileNameSpan) {
    receiptInput.addEventListener("change", function () {
      if (receiptInput.files && receiptInput.files.length) {
        fileNameSpan.textContent = receiptInput.files[0].name;
      } else {
        fileNameSpan.textContent = "Fayl seçilməyib";
      }
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!currentUser || !currentUser.email) {
        showToast("Balans artırmaq üçün əvvəlcə daxil ol", true);
        return;
      }

      if (!amountInput || !amountInput.value.trim()) {
        showToast("Məbləği daxil et", true);
        return;
      }

      if (!receiptInput || !receiptInput.files || !receiptInput.files.length) {
        showToast("Qəbz şəklini əlavə et", true);
        return;
      }

      const method = btn.getAttribute("data-method") || "";

      const fd = new FormData();
      fd.append("email", currentUser.email);
      fd.append("amount", amountInput.value.trim());
      if (method) fd.append("method", method);
      if (methodInput && methodInput.value) fd.append("method", methodInput.value);
      if (idInput && idInput.value.trim()) fd.append("gamifyId", idInput.value.trim());
      fd.append("receipt", receiptInput.files[0]);

      fetch(API_BASE + "/api/balance-topup", {
        method: "POST",
        body: fd
      })
        .then(function (res) {
          return res
            .json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              return { ok: res.ok, data: data };
            });
        })
        .then(function (result) {
          if (!result.ok) {
            const msg =
              (result.data && result.data.message) ||
              "Sorğunu göndərərkən xəta baş verdi";
            showToast(msg, true);
            return;
          }

          if (amountInput) amountInput.value = "";
          if (idInput) idInput.value = "";
          if (receiptInput) receiptInput.value = "";
          if (fileNameSpan) fileNameSpan.textContent = "Fayl seçilməyib";
          if (methodInput) methodInput.value = "";
          if (resultBox) resultBox.style.display = "block";

          showToast("Balans artımı sorğusu göndərildi", false);
          refreshCurrentUserFromServer();
          loadMyPayments();
        })
        .catch(function () {
          showToast("Serverə qoşulmaq alınmadı", true);
        });
    });
  });
}

function bindAuthTabs() {
  const buttons = document.querySelectorAll(".auth-tab-btn");
  const panels = document.querySelectorAll(".auth-tab-panel");
  if (!buttons.length || !panels.length) return;
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const tab = btn.getAttribute("data-tab");
      buttons.forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      panels.forEach(function (p) {
        const name = p.getAttribute("data-tab-panel");
        p.classList.toggle("active", name === tab);
      });
    });
  });
}

function bindAccountTabs() {
  const buttons = document.querySelectorAll(".account-tab-btn");
  const panels = document.querySelectorAll(".account-panel");
  if (!buttons.length || !panels.length) return;
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const tab = btn.getAttribute("data-tab");
      buttons.forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      panels.forEach(function (p) {
        const name = p.getAttribute("data-tab-panel");
        p.classList.toggle("active", name === tab);
      });
      if (tab === "orders") loadMyOrders();
      if (tab === "payments") {
        refreshCurrentUserFromServer();
        loadMyPayments();
      }
    });
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", function () {
    currentUser = null;
    saveUserToStorage();
    updateLoginButtonLabel();
    updateAccountHeader();
    updateAccountBalanceDisplay();
    showToast("Hesabdan çıxıldı", false);
    setTimeout(function () {
      window.location.href = "index.html";
    }, 800);
  });
}

loadUserFromStorage();
updateLoginButtonLabel();
updateAccountHeader();
updateAccountBalanceDisplay();
loadCartFromStorage();
bindCartButtons();
applyFilters();
bindAuthTabs();
bindAccountTabs();
refreshCurrentUserFromServer();
loadMyOrders();
loadMyPayments();
initBalancePage();