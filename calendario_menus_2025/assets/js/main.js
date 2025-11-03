// ===============================================
// VARIABLES GLOBALES Y ELEMENTOS DEL DOM
// ===============================================
const overlay = document.getElementById("content-display-overlay");
const loadedArea = document.getElementById("loaded-content-area");
const closeButton = document.getElementById("close-overlay-button");
const galleriesContainer = document.getElementById('galleries-container');

let menuData = null;       // Almacena la data de menu_db.json
let inventarioData = null; // Almacena la data de inventario_db.json (el array de items)
let logrosData = null;     // Almacena la data de logros_db.json

// RUTA ABSOLUTA PARA LOS DATOS EN GITHUB PAGES
const GITHUB_DATA_BASE_URL = 'https://djless.github.io/magordito_menu_semanal/calendario_menus_2025/data/';

// CONSTANTE PARA EL EMOJI COMODÍN
const COMODIN_EMOJI = "✨"; 

// ===============================================
// FUNCIONES DE PERSISTENCIA
// ===============================================

/** Guarda el estado actual de logrosData en el almacenamiento local. */
function persistirLogros() {
    if (logrosData) {
        localStorage.setItem('logrosData', JSON.stringify(logrosData)); 
    }
}

/** Guarda el estado actual del inventario (solo el array de items) en el almacenamiento local. */
function persistirInventario() {
    if (inventarioData) {
        localStorage.setItem('inventarioData', JSON.stringify(inventarioData)); 
    }
}

/** Guarda el estado actual del menú (objeto completo) en el almacenamiento local. */
function persistirMenu() {
    if (menuData) {
        localStorage.setItem('menuData', JSON.stringify(menuData)); 
    }
}

// ===============================================
// FUNCIONES DE CARGA DE DATOS (JSON) - Prioriza LocalStorage
// ===============================================

async function cargarDatosMenu() {
    // 1. Intenta cargar desde localStorage (para persistir logros)
    const localMenu = localStorage.getItem('menuData');
    if (localMenu) {
        menuData = JSON.parse(localMenu);
        console.log("Base de datos de Menú cargada desde LocalStorage.");
        return;
    }

    // 2. Si no hay en localStorage, cargar desde GitHub (Primera vez)
    try {
        const url = GITHUB_DATA_BASE_URL + 'menu_db.json';
        const response = await fetch(url); 
        
        if (!response.ok) throw new Error('Error al cargar menu_db.json. URL: ' + url);
        menuData = await response.json();
        console.log("Base de datos de Menú cargada desde GitHub.");
        persistirMenu();
    } catch (error) {
        console.error("Fallo la carga del Menú:", error);
    }
}

async function cargarInventario() {
    // 1. Intenta cargar desde localStorage (para persistir logros)
    const localInventario = localStorage.getItem('inventarioData');
    if (localInventario) {
        inventarioData = JSON.parse(localInventario);
        console.log("Base de datos de Inventario cargada desde LocalStorage.");
        return;
    }
    
    // 2. Si no hay en localStorage, cargar desde GitHub (Primera vez)
    try {
        const url = GITHUB_DATA_BASE_URL + 'inventario_db.json';
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Error al cargar inventario_db.json. URL: ' + url);
        const data = await response.json();
        inventarioData = data.inventario;
        console.log("Base de datos de Inventario cargada desde GitHub.");
        persistirInventario();
    } catch (error) {
        console.error("Fallo la carga del Inventario:", error);
    }
}


async function cargarLogros() {
    const localLogros = localStorage.getItem('logrosData');
    if (localLogros) {
        logrosData = JSON.parse(localLogros);
        console.log("Base de datos de Logros cargada desde LocalStorage.");
        return;
    }

    try {
        const url = GITHUB_DATA_BASE_URL + 'logros_db.json';
        const response = await fetch(url);

        if (!response.ok) throw new Error('Error al cargar logros_db.json. URL: ' + url);
        logrosData = await response.json();
        console.log("Base de datos de Logros cargada desde GitHub (Primera vez).");
        persistirLogros();
    } catch (error) {
        console.error("Fallo la carga de Logros:", error);
    }
}

