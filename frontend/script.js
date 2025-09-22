/* script.js - controla index.html e orcamentos.html */
const API = "https://projeto-orcamentos.onrender.com";

/* ---------- utilitários ---------- */
function qs(id) { return document.getElementById(id); }
function escapeHTML(s) {
  if (!s && s !== 0) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* ---------- Persistência de preferências ---------- */
function applyThemeFromStorage() {
  const theme = localStorage.getItem("theme") || "light";
  if (theme === "dark") document.body.classList.add("dark");
  else document.body.classList.remove("dark");
}
function applyFontFromStorage() {
  const stored = localStorage.getItem("fontSize");
  if (stored) {
    const elements = document.querySelectorAll("body *");
    elements.forEach(el => el.style.fontSize = stored + "px");
  }
}

/* ---------- Acessibilidade: fonte e tema ---------- */
function alterarFonte(delta) {
  const elements = document.querySelectorAll("body *"); // todos os elementos
  elements.forEach(el => {
    const computed = window.getComputedStyle(el).fontSize;
    const cur = parseInt(computed.replace("px", ""));
    if (!isNaN(cur)) {
      let novo = cur + delta;
      if (novo < 12) novo = 12;
      if (novo > 36) novo = 36;
      el.style.fontSize = novo + "px";
    }
  });
  // salvar o tamanho da fonte do body como referência
  localStorage.setItem("fontSize", parseInt(window.getComputedStyle(document.body).fontSize));
}

function alternarTema() {
  document.body.classList.toggle("dark");
  const t = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("theme", t);
}

/* ---------- Autenticação: registro / login ---------- */
async function registrar() {
  const nome = qs("nomeRegistro").value.trim();
  const email = qs("emailRegistro").value.trim();
  const senha = qs("senhaRegistro").value.trim();
  if (!nome || !email || !senha) return alert("Preencha nome, email e senha.");

  try {
    const res = await fetch(API + "/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha })
    });
    const data = await res.json();
    if (res.ok && data.id) {
      alert("Usuário criado com sucesso! Agora faça login.");
      qs("emailLogin").value = email;
      qs("senhaLogin").value = senha;
    } else {
      alert("Erro ao registrar: " + (data.error || JSON.stringify(data)));
    }
  } catch (err) {
    console.error(err);
    alert("Erro ao conectar com o servidor. Verifique se o backend está rodando.");
  }
}

async function login() {
  const email = qs("emailLogin").value.trim();
  const senha = qs("senhaLogin").value.trim();
  if (!email || !senha) return alert("Preencha email e senha.");

  try {
    const res = await fetch(API + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha })
    });

    const data = await res.json();
    if (res.ok && data.sucesso) {
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      window.location.href = "orcamentos.html";
    } else {
      alert(data.msg || "Credenciais inválidas.");
    }
  } catch (err) {
    console.error(err);
    alert("Erro ao conectar com o servidor. Verifique se o backend está rodando.");
  }
}

/* ---------- Logout ---------- */
function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "index.html";
}

/* ---------- Orçamentos: cadastro e listagem ---------- */
async function cadastrarOrcamento() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  if (!usuario) return window.location.href = "index.html";

  const titulo = qs("titulo").value.trim();
  const ano = parseInt(qs("ano").value, 10);
  const previsto = parseFloat(qs("previsto").value) || 0;
  const executado = parseFloat(qs("executado").value) || 0;
  const descricao = qs("descricao").value.trim();

  if (!titulo || !ano) return alert("Preencha pelo menos título e ano.");

  try {
    const res = await fetch(API + "/orcamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo, ano, valor_previsto: previsto, valor_executado: executado,
        descricao, usuario_id: usuario.id
      })
    });
    const data = await res.json();
    if (res.ok) {
      qs("orcForm").reset();
      listarOrcamentos();
    } else {
      alert("Erro ao cadastrar: " + (data.error || JSON.stringify(data)));
    }
  } catch (err) {
    console.error(err);
    alert("Erro ao conectar com o servidor.");
  }
}

async function listarOrcamentos() {
  const tbody = qs("orcTableBody");
  tbody.innerHTML = "<tr><td colspan='5'>Carregando...</td></tr>";

  try {
    const res = await fetch(API + "/orcamentos");
    if (!res.ok) {
      tbody.innerHTML = "<tr><td colspan='5'>Erro ao carregar orçamentos</td></tr>";
      return;
    }
    const dados = await res.json();
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    if (!usuario) return window.location.href = "index.html";

    const meus = (dados || []).filter(o => Number(o.usuario_id) === Number(usuario.id));

    if (!meus.length) {
      tbody.innerHTML = "<tr><td colspan='5'>Nenhum orçamento cadastrado.</td></tr>";
      return;
    }

    tbody.innerHTML = "";
    meus.forEach(o => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHTML(o.titulo)}</td>
        <td>${escapeHTML(o.ano)}</td>
        <td>${Number(o.valor_previsto).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
        <td>${Number(o.valor_executado).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
        <td>${escapeHTML(o.descricao || "")}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='5'>Erro ao conectar com o servidor.</td></tr>";
  }
}

/* ---------- Inicialização da página ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // aplicar preferências
  applyThemeFromStorage();
  applyFontFromStorage();

  // conectar botões de acessibilidade
  document.querySelectorAll(".btn-increase-font").forEach(b => b.addEventListener("click", () => alterarFonte(1)));
  document.querySelectorAll(".btn-decrease-font").forEach(b => b.addEventListener("click", () => alterarFonte(-1)));
  document.querySelectorAll(".btn-toggle-theme").forEach(b => b.addEventListener("click", alternarTema));

  // index.html
  if (qs("loginCard")) {
    qs("btnRegister").addEventListener("click", registrar);
    qs("btnLogin").addEventListener("click", login);

    ["emailLogin","senhaLogin"].forEach(id => {
      const el = qs(id);
      if (!el) return;
      el.addEventListener("keydown", (e) => { if (e.key === "Enter") login(); });
    });
  }

  // orcamentos.html
  if (qs("orcamentosPage")) {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    if (!usuario) return window.location.href = "index.html";

    qs("userName").textContent = usuario.nome || usuario.email || "Usuário";
    qs("btnLogout").addEventListener("click", logout);

    const form = qs("orcForm");
    form && form.addEventListener("submit", (e) => {
      e.preventDefault();
      cadastrarOrcamento();
    });

    listarOrcamentos();
  }
});
