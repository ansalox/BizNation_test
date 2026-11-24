# PROJECT_RULES.md — Biz Nation Technical Test Monorepo

Este documento define las reglas arquitectónicas, el stack tecnológico obligatorio y los estándares de ingeniería para el monorepo de **Biz Nation**.

---

## 1. Stack Tecnológico Obligatorio

Queda **estrictamente prohibido** introducir frameworks alternativos fuera del stack definido a continuación:

| Capa / Área | Tecnología Obligatoria | Notas |
| --- | --- | --- |
| **Runtime** | Node.js LTS (`26.13.1`) | Versionado mediante `.node-version` para `fnm`. |
| **Gestor de paquetes** | `pnpm` (Monorepo / Workspaces) | Uso obligatorio de `pnpm` en raíz, `backend/` y `frontend/`. |
| **Backend Framework** | Node.js + Express.js + TypeScript | `strict: true` en `tsconfig.json`. |
| **Base de datos y ORM** | PostgreSQL 16 + Sequelize | Migraciones y seeders obligatorios (`sequelize-cli`). |
| **Documentación API** | Swagger (OpenAPI 3.0) | `swagger-jsdoc` + `swagger-ui-express` expuesto en `/api-docs`. |
| **Frontend** | Angular (última versión) | **Standalone Components** únicamente (sin `NgModule`). |
| **Testing Backend** | Vitest + Supertest | Pruebas unitarias de servicios/controladores e integración HTTP. |
| **Testing Frontend** | Vitest | Pruebas unitarias de componentes, servicios y utilidades Angular. |
| **Infraestructura** | Docker Compose (local) + AWS-ready | PostgreSQL 16 en Docker Compose local; configuración stateless lista para AWS. |

---

## 2. Estructura del Monorepo

```text
.
├── .node-version           # Versión Node.js LTS para fnm
├── PROJECT_RULES.md        # Reglas obligatorias del proyecto
├── docker-compose.yml      # PostgreSQL 16 local para desarrollo
├── package.json            # Scripts globales del monorepo
├── pnpm-workspace.yaml     # Definición de workspaces (backend, frontend)
├── backend/                # API REST Express + TypeScript + Sequelize + Swagger
│   ├── .env.example
│   ├── src/
│   │   ├── config/         # Configuración de app, env, db, swagger
│   │   ├── database/       # Instancia Sequelize, migrations/, seeders/
│   │   ├── middlewares/    # Error handler, validación, notFound
│   │   ├── modules/        # Módulos de dominio (Router -> Controller -> Service -> Model)
│   │   ├── app.ts          # Configuración de Express (exportable para Supertest)
│   │   └── server.ts       # Arranque del servidor HTTP y conexión DB
│   └── tests/              # Pruebas unitarias y de integración (Vitest + Supertest)
└── frontend/               # Aplicación Angular Standalone + Vitest
    └── src/
```

---

## 3. Reglas de Arquitectura Backend

### 3.1 Arquitectura Modular por Capas (`Router -> Controller -> Service -> Model`)

Todo endpoint y módulo de negocio debe respetar estrictamente el flujo unidireccional por capas:

```text
HTTP Request -> Router -> Controller -> Service -> Model (Sequelize) -> PostgreSQL
```

1. **Router (`*.router.ts`)**:
   - Define rutas Express, middlewares específicos de ruta (autenticación, validación de esquema) y anotaciones OpenAPI/Swagger.
   - Delega el manejo de la petición al `Controller`.
   - **Prohibido**: contener lógica de negocio o importar modelos de Sequelize directamente.

2. **Controller (`*.controller.ts`)**:
   - Actúa como adaptador HTTP: extrae `params`, `query`, `body` y contexto de `Request`, invoca el `Service` correspondiente y retorna respuestas JSON estandarizadas con códigos HTTP apropiados (delegando errores a `next(err)`).
   - **Prohibido**: acceder a modelos Sequelize, ejecutar consultas SQL o contener reglas de negocio complejas.

3. **Service (`*.service.ts`)**:
   - Contiene toda la lógica de negocio, validaciones de dominio, manejo de transacciones y coordinación entre modelos.
   - Es agnóstico al transporte HTTP (**prohibido** importar `Request` o `Response` de Express).
   - Interactúa con la capa `Model`.

