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
import { myApiFunction } from "./functions/api-function/resource";

const backend = defineBackend({
    auth, myApiFunction
});

const apiStack = backend.createStack("api-stack");
const myRestApi = new RestApi(apiStack, "RestApi", {
    restApiName: "myRestApi",
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

const lambdaIntegration = new LambdaIntegration(
    backend.myApiFunction.resources.lambda
);

const itemsPath = myRestApi.root.addResource("items", {
    defaultMethodOptions: {
        authorizationType: AuthorizationType.IAM,
    },
});

itemsPath.addMethod("GET", lambdaIntegration);
itemsPath.addMethod("POST", lambdaIntegration);
itemsPath.addMethod("DELETE", lambdaIntegration);
itemsPath.addMethod("PUT", lambdaIntegration);

itemsPath.addProxy({
    anyMethod: true,
    defaultIntegration: lambdaIntegration,
});


const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
    cognitoUserPools: [backend.auth.resources.userPool],
});

const booksPath = myRestApi.root.addResource("cognito-auth-path");
booksPath.addMethod("GET", lambdaIntegration, {
    authorizationType: AuthorizationType.COGNITO,
    authorizer: cognitoAuth,
});


const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
    statements: [
        new PolicyStatement({
            actions: ["execute-api:Invoke"],
            resources: [
                `${myRestApi.arnForExecuteApi("*", "/items", "dev")}`,
                `${myRestApi.arnForExecuteApi("*", "/items/*", "dev")}`,
                `${myRestApi.arnForExecuteApi("*", "/cognito-auth-path", "dev")}`,
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
            [myRestApi.restApiName]: {
                endpoint: myRestApi.url,
                region: Stack.of(myRestApi).region,
                apiName: myRestApi.restApiName,
            },
        },
    },
});