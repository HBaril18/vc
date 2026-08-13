const roles = ["Duelist", "Initiator", "Controller", "Sentinel", "IGL potentiel", "Flex"];
const decisions = ["Titulaire", "Sub", "À revoir", "Non retenu"];
const categories = [
  { key: "mecanique", label: "Mécanique" },
  { key: "intelligence", label: "Intelligence" },
  { key: "utilitaires", label: "Utilitaires" },
  { key: "communication", label: "Communication" },
  { key: "mentalite", label: "Mentalité" },
  { key: "adaptabilite", label: "Potentiel" }
];
const criteria = {
  "Duelist": ["Crée de l'espace", "Entre avec le support de l'équipe", "Ne cherche pas seulement les kills", "Accepte de mourir pour ouvrir le site si nécessaire"],
  "Initiator": ["Donne de l'information utile", "Supporte les entries", "Utilise ses flashes/recon au bon moment", "Communique clairement les infos obtenues"],
  "Controller": ["Place les smokes correctement", "Respecte les bons timings", "Comprend le tempo du round", "Aide à isoler les duels"],
  "Sentinel": ["Sécurise les flanks", "Varie ses setups", "Ancre efficacement un site", "Ralentit l'adversaire avec ses utilitaires"],
  "IGL potentiel": ["Donne des calls clairs", "Reste calme sous pression", "Lit bien le rythme du match", "Écoute les informations des autres", "Sait adapter le plan"]
};
const defaultState = {
  weights: { mecanique: .20, intelligence: .20, utilitaires: .20, communication: .15, mentalite: .15, adaptabilite: .10 },
  candidates: [
    { id: 1, nom: "Henrick", pseudo: "Xeno", age: 23, programme: "", rangActuel: "", rangPeak: "", rolePrefere: "Controller", agentsPrincipaux: "", disponibilites: "", experienceCompetitive: "", objectifPersonnel: "", roleEvalue: "Controller", mecanique: 5, intelligence: 4, utilitaires: 3, communication: 2, mentalite: 1, adaptabilite: 5, decision: "Titulaire", roleRecommande: "Controller", prioriteDeveloppement: "", commentaires: "" },
    { id: 2, nom: "Gabriel", pseudo: "Ekoh", age: 27, programme: "", rangActuel: "", rangPeak: "", rolePrefere: "Sentinel", agentsPrincipaux: "", disponibilites: "", experienceCompetitive: "", objectifPersonnel: "", roleEvalue: "Sentinel", mecanique: 4, intelligence: 4, utilitaires: 4, communication: 4, mentalite: 4, adaptabilite: 4, decision: "Titulaire", roleRecommande: "Duelist", prioriteDeveloppement: "", commentaires: "" }
  ]
};
let state = loadState();

function $(id) { return document.getElementById(id); }
function loadState() {
  try { return JSON.parse(localStorage.getItem("valorantRecruitmentState")) || structuredClone(defaultState); }
  catch { return structuredClone(defaultState); }
}
function saveState() { localStorage.setItem("valorantRecruitmentState", JSON.stringify(state)); }
function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2400);
}
function fillSelect(select, values) { select.innerHTML = values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join(""); }
function escapeHtml(value = "") { return String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[c])); }
function nextId() { return state.candidates.reduce((max, c) => Math.max(max, c.id || 0), 0) + 1; }
function isEvaluated(c) { return categories.every(cat => Number(c[cat.key]) >= 1 && Number(c[cat.key]) <= 5); }
function weightTotal() { return Object.values(state.weights).reduce((a, b) => a + Number(b || 0), 0); }
function score(c) {
  if (!isEvaluated(c)) return 0;
  const total = weightTotal();
  if (total <= 0) return 0;
  const weighted = categories.reduce((sum, cat) => sum + Number(c[cat.key] || 0) * Number(state.weights[cat.key] || 0), 0) / total;
  return weighted * 20;
}
function sortedEvaluated() { return state.candidates.filter(isEvaluated).sort((a, b) => score(b) - score(a)); }

function init() {
  ["rolePrefere", "roleEvalue", "roleRecommande"].forEach(id => fillSelect($(id), roles));
  fillSelect($("decision"), decisions);
  renderCriteria();
  bindEvents();
  renderAll();
}

