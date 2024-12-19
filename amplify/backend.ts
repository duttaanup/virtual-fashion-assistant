import { defineBackend } from '@aws-amplify/backend';
import { Stack } from "aws-cdk-lib";
import { auth } from "./auth/resource";
import {
    AuthorizationType,
    CognitoUserPoolsAuthorizer,
    Cors,
    LambdaIntegration,
    RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { dbApiFunction , aiApiFunction , confyApiFunction } from "./functions/api-function/resource";

const backend = defineBackend({
 auth, dbApiFunction, aiApiFunction , confyApiFunction 
});

const apiStack = backend.createStack("vfa-api-stack");
const vfaAPI = new RestApi(apiStack, "vfaAPI", {
    restApiName: "vfaAPI",
    deploy: true,
    deployOptions: {
        stageName: "dev",
    },
    defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS, // Restrict this to domains you trust
        allowMethods: Cors.ALL_METHODS, // Specify only the methods you need to allow
        allowHeaders: Cors.DEFAULT_HEADERS, // Specify only the headers you need to allow
    },
});

const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
    cognitoUserPools: [backend.auth.resources.userPool],
});

const dblambdaIntegration = new LambdaIntegration(backend.dbApiFunction.resources.lambda);
const ailambdaIntegration = new LambdaIntegration(backend.aiApiFunction.resources.lambda);
const confylambdaIntegration = new LambdaIntegration(backend.confyApiFunction.resources.lambda);


const authConfig = { authorizationType: AuthorizationType.COGNITO,authorizer: cognitoAuth}
const dbPath = vfaAPI.root.addResource("db");
dbPath.addMethod("GET", dblambdaIntegration, authConfig);
dbPath.addMethod("POST", dblambdaIntegration, authConfig);

const aiPath = vfaAPI.root.addResource("ai");
aiPath.addMethod("GET", ailambdaIntegration, authConfig);
aiPath.addMethod("POST", ailambdaIntegration, authConfig);

const confyPath = vfaAPI.root.addResource("confy");
confyPath.addMethod("GET", confylambdaIntegration, authConfig);
confyPath.addMethod("POST", confylambdaIntegration, authConfig);


const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
    statements: [
        new PolicyStatement({
            actions: ["execute-api:Invoke"],
            resources: [
                `${vfaAPI.arnForExecuteApi("*", "/ai", "dev")}`,
                `${vfaAPI.arnForExecuteApi("*", "/confy", "dev")}`,
                `${vfaAPI.arnForExecuteApi("*", "/db", "dev")}`,
            ],
        }),
    ],
});

backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
    apiRestPolicy
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
    apiRestPolicy
);

backend.addOutput({
    custom: {
        API: {
            [vfaAPI.restApiName]: {
                endpoint: vfaAPI.url,
                region: Stack.of(vfaAPI).region,
                apiName: vfaAPI.restApiName,
            },
        },
    },
});