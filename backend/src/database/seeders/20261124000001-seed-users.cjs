'use strict';

const bcrypt = require('bcryptjs');

const SEED_USER_IDS = {
  admin: '10000000-0000-4000-8000-000000000001',
  student1: '10000000-0000-4000-8000-000000000002',
  student2: '10000000-0000-4000-8000-000000000003',
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const adminHash = bcrypt.hashSync('Admin123!', 10);
    const studentHash = bcrypt.hashSync('Student123!', 10);

    await queryInterface.bulkInsert(
      'users',
      [
        {
          id: SEED_USER_IDS.admin,
          name: 'Admin BizNation',
          email: 'admin@biznation.com',
          password_hash: adminHash,
          role: 'admin',
          classification: 'staff',
          last_activity_at: now,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: SEED_USER_IDS.student1,
          name: 'Laura Gómez',
          email: 'laura.gomez@biznation.com',
          password_hash: studentHash,
          role: 'student',
          classification: 'beginner',
          last_activity_at: now,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: SEED_USER_IDS.student2,
          name: 'Carlos Mendoza',
          email: 'carlos.mendoza@biznation.com',
          password_hash: studentHash,
          role: 'student',
          classification: 'intermediate',
          last_activity_at: now,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
      ],
      { ignoreDuplicates: true },
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      id: Object.values(SEED_USER_IDS),
    });
  },
};