function bindEvents() {
  document.querySelectorAll(".nav-btn").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.view)));
  $("quick-add").addEventListener("click", () => showView("candidate"));
  $("candidate-form").addEventListener("submit", addCandidate);
  $("evaluation-form").addEventListener("submit", saveEvaluation);
  $("candidateSelect").addEventListener("change", loadCandidateEvaluation);
  categories.forEach(cat => $(cat.key).addEventListener("input", updateScorePreview));
  $("weights-form").addEventListener("submit", saveWeights);
  Object.keys(state.weights).forEach(key => $("w" + cap(key)).addEventListener("input", updateWeightPreview));
  $("search").addEventListener("input", renderRanking);
  $("rankingBody").addEventListener("click", event => { const btn = event.target.closest("[data-pdf-id]"); if (btn) printProfilePdf(Number(btn.dataset.pdfId)); });
  $("export-csv").addEventListener("click", exportCsv);
  $("pdf-selected").addEventListener("click", exportSelectedProfilePdf);
  $("export-json").addEventListener("click", exportJson);
  $("import-json").addEventListener("change", importJson);
  $("radarSelect").addEventListener("change", renderRadar);
}
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === id));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.view === id));
  const titles = { dashboard: "Portail", candidate: "Ajouter / Évaluer", ranking: "Classement", charts: "Graphiques", weights: "Pondération", criteria: "Critères par rôle" };
  $("view-title").textContent = titles[id] || "Portail";
  if (id === "charts") drawCharts();
}
function cap(key) { return key.charAt(0).toUpperCase() + key.slice(1); }

function addCandidate(event) {
  event.preventDefault();
  const nom = $("nom").value.trim();
  const pseudo = $("pseudo").value.trim();
  if (!nom || !pseudo) return toast("Nom et pseudo obligatoires.");
  const c = {
    id: nextId(), nom, pseudo,
    age: Number($("age").value || 0), programme: $("programme").value.trim(), rangActuel: $("rangActuel").value.trim(), rangPeak: $("rangPeak").value.trim(),
    rolePrefere: $("rolePrefere").value, agentsPrincipaux: $("agentsPrincipaux").value.trim(), disponibilites: $("disponibilites").value.trim(),
    experienceCompetitive: $("experienceCompetitive").value.trim(), objectifPersonnel: $("objectifPersonnel").value.trim(),
    roleEvalue: $("rolePrefere").value, mecanique: 0, intelligence: 0, utilitaires: 0, communication: 0, mentalite: 0, adaptabilite: 0,
    decision: "À revoir", roleRecommande: $("rolePrefere").value, prioriteDeveloppement: "", commentaires: ""
  };
  state.candidates.push(c);
  saveState();
  event.target.reset();
  renderAll();
  $("candidateSelect").value = String(c.id);
  loadCandidateEvaluation();
  toast("Candidat ajouté.");
}
function loadCandidateEvaluation() {
  const c = state.candidates.find(x => String(x.id) === $("candidateSelect").value);
  if (!c) return;
  $("roleEvalue").value = c.roleEvalue || c.rolePrefere || roles[0];
  $("decision").value = c.decision || "À revoir";
  categories.forEach(cat => $(cat.key).value = c[cat.key] || "");
  $("roleRecommande").value = c.roleRecommande || c.rolePrefere || roles[0];
  $("prioriteDeveloppement").value = c.prioriteDeveloppement || "";
  $("commentaires").value = c.commentaires || "";
  updateScorePreview();
}
function saveEvaluation(event) {
  event.preventDefault();
  const c = state.candidates.find(x => String(x.id) === $("candidateSelect").value);
  if (!c) return toast("Ajoutez un candidat avant d'évaluer.");
  c.roleEvalue = $("roleEvalue").value;
  c.decision = $("decision").value;
  categories.forEach(cat => c[cat.key] = Number($(cat.key).value || 0));
  c.roleRecommande = $("roleRecommande").value;
  c.prioriteDeveloppement = $("prioriteDeveloppement").value.trim();
  c.commentaires = $("commentaires").value.trim();
  saveState();
  renderAll();
  toast("Évaluation sauvegardée.");
}
function updateScorePreview() {
  const temp = {};
  categories.forEach(cat => temp[cat.key] = Number($(cat.key).value || 0));
  $("scorePreview").textContent = `${score(temp).toFixed(1)} / 100`;
}

