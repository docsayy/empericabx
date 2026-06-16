console.log("EmpiricAbx loaded");

/* =========================
   GLOBAL DATA
========================= */

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
    setupModal();

    await loadData();

    renderSyndromes();
    renderAntibiotics();
    renderOrganisms();
    renderCoverageMatrix();

    console.log("EmpiricAbx ready.");
}

/* =========================
   LOAD JSON DATA
========================= */

async function loadData() {
    try {
        console.log("Loading JSON...");

        const responses = await Promise.all([
            fetch("data/syndromes.json"),
            fetch("data/antibiotics.json"),
            fetch("data/organisms.json")
        ]);

        responses.forEach(res => {
            if (!res.ok) {
                throw new Error(
                    `Failed loading ${res.url}: ${res.status}`
                );
            }
        });

        syndromes = await responses[0].json();
        antibiotics = await responses[1].json();
        organisms = await responses[2].json();

        buildSearchIndex();

        console.log("Loaded:", {
            syndromes: syndromes.length,
            antibiotics: antibiotics.length,
            organisms: organisms.length
        });

    } catch (err) {
        console.error("Data load error:", err);

        alert(
            "Unable to load JSON files. Check console and file paths."
        );
    }
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

    document.querySelectorAll(".view").forEach(section => {
        section.classList.remove("active-view");
    });

    const target = document.getElementById(view + "View");

    if (target) {
        target.classList.add("active-view");
    }

    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.toggle(
            "active",
            btn.dataset.view === view
        );
    });
}

/* =========================
   RENDER SYNDROMES
========================= */

function renderSyndromes() {
    const grid = document.getElementById("syndromeGrid");
    const count = document.getElementById("syndromeCount");

    if (!grid) return;

    grid.innerHTML = "";

    syndromes.forEach(item => {
        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <div class="card-title">
                ${item.name}
            </div>

            <div class="card-description">
                ${item.short || ""}
            </div>
        `;

        card.addEventListener("click", () => {
            openSyndromeModal(item);
        });

        grid.appendChild(card);
    });

    if (count) {
        count.textContent =
            `${syndromes.length} syndromes`;
    }
}

/* =========================
   RENDER ANTIBIOTICS
========================= */

function renderAntibiotics() {
    const container =
        document.getElementById("antibioticContainer");

    if (!container) return;

    container.innerHTML = "";

    antibiotics.forEach(item => {
        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <div class="card-title">
                ${item.name}
            </div>

            <div class="card-description">
                ${item.class || ""}

                <br><br>

                Covers:
                ${(item.coverage || [])
                    .slice(0, 3)
                    .join(", ")}
            </div>
        `;

        card.addEventListener("click", () => {
            openAntibioticModal(item);
        });

        container.appendChild(card);
    });
}

/* =========================
   RENDER ORGANISMS
========================= */

