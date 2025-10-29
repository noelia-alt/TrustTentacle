# 🐙 TrustTentacle Extension - Guía de Instalación

## Para desarrolladores

### 1. Build de la extensión

```bash
# Desde la raíz del proyecto
cd extension

# Instalar dependencias
pnpm install

# Build para desarrollo
pnpm dev

# O build para producción
pnpm build
```

### 2. Cargar en Chrome

1. Abre Chrome y ve a `chrome://extensions/`
2. Activa el "Modo de desarrollador" (esquina superior derecha)
3. Haz clic en "Cargar extensión sin empaquetar"
4. Selecciona la carpeta `extension/dist/` (después del build)
5. ¡La extensión aparecerá en tu barra de herramientas! 🐙

### 3. Testing

1. **Navega a cualquier sitio web**
2. **Haz clic en el icono del pulpo** en la barra de herramientas
3. **Prueba las funciones:**
   - Verificar sitio actual
   - Reportar phishing
   - Configurar opciones

### 4. Debugging

- **Console de background**: `chrome://extensions/` → TrustTentacle → "background page"
- **Console de content**: F12 en cualquier página web
- **Console de popup**: F12 mientras el popup está abierto

## Para el hackathon

### Demo rápida

```bash
# Setup completo en 3 comandos
pnpm install:all
pnpm extension:build
# Cargar en Chrome desde extension/dist/
```

### Sitios de prueba

**Sitios seguros (deberían mostrar ✅):**
- https://bancogalicia.com.ar
- https://bbva.com.ar
- https://mercadopago.com.ar

**Sitios para reportar (demo de funcionalidad):**
- Cualquier sitio sospechoso
- Sitios de prueba con dominios similares

### Funcionalidades para mostrar

1. **Popup animado** con pulpo y tentáculos
2. **Verificación en tiempo real** 
3. **Estados visuales** (seguro/peligroso/sospechoso)
4. **Reporte comunitario** con formulario
5. **Configuración** personalizable
6. **Estadísticas** de uso

## Troubleshooting

### Error: "Manifest file is missing or unreadable"
- Asegúrate de hacer `pnpm build` primero
- Cargar desde `extension/dist/`, no desde `extension/`

### Error: "Background script failed to load"
- Revisa la consola de background script
- Verifica que el backend esté corriendo en puerto 3001

### Error: "Cannot access chrome.runtime"
- La extensión debe estar cargada correctamente
- Recargar la extensión desde chrome://extensions/

### Backend no responde
- Iniciar backend: `pnpm backend:dev`
- Verificar puerto 3001: http://localhost:3001/health

## Estructura de archivos

```
extension/
├── dist/                 # Build output (cargar aquí)
├── src/
│   ├── background.js     # Service worker
│   ├── content.js        # Content script
│   └── content.css       # Estilos inyectados
├── popup.html            # UI del popup
├── popup.css             # Estilos del popup
├── popup.js              # Lógica del popup
├── manifest.json         # Configuración MV3
└── webpack.config.js     # Build config
```

## Comandos útiles

```bash
# Desarrollo con watch
pnpm extension:dev

# Build limpio
rm -rf dist && pnpm build

# Linting
pnpm lint

# Package para distribución
pnpm package
```

## Para jueces del hackathon

La extensión demuestra:
- **Arquitectura MV3** moderna
- **UI temática** del pulpo
- **Integración blockchain** real
- **APIs externas** funcionales
- **UX intuitiva** y visual
- **Código limpio** y documentado

**¡El pulpo guardián está listo para proteger el océano digital! 🌊🔐**
