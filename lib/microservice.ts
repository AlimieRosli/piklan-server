import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';

export class Microservices extends Construct {

    public readonly userAuthMicroservice: NodejsFunction;

    private readonly environment = {
        'NODE_ENV': process.env.NODE_ENV || '',
        'STAGE': process.env.STAGE || '',
        'RDS_host': process.env.RDS_host || '',
        'RDS_port': process.env.RDS_port || '',
        'RDS_username': process.env.RDS_username || '',
        'RDS_password': process.env.RDS_password || '',
        'RDS_dbName': process.env.RDS_dbName || '',
        'WebUrl': process.env.WebUrl || '',
    }

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.userAuthMicroservice = this.createApp2c2pFunction();
    }

    private getNodeJsFunctionProps(name: string): NodejsFunctionProps {
        return {
            bundling: {
                externalModules: [
                    'aws-sdk'
                ]
            },
            environment: this.environment,
            functionName: `${process.env.STAGE}-PiklanStack-${name}LambdaFunction`,
            memorySize: 256,
            runtime: Runtime.NODEJS_16_X,
            timeout: Duration.minutes(3),
        };
    }

    private createApp2c2pFunction(): NodejsFunction {
        return new NodejsFunction(this, `${process.env.STAGE}-UserAuthLambdaFunction`, {
            entry: join(__dirname, `/../src/lambda/user-auth/index.js`),
            ...this.getNodeJsFunctionProps("App2c2p")
        })
    }
}