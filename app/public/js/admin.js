const tokenKey = "portfolio_admin_token";
const loginBox = document.getElementById("login-box");
const adminApp = document.getElementById("admin-app");
const loginForm = document.getElementById("login-form");
const loginStatus = document.getElementById("login-status");

const tabButtons = document.querySelectorAll(".admin-nav button[data-tab]");
const tabContents = {
  profile: document.getElementById("tab-profile"),
  projects: document.getElementById("tab-projects"),
  skills: document.getElementById("tab-skills"),
  messages: document.getElementById("tab-messages"),
};

function getToken() {
  return localStorage.getItem(tokenKey);
}

function setToken(token) {
  localStorage.setItem(tokenKey, token);
}

function clearToken() {
  localStorage.removeItem(tokenKey);
}

async function api(url, options = {}) {
  const headers = options.headers || {};
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || "Erreur API");
  }

  return body;
}

function showApp() {
  loginBox.style.display = "none";
  adminApp.style.display = "grid";
}

function showLogin() {
  adminApp.style.display = "none";
  loginBox.style.display = "block";
}

function switchTab(name) {
  Object.keys(tabContents).forEach((key) => {
    tabContents[key].style.display = key === name ? "block" : "none";
  });

  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === name);
  });
}

function renderProfileForm(profile) {
  tabContents.profile.innerHTML = `
    <h2>Profil</h2>
    <form id="profile-form">
      <label>Nom complet <input name="full_name" value="${profile.full_name || ""}" required /></label>
      <label>Titre <input name="title" value="${profile.title || ""}" required /></label>
      <label>Bio <textarea name="bio">${profile.bio || ""}</textarea></label>
      <label>Email <input name="email" value="${profile.email || ""}" /></label>
      <label>Téléphone <input name="phone" value="${profile.phone || ""}" /></label>
      <label>Localisation <input name="location" value="${profile.location || ""}" /></label>
      <label>Lien CV <input name="cv_url" value="${profile.cv_url || ""}" /></label>
      <label>LinkedIn <input name="linkedin_url" value="${profile.linkedin_url || ""}" /></label>
      <label>GitHub <input name="github_url" value="${profile.github_url || ""}" /></label>
      <button class="btn" type="submit">Enregistrer</button>
      <p id="profile-status" class="status"></p>
    </form>
  `;

  document.getElementById("profile-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.getElementById("profile-status");
    const formData = new FormData(event.target);
    const payload = Object.fromEntries(formData.entries());

    try {
      await api("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      status.className = "status success";
      status.textContent = "Profil mis à jour.";
    } catch (error) {
      status.className = "status error";
      status.textContent = error.message;
    }
  });
}

function renderProjects(projects) {
  tabContents.projects.innerHTML = `
    <h2>Projets</h2>
    <form id="project-form">
      <label>Titre <input name="title" required /></label>
      <label>Description <textarea name="description" required></textarea></label>
      <label>Type
        <select name="type">
          <option value="projet">Projet</option>
          <option value="experience">Expérience</option>
        </select>
      </label>
      <label>Lien projet <input name="project_url" /></label>
      <label>Image URL <input name="image_url" /></label>
      <label><input type="checkbox" name="is_featured" /> Mettre en avant</label>
      <button class="btn" type="submit">Ajouter</button>
      <p id="project-status" class="status"></p>
    </form>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Titre</th><th>Type</th><th>Action</th></tr></thead>
        <tbody>
          ${projects
            .map(
              (project) => `
            <tr>
              <td>${project.title}</td>
              <td>${project.type}</td>
              <td><button class="btn danger" data-delete-project="${project.id_project}">Supprimer</button></td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("project-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = Object.fromEntries(formData.entries());
    payload.is_featured = event.target.is_featured.checked;

    try {
      await api("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await loadAdminData();
    } catch (error) {
      const status = document.getElementById("project-status");
      status.className = "status error";
      status.textContent = error.message;
    }
  });

  tabContents.projects.querySelectorAll("[data-delete-project]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await api(`/api/admin/projects/${btn.dataset.deleteProject}`, { method: "DELETE" });
        await loadAdminData();
      } catch (error) {
        alert(error.message);
      }
    });
  });
}

function renderSkills(skills) {
  tabContents.skills.innerHTML = `
    <h2>Compétences</h2>
    <form id="skill-form">
      <label>Nom <input name="name" required /></label>
      <label>Catégorie
        <select name="category">
          <option value="technique">Technique</option>
          <option value="transversale">Transversale</option>
        </select>
      </label>
      <label>Niveau (1 à 5) <input type="number" min="1" max="5" name="level" value="3" /></label>
      <button class="btn" type="submit">Ajouter</button>
    </form>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Nom</th><th>Catégorie</th><th>Niveau</th><th>Action</th></tr></thead>
        <tbody>
          ${skills
            .map(
              (skill) => `
            <tr>
              <td>${skill.name}</td>
              <td>${skill.category}</td>
              <td>${skill.level || "-"}</td>
              <td><button class="btn danger" data-delete-skill="${skill.id_skill}">Supprimer</button></td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("skill-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = Object.fromEntries(formData.entries());

    try {
      await api("/api/admin/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await loadAdminData();
    } catch (error) {
      alert(error.message);
    }
  });

  tabContents.skills.querySelectorAll("[data-delete-skill]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await api(`/api/admin/skills/${btn.dataset.deleteSkill}`, { method: "DELETE" });
        await loadAdminData();
      } catch (error) {
        alert(error.message);
      }
    });
  });
}

function renderMessages(messages) {
  tabContents.messages.innerHTML = `
    <h2>Messages reçus</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Expéditeur</th><th>Sujet</th><th>Message</th><th>Action</th></tr></thead>
        <tbody>
          ${messages
            .map(
              (msg) => `
            <tr>
              <td>${msg.sender_name}<br/><span class="muted">${msg.sender_email}</span></td>
              <td>${msg.subject}</td>
              <td>${msg.message}</td>
              <td>
                <button class="btn secondary" data-read-message="${msg.id_message}">Lu</button>
                <button class="btn danger" data-delete-message="${msg.id_message}">Supprimer</button>
              </td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  tabContents.messages.querySelectorAll("[data-read-message]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await api(`/api/admin/messages/${btn.dataset.readMessage}/read`, { method: "PATCH" });
      await loadAdminData();
    });
  });

  tabContents.messages.querySelectorAll("[data-delete-message]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await api(`/api/admin/messages/${btn.dataset.deleteMessage}`, { method: "DELETE" });
      await loadAdminData();
    });
  });
}

async function loadAdminData() {
  const [profile, projects, skills, messages] = await Promise.all([
    api("/api/admin/profile"),
    api("/api/admin/projects"),
    api("/api/admin/skills"),
    api("/api/admin/messages"),
  ]);

  renderProfileForm(profile);
  renderProjects(projects);
  renderSkills(skills);
  renderMessages(messages);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginStatus.className = "status";
  loginStatus.textContent = "Connexion...";

  try {
    const payload = {
      email: document.getElementById("admin-email").value.trim(),
      password: document.getElementById("admin-password").value,
    };

    const result = await api("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setToken(result.token);
    showApp();
    await loadAdminData();
    switchTab("profile");
  } catch (error) {
    loginStatus.className = "status error";
    loginStatus.textContent = error.message;
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  clearToken();
  showLogin();
});

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

(async function init() {
  if (!getToken()) {
    showLogin();
    return;
  }

  try {
    showApp();
    await loadAdminData();
    switchTab("profile");
  } catch (_error) {
    clearToken();
    showLogin();
  }
})();
