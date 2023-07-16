import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Deployment, IResource, IRestApi, Resource, RestApi, Stage } from 'aws-cdk-lib/aws-apigateway';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { LambdaIntegrationNoPermission } from './apigatewayintgeration';

interface ApiGatewayProps extends NestedStackProps {
    userAuthMicroservice: IFunction,
}

export class ApiGatewayStack extends NestedStack {

    constructor(scope: Construct, id: string, props: ApiGatewayProps) {
        super(scope, id, props);

        const restApi = new RestApi(this, `${process.env.STAGE}-InfinyxApi`, {
            restApiName: `${process.env.STAGE}-infinyx-api`,
            defaultCorsPreflightOptions: {
                allowOrigins: [process.env.WebUrl || '']
            },
            deploy: false
        });
        restApi.root.addMethod('ANY');
        const v1 = restApi.root.addResource('v1');

        if (process.env.LOCAL_DEBUG) {
            createUserAuthFunction(props.userAuthMicroservice, restApi, v1);

            const deployment = new Deployment(this, `infinyx-deployment-${new Date().toISOString()}`, {
                api: restApi,
                retainDeployments: true
            });

            const stage = new Stage(this, `${process.env.STAGE}-stage`, {
                deployment,
                stageName: process.env.STAGE
            })

            restApi.deploymentStage = stage;
        }
        else {
            new CommonStack(this, {
                restApiId: restApi.restApiId,
                restApiRootResourceId: restApi.restApiRootResourceId,
                function: props.userAuthMicroservice,
                v1ResourceId: v1.resourceId
            });
            new DeployStack(this, {
                restApiId: restApi.restApiId,
                restApiRootResourceId: restApi.restApiRootResourceId,
            });
        }
    }
}

interface ResourceNestedStackProps extends NestedStackProps {
    readonly restApiId: string,
    readonly restApiRootResourceId: string,
    function: IFunction,
    v1ResourceId: string
}

class CommonStack extends NestedStack {
    constructor(scope: Construct, props: ResourceNestedStackProps) {
        super(scope, `${process.env.STAGE}-InfinyxApi-CommonStack`, props);

        const api = RestApi.fromRestApiAttributes(this, `${process.env.STAGE}-InfinyxApi`, {
            restApiId: props.restApiId,
            rootResourceId: props.restApiRootResourceId
        });

        const v1 = Resource.fromResourceAttributes(this, 'V1Resource', {
            restApi: api,
            resourceId: props.v1ResourceId,
            path: '/v1',
        });

        createUserAuthFunction(props.function, api, v1);
    }
}

interface DeployStackProps extends NestedStackProps {
    readonly restApiId: string,
    readonly restApiRootResourceId: string,
}

class DeployStack extends NestedStack {
    constructor(scope: Construct, props: DeployStackProps) {
        super(scope, `${process.env.STAGE}-InfinyxApi-DeployStack`, props);

        const api = RestApi.fromRestApiAttributes(this, `${process.env.STAGE}-InfinyxApi`, {
            restApiId: props.restApiId,
            rootResourceId: props.restApiRootResourceId
        })

        const deployment = new Deployment(this, `infinyx-deployment-${new Date().toISOString()}`, {
            api,
            retainDeployments: true
        });

        const stage = new Stage(this, `${process.env.STAGE}-stage`, {
            deployment,
            stageName: process.env.STAGE
        })

        api.deploymentStage = stage;
    }
}

function createUserAuthFunction(commonMicroservice: IFunction, api: IRestApi, v1: IResource) {
    const integration = new LambdaIntegrationNoPermission(commonMicroservice);

    const auth = v1.addResource('auth', {
        defaultIntegration: integration
    });
    auth.addMethod('GET');

    // Manually add the permission, specifying with the API function arnForExecuteApi empty params means for all methods, paths and stages
    commonMicroservice.addPermission(`${process.env.STAGE}-commonapi-permissions`, {
        action: 'lambda:InvokeFunction',
        principal: new ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn: api.arnForExecuteApi()
    });
}