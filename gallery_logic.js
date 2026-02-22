let currentPhotoFolder = "";
let currentPhotoIndex = 0;
let currentPhotos = []; // Aktuálně zobrazené fotky v modálu

// Pomocná funkce pro správné české skloňování
function sklonuj(pocet, jedna, dveCtyri, petAVice) {
    if (pocet === 1) return jedna;
    if (pocet >= 2 && pocet <= 4) return dveCtyri;
    return petAVice;
}

// Hlavní funkce pro vykreslení galerie na stránku
function buildPhotoGallery() {
    const container = document.getElementById('github-gallery-container');
    
    // Validace dat: Pokud 'images' není pole nebo kontejner neexistuje, nepokračujeme
    if (!container || !Array.isArray(images)) {
        console.error("Galerie: Kontejner nenalezen nebo data nejsou ve formátu pole.");
        return;
    }
    
    container.innerHTML = ""; 

    // Procházení pole 'images' (pořadí z Pythonu zůstane zachováno)
    images.forEach(item => {
        const folderName = item.folder;
        const files = item.files;

        if (!files || files.length === 0) return;

        const card = document.createElement('div');
        card.className = 'vid-gallery-item w3-card-4 w3-margin-bottom';
        card.style.cursor = 'pointer';
        card.onclick = () => openImgModal(folderName, 0);
        
        const pocet = files.length;
        const textSnimky = sklonuj(pocet, "SNÍMEK", "SNÍMKY", "SNÍMKŮ");

        card.innerHTML = `
            <div class="vid-thumb-wrapper" style="position:relative; aspect-ratio:16/9; overflow:hidden; background:#000;">
                <img src="${files[0]}" 
                     style="width:100%; height:100%; object-fit:cover; display:block;" 
                     loading="lazy">
                <div style="position:absolute; bottom:8px; right:8px; background:rgba(0,0,0,0.8); color:#fff; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:bold; letter-spacing: 1px;">
                    ${pocet} ${textSnimky}
                </div>
            </div>
            <div class="vid-item-text" style="padding:15px; background:#1a1a1a; margin-top:0;">
                <h3 style="margin:0; font-size:1.1em; color:#fff; font-weight:600;">${folderName}</h3>
                <p style="margin:5px 0 0; color:#888; font-size:0.9em;">Otevřít kolekci</p>
            </div>
        `;
        container.appendChild(card);
    });
}

// Otevření modálu
window.openImgModal = function(folderName, index) {
    const project = images.find(item => item.folder === folderName);
    if (!project) return;

    currentPhotoFolder = folderName;
    currentPhotoIndex = index;
    currentPhotos = project.files;

    updateImgModalContent();
    document.getElementById('imageModal').style.display = 'block';
    document.body.style.overflow = 'hidden'; 
}

// Zavření modálu
window.closeImgModal = function() {
    document.getElementById('imageModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Aktualizace obsahu v modálu (obrázek a navigace)
function updateImgModalContent() {
    const content = document.getElementById('imgModalContent');
    const nav = document.getElementById('imgNav');

    // Fixní výška 70vh v CSS nebo inline stylu zabrání skákání menu
    content.innerHTML = `
        <div style="height:70vh; display:flex; align-items:center; justify-content:center; background:#000;">
            <img src="${currentPhotos[currentPhotoIndex]}" 
                 class="w3-animate-opacity" 
                 style="max-width:100%; max-height:100%; object-fit:contain; border-radius:4px;">
        </div>`;
    
    document.getElementById('imgModalTitle').innerText = currentPhotoFolder;
    document.getElementById('imgModalDesc').innerText = `Fotografie ${currentPhotoIndex + 1} z ${currentPhotos.length}`;

    if (currentPhotos.length > 1) {
        nav.innerHTML = `
            <button class="nav-btn" onclick="prevImg()">❮ Předchozí</button>
            <span style="color:white; margin: 0 15px; font-weight:bold;">${currentPhotoIndex + 1} / ${currentPhotos.length}</span>
            <button class="nav-btn" onclick="nextImg()">Další ❯</button>
        `;
    } else {
        nav.innerHTML = "";
    }
}

window.nextImg = () => {
    currentPhotoIndex = (currentPhotoIndex + 1) % currentPhotos.length;
    updateImgModalContent();
};

window.prevImg = () => {
    currentPhotoIndex = (currentPhotoIndex - 1 + currentPhotos.length) % currentPhotos.length;
    updateImgModalContent();
};

// Spuštění při načtení
document.addEventListener('DOMContentLoaded', buildPhotoGallery);