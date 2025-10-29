# 🧪 TrustTentacle - Guía de Testing

> **Octopus Hackathon 2025** - Cómo testear tu pulpo guardián paso a paso

## 🚀 Testing Rápido (5 minutos)

### 1. Setup inicial
```bash
# Desde la raíz del proyecto
cd TrustTentacles

# Configurar ambiente (si no lo hiciste)
pnpm setup

# Deployment automático
pnpm deploy:auto
```

### 2. Verificar que todo esté corriendo
```bash
# Backend health check
curl http://localhost:3001/health

# Debería responder:
# {"status":"healthy","tentacles":"🐙"}
```

## 🔍 Testing por Componentes

### 🐙 Backend API Testing

#### Health Check
```bash
curl http://localhost:3001/health
```
**Esperado**: `{"status":"healthy","tentacles":"🐙"}`

#### Verificación de URL
```bash
# Sitio seguro (debería estar en whitelist)
curl -X POST http://localhost:3001/api/v1/verify \
  -H "Content-Type: application/json" \
  -d '{"url":"https://bancogalicia.com.ar"}'
```
**Esperado**: `verdict: "SAFE"` o `verdict: "UNVERIFIED"`

#### Listar entidades
```bash
curl http://localhost:3001/api/v1/entities
```
**Esperado**: Lista con bancos argentinos

#### Estadísticas
```bash
curl http://localhost:3001/api/v1/stats
```
**Esperado**: Stats del sistema con tentáculos

### ⛓️ Blockchain Testing

#### Verificar deployment
```bash
# Ver contratos desplegados
cat contracts/deployments/amoy.json
```
**Esperado**: Addresses de los 3 contratos

#### Test de dominio oficial
```bash
curl -X GET http://localhost:3001/api/v1/verify/domain/bancogalicia.com.ar
```
**Esperado**: `isOfficial: true` si está en blockchain

### 🌐 Extension Testing

#### 1. Construir y cargar extensión
```bash
# PRIMERO: Construir la extensión
pnpm extension:build

# Verificar que se creó
ls extension/dist/
```

1. Abre Chrome → `chrome://extensions/`
2. Activa "Modo desarrollador"
3. "Cargar extensión sin empaquetar"
4. **Selecciona `extension/dist/`** (no `extension/`)
5. Debería aparecer el icono 🐙

#### 2. Test básico del popup
1. Haz clic en el icono 🐙
2. Debería abrir popup con pulpo animado
3. Mostrar URL actual
4. Botones "Verificar Sitio" y "Reportar Phishing"

#### 3. Test de verificación
1. Navega a https://bancogalicia.com.ar
2. Clic en icono 🐙
3. Clic "Verificar Sitio"
4. Debería mostrar estado de tentáculos
5. Resultado: ✅ SEGURO o ❓ NO VERIFICADO

#### 4. Test de reporte
1. En cualquier sitio, clic 🐙
2. Clic "Reportar Phishing"
3. Llenar formulario
4. "Enviar Reporte"
5. Debería mostrar confirmación

## 🎬 Testing para Demo

### Escenario 1: Sitio Seguro
```bash
# 1. Navegar a sitio oficial
# URL: https://bancogalicia.com.ar

# 2. Abrir TrustTentacle
# 3. Verificar sitio
# 4. Mostrar resultado ✅ SEGURO
```

### Escenario 2: Sitio Sospechoso
```bash
# 1. Navegar a sitio no verificado
# URL: https://example.com

# 2. Abrir TrustTentacle  
# 3. Verificar sitio
# 4. Mostrar resultado ❓ NO VERIFICADO
```

### Escenario 3: Reporte Comunitario
```bash
# 1. En sitio sospechoso
# 2. Reportar como phishing
# 3. Mostrar formulario
# 4. Enviar reporte exitoso
```

## 🧪 Testing Avanzado

### API Testing con Postman

#### Importar colección
```json
{
  "info": {"name": "TrustTentacle API"},
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "http://localhost:3001/health"
      }
    },
    {
      "name": "Verify URL",
      "request": {
        "method": "POST",
        "url": "http://localhost:3001/api/v1/verify",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "raw": "{\"url\":\"https://bancogalicia.com.ar\",\"checkLevel\":\"full\"}"
        }
      }
    }
  ]
}
```

