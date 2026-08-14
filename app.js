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
  vodReviews: [],
  scrims: [],
  practicePlans: [],
  candidates: [
    { id: 1, nom: "Henrick", pseudo: "Xeno", age: 23, programme: "", rangActuel: "", rangPeak: "", rolePrefere: "Controller", agentsPrincipaux: "", disponibilites: "", experienceCompetitive: "", objectifPersonnel: "", roleEvalue: "Controller", mecanique: 5, intelligence: 4, utilitaires: 3, communication: 2, mentalite: 1, adaptabilite: 5, decision: "Titulaire", roleRecommande: "Controller", prioriteDeveloppement: "", commentaires: "" },
    { id: 2, nom: "Gabriel", pseudo: "Ekoh", age: 27, programme: "", rangActuel: "", rangPeak: "", rolePrefere: "Sentinel", agentsPrincipaux: "", disponibilites: "", experienceCompetitive: "", objectifPersonnel: "", roleEvalue: "Sentinel", mecanique: 4, intelligence: 4, utilitaires: 4, communication: 4, mentalite: 4, adaptabilite: 4, decision: "Titulaire", roleRecommande: "Duelist", prioriteDeveloppement: "", commentaires: "" }
  ]
};
let state = loadState();

function $(id) { return document.getElementById(id); }
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("valorantRecruitmentState"));
    const base = structuredClone(defaultState);
    if (!saved) return base;
    return { ...base, ...saved, weights: { ...base.weights, ...(saved.weights || {}) }, candidates: saved.candidates || [], vodReviews: saved.vodReviews || [], scrims: saved.scrims || [], practicePlans: saved.practicePlans || [] };
  }
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
  $("vod-form").addEventListener("submit", addVodReview);
  $("scrim-form").addEventListener("submit", addScrim);
  $("vodFilter").addEventListener("change", renderVodReviews);
  $("clear-vod-filter").addEventListener("click", () => { $("vodFilter").value = "all"; renderVodReviews(); });
  $("vodList").addEventListener("click", event => { const btn = event.target.closest("[data-delete-vod]"); if (btn) deleteVodReview(Number(btn.dataset.deleteVod)); });
  $("scrimList").addEventListener("click", event => { const btn = event.target.closest("[data-delete-scrim]"); if (btn) deleteScrim(Number(btn.dataset.deleteScrim)); });
  $("practice-form").addEventListener("submit", addPracticePlan);
  [1,2,3,4,5,6,7].forEach(i => $("block" + i + "Min").addEventListener("input", updatePracticeTotal));
  $("practiceList").addEventListener("click", event => { const del = event.target.closest("[data-delete-practice]"); const prt = event.target.closest("[data-print-practice]"); if (del) deletePracticePlan(Number(del.dataset.deletePractice)); if (prt) printPracticePlan(Number(prt.dataset.printPractice)); });
}
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === id));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.view === id));
  const titles = { dashboard: "Portail", candidate: "Ajouter / Évaluer", ranking: "Classement", charts: "Graphiques", weights: "Pondération", vod: "VOD Review", scrims: "Scrims", practice: "Planification pratique", criteria: "Critères par rôle" };
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
  renderVodCandidateSelects();
  renderVodReviews();
  renderScrims();
  renderPracticePlans();
  updatePracticeTotal();
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


