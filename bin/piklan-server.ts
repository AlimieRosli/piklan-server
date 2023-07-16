import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ServerStack } from "../lib/server-stack";

const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, `../env/.env.${process.env.NODE_ENV || "dev"}`) });

const app = new cdk.App();
new ServerStack(app, `${process.env.STAGE}-ServerStack`, {
    /* If you don't specify 'env', this stack will be environment-agnostic.
     * Account/Region-dependent features and context lookups will not work,
     * but a single synthesized template can be deployed anywhere. */

    env: { account: "263582900965", region: "ap-southeast-1" },
});
