/**
 * ============================================================================
 * SISTEMA DE GESTIÓN DE CONTACTOS - VERSIÓN CON BASE DE DATOS
 * ============================================================================
 * Aplicación web conectada a MySQL para gestión de contactos
 * Incluye CRUD completo con comunicación asíncrona al backend
 * 
 * @version 2.0.0
 */

document.addEventListener('DOMContentLoaded', () => {

    // ========================================================================
    // I. DATOS Y VARIABLES DE ESTADO
    // ========================================================================
    
    /**
     * Array de contactos (se carga desde la base de datos)
     * @type {Array<Object>}
     */
    let datosSimulados = [];
    
    /**
     * Estado del ordenamiento actual aplicado a la lista.
     * @type {string}
     */
    let ordenamientoActivo = '';
    
    /**
     * Lista de usuarios filtrados y buscados.
     * @type {Array}
     */
    let listaUsuariosActual = [];

    /**
     * Mapeo de meses a formato numérico
     * @type {Object<string, string>}
     */
    const mesesMapping = {
        "Ene": "01", "Feb": "02", "Mar": "03", "Abr": "04", "May": "05", "Jun": "06",
        "Jul": "07", "Ago": "08", "Sep": "09", "Oct": "10", "Nov": "11", "Dic": "12"
    };


    // ========================================================================
    // II. REFERENCIAS DEL DOM
    // ========================================================================

    const listaUsuariosDiv = document.getElementById('lista-usuarios');
    const mainContent = document.querySelector('main');
    const toastContainer = document.getElementById('toast-container');

    const sidebarPanels = {
        crear: document.getElementById('form-crear-usuario-panel'),
        filtrar: document.getElementById('filtrar-opciones'),
        ordenar: document.getElementById('ordenar-opciones')
    };

    const crearUsuarioMenuBtn = document.getElementById('crear-usuario-menu-btn');
    const filtroMenuBtn = document.getElementById('filtrar-menu-btn');
    const ordenarMenuBtn = document.getElementById('ordenar-menu-btn');
    const exportarMenuBtn = document.getElementById('exportar-menu-btn');
    const formCrearUsuario = document.getElementById('form-crear-usuario');

    const buscadorWrapper = document.querySelector('.search-wrapper');
    const buscadorInput = document.getElementById('buscador-menu');
    const buscadorIcon = buscadorWrapper.querySelector('.search-icon');
    const buscadorInputAnimado = document.querySelector('.search-input');

    const filtroDiaInput = document.getElementById('filtro-dia-menu');
    const filtroMesSelect = document.getElementById('filtro-mes-menu');
    const filtroAnioInput = document.getElementById('filtro-anio-menu');
    const limpiarFiltroFechaBtn = document.getElementById('limpiar-filtro-fecha');

    const ordenarNombreBtn = document.getElementById('ordenar-nombre-btn');
    const ordenarFechaBtn = document.getElementById('ordenar-fecha-btn');


    // ========================================================================
    // III. FUNCIONES DE COMUNICACIÓN CON EL BACKEND
    // ========================================================================

    /**
     * Carga contactos desde la base de datos
     * @async
     * @function
     */
    const cargarContactosDesdeDB = async () => {
        try {
            const response = await fetch('php/obtener_contactos.php');
            const data = await response.json();
            
            if (data.success) {
                datosSimulados = data.contactos;
                filtrarYRenderizarUsuarios();
            } else {
                if (data.message === 'Sesión no válida') {
                    mostrarToast('Sesión expirada. Redirigiendo...', 'peligro');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    mostrarToast('Error al cargar contactos', 'peligro');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarToast('Error de conexión al cargar contactos', 'peligro');
        }
    };

    /**
     * Guarda las modificaciones de un usuario editado en la DB
     * @async
     * @function
     * @param {string|number} id - ID del usuario a actualizar
     * @param {HTMLFormElement} formularioElement - Formulario con los datos
     */
    const guardarEdicionUsuario = async (id, formularioElement) => {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('nombre', formularioElement.querySelector('[name="nombre"]').value);
        
        // Obtener valores (pueden ser vacíos)
        const telefonoValue = formularioElement.querySelector('[name="telefono"]').value;
        const emailValue = formularioElement.querySelector('[name="email"]').value;
        const fechaValue = formularioElement.querySelector('[name="fecha_cumple"]').value;
        
        // Agregar al FormData (el backend maneja los vacíos)
        formData.append('telefono', telefonoValue || '');
        formData.append('email', emailValue || '');
        formData.append('fecha_cumple', fechaValue || '');
        
        try {
            const response = await fetch('php/editar_contacto.php', {
                method: 'POST',
                body: formData
            });
            
            // Verificar que la respuesta sea OK
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                mostrarToast('Contacto actualizado exitosamente', 'exito');
                cargarContactosDesdeDB(); // Recargar desde DB
            } else {
                console.error('Error del servidor:', data);
                mostrarToast(data.message || 'Error al actualizar', 'peligro');
            }
        } catch (error) {
            console.error('Error completo:', error);
            mostrarToast('Error de conexión: ' + error.message, 'peligro');
        }
    };

    /**
     * Elimina un usuario de la base de datos
     * @async
     * @function
     * @param {string|number} id - ID del usuario a eliminar
     */
    const eliminarUsuario = async (id) => {
        const formData = new FormData();
        formData.append('id', id);
        
        try {
            const response = await fetch('php/eliminar_contacto.php', {
                method: 'POST',
                body: formData
            });
            
            // Verificar que la respuesta sea OK
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                mostrarToast('Contacto eliminado exitosamente', 'exito');
                cargarContactosDesdeDB(); // Recargar desde DB
            } else {
                console.error('Error del servidor:', data);
                mostrarToast(data.message || 'Error al eliminar', 'peligro');
            }
        } catch (error) {
            console.error('Error completo:', error);
            mostrarToast('Error de conexión: ' + error.message, 'peligro');
        }
    };
        
    /**
     * Exporta usuarios a CSV (simulado)
     * @function
     */
    const exportarUsuariosCSV = () => {
        console.log("SIMULADO: Generando CSV de usuarios");
        mostrarToast("Exportación a CSV terminada.", 'info');
    };


    // ========================================================================
    // IV. FUNCIONES DE UI Y RENDERIZADO
    // ========================================================================
    
    /**
     * Muestra notificación toast
     * @function
     * @param {string} mensaje - Texto a mostrar
     * @param {string} tipo - Tipo de notificación ('exito'|'peligro'|'info')
     */
    function mostrarToast(mensaje, tipo = 'info') {
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.classList.add('toast', tipo);
        toast.textContent = mensaje;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => toast.classList.add('mostrar'), 10);

        setTimeout(() => {
            toast.classList.remove('mostrar');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            }, { once: true });
        }, 3000);
    }

    /**
     * Alterna la visibilidad de un panel lateral
     * @function
     * @param {string} panelId - ID del panel a alternar
     */
    function togglePanel(panelId) {
        const targetPanel = document.getElementById(panelId);
        if (!targetPanel) return;

        Object.values(sidebarPanels).forEach(panel => {
            if (panel && panel.id !== panelId && panel.classList.contains('mostrar')) {
                panel.classList.remove('mostrar');
            }
        });

        targetPanel.classList.toggle('mostrar');

        const isAnyPanelOpen = Object.values(sidebarPanels).some(panel => 
            panel && panel.classList.contains('mostrar')
        );

        if (isAnyPanelOpen) {
            mainContent.classList.add('desplazado');
        } else {
            mainContent.classList.remove('desplazado');
        }
    }

    /**
     * Crea el elemento HTML de una tarjeta de usuario
     * @function
     * @param {Object} usuario - Datos del usuario
     * @returns {HTMLElement} Tarjeta de usuario
     */
    const crearTarjetaUsuario = (usuario) => {
        const usuarioDiv = document.createElement('div');
        usuarioDiv.classList.add('usuario-card');
        usuarioDiv.dataset.usuarioId = usuario.id;

        const telefonoVal = usuario.telefono !== null ? String(usuario.telefono) : '';
        const emailVal = usuario.email || '';
        const fechaVal = usuario.fecha_cumple || '';

        const fechaDisplay = usuario.fecha_cumple ? 
            new Date(usuario.fecha_cumple + 'T12:00:00').toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }) : 'N/A';

        usuarioDiv.innerHTML = `
            <div class="contenedor-nombre-icono">
                <span class="icono-usuario-card">
                    <i data-feather="user"></i>
                </span>
                <h3 class="nombre-usuario-card">${usuario.nombre}</h3>
                
                <div class="opciones-card">
                    <button class="menu-opciones-btn">
                        <i data-feather="more-vertical"></i>
                    </button>
                    <div class="menu-desplegable">
                        <ul>
                            <li>
                                <button class="opcion-menu" data-action="editar">
                                    <i data-feather="edit"></i> Editar
                                </button>
                            </li>
                            <li>
                                <button class="opcion-menu opcion-eliminar" data-action="eliminar">
                                    <i data-feather="trash-2"></i> Eliminar
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="info-oculta" style="display: none;">
                <p class="detalle-usuario">Teléfono: ${usuario.telefono || 'N/A'}</p>
                <p class="detalle-usuario">Email: ${usuario.email || 'N/A'}</p>
                <p class="detalle-usuario">Fecha de Cumpleaños: ${fechaDisplay}</p>
            </div>
            
            <form class="form-editar-usuario" data-usuario-id="${usuario.id}" style="display: none;">
                <div>
                    <label for="edit-nombre-${usuario.id}">Nombre:</label>
                    <input type="text" id="edit-nombre-${usuario.id}" name="nombre" value="${usuario.nombre}" required>
                </div>
                <div>
                    <label for="edit-telefono-${usuario.id}">Teléfono:</label>
                    <input type="number" id="edit-telefono-${usuario.id}" name="telefono" value="${telefonoVal}">
                </div>
                <div>
                    <label for="edit-email-${usuario.id}">Email:</label>
                    <input type="email" id="edit-email-${usuario.id}" name="email" value="${emailVal}">
                </div>
                <div>
                    <label for="edit-fecha_cumple-${usuario.id}">Fecha de Cumpleaños:</label>
                    <input type="date" id="edit-fecha_cumple-${usuario.id}" name="fecha_cumple" value="${fechaVal}">
                </div>
                <div class="botones-editar">
                    <button type="button" class="cancelar-edicion">Cancelar</button>
                    <button type="submit" class="guardar-edicion">Guardar</button>
                </div>
            </form>
        `;
        
        return usuarioDiv;
    };

    /**
     * Ordena y renderiza la lista de usuarios
     * @function
     * @param {Array<Object>} usuarios - Array de usuarios a renderizar
     */
    const renderizarUsuarios = (usuarios) => {
        let usuariosOrdenados = [...usuarios];

        if (ordenamientoActivo === 'nombre') {
            usuariosOrdenados.sort((a, b) => a.nombre.localeCompare(b.nombre));
        } else if (ordenamientoActivo === 'fecha_cumple') {
            usuariosOrdenados.sort((a, b) => {
                const dateA = a.fecha_cumple ? new Date(a.fecha_cumple) : new Date(0);
                const dateB = b.fecha_cumple ? new Date(b.fecha_cumple) : new Date(0);
                return dateA - dateB;
            });
        }

        listaUsuariosDiv.innerHTML = '';

        if (usuariosOrdenados.length === 0) {
            listaUsuariosDiv.textContent = 'No se encontraron contactos.';
        }

        const hayFiltrosActivos = buscadorInput.value.trim() !== '' ||
                                filtroDiaInput.value !== '' || 
                                filtroMesSelect.value !== '' || 
                                filtroAnioInput.value !== '';

        usuariosOrdenados.forEach(usuario => {
            const usuarioDiv = crearTarjetaUsuario(usuario);
            if (hayFiltrosActivos) {
                const infoOculta = usuarioDiv.querySelector('.info-oculta');
                if (infoOculta) {
                    infoOculta.style.display = 'block'; 
                }
            }
            
            listaUsuariosDiv.appendChild(usuarioDiv);
        });

        if (typeof feather !== 'undefined' && feather.replace) { 
            feather.replace();
        }
    };
        
    /**
     * Muestra el formulario de edición
     * @function
     * @param {string|number} usuarioId - ID del usuario
     */
    function mostrarFormularioEdicion(usuarioId) {
        document.querySelectorAll('.usuario-card.editando').forEach(card => {
            const form = card.querySelector('.form-editar-usuario');
            if (form) {
                form.style.display = 'none';
                card.classList.remove('editando');
                card.querySelector('.info-oculta').style.display = 'none';
            }
        });
        
        const card = document.querySelector(`.usuario-card[data-usuario-id="${usuarioId}"]`);
        if (!card) return;

        const form = card.querySelector('.form-editar-usuario');
        const infoOculta = card.querySelector('.info-oculta');

        form.style.display = 'block';
        if (infoOculta) {
            infoOculta.style.display = 'none';
        }
        card.classList.add('editando');
    }

    /**
     * Valida formularios y filtros
     * @function
     * @param {HTMLFormElement} [formulario] - Formulario a validar
     * @returns {boolean} Resultado de la validación
     */
    function validarFormulario(formulario) {
        let esValido = true;
        const emailInput = formulario?.querySelector('[name="email"]');
        const telefonoInput = formulario?.querySelector('[name="telefono"]');
        let errores = [];

        if (emailInput && emailInput.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value)) {
                errores.push('Por favor, introduce un correo electrónico válido.');
                esValido = false;
            }
        }

        if (telefonoInput && telefonoInput.value) {
            const telefonoRegex = /^[0-9]{7,15}$/;
            if (!telefonoRegex.test(telefonoInput.value)) {
                errores.push('Por favor, introduce un número telefónico válido (7 a 15 dígitos).');
                esValido = false;
            }
        }

        const diaFiltroInput = document.getElementById('filtro-dia-menu');
        const anioFiltroInput = document.getElementById('filtro-anio-menu');

        if (formulario === undefined || formulario.id === 'filtrar-opciones') {
            if (diaFiltroInput && diaFiltroInput.value) {
                const diaStr = diaFiltroInput.value.trim();
                const diaRegex = /^(0?[1-9]|[12]\d|3[01])$/;

                if (diaStr === '0') {
                    // Permitir temporalmente
                } else if (!diaRegex.test(diaStr)) {
                    errores.push('El día debe ser un número entre 1 y 31.');
                    esValido = false;
                } else {
                    const dia = parseInt(diaStr, 10);
                    if (isNaN(dia) || dia < 1 || dia > 31) {
                        errores.push('El día de filtro debe ser un número entre 1 y 31.');
                        esValido = false;
                    }
                }
            }
            
            if (anioFiltroInput && anioFiltroInput.value) {
                const anioStr = anioFiltroInput.value.trim();

                if (!/^\d+$/.test(anioStr)) {
                    errores.push('El año de filtro debe contener solo números enteros.');
                    esValido = false;
                } else if (anioStr.length === 4) {
                    const anio = parseInt(anioStr, 10);
                    
                    if (isNaN(anio) || anio < 1925) {
                        errores.push('El año de filtro es inválido (mínimo 1925).');
                        esValido = false;
                    }
                } else if (anioStr.length > 4) {
                    errores.push('El año de filtro no puede tener más de 4 dígitos.');
                    esValido = false;
                }
            }
        }

        if (!esValido && errores.length > 0) {
            mostrarToast("⚠️ Error:\n" + errores.join('\n'), 'peligro');
            return false; 
        }

        return esValido;
    }

    /**
     * Aplica filtros y renderiza la lista
     * @function
     */
    const filtrarYRenderizarUsuarios = () => {
        if ((filtroDiaInput.value || filtroMesSelect.value || filtroAnioInput.value)) {
            if (!validarFormulario()) {
                listaUsuariosDiv.textContent = 'Filtros de fecha inválidos. Por favor, corrígelos.';
                return;
            }
        }
        
        const terminoBusqueda = buscadorInput.value.toLowerCase();
        const filtroDia = filtroDiaInput.value;
        const filtroMesAbreviado = filtroMesSelect.value;
        const filtroAnio = filtroAnioInput.value;

        let datosFiltrados = datosSimulados.filter(usuario => {
            const coincideBusqueda = usuario.nombre.toLowerCase().includes(terminoBusqueda) ||
                                     (usuario.email && usuario.email.toLowerCase().includes(terminoBusqueda)) ||
                                     (usuario.telefono && String(usuario.telefono).includes(terminoBusqueda));
            
            if (!coincideBusqueda) return false;

            if (usuario.fecha_cumple) {
                const [anio, mes, dia] = usuario.fecha_cumple.split('-');
                
                if (filtroDia) {
                    const filtroDiaNormalizado = String(filtroDia).padStart(2, '0');
                    if (dia !== filtroDiaNormalizado) return false;
                }

                if (filtroMesAbreviado) {
                    const mesNumero = mesesMapping[filtroMesAbreviado];
                    if (mes !== mesNumero) return false;
                }

                if (filtroAnio && anio !== filtroAnio) return false;
            }
            
            return true;
        });

        listaUsuariosActual = datosFiltrados;
        renderizarUsuarios(listaUsuariosActual);
    };

    /**
     * Abre el buscador
     * @function
     */
    function openSearch() {
        buscadorWrapper.classList.add('active');
        buscadorInputAnimado.focus();
    }
    
    /**
     * Cierra el buscador
     * @function
     */
    function closeSearch() {
        buscadorWrapper.classList.remove('active');
        buscadorInputAnimado.value = '';
        filtrarYRenderizarUsuarios();
    }
    
    /**
     * Alterna el buscador
     * @function
     */
    function toggleSearch(e) {
        e.stopPropagation();
        if (!buscadorWrapper.classList.contains('active')) {
            openSearch();
        } else {
            closeSearch();
        }
    }


    // ========================================================================
    // V. MANEJADORES DE EVENTOS
    // ========================================================================

    // Eventos de la Sidebar
    crearUsuarioMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePanel('form-crear-usuario-panel');
    });

    filtroMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePanel('filtrar-opciones');
    });

    ordenarMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePanel('ordenar-opciones');
    });

    // Evento de Creación de Usuario (MODIFICADO - ASYNC)
    formCrearUsuario.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!validarFormulario(formCrearUsuario)) return;

        const formData = new FormData(formCrearUsuario);
        
        try {
            const response = await fetch('php/crear_contacto.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                const nuevoNombre = document.getElementById('nombre').value;
                mostrarToast(`Contacto ${nuevoNombre} creado exitosamente.`, 'exito');
                formCrearUsuario.reset();
                togglePanel('form-crear-usuario-panel');
                cargarContactosDesdeDB();
            } else {
                mostrarToast(data.message || 'Error al crear contacto', 'peligro');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarToast('Error de conexión', 'peligro');
        }
    });

    // Delegación de eventos para tarjetas
    listaUsuariosDiv.addEventListener('click', (event) => {
        const botonOpciones = event.target.closest('.menu-opciones-btn');
        const tarjeta = event.target.closest('.usuario-card');
        const opcionMenu = event.target.closest('.opcion-menu');
        const botonCancelar = event.target.closest('.cancelar-edicion');

        // Toggle del Menú Desplegable
        if (botonOpciones) {
            event.stopPropagation();
            const card = botonOpciones.closest('.usuario-card');
            const menuDesplegable = card.querySelector('.menu-desplegable');
            if (menuDesplegable) menuDesplegable.classList.toggle('mostrar');

            listaUsuariosDiv.querySelectorAll('.menu-desplegable.mostrar').forEach(menu => {
                if (menu !== menuDesplegable) menu.classList.remove('mostrar');
            });
            return;
        }

        // Acciones del Menú
        if (opcionMenu) {
            event.stopPropagation();
            const action = opcionMenu.dataset.action;
            const userId = opcionMenu.closest('.usuario-card')?.dataset.usuarioId;
            opcionMenu.closest('.menu-desplegable')?.classList.remove('mostrar');

            if (action === 'editar' && userId) {
                mostrarFormularioEdicion(userId);
            } else if (action === 'eliminar' && userId) {
                if (confirm('¿Estás seguro de que quieres eliminar este contacto?')) {
                    eliminarUsuario(userId);
                }
            }
            return;
        }

        // Cancelar Edición
        if (botonCancelar) {
            event.stopPropagation();
            const card = botonCancelar.closest('.usuario-card');
            const form = card.querySelector('.form-editar-usuario');
            const infoOculta = card.querySelector('.info-oculta');

            if (form) form.style.display = 'none';
            card.classList.remove('editando');
            if (infoOculta) infoOculta.style.display = 'block';
            return;
        }

        // Mostrar/Ocultar información
        if (tarjeta && 
            !tarjeta.classList.contains('editando') &&
            !event.target.closest('button') &&
            !event.target.closest('input') &&
            !event.target.closest('textarea') &&
            !event.target.closest('select') &&
            !event.target.closest('.menu-desplegable')) {

            const infoOculta = tarjeta.querySelector('.info-oculta');
            if (infoOculta) {
                const estaVisible = infoOculta.style.display === 'block';
                infoOculta.style.display = estaVisible ? 'none' : 'block';
            }
            return;
        }
    });

    // Submit del Formulario de Edición (MODIFICADO - ASYNC)
    listaUsuariosDiv.addEventListener('submit', async (event) => {
        const formEdicion = event.target.closest('.form-editar-usuario');
        if (!formEdicion) return;

        event.preventDefault();
        event.stopPropagation();

        const usuarioDiv = formEdicion.closest('.usuario-card');
        const usuarioId = formEdicion.dataset.usuarioId;

        if (validarFormulario(formEdicion)) {
            await guardarEdicionUsuario(usuarioId, formEdicion);

            formEdicion.style.display = 'none';
            if (usuarioDiv) {
                usuarioDiv.classList.remove('editando');
                const infoOculta = usuarioDiv.querySelector('.info-oculta');
                if (infoOculta) infoOculta.style.display = 'block';
            }
        }
    });

    // Eventos Globales
    document.addEventListener('click', (event) => {
        const estaEnTarjeta = event.target.closest('.usuario-card');
        const estaEnMenu = event.target.closest('.menu-opciones-btn');
        const estaEnSidebar = event.target.closest('.sidebar');
        const estaEnPanel = event.target.closest('#form-crear-usuario-panel') ||
                            event.target.closest('#filtrar-opciones') ||
                            event.target.closest('#ordenar-opciones');
        const estaEnBuscador = event.target.closest('.search-wrapper');
        const estaEnMain = event.target.closest('main');

        if (!estaEnTarjeta && !estaEnMenu) {
            listaUsuariosDiv.querySelectorAll('.menu-desplegable.mostrar')
                .forEach(menu => menu.classList.remove('mostrar'));
        }

        if (!estaEnSidebar && !estaEnPanel) {
            Object.values(sidebarPanels).forEach(panel => panel?.classList.remove('mostrar'));
            mainContent.classList.remove('desplazado');
        }

        if (!estaEnTarjeta && !estaEnBuscador && !estaEnMain) {
            listaUsuariosDiv.querySelectorAll('.usuario-card:not(.editando) .info-oculta')
                .forEach(info => { info.style.display = 'none'; });
        }
    });

    // Eventos de Filtro y Búsqueda
    buscadorInput.addEventListener('input', filtrarYRenderizarUsuarios);
    filtroDiaInput.addEventListener('input', filtrarYRenderizarUsuarios);
    filtroMesSelect.addEventListener('change', filtrarYRenderizarUsuarios);
    filtroAnioInput.addEventListener('input', filtrarYRenderizarUsuarios);

    limpiarFiltroFechaBtn.addEventListener('click', () => {
        filtroDiaInput.value = '';
        filtroMesSelect.value = '';
        filtroAnioInput.value = '';
        filtrarYRenderizarUsuarios();
        togglePanel('filtrar-opciones');
    });

    ordenarNombreBtn.addEventListener('click', () => {
        ordenamientoActivo = 'nombre';
        filtrarYRenderizarUsuarios();
        togglePanel('ordenar-opciones');
    });

    ordenarFechaBtn.addEventListener('click', () => {
        ordenamientoActivo = 'fecha_cumple';
        filtrarYRenderizarUsuarios();
        togglePanel('ordenar-opciones');
    });

    if (exportarMenuBtn) {
        exportarMenuBtn.addEventListener('click', exportarUsuariosCSV);
    }

    // Eventos del buscador
    buscadorIcon.addEventListener('click', toggleSearch);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && buscadorWrapper.classList.contains('active')) {
            closeSearch();
        }
    });
    document.addEventListener('click', e => {
        if (buscadorWrapper.classList.contains('active') && !e.target.closest('.search-wrapper')) {
            closeSearch();
        }
    });


    // ========================================================================
    // VI. INICIALIZACIÓN
    // ========================================================================
    
    cargarContactosDesdeDB();
    
}); // Fin de DOMContentLoaded