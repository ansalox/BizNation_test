'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('webhook_events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      external_event_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      provider: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'whatsapp_meta',
      },
      event_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('received', 'processed', 'failed'),
        allowNull: false,
        defaultValue: 'received',
      },
      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      error_log: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('webhook_events', ['external_event_id'], {
      name: 'webhook_events_external_event_id_active_unique',
      unique: true,
      where: { deleted_at: null },
    });
    await queryInterface.addIndex('webhook_events', ['provider'], {
      name: 'webhook_events_provider_idx',
    });
    await queryInterface.addIndex('webhook_events', ['status'], {
      name: 'webhook_events_status_idx',
    });
    await queryInterface.addIndex('webhook_events', ['created_at'], {
      name: 'webhook_events_created_at_idx',
    });
    await queryInterface.addIndex('webhook_events', ['deleted_at'], {
      name: 'webhook_events_deleted_at_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('webhook_events');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_webhook_events_status";',
    );
  },
};
