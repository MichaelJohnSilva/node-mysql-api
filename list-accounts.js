const mysql = require('mysql2/promise');

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'node_mysql_api'
    });
    
    const [rows] = await connection.query('SELECT id, email, role, firstName, lastName FROM Account');
    console.log('=== ACCOUNTS IN DATABASE ===');
    if (rows.length === 0) {
      console.log('No accounts found. Database is empty.');
    } else {
      rows.forEach((row, i) => {
        console.log(`${i + 1}. ID: ${row.id}`);
        console.log(`   Email: ${row.email}`);
        console.log(`   Role: ${row.role}`);
        console.log(`   Name: ${row.firstName || ''} ${row.lastName || ''}`);
        console.log('---');
      });
    }
    
    await connection.end();
  } catch (err) {
    console.error('Database error:', err.message);
  }
})();
