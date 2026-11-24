'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('support_alerts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      webhook_event_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'webhook_events',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      external_event_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      sender: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      message_text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      intent: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      sentiment: {
        type: Sequelize.ENUM('positive', 'neutral', 'negative'),
        allowNull: false,
        defaultValue: 'neutral',
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'low',
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      matched_keywords: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      requires_attention: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      status: {
        type: Sequelize.ENUM('open', 'reviewed', 'resolved'),
        allowNull: false,
        defaultValue: 'open',
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

    await queryInterface.addIndex('support_alerts', ['webhook_event_id'], {
      name: 'support_alerts_webhook_event_id_idx',
    });
    await queryInterface.addIndex('support_alerts', ['priority'], {
      name: 'support_alerts_priority_idx',
    });
    await queryInterface.addIndex('support_alerts', ['sentiment'], {
      name: 'support_alerts_sentiment_idx',
    });
    await queryInterface.addIndex('support_alerts', ['status'], {
      name: 'support_alerts_status_idx',
    });
    await queryInterface.addIndex('support_alerts', ['deleted_at'], {
      name: 'support_alerts_deleted_at_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('support_alerts');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_support_alerts_sentiment";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_support_alerts_priority";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_support_alerts_status";',
    );
  },
};