function todayInputValue() { return new Date().toISOString().slice(0, 10); }
function candidateLabelById(id) {
  const c = state.candidates.find(x => x.id === Number(id));
  return c ? `${c.pseudo} (${c.nom})` : "Candidat supprimé";
}
function renderVodCandidateSelects() {
  const candidateOptions = state.candidates.map(c => `<option value="${c.id}">${escapeHtml(c.pseudo)} (${escapeHtml(c.nom)})</option>`).join("");
  $("vodCandidate").innerHTML = candidateOptions || `<option value="">Aucun candidat</option>`;
  $("vodFilter").innerHTML = `<option value="all">Tous les joueurs</option>` + candidateOptions;
  if (!$("vodDate").value) $("vodDate").value = todayInputValue();
  if (!$("scrimDate").value) $("scrimDate").value = todayInputValue();
}
function nextReviewId(items) { return items.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1; }
function addVodReview(event) {
  event.preventDefault();
  const candidateId = Number($("vodCandidate").value);
  if (!candidateId) return toast("Ajoute ou sélectionne un candidat avant la VOD review.");
  const review = {
    id: nextReviewId(state.vodReviews), candidateId, date: $("vodDate").value || todayInputValue(), map: $("vodMap").value.trim(), type: $("vodType").value,
    link: $("vodLink").value.trim(), context: $("vodContext").value.trim(), strengths: $("vodStrengths").value.trim(), mistakes: $("vodMistakes").value.trim(),
    actionPlan: $("vodActionPlan").value.trim(), priority: $("vodPriority").value, coach: $("vodCoach").value.trim()
  };
  state.vodReviews.push(review); saveState(); event.target.reset(); $("vodDate").value = todayInputValue(); renderAll(); toast("VOD review ajoutée.");
}
function renderVodReviews() {
  const filter = $("vodFilter")?.value || "all";
  let reviews = [...(state.vodReviews || [])].sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.id - a.id);
  if (filter !== "all") reviews = reviews.filter(r => String(r.candidateId) === String(filter));
  $("vodList").innerHTML = reviews.map(r => `
    <article class="review-card">
      <header><div><h4>${escapeHtml(candidateLabelById(r.candidateId))}</h4><p>${escapeHtml(r.context || "Aucun contexte ajouté.")}</p></div><span class="review-chip danger">${escapeHtml(r.priority || "Priorité")}</span></header>
      <div class="review-meta"><span class="review-chip">${escapeHtml(r.date || "-")}</span><span class="review-chip">${escapeHtml(r.map || "Map non indiquée")}</span><span class="review-chip green">${escapeHtml(r.type || "VOD")}</span>${r.link ? `<span class="review-chip">Lien ajouté</span>` : ""}</div>
      <p><b>Points forts :</b> ${escapeHtml(r.strengths || "-")}</p>
      <p><b>À corriger :</b> ${escapeHtml(r.mistakes || "-")}</p>
      <p><b>Plan d’action :</b> ${escapeHtml(r.actionPlan || "-")}</p>
      <div class="review-actions"><button type="button" data-delete-vod="${r.id}">Supprimer</button>${r.link ? `<button type="button" onclick="window.open('${escapeHtml(r.link)}','_blank')">Ouvrir le lien</button>` : ""}</div>
    </article>`).join("") || `<div class="empty-state">Aucune VOD review pour ce filtre.</div>`;
}
function deleteVodReview(id) {
  state.vodReviews = state.vodReviews.filter(r => r.id !== id); saveState(); renderAll(); toast("VOD review supprimée.");
}
function addScrim(event) {
  event.preventDefault();
  const scrim = {
    id: nextReviewId(state.scrims), date: $("scrimDate").value || todayInputValue(), opponent: $("scrimOpponent").value.trim(), map: $("scrimMap").value.trim(), score: $("scrimScore").value.trim(),
    players: $("scrimPlayers").value.trim(), comp: $("scrimComp").value.trim(), objective: $("scrimObjective").value.trim(), attack: $("scrimAttack").value.trim(), defense: $("scrimDefense").value.trim(),
    comms: $("scrimComms").value.trim(), next: $("scrimNext").value.trim(), rating: Number($("scrimRating").value || 0), coach: $("scrimCoach").value.trim()
  };
  if (!scrim.opponent && !scrim.map && !scrim.objective) return toast("Ajoute au moins un adversaire, une map ou un objectif.");
  state.scrims.push(scrim); saveState(); event.target.reset(); $("scrimDate").value = todayInputValue(); renderAll(); toast("Scrim ajoutée.");
}
function renderScrims() {
  const scrims = [...(state.scrims || [])].sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.id - a.id);
  const avg = scrims.length ? scrims.reduce((sum, s) => sum + Number(s.rating || 0), 0) / scrims.filter(s => s.rating).length : 0;
  const rated = scrims.filter(s => s.rating).length;
  $("scrimSummary").innerHTML = `<article><span>Total</span><strong>${scrims.length}</strong></article><article><span>Note moyenne</span><strong>${rated ? avg.toFixed(1) : "-"}</strong></article><article><span>Dernière map</span><strong>${escapeHtml(scrims[0]?.map || "-")}</strong></article>`;
  $("scrimList").innerHTML = scrims.map(s => `
    <article class="review-card">
      <header><div><h4>${escapeHtml(s.opponent || "Adversaire non indiqué")} • ${escapeHtml(s.map || "Map non indiquée")}</h4><p>${escapeHtml(s.objective || "Aucun objectif ajouté.")}</p></div><span class="review-chip danger">${s.rating ? s.rating + "/5" : "Non noté"}</span></header>
      <div class="review-meta"><span class="review-chip">${escapeHtml(s.date || "-")}</span><span class="review-chip">Score : ${escapeHtml(s.score || "-")}</span><span class="review-chip green">Coach : ${escapeHtml(s.coach || "-")}</span></div>
      <p><b>Joueurs :</b> ${escapeHtml(s.players || "-")}</p>
      <p><b>Composition :</b> ${escapeHtml(s.comp || "-")}</p>
      <p><b>Attaque :</b> ${escapeHtml(s.attack || "-")}</p>
      <p><b>Défense :</b> ${escapeHtml(s.defense || "-")}</p>
      <p><b>Communication / mental :</b> ${escapeHtml(s.comms || "-")}</p>
      <p><b>Prochaine étape :</b> ${escapeHtml(s.next || "-")}</p>
      <div class="review-actions"><button type="button" data-delete-scrim="${s.id}">Supprimer</button></div>
    </article>`).join("") || `<div class="empty-state">Aucune scrim ajoutée pour le moment.</div>`;
}
function deleteScrim(id) {
  state.scrims = state.scrims.filter(s => s.id !== id); saveState(); renderAll(); toast("Scrim supprimée.");
}


