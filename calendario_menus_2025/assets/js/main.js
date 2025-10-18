// ===============================================
// VARIABLES GLOBALES Y ELEMENTOS DEL DOM
// ===============================================
const overlay = document.getElementById("content-display-overlay");
const loadedArea = document.getElementById("loaded-content-area");
const closeButton = document.getElementById("close-overlay-button");
const galleriesContainer = document.getElementById('galleries-container'); // Contenedor de las nuevas galerías

let menuData = null;      // Almacena la data de menu_db.json
let inventarioData = null; // Almacena la data de inventario_db.json

// ===============================================
// FUNCIONES DE CARGA DE DATOS (JSON)
// ===============================================

async function cargarDatosMenu() {
    try {
        // Asegúrate de que la ruta 'data/menu_db.json' sea correcta
        const response = await fetch('data/menu_db.json');
        if (!response.ok) throw new Error('Error al cargar menu_db.json');
        menuData = await response.json();
        console.log("Base de datos de Menú cargada:", menuData);
    } catch (error) {
        console.error("Fallo la carga del Menú:", error);
    }
}

async function cargarInventario() {
    try {
        // Asegúrate de que la ruta 'data/inventario_db.json' sea correcta
        const response = await fetch('data/inventario_db.json');
        if (!response.ok) throw new Error('Error al cargar inventario_db.json');
        const data = await response.json();
        inventarioData = data.inventario;
        console.log("Base de datos de Inventario cargada:", inventarioData);
    } catch (error) {
        console.error("Fallo la carga del Inventario:", error);
    }
}

// ===============================================
// LÓGICA DE GALERÍAS Y CHECKBOX
// ===============================================

function toggleGalleries() {
    // Si el contenedor está oculto (clase 'hidden' del index.html), lo mostramos y renderizamos
    if (galleriesContainer.classList.contains('hidden')) {
        galleriesContainer.classList.remove('hidden');
        renderGalleries();
    } else {
        // Si está visible, lo ocultamos y limpiamos el contenido
        galleriesContainer.classList.add('hidden');
        galleriesContainer.innerHTML = '';
    }
}

function renderGalleries() {
    galleriesContainer.innerHTML = ''; // Limpiar

    // --- 1. GALERÍA DE MENÚS ---
    if (menuData && menuData.platos_principales) {
        const menuHTML = `
            <h3>📚 Menú de Platos Principales</h3>
            <div class="gallery-grid">
                ${menuData.platos_principales.map(plato => `
                    <div class="gallery-item" style="border-left: 5px solid #007bff;">
                        <h4>${plato.nombre}</h4>
                        <p><strong>Carbohidratos:</strong> ${plato.carbohidratos.join(', ')}</p>
                        <p><strong>Proteínas:</strong> ${plato.principales.join(', ')}</p>
                        <p><strong>Verduras:</strong> ${plato.verduras.join(', ')}</p>
                    </div>
                `).join('')}
            </div>
            <hr style="margin: 20px 0;">
        `;
        galleriesContainer.innerHTML += menuHTML;
    } else {
         galleriesContainer.innerHTML += `<p style="color: red;">Error: No se pudo cargar la data de Menú (menu_db.json).</p>`;
    }


    // --- 2. GALERÍA DE INVENTARIO ---
    if (inventarioData) {
        const inventarioHTML = `
            <h3>📦 Inventario de Ingredientes</h3>
            <div class="gallery-grid">
                ${inventarioData.map(item => `
                    <div class="gallery-item" style="border-left: 5px solid ${item.activo && item.cantidad_disponible > 0 ? '#28a745' : '#dc3545'};">
                        <h4>${item.nombre} <small>(${item.categoria})</small></h4>
                        <p><strong>Activo:</strong> <span style="color: ${item.activo ? '#28a745' : '#dc3545'}; font-weight: bold;">${item.activo ? 'Sí' : 'No'}</span></p>
                        <p><strong>Cantidad Disp:</strong> <span style="font-weight: bold;">${item.cantidad_disponible}</span></p>
                    </div>
                `).join('')}
            </div>
        `;
        galleriesContainer.innerHTML += inventarioHTML;
    } else {
        galleriesContainer.innerHTML += `<p style="color: red;">Error: No se pudo cargar la data de Inventario (inventario_db.json).</p>`;
    }
}

// ===============================================
// LÓGICA DE PANTALLA (TU CÓDIGO ORIGINAL)
// ===============================================

async function loadContent(url) {
    loadedArea.innerHTML = "";
    overlay.style.display = "flex";

    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.allow = "autoplay";
    loadedArea.appendChild(iframe);

    iframe.onload = () => console.log("Pantalla cargada:", url);
}

closeButton.addEventListener("click", () => {
    overlay.style.display = "none";
    loadedArea.innerHTML = "";
});


// ===============================================
// INICIALIZACIÓN: Cargar las bases de datos al inicio
// ===============================================
cargarDatosMenu();
cargarInventario();