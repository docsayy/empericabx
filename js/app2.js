console.log("EmpiricAbx loaded");

let syndromes = [];
let antibiotics = [];
let organisms = [];

const state = {
    activeView: "home",
    searchIndex: []
};

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", init);

async function init() {
    console.log("App initializing...");

    setupNavigation();
    setupSearch();

    await loadData();

    renderSyndromes();
}

/* =========================
   LOAD DATA
========================= */

async function loadData() {
    try {
        console.log("Loading JSON...");

        const [s, a, o] = await Promise.all([
            fetch("data/syndromes.json"),
            fetch("data/antibiotics.json"),
            fetch("data/organisms.json")
        ]);

        syndromes = await s.json();
        antibiotics = await a.json();
        organisms = await o.json();

        buildSearchIndex();

        console.log("Data loaded:", {
            syndromes: syndromes.length,
            antibiotics: antibiotics.length,
            organisms: organisms.length
        });

    } catch (err) {
        console.error("Data load error:", err);
    }
}

/* =========================
   RENDER SYNDROMES
========================= */

function renderSyndromes() {
    const grid = document.getElementById("syndromeGrid");
    const count = document.getElementById("syndromeCount");

    if (!grid) return;

    grid.innerHTML = "";

    syndromes.forEach(s => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <div class="card-title">${s.name}</div>
            <div class="card-description">
                ${s.short || "Click to explore organisms, coverage, and pearls"}
            </div>
        `;

        card.addEventListener("click", () => openSyndromeModal(s));

        grid.appendChild(card);
    });

    if (count) count.textContent = `${syndromes.length} syndromes`;
}

/* =========================
   MODAL
========================= */

function openSyndromeModal(s) {
    const modal = document.getElementById("modalOverlay");
    const content = document.getElementById("modalContent");

    content.innerHTML = generateSyndromeHTML(s);

    modal.classList.remove("hidden");
}

function closeModal() {
    document.getElementById("modalOverlay").classList.add("hidden");
}

/* Safe DOM binding */
document.addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeModal();

    const closeBtn = e.target.closest("#closeModal");
    if (closeBtn) closeModal();
});

/* =========================
   TEMPLATE
========================= */

function generateSyndromeHTML(s) {
    return `
        <h2>${s.name}</h2>

        <div class="accordion open">
            <div class="accordion-header">Likely Organisms</div>
            <div class="accordion-content" style="display:block">
                ${formatList(s.organisms)}
            </div>
        </div>

        <div class="accordion open">
            <div class="accordion-header">Empiric Therapy</div>
            <div class="accordion-content" style="display:block">
                ${formatList(s.empiric)}
            </div>
        </div>

        <div class="accordion open">
            <div class="accordion-header">Escalation Rules</div>
            <div class="accordion-content" style="display:block">
                ${formatObject(s.escalation)}
            </div>
        </div>

        <div class="accordion open">
            <div class="accordion-header">Pearls</div>
            <div class="accordion-content" style="display:block">
                ${formatList(s.pearls)}
            </div>
        </div>
    `;
}

/* =========================
   HELPERS
========================= */

function formatList(arr = []) {
    if (!arr) return "<p>No data</p>";
    return `<ul>${arr.map(i => `<li>${i}</li>`).join("")}</ul>`;
}

function formatObject(obj = {}) {
    return `<ul>` +
        Object.entries(obj || {})
            .map(([k, v]) => `<li><b>${k}</b>: ${v}</li>`)
            .join("") +
        `</ul>`;
}

/* =========================
   NAVIGATION
========================= */

function setupNavigation() {
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            switchView(btn.dataset.view);
        });
    });
}

function switchView(view) {
    state.activeView = view;

    document.querySelectorAll(".view").forEach(v => {
        v.classList.remove("active-view");
    });

    const target = document.getElementById(view + "View");
    if (target) target.classList.add("active-view");

    document.querySelectorAll(".nav-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.view === view);
    });
}

/* =========================
   SEARCH
========================= */

function setupSearch() {
    const input = document.getElementById("globalSearch");
    const results = document.getElementById("searchResults");

    input.addEventListener("input", () => {
        const q = input.value.toLowerCase().trim();

        if (!q) {
            results.classList.add("hidden");
            return;
        }

        const matches = state.searchIndex
            .filter(item => item.text.includes(q))
            .slice(0, 8);

        results.innerHTML = matches.map(m => `
            <div class="search-item" data-id="${m.id}">
                ${m.label}
            </div>
        `).join("");

        results.classList.remove("hidden");

        results.querySelectorAll(".search-item").forEach(el => {
            el.addEventListener("click", () => {
                handleSearchClick(el.dataset.id);
            });
        });
    });
}

/* =========================
   SEARCH INDEX
========================= */

function buildSearchIndex() {
    state.searchIndex = [];

    syndromes.forEach(s => {
        state.searchIndex.push({
            id: s.id,
            type: "syndrome",
            label: s.name,
            text: s.name.toLowerCase()
        });
    });

    antibiotics.forEach(a => {
        state.searchIndex.push({
            id: a.name,
            type: "antibiotic",
            label: a.name,
            text: a.name.toLowerCase()
        });
    });

    organisms.forEach(o => {
        state.searchIndex.push({
            id: o.name,
            type: "organism",
            label: o.name,
            text: o.name.toLowerCase()
        });
    });
}

/* =========================
   SEARCH CLICK
========================= */

function handleSearchClick(id) {
    const s = syndromes.find(x => x.id === id);

    if (s) openSyndromeModal(s);
}
