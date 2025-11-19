const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 4000;

const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(__dirname, "uploads");

async function ensureDirs() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safeName);
  }
});

const upload = multer({ storage });

async function readJson(file) {
  try {
    const full = path.join(dataDir, file);
    const raw = await fs.readFile(full, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

async function writeJson(file, data) {
  const full = path.join(dataDir, file);
  await fs.writeFile(full, JSON.stringify(data, null, 2), "utf8");
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "GAMIFY API çalışır" });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Bütün qeydiyyat xanaları vacibdir" });
    }

    const users = await readJson("users.json");
    const exists = users.find((u) => u.email === email);
    if (exists) {
      return res
        .status(400)
        .json({ ok: false, message: "Bu email artıq qeydiyyatdan keçib" });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now().toString(),
      name,
      email,
      passwordHash: hash,
      balance: 0,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    await writeJson("users.json", users);

    res.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, balance: 0 }
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Server xətası" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Email və şifrə vacibdir" });
    }

    const users = await readJson("users.json");
    const user = users.find((u) => u.email === email);
    if (!user) {
      return res
        .status(400)
        .json({ ok: false, message: "Istifadəçi tapılmadı" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ ok: false, message: "Yanlış şifrə" });
    }

    res.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        balance: user.balance || 0
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Server xətası" });
  }
});

app.get("/api/me", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res
        .status(400)
        .json({ ok: false, message: "Email göndərilməyib" });
    }

    const users = await readJson("users.json");
    const user = users.find((u) => u.email === email);
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, message: "Istifadəçi tapılmadı" });
    }

    res.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        balance: user.balance || 0,
        createdAt: user.createdAt
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Server xətası" });
  }
});

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ ok: false, message: "Bütün xanalar vacibdir" });
    }

    const list = await readJson("contacts.json");
    const item = {
      id: Date.now().toString(),
      name,
      email,
      message,
      createdAt: new Date().toISOString()
    };
    list.push(item);
    await writeJson("contacts.json", list);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Server xətası" });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { items, customer } = req.body;
    if (!Array.isArray(items) || !items.length) {
      return res
        .status(400)
        .json({ ok: false, message: "Səbət boş və ya natamamdır" });
    }
    if (!customer) {
      return res
        .status(400)
        .json({ ok: false, message: "Sifariş üçün əvvəlcə daxil olmalısan" });
    }

    const total = items.reduce((sum, it) => {
      const p = typeof it.price === "number" ? it.price : Number(it.price || 0);
      return sum + (Number.isNaN(p) ? 0 : p);
    }, 0);

    if (!total || Number.isNaN(total) || total <= 0) {
      return res
        .status(400)
        .json({ ok: false, message: "Məbləğ düzgün hesablanmadı" });
    }

    const users = await readJson("users.json");
    const user = users.find((u) => u.email === customer);
    if (!user) {
      return res
        .status(400)
        .json({ ok: false, message: "Istifadəçi tapılmadı" });
    }

    const currentBalance = Number(user.balance || 0);
    if (currentBalance < total) {
      return res
        .status(400)
        .json({ ok: false, message: "Kifayət qədər balans yoxdur" });
    }

    const newBalance = +(currentBalance - total).toFixed(2);
    user.balance = newBalance;
    await writeJson("users.json", users);

    const orders = await readJson("orders.json");
    const order = {
      id: "ORD-" + Date.now().toString(),
      email: customer,
      items,
      total: +total.toFixed(2),
      status: "pending",
      createdAt: new Date().toISOString()
    };
    orders.push(order);
    await writeJson("orders.json", orders);

    res.json({ ok: true, orderId: order.id, order, balance: newBalance });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Server xətası" });
  }
});

app.get("/api/my-orders", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res
        .status(400)
        .json({ ok: false, message: "Email göndərilməyib" });
    }
    const orders = await readJson("orders.json");
    const filtered = orders.filter((o) => o.email === email);
    res.json({ ok: true, orders: filtered });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Server xətası" });
  }
});

app.post(
  "/api/balance-topup",
  upload.single("receipt"),
  async (req, res) => {
    try {
      const { email, amount, method, gamifyId } = req.body;
      if (!email || !amount || !method) {
        return res
          .status(400)
          .json({ ok: false, message: "Bütün xanalar vacibdir" });
      }

      const numericAmount = Number(
        typeof amount === "string" ? amount.replace(",", ".") : amount
      );
      if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
        return res
          .status(400)
          .json({ ok: false, message: "Məbləğ düzgün deyil" });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ ok: false, message: "Qəbz şəkli əlavə edilməyib" });
      }

      const requests = await readJson("balanceRequests.json");
      const item = {
        id: Date.now().toString(),
        email,
        gamifyId: gamifyId || null,
        amount: +numericAmount.toFixed(2),
        method,
        status: "pending",
        receiptFilename: req.file.filename,
        receiptUrl: "/uploads/" + req.file.filename,
        createdAt: new Date().toISOString()
      };
      requests.push(item);
      await writeJson("balanceRequests.json", requests);

      res.json({ ok: true, request: item });
    } catch (e) {
      res.status(500).json({ ok: false, message: "Server xətası" });
    }
  }
);

