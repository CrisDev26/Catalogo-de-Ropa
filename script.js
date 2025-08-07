// Datos de productos - Se cargarán desde el archivo JSON
let productos = [];

// Variables globales
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let filtroActivo = 'all';
let productosVisible = 6;
let isAdminMode = false;
let editingProductId = null; // Variable para controlar el producto en edición
let lastLoadTime = localStorage.getItem('lastLoadTime');
let pageReloadDetected = false;

// Detectar recarga de página
function detectPageReload() {
    const currentTime = Date.now();
    const timeDiff = currentTime - (lastLoadTime || 0);
    
    console.log('🕐 Detección de recarga de página:');
    console.log('   - Tiempo actual:', new Date(currentTime).toLocaleTimeString());
    console.log('   - Última carga:', lastLoadTime ? new Date(parseInt(lastLoadTime)).toLocaleTimeString() : 'Primera vez');
    console.log('   - Diferencia:', timeDiff + 'ms');
    
    // Si han pasado menos de 5 segundos desde la última carga, es una recarga
    if (lastLoadTime && timeDiff < 5000) {
        pageReloadDetected = true;
        console.log('✅ RECARGA DE PÁGINA DETECTADA (menos de 5 segundos)');
    } else {
        console.log('📄 Primera carga o carga después de mucho tiempo');
    }
    
    localStorage.setItem('lastLoadTime', currentTime);
    return pageReloadDetected;
}

