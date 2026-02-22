// VLOŽ SEM SVŮJ ODKAZ Z GOOGLE TABULEK (formát .csv)
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQqvio7EPnscU_rvx66THWNy75RfpFzDyi3exttD_FU4V2Px-kk3W9H9s1d_n3RQTlHHy54lIdW8X_7/pub?gid=0&single=true&output=csv";

let myVideoProjects = [];
let currentProj = 0;
let currentVid = 0;

function sklonuj(pocet, jedna, dveCtyri, petAVice) {
    if (pocet === 1) return jedna;
    if (pocet >= 2 && pocet <= 4) return dveCtyri;
    return petAVice;
}

async function loadTableData() {
    try {
        const response = await fetch(sheetURL);
        const csvText = await response.text();
        
        // Rozdělení na řádky
        const rows = csvText.split(/\r?\n/).filter(row => row.trim() !== "");
        
        // Zpracování dat bez "čínského bordelu"
        myVideoProjects = rows.slice(1).map(row => {
            // Jednodušší a bezpečnější rozdělení CSV
            const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            const clean = (str) => str ? str.replace(/^"|"$/g, '').trim() : "";

            return {
                title: clean(columns[0]),
                desc: clean(columns[1]),
                thumbID: clean(columns[2]),
                videos: clean(columns[3]).split(',').map(v => v.trim())
            };
        });

        // Otočení pořadí: nejnovější (poslední v tabulce) budou první na webu
        myVideoProjects.reverse(); 

        buildVidGallery();
    } catch (error) {
        console.error("Chyba při načítání dat:", error);
    }
}

function buildVidGallery() {
    const container = document.getElementById('vid-gallery-container');
    if (!container) return;
    container.innerHTML = ""; 

    myVideoProjects.forEach((proj, index) => {
        let thumbUrl = proj.thumbID.startsWith('http') 
            ? proj.thumbID 
            : `https://img.youtube.com/vi/${proj.thumbID}/maxresdefault.jpg`;
        
        const div = document.createElement('div');
        div.className = 'vid-gallery-item w3-card-4'; 
        div.style.cursor = "pointer";
        div.onclick = () => openModal(index);
        const pocetVidi = proj.videos.length;
        const textVidi = sklonuj(pocetVidi, "VIDEO", "VIDEA", "VIDEÍ");

        // Sjednocená struktura karty s "nálepkou"
        div.innerHTML = `
            <div class="vid-thumb-wrapper" style="position:relative; aspect-ratio: 16/9; overflow:hidden; background:#000;">
        <img src="${thumbUrl}" ...>
        <div style="position:absolute; bottom:8px; right:8px; background:rgba(0,0,0,0.8); color:#fff; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:bold; letter-spacing: 1px;">
            ${pocetVidi} ${textVidi}
        </div>
    </div>
            <div class="vid-item-text" style="padding: 15px;">
                <h3 style="margin:0; font-size:1.1em; color:#fff; font-weight:600;">${proj.title}</h3>
                <p style="margin:5px 0 0; color:#aaa; font-size:0.9em; line-height:1.4;">${proj.desc}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

// Funkce pro aktualizaci obsahu modálu s fixní výškou
function updateModalContent() {
    const proj = myVideoProjects[currentProj];
    const content = document.getElementById('modalContent');
    const nav = document.getElementById('videoNav');
    
    if (!proj.videos || proj.videos.length === 0 || proj.videos[0] === "") {
        content.innerHTML = `<div style="color:white;">Video není k dispozici</div>`;
        return;
    }

    // Iframe se nyní roztáhne přesně do fixního prostoru 60vh
    content.innerHTML = `
        <div style="width:100%; height:100%;">
            <iframe src="${proj.videos[currentVid]}?autoplay=1" 
                    style="width:100%; height:100%; border:0;" 
                    allow="autoplay; fullscreen" allowfullscreen></iframe>
        </div>`;
    
    document.getElementById('modalTitle').innerText = proj.title;
    document.getElementById('modalDesc').innerText = proj.desc;

    // Navigace
    if (proj.videos.length > 1) {
        nav.innerHTML = `
            <button class="nav-btn" onclick="prevVid()">❮ Předchozí</button>
            <span style="color:white; margin: 0 15px; font-weight:bold;">${currentVid + 1} / ${proj.videos.length}</span>
            <button class="nav-btn" onclick="nextVid()">Další ❯</button>
        `;
    } else {
        nav.innerHTML = "";
    }
}

// Pomocná funkce pro případ, že se obrázek nenačte
function handleImageError(img, thumbID) {
    // Pokud to bylo YouTube ID a nenašel se maxresdefault, zkusíme nižší kvalitu
    if (!thumbID.startsWith('http')) {
        img.src = `https://img.youtube.com/vi/${thumbID}/hqdefault.jpg`;
    } else {
        // Pokud selhal i přímý odkaz, dáme tam černý placeholder
        img.src = 'https://via.placeholder.com/600x400/000000/FFFFFF?text=Náhled+nenalezen';
    }
}

// Funkce openModal, updateModalContent, nextVid, prevVid a closeModal 
// zůstávají naprosto STEJNÉ jako v předchozím kódu.

window.openModal = function(index) {
    currentProj = index;
    currentVid = 0;
    updateModalContent();
    document.getElementById('videoModal').style.display = 'block';
}

function updateModalContent() {
    const proj = myVideoProjects[currentProj];
    const content = document.getElementById('modalContent');
    
    // Kontrola, zda existuje alespoň jedno video a není to prázdný řetězec
    if (!proj.videos || proj.videos.length === 0 || proj.videos[0] === "") {
        content.innerHTML = `
            <div class="w3-container w3-center w3-padding-64" style="color: white; background: #222; border-radius: 15px;">
                <i class="fa fa-exclamation-triangle" style="font-size:48px;color:#f44336"></i>
                <h2 style="margin-top:20px;">Chybí video</h2>
                <p>Omlouváme se, ale pro tento projekt není k dispozici žádný záznam.</p>
            </div>`;
        document.getElementById('modalTitle').innerText = proj.title;
        document.getElementById('modalDesc').innerText = proj.desc;
        return;
    }

    // Pokud video existuje, vykreslíme přehrávač
    let html = `
        <div class="video-container">
            <iframe src="${proj.videos[currentVid]}?autoplay=1" allowfullscreen></iframe>
        </div>`;
    
    if (proj.videos.length > 1) {
        html += `
            <div class="w3-center w3-padding-16">
                <button class="nav-btn" onclick="prevVid()">❮ Předchozí</button>
                <span style="color:white; font-weight:500;">${currentVid + 1} / ${proj.videos.length}</span>
                <button class="nav-btn" onclick="nextVid()">Další ❯</button>
            </div>`;
    }

    content.innerHTML = html;
    document.getElementById('modalTitle').innerText = proj.title;
    document.getElementById('modalDesc').innerText = proj.desc;
}

window.nextVid = () => {
    currentVid = (currentVid + 1) % myVideoProjects[currentProj].videos.length;
    updateModalContent();
};

window.prevVid = () => {
    currentVid = (currentVid - 1 + myVideoProjects[currentProj].videos.length) % myVideoProjects[currentProj].videos.length;
    updateModalContent();
};

window.closeModal = () => {
    document.getElementById('videoModal').style.display = 'none';
    document.getElementById('modalContent').innerHTML = '';
};

// Spuštění načítání dat
document.addEventListener('DOMContentLoaded', loadTableData);