app.get("/api/my-balance-requests", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res
        .status(400)
        .json({ ok: false, message: "Email göndərilməyib" });
    }
    const list = await readJson("balanceRequests.json");
    const filtered = list.filter((r) => r.email === email);
    res.json({ ok: true, requests: filtered });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Server xətası" });
  }
});

app.get("/api/admin/orders", async (req, res) => {
  try {
    const orders = await readJson("orders.json");
    res.json({ ok: true, orders });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Server xətası" });
  }
});

app.patch("/api/admin/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ ok: false, message: "Yanlış status" });
    }
    const orders = await readJson("orders.json");
    const order = orders.find((o) => o.id === id);
    if (!order) {
      return res
        .status(404)
        .json({ ok: false, message: "Sifariş tapılmadı" });
    }
    order.status = status;
    order.updatedAt = new Date().toISOString();
    await writeJson("orders.json", orders);
    res.json({ ok: true, order });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Server xətası" });
  }
});

app.get("/api/admin/contacts", async (req, res) => {
  try {
    const messages = await readJson("contacts.json");
    res.json({ ok: true, messages });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Server xətası" });
  }
});

app.get("/api/admin/balance-requests", async (req, res) => {
  try {
    const requests = await readJson("balanceRequests.json");
    res.json({ ok: true, requests });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Server xətası" });
  }
});

app.patch("/api/admin/balance-requests/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const requests = await readJson("balanceRequests.json");
    const request = requests.find((r) => r.id === id);
    if (!request) {
      return res
        .status(404)
        .json({ ok: false, message: "Sorğu tapılmadı" });
    }
    if (request.status === "approved") {
      return res.json({ ok: true, request });
    }

    const users = await readJson("users.json");
    const user = users.find((u) => u.email === request.email);
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, message: "Istifadəçi tapılmadı" });
    }

    const currentBalance = Number(user.balance || 0);
    const newBalance = currentBalance + Number(request.amount || 0);
    user.balance = +newBalance.toFixed(2);
    await writeJson("users.json", users);

    request.status = "approved";
    request.updatedAt = new Date().toISOString();
    await writeJson("balanceRequests.json", requests);

    res.json({ ok: true, request, balance: user.balance });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Server xətası" });
  }
});

app.patch("/api/admin/balance-requests/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const requests = await readJson("balanceRequests.json");
    const request = requests.find((r) => r.id === id);
    if (!request) {
      return res
        .status(404)
        .json({ ok: false, message: "Sorğu tapılmadı" });
    }
    request.status = "rejected";
    request.updatedAt = new Date().toISOString();
    await writeJson("balanceRequests.json", requests);
    res.json({ ok: true, request });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Server xətası" });
  }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await readJson("users.json");
    const safeUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      balance: u.balance || 0,
      createdAt: u.createdAt
    }));
    res.json({ ok: true, users: safeUsers });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Server xətası" });
  }
});

app.patch("/api/admin/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password } = req.body;

    if (!email && !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Heç bir dəyişiklik göndərilməyib" });
    }

    const users = await readJson("users.json");
    const user = users.find((u) => u.id === id);
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, message: "Istifadəçi tapılmadı" });
    }

    const oldEmail = user.email;

    if (email && email !== user.email) {
      user.email = email;

      const orders = await readJson("orders.json");
      let changedOrders = false;
      orders.forEach((o) => {
        if (o.email === oldEmail) {
          o.email = email;
          changedOrders = true;
        }
      });
      if (changedOrders) {
        await writeJson("orders.json", orders);
      }

      const balanceRequests = await readJson("balanceRequests.json");
      let changedReq = false;
      balanceRequests.forEach((r) => {
        if (r.email === oldEmail) {
          r.email = email;
          changedReq = true;
        }
      });
      if (changedReq) {
        await writeJson("balanceRequests.json", balanceRequests);
      }
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      user.passwordHash = hash;
    }

    await writeJson("users.json", users);

    res.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        balance: user.balance || 0,
        createdAt: user.createdAt
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Server xətası" });
  }
});

ensureDirs().then(() => {
  app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} ünvanında işə düşdü`);
  });
});