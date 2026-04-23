import db from './_helpers/db';

(async () => {
  try {
    await db.sequelize.sync();
    const accounts = await db.Account.findAll({
      attributes: ['id', 'email', 'role', 'firstName', 'lastName']
    });
    console.log('=== ACCOUNTS IN DATABASE ===');
    if (accounts.length === 0) {
      console.log('No accounts found. Database is empty.');
    } else {
      accounts.forEach((a, i) => {
        console.log(`${i + 1}. ID: ${a.id}`);
        console.log(`   Email: ${a.email}`);
        console.log(`   Role: ${a.role}`);
        console.log(`   Name: ${a.firstName} ${a.lastName}`);
        console.log('---');
      });
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await db.sequelize.close();
  }
})();
