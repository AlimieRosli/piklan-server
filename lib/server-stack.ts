import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Microservices } from "./microservice";
import { ApiGatewayStack } from "./apigateway";

export class ServerStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const microservices = new Microservices(this, "Microservices");

        const apigatewayStack = new ApiGatewayStack(this, "ApiGatewayStack", {
            userAuthMicroservice: microservices.userAuthMicroservice,
        });
    }
}
