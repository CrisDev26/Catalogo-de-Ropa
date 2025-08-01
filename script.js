// Datos de productos - Se cargarán desde el archivo JSON
let productos = [];

// Variables globales
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let filtroActivo = 'all';
let productosVisible = 6;
let isAdminMode = false;

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
function init() {
    // Verificar modo admin
    checkAdminMode();
    
    // Ocultar loader después de 2 segundos
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 2000);
    
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
    });
}

// Inicializar sistema de filtros moderno
function initModernFilters() {
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

// Inicializar sistema de filtros moderno
function initModernFilters() {
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
        // En modo admin, priorizar localStorage
        if (isAdminMode) {
            const adminProducts = localStorage.getItem('mva_admin_products');
            if (adminProducts) {
                productos = JSON.parse(adminProducts);
                return;
            }
        }
        
        const response = await fetch('data/productos.json');
        if (response.ok) {
            productos = await response.json();
        } else {
            // Fallback a productos por defecto si no se puede cargar el JSON
            productos = getDefaultProducts();
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
        // Fallback a productos por defecto
        productos = getDefaultProducts();
    }
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
    
    // Aplicar filtros
    let productosFiltrados = productos.filter(producto => {
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
    
    // Aplicar ordenamiento
    productosFiltrados = aplicarOrdenamiento(productosFiltrados);
    
    // Actualizar contador de resultados
    updateResultsCount(productosFiltrados.length);
    
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
    
    const productosHTML = productosAMostrar.map(producto => `
        <div class="product-card" data-id="${producto.id}" onclick="abrirProductModal(${producto.id})">
            <div class="product-image">
                <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy">
                ${producto.nuevo ? '<span class="product-badge">Nuevo</span>' : ''}
            </div>
            <div class="product-info">
                <h3 class="product-title">${producto.nombre}</h3>
                <p class="product-description">${producto.descripcion}</p>
                <div class="product-price">
                    <span class="price">$${producto.precio}</span>
                    ${producto.precioOriginal ? `<span class="original-price">$${producto.precioOriginal}</span>` : ''}
                </div>
                <button class="add-to-cart" onclick="event.stopPropagation(); agregarAlCarrito(${producto.id})">
                    Añadir al Carrito
                </button>
            </div>
        </div>
    `).join('');
    
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
        resultsCount.textContent = `${count} producto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
    }
}

function updateActiveFilters() {
    if (!activeFiltersContainer) return;
    
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

function agregarAlCarrito(id) {
    const producto = productos.find(p => p.id === id);
    const itemExistente = carrito.find(item => item.id === id);
    
    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        carrito.push({
            ...producto,
            cantidad: 1
        });
    }
    
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarCarrito();
    mostrarNotificacion('Producto añadido al carrito');
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
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
        cartTotal.textContent = '€0.00';
        return;
    }
    
    cartItems.innerHTML = carrito.map(item => `
        <div class="cart-item">
            <img src="${item.imagen}" alt="${item.nombre}">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.nombre}</div>
                <div class="cart-item-price">€${item.precio}</div>
                <div class="cart-item-controls">
                    <button onclick="cambiarCantidad(${item.id}, ${item.cantidad - 1})">-</button>
                    <span>${item.cantidad}</span>
                    <button onclick="cambiarCantidad(${item.id}, ${item.cantidad + 1})">+</button>
                    <button onclick="eliminarDelCarrito(${item.id})" style="margin-left: 10px; color: red;">🗑️</button>
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
        if (item.talla) mensaje += `   👕 Talla: ${item.talla}\n`;
        if (item.color) mensaje += `   🎨 Color: ${item.color}\n`;
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
    
    productsGrid.innerHTML = productosFiltrados.map(producto => `
        <div class="product-card" data-id="${producto.id}" onclick="abrirProductModal(${producto.id})">
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
    `).join('');
    
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
    if (e.key === 'Escape' && filterPanel.classList.contains('show')) {
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
        console.log('🔧 Modo Admin Activado');
        document.body.classList.add('admin-mode');
    }
}

function initAdminMode() {
    // Mostrar controles de admin
    const adminControls = document.getElementById('admin-controls');
    if (adminControls) {
        adminControls.style.display = 'flex';
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
        adminImagen.addEventListener('input', handleImagePreview);
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
}

function handleAdminCategoryChange(e) {
    const categoria = e.target.value;
    const subcategoriaSelect = document.getElementById('admin-subcategoria');
    
    if (!subcategoriaSelect) return;
    
    // Limpiar opciones
    subcategoriaSelect.innerHTML = '<option value="">Sin subcategoría</option>';
    
    // Agregar subcategorías según la categoría
    const subcategorias = subcategoriasPorCategoria[categoria] || [];
    subcategorias.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub;
        option.textContent = sub.charAt(0).toUpperCase() + sub.slice(1).replace('-', ' ');
        subcategoriaSelect.appendChild(option);
    });
}

function handleImagePreview(e) {
    const url = e.target.value;
    const preview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    
    if (url && isValidUrl(url)) {
        previewImg.src = url;
        preview.style.display = 'block';
        
        previewImg.onerror = () => {
            preview.style.display = 'none';
        };
    } else {
        preview.style.display = 'none';
    }
}

function isValidUrl(str) {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
}

function handleAdminFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newProduct = {
        id: Date.now(), // ID único basado en timestamp
        nombre: document.getElementById('admin-nombre').value,
        descripcion: document.getElementById('admin-descripcion').value,
        precio: parseFloat(document.getElementById('admin-precio').value),
        imagen: document.getElementById('admin-imagen').value,
        categoria: document.getElementById('admin-categoria').value,
        subcategoria: document.getElementById('admin-subcategoria').value || null,
        nuevo: document.getElementById('admin-nuevo').checked,
        tallas: document.getElementById('admin-tallas').value.split(',').map(t => t.trim()).filter(t => t),
        colores: document.getElementById('admin-colores').value.split(',').map(c => c.trim()).filter(c => c)
    };
    
    // Agregar precio original si se especifica
    const precioOriginal = document.getElementById('admin-precio-original').value;
    if (precioOriginal && parseFloat(precioOriginal) > 0) {
        newProduct.precioOriginal = parseFloat(precioOriginal);
    }
    
    // Validaciones
    if (!newProduct.nombre || !newProduct.descripcion || !newProduct.precio || !newProduct.imagen || !newProduct.categoria) {
        mostrarNotificacion('Por favor completa todos los campos obligatorios');
        return;
    }
    
    // Agregar producto
    productos.push(newProduct);
    
    // Guardar en localStorage
    localStorage.setItem('mva_admin_products', JSON.stringify(productos));
    
    // Actualizar vista
    renderProductos();
    updateProductCounts();
    
    // Cerrar modal
    closeAdminModalHandler();
    
    mostrarNotificacion(`Producto "${newProduct.nombre}" agregado exitosamente`);
}

function exportToJSON() {
    const dataStr = JSON.stringify(productos, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'productos-mva.json';
    link.click();
    
    mostrarNotificacion('Archivo JSON exportado exitosamente');
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
