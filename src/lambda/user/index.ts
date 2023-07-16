import { APIGatewayEvent, APIGatewayProxyCallback, Context } from 'aws-lambda';
import { Sequelize } from 'sequelize';
import { ErrorType } from '../../core/enum/error-type.enum';
import { DefaultHeaders, SequelizeConfig } from '../../core/constant';

let sequelize: Sequelize;
let token: string;

export const handler = async (event: APIGatewayEvent, context: Context, callback: APIGatewayProxyCallback) => {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);

    try {
        await initialiseClientServices();

        await loadModel();
        await sequelize.sync();

        return await apiGatewayInvocation(event, callback);
    } finally {
        await sequelize.connectionManager.close();
    }
}

function initialiseGlobalVariables() {
    token = '';
}

async function initialiseClientServices() {
    if (!sequelize) {
        sequelize = await loadSequelize();
    } else {
        // restart connection pool to ensure connections are not re-used across invocations
        sequelize.connectionManager.initPools();

        // restore `getConnection()` if it has been overwritten by `close()`
        if (sequelize.connectionManager.hasOwnProperty("getConnection")) {
            delete sequelize.connectionManager.getConnection;
        }
    }

    //Give some time for extension layer to initialise to prevent 400 bad request when get secret
    initialiseGlobalVariables();
}

async function apiGatewayInvocation(event: APIGatewayEvent, callback: APIGatewayProxyCallback) {
    let { httpMethod: method, resource, queryStringParameters: params, headers } = event;
    let body: any, response;

    try {
        switch (method) {
            case "GET":
                if (resource == "/v1/auth") {
                    response = await auth();
                }
        }

        console.log('response: ', JSON.stringify(response));
        callback(null, {
            statusCode: 200,
            body: JSON.stringify({
                result: response,
            }),
            headers: DefaultHeaders
        });

    } catch (e: any) {
        console.error(e);
        let statusCode = 400;

        if (e?.code == ErrorType.NotAuthorizedException) {
            statusCode = 401;
        }

        callback(null, {
            statusCode: statusCode,
            body: JSON.stringify({
                message: "Failed to perform operation.",
                errorCode: e.code || ErrorType[e.name],
                errorName: e.name,
                errorMsg: e.message,
                errorData: e.data
            }),
            headers: DefaultHeaders
        });
    }
}

async function loadSequelize() {
    const sequelize = SequelizeConfig;
    await sequelize.authenticate();
    return sequelize;
}

async function loadModel() {
    // sequelize.define('AdminSetting', AdminSettingsSequelizeModel, {
    //     tableName: 'admin_settings'
    // });
}

async function auth(): Promise<any> {
    return 'success';
}