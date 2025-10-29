# 🐙 TrustTentacle - Digital Trust Guardian

> Un tentáculo de confianza contra el fraude digital  
> **Octopus Hackathon 2025 - Proyecto Oficial**

TrustTentacle es un sistema de protección antiphishing que combina IA y blockchain para crear un "pulpo guardián" que protege a los usuarios en tiempo real mientras navegan por el océano digital.

**🏆 Diseñado especialmente para el Octopus Hackathon 2025** - donde la inteligencia del pulpo se encuentra con la tecnología blockchain para crear el guardián digital más inteligente del océano.

## 🌊 El Problema

En Argentina, los fraudes digitales como el phishing bancario crecen cada año. Miles de personas pierden dinero sin darse cuenta al hacer clic en sitios falsos o correos engañosos.

## 🐙 La Solución

TrustTentacle extiende sus 8 tentáculos para protegerte:

1. **Tentáculo IA**: Detecta phishing con machine learning
2. **Tentáculo Blockchain**: Verifica dominios oficiales en registro inmutable
3. **Tentáculo SSL**: Analiza certificados y conexiones seguras
4. **Tentáculo Intel**: Consulta bases de datos de amenazas
5. **Tentáculo Comunidad**: Reportes colaborativos de usuarios
6. **Tentáculo Visual**: Análisis de similitud visual de sitios
7. **Tentáculo Behavioral**: Detecta patrones sospechosos
8. **Tentáculo Shield**: Protección en tiempo real

## 🏗️ Arquitectura

```
TrustTentacles/
├── contracts/          # Smart contracts (Solidity)
├── backend/            # API server (Node.js/Express)
├── extension/          # Chrome extension (MV3)
├── web/               # Dashboard web (React/Next.js)
├── ml/                # Machine learning models
├── docs/              # Documentación
└── scripts/           # Deployment y utilities
```

## 🚀 Quick Start

### Prerrequisitos

- **Node.js 18+** - Runtime JavaScript
- **pnpm** - Package manager (más rápido que npm)
- **Git** - Control de versiones
- **MetaMask** - Wallet para interactuar con blockchain
- **Chrome/Edge** - Para testing de la extensión

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/TrustTentacles.git
cd TrustTentacles

# Instalar pnpm globalmente si no lo tienes
npm install -g pnpm

# Instalar todas las dependencias
pnpm install:all
```

### Development

```bash
# Compilar contratos inteligentes
pnpm contracts:compile

# Deploy en testnet Polygon Amoy
pnpm contracts:deploy

# Iniciar backend API (puerto 3001)
pnpm backend:dev

# Build extensión para desarrollo
pnpm extension:dev

# Iniciar dashboard web (cuando esté disponible)
pnpm web:dev

# Ejecutar todo en paralelo
pnpm dev:all
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
pnpm test:all

# Tests específicos
pnpm contracts:test    # Tests de contratos
pnpm backend:test      # Tests de API
pnpm extension:test    # Tests de extensión
```

## 📦 Deployment

### Testnet (Polygon Amoy)

```bash
# Deploy completo en testnet
pnpm deploy:testnet
```

### Producción

```bash
# Build y deploy en producción
pnpm deploy:prod
```

### Comandos útiles

```bash
# Limpiar node_modules y builds
pnpm clean

# Auditoría de seguridad
pnpm audit

# Formatear código
pnpm format

# Linting
pnpm lint
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la branch (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

## 🐙 Equipo

Desarrollado con 🧠 y ☕ para el **Octopus Hackathon 2025** (1 octubre - 31 octubre 2025).

---

## 🏆 Octopus Hackathon 2025

**"En el océano digital, solo el pulpo más inteligente puede protegerte"**

TrustTentacle representa la evolución natural del concepto de pulpo: una criatura inteligente, adaptable y con múltiples tentáculos que trabajan en paralelo. Cada tentáculo de nuestro sistema tiene una función específica, pero todos trabajan juntos para un objetivo común: **tu seguridad digital**.

### ¿Por qué un pulpo?
- **8 tentáculos = 8 sistemas de protección** trabajando simultáneamente
- **Inteligencia distribuida**: cada tentáculo puede actuar independientemente
- **Adaptabilidad**: se ajusta a nuevas amenazas en tiempo real
- **Supervivencia**: el pulpo es uno de los animales más inteligentes del océano

**"Navega seguro en el océano digital"** 🌊🔐
