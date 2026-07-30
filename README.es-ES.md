

# Open Grammarly

**La alternativa gratuita y de código abierto a Grammarly.**

Un comprobador de gramática y ortografía potente impulsado por IA que se ejecuta completamente en tu navegador. Sin suscripciones, sin recopilación de datos, sin límites. Usa tu propia IA a través de OpenRouter y obtén la misma asistencia de escritura en tiempo real que esperarías de las herramientas premium.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-green.svg)

## Características

- **Verificación de gramática en tiempo real** - Detecta automáticamente errores gramaticales y ortográficos mientras escribes
- **Correcciones inteligentes** - Pasa el cursor sobre el texto subrayado para ver sugerencias con correcciones en un clic
- **Interfaz al estilo de Grammarly** - Subrayados rojos familiares con ventanas emergentes de corrección limpias
- **Funciona en todas partes** - Opera en cualquier sitio web con campos de entrada de texto, áreas de texto y elementos `contenteditable`
- **Múltiples modos de escritura** - Elige entre estilos Casual, Profesional y Académico
- **Agresividad ajustable** - Controla qué tan estricta debe ser la verificación gramatical
- **Privacidad ante todo** - Tu clave API y todos los ajustes se mantienen en tu navegador. Cero recopilación de datos.
- **Usa tu propia IA** - Utiliza cualquier modelo disponible en OpenRouter (GPT-4, Claude, Gemini y más)

## Capturas de pantalla

### Ventana emergente de corrección
Al pasar el cursor sobre una palabra subrayada, aparece una ventana emergente que muestra:
- El tipo de problema (por ejemplo, "Usa la palabra correcta", "Problema de puntuación")
- La corrección sugerida
- Opción para descartar la sugerencia

### Ventana emergente de la extensión
Acceso rápido para habilitar/deshabilitar la extensión y ver tu modelo de IA actual.

### Página de configuración
Configura tu clave API, selecciona el modelo de IA y personaliza tus preferencias de escritura.

## Instalación

### Desde el código fuente

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Aaryan6/open-grammarly.git
   cd open-grammarly
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Construye la extensión:
   ```bash
   npm run build
   ```

4. Carga en Chrome:
   - Abre `chrome://extensions/`
   - Habilita el "Modo de desarrollador"
   - Haz clic en "Cargar desempaquetado"
   - Selecciona la carpeta `dist`

## Configuración

1. Haz clic en el icono de la extensión en la barra de herramientas de Chrome
2. Haz clic en el icono de engranaje de configuración
3. Ingresa tu clave API de OpenRouter
4. Configura tus preferencias:
   - **Modo de escritura**: Casual, Profesional o Académico
   - **Agresividad**: Qué tan estricta debe ser la verificación gramatical

### Obtener una clave API de OpenRouter

1. Visita [OpenRouter](https://openrouter.ai/)
2. Crea una cuenta o inicia sesión
3. Navega a la sección de Claves API
4. Genera una nueva clave API
5. Cópiala y pégala en la configuración de la extensión

## Desarrollo

```bash
# Inicia el servidor de desarrollo con recarga en caliente
npm run dev

# Construye para producción
npm run build

# Vista previa de la compilación de producción
npm run preview
```

## Tecnologías

- **Framework**: React 19 con TypeScript
- **Estilos**: Tailwind CSS 4
- **Herramienta de compilación**: Vite 7 con el plugin CRXJS
- **Integración de IA**: API de OpenRouter
- **Diferenciación de texto**: diff-match-patch para fuzzy matching

## Estructura del Proyecto

```
src/
├── background/       # Service worker para llamadas a la API
│   └── index.ts
├── content/          # Script de contenido inyectado en las páginas
│   ├── index.ts      # Script de contenido principal
│   ├── dom-observer.ts   # Observa el DOM en busca de campos de texto
│   └── ui-injector.ts    # Renderiza subrayados y ventanas emergentes
├── lib/
│   ├── openrouter.ts # Integración de la API y análisis de texto
│   └── storage.ts    # Utilidades de almacenamiento de Chrome
├── options/          # Página de opciones de la extensión
│   ├── Options.tsx
│   └── main.tsx
├── popup/            # Ventana emergente de la extensión
│   ├── Popup.tsx
│   └── main.tsx
└── style.css         # Estilos globales
```

## Cómo Funciona

1. **Observación del DOM**: El script de contenido observa todos los campos de entrada de texto, áreas de texto y elementos `contenteditable` en la página
2. **Análisis con debounce**: Cuando dejas de escribir, el texto se envía al script de fondo
3. **Procesamiento de IA**: El script de fondo llama a la API de OpenRouter con el texto
4. **Validación**: Las correcciones se validan y posicionan con precisión usando fuzzy matching
5. **Renderizado de la interfaz**: Los subrayados se renderizan en una capa superpuesta del shadow DOM, con ventanas emergentes al pasar el cursor

## Contribuir

¡Las contribuciones son bienvenidas! No dudes en enviar un Pull Request.

1. Realiza un fork del repositorio
2. Crea tu rama de características (`git checkout -b feature/amazing-feature`)
3. Confirma tus cambios (`git commit -m 'Add some amazing feature'`)
4. Envía a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Este proyecto es de código abierto y está disponible bajo la [Licencia ISC](LICENSE).

---

**¡Da una estrella a este repositorio si te resulta útil!** Ayuda a difundir la palabra sobre la alternativa de código abierto a Grammarly.

## Agradecimientos

- [OpenRouter](https://openrouter.ai/) por proporcionar acceso a modelos de IA
- [CRXJS](https://crxjs.dev/) por el excelente plugin de Vite para extensiones de Chrome
- [Lucide](https://lucide.dev/) por los hermosos iconos
