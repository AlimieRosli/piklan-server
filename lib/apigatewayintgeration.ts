import { IntegrationConfig, LambdaIntegration, LambdaIntegrationOptions, Method } from 'aws-cdk-lib/aws-apigateway';
import { CfnPermission, IFunction } from 'aws-cdk-lib/aws-lambda';

export class LambdaIntegrationNoPermission extends LambdaIntegration {
    constructor(handler: IFunction, options?: LambdaIntegrationOptions) {
        super(handler, options);
    }

    bind(method: Method): IntegrationConfig {
        const integrationConfig = super.bind(method);
        const permissions = method.node.children.filter(c => c instanceof CfnPermission);
        permissions.forEach(p => method.node.tryRemoveChild(p.node.id));
        return integrationConfig;
    }
}