// Mostrar modal de gestión de caché
function showCacheManagementModal() {
    const modal = document.getElementById('cache-clear-modal');
    const cacheStats = document.getElementById('cache-stats');
    
    // Obtener estadísticas del caché
    const storedProducts = localStorage.getItem('productos');
    const storedProductsCount = storedProducts ? JSON.parse(storedProducts).length : 0;
    const cacheSize = storedProducts ? (storedProducts.length / 1024).toFixed(2) : 0;
    
    cacheStats.innerHTML = `
        <div class="cache-stat-item">
            <span><i class="fas fa-box"></i> Productos en caché:</span>
            <strong>${storedProductsCount}</strong>
        </div>
        <div class="cache-stat-item">
            <span><i class="fas fa-memory"></i> Tamaño del caché:</span>
            <strong>${cacheSize} KB</strong>
        </div>
        <div class="cache-stat-item">
            <span><i class="fas fa-clock"></i> Última actualización:</span>
            <strong>${new Date(parseInt(lastLoadTime)).toLocaleString()}</strong>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Manejar botones del modal de caché
function initCacheManagement() {
    const modal = document.getElementById('cache-clear-modal');
    const keepBtn = document.getElementById('keep-cache-btn');
    const clearBtn = document.getElementById('clear-cache-btn');
    const cancelBtn = document.getElementById('cancel-cache-btn');
    
    keepBtn.addEventListener('click', () => {
        console.log('Usuario eligió mantener caché');
        modal.style.display = 'none';
    });
    
    clearBtn.addEventListener('click', () => {
        // Limpiar localStorage
        localStorage.removeItem('productos');
        console.log('Caché limpiado - recargando página...');
        modal.style.display = 'none';
        // Recargar página para cargar datos frescos
        window.location.reload();
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

// Variables de filtros modernos
let filtros = {
    categoria: 'all',
    subcategoria: null,
    busqueda: '',
    precioMin: 0,
    precioMax: Infinity,
    ordenamiento: 'relevance'
};

let subcategoriasPorCategoria = {
    mujer: ['body', 'vestido', 'traje-bano', 'tops', 'faldas', 'conjuntos', 'blusas'],
    hombre: ['camisas', 'pantalones', 'chaquetas', 'trajes'],
    accesorios: ['bolsos', 'zapatos', 'joyas', 'relojes']
};

// DOM Elements
const loader = document.getElementById('loader');
const searchIcon = document.querySelector('.search-icon');
const searchInput = document.querySelector('.search-input');
const cartIcon = document.querySelector('.cart-icon');
const cartCount = document.querySelector('.cart-count');
const cartModal = document.getElementById('cart-modal');
const closeCart = document.querySelector('.close-cart');
const productModal = document.getElementById('product-modal');
const closeModal = document.querySelector('.close-modal');
const productsGrid = document.getElementById('products-grid');
const loadMoreBtn = document.querySelector('.load-more-btn');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const heroBtn = document.querySelector('.hero-btn');
const categoryCards = document.querySelectorAll('.category-card');
const newsletterForm = document.querySelector('.newsletter-form');

// Modern Filter Elements
const filterToggle = document.getElementById('filter-toggle');
const filterPanel = document.getElementById('filter-panel');
const filterOverlay = document.getElementById('filter-overlay');
const filterClose = document.getElementById('filter-close');
const productSearch = document.getElementById('product-search');
const categoryInputs = document.querySelectorAll('input[name="category"]');
const subcategorySection = document.getElementById('subcategory-section');
const subcategoryOptions = document.getElementById('subcategory-options');
const minPriceInput = document.getElementById('min-price');
const maxPriceInput = document.getElementById('max-price');
const priceRange = document.getElementById('price-range');
const sortSelect = document.getElementById('sort-select');
const clearFiltersBtn = document.getElementById('clear-filters');
const applyFiltersBtn = document.getElementById('apply-filters');
const activeFiltersContainer = document.getElementById('active-filters');
const resultsCount = document.getElementById('results-count');
const viewBtns = document.querySelectorAll('.view-btn');

// Event Listeners
document.addEventListener('DOMContentLoaded', init);
document.addEventListener('keydown', handleKeyDown);
window.addEventListener('scroll', handleScroll);
searchIcon.addEventListener('click', toggleSearch);
searchInput.addEventListener('input', handleSearch);
cartIcon.addEventListener('click', toggleCart);
closeCart.addEventListener('click', toggleCart);
closeModal.addEventListener('click', closeProductModal);
loadMoreBtn.addEventListener('click', cargarMasProductos);
hamburger.addEventListener('click', toggleMobileMenu);
heroBtn.addEventListener('click', scrollToProducts);
newsletterForm.addEventListener('submit', handleNewsletter);

// Modern Filter Event Listeners
if (filterToggle) {
    filterToggle.addEventListener('click', toggleFilterPanel);
}
if (filterOverlay) {
    filterOverlay.addEventListener('click', closeFilterPanel);
}
if (filterClose) {
    filterClose.addEventListener('click', closeFilterPanel);
}
if (productSearch) {
    productSearch.addEventListener('input', handleProductSearch);
}

categoryInputs.forEach(input => input.addEventListener('change', handleCategoryChange));

if (minPriceInput) minPriceInput.addEventListener('input', handlePriceFilter);
if (maxPriceInput) maxPriceInput.addEventListener('input', handlePriceFilter);
if (priceRange) priceRange.addEventListener('input', handlePriceRange);
if (sortSelect) sortSelect.addEventListener('change', handleSort);
if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', limpiarFiltros);
if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', aplicarFiltros);
viewBtns.forEach(btn => btn.addEventListener('click', toggleView));

// Click fuera del modal
window.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        toggleCart();
    }
    // Cerrar modal de producto si se hace clic en el overlay
    if (e.target === productModal || e.target.classList.contains('product-modal')) {
        closeProductModal();
    }
});

// Inicialización
async function init() {
    console.log('🚀 INICIANDO APLICACIÓN MVA');
    console.log('==========================================');
    
    // Detectar recarga de página
    const isReload = detectPageReload();
    
    // Verificar modo admin
    checkAdminMode();
    
    // Lógica de manejo del localStorage según el modo
    if (isReload && localStorage.getItem('productos')) {
        if (!isAdminMode) {
            // Si NO está en modo admin, actualizar localStorage con datos frescos del JSON
            console.log('🔄 PÁGINA RECARGADA FUERA DEL MODO ADMIN');
            console.log('� ACTUALIZANDO CACHÉ CON DATOS FRESCOS DEL JSON...');
            console.log('📦 Productos en caché antes de la actualización:', JSON.parse(localStorage.getItem('productos')).length);
            
            // Cargar datos frescos del JSON y actualizar localStorage
            try {
                const response = await fetch('data/productos.json');
                if (response.ok) {
                    const data = await response.json();
                    const productosActualizados = Array.isArray(data) ? data : (data.productos || []);
                    localStorage.setItem('productos', JSON.stringify(productosActualizados));
                    console.log('✅ CACHÉ ACTUALIZADA CON DATOS FRESCOS DEL JSON');
                    console.log('� Productos después de la actualización:', productosActualizados.length);
                } else {
                    console.log('⚠️ Error cargando JSON, manteniendo caché actual');
                }
            } catch (error) {
                console.log('❌ Error actualizando desde JSON:', error);
                console.log('🔄 Limpiando caché para forzar recarga completa');
                localStorage.removeItem('productos');
                localStorage.removeItem('lastLoadTime');
            }
        } else {
            // Si está en modo admin, mostrar modal para elegir
            console.log('⚙️ Página recargada en modo admin - Mostrando opciones de caché');
            setTimeout(() => {
                showCacheManagementModal();
            }, 1000); // Esperar un segundo para que cargue la interfaz
        }
    } else if (!localStorage.getItem('productos')) {
        console.log('📝 No hay caché de productos - Cargando desde JSON');
    } else {
        console.log('🔄 Primera carga de página - No se detectó recarga');
    }
    
    // Inicializar gestión de caché
    initCacheManagement();
    
    // Ocultar loader después de 2 segundos
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 2000);
    
    // Asegurar que el panel de filtros esté oculto al inicializar
    if (filterPanel) {
        filterPanel.classList.remove('active');
    }
    if (filterOverlay) {
        filterOverlay.classList.remove('active');
    }
    
    // Asegurar que el scroll del body esté habilitado
    document.body.style.overflow = '';
    
    // Inicializar filtros de subcategorías (ocultos por defecto)
    const subcategoryFiltersContainer = document.getElementById('subcategory-filters');
    if (subcategoryFiltersContainer) {
        subcategoryFiltersContainer.style.display = 'none';
    }
    
    // Cargar productos desde el JSON
    loadProductsFromJSON().then(() => {
        renderProductos();
        actualizarCarrito();
        
        // Inicializar sistema de filtros moderno
        initModernFilters();
        
        // Animaciones de scroll
        observeElements();
        
        // Inicializar transiciones de scroll
        initScrollTransitions();
        addHeaderTransition();
        
        // Inicializar funcionalidades admin si está activo
        if (isAdminMode) {
            initAdminMode();
        }
        
        // Inicializar modal de selección
        initModalSeleccion();
        
        // Mostrar estado final del localStorage
        console.log('📊 ESTADO FINAL DEL SISTEMA:');
        console.log('   - Modo admin:', isAdminMode ? 'ACTIVADO' : 'DESACTIVADO');
        console.log('   - Productos cargados:', productos.length);
        console.log('   - Caché en localStorage:', localStorage.getItem('productos') ? 'SÍ' : 'NO');
        console.log('==========================================');
    });
}

// Inicializar modal de selección
function initModalSeleccion() {
    console.log('🔧 Inicializando modal de selección...');
    
    const selectionModal = document.getElementById('selectionModal');
    if (selectionModal) {
        // Cerrar modal al hacer clic fuera
        selectionModal.addEventListener('click', function(e) {
            if (e.target === this) {
                cerrarModalSeleccion();
            }
        });
        console.log('✅ Modal de selección inicializado correctamente');
    } else {
        console.error('❌ No se encontró el modal de selección en el DOM');
    }
}

// Inicializar sistema de filtros moderno
function initModernFilters() {
    // Si está en modo admin, ocultar el sistema de filtros
    if (isAdminMode) {
        const filterToggle = document.getElementById('filter-toggle');
        const modernFilters = document.querySelector('.modern-filters');
        
        if (filterToggle) {
            filterToggle.style.display = 'none';
        }
        if (modernFilters) {
            modernFilters.style.display = 'none';
        }
        
        console.log('🔧 Sistema de filtros deshabilitado en modo admin');
        return; // Salir temprano si está en modo admin
    }
    
    // Asegurar que el panel de filtros esté oculto por defecto
    if (filterPanel) {
        filterPanel.classList.remove('active');
    }
    if (filterOverlay) {
        filterOverlay.classList.remove('active');
    }
    
    updateProductCounts();
    
    // Configurar precio máximo del slider
    if (productos.length > 0 && priceRange) {
        const maxPrice = Math.max(...productos.map(p => p.precio));
        priceRange.max = maxPrice;
        priceRange.value = maxPrice;
        filtros.precioMax = Infinity; // Mantener Infinity para mostrar todos por defecto
    }
    
    // Ocultar subcategorías inicialmente
    ocultarSubcategorias();
    
    // Renderizar productos iniciales
    renderProductos();
}

// Cargar productos desde el archivo JSON
async function loadProductsFromJSON() {
    try {
        console.log('📦 CARGANDO PRODUCTOS...');
        
        // Limpiar localStorage corrupto (temporal)
        const stored = localStorage.getItem('productos');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (!Array.isArray(parsed)) {
                    console.log('🧹 Limpiando localStorage corrupto...');
                    localStorage.removeItem('productos');
                }
            } catch (e) {
                console.log('🧹 Limpiando localStorage corrupto...');
                localStorage.removeItem('productos');
            }
        }
        
        // Siempre cargar productos base del JSON
        console.log('📄 Cargando productos desde data/productos.json...');
        const response = await fetch('data/productos.json');
        let productosBase = [];
        
        if (response.ok) {
            const data = await response.json();
            // Verificar si el JSON tiene estructura con metadata o es array directo
            productosBase = Array.isArray(data) ? data : (data.productos || []);
            console.log('✅ JSON cargado exitosamente:', productosBase.length, 'productos');
        } else {
            // Fallback a productos por defecto si no se puede cargar el JSON
            console.log('❌ Error cargando JSON, usando productos por defecto');
            productosBase = getDefaultProducts();
        }
        
        // Cargar productos desde localStorage (incluyendo editados y nuevos)
        const productosGuardados = localStorage.getItem('productos');
        if (productosGuardados) {
            // Si hay productos en localStorage, usarlos (incluye editados)
            console.log('💾 Usando productos desde localStorage (incluye modificaciones)');
            productos = JSON.parse(productosGuardados);
        } else {
            // Si no hay productos guardados, usar los productos base
            console.log('🆕 Usando productos base del JSON');
            productos = productosBase;
            // Guardar productos base en localStorage para futuras ediciones
            localStorage.setItem('productos', JSON.stringify(productosBase));
            console.log('💾 Productos base guardados en localStorage');
        }
        
        console.log(`✅ PRODUCTOS CARGADOS: ${productos.length} productos disponibles`);
        
    } catch (error) {
        console.error('❌ ERROR CARGANDO PRODUCTOS:', error);
        // Fallback a productos por defecto
        productos = getDefaultProducts();
        localStorage.setItem('productos', JSON.stringify(productos));
        console.log('🔄 Usando productos por defecto como fallback');
    }
}

// Función auxiliar para validar imágenes
function getValidImageSrc(imagenUrl) {
    // Si no hay imagen, usar placeholder local
    if (!imagenUrl || imagenUrl.trim() === '') {
        return 'images/placeholder-product.jpg';
    }
    
    // Si es una URL externa (http/https), mantenerla (para productos existentes)
    if (imagenUrl.startsWith('http://') || imagenUrl.startsWith('https://')) {
        return imagenUrl;
    }
    
    // Si es una ruta local que no empieza con images/, agregarla
    if (!imagenUrl.startsWith('images/')) {
        return 'images/' + imagenUrl;
    }
    
    // Si ya empieza con images/, mantenerla
    return imagenUrl;
}

// Productos por defecto como fallback
function getDefaultProducts() {
    return [
        {
            id: 1,
            nombre: "Blazer Elegante",
            descripcion: "Blazer de corte moderno perfecto para ocasiones formales",
            precio: 129.99,
            precioOriginal: 159.99,
            imagen: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            categoria: "mujer",
            subcategoria: "blusas",
            nuevo: true,
            tallas: ["XS", "S", "M", "L", "XL"],
            colores: ["Negro", "Azul marino", "Gris"]
        },
        {
            id: 2,
            nombre: "Camisa Premium",
            descripcion: "Camisa de algodón egipcio de alta calidad",
            precio: 89.99,
            imagen: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            categoria: "hombre",
            subcategoria: null,
            nuevo: false,
            tallas: ["S", "M", "L", "XL", "XXL"],
            colores: ["Blanco", "Azul claro", "Rosa"]
        },
        {
            id: 3,
            nombre: "Vestido de Noche",
            descripcion: "Elegante vestido para ocasiones especiales",
            precio: 199.99,
            precioOriginal: 249.99,
            imagen: "https://images.unsplash.com/photo-1566479179817-c0b8a6b2e4ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            categoria: "mujer",
            subcategoria: "vestido",
            nuevo: true,
            tallas: ["XS", "S", "M", "L"],
            colores: ["Negro", "Rojo", "Azul medianoche"]
        }
    ];
}

// Funciones principales
function renderProductos() {
    if (!productsGrid) {
        console.error('❌ No se encontró productsGrid');
        return;
    }
    
    if (productos.length === 0) {
        productsGrid.innerHTML = '<p class="no-productos">No hay productos disponibles</p>';
        updateResultsCount(0);
        return;
    }
    
    let productosFiltrados;
    
    // En modo admin, mostrar todos los productos sin filtros
    if (isAdminMode) {
        productosFiltrados = [...productos];
        updateResultsCount(productosFiltrados.length);
    } else {
        // Aplicar filtros solo en modo normal
        productosFiltrados = productos.filter(producto => {
            // Filtro de categoría
            const categoriaCoincide = filtros.categoria === 'all' || producto.categoria === filtros.categoria;
            
            // Filtro de subcategoría
            const subcategoriaCoincide = !filtros.subcategoria || producto.subcategoria === filtros.subcategoria;
            
            // Filtro de búsqueda
            const busquedaCoincide = !filtros.busqueda || 
                producto.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
                producto.descripcion.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
                producto.categoria.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
                (producto.subcategoria && producto.subcategoria.toLowerCase().includes(filtros.busqueda.toLowerCase()));
            
            // Filtro de precio
            const precioCoincide = producto.precio >= filtros.precioMin && producto.precio <= filtros.precioMax;
            
            return categoriaCoincide && subcategoriaCoincide && busquedaCoincide && precioCoincide;
        });
        
        // Aplicar ordenamiento solo en modo normal
        productosFiltrados = aplicarOrdenamiento(productosFiltrados);
        updateResultsCount(productosFiltrados.length);
    }
    
    // Mostrar productos (con paginación)
    const productosAMostrar = productosFiltrados.slice(0, productosVisible);
    
    if (productosAMostrar.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>No se encontraron productos</h3>
                <p>Intenta ajustar los filtros o buscar algo diferente</p>
                <button onclick="limpiarFiltros()" class="btn-clear-filters">Limpiar filtros</button>
            </div>
        `;
        return;
    }
    
    const productosHTML = productosAMostrar.map(producto => {
        const imagenSrc = getValidImageSrc(producto.imagen);
        
        // Botones de administración solo si está en modo admin
        const adminButtons = isAdminMode ? `
            <div class="admin-product-actions">
                <button class="edit-product-btn" onclick="event.stopPropagation(); editarProducto(${producto.id})" title="Editar producto">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-product-btn" onclick="event.stopPropagation(); eliminarProducto(${producto.id})" title="Eliminar producto">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        ` : '';
        
        return `
        <div class="product-card" data-id="${producto.id}" onclick="abrirProductModal(${producto.id})">
            ${adminButtons}
            <div class="product-image">
                <img src="${imagenSrc}" alt="${producto.nombre}" loading="lazy" 
                     onerror="this.src='images/placeholder-product.svg'; this.onerror=null;">
                ${producto.nuevo ? '<span class="product-badge">Nuevo</span>' : ''}
            </div>
            <div class="product-info">
                <h3 class="product-title">${producto.nombre}</h3>
                <p class="product-description">${producto.descripcion}</p>
                <div class="product-price">
                    <span class="price">$${producto.precio}</span>
                    ${producto.precioOriginal ? `<span class="original-price">$${producto.precioOriginal}</span>` : ''}
                </div>
                <button class="add-to-cart" onclick="event.stopPropagation(); abrirModalSeleccion(${producto.id})">
                    Añadir al Carrito
                </button>
            </div>
        </div>
    `}).join('');
    
    productsGrid.innerHTML = productosHTML;
    
    // Mostrar/ocultar botón "Cargar más"
    if (loadMoreBtn) {
        if (productosAMostrar.length < productosFiltrados.length) {
            loadMoreBtn.style.display = 'block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }
    
    // Actualizar filtros activos
    updateActiveFilters();
    
    // Actualizar contador admin si está activo
    updateAdminCounter();
}

// Funciones auxiliares de filtrado
function aplicarOrdenamiento(productos) {
    switch(filtros.ordenamiento) {
        case 'price-low':
            return productos.sort((a, b) => a.precio - b.precio);
        case 'price-high':
            return productos.sort((a, b) => b.precio - a.precio);
        case 'newest':
            return productos.sort((a, b) => b.nuevo - a.nuevo);
        case 'name':
            return productos.sort((a, b) => a.nombre.localeCompare(b.nombre));
        case 'relevance':
        default:
            return productos;
    }
}

function updateResultsCount(count) {
    if (resultsCount) {
        if (isAdminMode) {
            resultsCount.textContent = `Modo Admin - ${count} producto${count !== 1 ? 's' : ''} total${count !== 1 ? 'es' : ''}`;
        } else {
            resultsCount.textContent = `${count} producto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
        }
    }
}

function updateActiveFilters() {
    if (!activeFiltersContainer) return;
    
    // No mostrar filtros activos en modo admin
    if (isAdminMode) {
        activeFiltersContainer.innerHTML = '';
        activeFiltersContainer.style.display = 'none';
        return;
    }
    
    const activeFilters = [];
    
    // Filtro de categoría
    if (filtros.categoria !== 'all') {
        activeFilters.push({
            text: `Categoría: ${filtros.categoria}`,
            action: () => {
                filtros.categoria = 'all';
                document.querySelector('input[name="category"][value="all"]').checked = true;
                ocultarSubcategorias();
                renderProductos();
            }
        });
    }
    
    // Filtro de subcategoría
    if (filtros.subcategoria) {
        activeFilters.push({
            text: `Subcategoría: ${filtros.subcategoria}`,
            action: () => {
                filtros.subcategoria = null;
                renderProductos();
            }
        });
    }
    
    // Filtro de búsqueda
    if (filtros.busqueda) {
        activeFilters.push({
            text: `Búsqueda: "${filtros.busqueda}"`,
            action: () => {
                filtros.busqueda = '';
                if (productSearch) productSearch.value = '';
                renderProductos();
            }
        });
    }
    
    // Filtro de precio
    if (filtros.precioMin > 0 || filtros.precioMax < Infinity) {
        const maxText = filtros.precioMax === Infinity ? '∞' : `$${filtros.precioMax}`;
        activeFilters.push({
            text: `Precio: $${filtros.precioMin} - ${maxText}`,
            action: () => {
                filtros.precioMin = 0;
                filtros.precioMax = Infinity;
                if (minPriceInput) minPriceInput.value = '';
                if (maxPriceInput) maxPriceInput.value = '';
                if (priceRange) priceRange.value = priceRange.max;
                renderProductos();
            }
        });
    }
    
    // Renderizar filtros activos
    if (activeFilters.length === 0) {
        activeFiltersContainer.innerHTML = '';
        activeFiltersContainer.style.display = 'none';
    } else {
        activeFiltersContainer.style.display = 'block';
        activeFiltersContainer.innerHTML = activeFilters.map(filter => `
            <span class="active-filter-tag">
                ${filter.text}
                <button onclick="this.parentElement.click()" class="remove-filter">×</button>
            </span>
        `).join('');
        
        // Agregar event listeners
        const filterElements = activeFiltersContainer.querySelectorAll('.active-filter-tag');
        filterElements.forEach((element, index) => {
            element.addEventListener('click', activeFilters[index].action);
        });
    }
}

// Funciones de manejo de filtros
function toggleFilterPanel() {
    // No permitir abrir filtros en modo admin
    if (isAdminMode) {
        console.log('🔧 Filtros deshabilitados en modo admin');
        return;
    }
    
    if (filterPanel) {
        filterPanel.classList.toggle('active');
    }
    
    if (filterOverlay) {
        filterOverlay.classList.toggle('active');
    }
    
    // Prevenir scroll del body cuando el panel está abierto
    if (filterPanel && filterPanel.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function closeFilterPanel() {
    if (filterPanel) {
        filterPanel.classList.remove('active');
    }
    
    if (filterOverlay) {
        filterOverlay.classList.remove('active');
    }
    
    // Restaurar scroll del body
    document.body.style.overflow = '';
}

function handleCategoryChange(event) {
    filtros.categoria = event.target.value;
    
    if (filtros.categoria === 'all') {
        ocultarSubcategorias();
    } else {
        mostrarSubcategorias(filtros.categoria);
    }
    
    // Limpiar subcategoría al cambiar de categoría
    filtros.subcategoria = null;
    
    renderProductos();
}

function mostrarSubcategorias(categoria) {
    if (!subcategorySection || !subcategoryOptions) return;
    
    const subcategorias = subcategoriasPorCategoria[categoria] || [];
    
    if (subcategorias.length > 0) {
        subcategoryOptions.innerHTML = subcategorias.map(sub => `
            <label class="filter-option">
                <input type="radio" name="subcategory" value="${sub}">
                <span class="filter-radio"></span>
                <span class="filter-text">${sub.charAt(0).toUpperCase() + sub.slice(1).replace('-', ' ')}</span>
                <span class="filter-count" id="count-${sub}">0</span>
            </label>
        `).join('');
        
        // Agregar event listeners a las subcategorías
        const subcategoryInputs = subcategoryOptions.querySelectorAll('input[name="subcategory"]');
        subcategoryInputs.forEach(input => {
            input.addEventListener('change', handleSubcategoryChange);
        });
        
        subcategorySection.style.display = 'block';
        
        // Actualizar contadores después de mostrar las subcategorías
        updateProductCounts();
    } else {
        ocultarSubcategorias();
    }
}

function ocultarSubcategorias() {
    if (subcategorySection) {
        subcategorySection.style.display = 'none';
    }
}

function handleSubcategoryChange(event) {
    filtros.subcategoria = event.target.value;
    renderProductos();
}

function handleProductSearch(event) {
    filtros.busqueda = event.target.value.trim();
    renderProductos();
}

function handlePriceFilter() {
    const minVal = minPriceInput ? parseInt(minPriceInput.value) || 0 : 0;
    const maxVal = maxPriceInput ? parseInt(maxPriceInput.value) || Infinity : Infinity;
    
    filtros.precioMin = minVal;
    filtros.precioMax = maxVal;
    
    // Actualizar slider
    if (priceRange && maxVal !== Infinity) {
        priceRange.value = maxVal;
    }
    
    renderProductos();
}

function handlePriceRange(event) {
    const value = parseInt(event.target.value);
    filtros.precioMax = value;
    
    if (maxPriceInput) {
        maxPriceInput.value = value;
    }
    
    renderProductos();
}

function handleSort(event) {
    filtros.ordenamiento = event.target.value;
    renderProductos();
}

function limpiarFiltros() {
    filtros = {
        categoria: 'all',
        subcategoria: null,
        busqueda: '',
        precioMin: 0,
        precioMax: Infinity,
        ordenamiento: 'relevance'
    };
    
    // Resetear elementos del DOM
    if (productSearch) productSearch.value = '';
    if (minPriceInput) minPriceInput.value = '';
    if (maxPriceInput) maxPriceInput.value = '';
    if (priceRange) priceRange.value = priceRange.max;
    if (sortSelect) sortSelect.value = 'relevance';
    
    // Resetear radio buttons
    const allCategoryRadio = document.querySelector('input[name="category"][value="all"]');
    if (allCategoryRadio) allCategoryRadio.checked = true;
    
    ocultarSubcategorias();
    renderProductos();
}

function aplicarFiltros() {
    closeFilterPanel();
    renderProductos();
}

function toggleView(event) {
    const clickedBtn = event.target.closest('.view-btn');
    const view = clickedBtn.dataset.view;
    
    // Actualizar botones activos
    viewBtns.forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active');
    
    // Aplicar clase de vista al grid
    if (productsGrid) {
        productsGrid.className = view === 'list' ? 'products-grid list-view' : 'products-grid';
    }
}

function cargarMasProductos() {
    productosVisible += 3;
    renderProductos();
}

function agregarAlCarrito(id, tallaSeleccionada = null, colorSeleccionado = null, cantidad = 1) {
    const producto = productos.find(p => p.id === id);
    
    // Crear una clave única para el item basada en id, talla y color
    const claveItem = `${id}-${tallaSeleccionada || 'sin-talla'}-${colorSeleccionado || 'sin-color'}`;
    
    // Buscar si ya existe este item específico (misma combinación)
    const itemExistente = carrito.find(item => 
        item.id === id && 
        item.tallaSeleccionada === tallaSeleccionada && 
        item.colorSeleccionado === colorSeleccionado
    );
    
    if (itemExistente) {
        itemExistente.cantidad += cantidad;
    } else {
        carrito.push({
            ...producto,
            cantidad: cantidad,
            tallaSeleccionada: tallaSeleccionada,
            colorSeleccionado: colorSeleccionado,
            claveItem: claveItem
        });
    }
    
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarCarrito();
    mostrarNotificacion('Producto añadido al carrito');
}

// Variables globales para el modal de selección
let productoSeleccionado = null;
let tallaSeleccionada = null;
let colorSeleccionado = null;

function abrirModalSeleccion(id) {
    console.log('🔍 Intentando abrir modal de selección para producto ID:', id);
    
    const producto = productos.find(p => p.id === id);
    if (!producto) {
        console.error('❌ No se encontró el producto con ID:', id);
        return;
    }
    
    console.log('✅ Producto encontrado:', producto.nombre);
    
    productoSeleccionado = producto;
    tallaSeleccionada = null;
    colorSeleccionado = null;
    
    // Verificar que todos los elementos del modal existen
    const elementos = {
        modal: document.getElementById('selectionModal'),
        modalProductName: document.getElementById('modalProductName'),
        modalProductImage: document.getElementById('modalProductImage'),
        modalProductTitle: document.getElementById('modalProductTitle'),
        modalProductPrice: document.getElementById('modalProductPrice'),
        modalQuantity: document.getElementById('modalQuantity'),
        tallaGroup: document.getElementById('tallaGroup'),
        tallaOptions: document.getElementById('tallaOptions'),
        colorGroup: document.getElementById('colorGroup'),
        colorOptions: document.getElementById('colorOptions')
    };
    
    console.log('🔍 Verificando elementos del modal...');
    for (const [nombre, elemento] of Object.entries(elementos)) {
        if (!elemento) {
            console.error(`❌ No se encontró el elemento: ${nombre}`);
            return;
        }
    }
    console.log('✅ Todos los elementos del modal encontrados');
    
    // Llenar información del producto
    elementos.modalProductName.textContent = `Seleccionar opciones - ${producto.nombre}`;
    elementos.modalProductImage.src = getValidImageSrc(producto.imagen);
    elementos.modalProductTitle.textContent = producto.nombre;
    elementos.modalProductPrice.textContent = `$${producto.precio}`;
    elementos.modalQuantity.value = 1;
    
    // Configurar opciones de talla
    if (producto.tallas && producto.tallas.length > 0) {
        elementos.tallaGroup.style.display = 'block';
        elementos.tallaOptions.innerHTML = producto.tallas.map(talla => 
            `<button type="button" class="option-btn" onclick="seleccionarTalla('${talla}')">${talla}</button>`
        ).join('');
        console.log('✅ Tallas configuradas:', producto.tallas);
    } else {
        elementos.tallaGroup.style.display = 'none';
        console.log('ℹ️ Producto sin tallas disponibles');
    }
    
    // Configurar opciones de color
    if (producto.colores && producto.colores.length > 0) {
        elementos.colorGroup.style.display = 'block';
        elementos.colorOptions.innerHTML = producto.colores.map(color => 
            `<button type="button" class="option-btn" onclick="seleccionarColor('${color}')">${color}</button>`
        ).join('');
        console.log('✅ Colores configurados:', producto.colores);
    } else {
        elementos.colorGroup.style.display = 'none';
        console.log('ℹ️ Producto sin colores disponibles');
    }
    
    // Mostrar modal
    elementos.modal.style.display = 'flex';
    console.log('✅ Modal mostrado');
    
    // Validar botón de agregar
    validarSeleccion();
}

function seleccionarTalla(talla) {
    console.log('👕 Seleccionando talla:', talla);
    tallaSeleccionada = talla;
    
    // Actualizar estados visuales
    document.querySelectorAll('#tallaOptions .option-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent === talla) {
            btn.classList.add('selected');
        }
    });
    
    validarSeleccion();
}

function seleccionarColor(color) {
    console.log('🎨 Seleccionando color:', color);
    colorSeleccionado = color;
    
    // Actualizar estados visuales
    document.querySelectorAll('#colorOptions .option-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent === color) {
            btn.classList.add('selected');
        }
    });
    
    validarSeleccion();
}

function cambiarCantidad(cambio) {
    const input = document.getElementById('modalQuantity');
    const valorActual = parseInt(input.value) || 1;
    const nuevoValor = Math.max(1, Math.min(10, valorActual + cambio));
    input.value = nuevoValor;
}

function validarSeleccion() {
    console.log('🔍 Validando selección...');
    const btnConfirmar = document.getElementById('btnConfirmarAgregar');
    
    if (!productoSeleccionado) {
        console.log('❌ No hay producto seleccionado');
        btnConfirmar.disabled = true;
        btnConfirmar.classList.remove('ready');
        return;
    }
    
    // Verificar si se requieren tallas y colores
    const requiereTalla = productoSeleccionado.tallas && productoSeleccionado.tallas.length > 0;
    const requiereColor = productoSeleccionado.colores && productoSeleccionado.colores.length > 0;
    
    const tallaValida = !requiereTalla || tallaSeleccionada;
    const colorValido = !requiereColor || colorSeleccionado;
    
    const seleccionCompleta = tallaValida && colorValido;
    
    console.log('🔍 Estado de validación:');
    console.log('   - Requiere talla:', requiereTalla, '| Talla seleccionada:', tallaSeleccionada);
    console.log('   - Requiere color:', requiereColor, '| Color seleccionado:', colorSeleccionado);
    console.log('   - Validación exitosa:', seleccionCompleta);
    
    btnConfirmar.disabled = !seleccionCompleta;
    
    // Agregar animación cuando esté listo
    if (seleccionCompleta) {
        btnConfirmar.classList.add('ready');
        console.log('✅ Botón listo para usar!');
    } else {
        btnConfirmar.classList.remove('ready');
    }
}

function confirmarAgregarAlCarrito() {
    console.log('✅ Confirmando agregar al carrito...');
    if (!productoSeleccionado) {
        console.error('❌ No hay producto seleccionado');
        return;
    }
    
    const cantidad = parseInt(document.getElementById('modalQuantity').value) || 1;
    console.log('📦 Agregando:', productoSeleccionado.nombre, 'Cantidad:', cantidad, 'Talla:', tallaSeleccionada, 'Color:', colorSeleccionado);
    
    agregarAlCarrito(
        productoSeleccionado.id, 
        tallaSeleccionada, 
        colorSeleccionado, 
        cantidad
    );
    
    cerrarModalSeleccion();
}

function cerrarModalSeleccion() {
    console.log('❌ Cerrando modal de selección');
    document.getElementById('selectionModal').style.display = 'none';
    productoSeleccionado = null;
    tallaSeleccionada = null;
    colorSeleccionado = null;
}

function eliminarDelCarrito(id, tallaSeleccionada = null, colorSeleccionado = null) {
    carrito = carrito.filter(item => !(
        item.id === id && 
        item.tallaSeleccionada === tallaSeleccionada && 
        item.colorSeleccionado === colorSeleccionado
    ));
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarCarrito();
    renderCarrito();
}

function eliminarDelCarritoEspecifico(index) {
    carrito.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarCarrito();
    renderCarrito();
}

function cambiarCantidadCarrito(index, nuevaCantidad) {
    if (nuevaCantidad <= 0) {
        eliminarDelCarritoEspecifico(index);
        return;
    }
    
    carrito[index].cantidad = nuevaCantidad;
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarCarrito();
    renderCarrito();
}

function cambiarCantidad(id, nuevaCantidad) {
    if (nuevaCantidad <= 0) {
        eliminarDelCarrito(id);
        return;
    }
    
    const item = carrito.find(item => item.id === id);
    if (item) {
        item.cantidad = nuevaCantidad;
        localStorage.setItem('carrito', JSON.stringify(carrito));
        actualizarCarrito();
        renderCarrito();
    }
}

function actualizarCarrito() {
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
}

function renderCarrito() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (carrito.length === 0) {
        cartItems.innerHTML = '<p>Tu carrito está vacío</p>';
        cartTotal.textContent = '$0.00';
        return;
    }
    
    cartItems.innerHTML = carrito.map((item, index) => `
        <div class="cart-item">
            <img src="${item.imagen}" alt="${item.nombre}">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.nombre}</div>
                ${item.tallaSeleccionada || item.colorSeleccionado ? `
                    <div class="cart-item-details">
                        ${item.tallaSeleccionada ? `<span class="detail-tag">Talla: ${item.tallaSeleccionada}</span>` : ''}
                        ${item.colorSeleccionado ? `<span class="detail-tag">Color: ${item.colorSeleccionado}</span>` : ''}
                    </div>
                ` : ''}
                <div class="cart-item-price">$${item.precio}</div>
                <div class="cart-item-controls">
                    <button onclick="cambiarCantidadCarrito(${index}, ${item.cantidad - 1})">-</button>
                    <span>${item.cantidad}</span>
                    <button onclick="cambiarCantidadCarrito(${index}, ${item.cantidad + 1})">+</button>
                    <button onclick="eliminarDelCarritoEspecifico(${index})" style="margin-left: 10px; color: red;">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
    
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;
    
    // Agregar evento al botón de WhatsApp si existe
    const whatsappBtn = document.querySelector('.whatsapp-checkout');
    if (whatsappBtn) {
        whatsappBtn.onclick = () => enviarPedidoPorWhatsApp();
    }
}

function enviarPedidoPorWhatsApp() {
    if (carrito.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    let mensaje = '¡Hola! Me interesa realizar este pedido de MVA:\n\n';
    
    carrito.forEach((item, index) => {
        mensaje += `${index + 1}. ${item.nombre}\n`;
        mensaje += `   💰 Precio: $${item.precio}\n`;
        mensaje += `   📦 Cantidad: ${item.cantidad}\n`;
        if (item.tallaSeleccionada) mensaje += `   👕 Talla: ${item.tallaSeleccionada}\n`;
        if (item.colorSeleccionado) mensaje += `   🎨 Color: ${item.colorSeleccionado}\n`;
        mensaje += '\n';
    });
    
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    mensaje += `💵 *Total: $${total.toFixed(2)}*\n\n`;
    mensaje += '¿Podrías confirmarme la disponibilidad y coordinar el pago y envío?\n\n';
    mensaje += '¡Gracias! 😊';
    
    const numeroWhatsApp = '+593985608961';
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    
    window.open(urlWhatsApp, '_blank');
}

function toggleCart() {
    cartModal.style.display = cartModal.style.display === 'block' ? 'none' : 'block';
    if (cartModal.style.display === 'block') {
        renderCarrito();
    }
}

function abrirProductModal(id) {
    const producto = productos.find(p => p.id === id);
    const modalBody = document.querySelector('.product-modal-body');
    
    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 2rem;">
            <div>
                <img src="${producto.imagen}" alt="${producto.nombre}" style="width: 100%; border-radius: 10px;">
            </div>
            <div>
                <h2 style="font-family: var(--font-primary); margin-bottom: 1rem;">${producto.nombre}</h2>
                <p style="color: var(--text-light); margin-bottom: 1rem;">${producto.descripcion}</p>
                
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                        <span style="background: var(--primary-color); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; text-transform: capitalize;">
                            ${producto.categoria}
                        </span>
                        ${producto.subcategoria ? `
                            <span style="background: var(--accent-color); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; text-transform: capitalize;">
                                ${producto.subcategoria}
                            </span>
                        ` : ''}
                    </div>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <span style="font-size: 1.5rem; font-weight: 700; color: var(--accent-color);">$${producto.precio}</span>
                    ${producto.precioOriginal ? `<span style="text-decoration: line-through; color: var(--text-light); margin-left: 1rem;">$${producto.precioOriginal}</span>` : ''}
                </div>
                
                ${producto.tallas ? `
                    <div style="margin-bottom: 1rem;">
                        <h4>Tallas disponibles:</h4>
                        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                            ${producto.tallas.map(talla => `<span style="padding: 0.25rem 0.5rem; border: 1px solid var(--gray); border-radius: 4px;">${talla}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div style="margin-bottom: 2rem;">
                    <h4>Colores disponibles:</h4>
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                        ${producto.colores.map(color => `<span style="padding: 0.25rem 0.5rem; border: 1px solid var(--gray); border-radius: 4px;">${color}</span>`).join('')}
                    </div>
                </div>
                
                <button onclick="agregarAlCarrito(${producto.id}); closeProductModal();" style="width: 100%; padding: 15px; background: var(--primary-color); color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">
                    Añadir al Carrito
                </button>
            </div>
        </div>
    `;
    
    productModal.style.display = 'block';
    
    // Asegurar que el modal se cierre al hacer clic fuera
    productModal.onclick = function(event) {
        if (event.target === productModal) {
            closeProductModal();
        }
    };
}

function closeProductModal() {
    productModal.style.display = 'none';
}

function toggleSearch() {
    searchInput.classList.toggle('active');
    if (searchInput.classList.contains('active')) {
        searchInput.focus();
    }
}

function handleSearch(e) {
    const termino = e.target.value.toLowerCase();
    const productosFiltrados = productos.filter(producto => 
        producto.nombre.toLowerCase().includes(termino) ||
        producto.descripcion.toLowerCase().includes(termino)
    );
    
    if (termino === '') {
        renderProductos();
        return;
    }
    
    productsGrid.innerHTML = productosFiltrados.map(producto => {
        // Botones de administración solo si está en modo admin
        const adminButtons = isAdminMode ? `
            <div class="admin-product-actions">
                <button class="edit-product-btn" onclick="event.stopPropagation(); editarProducto(${producto.id})" title="Editar producto">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-product-btn" onclick="event.stopPropagation(); eliminarProducto(${producto.id})" title="Eliminar producto">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        ` : '';
        
        return `
        <div class="product-card" data-id="${producto.id}" onclick="abrirProductModal(${producto.id})">
            ${adminButtons}
            <div class="product-image">
                <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy">
                ${producto.nuevo ? '<span class="product-badge">Nuevo</span>' : ''}
            </div>
            <div class="product-info">
                <h3 class="product-title">${producto.nombre}</h3>
                <p class="product-description">${producto.descripcion}</p>
                <div class="product-price">
                    <span class="price">€${producto.precio}</span>
                    ${producto.precioOriginal ? `<span class="original-price">€${producto.precioOriginal}</span>` : ''}
                </div>
                <button class="add-to-cart" onclick="event.stopPropagation(); agregarAlCarrito(${producto.id})">
                    Añadir al Carrito
                </button>
            </div>
        </div>
    `}).join('');
    
    loadMoreBtn.style.display = 'none';
}

function toggleMobileMenu() {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
}

function scrollToProducts() {
    const productsSection = document.getElementById('products');
    const headerHeight = 80;
    const targetPosition = productsSection.offsetTop - headerHeight;
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

function handleScroll() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = 'none';
    }
}

function handleNewsletter(e) {
    e.preventDefault();
    const email = e.target.querySelector('input').value;
        mostrarNotificacion('¡Gracias por suscribirte a nuestro newsletter!');
}

function mostrarNotificacion(mensaje) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${mensaje}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Modern Filter System Functions
function handleKeyDown(e) {
    if (e.key === 'Escape' && filterPanel && filterPanel.classList.contains('active')) {
        closeFilterPanel();
    }
}

function handleProductSearch() {
    const searchTerm = productSearch.value.toLowerCase();
    filtroActivo = 'search';
    filtros.busqueda = searchTerm;
    renderProductos();
    updateResultsCount();
}

function handleCategoryChange(e) {
    const selectedCategory = e.target.value;
    filtroActivo = selectedCategory;
    
    // Update subcategories
    updateSubcategoryOptions(selectedCategory);
    renderProductos();
    updateResultsCount();
    updateActiveFilters();
}

function updateSubcategoryOptions(category) {
    subcategoryOptions.innerHTML = '';
    
    if (category === 'mujer') {
        subcategorySection.style.display = 'block';
        const subcategories = ['body', 'vestido', 'traje-bano', 'tops', 'faldas', 'conjuntos', 'blusas'];
        const labels = ['Body', 'Vestido', 'Traje de baño', 'Tops', 'Faldas', 'Conjuntos y enterizos', 'Blusas'];
        
        subcategories.forEach((sub, index) => {
            const option = document.createElement('label');
            option.className = 'filter-option';
            option.innerHTML = `
                <input type="radio" name="subcategory" value="${sub}">
                <span class="filter-radio"></span>
                <span class="filter-text">${labels[index]}</span>
                <span class="filter-count" id="count-${sub}">0</span>
            `;
            subcategoryOptions.appendChild(option);
        });
        
        // Add event listeners to new subcategory options
        const subcategoryInputs = subcategoryOptions.querySelectorAll('input[name="subcategory"]');
        subcategoryInputs.forEach(input => {
            input.addEventListener('change', handleSubcategoryChange);
        });
    } else {
        subcategorySection.style.display = 'none';
    }
}

function handleSubcategoryChange(e) {
    filtros.subcategoria = e.target.value;
    renderProductos();
    updateResultsCount();
    updateActiveFilters();
}

function handlePriceFilter() {
    const min = parseFloat(minPriceInput.value) || 0;
    const max = parseFloat(maxPriceInput.value) || Infinity;
    
    filtros.precioMin = min;
    filtros.precioMax = max;
    
    if (priceRange) {
        priceRange.value = max === Infinity ? 500 : max;
    }
    
    renderProductos();
}

function handlePriceRange(event) {
    const value = parseInt(event.target.value);
    filtros.precioMax = value;
    
    if (maxPriceInput) {
        maxPriceInput.value = value;
    }
    
    renderProductos();
}

function handleSort(event) {
    filtros.ordenamiento = event.target.value;
    renderProductos();
}

function clearAllFilters() {
    // Reset all filters
    filtroActivo = 'all';
    filtros.subcategoria = null;
    filtros.busqueda = '';
    filtros.precioMin = 0;
    filtros.precioMax = Infinity;
    filtros.ordenamiento = 'relevance';
    
    // Reset UI
    const allCategoryRadio = document.querySelector('input[value="all"]');
    if (allCategoryRadio) allCategoryRadio.checked = true;
    if (productSearch) productSearch.value = '';
    if (minPriceInput) minPriceInput.value = '';
    if (maxPriceInput) maxPriceInput.value = '';
    if (priceRange) priceRange.value = 500;
    if (sortSelect) sortSelect.value = 'relevance';
    if (subcategorySection) subcategorySection.style.display = 'none';
    
    renderProductos();
}

function applyFilters() {
    renderProductos();
    updateResultsCount();
    updateActiveFilters();
    closeFilterPanel();
}

function toggleView(e) {
    viewBtns.forEach(btn => btn.classList.remove('active'));
    e.target.closest('.view-btn').classList.add('active');
    
    const view = e.target.closest('.view-btn').dataset.view;
    productsGrid.className = view === 'list' ? 'products-list' : 'products-grid';
}

function updateActiveFilters() {
    activeFiltersContainer.innerHTML = '';
    
    if (filtroActivo !== 'all') {
        addActiveFilter('Categoría', filtroActivo.charAt(0).toUpperCase() + filtroActivo.slice(1));
    }
    
    if (filtros.subcategoria) {
        addActiveFilter('Subcategoría', filtros.subcategoria.charAt(0).toUpperCase() + filtros.subcategoria.slice(1));
    }
    
    if (filtros.busqueda) {
        addActiveFilter('Búsqueda', filtros.busqueda);
    }
    
    if (filtros.precioMin > 0 || filtros.precioMax < Infinity) {
        const priceText = `€${filtros.precioMin} - €${filtros.precioMax === Infinity ? '∞' : filtros.precioMax}`;
        addActiveFilter('Precio', priceText);
    }
}

function addActiveFilter(type, value) {
    const filterTag = document.createElement('div');
    filterTag.className = 'active-filter-tag';
    filterTag.innerHTML = `
        <span>${type}: ${value}</span>
        <button onclick="removeActiveFilter('${type.toLowerCase()}')">&times;</button>
    `;
    activeFiltersContainer.appendChild(filterTag);
}

function removeActiveFilter(type) {
    switch(type) {
        case 'categoría':
            filtroActivo = 'all';
            document.querySelector('input[value="all"]').checked = true;
            break;
        case 'subcategoría':
            filtros.subcategoria = null;
            break;
        case 'búsqueda':
            filtros.busqueda = '';
            productSearch.value = '';
            break;
        case 'precio':
            filtros.precioMin = 0;
            filtros.precioMax = Infinity;
            if (minPriceInput) minPriceInput.value = '';
            if (maxPriceInput) maxPriceInput.value = '';
            if (priceRange) priceRange.value = 500;
            break;
    }
    
    renderProductos();
    updateResultsCount();
    updateActiveFilters();
    updateProductCounts();
}

function updateProductCounts() {
    // Update category counts
    const categories = ['all', 'mujer', 'hombre', 'accesorios'];
    categories.forEach(cat => {
        const count = cat === 'all' ? productos.length : productos.filter(p => p.categoria === cat).length;
        const countElement = document.getElementById(`count-${cat}`);
        if (countElement) countElement.textContent = count;
    });
    
    // Update subcategory counts - Always update, not just when visible
    const subcategories = ['body', 'vestido', 'traje-bano', 'tops', 'faldas', 'conjuntos', 'blusas'];
    subcategories.forEach(sub => {
        const count = productos.filter(p => p.subcategoria === sub).length;
        const countElement = document.getElementById(`count-${sub}`);
        if (countElement) {
            countElement.textContent = count;
        }
    });
}

function mostrarNotificacion(mensaje) {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--accent-color);
        color: white;
        padding: 1rem 2rem;
        border-radius: 4px;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        box-shadow: var(--shadow);
    `;
    notificacion.textContent = mensaje;
    
    document.body.appendChild(notificacion);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        notificacion.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            document.body.removeChild(notificacion);
        }, 300);
    }, 3000);
}

function animateProducts() {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function observeElements() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observar elementos para animaciones
    const elementsToObserve = document.querySelectorAll('.category-card, .about-content, .newsletter-content');
    elementsToObserve.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// Agregar estilos adicionales para animaciones y responsive
const additionalStyles = `
    @keyframes slideOutRight {
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .nav-menu.active {
        display: flex;
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background: white;
        flex-direction: column;
        padding: 1rem;
        box-shadow: var(--shadow);
    }
    
    .hamburger.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .hamburger.active span:nth-child(2) {
        opacity: 0;
    }
    
    .hamburger.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }
    
    .cart-item-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }
    
    .cart-item-controls button {
        padding: 0.25rem 0.5rem;
        border: 1px solid var(--gray);
        background: white;
        cursor: pointer;
        border-radius: 4px;
    }
    
    @media (max-width: 768px) {
        .product-modal-body > div {
            grid-template-columns: 1fr !important;
        }
        
        .cart-content {
            width: 100% !important;
        }
    }