function getPracticeBlocks() {
  return [1,2,3,4,5,6,7].map(i => ({ minutes: Number($("block" + i + "Min").value || 0), text: $("block" + i + "Text").value.trim() })).filter(b => b.minutes || b.text);
}
function updatePracticeTotal() {
  if (!$('practiceTotal')) return;
  const total = [1,2,3,4,5,6,7].reduce((sum, i) => sum + Number($("block" + i + "Min").value || 0), 0);
  $("practiceTotal").textContent = `${total} min`;
  $("practiceTotal").style.color = total >= 105 && total <= 135 ? "#38bdf8" : "#f59e0b";
}
function addPracticePlan(event) {
  event.preventDefault();
  const plan = {
    id: nextReviewId(state.practicePlans), title: $("practiceTitle").value.trim(), date: $("practiceDate").value || todayInputValue(), start: $("practiceStart").value,
    duration: Number($("practiceDuration").value || 120), map: $("practiceMap").value.trim(), focus: $("practiceFocus").value, players: $("practicePlayers").value.trim(),
    intent: $("practiceIntent").value.trim(), objectives: $("practiceObjectives").value.trim(), success: $("practiceSuccess").value.trim(), material: $("practiceMaterial").value.trim(),
    blocks: getPracticeBlocks(), adaptations: $("practiceAdaptations").value.trim(), assessment: $("practiceAssessment").value.trim(), coachNotes: $("practiceCoachNotes").value.trim(),
    status: $("practiceStatus").value, coach: $("practiceCoach").value.trim()
  };
  if (!plan.title) return toast("Ajoute un titre de séance.");
  state.practicePlans.push(plan); saveState(); event.target.reset(); resetPracticeDefaults(); renderAll(); toast("Séance de pratique ajoutée.");
}
function resetPracticeDefaults() {
  if (!$('practiceDate')) return;
  $("practiceDate").value = todayInputValue();
  $("practiceDuration").value = 120;
  const defaults = [
    [10, "Accueil, rappel de l’objectif, lien avec la dernière scrim ou VOD."],
    [15, "Activation : échauffement ciblé ou mini-défi mécanique relié au thème."],
    [15, "Enseignement explicite : modèle, principe tactique, vocabulaire commun et attentes."],
    [30, "Pratique guidée : drill en custom, répétitions de setup, utilitaires ou retakes."],
    [35, "Mise en situation : scrim partielle, rounds thématiques ou scénarios imposés."],
    [10, "Retour réflexif : ce qui a fonctionné, points à corriger, engagement pour la prochaine pratique."],
    [5, "Trace / devoir : VOD à revoir, notes individuelles ou objectif personnel."]
  ];
  defaults.forEach((row, idx) => { const i = idx + 1; $("block" + i + "Min").value = row[0]; $("block" + i + "Text").value = row[1]; });
  updatePracticeTotal();
}
function renderPracticePlans() {
  if (!$('practiceList')) return;
  if (!$("practiceDate").value) resetPracticeDefaults();
  const plans = [...(state.practicePlans || [])].sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.id - a.id);
  const upcoming = plans.filter(p => p.status !== "Complétée" && p.status !== "Annulée").length;
  const completed = plans.filter(p => p.status === "Complétée").length;
  $("practiceSummary").innerHTML = `<article><span>Total</span><strong>${plans.length}</strong></article><article><span>À venir / actives</span><strong>${upcoming}</strong></article><article><span>Complétées</span><strong>${completed}</strong></article>`;
  $("practiceList").innerHTML = plans.map(p => {
    const total = (p.blocks || []).reduce((sum, b) => sum + Number(b.minutes || 0), 0);
    return `<article class="review-card"><header><div><h4>${escapeHtml(p.title)}</h4><p>${escapeHtml(p.intent || "Aucune intention pédagogique ajoutée.")}</p></div><span class="review-chip practice-status">${escapeHtml(p.status || "Planifiée")}</span></header><div class="review-meta"><span class="review-chip">${escapeHtml(p.date || "-")}</span><span class="review-chip">${escapeHtml(p.start || "Heure non indiquée")}</span><span class="review-chip green">${total || p.duration || 120} min</span><span class="review-chip">${escapeHtml(p.focus || "Focus")}</span><span class="review-chip">${escapeHtml(p.map || "Map non indiquée")}</span></div><p><b>Objectifs :</b> ${escapeHtml(p.objectives || "-")}</p><p><b>Critères de réussite :</b> ${escapeHtml(p.success || "-")}</p><p><b>Évaluation formative :</b> ${escapeHtml(p.assessment || "-")}</p><div class="review-actions"><button type="button" data-print-practice="${p.id}">PDF / imprimer</button><button type="button" data-delete-practice="${p.id}">Supprimer</button></div></article>`;
  }).join("") || `<div class="empty-state">Aucune séance planifiée. Crée une pratique de 2 heures avec le formulaire.</div>`;
}
function deletePracticePlan(id) {
  state.practicePlans = state.practicePlans.filter(p => p.id !== id); saveState(); renderAll(); toast("Séance supprimée.");
}
function printPracticePlan(id) {
  const p = state.practicePlans.find(x => x.id === Number(id));
  if (!p) return toast("Séance introuvable.");
  const root = $("print-root");
  const total = (p.blocks || []).reduce((sum, b) => sum + Number(b.minutes || 0), 0);
  const blockRows = (p.blocks || []).map((b, i) => `<tr><td>${i + 1}</td><td>${Number(b.minutes || 0)} min</td><td>${escapeHtml(b.text || "-")}</td></tr>`).join("");
  root.innerHTML = `<article class="print-report"><div class="print-sheet"><section class="print-header"><div><p class="print-eyebrow">Planification pédagogique Valorant</p><h1>${escapeHtml(p.title)}</h1><p class="print-subtitle">${escapeHtml(p.date || "-")} • ${escapeHtml(p.start || "Heure non indiquée")} • ${total || p.duration || 120} minutes</p></div><div class="print-score"><span>Focus</span><strong style="font-size:20px">${escapeHtml(p.focus || "-")}</strong><small>${escapeHtml(p.map || "Map")}</small></div></section><main class="print-content"><div class="print-grid"><section class="print-card"><h2>Cadre de la séance</h2><div class="print-info"><b>Participants</b><span>${escapeHtml(p.players || "-")}</span><b>Coach</b><span>${escapeHtml(p.coach || "-")}</span><b>Statut</b><span>${escapeHtml(p.status || "Planifiée")}</span><b>Matériel</b><span>${escapeHtml(p.material || "-")}</span></div></section><section class="print-card soft"><h2>Intention pédagogique</h2><p>${escapeHtml(p.intent || "-")}</p><h2>Objectifs d’apprentissage</h2><p>${escapeHtml(p.objectives || "-")}</p></section><section class="print-card full"><h2>Déroulement minuté</h2><table class="print-lesson-table"><thead><tr><th>#</th><th>Temps</th><th>Activité / consigne</th></tr></thead><tbody>${blockRows}</tbody></table></section><section class="print-card"><h2>Critères de réussite</h2><p>${escapeHtml(p.success || "-")}</p></section><section class="print-card"><h2>Adaptations</h2><p>${escapeHtml(p.adaptations || "-")}</p></section><section class="print-card"><h2>Évaluation formative</h2><p>${escapeHtml(p.assessment || "-")}</p></section><section class="print-card"><h2>Notes coach</h2><p>${escapeHtml(p.coachNotes || "-")}</p></section></div><div class="print-footer"><span>Plan généré depuis le centre de recrutement</span><span>Format inspiré d’une planification de cours</span></div></main></div></article>`;
  toast("Ouverture de la fenêtre d'impression...");
  setTimeout(() => window.print(), 150);
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
  return categories.map(cat => ({ label: cat.label, value: Number(c[cat.key] || 0) })).sort((a, b) => b.value - a.value).slice(0, 2).filter(x => x.value > 0).map(x => `${x.label} (${x.value}/5)`).join(", ") || "Aucune donnée";
}
function weakestCategories(c) {
  return categories.map(cat => ({ label: cat.label, value: Number(c[cat.key] || 0) })).sort((a, b) => a.value - b.value).slice(0, 2).filter(x => x.value > 0).map(x => `${x.label} (${x.value}/5)`).join(", ") || "Aucune donnée";
}
function printProfilePdf(id) {
  const c = state.candidates.find(x => x.id === Number(id));
  if (!c) return toast("Candidat introuvable.");
  const root = $("print-root");
  if (!root) return toast("Zone d'impression introuvable. Vérifie que index.html contient #print-root.");
  const today = new Date().toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });
  const s = score(c);
  const relatedVodRows = (state.vodReviews || []).filter(r => r.candidateId === c.id).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 3).map(r => `<div class="print-mini"><b>${escapeHtml(r.date || "-")} • ${escapeHtml(r.map || "Map")}</b><br>Plan : ${escapeHtml(r.actionPlan || "-")}<br>À corriger : ${escapeHtml(r.mistakes || "-")}</div>`).join("") || `<div class="print-mini">Aucune VOD review associée au joueur.</div>`;
  const relatedScrimRows = (state.scrims || []).filter(s => String(s.players || "").toLowerCase().includes(String(c.pseudo || "").toLowerCase())).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 2).map(s => `<div class="print-mini"><b>${escapeHtml(s.date || "-")} • ${escapeHtml(s.map || "Map")} vs ${escapeHtml(s.opponent || "-")}</b><br>Objectif : ${escapeHtml(s.objective || "-")}<br>Prochaine étape : ${escapeHtml(s.next || "-")}</div>`).join("") || `<div class="print-mini">Aucune scrim liée automatiquement au pseudo du joueur.</div>`;
  const categoryRows = categories.map(cat => {
    const value = Number(c[cat.key] || 0);
    const pct = Math.max(0, Math.min(100, value * 20));
    return `<tr><td>${escapeHtml(cat.label)}</td><td>${value ? value + "/5" : "Non noté"}</td><td><div class="print-meter"><span style="width:${pct}%"></span></div></td></tr>`;
  }).join("");
  root.innerHTML = `<article class="print-report"><div class="print-sheet"><section class="print-header"><div><p class="print-eyebrow">Rapport de recrutement Valorant</p><h1>${escapeHtml(c.pseudo || "Sans pseudo")}</h1><p class="print-subtitle">${escapeHtml(c.nom || "Nom non indiqué")} • ${escapeHtml(c.roleRecommande || c.roleEvalue || c.rolePrefere || "Rôle à confirmer")}</p></div><div class="print-score"><span>Score</span><strong>${isEvaluated(c) ? s.toFixed(1) : "-"}</strong><small>/100</small></div></section><main class="print-content"><div class="print-grid"><section class="print-card"><h2>Informations du candidat</h2><div class="print-info"><b>ID</b><span>${c.id}</span><b>Nom</b><span>${escapeHtml(c.nom || "-")}</span><b>Pseudo</b><span>${escapeHtml(c.pseudo || "-")}</span><b>Âge</b><span>${c.age || "-"}</span><b>Programme</b><span>${escapeHtml(c.programme || "-")}</span><b>Rang actuel</b><span>${escapeHtml(c.rangActuel || "-")}</span><b>Rang peak</b><span>${escapeHtml(c.rangPeak || "-")}</span><b>Rôle préféré</b><span>${escapeHtml(c.rolePrefere || "-")}</span><b>Agents principaux</b><span>${escapeHtml(c.agentsPrincipaux || "-")}</span><b>Disponibilités</b><span>${escapeHtml(c.disponibilites || "-")}</span></div></section><section class="print-card soft"><h2>Recommandation</h2><p><span class="print-decision">${escapeHtml(c.decision || "À revoir")}</span></p><div class="print-info"><b>Rôle évalué</b><span>${escapeHtml(c.roleEvalue || "-")}</span><b>Rôle recommandé</b><span>${escapeHtml(c.roleRecommande || "-")}</span><b>Priorité de développement</b><span>${escapeHtml(c.prioriteDeveloppement || "-")}</span><b>Forces principales</b><span>${escapeHtml(strongestCategories(c))}</span><b>Points à surveiller</b><span>${escapeHtml(weakestCategories(c))}</span></div></section><section class="print-card full"><h2>Évaluation du tryout</h2><table class="print-table"><thead><tr><th>Catégorie</th><th>Note</th><th>Niveau visuel</th></tr></thead><tbody>${categoryRows}</tbody></table></section><section class="print-card full"><h2>Résumé exécutif</h2><div class="print-summary">${escapeHtml(profileInterpretation(c))}</div></section><section class="print-card"><h2>Contexte pour lecteur non spécialiste</h2><div class="print-glossary"><div><b>Valorant</b> : jeu d'équipe tactique où cinq joueurs coordonnent rôles, communications et décisions.</div><div><b>Rôle</b> : fonction principale du joueur dans l'équipe, par exemple ouvrir l'attaque, contrôler des zones ou protéger les flancs.</div><div><b>Agents</b> : personnages joués, chacun avec des outils différents. Leur maîtrise influence la contribution au collectif.</div><div><b>Score /100</b> : résultat pondéré des six critères. Il sert à comparer les candidats, pas seulement le talent mécanique.</div></div></section><section class="print-card full"><h2>VOD reviews associées</h2><div class="print-section-list">${relatedVodRows}</div></section><section class="print-card full"><h2>Scrims liées au joueur</h2><div class="print-section-list">${relatedScrimRows}</div></section><section class="print-card"><h2>Commentaires et objectif</h2><p><b>Objectif personnel :</b><br>${escapeHtml(c.objectifPersonnel || "-")}</p><p><b>Expérience compétitive :</b><br>${escapeHtml(c.experienceCompetitive || "-")}</p><p><b>Commentaires du recruteur :</b><br>${escapeHtml(c.commentaires || "-")}</p></section></div><div class="print-footer"><span>Généré le ${today}</span><span>Centre de recrutement Valorant collégial</span></div></main></div></article>`;
  toast("Ouverture de la fenêtre d'impression...");
  setTimeout(() => window.print(), 150);
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

window.addEventListener("afterprint", () => { const root = $("print-root"); if (root) root.innerHTML = ""; });
init();
