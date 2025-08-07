// PDF Generator para MVA - Catálogo de Ropa
// Funcionalidad para generar PDF del carrito de compras

class PDFGenerator {
    constructor() {
        this.doc = null;
        this.pageWidth = 210; // A4 width in mm
        this.pageHeight = 297; // A4 height in mm
        this.margin = 20;
        this.currentY = 30;
    }

    // Inicializar jsPDF
    init() {
        if (typeof window.jspdf === 'undefined') {
            console.error('❌ jsPDF no está cargado. Asegúrate de incluir la librería.');
            return false;
        }
        
        const { jsPDF } = window.jspdf;
        this.doc = new jsPDF();
        this.currentY = 30;
        console.log('✅ PDF Generator inicializado');
        return true;
    }

    // Generar PDF del carrito
    generarPDFCarrito(carritoItems) {
        if (!this.init()) {
            this.mostrarError('Error al inicializar el generador de PDF');
            return;
        }

        if (!carritoItems || carritoItems.length === 0) {
            this.mostrarError('El carrito está vacío');
            return;
        }

        try {
            console.log('📄 Generando PDF del carrito...');
            
            // Configurar documento
            this.configurarDocumento();
            
            // Agregar encabezado
            this.agregarEncabezado();
            
            // Agregar información del pedido
            this.agregarInfoPedido();
            
            // Agregar productos
            this.agregarProductos(carritoItems);
            
            // Agregar total
            this.agregarTotal(carritoItems);
            
            // Agregar pie de página
            this.agregarPiePagina();
            
            // Descargar PDF
            const fechaHoy = new Date().toISOString().split('T')[0];
            const nombreArchivo = `pedido-mva-${fechaHoy}.pdf`;
            
            this.doc.save(nombreArchivo);
            
            console.log('✅ PDF generado exitosamente:', nombreArchivo);
            this.mostrarExito('PDF generado exitosamente');
            
        } catch (error) {
            console.error('❌ Error generando PDF:', error);
            this.mostrarError('Error al generar el PDF');
        }
    }

    // Configurar documento
    configurarDocumento() {
        // Configurar metadatos
        this.doc.setProperties({
            title: 'Pedido MVA',
            subject: 'Pedido de productos',
            author: 'MVA - Catálogo de Ropa',
            creator: 'MVA Guayaquil'
        });
    }

    // Agregar encabezado
    agregarEncabezado() {
        // Título principal
        this.doc.setFontSize(24);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(41, 128, 185); // Color azul MVA
        this.doc.text('MVA', this.margin, this.currentY);
        
        // Subtítulo
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(0, 0, 0);
        this.doc.text('Catálogo de Ropa', this.margin, this.currentY + 10);
        
        // Línea separadora
        this.doc.setLineWidth(1);
        this.doc.setDrawColor(41, 128, 185);
        this.doc.line(this.margin, this.currentY + 15, this.pageWidth - this.margin, this.currentY + 15);
        
        this.currentY += 25;
    }

    // Agregar información del pedido
    agregarInfoPedido() {
        const fechaActual = new Date();
        const fechaFormateada = fechaActual.toLocaleDateString('es-EC', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('DETALLE DEL PEDIDO', this.margin, this.currentY);
        
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);
        this.doc.text(`Fecha: ${fechaFormateada}`, this.margin, this.currentY + 8);
        this.doc.text('Estado: Pendiente de confirmación', this.margin, this.currentY + 15);
        
        this.currentY += 25;
    }

    // Agregar productos al PDF
    agregarProductos(carritoItems) {
        // Encabezado de la tabla
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('PRODUCTOS SELECCIONADOS', this.margin, this.currentY);
        this.currentY += 15;

        // Cabeceras de columnas
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('PRODUCTO', this.margin, this.currentY);
        this.doc.text('CANT.', this.margin + 100, this.currentY);
        this.doc.text('PRECIO', this.margin + 125, this.currentY);
        this.doc.text('SUBTOTAL', this.margin + 155, this.currentY);
        
        // Línea bajo las cabeceras
        this.doc.setLineWidth(0.5);
        this.doc.line(this.margin, this.currentY + 3, this.pageWidth - this.margin, this.currentY + 3);
        
        this.currentY += 12;

        // Agregar cada producto
        carritoItems.forEach((item, index) => {
            this.agregarProducto(item, index);
        });
    }