`;

// Agregar estilos al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Funciones para filtros avanzados
function updateSubcategoryFilters(categoria) {
    const subcategoryFiltersContainer = document.getElementById('subcategory-filters');
    const subcategoryGroups = document.querySelectorAll('.subcategory-filter-group');
    
    // Ocultar todas las subcategorías por defecto
    subcategoryGroups.forEach(group => {
        group.classList.remove('active');
    });
    
    if (categoria === 'mujer') {
        // Mostrar el contenedor de subcategorías con animación
        subcategoryFiltersContainer.style.display = 'flex';
        setTimeout(() => {
            subcategoryFiltersContainer.classList.add('show');
        }, 10);
        
        const mujerGroup = document.querySelector('[data-category="mujer"]');
        if (mujerGroup) {
            mujerGroup.classList.add('active');
        }
    } else {
        // Ocultar el contenedor de subcategorías con animación
        subcategoryFiltersContainer.classList.remove('show');
        setTimeout(() => {
            subcategoryFiltersContainer.style.display = 'none';
        }, 300);
    }
}

function updateFilterInfo() {
    let infoText = 'Mostrando todos los productos';
    
    if (filtroActivo !== 'all') {
        if (['body', 'vestido', 'traje-bano', 'tops', 'faldas', 'conjuntos', 'blusas'].includes(filtroActivo)) {
            const subcategoryNames = {
                'body': 'Body',
                'vestido': 'Vestidos',
                'traje-bano': 'Trajes de baño',
                'tops': 'Tops',
                'faldas': 'Faldas',
                'conjuntos': 'Conjuntos y enterizos',
                'blusas': 'Blusas'
            };
            infoText = `Mostrando productos de: ${subcategoryNames[filtroActivo]}`;
        } else {
            const categoryNames = {
                'mujer': 'Mujer',
                'hombre': 'Hombre',
                'accesorios': 'Accesorios'
            };
            infoText = `Mostrando productos de: ${categoryNames[filtroActivo] || filtroActivo}`;
        }
    }
    
    filterInfo.textContent = infoText;
}

// Admin Mode Functions
function checkAdminMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const adminParam = urlParams.get('admin');
    
    if (adminParam === 'mva2025') {
        isAdminMode = true;
        console.log('🔧 MODO ADMIN ACTIVADO');
        console.log('⚙️ URL contiene parámetro admin válido');
        document.body.classList.add('admin-mode');
    } else {
        isAdminMode = false;
        console.log('👤 MODO USUARIO NORMAL');
        if (adminParam) {
            console.log('❌ Parámetro admin inválido:', adminParam);
        } else {
            console.log('📄 No se detectó parámetro admin en la URL');
        }
    }
}

function initAdminMode() {
    // Mostrar controles de admin
    const adminControls = document.getElementById('admin-controls');
    if (adminControls) {
        adminControls.style.display = 'flex';
        // Actualizar contador inicial
        setTimeout(updateAdminCounter, 100);
    }
    
    // Event listeners para botones de admin
    const addProductBtn = document.getElementById('add-product-btn');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const adminModal = document.getElementById('admin-product-modal');
    const closeAdminModal = document.getElementById('close-admin-modal');
    const cancelAdminForm = document.getElementById('cancel-admin-form');
    const adminForm = document.getElementById('admin-product-form');
    
    if (addProductBtn) {
        addProductBtn.addEventListener('click', openAdminModal);
    }
    
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', exportToJSON);
    }
    
    if (closeAdminModal) {
        closeAdminModal.addEventListener('click', closeAdminModalHandler);
    }
    
    if (cancelAdminForm) {
        cancelAdminForm.addEventListener('click', closeAdminModalHandler);
    }
    
    if (adminForm) {
        adminForm.addEventListener('submit', handleAdminFormSubmit);
    }
    
    // Event listener para categoria change
    const adminCategoria = document.getElementById('admin-categoria');
    if (adminCategoria) {
        adminCategoria.addEventListener('change', handleAdminCategoryChange);
    }
    
    // Event listener para preview de imagen
    const adminImagen = document.getElementById('admin-imagen');
    if (adminImagen) {
        adminImagen.addEventListener('change', handleImagePreview);
    }
    
    // Click fuera del modal
    if (adminModal) {
        adminModal.addEventListener('click', (e) => {
            if (e.target === adminModal) {
                closeAdminModalHandler();
            }
        });
    }
}

function openAdminModal() {
    const modal = document.getElementById('admin-product-modal');
    if (modal) {
        modal.style.display = 'flex';
        resetAdminForm();
    }
}

function closeAdminModalHandler() {
    const modal = document.getElementById('admin-product-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Resetear variables de edición
    editingProductId = null;
    
    // Cambiar el título del modal de vuelta a "Agregar"
    const modalTitle = document.getElementById('admin-modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Agregar Nuevo Producto';
    }
    
    // Resetear formulario
    resetAdminForm();
}

function resetAdminForm() {
    const form = document.getElementById('admin-product-form');
    if (form) {
        form.reset();
    }
    
    const preview = document.getElementById('image-preview');
    if (preview) {
        preview.style.display = 'none';
    }
    
    const subcategoria = document.getElementById('admin-subcategoria');
    if (subcategoria) {
        subcategoria.innerHTML = '<option value="">Sin subcategoría</option>';
    }
    
    // Resetear selector de imagen a la opción por defecto
    const imagenSelect = document.getElementById('admin-imagen');
    if (imagenSelect) {
        imagenSelect.value = '';
    }
}

function handleAdminCategoryChange(e) {
    const categoria = e.target.value;
    const subcategoriaSelect = document.getElementById('admin-subcategoria');
    
    console.log('🔧 Cambiando categoría a:', categoria);
    
    if (!subcategoriaSelect) {
        console.warn('🔧 No se encontró el select de subcategoría');
        return;
    }
    
    // Limpiar opciones
    subcategoriaSelect.innerHTML = '<option value="">Sin subcategoría</option>';
    
    // Agregar subcategorías según la categoría
    const subcategorias = subcategoriasPorCategoria[categoria] || [];
    console.log('🔧 Subcategorías disponibles para', categoria, ':', subcategorias);
    
    subcategorias.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub;
        option.textContent = sub.charAt(0).toUpperCase() + sub.slice(1).replace('-', ' ');
        subcategoriaSelect.appendChild(option);
    });
    
    console.log('🔧 Opciones de subcategoría creadas:', subcategoriaSelect.options.length);
}

function handleImagePreview(e) {
    const selectedImage = e.target.value;
    const preview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    
    if (selectedImage && selectedImage !== '') {
        previewImg.src = selectedImage;
        preview.style.display = 'block';
        console.log('🔧 Preview de imagen:', selectedImage);
        
        // Manejar error de carga de imagen
        previewImg.onerror = () => {
            console.warn('⚠️ No se pudo cargar la imagen:', selectedImage);
            preview.style.display = 'none';
        };
    } else {
        preview.style.display = 'none';
        console.log('🔧 Sin imagen seleccionada');
    }
}

function handleAdminFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const imagenValue = document.getElementById('admin-imagen').value;
    
    const productData = {
        nombre: document.getElementById('admin-nombre').value,
        descripcion: document.getElementById('admin-descripcion').value,
        precio: parseFloat(document.getElementById('admin-precio').value),
        imagen: imagenValue || 'images/placeholder-product.jpg', // Usar placeholder local si no se selecciona imagen
        categoria: document.getElementById('admin-categoria').value,
        subcategoria: document.getElementById('admin-subcategoria').value || null,
        nuevo: document.getElementById('admin-nuevo').checked,
        tallas: document.getElementById('admin-tallas').value.split(',').map(t => t.trim()).filter(t => t),
        colores: document.getElementById('admin-colores').value.split(',').map(c => c.trim()).filter(c => c)
    };
    
    // Agregar precio original si se especifica
    const precioOriginal = document.getElementById('admin-precio-original').value;
    if (precioOriginal && parseFloat(precioOriginal) > 0) {
        productData.precioOriginal = parseFloat(precioOriginal);
    }
    
    // Validaciones
    if (!productData.nombre || !productData.descripcion || !productData.precio || !productData.categoria) {
        mostrarNotificacion('Por favor completa todos los campos obligatorios (nombre, descripción, precio, categoría)', 'error');
        return;
    }
    
    if (editingProductId) {
        // Modo edición: actualizar producto existente
        const productIndex = productos.findIndex(p => p.id === editingProductId);
        if (productIndex !== -1) {
            // Mantener el ID original y actualizar los datos
            productData.id = editingProductId;
            productos[productIndex] = productData;
            
            console.log('🔧 Producto actualizado:', productData);
            mostrarNotificacion(`Producto "${productData.nombre}" actualizado exitosamente`, 'success');
        }
    } else {
        // Modo creación: agregar nuevo producto
        productData.id = Date.now(); // ID único basado en timestamp
        productos.push(productData);
        
        console.log('🔧 Nuevo producto creado:', productData);
        mostrarNotificacion(`Producto "${productData.nombre}" agregado exitosamente`, 'success');
    }
    
    // Guardar todos los productos en localStorage
    localStorage.setItem('productos', JSON.stringify(productos));
    
    // Actualizar vista
    renderProductos();
    updateProductCounts();
    updateAdminCounter();
    
    // Cerrar modal y resetear
    closeAdminModalHandler();
    resetAdminForm();
    editingProductId = null;
    
    // Cambiar el título del modal de vuelta a "Agregar"
    const modalTitle = document.getElementById('admin-modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Agregar Nuevo Producto';
    }
}

function exportToJSON() {
    try {
        // Crear objeto con metadatos y productos
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalProducts: productos.length,
                version: "1.0",
                source: "MVA Catálogo Admin Panel"
            },
            productos: productos
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        // Crear enlace de descarga con timestamp
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `mva-productos-completo-${timestamp}.json`;
        
        // Ejecutar descarga
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        // Mostrar información detallada
        mostrarNotificacion(`JSON exportado exitosamente: ${productos.length} productos totales (incluyendo editados)`, 'success');
        
        console.log('Exportación completada:', {
            totalProductos: productos.length,
            fecha: now.toISOString()
        });
        
    } catch (error) {
        console.error('Error al exportar:', error);
        mostrarNotificacion('Error al exportar productos', 'error');
    }
}

function getAdminInfo() {
    const productosAdmin = JSON.parse(localStorage.getItem('mva_admin_products') || '[]');
    const productosBase = productos.length - productosAdmin.length;
    
    return {
        total: productos.length,
        base: productosBase,
        admin: productosAdmin.length,
        adminProducts: productosAdmin
    };
}

function updateAdminCounter() {
    if (isAdminMode) {
        const productsTotal = document.getElementById('products-total');
        if (productsTotal) {
            const info = getAdminInfo();
            productsTotal.textContent = `${info.total} (${info.base} base + ${info.admin} admin)`;
        }
    }
}

function mostrarNotificacion(mensaje) {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--accent-color);
        color: white;
        padding: 1rem 2rem;
        border-radius: 4px;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        box-shadow: var(--shadow);
    `;
    notificacion.textContent = mensaje;
    
    document.body.appendChild(notificacion);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        notificacion.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            if (document.body.contains(notificacion)) {
                document.body.removeChild(notificacion);
            }
        }, 300);
    }, 3000);
}

