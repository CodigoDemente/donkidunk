# Propuesta de Arquitectura para el Módulo Videoplayer

## 📁 Estructura Propuesta

```
videoplayer/
├── components/                    # Componentes UI puros (presentacionales)
│   ├── timeline/                  # Componentes específicos del timeline
│   │   ├── TimelineProgressBar.svelte
│   │   ├── TimelineZoomBar.svelte
│   │   ├── TimelineMarkers.svelte
│   │   └── TimeDisplay.svelte
│   ├── controls.svelte            # Controles de reproducción
│   ├── tagsbox.svelte            # Caja de tags
│   └── index.svelte              # Componente principal del videoplayer
│
├── handlers/                      # Handlers organizados por dominio de interacción
│   ├── eventHandlers.ts          # Handlers de eventos del timeline
│   │   ├── handleEventClick()           # Selección de eventos
│   │   ├── handleEventDblClick()         # Navegación al timestamp
│   │   └── handleEventResize()           # Actualización de timestamps
│   │
│   ├── timeHandlers.ts           # Handlers de tiempo y navegación
│   │   ├── handleTimeChange()            # Cambio de tiempo desde progress bar
│   │   ├── handleRangeChange()           # Cambio de rango desde zoom bar
│   │   └── handleDraggingTimeMarker()    # Estado de arrastre del marcador
│   │
│   ├── keyboardHandlers.ts       # Handlers de teclado
│   │   ├── handleDeleteEvent()           # Eliminación de eventos con Delete/Backspace
│   │   ├── shouldIgnoreKeyboardEvent()   # Validación de inputs
│   │   └── isDeleteKey()                 # Detección de teclas de borrado
│   │
│   └── interactionHandlers.ts    # Handlers de interacciones complejas
│       ├── onTimelineWheel()             # Zoom con rueda del mouse (Ctrl+Wheel)
│       ├── onProgressBarClick()          # Click en progress bar (TimelineProgressBar)
│       └── onMarkerDragStart()           # Inicio de arrastre del marcador
│
├── logic/                         # Lógica de negocio y efectos reactivos
│   ├── autoScroll.ts             # Lógica de auto-scroll y centrado
│   │   ├── applyCenterTime()             # Aplicar centrado del timeline
│   │   ├── createAutoScrollEffect()      # Effect para auto-scroll (99%)
│   │   └── createCenterOnPlayEffect()    # Effect para centrar al play
│   │
│   └── timelineState.ts          # Estado derivado y cálculos de estado
│       ├── createTimelineLimits()        # Derived: limits (leftLimitTime, rightLimitTime, visibleDuration)
│       └── createRelativeProgress()      # Derived: relativeProgress
│
├── utils/                         # Utilidades puras (sin efectos secundarios)
│   ├── timeCalculations.ts        # Cálculos relacionados con tiempo
│   │   ├── calculateTimeFromPosition()   # Mapeo de posición a tiempo
│   │   ├── clampTime()                   # Clamp de valores de tiempo
│   │   └── mapClickToVisibleTime()      # Mapeo de click a tiempo visible
│   │
│   ├── zoomCalculations.ts        # Cálculos de zoom y rango
│   │   ├── calculateTimelineLimits()     # Límites del timeline visible
│   │   ├── calculateRelativeProgress()   # Progreso relativo en rango visible
│   │   ├── centerTimeInRange()           # Centrar rango alrededor de tiempo
│   │   ├── handleZoomWheel()             # Zoom con rueda del mouse
│   │   ├── handleTimelineBarJump()       # Salto al hacer click en barra
│   │   ├── handleDragMove()              # Movimiento durante drag
│   │   └── handleMirroredDrag()          # Drag espejado (Premiere Pro style)
│   │
│   ├── markerCalculations.ts      # Cálculos de marcadores de tiempo
│   │   ├── getTimeInterval()             # Intervalo apropiado según zoom
│   │   ├── generateMarkerPositions()   # Posiciones de marcadores
│   │   └── getMarkerPercentage()        # Porcentaje de posición del marcador
│   │
│   └── clickValidation.ts         # Validación de clicks
│       └── shouldIgnoreClick()           # Ignorar clicks en elementos específicos
│
├── types/                         # Tipos TypeScript
│   ├── RangeData.ts
│   ├── Timeline.ts
│   ├── SkipType.ts
│   └── SkipDirection.ts
│
└── context.svelte.ts              # Contexto de estado (Timeline class)
```

## 🎯 Principios de Organización

### 1. **Separación por Propósito**
- **`handlers/`**: Funciones que manejan eventos de usuario y modifican estado
- **`logic/`**: Lógica de negocio, efectos reactivos y estado derivado
- **`utils/`**: Funciones puras sin efectos secundarios, fácilmente testables
- **`components/`**: Componentes UI puros, mínima lógica

### 2. **Agrupación por Dominio**
- **Event handlers**: Todo lo relacionado con interacción con eventos (clips)
- **Time handlers**: Todo lo relacionado con navegación temporal
- **Keyboard handlers**: Todo lo relacionado con entrada de teclado
- **Interaction handlers**: Interacciones complejas que combinan múltiples dominios