// ===============================================
// SINCRONIZACIÓN INICIAL DE RECOMPENSAS
// ===============================================

/** * Itera sobre los logros. Si un logro está marcado como 'obtenido: true' en el momento de la carga,
 * desbloquea su recompensa si no ha sido desbloqueada previamente.
 */
function sincronizarRecompensasIniciales() {
    if (!logrosData || !menuData || !inventarioData || !logrosData.logros) {
        console.warn("Datos necesarios para sincronización de logros aún no cargados.");
        return;
    }
    
    let isInitialSync = false;
    
    logrosData.logros.forEach(logro => {
        // Procesar solo logros YA obtenidos y que tienen una recompensa definida
        if (logro.obtenido && logro.recompensa) {
            // Llamar a la función de desbloqueo en modo SILENCIOSO (isSilent = true)
            desbloquearRecompensa(logro.recompensa, true); 
            isInitialSync = true;
        }
    });
    
    if (isInitialSync) {
         console.log("Sincronización inicial de recompensas completada.");
    }
}


// ===============================================
// LÓGICA DE RECOMPENSAS
// ===============================================

/** * Procesa la recompensa de un logro (añade ingrediente y plato).
 * @param {object} recompensa - Objeto con las propiedades ingrediente_comodin y plato_nuevo.
 * @param {boolean} isSilent - Si es true, suprime los alerts. Usado para carga inicial.
 */
function desbloquearRecompensa(recompensa, isSilent = false) { 
    let isUpdated = false;
    let newIngredientName = null;
    
    // El ingrediente desbloqueado es SIEMPRE principal
    const newIngredientCategory = "principal"; 

    // 1. Desbloquear INGREDIENTE COMODÍN
    if (recompensa.ingrediente_comodin) {
        const rIng = recompensa.ingrediente_comodin;
        newIngredientName = rIng.nombre;

        // Estructura completa con valores por defecto
        const nuevoIngrediente = {
            nombre: newIngredientName,
            categoria: newIngredientCategory, 
            activo: rIng.activo ?? true,
            cantidad_disponible: rIng.stock_inicial || 1,
            emoji: rIng.emoji || COMODIN_EMOJI, 
            vegetariano: rIng.vegetariano ?? false, 
            vegano: rIng.vegano ?? false,
            pesciboro: rIng.pesciboro ?? true,
            gourmet: rIng.gourmet ?? false
        };

        const existeIngrediente = inventarioData.find(item => item.nombre === newIngredientName);

        if (!existeIngrediente) {
            inventarioData.push(nuevoIngrediente);
            persistirInventario();
            isUpdated = true;
            console.log(`🎉 Ingrediente Comodín Desbloqueado: ${newIngredientName}`);
            if (!isSilent) { 
                alert(`¡Has desbloqueado un ingrediente comodín: ${newIngredientName}!`); 
            }
        }
    }

    // 2. Desbloquear PLATO NUEVO
    if (recompensa.plato_nuevo && newIngredientName) { 
        const rPlato = recompensa.plato_nuevo;
        const newDishName = rPlato.nombre;

        // REGLA: Plato exclusivo con el comodín como único principal
        const platoCarbo = [];    
        const platoPrincipal = [newIngredientName]; 
        const platoVerduras = []; 

        const nuevoPlato = {
            nombre: `${COMODIN_EMOJI} ${newDishName} (${newIngredientName})`, 
            carbohidratos: platoCarbo,
            principales: platoPrincipal,
            verduras: platoVerduras
        };

        const existePlato = menuData.platos_principales.find(plato => plato.nombre === nuevoPlato.nombre);

        if (!existePlato) {
            menuData.platos_principales.push(nuevoPlato);
            persistirMenu();
            isUpdated = true;
            console.log(`🍽️ Plato Nuevo Desbloqueado: ${nuevoPlato.nombre}`);
            if (!isSilent) { 
                alert(`¡Has desbloqueado la receta de plato: ${nuevoPlato.nombre}!`);
            }
        }
    }

    // Opcional: Refrescar la vista si es necesario
    if (isUpdated && !galleriesContainer.classList.contains('hidden')) {
        renderGalleries();
    }
}