    // Agregar un producto individual
    agregarProducto(item) {
        // Verificar si necesitamos nueva página
        if (this.currentY > this.pageHeight - 50) {
            this.doc.addPage();
            this.currentY = 30;
        }

        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(9);

        // Nombre del producto (truncar si es muy largo)
        let nombreProducto = item.nombre;
        if (nombreProducto.length > 35) {
            nombreProducto = nombreProducto.substring(0, 32) + '...';
        }

        const subtotal = (item.precio * item.cantidad).toFixed(2);

        // Datos del producto - centrado verticalmente
        const textY = this.currentY + 2; // Reducido de 3 a 2
        this.doc.text(nombreProducto, this.margin, textY);
        this.doc.text(item.cantidad.toString(), this.margin + 108, textY);
        this.doc.text(`$${item.precio}`, this.margin + 130, textY);
        this.doc.text(`$${subtotal}`, this.margin + 160, textY);

        // Si hay tallas o colores seleccionados, agregarlos
        if (item.tallaSeleccionada || item.colorSeleccionado) {
            this.currentY += 6; // Reducido de 8 a 6
            this.doc.setFontSize(8);
            this.doc.setTextColor(100, 100, 100);
            
            let detalles = [];
            if (item.tallaSeleccionada) detalles.push(`Talla: ${item.tallaSeleccionada}`);
            if (item.colorSeleccionado) detalles.push(`Color: ${item.colorSeleccionado}`);
            
            this.doc.text(detalles.join(' | '), this.margin + 5, this.currentY);
            this.doc.setTextColor(0, 0, 0);
            this.currentY += 6; // Reducido de 10 a 6
        } else {
            this.currentY += 8; // Reducido de 15 a 8
        }

        // Línea separadora sutil
        this.doc.setLineWidth(0.2);
        this.doc.setDrawColor(200, 200, 200);
        this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
        
        this.currentY += 3; // Reducido de 5 a 3
    }

    // Agregar total del pedido
    agregarTotal(carritoItems) {
        const total = carritoItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        
        this.currentY += 10;
        
        // Línea antes del total
        this.doc.setLineWidth(1);
        this.doc.setDrawColor(0, 0, 0);
        this.doc.line(this.margin + 100, this.currentY, this.pageWidth - this.margin, this.currentY);
        
        this.currentY += 8;
        
        // Total
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('TOTAL:', this.margin + 125, this.currentY);
        this.doc.text(`$${total.toFixed(2)}`, this.margin + 155, this.currentY);
        
        this.currentY += 15;
    }

    // Agregar pie de página
    agregarPiePagina() {
        // Pie de página final
        this.doc.setFontSize(8);
        this.doc.setTextColor(150, 150, 150);
        this.doc.text('Generado desde MVA Catálogo Online', this.margin, this.pageHeight - 15);
        this.doc.text(`Fecha de generación: ${new Date().toLocaleString('es-EC')}`, this.margin, this.pageHeight - 10);
    }

    // Mostrar mensaje de éxito
    mostrarExito(mensaje) {
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion(mensaje, 'success');
        } else {
            alert('✅ ' + mensaje);
        }
    }

    // Mostrar mensaje de error
    mostrarError(mensaje) {
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion(mensaje, 'error');
        } else {
            alert('❌ ' + mensaje);
        }
    }

    // Función pública para generar PDF
    static generarPDF(carrito) {
        const generator = new PDFGenerator();
        generator.generarPDFCarrito(carrito);
    }
}

// Función global para facilitar el uso
function generarPDFCarrito() {
    // Obtener carrito desde localStorage o variable global
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    if (carrito.length === 0) {
        alert('❌ El carrito está vacío. Agrega productos antes de generar el PDF.');
        return;
    }
    
    console.log('📄 Iniciando generación de PDF...', carrito);
    PDFGenerator.generarPDF(carrito);
}

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFGenerator;
}

console.log('📄 PDF Generator cargado correctamente');
