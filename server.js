const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "users.json");

app.use(cors());
app.use(express.json());

// === HELPERS ===

function readUsers() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeUsers(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// === ROUTES ===

// QEYDİYYAT
app.post("/api/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email və şifrə tələb olunur" });

  const users = readUsers();
  const exists = users.find(u => u.email === email);

  if (exists)
    return res.status(409).json({ message: "Bu email ilə istifadəçi mövcuddur" });

  const newUser = {
    id: Date.now().toString(),
    email,
    password,
    balance: 0
  };

  users.push(newUser);
  writeUsers(users);

  res.json({
    message: "Qeydiyyat uğurla tamamlandı",
    user: { email: newUser.email, balance: newUser.balance }
  });
});

// LOGIN
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const users = readUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user)
    return res.status(401).json({ message: "Email və ya şifrə yanlışdır" });

  res.json({
    message: "Giriş uğurludur",
    user: { email: user.email, balance: user.balance }
  });
});

// ADMIN — İSTİFADƏÇİLƏRİ AL
app.get("/api/users", (req, res) => {
  const users = readUsers();
  res.json(users.map(u => ({
    email: u.email,
    balance: u.balance
  })));
});

// BALANS ARTIRMA
app.post("/api/add-balance", (req, res) => {
  const { email, amount } = req.body;

  if (!email || isNaN(Number(amount)))
    return res.status(400).json({ message: "Email və balans dəyəri tələb olunur" });

  const users = readUsers();
  const user = users.find(u => u.email === email);

  if (!user)
    return res.status(404).json({ message: "İstifadəçi tapılmadı" });

  user.balance += Number(amount);
  writeUsers(users);

  res.json({
    message: "Balans uğurla artırıldı",
    user: { email: user.email, balance: user.balance }
  });
});

// SERVER START
app.listen(PORT, () => {
  console.log("Backend işə düşdü PORT:", PORT);
});
