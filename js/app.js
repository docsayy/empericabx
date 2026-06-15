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

document.addEventListener("DOMContentLoaded", async () => {
    await loadData();
    setupNavigation();
    setupSearch();
    renderSyndromes();
});

/* =========================
   LOAD JSON DATA
========================= */

async function loadData() {
    try {
        const [s, a, o] = await Promise.all([
            fetch("data/syndromes.json"),
            fetch("data/antibiotics.json"),
            fetch("data/organisms.json")
        ]);

        syndromes = await s.json();
        antibiotics = await a.json();
        organisms = await o.json();

        buildSearchIndex();

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

document.addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeModal();
});

document.getElementById("closeModal").addEventListener("click", closeModal);

/* =========================
   SYNDROME TEMPLATE
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
    return `<ul>${arr.map(i => `<li>${i}</li>`).join("")}</ul>`;
}

function formatObject(obj = {}) {
    return `<ul>` +
        Object.entries(obj)
            .map(([k, v]) => `<li><b>${k.toUpperCase()}</b>: ${v}</li>`)
            .join("") +
        `</ul>`;
}

/* =========================
   NAVIGATION
========================= */

function setupNavigation() {
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const view = btn.dataset.view;
            switchView(view);
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
        b.classList.remove("active");
        if (b.dataset.view === view) b.classList.add("active");
    });
}

/* =========================
   SEARCH ENGINE
========================= */

function setupSearch() {
    const input = document.getElementById("globalSearch");
    const results = document.getElementById("searchResults");

    input.addEventListener("input", () => {
        const q = input.value.toLowerCase();

        if (!q) {
            results.classList.add("hidden");
            return;
        }

        const matches = state.searchIndex.filter(item =>
            item.text.includes(q)
        ).slice(0, 8);

        results.innerHTML = matches.map(m => `
            <div class="search-item" data-id="${m.id}">
                ${m.label}
            </div>
        `).join("");

        results.classList.remove("hidden");

        document.querySelectorAll(".search-item").forEach(el => {
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

function handleSearchClick(id) {
    const s = syndromes.find(x => x.id === id);

    if (s) {
        openSyndromeModal(s);
    }
}

/* =========================
   ACCORDION (future hook)
========================= */

document.addEventListener("click", (e) => {
    const header = e.target.closest(".accordion-header");
    if (!header) return;

    const acc = header.parentElement;
    acc.classList.toggle("open");
});
