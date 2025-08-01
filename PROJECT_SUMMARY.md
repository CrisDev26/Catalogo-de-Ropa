# MVA - Catálogo de Ropa Premium
## Resumen del Proyecto

**Tipo**: Catálogo de ropa luxury/premium estático (sin base de datos)
**Estado**: ✅ Completamente funcional
**Arquitectura**: Frontend puro (HTML, CSS, JavaScript)

## 🏗️ Estructura del Proyecto

```
Catalogo de Ropa/
├── 📄 index.html              # Página principal del catálogo
├── 🎨 styles.css              # Estilos CSS principales
├── ⚡ script.js               # JavaScript principal
├── 📁 admin/                  # Panel de administración
│   ├── index.html             # Panel admin
│   ├── admin-script.js        # JS del admin
│   └── admin-styles.css       # CSS del admin
├── 📁 data/                   # Datos JSON
│   └── productos.json         # Base de datos JSON
├── 📁 images/                 # Imágenes del catálogo
├── 📄 .htaccess              # Configuración Apache
└── 📋 README.md              # Documentación

```

## 🔧 Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Estilos**: CSS Grid, Flexbox, Animaciones CSS
- **Fuentes**: Google Fonts (Playfair Display, Inter)
- **Iconos**: Font Awesome 6.4.0
- **Almacenamiento**: localStorage + JSON files
- **Sin Backend**: No usa PHP, MySQL, o cualquier base de datos

## 📊 Sistema de Datos

### Prioridad de Carga:
1. **localStorage** (productos agregados desde admin)
2. **data/productos.json** (productos base)
3. **Fallback hardcodeado** (por seguridad)

### Estructura de Producto:
```json
{
    "id": 1,
    "nombre": "Producto",
    "descripcion": "Descripción del producto",
    "precio": 99.99,
    "precioOriginal": 129.99,
    "imagen": "images/producto.jpg",
    "categoria": "mujer|hombre",
    "subcategoria": "blusas|vestidos|pantalones|etc",
    "nuevo": true|false,
    "tallas": ["XS", "S", "M", "L", "XL"],
    "colores": ["Color1", "Color2"]
}
```

## 🎯 Funcionalidades Principales

### Catálogo Principal
- ✅ Visualización de productos en grid responsivo
- ✅ Modal de producto con información completa
- ✅ Carrito de compras (localStorage)
- ✅ Búsqueda de productos
- ✅ Filtros modernos (precio, categoría, subcategoría)
- ✅ Ordenamiento (precio, nombre, novedad)
- ✅ Animaciones y transiciones suaves
- ✅ Diseño responsivo completo

### Panel de Administración
- ✅ Login con contraseña
- ✅ Agregar nuevos productos
- ✅ Editar productos existentes
- ✅ Eliminar productos
- ✅ Vista previa de productos
- ✅ Sincronización automática con catálogo principal
- ✅ Sistema de actividades/logs

### Carrito de Compras
- ✅ Agregar/quitar productos
- ✅ Cambiar cantidades
- ✅ Cálculo automático de totales
- ✅ Persistencia en localStorage
- ✅ Modal deslizante moderno

## 🎨 Diseño y UX

### Paleta de Colores
- **Primario**: #2c3e50 (Azul oscuro elegante)
- **Secundario**: #34495e (Gris azulado)
- **Acento**: #d4af37 (Dorado luxury)
- **Fondo**: #f8f9fa (Gris claro)
- **Texto**: #2c3e50 / #6c757d

### Tipografías
- **Títulos**: Playfair Display (serif elegante)
- **Cuerpo**: Inter (sans-serif moderna)

### Características Visuales
- Animaciones suaves de entrada
- Efectos hover elegantes
- Loader animado al cargar
- Modales con overlay y blur
- Sistema de filtros flotante moderno
- Cards con sombras y esquinas redondeadas

## 🔐 Configuración del Admin

**Contraseña por defecto**: `admin123`
**Ruta**: `/admin/index.html`

### Cambiar Contraseña
En `admin/admin-script.js`, línea ~8:
```javascript
const ADMIN_CONFIG = {
    password: 'nueva_contraseña',
    sessionKey: 'mva_admin_session'
};
```

## 🚀 Instalación y Uso

### Desarrollo Local
1. Abrir `index.html` directamente en navegador
2. Para admin: abrir `admin/index.html`

### Producción (Servidor Web)
1. Subir todos los archivos al servidor
2. Asegurar que `.htaccess` esté configurado
3. Verificar permisos de escritura en `/images`

## 📱 Responsividad

- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)  
- ✅ Mobile (320px - 767px)
- ✅ Mobile pequeño (320px - 480px)

## 🔄 Sincronización Admin-Catálogo

- **Método**: localStorage + storage events
- **Tiempo real**: Cambios se reflejan instantáneamente
- **Persistencia**: Los cambios se mantienen en la sesión
- **Fallback**: Si localStorage falla, usa productos.json

## 🏷️ Productos Incluidos

1. **Blazer Elegante** - Mujer/Blusas - $129.99
2. **Camisa Premium** - Hombre - $89.99
3. **Vestido de Noche** - Mujer/Vestidos - $199.99

## 📋 Notas Importantes

- **No requiere servidor PHP/MySQL**
- **Funciona completamente offline**
- **Optimizado para SEO básico**
- **Carga rápida (< 2 segundos)**
- **Compatible con todos los navegadores modernos**
- **Código limpio y bien documentado**

## 🛠️ Mantenimiento

### Agregar Nuevos Productos
1. Usar panel admin OR
2. Editar `data/productos.json` directamente

### Modificar Estilos
- Archivo principal: `styles.css`
- Variables CSS en `:root` para fácil personalización

### Agregar Funcionalidades
- JavaScript modular en `script.js`
- Funciones bien documentadas y separadas

---

**Desarrollado para MVA Luxury Fashion**
**Versión**: 1.0.0 - Funcional Complete
**Fecha**: Julio 2025