function renderAll() {
  renderKpis();
  renderCandidateSelects();
  renderRanking();
  renderWeights();
  renderRadarSelect();
  drawCharts();
}
function renderKpis() {
  const ev = sortedEvaluated();
  const avg = ev.length ? ev.reduce((sum, c) => sum + score(c), 0) / ev.length : 0;
  $("kpi-candidates").textContent = state.candidates.length;
  $("kpi-evaluated").textContent = ev.length;
  $("kpi-average").textContent = avg ? avg.toFixed(1) : "0";
  $("kpi-best").textContent = ev[0]?.pseudo || "-";
}
function renderCandidateSelects() {
  const options = state.candidates.map(c => `<option value="${c.id}">${c.id} - ${escapeHtml(c.pseudo)} (${escapeHtml(c.nom)})</option>`).join("");
  const previous = $("candidateSelect").value;
  $("candidateSelect").innerHTML = options || `<option value="">Aucun candidat</option>`;
  if ([...$("candidateSelect").options].some(o => o.value === previous)) $("candidateSelect").value = previous;
  loadCandidateEvaluation();
}
function renderRanking() {
  const q = ($("search")?.value || "").toLowerCase();
  const rows = sortedEvaluated().filter(c => [c.nom, c.pseudo, c.roleRecommande, c.decision].join(" ").toLowerCase().includes(q));
  $("rankingBody").innerHTML = rows.map((c, i) => `
    <tr data-id="${c.id}">
      <td><strong>#${i + 1}</strong></td>
      <td>${c.id}</td>
      <td>${escapeHtml(c.nom)}</td>
      <td>${escapeHtml(c.pseudo)}</td>
      <td>${escapeHtml(c.roleRecommande || c.roleEvalue)}</td>
      <td><strong>${score(c).toFixed(1)}</strong></td>
      <td><span class="badge ${badgeClass(c.decision)}">${escapeHtml(c.decision)}</span></td>
      <td>${escapeHtml(c.commentaires || "")}</td>
      <td><button class="pdf-link" data-pdf-id="${c.id}">PDF</button></td>
    </tr>`).join("") || `<tr><td colspan="9">Aucun candidat évalué.</td></tr>`;
}
function badgeClass(value = "") { return value.replace("À", "A").replace(/\s+/g, "-"); }
function renderWeights() {
  Object.entries(state.weights).forEach(([key, val]) => $("w" + cap(key)).value = Number(val).toFixed(2));
  updateWeightPreview();
}
function updateWeightPreview() {
  const total = Object.keys(state.weights).reduce((sum, key) => sum + Number($("w" + cap(key)).value || 0), 0);
  $("weightTotal").textContent = total.toFixed(2);
  $("weightTotal").style.color = Math.abs(total - 1) < .001 ? "#38bdf8" : "#f59e0b";
}
function saveWeights(event) {
  event.preventDefault();
  Object.keys(state.weights).forEach(key => state.weights[key] = Number($("w" + cap(key)).value || 0));
  saveState();
  renderAll();
  toast("Pondération appliquée.");
}
function renderRadarSelect() {
  const ev = sortedEvaluated();
  $("radarSelect").innerHTML = ev.map(c => `<option value="${c.id}">${escapeHtml(c.pseudo)} - ${score(c).toFixed(1)}</option>`).join("") || `<option value="">Aucun candidat évalué</option>`;
}
function renderCriteria() {
  $("criteriaGrid").innerHTML = Object.entries(criteria).map(([role, items]) => `
    <article class="criteria-card"><h3>${escapeHtml(role)}</h3><ul>${items.map(i => `<li>${escapeHtml(i)}</li>`).join("")}</ul></article>
  `).join("");
}

