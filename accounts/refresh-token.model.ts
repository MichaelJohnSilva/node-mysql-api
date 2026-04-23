import { DataTypes } from 'sequelize';

export default function refreshTokenModel(sequelize: any) {
    return sequelize.define('RefreshToken', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false
        },
        expires: {
            type: DataTypes.DATE,
            allowNull: false
        },
        createdByIp: {
            type: DataTypes.STRING,
            allowNull: true
        },
        revoked: {
            type: DataTypes.DATE,
            allowNull: true
        },
        revokedByIp: {
            type: DataTypes.STRING,
            allowNull: true
        },
        replacedByToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isExpired: {
            type: DataTypes.VIRTUAL,
            get() {
                return Date.now() >= (this as any).getDataValue('expires').getTime();
            }
        },
        isActive: {
            type: DataTypes.VIRTUAL,
            get() {
                return !this.revoked && !this.isExpired;
            }
        }
    });
}
