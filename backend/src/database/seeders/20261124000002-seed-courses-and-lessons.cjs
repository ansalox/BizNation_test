'use strict';

const COURSE_IDS = {
  entrepreneurship: '20000000-0000-4000-8000-000000000001',
  finance: '20000000-0000-4000-8000-000000000002',
  growth: '20000000-0000-4000-8000-000000000003',
};

const LESSON_IDS = [
  '30000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000002',
  '30000000-0000-4000-8000-000000000003',
  '30000000-0000-4000-8000-000000000004',
  '30000000-0000-4000-8000-000000000005',
  '30000000-0000-4000-8000-000000000006',
  '30000000-0000-4000-8000-000000000007',
  '30000000-0000-4000-8000-000000000008',
  '30000000-0000-4000-8000-000000000009',
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert(
      'courses',
      [
        {
          id: COURSE_IDS.entrepreneurship,
          title: 'Fundamentos de Emprendimiento Digital',
          description:
            'Aprende a validar ideas de negocio, construir un MVP y encontrar Product-Market Fit.',
          is_published: true,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: COURSE_IDS.finance,
          title: 'Finanzas y Rentabilidad para Startups',
          description:
            'Domina el flujo de caja, unit economics, CAC, LTV y proyecciones financieras.',
          is_published: true,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: COURSE_IDS.growth,
          title: 'Estrategia de Crecimiento y Ventas B2B',
          description:
            'Diseña embudos de adquisición, prospección consultiva y retención de clientes.',
          is_published: true,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
      ],
      { ignoreDuplicates: true },
    );

    await queryInterface.bulkInsert(
      'lessons',
      [
        {
          id: LESSON_IDS[0],
          course_id: COURSE_IDS.entrepreneurship,
          title: 'Identificación del problema y propuesta de valor',
          content: 'Metodologías prácticas para entrevistar usuarios y definir el dolor real.',
          order_index: 1,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: LESSON_IDS[1],
          course_id: COURSE_IDS.entrepreneurship,
          title: 'Diseño de MVP con recursos mínimos',
          content: 'Cómo lanzar experimentos rápidos sin sobre-ingeniería.',
          order_index: 2,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: LESSON_IDS[2],
          course_id: COURSE_IDS.entrepreneurship,
          title: 'Métricas tempranas de validación',
          content: 'Indicadores cualitativos y cuantitativos de tracción inicial.',
          order_index: 3,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: LESSON_IDS[3],
          course_id: COURSE_IDS.finance,
          title: 'Estructura de costos y punto de equilibrio',
          content: 'Diferenciación entre costos fijos, variables y cálculo de breakeven.',
          order_index: 1,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: LESSON_IDS[4],
          course_id: COURSE_IDS.finance,
          title: 'Unit Economics: CAC vs LTV',
          content: 'Cómo medir la sostenibilidad económica por cliente adquirido.',
          order_index: 2,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: LESSON_IDS[5],
          course_id: COURSE_IDS.finance,
          title: 'Presupuesto y gestión de runway',
          content: 'Planificación de caja a 12-18 meses y escenarios de sensibilidad.',
          order_index: 3,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: LESSON_IDS[6],
          course_id: COURSE_IDS.growth,
          title: 'Definición de ICP y Buyer Persona B2B',
          content: 'Segmentación de cuentas objetivo y decisores clave.',
          order_index: 1,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: LESSON_IDS[7],
          course_id: COURSE_IDS.growth,
          title: 'Playbook de prospección y calificación',
          content: 'Secuencias multicanal y frameworks de descubrimiento consultivo.',
          order_index: 2,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: LESSON_IDS[8],
          course_id: COURSE_IDS.growth,
          title: 'Onboarding y expansión de cuentas',
          content: 'Cómo reducir churn y aumentar Net Revenue Retention.',
          order_index: 3,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
      ],
      { ignoreDuplicates: true },
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('lessons', {
      id: LESSON_IDS,
    });
    await queryInterface.bulkDelete('courses', {
      id: Object.values(COURSE_IDS),
    });
  },
};
