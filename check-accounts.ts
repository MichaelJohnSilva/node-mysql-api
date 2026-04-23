import db from './_helpers/db';

(async () => {
  try {
    await db.sequelize.sync();
    const accounts = await db.Account.findAll();
    console.log('All accounts:');
    accounts.forEach(a => {
      console.log({
        id: a.id,
        email: a.email,
        role: a.role,
        hasVerificationToken: !!a.verificationToken
      });
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await db.sequelize.close();
  }
})();