// Función para transiciones de scroll suave entre secciones
function initScrollTransitions() {
    // Intersection Observer para animar secciones al entrar en el viewport
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observar todas las secciones excepto hero
    const sections = document.querySelectorAll('section:not(.hero)');
    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // Smooth scroll para los enlaces de navegación
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = 80;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Cerrar menú móvil si está abierto
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    hamburger.classList.remove('active');
                }
            }
        });
    });

    // Efectos adicionales al hacer scroll
    let lastScrollTop = 0;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Ocultar/mostrar header al hacer scroll
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
}

// Agregar estilo de transición al header
function addHeaderTransition() {
    const header = document.querySelector('.header');
    if (header) {
        header.style.transition = 'transform 0.3s ease-in-out';
    }
}

// Funciones de administración para edición de productos
function editarProducto(productId) {
    if (!isAdminMode) {
        console.warn('Acceso denegado: Solo disponible en modo admin');
        return;
    }
    
    const producto = productos.find(p => p.id === productId);
    if (!producto) {
        console.error('Producto no encontrado');
        mostrarNotificacion('Error: Producto no encontrado');
        return;
    }

    editingProductId = productId;
    console.log('🔧 Editando producto:', producto);
    
    // Abrir el modal primero
    openAdminModal();
    
    // Cambiar el título del modal
    const modalTitle = document.getElementById('admin-modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Editar Producto';
    }

    // Esperar un momento para que el modal se abra completamente
    setTimeout(() => {
        // Llenar el formulario con los datos existentes
        const nombreField = document.getElementById('admin-nombre');
        const precioField = document.getElementById('admin-precio');
        const precioOriginalField = document.getElementById('admin-precio-original');
        const categoriaField = document.getElementById('admin-categoria');
        const descripcionField = document.getElementById('admin-descripcion');
        const imagenField = document.getElementById('admin-imagen');
        const tallasField = document.getElementById('admin-tallas');
        const coloresField = document.getElementById('admin-colores');
        const nuevoField = document.getElementById('admin-nuevo');

        // Llenar todos los campos con validación
        if (nombreField) nombreField.value = producto.nombre || '';
        if (precioField) precioField.value = producto.precio || '';
        if (precioOriginalField) precioOriginalField.value = producto.precioOriginal || '';
        if (descripcionField) descripcionField.value = producto.descripcion || '';
        if (imagenField) imagenField.value = producto.imagen || '';
        if (tallasField) tallasField.value = producto.tallas ? producto.tallas.join(', ') : '';
        if (coloresField) coloresField.value = producto.colores ? producto.colores.join(', ') : '';
        if (nuevoField) nuevoField.checked = producto.nuevo || false;

        // Manejar categoría y subcategoría de forma secuencial
        if (categoriaField && producto.categoria) {
            // Primero establecer la categoría
            categoriaField.value = producto.categoria;
            console.log('🔧 Categoría establecida:', producto.categoria);
            
            // Luego cargar las subcategorías
            handleAdminCategoryChange({ target: { value: producto.categoria } });
            
            // Finalmente establecer la subcategoría si existe
            if (producto.subcategoria) {
                const setSubcategoriaConReintento = (intentos = 0) => {
                    const subcategoriaSelect = document.getElementById('admin-subcategoria');
                    if (subcategoriaSelect) {
                        console.log('🔧 Intentando establecer subcategoría:', producto.subcategoria, '(intento:', intentos + 1, ')');
                        console.log('🔧 Opciones disponibles:', Array.from(subcategoriaSelect.options).map(opt => opt.value));
                        
                        // Verificar que la opción existe
                        const optionExists = Array.from(subcategoriaSelect.options).some(option => option.value === producto.subcategoria);
                        if (optionExists) {
                            subcategoriaSelect.value = producto.subcategoria;
                            console.log('✅ Subcategoría establecida exitosamente:', producto.subcategoria);
                        } else if (intentos < 3) {
                            // Reintentar si no existe la opción y no hemos agotado los intentos
                            setTimeout(() => setSubcategoriaConReintento(intentos + 1), 100);
                        } else {
                            console.warn('❌ No se pudo establecer la subcategoría después de múltiples intentos');
                        }
                    }
                };
                
                // Dar un momento para que se carguen las opciones y luego intentar
                setTimeout(() => setSubcategoriaConReintento(), 50);
            }
        }

        // Mostrar preview de imagen si existe
        if (producto.imagen) {
            const preview = document.getElementById('image-preview');
            const previewImg = document.getElementById('preview-img');
            if (preview && previewImg) {
                previewImg.src = getValidImageSrc(producto.imagen);
                preview.style.display = 'block';
                console.log('🔧 Preview de imagen mostrado');
            }
        }

        console.log('🔧 Formulario pre-llenado con datos del producto');
        mostrarNotificacion('Producto cargado para edición');
    }, 100);
}

function eliminarProducto(productId) {
    if (!isAdminMode) {
        console.warn('Acceso denegado: Solo disponible en modo admin');
        return;
    }
    
    const producto = productos.find(p => p.id === productId);
    if (!producto) {
        console.error('Producto no encontrado');
        return;
    }

    if (confirm(`¿Estás seguro de que quieres eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`)) {
        // Eliminar del array de productos
        productos = productos.filter(p => p.id !== productId);
        
        // Guardar en localStorage
        localStorage.setItem('productos', JSON.stringify(productos));
        
        // Actualizar la visualización
        renderProductos();
        updateProductCounts();
        updateAdminCounter();
        
        console.log('Producto eliminado:', producto.nombre);
        mostrarNotificacion(`Producto "${producto.nombre}" eliminado exitosamente`, 'success');
    }
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${tipo}`;
    notification.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${mensaje}</span>
    `;
    
    // Estilos para la notificación
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        background: tipo === 'success' ? '#28a745' : tipo === 'error' ? '#dc3545' : '#17a2b8',
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: '10000',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        animation: 'slideInRight 0.3s ease',
        maxWidth: '300px',
        fontSize: '14px'
    });
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
