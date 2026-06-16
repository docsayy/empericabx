const table = document.getElementById("coverageTable");
const thead = table.querySelector("thead");
const tbody = table.querySelector("tbody");

const columnControls = document.getElementById("columnControls");
const drugControls = document.getElementById("drugControls");

const searchInput = document.getElementById("search");

let data = [];

const defaultColumns = [
    "name",
    "class",
    "route",
    "mrsa",
    "mssa",
    "streptococcus",
    "enterococcus",
    "vre",
    "gram_negative",
    "pseudomonas",
    "anaerobes",
    "atypicals",
    "esbl",
    "cre",
    "ampc",
    "first_line_for",
    "combo_required",
    "bioavailability",
    "renal_adjustment",
    "c_diff_risk",
    "pregnancy_safe",
    "qt_prolongation",
    "notes"
];

function formatValue(value){

    if(value === true){
        return `<span class="yes">✅</span>`;
    }

    if(value === false){
        return `<span class="no">❌</span>`;
    }

    if(value === "partial" || value === "limited"){
        return `<span class="partial">⚠️ ${value}</span>`;
    }

    if(Array.isArray(value)){
        return value.join(", ");
    }

    return value ?? "";
}

function buildTable(){

    const visibleColumns = getVisibleColumns();
    const visibleDrugs = getVisibleDrugs();

    thead.innerHTML = "";
    tbody.innerHTML = "";

    const headerRow = document.createElement("tr");

    visibleColumns.forEach(col=>{
        const th=document.createElement("th");
        th.textContent=pretty(col);
        th.dataset.column=col;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);

    const searchTerm = searchInput.value.toLowerCase();

    data
        .filter(row=>visibleDrugs.includes(row.name))
        .filter(row=>
            row.name.toLowerCase().includes(searchTerm)
        )
        .forEach(row=>{

            const tr=document.createElement("tr");

            visibleColumns.forEach(col=>{

                const td=document.createElement("td");

                if(col==="notes"){
                    td.classList.add("notes");
                }

                td.innerHTML=formatValue(row[col]);

                tr.appendChild(td);

            });

            tbody.appendChild(tr);
        });
}

function pretty(text){

    return text
        .replaceAll("_"," ")
        .replace(/\b\w/g,l=>l.toUpperCase());

}

function saveSetting(key,value){
    localStorage.setItem(key,JSON.stringify(value));
}

function loadSetting(key,fallback){
    return JSON.parse(
        localStorage.getItem(key)
    ) || fallback;
}

function getVisibleColumns(){
    return loadSetting("visibleColumns",defaultColumns);
}

function getVisibleDrugs(){
    return loadSetting(
        "visibleDrugs",
        data.map(d=>d.name)
    );
}

function buildColumnControls(){

    const visible = getVisibleColumns();

    columnControls.innerHTML="";

    defaultColumns.forEach(col=>{

        const label=document.createElement("label");

        label.innerHTML=`
            <input
                type="checkbox"
                value="${col}"
                ${visible.includes(col) ? "checked" : ""}
            >
            ${pretty(col)}
        `;

        label.querySelector("input")
            .addEventListener("change",()=>{

                let cols=getVisibleColumns();

                if(cols.includes(col)){
                    cols=cols.filter(c=>c!==col);
                }else{
                    cols.push(col);
                }

                saveSetting("visibleColumns",cols);
                buildTable();

            });

        columnControls.appendChild(label);

    });
}

function buildDrugControls(){

    const visible = getVisibleDrugs();

    drugControls.innerHTML="";

    data.forEach(drug=>{

        const label=document.createElement("label");

        label.innerHTML=`
            <input
                type="checkbox"
                value="${drug.name}"
                ${visible.includes(drug.name) ? "checked" : ""}
            >
            ${drug.name}
        `;

        label.querySelector("input")
            .addEventListener("change",()=>{

                let drugs=getVisibleDrugs();

                if(drugs.includes(drug.name)){
                    drugs=drugs.filter(
                        d=>d!==drug.name
                    );
                }else{
                    drugs.push(drug.name);
                }

                saveSetting("visibleDrugs",drugs);
                buildTable();

            });

        drugControls.appendChild(label);

    });
}

searchInput.addEventListener(
    "input",
    buildTable
);

async function loadData(){

    const response = await fetch("coverage.json");

    data = await response.json();

    buildColumnControls();
    buildDrugControls();
    buildTable();
}

loadData();
