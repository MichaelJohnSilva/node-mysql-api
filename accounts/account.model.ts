import { DataTypes } from 'sequelize';

export default function accountModel(sequelize: any) {
    sequelize.define('Account', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('Admin', 'User'),
            defaultValue: 'User'
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        verificationToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        verified: {
            type: DataTypes.VIRTUAL,
            get() {
                return !!(this as any).getDataValue('verificationToken') === false;
            }
        },
        resetToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        resetTokenExpires: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        defaultScope: {
            attributes: { exclude: ['password'] }
        },
        scopes: {
            withHash: {
                attributes: { include: ['password'] }
            }
        }
    });
    return sequelize.models.Account;
}