### 3. **Separación de Concerns**
- **Handlers**: Orquestan la interacción, llaman a lógica/contexto
- **Logic**: Contiene efectos reactivos y estado derivado
- **Utils**: Funciones matemáticas y de cálculo puras
- **Components**: Renderizado y eventos básicos

## 📝 Migración Sugerida

### Paso 1: Crear estructura de carpetas
```bash
mkdir -p handlers logic utils/clickValidation
```

### Paso 2: Extraer handlers de `timeline.svelte`

**handlers/eventHandlers.ts**
```typescript
// Handlers que interactúan con eventos del timeline
export function handleEventClick(timeline, eventId, buttonId) { ... }
export function handleEventDblClick(timeline, startTimestamp) { ... }
export async function handleEventResize(timeline, eventId, buttonId, categoryId, newStart, newEnd) { ... }
```

**handlers/timeHandlers.ts**
```typescript
// Handlers de tiempo y navegación
export function handleTimeChange(currentTime, time) { ... }
export function handleRangeChange(timelineStart, timelineEnd, start, end) { ... }
export function handleDraggingTimeMarker(isDraggingTimeMarker, dragging) { ... }
```

**handlers/keyboardHandlers.ts**
```typescript
// Handlers de teclado
export function createDeleteEventEffect(timeline, shouldIgnoreKeyboardEvent, isDeleteKey) { ... }
// Mover shouldIgnoreKeyboardEvent e isDeleteKey aquí desde progressBarUtils
```

**handlers/interactionHandlers.ts**
```typescript
// Handlers de interacciones complejas
export function onTimelineWheel(event, currentTime, duration, timelineStart, timelineEnd, handleZoomWheel) { ... }
// onProgressBarClick y onMarkerDragStart pueden quedarse en TimelineProgressBar.svelte
// ya que son específicos de ese componente
```

### Paso 3: Extraer lógica de efectos

**logic/autoScroll.ts**
```typescript
// Lógica de auto-scroll
export function applyCenterTime(time, duration, timelineStart, timelineEnd, isAutoScrolling) { ... }
export function createAutoScrollEffect(isPlaying, relativeProgress, isAutoScrolling, isDraggingTimeMarker, applyCenterTime, currentTime) { ... }
export function createCenterOnPlayEffect(isPlaying, wasPlaying, relativeProgress, isAutoScrolling, applyCenterTime, currentTime) { ... }
```

**logic/timelineState.ts**
```typescript
// Estado derivado
export function createTimelineLimits(duration, timelineStart, timelineEnd) {
  return $derived(calculateTimelineLimits(duration, timelineStart, timelineEnd));
}
export function createRelativeProgress(currentTime, limits) {
  return $derived(() => calculateRelativeProgress(...));
}
```

### Paso 4: Reorganizar utils

**utils/clickValidation.ts** (nuevo)
```typescript
// Mover desde progressBarUtils.ts
export function shouldIgnoreClick(target, progressBarElement, isDraggingTimeMarker) { ... }
```

**utils/timeCalculations.ts** (nuevo)
```typescript
// Extraer de progressBarUtils.ts
export function calculateTimeFromPosition(...) { ... }
export function clampTime(...) { ... }
export function mapClickToVisibleTime(...) { ... } // Mover desde timelineZoomUtils
```

**utils/zoomCalculations.ts** (renombrar timelineZoomUtils.ts)
```typescript
// Mantener todas las funciones de zoom aquí
// Eliminar mapClickToVisibleTime (mover a timeCalculations)
```

**utils/markerCalculations.ts** (renombrar timeMarkersUtils.ts)
```typescript
// Mantener todas las funciones de marcadores
```

## 🔄 Flujo de Datos Propuesto

```
User Interaction
    ↓
Component (onclick, onwheel, etc.)
    ↓
Handler (handlers/*.ts)
    ↓
Logic/Context (logic/*.ts o context.svelte.ts)
    ↓
Utils (utils/*.ts) - si necesita cálculos
    ↓
State Update
    ↓
Reactive Effects (logic/autoScroll.ts)
```

## ✅ Beneficios

1. **Mantenibilidad**: Cada archivo tiene una responsabilidad clara
2. **Testabilidad**: Utils son funciones puras fáciles de testear
3. **Reutilización**: Handlers y logic pueden reutilizarse en otros contextos
4. **Escalabilidad**: Fácil agregar nuevos handlers o lógica sin tocar componentes
5. **Legibilidad**: `timeline.svelte` se convierte en un orquestador limpio

## 📊 Comparación

### Antes (timeline.svelte ~180 líneas)
- Handlers mezclados con lógica
- Efectos inline
- Estado derivado inline
- Difícil de testear

### Después (timeline.svelte ~50 líneas)
- Solo orquestación y composición
- Handlers importados
- Lógica en módulos separados
- Fácil de testear y mantener