// ===============================================
// LÓGICA DE RASTREO Y VERIFICACIÓN DE LOGROS (CON CHEQUEOS DE SEGURIDAD)
// ===============================================

function verificarLogros() {
    if (!logrosData || !menuData || !inventarioData || !logrosData.logros) {
        console.warn("Datos necesarios para verificación de logros aún no cargados.");
        return;
    }

    const platosPrincipales = menuData.platos_principales;
    
    // --- LÓGICA DE CÁLCULO DE MÉTRICAS ---
    
    /** CHEQUEO DE SEGURIDAD: Usa (p.propiedad || []) para asegurar que es un array */
    const countPlatosWithIngredient = (ingredienteName) => {
        return platosPrincipales.filter(p => 
            (p.principales || []).includes(ingredienteName) || 
            (p.carbohidratos || []).includes(ingredienteName) || 
            (p.verduras || []).includes(ingredienteName)
        ).length;
    };
    
    /** CHEQUEO DE SEGURIDAD: Usa (p.propiedad || []).length para evitar el TypeError */
    const checkNineItems = (p) => 
        ((p.carbohidratos || []).length >= 3 && (p.principales || []).length >= 3 && (p.verduras || []).length >= 3);

    const metricasActuales = {
        total_platos_creados: platosPrincipales.length, 
        plato_con_nueve_items: platosPrincipales.some(checkNineItems) ? 1 : 0, 
        
        platos_con_solo_1_carbo: platosPrincipales.filter(p => 
            (p.carbohidratos || []).length === 1 && 
            ((p.principales || []).length > 0 || (p.verduras || []).length > 0)
        ).length,
        
        platos_con_doble_proteina: platosPrincipales.filter(p => (p.principales || []).length >= 2).length,
        platos_con_triple_verdura: platosPrincipales.filter(p => (p.verduras || []).length >= 3).length,
        
        platos_sin_carbohidrato: platosPrincipales.filter(p => 
            (p.carbohidratos || []).length === 0 && 
            ((p.principales || []).length > 0 || (p.verduras || []).length > 0)
        ).length,
        
        platos_con_triple_carbo: platosPrincipales.filter(p => (p.carbohidratos || []).length >= 3).length,
        platos_con_ingrediente_X: countPlatosWithIngredient('Tocino'), 
        total_platos_registrados: inventarioData ? inventarioData.length : 0,

        // **NOTA: Las siguientes métricas requieren lógica de rastreo adicional no incluida aquí,
        // por lo que se dejan en 0 o con los nombres de las métricas que debes implementar:**
        plato_sin_restriccion: 0, 
        total_platos_vegetarianos: 0, 
        platos_con_gourmet: 0, 
        ingredientes_casi_agotados: 0,
        total_dias_planificados: 0,
        ingredientes_unicos_por_semana: 0,
        total_platos_veganos: 0,
        dias_con_plato_asignado_continuo: 0
    };

    // --- 2. ITERAR Y VERIFICAR CONDICIONES ---
    let logrosDesbloqueados = false;

    logrosData.logros.forEach(logro => {
        if (!logro.obtenido) { 
            const metrica = logro.condicion.metrica;
            const valorMinimo = logro.condicion.valor_minimo;
            const valorActual = metricasActuales[metrica] || 0; 
            
            // Chequeo especial para métricas de ingrediente específico
            let cumpleCondicion = false;
            if (metrica === 'platos_con_ingrediente_X' && logro.condicion.param) {
                 if (countPlatosWithIngredient(logro.condicion.param) >= valorMinimo) {
                     cumpleCondicion = true;
                 }
            } else if (valorActual >= valorMinimo) {
                 cumpleCondicion = true;
            }
            
            if (cumpleCondicion) {
                logro.obtenido = true;
                logro.fecha_obtencion = new Date().toLocaleDateString();
                logrosDesbloqueados = true;
                
                if (logro.recompensa) {
                    // Logro cumplido AHORA, no es silencioso
                    desbloquearRecompensa(logro.recompensa, false); 
                }
            }
        }
    });
    
    // 3. PERSISTENCIA
    if (logrosDesbloqueados) {
        persistirLogros();
        // Opcional: Refrescar la pantalla de logros si está abierta
        if (overlay.style.display === "flex" && loadedArea.querySelector('#logros-screen-content')) {
             showLogrosScreen(); 
         }
    }
}