4. **Model (`*.model.ts`)**:
   - Define los atributos, tipos TypeScript, asociaciones, validaciones de integridad y opciones de Sequelize.
   - **Prohibido**: depender de `Controller` o `Router`.

### 3.2 Soft Delete Obligatorio en Sequelize (`paranoid: true`)

- **Todos** los modelos de negocio en Sequelize **DEBEN** configurarse con:
  - `paranoid: true`
  - `timestamps: true`
  - `underscored: true` (convención `snake_case` en PostgreSQL: `created_at`, `updated_at`, `deleted_at`)
- Toda operación `destroy()` ejecutará un borrado lógico poblando `deleted_at`. El borrado físico (`force: true`) queda restringido a pruebas o tareas administrativas explícitamente justificadas.
- Todas las migraciones que creen tablas asociadas a modelos con `paranoid: true` **DEBEN** incluir la columna `deleted_at` (`type: DataTypes.DATE, allowNull: true`).

### 3.3 Migraciones, Seeders y Base de Datos

- Los cambios de esquema se gestionan exclusivamente mediante **migraciones** de Sequelize (`backend/src/database/migrations/`).
- Está prohibido utilizar `sequelize.sync({ force: true })` o `sequelize.sync({ alter: true })` en entornos productivos.
- Los datos iniciales o de catálogo se gestionan mediante **seeders** (`backend/src/database/seeders/`).

### 3.4 Documentación Swagger y Salud

- Toda nueva ruta de API debe documentarse en OpenAPI 3.0 para exponerse en `/api-docs` y `/api-docs.json`.
- El backend debe exponer un endpoint `/health` (sin estado, con verificación ligera de disponibilidad) para health checks de balanceadores de carga / AWS ECS / ALB.

---

## 4. Reglas de Arquitectura Frontend (Angular)

- Utilizar la última versión de Angular con **Standalone Components** exclusivamente (sin `NgModule`).
- Organizar el código por funcionalidad (`features/`), servicios transversales (`core/`) y componentes/utilidades reutilizables (`shared/`).
- Preferir `inject()` para inyección de dependencias, `provideHttpClient()` con interceptores funcionales, `provideRouter()` con lazy loading basado en componentes/rutas standalone y Signals para estado reactivo local.
- TypeScript estricto (`strict: true`) habilitado.

---

## 5. Reglas de Testing (Vitest & Supertest)

- **Backend**: Vitest + Supertest.
  - Exportar la instancia `app` de Express separada de `server.ts` (`app.listen`) para ejecutar pruebas HTTP con Supertest sin abrir puertos reales innecesariamente.
  - Probar controladores, servicios (mocking/aislamiento) y rutas HTTP end-to-end contra contrato.
  - Comando obligatorio: `pnpm test`.
- **Frontend**: Vitest (sin Karma/Jasmine).
  - Pruebas unitarias de componentes standalone, servicios y pipes ejecutadas con Vitest.
  - Comando obligatorio: `pnpm test`.
- Ninguna fase se considera terminada si `pnpm build` (o `typecheck`) o `pnpm test` fallan en `backend/` o `frontend/`.

---

## 6. Preparación para Infraestructura y Deploy en AWS

- **Local**: PostgreSQL 16 levantado mediante `docker-compose.yml` en la raíz con volumen persistente y `healthcheck`.
- **Configuración 12-Factor (AWS-ready)**:
  - Toda configuración sensible o dependiente de entorno se inyecta por variables de entorno (documentadas en `.env.example`; nunca commitear `.env`).
  - Soporte en backend para conexión PostgreSQL por parámetros discretos (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) o `DATABASE_URL` y SSL configurable (`DB_SSL=true` para AWS RDS).
  - Backend stateless preparado para ejecutarse detrás de AWS ALB / ECS Fargate / EC2, con apagado graceful (`SIGTERM`/`SIGINT`) y endpoint `/health`.
  - Frontend compilado como artefacto estático (`dist/`) listo para despliegue en AWS S3 + CloudFront.
