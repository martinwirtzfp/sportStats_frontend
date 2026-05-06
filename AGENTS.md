# AGENTS.md — sportStats_frontend

> Documentación técnica completa para agentes de IA y desarrolladores.  
> Proyecto: TFG DAM — Aplicación de estadísticas deportivas (fútbol).

---

## Descripción General

Aplicación móvil/PWA desarrollada con **Ionic + Vue 3 + Capacitor**. Muestra estadísticas de fútbol: equipos, resultados, comparativas H2H y cálculo de probabilidades de apuestas. Consume un backend REST propio (Spring Boot) a través de un proxy Vite.

---

## Stack Tecnológico

| Tecnología      | Versión | Rol                          |
|-----------------|---------|------------------------------|
| Vue 3           | 3.x     | Framework reactivo (script setup + Composition API) |
| Ionic           | 8.x     | Componentes UI mobile        |
| Capacitor       | 8.x     | Native runtime (iOS/Android) |
| TypeScript      | 5.x     | Tipado estático              |
| Vite            | 5.x     | Build tool + dev server      |
| Pinia           | 2.x     | Gestión de estado            |
| Axios           | 1.x     | Cliente HTTP                 |
| vue-chartjs     | 5.x     | Gráficos (Chart.js wrapper)  |
| vue-router      | 4.x     | Enrutamiento                 |

---

## Arranque

```bash
# Solo con npm run dev (NO usar ionic serve — no respeta el proxy Vite)
npm run dev
# → http://localhost:5173
```

La app arranca en `/:5173`. Todas las llamadas a `/api/*` van al backend vía proxy Vite (`→ http://localhost:8090`).

---

## Variables de Entorno

Archivo: `.env` en la raíz del proyecto.

```env
VITE_API_URL=
```

`VITE_API_URL` está vacío intencionalmente: el `baseURL` de Axios es `''`, lo que hace que todas las rutas `/api/...` sean relativas y pasen por el proxy Vite.

---

## Proxy Vite

Configurado en `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8090',
      changeOrigin: true,
    }
  }
}
```

**CRÍTICO**: el backend debe estar corriendo en `:8090` antes de usar la app.

---

## Estructura del Proyecto

```
src/
├── main.ts                # Punto de entrada
├── App.vue                # Root component
├── router/
│   └── index.ts           # Rutas + guard de autenticación
├── stores/
│   ├── authStore.ts       # Token JWT + user en localStorage
│   ├── teamsStore.ts      # Competiciones + equipos
│   └── favoritesStore.ts  # Equipos favoritos del usuario
├── services/
│   └── api.ts             # Axios + todos los endpoints agrupados
├── types/
│   └── index.ts           # Interfaces TypeScript (User, Team, Match, TeamStats, RiskAnalysis, HeadToHead...)
├── views/
│   ├── TabsPage.vue            # Shell con ion-tab-bar
│   ├── TeamsTab.vue            # Lista de equipos por competición
│   ├── TeamDetailPage.vue      # Detalle + stats + partidos de un equipo
│   ├── CompareTab.vue          # H2H entre dos equipos
│   ├── CalculatorTab.vue       # Probabilidades de apuestas
│   ├── ProfileTab.vue          # Perfil + favoritos (maneja auth internamente)
│   ├── LoginPage.vue           # Login → redirige a /tabs/profile
│   └── RegisterPage.vue        # Registro → redirige a /tabs/profile
└── components/
    └── ExploreContainer.vue    # Componente de demo (sin uso real)
```

---

## Rutas

```
/                     → redirect a /tabs/teams
/tabs/                → TabsPage (shell con tab-bar)
  teams               → TeamsTab
  compare             → CompareTab
  calculator          → CalculatorTab
  profile             → ProfileTab  ← NO tiene requiresAuth (maneja auth internamente)
/teams/:id            → TeamDetailPage
/login                → LoginPage
/register             → RegisterPage
```

### Guard de Navegación

El `beforeEach` en `router/index.ts` solo bloquea rutas con `meta: { requiresAuth: true }`. Actualmente **ninguna ruta de tabs tiene ese meta** — todas gestionan el estado de auth por sí mismas.

**IMPORTANTE**: NO añadir `requiresAuth: true` a `/tabs/profile`. ProfileTab tiene UI propia para usuarios no logados (botones de login/registro).

---

## Stores Pinia

### authStore (`src/stores/authStore.ts`)

```ts
// State
token: string | null         // JWT — persiste en localStorage
user: { userId, username, email } | null  // persiste en localStorage

// Getters
isLoggedIn: boolean          // computed: !!token

// Actions
setSession(data: User)       // guarda token + user en store y localStorage
logout()                     // limpia store y localStorage
```

Clave localStorage: `sportstats_token`, `sportstats_user`.

