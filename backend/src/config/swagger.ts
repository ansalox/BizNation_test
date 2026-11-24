import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

const apisGlob = [
  path.resolve(__dirname, '../modules/**/*.router.{ts,js}').replace(/\\/g, '/'),
  path.resolve(__dirname, '../modules/**/*.controller.{ts,js}').replace(/\\/g, '/'),
];

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Biz Nation API',
      version: '1.0.0',
      description:
        'API RESTful construida con Express, TypeScript, PostgreSQL y Sequelize siguiendo arquitectura modular por capas (Router -> Controller -> Service -> Model) con soft delete (`paranoid: true`) y autenticación Bearer JWT.',
    },
    servers: [
      {
        url: '/',
        description: 'Current Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT obtenido en /api/auth/login o /api/auth/register',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Validation failed' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Laura Gómez' },
            email: { type: 'string', format: 'email', example: 'laura.gomez@biznation.com' },
            role: { type: 'string', enum: ['admin', 'student'], example: 'student' },
            classification: { type: 'string', nullable: true, example: 'beginner' },
            last_activity_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            deleted_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        AuthRegisterInput: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2, example: 'Nuevo Estudiante' },
            email: { type: 'string', format: 'email', example: 'estudiante@biznation.com' },
            password: { type: 'string', minLength: 6, example: 'Secret123!' },
            classification: { type: 'string', nullable: true, example: 'beginner' },
          },
        },
        AuthLoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@biznation.com' },
            password: { type: 'string', example: 'Admin123!' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                token: { type: 'string' },
              },
            },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Fundamentos de Emprendimiento Digital' },
            description: { type: 'string', example: 'Aprende a validar ideas de negocio y construir un MVP.' },
            is_published: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            deleted_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        CourseAdminMetrics: {
          type: 'object',
          properties: {
            totalStudentsWithProgress: { type: 'integer', example: 12 },
            averageProgressPercentage: { type: 'number', example: 66.67 },
          },
        },
        CourseWithRoleMetrics: {
          allOf: [
            { $ref: '#/components/schemas/Course' },
            {
              type: 'object',
              properties: {
                lessons: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Lesson' },
                },
                totalLessons: { type: 'integer', example: 3 },
                completedLessons: {
                  type: 'integer',
                  example: 2,
                  description: 'Presente para rol student',
                },
                progressPercentage: {
                  type: 'number',
                  example: 66.67,
                  description: 'Presente para rol student (0-100)',
                },
                metrics: {
                  $ref: '#/components/schemas/CourseAdminMetrics',
                  description: 'Presente para rol admin',
                },
              },
            },
          ],
        },
        PaginatedCoursesResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/CourseWithRoleMetrics' },
            },
            total: { type: 'integer', example: 3 },
            page: { type: 'integer', example: 1 },
            totalPages: { type: 'integer', example: 1 },
          },
        },
        CourseInput: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', example: 'Curso de Estrategia Digital' },
            description: { type: 'string', example: 'Descripción detallada del curso' },
            is_published: { type: 'boolean', example: true },
          },
        },
        Lesson: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            course_id: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Identificación del problema' },
            content: { type: 'string', example: 'Contenido teórico y práctico de la lección' },
            order_index: { type: 'integer', example: 1 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            deleted_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        LessonInput: {
          type: 'object',
          required: ['course_id', 'title'],
          properties: {
            course_id: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Lección 1: Propuesta de Valor' },
            content: { type: 'string', example: 'Desarrollo del lienzo de propuesta de valor.' },
            order_index: { type: 'integer', example: 1 },
          },
        },
        LessonProgress: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            course_id: { type: 'string', format: 'uuid' },
            lesson_id: { type: 'string', format: 'uuid' },
            completed: { type: 'boolean', example: true },
            completed_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            deleted_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        LessonProgressInput: {
          type: 'object',
          required: ['course_id', 'lesson_id'],
          properties: {
            user_id: { type: 'string', format: 'uuid', description: 'Opcional para admin; para student se usa el usuario autenticado' },
            course_id: { type: 'string', format: 'uuid' },
            lesson_id: { type: 'string', format: 'uuid' },
            completed: { type: 'boolean', example: true },
          },
        },
        WebhookEvent: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            external_event_id: { type: 'string', example: 'wamid.HBgLMjAyNjExMjQwMDAx' },
            provider: { type: 'string', example: 'whatsapp_meta' },
            event_type: { type: 'string', example: 'message.received' },
            payload: { type: 'object', additionalProperties: true },
            status: { type: 'string', enum: ['received', 'processed', 'failed'], example: 'processed' },
            attempts: { type: 'integer', example: 1 },
            error_log: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            deleted_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        WhatsAppWebhookInput: {
          type: 'object',
          properties: {
            external_event_id: { type: 'string', example: 'evt_whatsapp_001' },
            event_type: { type: 'string', example: 'message.received' },
            provider: { type: 'string', example: 'whatsapp_meta' },
            data: { type: 'object', additionalProperties: true },
          },
        },
        WebhookProcessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            duplicate: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Webhook event processed successfully' },
            data: { $ref: '#/components/schemas/WebhookEvent' },
          },
        },
        PaginatedWebhookEventsResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/WebhookEvent' },
            },
            total: { type: 'integer', example: 1 },
            page: { type: 'integer', example: 1 },
            totalPages: { type: 'integer', example: 1 },
          },
        },
        StudentReportItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Laura Gómez' },
            email: { type: 'string', format: 'email' },
            classification: {
              type: 'string',
              enum: ['Alto desempeño', 'En progreso', 'En riesgo', 'Inactivo'],
            },
            score: { type: 'integer', minimum: 0, maximum: 100, example: 84 },
            completionPercentage: { type: 'number', example: 73.33 },
            recencyScore: { type: 'integer', example: 100 },
            completedLessons: { type: 'integer', example: 7 },
            totalPublishedLessons: { type: 'integer', example: 9 },
            daysSinceLastActivity: { type: 'integer', nullable: true, example: 1 },
            last_activity_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        StudentsReportResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/StudentReportItem' },
            },
            summary: {
              type: 'object',
              properties: {
                totalStudents: { type: 'integer', example: 2 },
                averageScore: { type: 'number', example: 68.5 },
                byClassification: {
                  type: 'object',
                  additionalProperties: { type: 'integer' },
                },
              },
            },
          },
        },
        SupportAlert: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            webhook_event_id: { type: 'string', format: 'uuid' },
            external_event_id: { type: 'string' },
            sender: { type: 'string', nullable: true },
            message_text: { type: 'string', example: 'No entiendo la lección y tengo un error' },
            intent: { type: 'string', example: 'support_request' },
            sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
            score: { type: 'integer', example: 85 },
            matched_keywords: { type: 'array', items: { type: 'string' } },
            requires_attention: { type: 'boolean', example: true },
            status: { type: 'string', enum: ['open', 'reviewed', 'resolved'] },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        PaginatedSupportAlertsResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/SupportAlert' },
            },
            total: { type: 'integer', example: 1 },
            page: { type: 'integer', example: 1 },
            totalPages: { type: 'integer', example: 1 },
          },
        },
      },
    },
  },
  apis: apisGlob,
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
