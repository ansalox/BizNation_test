## Arquitectura del Sistema

```mermaid
flowchart TB
    classDef client fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc
    classDef awsFront fill:#0f172a,stroke:#f59e0b,stroke-width:2px,color:#fef3c7
    classDef awsBack fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#d1fae5
    classDef awsDb fill:#0f172a,stroke:#6366f1,stroke-width:2px,color:#e0e7ff
    classDef cicd fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#f3e8ff
    classDef external fill:#3f1d2e,stroke:#f43f5e,stroke-width:2px,color:#ffe4e6

    subgraph Clients["Usuarios e Integraciones Externas"]
        direction LR
        Admin["👤 Administrador<br/>(Dashboard, Cursos, Alertas IA)"]:::client
        Student["🎓 Estudiante<br/>(Catálogo, Lecciones, Progreso)"]:::client
        Meta["💬 WhatsApp / Meta<br/>(Webhook Simulado + HMAC-SHA256)"]:::external
    end

    subgraph CICD["CI/CD (GitHub Actions)"]
        GHA["⚙️ Pipeline Automatizado<br/>1. pnpm test (Vitest + Supertest)<br/>2. pnpm build (Backend & Angular)<br/>3. Deploy automático a AWS"]:::cicd
    end

    subgraph AWS["Infraestructura en AWS"]
        direction TB

        subgraph FrontLayer["Capa Frontend (SPA Angular)"]
            CF["🌐 Amazon CloudFront<br/>(CDN + HTTPS + Reglas SPA 403/404)"]:::awsFront
            S3["🪣 Amazon S3<br/>(Build Estático Angular)"]:::awsFront
            CF --> S3
        end

        subgraph BackLayer["Capa Backend (AWS App Runner - Docker / Node.js)"]
            direction TB
            Express["🚀 API REST: Express.js + TypeScript<br/>Arquitectura Modular por Capas<br/>(Router → Controller → Service → Model)"]:::awsBack
            
            subgraph Middlewares["Seguridad y Estándares"]
                MW1["🔐 Auth JWT & RBAC<br/>(Admin / Student)"]:::awsBack
                MW2["🛡️ Validador HMAC-SHA256<br/>(x-hub-signature-256)"]:::awsBack
                SW["📄 Swagger UI<br/>(/api/docs)"]:::awsBack
            end

            subgraph Modules["Módulos de Dominio"]
                M1["📚 Core Educativo<br/>Users, Courses, Lessons, Progress<br/>(Paginación, Filtros, Regla 409)"]:::awsBack
                M2["🔗 Webhooks<br/>Idempotencia (external_event_id)"]:::awsBack
                M3["🤖 Automatización e IA Básica<br/>Scoring, Clasificación y Alertas"]:::awsBack
            end

            Express --> Middlewares
            Middlewares --> Modules
        end

        subgraph DataLayer["Capa de Datos"]
            RDS[("🐘 Amazon RDS (PostgreSQL 16)<br/>ORM: Sequelize<br/>Soft Delete (paranoid: true)<br/>Migraciones & Seeders")]:::awsDb
        end
    end

    Admin & Student -->|"HTTPS"| CF
    CF -->|"API REST + Bearer JWT"| Express
    Meta -->|"POST /api/webhooks/whatsapp<br/>(Firma HMAC)"| MW2
    Modules -->|"Sequelize ORM (TCP 5432)"| RDS
    GHA -.->|"Deploy Frontend"| S3
    GHA -.->|"Deploy Backend"| Express
```

> **Nota de escalamiento (Fase 2 en producción):** Para soportar alto volumen de eventos entrantes en Biz Nation sin bloquear el API principal, el módulo de webhooks se desacoplará incorporando **Amazon SQS** con una **Dead Letter Queue (DLQ)**. El endpoint responderá `200 OK` de inmediato tras validar la firma HMAC-SHA256 y encolar el payload, delegando a un *worker* los reintentos asíncronos con *backoff* exponencial, control de idempotencia y protección frente a caídas del proveedor.