### Load Testing
```bash
# Instalar herramienta
npm install -g artillery

# Test de carga básico
artillery quick --count 10 --num 5 http://localhost:3001/health
```

### Browser Testing
```javascript
// En consola del navegador con extensión cargada
chrome.runtime.sendMessage({type: 'CHECK_URL', url: window.location.href})
  .then(result => console.log('Verification result:', result));
```

## 🔧 Troubleshooting

### Backend no responde
```bash
# Verificar proceso
lsof -i :3001

# Reiniciar backend
pnpm backend:dev

# Verificar logs
tail -f backend/logs/app.log
```

### Extension no funciona
```bash
# IMPORTANTE: Primero construir
pnpm extension:build

# Verificar que dist/ existe
ls extension/dist/

# Si no existe dist/, el build falló
# Verificar errores de build
pnpm extension:dev

# Recargar en Chrome
# chrome://extensions/ → Recargar TrustTentacle

# Ver errores
# F12 → Console (en popup abierto)
```

### Blockchain connection failed
```bash
# Verificar .env
cat backend/.env | grep REGISTRY_ADDRESS

# Test manual de RPC
curl -X POST https://rpc-amoy.polygon.technology/ \
  -H "Content-Type: application/json" \
  -d '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}'
```

## ✅ Checklist de Testing Pre-Demo

### Backend ✅
- [ ] Health endpoint responde
- [ ] Verify endpoint funciona
- [ ] Entities endpoint lista bancos
- [ ] Stats endpoint responde
- [ ] Logs sin errores críticos

### Blockchain ✅
- [ ] Contratos desplegados en Amoy
- [ ] Addresses en backend/.env
- [ ] Dominio verificación funciona
- [ ] Transacciones se procesan

### Extension ✅
- [ ] Carga sin errores
- [ ] Popup se abre correctamente
- [ ] Pulpo animado visible
- [ ] Verificación funciona
- [ ] Reporte funciona
- [ ] Settings se guardan

### Demo Flow ✅
- [ ] Sitio seguro → ✅ SEGURO
- [ ] Sitio no verificado → ❓ NO VERIFICADO  
- [ ] Reporte phishing → ✅ Enviado
- [ ] UI responsiva y fluida
- [ ] Narrativa del pulpo coherente

## 🎯 Testing para Jueces

### Test Técnico (2 minutos)
```bash
# 1. Clonar repo
git clone <repo>
cd TrustTentacles

# 2. Setup automático
pnpm setup  # Configuración interactiva
pnpm deploy:auto  # Deployment completo

# 3. Verificar funcionamiento
curl http://localhost:3001/health
# Cargar extension/dist/ en Chrome
```

### Test Funcional (3 minutos)
1. **Verificación**: bancogalicia.com.ar → ✅ SEGURO
2. **Warning**: example.com → ❓ NO VERIFICADO
3. **Reporte**: Cualquier sitio → Formulario funcional
4. **UI**: Pulpo animado, tentáculos, tema océano

### Preguntas Técnicas Esperadas
- **"¿Cómo funciona la verificación?"** → 8 tentáculos, blockchain + APIs
- **"¿Es escalable?"** → Sí, arquitectura descentralizada
- **"¿Por qué un pulpo?"** → 8 brazos = 8 verificaciones, inteligente, adaptable
- **"¿Qué blockchain usan?"** → Polygon Amoy (testnet), barato y rápido

## 🏆 Success Metrics

**Tu TrustTentacle pasa el testing si:**
- ✅ Setup completo en < 5 minutos
- ✅ Backend responde a todas las APIs
- ✅ Extension carga y funciona
- ✅ Verificación muestra resultados correctos
- ✅ Reporte se envía exitosamente
- ✅ UI del pulpo es fluida y atractiva
- ✅ Demo flow funciona sin errores

**🐙 ¡Tu octopus guardian está listo para impresionar en el hackathon! 🌊🏆**
