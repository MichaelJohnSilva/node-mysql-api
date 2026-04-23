const mysql = require('mysql2/promise');

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: ''
    });
    
    // Show all databases
    const [databases] = await connection.query('SHOW DATABASES');
    console.log('Databases:', databases);
    
    // Check if node_mysql_api exists and show its tables
    try {
      const [tables] = await connection.query('SHOW TABLES FROM node_mysql_api');
      console.log('\nTables in node_mysql_api:', tables);
    } catch (e) {
      console.log('\nDatabase node_mysql_api does not exist or has no tables');
    }
    
    await connection.end();
  } catch (err) {
    console.error('MySQL connection error:', err.message);
  }
})();