function renderOrganisms() {
    const container =
        document.getElementById("organismContainer");

    if (!container) return;

    container.innerHTML = "";

    organisms.forEach(item => {
        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <div class="card-title">
                ${item.name}
            </div>

            <div class="card-description">
                ${(item.sources || [])
                    .slice(0, 2)
                    .join(", ")}
            </div>
        `;

        card.addEventListener("click", () => {
            openOrganismModal(item);
        });

        container.appendChild(card);
    });
}

/* =========================
   COVERAGE MATRIX
========================= */

function renderCoverageMatrix() {
    const coverageView =
        document.getElementById("coverageView");

    if (!coverageView) return;

    const placeholder =
        coverageView.querySelector(".placeholder");

    if (!placeholder) return;

    placeholder.innerHTML = `
        <h2>Coverage Matrix</h2>

        <p>
            Quickly compare major organisms
            covered by common antibiotics.
        </p>

        <div id="coverageMatrixContainer">
        </div>
    `;

    const matrix =
        document.getElementById(
            "coverageMatrixContainer"
        );

    const importantBugs = [
        "MRSA",
        "Pseudomonas",
        "Anaerobes",
        "Enterococcus",
        "Streptococci",
        "Atypicals"
    ];

    let html = `
        <table class="coverage-table">
            <thead>
                <tr>
                    <th>Antibiotic</th>
    `;

    importantBugs.forEach(bug => {
        html += `<th>${bug}</th>`;
    });

    html += `
                </tr>
            </thead>

            <tbody>
    `;

    antibiotics.forEach(abx => {
        html += `
            <tr>
                <td>${abx.name}</td>
        `;

        importantBugs.forEach(bug => {
            const covered =
                (abx.coverage || []).includes(bug);

            html += `
                <td>
                    ${covered ? "✓" : "—"}
                </td>
            `;
        });

        html += `</tr>`;
    });

    html += `
            </tbody>
        </table>
    `;

    matrix.innerHTML = html;
}

/* =========================
   SEARCH INDEX
========================= */

function buildSearchIndex() {
    state.searchIndex = [];

    syndromes.forEach(item => {
        state.searchIndex.push({
            type: "syndrome",
            id: item.id,
            label: item.name,
            text: (
                item.name +
                " " +
                (item.short || "")
            ).toLowerCase()
        });
    });

    antibiotics.forEach(item => {
        state.searchIndex.push({
            type: "antibiotic",
            id: item.id,
            label: item.name,
            text: (
                item.name +
                " " +
                item.class +
                " " +
                (item.coverage || []).join(" ")
            ).toLowerCase()
        });
    });

    organisms.forEach(item => {
        state.searchIndex.push({
            type: "organism",
            id: item.id,
            label: item.name,
            text: (
                item.name +
                " " +
                (item.sources || []).join(" ")
            ).toLowerCase()
        });
    });
}

/* =========================
   SEARCH SETUP
========================= */

function setupSearch() {
    const input =
        document.getElementById("globalSearch");

    const results =
        document.getElementById("searchResults");

    if (!input || !results) return;

    input.addEventListener("input", () => {
        const query =
            input.value.toLowerCase().trim();

        if (!query) {
            results.classList.add("hidden");
            results.innerHTML = "";
            return;
        }

        const matches =
            state.searchIndex
                .filter(item =>
                    item.text.includes(query)
                )
                .slice(0, 10);

        results.innerHTML = matches.map(item => `
            <div
                class="search-item"
                data-id="${item.id}"
                data-type="${item.type}"
            >
                <strong>${item.label}</strong>

                <small>
                    ${item.type}
                </small>
            </div>
        `).join("");

        results.classList.remove("hidden");

        results
            .querySelectorAll(".search-item")
            .forEach(item => {
                item.addEventListener(
                    "click",
                    handleSearchClick
                );
            });
    });
}
/* =========================
   MODAL SETUP
========================= */

function setupModal() {
    document.addEventListener("click", (e) => {

        /* Close button */
        if (e.target.closest("#closeModal")) {
            closeModal();
        }

        /* Click outside modal */
        if (e.target.id === "modalOverlay") {
            closeModal();
        }

        /* Accordion */
        const header = e.target.closest(".accordion-header");

        if (header) {
            const accordion = header.parentElement;
            const content = accordion.querySelector(
                ".accordion-content"
            );

            accordion.classList.toggle("open");

            if (content) {
                content.style.display =
                    accordion.classList.contains("open")
                        ? "block"
                        : "none";
            }
        }
    });

    /* ESC key closes modal */
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeModal();
        }
    });
}

/* =========================
   MODAL OPEN/CLOSE
========================= */

function openModal(html) {

    const overlay =
        document.getElementById("modalOverlay");

    const content =
        document.getElementById("modalContent");

    if (!overlay || !content) return;

    content.innerHTML = html;

    overlay.classList.remove("hidden");

    document.body.style.overflow = "hidden";
}

function closeModal() {

    const overlay =
        document.getElementById("modalOverlay");

    if (!overlay) return;

    overlay.classList.add("hidden");

    document.body.style.overflow = "";
}

/* =========================
   SYNDROME MODAL
========================= */

function openSyndromeModal(item) {
    openModal(generateSyndromeHTML(item));
}

function generateSyndromeHTML(s) {

    return `
        <h2>${s.name}</h2>

        <p class="modal-subtitle">
            ${s.short || ""}
        </p>

        ${accordion(
            "Likely Organisms",
            formatList(s.organisms),
            true
        )}

        ${accordion(
            "Empiric Therapy",
            formatList(s.empiric),
            true
        )}

        ${accordion(
            "Escalation Rules",
            formatObject(s.escalation),
            false
        )}

        ${accordion(
            "Clinical Pearls",
            formatList(s.pearls),
            false
        )}
    `;
}

/* =========================
   ANTIBIOTIC MODAL
========================= */

function openAntibioticModal(item) {
    openModal(generateAntibioticHTML(item));
}

function generateAntibioticHTML(a) {

    return `
        <h2>${a.name}</h2>

        <p class="modal-subtitle">
            ${a.class || ""}
        </p>

        ${accordion(
            "Coverage",
            formatList(a.coverage),
            true
        )}

        ${accordion(
            "Major Gaps",
            formatList(a.misses),
            true
        )}

        ${accordion(
            "Clinical Pearls",
            formatList(a.pearls),
            false
        )}
    `;
}

/* =========================
   ORGANISM MODAL
========================= */

function openOrganismModal(item) {
    openModal(generateOrganismHTML(item));
}

function generateOrganismHTML(o) {

    return `
        <h2>${o.name}</h2>

        ${accordion(
            "Common Sources",
            formatList(o.sources),
            true
        )}

        ${accordion(
            "Covered By",
            formatList(o.coveredBy),
            true
        )}

        ${accordion(
            "Clinical Pearls",
            formatList(o.pearls),
            false
        )}
    `;
}

/* =========================
   SEARCH CLICK HANDLER
========================= */

function handleSearchClick(e) {

    const id =
        e.currentTarget.dataset.id;

    const type =
        e.currentTarget.dataset.type;

    if (type === "syndrome") {

        const match =
            syndromes.find(
                s => s.id === id
            );

        if (match) {
            openSyndromeModal(match);
        }
    }

    else if (type === "antibiotic") {

        const match =
            antibiotics.find(
                a => a.id === id
            );

        if (match) {
            openAntibioticModal(match);
        }
    }

    else if (type === "organism") {

        const match =
            organisms.find(
                o => o.id === id
            );

        if (match) {
            openOrganismModal(match);
        }
    }

    document
        .getElementById("searchResults")
        ?.classList.add("hidden");

    document
        .getElementById("globalSearch")
        ?.blur();
}

/* =========================
   ACCORDION TEMPLATE
========================= */

function accordion(
    title,
    content,
    open = false
) {

    return `
        <div class="accordion ${open ? "open" : ""}">

            <div class="accordion-header">
                ${title}
            </div>

            <div
                class="accordion-content"
                style="
                    display:
                    ${open ? "block" : "none"}
                "
            >
                ${content}
            </div>

        </div>
    `;
}

/* =========================
   HELPER FUNCTIONS
========================= */

function formatList(arr = []) {

    if (!arr || arr.length === 0) {
        return `
            <p>No data available.</p>
        `;
    }

    return `
        <ul>
            ${arr.map(item => `
                <li>${item}</li>
            `).join("")}
        </ul>
    `;
}

function formatObject(obj = {}) {

    if (
        !obj ||
        Object.keys(obj).length === 0
    ) {
        return `
            <p>No data available.</p>
        `;
    }

    return `
        <ul>
            ${Object.entries(obj)
                .map(([key, value]) => `
                    <li>
                        <strong>${key}:</strong>
                        ${value}
                    </li>
                `)
                .join("")}
        </ul>
    `;
}
/* =========================
   BOARD PEARLS
========================= */

function renderBoardPearls() {

    const container =
        document.querySelector("#pearlsView .placeholder");

    if (!container) return;

    const pearls = [
        "CAP → Always think atypical coverage.",
        "Post-influenza pneumonia → think MRSA.",
        "HAP/VAP → Cover MRSA + Pseudomonas upfront.",
        "Enterococcus is NOT covered by cephalosporins.",
        "Purulent SSTI → think MRSA.",
        "Necrotizing infection → add clindamycin.",
        "Below the diaphragm → cover anaerobes.",
        "Persistent bacteremia → evaluate for endocarditis.",
        "Daptomycin does NOT work in pneumonia.",
        "Listeria coverage (ampicillin) if age >50 or immunocompromised.",
        "Source control is often as important as antibiotics.",
        "Start broad in sepsis, then de-escalate."
    ];

    container.innerHTML = `
        <h2>Board Pearls</h2>

        <p>
            High-yield infectious disease
            recall points.
        </p>

        <ul class="pearls-list">
            ${pearls.map(p => `
                <li>${p}</li>
            `).join("")}
        </ul>
    `;
}

/* =========================
   QUIZ MODE
========================= */

function renderQuizMode() {

    const container =
        document.querySelector("#quizView .placeholder");

    if (!container) return;

    const questions = [

        {
            question:
                "72-year-old ICU patient develops fever on day 7 of intubation with new infiltrates.",
            answer:
                "Vancomycin + Cefepime ± second antipseudomonal agent",
            pearl:
                "HAP/VAP → MRSA + Pseudomonas."
        },

        {
            question:
                "65-year-old with meningitis. What must be added?",
            answer:
                "Ampicillin",
            pearl:
                "Cover Listeria if >50."
        },

        {
            question:
                "Purulent cellulitis empiric coverage?",
            answer:
                "MRSA coverage (TMP-SMX, doxycycline, vancomycin)",
            pearl:
                "Pus = MRSA."
        }
    ];

    let current = 0;

    function renderQuestion() {

        const q = questions[current];

        container.innerHTML = `
            <h2>Quiz Mode</h2>

            <div class="quiz-card">

                <h3>
                    Question ${current + 1}
                    of ${questions.length}
                </h3>

                <p>${q.question}</p>

                <button
                    id="showAnswerBtn"
                    class="action-btn"
                >
                    Show Answer
                </button>

                <div
                    id="quizAnswer"
                    class="hidden"
                >
                    <hr>

                    <p>
                        <strong>Answer:</strong><br>
                        ${q.answer}
                    </p>

                    <p>
                        <strong>Pearl:</strong><br>
                        ${q.pearl}
                    </p>
                </div>

                <button
                    id="nextQuestionBtn"
                    class="action-btn"
                >
                    Next
                </button>

            </div>
        `;

        document
            .getElementById("showAnswerBtn")
            ?.addEventListener("click", () => {

                document
                    .getElementById("quizAnswer")
                    ?.classList.remove("hidden");
            });

        document
            .getElementById("nextQuestionBtn")
            ?.addEventListener("click", () => {

                current++;

                if (current >= questions.length) {
                    current = 0;
                }

                renderQuestion();
            });
    }

    renderQuestion();
}

/* =========================
   COVERAGE BUILDER
========================= */

function renderCoverageBuilder() {

    const container =
        document.querySelector("#builderView .placeholder");

    if (!container) return;

    container.innerHTML = `
        <h2>Coverage Builder</h2>

        <p>
            Choose a syndrome to see
            a recommended empiric regimen.
        </p>

        <select id="builderSelect">

            <option value="">
                Select Syndrome
            </option>

            ${syndromes.map(s => `
                <option value="${s.id}">
                    ${s.name}
                </option>
            `).join("")}

        </select>

        <div id="builderResult"></div>
    `;

    document
        .getElementById("builderSelect")
        ?.addEventListener("change", e => {

            const id = e.target.value;

            const syndrome =
                syndromes.find(
                    s => s.id === id
                );

            const result =
                document.getElementById(
                    "builderResult"
                );

            if (!syndrome || !result) {

                result.innerHTML = "";

                return;
            }

            result.innerHTML = `
                <div class="builder-card">

                    <h3>
                        ${syndrome.name}
                    </h3>

                    <p>
                        <strong>Likely Bugs:</strong>
                    </p>

                    ${formatList(
                        syndrome.organisms
                    )}

                    <p>
                        <strong>
                            Empiric Therapy:
                        </strong>
                    </p>

                    ${formatList(
                        syndrome.empiric
                    )}

                    <p>
                        <strong>
                            Escalation:
                        </strong>
                    </p>

                    ${formatObject(
                        syndrome.escalation
                    )}

                </div>
            `;
        });
}

/* =========================
   SEARCH CLEANUP
========================= */

document.addEventListener("click", e => {

    const search =
        document.getElementById(
            "searchResults"
        );

    const input =
        document.getElementById(
            "globalSearch"
        );

    if (
        !search ||
        !input
    ) return;

    if (
        !search.contains(e.target) &&
        e.target !== input
    ) {

        search.classList.add("hidden");
    }
});

/* =========================
   FINAL INIT
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderBoardPearls();

        renderQuizMode();

        renderCoverageBuilder();
    }
);

console.log(
    "EmpiricAbx fully loaded."
);