function drawCharts() { renderBarChart(); renderRadar(); }
function renderBarChart() {
  const canvas = $("barCanvas");
  const ctx = canvas.getContext("2d");
  const data = sortedEvaluated().slice(0, 10);
  clearCanvas(ctx, canvas);
  drawText(ctx, "Top candidats", canvas.width / 2, 32, 22, "#f8fafc", "center", true);
  if (!data.length) return drawText(ctx, "Aucun candidat évalué", canvas.width / 2, canvas.height / 2, 18, "#94a3b8", "center");
  const plot = { x: 58, y: 62, w: canvas.width - 90, h: canvas.height - 122 };
  ctx.strokeStyle = "#334155"; ctx.strokeRect(plot.x, plot.y, plot.w, plot.h);
  ctx.fillStyle = "#94a3b8";
  for (let i = 0; i <= 5; i++) {
    const y = plot.y + plot.h - (plot.h * i / 5);
    ctx.strokeStyle = "rgba(148,163,184,.18)"; ctx.beginPath(); ctx.moveTo(plot.x, y); ctx.lineTo(plot.x + plot.w, y); ctx.stroke();
    drawText(ctx, String(i * 20), 30, y + 4, 12, "#94a3b8", "left");
  }
  const gap = 14;
  const bw = Math.max(28, (plot.w - gap * (data.length + 1)) / data.length);
  data.forEach((c, i) => {
    const s = score(c);
    const h = plot.h * s / 100;
    const x = plot.x + gap + i * (bw + gap);
    const y = plot.y + plot.h - h;
    const grd = ctx.createLinearGradient(0, y, 0, plot.y + plot.h);
    grd.addColorStop(0, i === 0 ? "#ff4655" : "#38bdf8"); grd.addColorStop(1, "rgba(56,189,248,.25)");
    ctx.fillStyle = grd; roundRect(ctx, x, y, bw, h, 10); ctx.fill();
    drawText(ctx, s.toFixed(0), x + bw / 2, y - 10, 13, "#fff", "center", true);
    drawText(ctx, c.pseudo, x + bw / 2, plot.y + plot.h + 24, 12, "#cbd5e1", "center");
  });
}
function renderRadar() {
  const canvas = $("radarCanvas");
  const ctx = canvas.getContext("2d");
  clearCanvas(ctx, canvas);
  const id = $("radarSelect").value;
  const c = sortedEvaluated().find(x => String(x.id) === String(id)) || sortedEvaluated()[0];
  if (!c) return drawText(ctx, "Aucun profil", canvas.width / 2, canvas.height / 2, 18, "#94a3b8", "center");
  $("radarTitle").textContent = `Profil radar • ${c.pseudo}`;
  const cx = canvas.width / 2, cy = canvas.height / 2 + 18, radius = 138;
  const angle = i => -Math.PI / 2 + i * Math.PI * 2 / categories.length;
  for (let lvl = 1; lvl <= 5; lvl++) {
    ctx.beginPath();
    categories.forEach((cat, i) => {
      const r = radius * lvl / 5;
      const x = cx + Math.cos(angle(i)) * r, y = cy + Math.sin(angle(i)) * r;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.closePath(); ctx.strokeStyle = "rgba(148,163,184,.25)"; ctx.stroke();
  }
  categories.forEach((cat, i) => {
    const x = cx + Math.cos(angle(i)) * radius, y = cy + Math.sin(angle(i)) * radius;
    ctx.strokeStyle = "rgba(148,163,184,.35)"; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
    drawText(ctx, cat.label, cx + Math.cos(angle(i)) * (radius + 55), cy + Math.sin(angle(i)) * (radius + 32), 13, "#cbd5e1", "center");
  });
  ctx.beginPath();
  categories.forEach((cat, i) => {
    const r = radius * Number(c[cat.key] || 0) / 5;
    const x = cx + Math.cos(angle(i)) * r, y = cy + Math.sin(angle(i)) * r;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.closePath(); ctx.fillStyle = "rgba(255,70,85,.30)"; ctx.strokeStyle = "#ff4655"; ctx.lineWidth = 4; ctx.fill(); ctx.stroke(); ctx.lineWidth = 1;
  drawText(ctx, `${c.pseudo} • ${score(c).toFixed(1)} / 100`, cx, 34, 20, "#f8fafc", "center", true);
}
function clearCanvas(ctx, canvas) { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
function drawText(ctx, text, x, y, size = 14, color = "#fff", align = "left", bold = false) { ctx.fillStyle = color; ctx.font = `${bold ? 800 : 500} ${size}px Segoe UI, Arial`; ctx.textAlign = align; ctx.fillText(text, x, y); }
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function exportSelectedProfilePdf() {
  const id = Number($("candidateSelect").value);
  if (!id) return toast("Sélectionne un candidat avant de générer le PDF.");
  const c = state.candidates.find(x => x.id === id);
  if (!c) return toast("Candidat introuvable.");
  printProfilePdf(id);
}
function profileInterpretation(c) {
  const s = score(c);
  if (!isEvaluated(c)) return "Profil non évalué : les six notes de tryout doivent être complétées avant la décision finale.";
  if (s >= 85) return "Profil prioritaire : candidat très solide, prêt à contribuer rapidement dans un environnement structuré.";
  if (s >= 75) return "Profil recommandé : bonnes bases compétitives, potentiel intéressant avec un encadrement ciblé.";
  if (s >= 60) return "Profil à développer : plusieurs qualités présentes, mais certaines zones doivent être travaillées avant un rôle majeur.";
  return "Profil exploratoire : candidat à revoir seulement si le besoin d'équipe correspond à ses forces spécifiques.";
}
function strongestCategories(c) {
  return categories
    .map(cat => ({ label: cat.label, value: Number(c[cat.key] || 0) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .filter(x => x.value > 0)
    .map(x => `${x.label} (${x.value}/5)`)
    .join(", ") || "Aucune donnée";
}
function weakestCategories(c) {
  return categories
    .map(cat => ({ label: cat.label, value: Number(c[cat.key] || 0) }))
    .sort((a, b) => a.value - b.value)
    .slice(0, 2)
    .filter(x => x.value > 0)
    .map(x => `${x.label} (${x.value}/5)`)
    .join(", ") || "Aucune donnée";
}
function printProfilePdf(id) {
  const c = state.candidates.find(x => x.id === id);
  if (!c) return toast("Candidat introuvable.");
  const today = new Date().toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });
  const s = score(c);
  const categoryRows = categories.map(cat => {
    const value = Number(c[cat.key] || 0);
    const pct = Math.max(0, Math.min(100, value * 20));
    return `<tr><td>${escapeHtml(cat.label)}</td><td>${value ? value + "/5" : "Non noté"}</td><td><div class="meter"><span style="width:${pct}%"></span></div></td></tr>`;
  }).join("");
  const html = `<!doctype html>
<html lang="fr-CA">
<head>
<meta charset="utf-8" />
<title>Profil joueur - ${escapeHtml(c.pseudo || c.nom)}</title>
<style>
  @page { size: Letter; margin: 0.55in; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #111827; font-family: Segoe UI, Arial, sans-serif; background: white; }
  .sheet { min-height: 10in; border: 1px solid #e5e7eb; border-radius: 20px; overflow: hidden; }
  .header { display: flex; justify-content: space-between; gap: 24px; padding: 28px; color: white; background: linear-gradient(135deg, #111827, #ff4655); }
  .eyebrow { margin: 0 0 8px; font-size: 11px; letter-spacing: .11em; text-transform: uppercase; opacity: .85; font-weight: 800; }
  h1 { margin: 0; font-size: 34px; line-height: 1.05; }
  .subtitle { margin: 8px 0 0; opacity: .92; }
  .scoreBox { width: 150px; min-width: 150px; text-align: center; border: 1px solid rgba(255,255,255,.35); border-radius: 18px; padding: 14px; background: rgba(255,255,255,.12); }
  .scoreBox strong { display: block; font-size: 36px; }
  .content { padding: 24px 28px 28px; }
  .grid { display: grid; grid-template-columns: 1.05fr .95fr; gap: 18px; }
  .card { border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; background: #fff; break-inside: avoid; }
  .card.soft { background: #f8fafc; }
  h2 { margin: 0 0 12px; font-size: 17px; color: #111827; }
  .info { display: grid; grid-template-columns: 150px 1fr; gap: 7px 12px; font-size: 13px; }
  .info b { color: #64748b; }
  .decision { display: inline-flex; padding: 7px 11px; border-radius: 999px; background: #fee2e2; color: #b91c1c; font-weight: 900; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  td, th { padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: left; vertical-align: middle; }
  th { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
  .meter { height: 10px; border-radius: 999px; background: #e5e7eb; overflow: hidden; }
  .meter span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #ff4655, #38bdf8); }
  .summary { padding: 16px; border-left: 5px solid #ff4655; background: #fff1f2; border-radius: 14px; line-height: 1.45; }
  .glossary { display: grid; gap: 8px; font-size: 12.5px; color: #334155; line-height: 1.35; }
  .footer { margin-top: 18px; display: flex; justify-content: space-between; color: #64748b; font-size: 11px; }
  .full { grid-column: 1 / -1; }
  @media print { .no-print { display: none; } .sheet { border: none; } }
</style>
</head>
<body>
  <div class="sheet">
    <section class="header">
      <div>
        <p class="eyebrow">Rapport de recrutement Valorant</p>
        <h1>${escapeHtml(c.pseudo || "Sans pseudo")}</h1>
        <p class="subtitle">${escapeHtml(c.nom || "Nom non indiqué")} • ${escapeHtml(c.roleRecommande || c.roleEvalue || c.rolePrefere || "Rôle à confirmer")}</p>
      </div>
      <div class="scoreBox"><span>Score</span><strong>${isEvaluated(c) ? s.toFixed(1) : "-"}</strong><small>/100</small></div>
    </section>
    <main class="content">
      <div class="grid">
        <section class="card">
          <h2>Informations du candidat</h2>
          <div class="info">
            <b>ID</b><span>${c.id}</span>
            <b>Nom</b><span>${escapeHtml(c.nom || "-")}</span>
            <b>Pseudo</b><span>${escapeHtml(c.pseudo || "-")}</span>
            <b>Âge</b><span>${c.age || "-"}</span>
            <b>Programme</b><span>${escapeHtml(c.programme || "-")}</span>
            <b>Rang actuel</b><span>${escapeHtml(c.rangActuel || "-")}</span>
            <b>Rang peak</b><span>${escapeHtml(c.rangPeak || "-")}</span>
            <b>Rôle préféré</b><span>${escapeHtml(c.rolePrefere || "-")}</span>
            <b>Agents principaux</b><span>${escapeHtml(c.agentsPrincipaux || "-")}</span>
            <b>Disponibilités</b><span>${escapeHtml(c.disponibilites || "-")}</span>
          </div>
        </section>
        <section class="card soft">
          <h2>Recommandation</h2>
          <p><span class="decision">${escapeHtml(c.decision || "À revoir")}</span></p>
          <div class="info">
            <b>Rôle évalué</b><span>${escapeHtml(c.roleEvalue || "-")}</span>
            <b>Rôle recommandé</b><span>${escapeHtml(c.roleRecommande || "-")}</span>
            <b>Priorité de développement</b><span>${escapeHtml(c.prioriteDeveloppement || "-")}</span>
            <b>Forces principales</b><span>${escapeHtml(strongestCategories(c))}</span>
            <b>Points à surveiller</b><span>${escapeHtml(weakestCategories(c))}</span>
          </div>
        </section>
        <section class="card full">
          <h2>Évaluation du tryout</h2>
          <table><thead><tr><th>Catégorie</th><th>Note</th><th>Niveau visuel</th></tr></thead><tbody>${categoryRows}</tbody></table>
        </section>
        <section class="card full">
          <h2>Résumé exécutif</h2>
          <div class="summary">${escapeHtml(profileInterpretation(c))}</div>
        </section>
        <section class="card">
          <h2>Contexte pour lecteur non spécialiste</h2>
          <div class="glossary">
            <div><b>Valorant</b> : jeu d'équipe tactique où cinq joueurs coordonnent leurs rôles, communications et décisions.</div>
            <div><b>Rôle</b> : fonction principale du joueur dans l'équipe, par exemple ouvrir l'attaque, contrôler des zones ou protéger les flancs.</div>
            <div><b>Agents</b> : personnages joués, chacun avec des outils différents. La maîtrise des agents influence la contribution au collectif.</div>
            <div><b>Score /100</b> : résultat pondéré des six critères. Il sert à comparer les candidats, pas à représenter uniquement le talent mécanique.</div>
          </div>
        </section>
        <section class="card">
          <h2>Commentaires et objectif</h2>
          <p><b>Objectif personnel :</b><br>${escapeHtml(c.objectifPersonnel || "-")}</p>
          <p><b>Expérience compétitive :</b><br>${escapeHtml(c.experienceCompetitive || "-")}</p>
          <p><b>Commentaires du recruteur :</b><br>${escapeHtml(c.commentaires || "-")}</p>
        </section>
      </div>
      <div class="footer"><span>Généré le ${today}</span><span>Centre de recrutement Valorant collégial</span></div>
    </main>
  </div>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;
  const win = window.open("", "_blank");
  if (!win) return toast("Le navigateur a bloqué la fenêtre PDF. Autorise les fenêtres contextuelles pour ce site.");
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function exportCsv() {
  const rows = [["Rang", "ID", "Nom", "Pseudo", "Role", "Score", "Decision", "Commentaire"]];
  sortedEvaluated().forEach((c, i) => rows.push([i + 1, c.id, c.nom, c.pseudo, c.roleRecommande || c.roleEvalue, score(c).toFixed(1), c.decision, c.commentaires || ""]));
  const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  download("classement_valorant.csv", csv, "text/csv;charset=utf-8");
}
function exportJson() { download("recrutement_valorant.json", JSON.stringify(state, null, 2), "application/json"); }
function importJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported.candidates || !imported.weights) throw new Error("Format invalide");
      state = imported; saveState(); renderAll(); toast("Import JSON réussi.");
    } catch { toast("Import impossible : fichier invalide."); }
  };
  reader.readAsText(file);
  event.target.value = "";
}
function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

init();