// ===============================================
// LÓGICA DE PANTALLA DE LOGROS Y GALERÍAS
// ===============================================

function toggleLogroDetail(logroId) {
    const detailElement = document.getElementById(`detail-${logroId}`);
    
    if (detailElement) {
        detailElement.style.display = detailElement.style.display === 'none' ? 'block' : 'none';
    }
}

function renderLogrosContent() {
    if (!logrosData || !logrosData.logros) {
        return `<p style="color: #a00000; padding: 20px; background-color: #2b313a; border-radius: 5px;">No se pudo cargar la data de Logros.</p>`; 
    }

    const logrosHTML = logrosData.logros.map(logro => {
        const isObtenido = logro.obtenido;
        const statusColor = isObtenido ? '#ffc107' : '#484f58'; 
        const condicionParam = logro.condicion.param ? `(con ${logro.condicion.param})` : '';
        const recompensa = logro.recompensa ? '⭐️ Recompensa: Plato Exclusivo' : '';

        return `
            <div class="gallery-item logro-item" 
                 onclick="toggleLogroDetail('${logro.id}')" 
                 style="border-left: 5px solid ${statusColor}; 
                        opacity: ${isObtenido ? '1.0' : '0.6'}; 
                        cursor: pointer; 
                        transition: opacity 0.3s;
                        min-width: 250px; 
                        margin: 10px; padding: 15px;
                        background-color: #2b313a; 
                        border-radius: 8px; 
                        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                        color: #c9d1d9;"> 
                
                <h4>${logro.nombre} ${isObtenido ? '✨' : ''}</h4>
                <p style="font-size: 0.9em; margin-top: 5px; color: #c9d1d9;">${logro.descripcion}</p>
                <p style="font-size: 0.8em; color: #ffc107;">${recompensa}</p>
                
                <div id="detail-${logro.id}" class="logro-detail-info" style="display: none; margin-top: 15px; padding: 10px; border-top: 1px dashed #484f58; background-color: #1a1f26; border-radius: 3px;">
                    <p style="font-weight: bold; color: #58a6ff;">📋 Condición de Desbloqueo:</p> 
                    <p>Métrica: <strong>${logro.condicion.metrica}</strong></p>
                    <p>Valor Requerido: <strong>${logro.condicion.valor_minimo}</strong> ${condicionParam}</p>
                    ${isObtenido 
                        ? `<p style="color: #238636; font-weight: bold; margin-top: 5px;">¡Logro Alcanzado! En: ${logro.fecha_obtencion || 'N/A'}</p>`
                        : `<p style="color: #a00000; font-weight: bold; margin-top: 5px;">¡Sigue Planeando!</p>`
                    }
                </div>
            </div>
        `;
    }).join('');

    return `
        <h2 style="color: #58a6ff; border-bottom: 2px solid #484f58; padding-bottom: 10px; margin-bottom: 20px;">🏆 Central de Logros</h2>
        <div class="gallery-grid" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px;">${logrosHTML}</div>
    `;
}

function showLogrosScreen() {
    loadedArea.innerHTML = ""; 
    overlay.style.display = "flex"; 

    const container = document.createElement("div");
    container.id = "logros-screen-content";
    container.style.width = "100%"; 
    container.style.height = "100%";
    container.style.overflowY = "auto";
    container.style.padding = "20px";
    container.style.backgroundColor = "#0d1117"; 
    container.style.color = "#c9d1d9"; 
    
    container.innerHTML = renderLogrosContent();

    loadedArea.appendChild(container);
    console.log("Pantalla de Logros cargada.");
}

