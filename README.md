# Biz Nation — Plataforma LMS Full Stack (Prueba Técnica)

Monorepo desarrollado bajo arquitectura limpia por Andres Sanchez con **Node.js LTS (`26.13.1`)**, **pnpm**, **Express.js + TypeScript + Sequelize + PostgreSQL 16 + Swagger**, **Angular 22 (Standalone Components)** y **Vitest + Supertest**.

- Reglas obligatorias de arquitectura y estilo: [PROJECT_RULES.md](PROJECT_RULES.md)
- Diseño cloud objetivo en AWS, costos y estrategia de resiliencia: [docs/AWS_ARCHITECTURE.md](docs/AWS_ARCHITECTURE.md)

---

## Tabla de Contenidos

1. [Stack Tecnológico](#1-stack-tecnológico)
2. [Estructura del Monorepo](#2-estructura-del-monorepo)
3. [Prerrequisitos y Configuración de Terminal (VS Code PowerShell y macOS)](#3-prerrequisitos-y-configuración-de-terminal-vs-code-powershell-y-macos)
4. [Paso a Paso: Clonar, Levantar Docker/DB, Compilar y Ejecutar Localmente](#4-paso-a-paso-clonar-levantar-dockerdb-compilar-y-ejecutar-localmente)
5. [Modos de Ejecución y Despliegue Local (Desarrollo, Build Compilado y Docker)](#5-modos-de-ejecución-y-despliegue-local-desarrollo-build-compilado-y-docker)
6. [Credenciales de Prueba, URLs y Swagger](#6-credenciales-de-prueba-urls-y-swagger)
7. [Decisiones Técnicas](#7-decisiones-técnicas)
8. [Trade-offs](#8-trade-offs)
9. [Mejoras Futuras](#9-mejoras-futuras)

---

## 1. Stack Tecnológico

| Capa | Tecnología | Detalles clave |
| --- | --- | --- |
| **Runtime** | Node.js LTS `26.13.1` | Fijado en [.node-version](.node-version) para `fnm`. |
| **Gestor de paquetes** | `pnpm` (`12.23.0`) | Workspaces configurados en [pnpm-workspace.yaml](pnpm-workspace.yaml). |
| **Backend** | Express 5 + TypeScript (strict) | Capas `Router -> Controller -> Service -> Model`, validación con Zod. |
| **Base de datos & ORM** | PostgreSQL 16 + Sequelize 6 | `paranoid: true` (soft delete), migraciones y seeders con `sequelize-cli`. |
| **Seguridad & Docs** | JWT + bcryptjs + Helmet + Swagger | OpenAPI 3.0 en `/api/docs`, HMAC-SHA256 para webhooks. |
| **Frontend** | Angular 22 | 100% Standalone Components, Signals, Reactive Forms, Guards e Interceptors funcionales. |
| **Testing** | Vitest + Supertest | Unitarias y de integración HTTP en backend; unitarias en frontend. |
| **Infraestructura** | Docker Compose + Dockerfile + GitHub Actions | PostgreSQL 16 local; deploy listo para AWS App Runner/ECR + S3/CloudFront. |

---

## 2. Estructura del Monorepo

```text
.
├── .github/workflows/ci-cd.yml   # Pipeline CI/CD (test, build, Docker, AWS deploy)
├── .node-version                 # Versión Node.js LTS para fnm (26.13.1)
├── docker-compose.yml            # Servicio PostgreSQL 16 local con healthcheck
├── package.json                  # Scripts globales del monorepo
├── pnpm-workspace.yaml           # Definición de workspaces (backend, frontend)
├── PROJECT_RULES.md              # Reglas arquitectónicas del proyecto
├── docs/AWS_ARCHITECTURE.md      # Arquitectura AWS, diagrama Mermaid y costos
├── backend/                      # API REST Express + TypeScript + Sequelize
│   ├── Dockerfile                # Multi-stage build (Node 26 Alpine)
│   ├── .env.example              # Plantilla de variables de entorno
│   ├── .sequelizerc              # Rutas de config, migrations y seeders
│   ├── src/
│   │   ├── config/               # env.ts, database.cjs, swagger.ts
│   │   ├── database/             # Sequelize, models/, migrations/, seeders/
│   │   ├── middlewares/          # auth, requireRole, webhookSignature, validate, errorHandler
│   │   └── modules/              # health, auth, users, courses, lessons, progress, webhooks, automation
│   └── tests/                    # Pruebas Vitest + Supertest
└── frontend/                     # SPA Angular Standalone + Vitest
    └── src/app/
        ├── core/                 # AuthService, guards, authInterceptor, API services
        ├── shared/               # NavbarComponent
        └── features/             # login, student dashboard, admin dashboard
```

---

## 3. Prerrequisitos y Configuración de Terminal (VS Code PowerShell y macOS)

Antes de clonar el proyecto, asegúrate de tener instalados **Git**, **Docker Desktop** (iniciado y corriendo), **fnm** y **pnpm**.

### A. Windows — Terminal PowerShell interna de VS Code

1. **Habilitar ejecución de scripts locales en PowerShell** (evita errores de `PSSecurityException` al ejecutar `pnpm` o `npm` dentro de la terminal integrada de VS Code):
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```
   *(Si tu equipo corporativo no permite cambiar la política de ejecución, puedes ejecutar `pnpm.cmd` y `npm.cmd` en lugar de `pnpm` / `npm`, o usar una terminal Git Bash en VS Code).*

2. **Instalar `fnm` y Docker Desktop** (si no los tienes):
   ```powershell
   winget install Schniz.fnm
   winget install Docker.DockerDesktop
   ```

3. **Configurar `fnm` automáticamente en el perfil de PowerShell de VS Code**:
   ```powershell
   if (!(Test-Path -Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force | Out-Null }
   Add-Content -Path $PROFILE -Value 'fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression'
   ```
   Cierra y vuelve a abrir la terminal integrada de VS Code (`Ctrl + Ñ` o `Ctrl + Shift + P` → *Terminal: Create New Terminal*).

4. **Instalar Node.js LTS (`26.13.1`) y `pnpm`**:
   ```powershell
   fnm install 26.13.1
   fnm default 26.13.1
   fnm use 26.13.1
   npm install -g pnpm@12.23.0
   ```

---

### B. macOS — Terminal (`zsh`) o Terminal interna de VS Code en Mac

1. **Instalar Homebrew (si no lo tienes), `fnm`, `pnpm` y Docker Desktop**:
   ```bash
   brew install git fnm pnpm
   brew install --cask docker
   ```
   *(Abre la app **Docker** desde Aplicaciones y espera a que el icono indique que el motor está corriendo).*

2. **Configurar `fnm` en `~/.zshrc`** (para Terminal de macOS y terminal integrada de VS Code):
   ```bash
   echo 'eval "$(fnm env --use-on-cd --shell zsh)"' >> ~/.zshrc
   source ~/.zshrc
   ```

3. **Instalar Node.js LTS (`26.13.1`)**:
   ```bash
   fnm install 26.13.1
   fnm default 26.13.1
   ```

---

## 4. Paso a Paso: Clonar, Levantar Docker/DB, Compilar y Ejecutar Localmente

> **Nota para Windows PowerShell 5.1:** PowerShell clásico no soporta el operador `&&`. Ejecuta los comandos línea por línea tal como se muestran abajo.

### Paso 1: Descargar el repositorio desde GitHub

**VS Code PowerShell (Windows) / Terminal macOS:**
```bash
git clone <URL_DEL_REPOSITORIO_GITHUB>
cd BizNation_test
```

### Paso 2: Activar la versión de Node.js e instalar dependencias

`fnm` leerá automáticamente el archivo `.node-version` (`26.13.1`).

```bash
fnm use
node -v
pnpm -v
pnpm install
```
*(Si `pnpm` no estuviera instalado en esa versión de Node, ejecuta `npm install -g pnpm@12.23.0` y luego `pnpm install`).*

### Paso 3: Levantar PostgreSQL 16 con Docker Compose (Paso a paso de DB)

1. Verifica que **Docker Desktop** esté abierto y respondiendo:
   ```bash
   docker --version
   docker compose version
   ```
2. Levanta el contenedor de PostgreSQL 16 en segundo plano usando [docker-compose.yml](docker-compose.yml):
   ```bash
   docker compose up -d
   ```
   Esto creará:
   - Contenedor `biznation-postgres` con imagen `postgres:16-alpine`.
   - Base de datos `biznation_db`, usuario `biznation`, contraseña `biznation_secret` en el puerto `5432`.
   - Volumen persistente `postgres_data` y `healthcheck` con `pg_isready`.

3. Verifica que el contenedor aparezca en estado **`healthy`**:
   ```bash
   docker compose ps
   ```
   Si quieres ver los logs de arranque de PostgreSQL:
   ```bash
   docker compose logs -f postgres
   ```
   *(Presiona `Ctrl + C` para salir de los logs).*

4. *(Opcional)* Verifica conectividad directa dentro de PostgreSQL:
   ```bash
   docker exec -it biznation-postgres psql -U biznation -d biznation_db -c "\l"
   ```

> **Solución rápida si el puerto `5432` ya está ocupado en tu máquina:**
> Si tienes otro PostgreSQL local corriendo, detén ese servicio o define `DB_PORT=5433` tanto al levantar Compose como en `backend/.env`.

### Paso 4: Configurar las variables de entorno (`backend/.env`)

- **En VS Code PowerShell (Windows):**
  ```powershell
  Copy-Item backend\.env.example backend\.env
  ```
- **En Terminal de macOS (`zsh`/`bash`):**
  ```bash
  cp backend/.env.example backend/.env
  ```

Las credenciales de base de datos en [backend/.env.example](backend/.env.example) ya coinciden con `docker-compose.yml`:
```env
PORT=3000
API_PREFIX=/api
CORS_ORIGIN=http://localhost:4200
DB_HOST=localhost
DB_PORT=5432
DB_NAME=biznation_db
DB_USER=biznation
DB_PASSWORD=biznation_secret
```

> **Tip para probar el Simulador de Webhook WhatsApp en el Panel Admin:**
> El simulador del frontend trae prellenado `biznation-dev-webhook-secret`. Si deseas usarlo directo sin editar el campo en pantalla, actualiza en tu `backend/.env`:
> `WEBHOOK_SECRET=biznation-dev-webhook-secret`
> (o usa el valor de `WEBHOOK_SECRET` que hayas puesto en `backend/.env` dentro del formulario del simulador).

### Paso 5: Ejecutar migraciones y seeders de la Base de Datos

Desde la raíz del proyecto (tanto en VS Code PowerShell como en macOS):

```bash
pnpm db:migrate
pnpm db:seed
```

- `pnpm db:migrate` crea las tablas `users`, `courses`, `lessons`, `lesson_progress`, `webhook_events` y `support_alerts` (todas con `deleted_at` para soft delete `paranoid: true`), además de `sequelize_meta`.
- `pnpm db:seed` inserta 1 admin, 2 estudiantes, 3 cursos publicados y 9 lecciones.

*(Opcional)* Verifica las tablas creadas en Postgres:
```bash
docker exec -it biznation-postgres psql -U biznation -d biznation_db -c "\dt"
```

**Comandos útiles de mantenimiento / reinicio de DB:**
```bash
# Revertir seeders o última migración
pnpm --filter @biznation/backend db:seed:undo
pnpm --filter @biznation/backend db:migrate:undo

# Detener contenedor conservando datos
docker compose down

# Reiniciar base de datos desde cero (elimina el volumen postgres_data)
docker compose down -v
docker compose up -d
pnpm db:migrate
pnpm db:seed
```

### Paso 6: Ejecutar pruebas unitarias y de integración

```bash
# Ejecutar todas las pruebas (Backend + Frontend)
pnpm test

# O por separado:
pnpm test:backend
pnpm test:frontend
```

### Paso 7: Compilar todo el monorepo

```bash
pnpm build
```
Esto compila:
- **Backend TypeScript** → `backend/dist/`
- **Frontend Angular (producción)** → `frontend/dist/frontend/browser/`

*(Para verificar solo tipos del backend sin emitir archivos: `pnpm --filter @biznation/backend typecheck`).*

---

## 5. Modos de Ejecución y Despliegue Local (Desarrollo, Build Compilado y Docker)

### Opción A: Modo Desarrollo (Hot Reload) — Recomendado para evaluación

Abre **dos terminales** en VS Code (o dos pestañas en Terminal de macOS) ubicadas en la raíz del proyecto:

- **Terminal 1 — Backend API (`http://localhost:3000`)**:
  ```bash
  pnpm dev:backend
  ```
- **Terminal 2 — Frontend Angular (`http://localhost:4200`)**:
  ```bash
  pnpm dev:frontend
  ```

### Opción B: Ejecutar el Proyecto Compilado Localmente (Simulación de Producción)

1. Compila ambos proyectos:
   ```bash
   pnpm build
   ```
2. **Terminal 1 — Levantar backend compilado (`dist/server.js`)**:
   - **En VS Code PowerShell:**
     ```powershell
     pnpm --filter @biznation/backend start
     ```
   - **En macOS Terminal:**
     ```bash
     pnpm --filter @biznation/backend start
     ```
   *(Asegúrate de tener `backend/.env` configurado con `JWT_SECRET` y `WEBHOOK_SECRET` definidos si estableces `NODE_ENV=production`).*

3. **Terminal 2 — Servir el bundle estático compilado de Angular**:
   ```bash
   pnpm dlx serve frontend/dist/frontend/browser -s -l 4200
   ```
   > **Nota:** El build de producción de Angular (`environment.ts`) usa ruta relativa `apiUrl: '/api'` pensada para estar detrás de CloudFront/ALB o un reverse proxy. Si sirves los archivos estáticos en otro puerto sin proxy (`/api` → `:3000`), utiliza `pnpm dev:frontend` o `ng serve` que apunta a `http://localhost:3000/api` (`environment.development.ts`).

### Opción C: Desplegar el Backend localmente en Contenedor Docker

Puedes probar la imagen productiva multi-stage de [backend/Dockerfile](backend/Dockerfile) contra tu PostgreSQL de Docker Compose:

1. Construir la imagen Docker:
   ```bash
   docker build -f backend/Dockerfile -t biznation-backend ./backend
   ```
2. Ejecutar el contenedor conectándolo al PostgreSQL local mediante `host.docker.internal`:
   - **VS Code PowerShell (Windows):**
     ```powershell
     docker run --rm --name biznation-api -p 3000:3000 --env-file backend\.env -e DB_HOST=host.docker.internal biznation-backend
     ```
   - **macOS Terminal:**
     ```bash
     docker run --rm --name biznation-api -p 3000:3000 --env-file backend/.env -e DB_HOST=host.docker.internal biznation-backend
     ```
3. Verifica salud del contenedor en `http://localhost:3000/health`.

---

## 6. Credenciales de Prueba, URLs y Swagger

### URLs Principales
- **Aplicación Frontend (Angular)**: `http://localhost:4200`
- **API Backend Base**: `http://localhost:3000/api`
- **Swagger UI (OpenAPI 3.0.3)**: `http://localhost:3000/api/docs`
- **Swagger JSON Spec**: `http://localhost:3000/api/docs.json`
- **Health Checks**: `http://localhost:3000/health` (liveness) y `http://localhost:3000/health/ready` (readiness PostgreSQL)

### Credenciales Precargadas (Seeders)
*(También disponibles como botones rápidos en la pantalla de Login).*

| Rol | Nombre | Email | Contraseña |
| --- | --- | --- | --- |
| **Admin** | Admin BizNation | `admin@biznation.com` | `Admin123!` |
| **Estudiante 1** | Laura Gómez | `laura.gomez@biznation.com` | `Student123!` |
| **Estudiante 2** | Carlos Mendoza | `carlos.mendoza@biznation.com` | `Student123!` |

---

## 7. Decisiones Técnicas

1. **Arquitectura Monolito Modular por Capas (`Router -> Controller -> Service -> Model`)**:
   - Cada dominio (`auth`, `users`, `courses`, `lessons`, `progress`, `webhooks`, `automation`, `health`) encapsula sus responsabilidades con flujo estricto unidireccional.
   - El `Controller` únicamente traduce HTTP ↔ DTOs; el `Service` concentra reglas de negocio, validaciones de dominio y transacciones; el `Model` encapsula el esquema Sequelize. Esto facilita testing aislado de servicios sin levantar Express.
2. **Soft Delete Global (`paranoid: true`) e Índices Únicos Parciales**:
   - Configurado tanto en [database/index.ts](backend/src/database/index.ts) como en cada modelo y migración (`deleted_at`).
   - En PostgreSQL, los índices únicos (`users.email`, `lesson_progress(user_id, lesson_id)`, `webhook_events.external_event_id`) usan condición parcial `WHERE deleted_at IS NULL`, evitando colisiones si un registro es eliminado lógicamente y vuelto a crear después.
3. **Reglas de Negocio Explícitas y Seguridad Defensiva**:
   - **Integridad histórica**: `DELETE /api/courses/:id` verifica `LessonProgress.count` y bloquea con `409 Conflict` si algún estudiante ya tiene progreso.
   - **RBAC + Propiedad**: `authenticateJWT` + `requireRole` combinados con validación de pertenencia (`student` solo ve cursos publicados, su propio progreso y su propio perfil; `admin` accede a métricas agregadas y reportes).
   - **Webhooks HMAC sobre `rawBody`**: se captura el buffer original en `express.json({ verify })` y se compara en tiempo constante con `crypto.timingSafeEqual`, garantizando idempotencia por `external_event_id` (incluyendo manejo de colisiones concurrentes `UniqueConstraintError`).
4. **Vitest Unificado (Backend + Frontend) y Angular Standalone + Signals**:
   - Angular 22 con 100% Standalone Components, `inject()`, `ReactiveFormsModule`, Guards/Interceptors funcionales y `@angular/build:unit-test` con Vitest.
   - En el Simulador de Webhook del panel Admin, la firma HMAC-SHA256 se calcula directamente en el navegador usando la **Web Crypto API** (`crypto.subtle`) sin añadir librerías externas al bundle.
5. **Scoring e IA Determinística por Pesos**:
   - El motor de automatización combina completitud (`60%`) y recencia de `last_activity_at` (`40%`) para clasificar automáticamente al estudiante (`Alto desempeño`, `En progreso`, `En riesgo`, `Inactivo`), y analiza mensajes de WhatsApp mediante reglas ponderadas normalizadas (sin acentos) generando registros persistentes en `support_alerts`.

---

## 8. Trade-offs

| Decisión | Alternativa descartada | Qué ganamos | Qué sacrificamos / Límite actual | Cuándo evolucionar |
| --- | --- | --- | --- | --- |
| **Monolito modular en Express** | Microservicios separados desde el día 1 | Transacciones ACID simples entre progreso, `last_activity_at` y clasificación; cero latencia entre servicios; despliegue y debugging simples. | Un pico extremo de webhooks comparte recursos de CPU/memoria con la API principal. | Extraer `webhooks` + `automation` como worker independiente si el volumen de eventos supera la capacidad de la API síncrona. |
| **Procesamiento síncrono en `POST /api/webhooks/whatsapp`** | Cola SQS + Workers desde la prueba local | Flujo demostrable extremo a extremo en local sin servicios cloud adicionales; respuesta inmediata en el simulador del Admin. | Si el procesamiento/IA creciera en latencia (>1-2s), podría acercarse a timeouts del proveedor. | Introducir Amazon SQS + Backoff Exponencial + DLQ + Circuit Breaker (detallado en [docs/AWS_ARCHITECTURE.md](docs/AWS_ARCHITECTURE.md)). |
| **Analizador IA basado en keywords y pesos** | Llamadas síncronas a un LLM externo | Cero costo por token, latencia <1 ms, 100% determinista y testeable en CI sin API keys externas. | Menor comprensión semántica ante sarcasmo, sinónimos complejos o redacción ambigua. | Usar este motor como filtro rápido Tier-1 y delegar casos ambiguos de forma asíncrona a un LLM. |
| **Paginación en memoria tras `enrichCoursesWithProgress` cuando hay `minProgress`/`maxProgress`** | Subconsultas SQL `HAVING` complejas | Consultas portables, código limpio y fácilmente mockeable en pruebas unitarias de Sequelize. | Con decenas de miles de cursos simultáneos, el filtro por rango de progreso requeriría agregación SQL o vista materializada. | Mover el cálculo agregado a una vista materializada / query SQL parametrizada o tabla resumen cuando el catálogo crezca. |
| **JWT stateless sin tabla de revocación** | Sesiones en Redis / Refresh Tokens persistidos | Escalabilidad horizontal inmediata detrás de AWS ALB/App Runner sin estado compartido. | Un JWT comprometido sigue siendo válido hasta que expire (`JWT_EXPIRES_IN`). | Añadir Refresh Tokens rotativos y lista negra en Redis para revocación inmediata. |

---

## 9. Mejoras Futuras

1. **Procesamiento Asíncrono Resiliente de Webhooks (AWS SQS + DLQ + Circuit Breaker)**:
   - Responder `200 OK` tras validar HMAC e idempotencia (`status: 'received'`) y delegar el análisis/notificación a workers consumiendo desde SQS con backoff exponencial, Dead-Letter Queue y Circuit Breaker (`opossum`) hacia proveedores externos.
2. **Autenticación Avanzada**:
   - Incorporar **Refresh Tokens** con rotación, revocación en Redis, recuperación de contraseña y rate limiting por IP/usuario (`express-rate-limit` con store distribuido).
3. **Pruebas End-to-End (E2E) y Contratos con DB Real en CI**:
   - Agregar **Playwright** para validar flujos críticos en navegador real (Login → Completar lección → Bloqueo `409` → Simulador Webhook) y ejecutar pruebas de integración backend contra PostgreSQL real usando **Testcontainers** o `services: postgres` en GitHub Actions.
4. **Observabilidad y Auditoría**:
   - Logging estructurado JSON (`pino`) con `correlationId` por request, métricas OpenTelemetry / CloudWatch y auditoría de cambios administrativos.
5. **Evolución Funcional del LMS**:
   - Gestión completa de lecciones y módulos desde la UI de Admin (reordenamiento drag-and-drop), inscripción explícita de estudiantes por cohorte, certificados PDF al 100% y clasificación híbrida con LLM asíncrono sobre `support_alerts`.
