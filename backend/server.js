const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const db = new sqlite3.Database("database.sqlite");

app.use(cors());
app.use(bodyParser.json());

// Criar tabelas se não existirem
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      email TEXT UNIQUE,
      senha TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orcamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT,
      ano INTEGER,
      valor_previsto REAL,
      valor_executado REAL,
      descricao TEXT,
      usuario_id INTEGER,
      FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
  )`);
});

// Rotas
app.post("/register", (req, res) => {
  const { nome, email, senha } = req.body;
  db.run("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
    [nome, email, senha],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  db.get("SELECT * FROM usuarios WHERE email = ? AND senha = ?", [email, senha], (err, row) => {
    if (row) res.json({ sucesso: true, usuario: row });
    else res.status(401).json({ sucesso: false, msg: "Credenciais inválidas" });
  });
});

app.get("/orcamentos", (req, res) => {
  db.all("SELECT * FROM orcamentos", [], (err, rows) => {
    res.json(rows);
  });
});

app.post("/orcamentos", (req, res) => {
  const { titulo, ano, valor_previsto, valor_executado, descricao, usuario_id } = req.body;
  db.run("INSERT INTO orcamentos (titulo, ano, valor_previsto, valor_executado, descricao, usuario_id) VALUES (?, ?, ?, ?, ?, ?)",
    [titulo, ano, valor_previsto, valor_executado, descricao, usuario_id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

app.listen(3000, () => console.log("Servidor rodando em http://localhost:3000"));
