let currentModelIndex = 0;
let currentPhotoIndex = 0;
let currentModelImages = [];
let threeScene, threeCamera, threeRenderer, threeControls;
let animationId;

function build3DGallery() {
    const container = document.getElementById('3d-gallery-container');
    
    if (!container || !Array.isArray(models3d)) {
        console.error("Galerie 3D: Kontejner nenalezen nebo data nejsou ve formátu pole.");
        return;
    }
    
    container.innerHTML = ""; 

    models3d.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'vid-gallery-item w3-card-4 w3-margin-bottom';
        card.style.cursor = 'pointer';
        card.onclick = () => openModelModal(index);
        
        card.innerHTML = `
            <div class="vid-thumb-wrapper" style="position:relative; aspect-ratio:16/9; overflow:hidden; background:#000;">
                <img src="${item.thumbnail}" 
                     style="width:100%; height:100%; object-fit:cover; display:block;" 
                     loading="lazy" alt="${item.name}">
                <div style="position:absolute; bottom:8px; right:8px; background:rgba(0,150,136,0.9); color:#fff; padding:4px 10px; border-radius:4px; font-size:12px; font-weight:bold; display:flex; align-items:center; gap:5px;">
                    <i class="fa fa-cube"></i> 3D Model
                </div>
            </div>
            <div class="vid-item-text" style="padding:15px; background:#1a1a1a; margin-top:0;">
                <h3 style="margin:0; font-size:1.1em; color:#fff; font-weight:600;">${item.name}</h3>
                <p style="margin:5px 0 0; color:#888; font-size:0.9em;">Prohlédnout projekt</p>
            </div>
        `;
        container.appendChild(card);
    });
}

function openModelModal(index) {
    currentModelIndex = index;
    const modelData = models3d[currentModelIndex];
    
    document.getElementById('modelModalTitle').innerText = modelData.name;
    document.getElementById('modelModal').style.display = 'block';
    document.body.style.overflow = 'hidden'; 
    
    // Tlačítko MakerWorld
    const makerworldBtn = document.getElementById('makerworldLink');
    if (modelData.makerworld_url) {
        makerworldBtn.href = modelData.makerworld_url;
        makerworldBtn.style.display = 'inline-block';
    } else {
        makerworldBtn.style.display = 'none';
    }
    
    // Načtení fotek do carouselu
    currentModelImages = modelData.images || [];
    currentPhotoIndex = 0;
    updatePhotoCarousel();
    
    // Inicializace 3D scény
    init3DViewer(modelData.stl);
    
    setTimeout(onWindowResize, 50);
}

// === LOGIKA PRO LISTOVÁNÍ FOTEK ===
function updatePhotoCarousel() {
    const photoEl = document.getElementById('currentModelPhoto');
    const counterEl = document.getElementById('photoCounter');
    const btnLeft = document.querySelector('.carousel-btn.left');
    const btnRight = document.querySelector('.carousel-btn.right');
    
    if (currentModelImages.length > 0) {
        photoEl.src = currentModelImages[currentPhotoIndex];
        photoEl.style.display = 'block';
        
        if (currentModelImages.length > 1) {
            btnLeft.style.display = 'flex';
            btnRight.style.display = 'flex';
            counterEl.innerText = `${currentPhotoIndex + 1} / ${currentModelImages.length}`;
            counterEl.style.display = 'block';
        } else {
            // Pokud je jen 1 fotka, schováme šipky
            btnLeft.style.display = 'none';
            btnRight.style.display = 'none';
            counterEl.style.display = 'none';
        }
    } else {
        // Pokud nejsou žádné fotky
        photoEl.style.display = 'none';
        btnLeft.style.display = 'none';
        btnRight.style.display = 'none';
        if(counterEl) counterEl.style.display = 'none';
    }
}

function nextPhoto() {
    if (currentModelImages.length > 1) {
        currentPhotoIndex = (currentPhotoIndex + 1) % currentModelImages.length;
        updatePhotoCarousel();
    }
}

function prevPhoto() {
    if (currentModelImages.length > 1) {
        currentPhotoIndex = (currentPhotoIndex - 1 + currentModelImages.length) % currentModelImages.length;
        updatePhotoCarousel();
    }
}
// ==================================

function closeModelModal() {
    document.getElementById('modelModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    
    if (animationId) cancelAnimationFrame(animationId);
    if (threeRenderer) {
        threeRenderer.dispose();
        document.getElementById('modelViewerContainer').innerHTML = '';
    }
}

function init3DViewer(stlUrl) {
    const container = document.getElementById('modelViewerContainer');
    container.innerHTML = ''; 
    
    threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(0x1a1a1a);
    
    threeCamera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    
    threeRenderer = new THREE.WebGLRenderer({ antialias: true });
    threeRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(threeRenderer.domElement);
    
    threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
    threeControls.enableDamping = true;
    threeControls.dampingFactor = 0.05;
    
    threeScene.add(new THREE.AmbientLight(0x404040, 1.5));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(1, 1, 1).normalize();
    threeScene.add(directionalLight);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-1, -1, -1).normalize();
    threeScene.add(directionalLight2);

    const loadingText = document.createElement('div');
    loadingText.id = 'stlLoadingText';
    loadingText.innerText = "Načítám 3D model...";
    loadingText.style.position = "absolute";
    loadingText.style.color = "white";
    loadingText.style.top = "50%";
    loadingText.style.left = "50%";
    loadingText.style.transform = "translate(-50%, -50%)";
    container.appendChild(loadingText);

    const loader = new THREE.STLLoader();
    loader.load(stlUrl, function (geometry) {
        const material = new THREE.MeshPhongMaterial({ color: 0x009688, specular: 0x111111, shininess: 100 });
        const mesh = new THREE.Mesh(geometry, material);
        
        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);
        mesh.position.sub(center); 
        
        const size = new THREE.Vector3();
        geometry.boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        
        threeCamera.position.z = maxDim * 2.5;
        threeCamera.position.y = maxDim * 1.5;
        threeCamera.lookAt(0, 0, 0);
        
        threeScene.add(mesh);
        
        if(document.getElementById('stlLoadingText')) {
            document.getElementById('stlLoadingText').remove();
        }
    });
    
    window.addEventListener('resize', onWindowResize, false);
    animate();
}

function onWindowResize() {
    const container = document.getElementById('modelViewerContainer');
    if(threeCamera && threeRenderer && container.clientWidth > 0) {
        threeCamera.aspect = container.clientWidth / container.clientHeight;
        threeCamera.updateProjectionMatrix();
        threeRenderer.setSize(container.clientWidth, container.clientHeight);
    }
}

function animate() {
    animationId = requestAnimationFrame(animate);
    if(threeControls) threeControls.update();
    if(threeRenderer && threeScene && threeCamera) threeRenderer.render(threeScene, threeCamera);
}

function nextModel() {
    currentModelIndex = (currentModelIndex + 1) % models3d.length;
    openModelModal(currentModelIndex);
}

function prevModel() {
    currentModelIndex = (currentModelIndex - 1 + models3d.length) % models3d.length;
    openModelModal(currentModelIndex);
}

document.addEventListener('DOMContentLoaded', build3DGallery);