### teamsStore (`src/stores/teamsStore.ts`)

```ts
// State
teams: Team[]
competitions: Competition[]
selectedCompetitionId: number | null
loading: boolean

// Actions
fetchCompetitions()                    // GET /api/competitions
fetchTeams(competitionId?: number)     // GET /api/teams?competitionId=X
selectCompetition(id)                  // actualiza selectedCompetitionId + llama fetchTeams
```

### favoritesStore (`src/stores/favoritesStore.ts`)

```ts
// State
favorites: UserFavorite[]
loading: boolean

// Actions
fetch()                  // GET /api/users/me/favorites (requiere JWT)
add(teamId)              // POST /api/users/me/favorites/:teamId
remove(teamId)           // DELETE /api/users/me/favorites/:teamId
isFavorite(teamId)       // boolean — usa === (no usar !==, es un bug histórico ya corregido)
clear()                  // vacía el array local (usar en logout)
```

---

## Servicio API (`src/services/api.ts`)

Axios con `baseURL: ''` y timeout 15s. Interceptor de request añade `Authorization: Bearer <token>`. Interceptor de response llama `authStore.logout()` en 401.

```ts
authApi.login(email, password)
authApi.register(username, email, password)

competitionsApi.getAll()
teamsApi.getAll(competitionId?, season?)
teamsApi.getById(id)
teamsApi.getSeasons(id)          // GET /api/teams/{id}/seasons → List<string> de temporadas con datos

matchesApi.getLastByTeam(teamId, lastN = 10)   // lastN=0 devuelve todos los partidos
matchesApi.getH2H(team1Id, team2Id)

statisticsApi.getTeamStats(teamId, lastN = 10, season?)  // lastN=0 = todos
statisticsApi.getRisk(homeTeamId, awayTeamId, lastN = 10)
statisticsApi.getH2H(team1Id, team2Id)

favoritesApi.getAll()
favoritesApi.add(teamId)
favoritesApi.remove(teamId)
```

---

## Tipos TypeScript (`src/types/index.ts`)

```ts
User          { userId, username, email, token }
Competition   { id, name, apiId, type, season, logoUrl }
Team          { id, name, shortName, logoUrl, apiId, competitionId, competitionName }
Match         { id, homeTeamId, awayTeamId, homeTeamName, awayTeamName, homeTeamLogo,
                awayTeamLogo, matchDate, status, homeGoals, awayGoals,
                htHomeGoals, htAwayGoals, competitionId, competitionName, season }
TeamStats     { teamId, teamName, lastN, totalMatches, wins, draws, losses,
                goalsScored, goalsConceded, cleanSheets, winPercentage, drawPercentage,
                lossPercentage, goalsScoredAvg, goalsConcededAvg,
                homeWins, homeDraws, homeLosses, awayWins, awayDraws, awayLosses }
Probability1X2 { homeWin, draw, awayWin }   // valores 0-100 (porcentajes)
RiskAnalysis   { homeTeamId, homeTeamName, awayTeamId, awayTeamName, lastN,
                 probability1X2, overPercentage, underPercentage, avgTotalGoals,
                 bttsYesPercentage, bttsNoPercentage, halfTimeProbability }
HeadToHead     { team1Id, team1Name, team2Id, team2Name, totalMatches,
                 team1Wins, draws, team2Wins, team1GoalsAvg, team2GoalsAvg,
                 avgTotalGoals, bttsCount, bttsPercentage, recentMatches }
UserFavorite   { id, teamId, teamName, teamLogo }
```

---

## Convención de Porcentajes

**CRÍTICO**: el backend devuelve todos los porcentajes en escala 0-100 (no 0-1).

```ts
// CORRECTO — el backend ya manda 45.23, no 0.4523
`${value.toFixed(2)}%`

// INCORRECTO — multiplica por 100 de más
`${(value * 100).toFixed(2)}%`
```

La función `pct(value)` en `CalculatorTab.vue` está implementada correctamente como `${value.toFixed(2)}%`. No dividir por 100 antes de pasarla.

---

## Vistas — Detalles Clave

### TeamsTab.vue
- `onMounted`: llama `fetchCompetitions()` → al tener competiciones llama `fetchTeams(competitionId)` → si logado llama `favStore.fetch()`
- Cambio de competición: `onSegmentChange` → `store.selectCompetition(id)`
- Toggle favorito: redirige a `/login` si no está logado

