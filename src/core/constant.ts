import * as mysql2 from 'mysql2';
import { Sequelize } from 'sequelize';

export const DefaultHeaders: any = {
    "Access-Control-Allow-Origin": process.env.WebUrl
};

export const SequelizeConfig: Sequelize = new Sequelize(
    process.env['RDS_dbName'] || "",
    process.env['RDS_username'] || "",
    process.env['RDS_password'],
    {
        define: {
            paranoid: true
        },
        dialect: 'mysql',
        dialectModule: mysql2,
        dialectOptions: {
            connectTimeout: 25000,
        },
        host: process.env['RDS_host'],
        logging: console.log,
        port: process.env['RDS_port'] ? Number.parseInt(process.env['RDS_port']) : undefined,
        pool: {
            max: 2,
            min: 0,
            idle: 0,
            acquire: 3000,
        }
    }
);