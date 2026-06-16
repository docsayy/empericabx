javascript
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
    renderAntibiotics();
    renderOrganisms();
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
                ${s.short || ""}
            </div>
        `;

        card.addEventListener("click", () => {
            openSyndromeModal(s);
        });

        grid.appendChild(card);
    });

    if (count) {
        count.textContent = `${syndromes.length} syndromes`;
    }
}

/* =========================
   RENDER ANTIBIOTICS
========================= */

function renderAntibiotics() {
    const container = document.getElementById("antibioticContainer");

    if (!container) return;

    container.innerHTML = "";

    antibiotics.forEach(a => {
        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <div class="card-title">${a.name}</div>
            <div class="card-description">
                ${a.class || ""}
            </div>
        `;

        card.addEventListener("click", () => {
            openAntibioticModal(a);
        });

        container.appendChild(card);
    });
}

/* =========================
   RENDER ORGANISMS
========================= */

function renderOrganisms() {
    const container = document.getElementById("organismContainer");

    if (!container) return;

    container.innerHTML = "";

    organisms.forEach(o => {
        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <div class="card-title">${o.name}</div>
            <div class="card-description">
                Organism Profile
            </div>
        `;

        card.addEventListener("click", () => {
            openOrganismModal(o);
        });

        container.appendChild(card);
    });
}

/* =========================
   MODALS
========================= */

function openSyndromeModal(s) {
    const modal = document.getElementById("modalOverlay");
    const content = document.getElementById("modalContent");

    content.innerHTML = `
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

    modal.classList.remove("hidden");
}

function openAntibioticModal(a) {
    const modal = document.getElementById("modalOverlay");
    const content = document.getElementById("modalContent");

    content.innerHTML = `
        <h2>${a.name}</h2>

        <div class="accordion open">
            <div class="accordion-header">Class</div>
            <div class="accordion-content" style="display:block">
                <p>${a.class || ""}</p>
            </div>
        </div>

        <div class="accordion open">
            <div class="accordion-header">Coverage</div>
            <div class="accordion-content" style="display:block">
                ${formatList(a.coverage)}
            </div>
        </div>

        <div class="accordion open">
            <div class="accordion-header">Misses</div>
            <div class="accordion-content" style="display:block">
                ${formatList(a.misses)}
            </div>
        </div>

        <div class="accordion open">
            <div class="accordion-header">Pearls</div>
            <div class="accordion-content" style="display:block">
                ${formatList(a.pearls)}
            </div>
        </div>
    `;

    modal.classList.remove("hidden");
}

function openOrganismModal(o) {
    const modal = document.getElementById("modalOverlay");
    const content = document.getElementById("modalContent");

    content.innerHTML = `
        <h2>${o.name}</h2>

        <div class="accordion open">
            <div class="accordion-header">Sources</div>
            <div class="accordion-content" style="display:block">
                ${formatList(o.sources)}
            </div>
        </div>

        <div class="accordion open">
            <div class="accordion-header">Covered By</div>
            <div class="accordion-content" style="display:block">
                ${formatList(o.coveredBy)}
            </div>
        </div>

        <div class="accordion open">
            <div class="accordion-header">Pearls</div>
            <div class="accordion-content" style="display:block">
                ${formatList(o.pearls)}
            </div>
        </div>
    `;

    modal.classList.remove("hidden");
}

function closeModal() {
    document.getElementById("modalOverlay")
        .classList.add("hidden");
}

document.addEventListener("click", (e) => {

    if (e.target.id === "modalOverlay") {
        closeModal();
    }

    const closeBtn = e.target.closest("#closeModal");

    if (closeBtn) {
        closeModal();
    }
});

/* =========================
   HELPERS
========================= */

function formatList(arr = []) {

    if (!arr || !arr.length) {
        return "<p>No data</p>";
    }

    return `
        <ul>
            ${arr.map(i => `<li>${i}</li>`).join("")}
        </ul>
    `;
}

function formatObject(obj = {}) {

    if (!obj) {
        return "<p>No data</p>";
    }

    return `
        <ul>
            ${Object.entries(obj)
                .map(([k, v]) =>
                    `<li><b>${k}</b>: ${v}</li>`
                )
                .join("")}
        </ul>
    `;
}

/* =========================
   NAVIGATION
========================= */

function setupNavigation() {

    document.querySelectorAll(".nav-btn")
        .forEach(btn => {

            btn.addEventListener("click", () => {
                switchView(btn.dataset.view);
            });

        });
}

function switchView(view) {

    state.activeView = view;

    document.querySelectorAll(".view")
        .forEach(v => {
            v.classList.remove("active-view");
        });

    const target =
        document.getElementById(view + "View");

    if (target) {
        target.classList.add("active-view");
    }

    document.querySelectorAll(".nav-btn")
        .forEach(btn => {

            btn.classList.toggle(
                "active",
                btn.dataset.view === view
            );

        });
}

/* =========================
   SEARCH
========================= */

function setupSearch() {

    const input =
        document.getElementById("globalSearch");

    const results =
        document.getElementById("searchResults");

    input.addEventListener("input", () => {

        const q =
            input.value.toLowerCase().trim();

        if (!q) {
            results.classList.add("hidden");
            return;
        }

        const matches = state.searchIndex
            .filter(item =>
                item.text.includes(q)
            )
            .slice(0, 10);

        results.innerHTML = matches.map(m => `
            <div
                class="search-item"
                data-id="${m.id}"
                data-type="${m.type}">
                ${m.label}
            </div>
        `).join("");

        results.classList.remove("hidden");

        results.querySelectorAll(".search-item")
            .forEach(el => {

                el.addEventListener("click", () => {

                    handleSearchClick(
                        el.dataset.id,
                        el.dataset.type
                    );

                    results.classList.add("hidden");
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
            label: `🦠 ${s.name}`,
            text: s.name.toLowerCase()
        });

    });

    antibiotics.forEach(a => {

        state.searchIndex.push({
            id: a.id,
            type: "antibiotic",
            label: `💊 ${a.name}`,
            text: a.name.toLowerCase()
        });

    });

    organisms.forEach(o => {

        state.searchIndex.push({
            id: o.id,
            type: "organism",
            label: `🔬 ${o.name}`,
            text: o.name.toLowerCase()
        });

    });
}

/* =========================
   SEARCH CLICK
========================= */

function handleSearchClick(id, type) {

    if (type === "syndrome") {

        const item =
            syndromes.find(x => x.id === id);

        if (item) {
            openSyndromeModal(item);
        }

        return;
    }

    if (type === "antibiotic") {

        const item =
            antibiotics.find(x => x.id === id);

        if (item) {
            openAntibioticModal(item);
        }

        return;
    }

    if (type === "organism") {

        const item =
            organisms.find(x => x.id === id);

        if (item) {
            openOrganismModal(item);
        }
    }
}