### TeamDetailPage.vue
- Parámetro de ruta: `:id` → `Number(route.params.id)`
- Carga paralela en `onMounted`: `Promise.all([loadAll(), teamsApi.getSeasons(teamId)])`
- `teamSeasons`: temporadas disponibles para este equipo específico (cargadas desde `/api/teams/{id}/seasons`). Solo muestra temporadas con datos reales para ese equipo.
- Selector de N partidos: `ion-segment` con valores 5/10/**0** (0 = "Todos" = sin límite). El backend maneja `lastN=0` como "todos los partidos".
- `matchResultColor(m)` y `matchResultLabel(m)`: calculan V/E/D directamente de los goles (no dependen de `stats`)

### CompareTab.vue
- Tiene selector de **liga** (`selectedLeagueApiId`) + selector de **temporada** (`selectedSeason`) ligado a esa liga.
- Las temporadas disponibles se calculan de `teamsStore.competitions` filtrando por `apiId` de la liga seleccionada.
- `availableTeams`: cargado localmente vía `teamsApi.getAll(compId, season)`. Para temporada "Todas", itera sobre todas las competiciones de esa liga y fusiona equipos (dedup por `team.id`).
- Cuando cambia la liga: auto-selecciona la última temporada disponible, resetea equipo 1/2 y resultados.
- Cuando cambia la temporada: resetea equipo 1/2 y resultados, recarga `availableTeams`.
- Muestra nombre de liga y temporada en una tarjeta en la cabecera del contenido.
- No tiene `meta: { requiresAuth: true }` en el router.

### CalculatorTab.vue
- Misma lógica de liga/temporada/equipos que `CompareTab.vue`.
- Además tiene selector de `lastN` (5/10/15/20 partidos para el cálculo de riesgo).
- Muestra nombre de liga y temporada en la tarjeta de configuración.
- No tiene `meta: { requiresAuth: true }` en el router.

### ProfileTab.vue
- **No** tiene `meta: { requiresAuth: true }` en el router
- Muestra UI diferente con `v-if="!authStore.isLoggedIn"` / `v-else`
- `logout()`: llama `authStore.logout()` + `favStore.clear()`

### LoginPage.vue
- `ion-back-button default-href="/tabs/profile"` — vuelve a perfil si no hay historial
- Tras login exitoso: `router.replace('/tabs/profile')` (no push, reemplaza historial)

### RegisterPage.vue
- `ion-back-button default-href="/login"`
- Tras registro: `router.replace('/tabs/profile')`

---

## Gráficos (Chart.js via vue-chartjs)

- `TeamDetailPage`: `Bar` (rendimiento + casa/fuera) — registra `BarElement, CategoryScale, LinearScale, Tooltip, Legend`
- `CompareTab`: `Bar` (distribución resultados H2H) — mismos registros
- `CalculatorTab`: `Doughnut` (probabilidades 1X2) — registra `ArcElement, Tooltip, Legend`

Cada componente registra sus propios elementos de Chart.js con `ChartJS.register(...)`.

---

## Bugs Históricos Corregidos (no reintroducir)

| Archivo | Bug | Corrección |
|---------|-----|------------|
| `router/index.ts` | `requiresAuth: true` en `/tabs/profile` → bucle infinito login | Eliminado el meta |
| `favoritesStore.ts` | `isFavorite` usaba `!==` en vez de `===` → siempre falso cuando hay favoritos | Cambiado a `===` |
| `CalculatorTab.vue` | `pct()` multiplicaba por 100 valores ya en porcentaje | `pct = value.toFixed(2) + '%'` |
| `CalculatorTab.vue` | `pct(overPercentage / 100)` — división innecesaria | Eliminada la `/100` |
| `CompareTab.vue` | `bttsPercentage.toFixed(1)` — solo 1 decimal | Cambiado a `.toFixed(2)` |
| `TeamDetailPage.vue` | `matchResultColor` devolvía `'medium'` si no había stats | Eliminada esa dependencia |
| `types/index.ts` | `HeadToHead.goalsAvg` no existe en backend (son `team1GoalsAvg`/`team2GoalsAvg`) | Corregida la interfaz |
| `CompareTab.vue` / `CalculatorTab.vue` | Mostraban todos los equipos de `teamsStore.teams` sin filtrar por liga ni temporada | Gestión propia de liga+temporada+equipos en cada componente |

---

## Patrones y Convenciones

- **Composition API** con `<script setup>` en todos los componentes
- **Pinia composition stores**: no usar Options API de Vuex
- Imports de Ionic: siempre destructurar solo los componentes usados
- Los componentes de Ionic `<ion-*>` deben importarse explícitamente en el `<script setup>`
- **TypeScript strict**: no usar `any` sin justificación
- Errores de API: mostrar mensaje en la UI con `v-if="error"`, nunca console.error silencioso en producción
- Para favoritos: siempre comprobar `authStore.isLoggedIn` antes de llamar a `favoritesApi`

---

## Tests

- Tests unitarios: `tests/unit/` — framework Vitest (`npm run test`)
- Tests E2E: `tests/e2e/` — Cypress (`npm run test:e2e`)
- Config Cypress: `cypress.config.ts`
