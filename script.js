const eventos = [
    {
        nombre: "Free Coins",
        descripcion: "Aparecen monedas gratis por tiempo limitado."
    },
    {
        nombre: "Asteroid",
        descripcion: "Caen asteroides por el mapa."
    },
    {
        nombre: "Free Gems",
        descripcion: "Los jugadores reciben gemas gratis."
    },
    {
        nombre: "Trollge Event",
        descripcion: "Aparecen Trollges especiales con recompensas."
    }
];

/* ==================================================
   Comandos predeterminados - UI inyectada dinámicamente
   Este script añade una "pestaña" (sección) dentro del
   panel de admin con comandos rápidos para copiar/enviar
   al chat local.
   No requiere modificar index.html porque se inyecta.
   ==================================================*/

const comandosPredeterminados = [
    { nombre: 'Saludo', comando: '/saludo ¡Hola a todos! 👋' },
    { nombre: 'Reclamar Recompensa', comando: '/reclamar recompensa' },
    { nombre: 'Anuncio', comando: '/anuncio Atención: nuevo evento empieza en 10 minutos.' },
    { nombre: 'Reset', comando: '/reset jugador' }
];

function copiarAlPortapapeles(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    }
    // Fallback
    return new Promise((resolve, reject) => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            document.body.removeChild(ta);
            resolve();
        } catch (err) {
            document.body.removeChild(ta);
            reject(err);
        }
    });
}

function enviarAlChatLocal(text) {
    // Intenta usar la UI existente: llenar input y disparar el botón de enviar
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatMessages = document.getElementById('chatMessages');

    if (chatInput && chatSendBtn) {
        chatInput.value = text;
        // Si la página tiene lógica para el evento click, dispararla; sino añadimos el mensaje manualmente
        chatSendBtn.click();

        // Si después de un pequeño delay el mensaje no se añadió, lo añadimos manualmente
        setTimeout(() => {
            if (chatMessages && !chatMessages.innerText.includes(text)) {
                appendChatMessage('Admin', text, true);
            }
        }, 150);
        return;
    }

    // Si no existe la UI, intentamos añadir directamente al contenedor de mensajes
    if (chatMessages) {
        appendChatMessage('Admin', text, true);
    } else {
        console.warn('No se encontró la UI de chat para enviar el comando.');
    }
}

function appendChatMessage(username, text, isSystem = false) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const msg = document.createElement('div');
    msg.className = 'chat-message' + (isSystem ? ' chat-system' : '');

    const header = document.createElement('div');
    header.className = 'chat-message-header';

    const userSpan = document.createElement('div');
    userSpan.className = 'chat-message-username';
    userSpan.textContent = username;

    const timeSpan = document.createElement('div');
    timeSpan.className = 'chat-message-time';
    const now = new Date();
    timeSpan.textContent = now.toLocaleTimeString();

    header.appendChild(userSpan);
    header.appendChild(timeSpan);

    const textDiv = document.createElement('div');
    textDiv.className = 'chat-message-text';
    textDiv.textContent = text;

    msg.appendChild(header);
    msg.appendChild(textDiv);

    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function crearSeccionComandos() {
    const adminPanel = document.getElementById('adminPanel');
    if (!adminPanel) {
        console.warn('No se encontró adminPanel para insertar la sección de comandos.');
        return;
    }

    // Crear contenedor
    const section = document.createElement('div');
    section.className = 'config-group';

    const label = document.createElement('label');
    label.textContent = 'Comandos predeterminados';
    section.appendChild(label);

    // Lista de comandos
    comandosPredeterminados.forEach(cmd => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.gap = '8px';
        item.style.marginBottom = '8px';
        item.style.alignItems = 'center';

        const name = document.createElement('div');
        name.style.flex = '1';
        name.style.color = '#87CEEB';
        name.style.fontSize = '13px';
        name.textContent = cmd.nombre + ' — ' + cmd.comando;

        const btnCopy = document.createElement('button');
        btnCopy.className = 'admin-btn admin-btn-secondary';
        btnCopy.style.flex = '0 0 auto';
        btnCopy.textContent = 'Copiar';
        btnCopy.title = 'Copiar al portapapeles';
        btnCopy.addEventListener('click', () => {
            copiarAlPortapapeles(cmd.comando)
                .then(() => {
                    btnCopy.textContent = 'Copiado';
                    setTimeout(() => btnCopy.textContent = 'Copiar', 1200);
                })
                .catch(() => alert('No se pudo copiar en este navegador'));
        });

        const btnSend = document.createElement('button');
        btnSend.className = 'admin-btn admin-btn-primary';
        btnSend.style.flex = '0 0 auto';
        btnSend.textContent = 'Enviar';
        btnSend.title = 'Enviar al chat (local)';
        btnSend.addEventListener('click', () => {
            enviarAlChatLocal(cmd.comando);
            btnSend.textContent = 'Enviado';
            setTimeout(() => btnSend.textContent = 'Enviar', 900);
        });

        item.appendChild(name);
        item.appendChild(btnCopy);
        item.appendChild(btnSend);
        section.appendChild(item);
    });

    // Insertar al final del panel
    adminPanel.appendChild(section);
}

// Inyectar al cargar la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', crearSeccionComandos);
} else {
    crearSeccionComandos();
}