function toggleGalleries() {
    if (galleriesContainer.classList.contains('hidden')) {
        galleriesContainer.classList.remove('hidden');
        galleriesContainer.style.backgroundColor = '#1a1f26'; 
        galleriesContainer.style.borderColor = '#484f58';
        galleriesContainer.style.color = '#c9d1d9';
        renderGalleries();
    } else {
        galleriesContainer.classList.add('hidden');
        galleriesContainer.innerHTML = '';
    }
}

function renderGalleries() {
    galleriesContainer.innerHTML = ''; // Limpiar

    const logrosButtonHTML = `
        <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #58a6ff; border-radius: 8px; background-color: #2b313a; text-align: center;">
            <button onclick="showLogrosScreen()" style="padding: 10px 20px; font-size: 1.1em; color: #333; background-color: #ffc107; border: none; border-radius: 5px; cursor: pointer;">
                🏆 Ver Logros y Desafíos
            </button>
        </div>
    `;
    galleriesContainer.innerHTML += logrosButtonHTML;

    // --- 1. GALERÍA DE MENÚS ---
    if (menuData && menuData.platos_principales) {
        const menuHTML = `
            <h3 style="color: #58a6ff;">📚 Menú de Platos Principales</h3>
            <div class="gallery-grid">
                ${menuData.platos_principales.map(plato => `
                    <div class="gallery-item" style="border-left: 5px solid #58a6ff; background-color: #2b313a; color: #c9d1d9; border: 1px solid #484f58;">
                        <h4>${plato.nombre}</h4>
                        <p><strong>Carbohidratos:</strong> ${(plato.carbohidratos || []).join(', ')}</p>
                        <p><strong>Proteínas:</strong> ${(plato.principales || []).join(', ')}</p>
                        <p><strong>Verduras:</strong> ${(plato.verduras || []).join(', ')}</p>
                    </div>
                `).join('')}
            </div>
            <hr style="margin: 20px 0; border-color: #484f58;">
        `;
        galleriesContainer.innerHTML += menuHTML;
    } else {
         galleriesContainer.innerHTML += `<p style="color: #a00000; background-color: #2b313a; padding: 10px; border-radius: 5px;">No se pudo cargar la data de Menú. Verifica la conexión a internet o la URL de GitHub Pages.</p>`;
    }


    // --- 2. GALERÍA DE INVENTARIO ---
    if (inventarioData) {
        const inventarioHTML = `
            <h3 style="color: #58a6ff;">📦 Inventario de Ingredientes</h3>
            <div class="gallery-grid">
                ${inventarioData.map(item => `
                    <div class="gallery-item" style="border-left: 5px solid ${item.activo && item.cantidad_disponible > 0 ? '#238636' : '#a00000'}; background-color: #2b313a; color: #c9d1d9; border: 1px solid #484f58;">
                        <h4>${item.emoji} ${item.nombre} <small>(${item.categoria})</small></h4>
                        <p><strong>Activo:</strong> <span style="color: ${item.activo ? '#238636' : '#a00000'}; font-weight: bold;">${item.activo ? 'Sí' : 'No'}</span></p>
                        <p><strong>Cantidad Disp:</strong> <span style="font-weight: bold;">${item.cantidad_disponible}</span></p>
                    </div>
                `).join('')}
            </div>
        `;
        galleriesContainer.innerHTML += inventarioHTML;
    } else {
        galleriesContainer.innerHTML += `<p style="color: #a00000; background-color: #2b313a; padding: 10px; border-radius: 5px;">No se pudo cargar la data de Inventario. Verifica la conexión a internet o la URL de GitHub Pages.</p>`;
    }
}


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
cargarLogros().then(() => { 
    sincronizarRecompensasIniciales(); // Otorga recompensas de logros ya obtenidos (obtenido: true en JSON)
    verificarLogros(); 
});
