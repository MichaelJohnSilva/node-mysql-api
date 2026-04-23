import config from '../config.json';
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
        const { host, port, user, password, database } = config.database;
        
        const connection = await mysql.createConnection({ host, port, user, password });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
        await connection.end();

        db.sequelize = new Sequelize(database, user, password, { dialect: 'mysql' });

        db.Account = accountModel(db.sequelize);
        db.RefreshToken = refreshTokenModel(db.sequelize);

        db.Account.hasMany(db.RefreshToken, { foreignKey: 'AccountId', onDelete: 'CASCADE' });
        db.RefreshToken.belongsTo(db.Account, { foreignKey: 'AccountId' });

        await db.sequelize.sync();
        console.log('Database synchronized');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}
