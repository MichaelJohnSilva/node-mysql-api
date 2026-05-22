import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import accountModel from '../accounts/account.model';
import refreshTokenModel from '../accounts/refresh-token.model';
import { Op } from 'sequelize';

const db = {
    sequelize: null as any,
    Account: null as any,
    RefreshToken: null as any,
    Op: Op
};

export default db;

initialize();

async function initialize() {
    try {
        const host     = process.env.DB_HOST     || 'localhost';
        const port     = parseInt(process.env.DB_PORT || '3306');
        const user     = process.env.DB_USER     || 'root';
        const password = process.env.DB_PASSWORD || '';
        const database = process.env.DB_NAME     || 'node_mysql_api';

        // filess.io (and most managed MySQL hosts) pre-create the database —
        // skip CREATE DATABASE so we don't need SUPER/CREATE privileges.
        const isRemote = !!process.env.DB_HOST;
        if (!isRemote) {
            const connection = await mysql.createConnection({ host, port, user, password });
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
            await connection.end();
        }

        db.sequelize = new Sequelize(database, user, password, {
            host,
            port,
            dialect: 'mysql',
            dialectOptions: isRemote
                ? { ssl: { rejectUnauthorized: false } }   // filess.io requires SSL
                : {}
        });

        db.Account = accountModel(db.sequelize);
        db.RefreshToken = refreshTokenModel(db.sequelize);

        db.Account.hasMany(db.RefreshToken, { foreignKey: 'AccountId', onDelete: 'CASCADE' });
        db.RefreshToken.belongsTo(db.Account, { foreignKey: 'AccountId' });

        await db.sequelize.sync({ alter: true });
        console.log('Database synchronized');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}
