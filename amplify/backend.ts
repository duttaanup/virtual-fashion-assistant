import { defineBackend } from '@aws-amplify/backend';
import { aws_dynamodb, RemovalPolicy, Stack , aws_sqs, Duration} from "aws-cdk-lib";
import { auth } from "./auth/resource";
import { storage } from "./storage/resource";
import {
    AuthorizationType,
    CognitoUserPoolsAuthorizer,
    Cors,
    LambdaIntegration,
    IntegrationType, IntegrationOptions,
    PassthroughBehavior ,
    RestApi,
    Integration,
    Model,
} from "aws-cdk-lib/aws-apigateway";
import { Policy, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { dbApiFunction , aiApiFunction , confyApiFunction } from "./functions/api-function/resource";

const backend = defineBackend({
 auth, dbApiFunction, aiApiFunction , confyApiFunction , storage
});

const apiStack = backend.createStack("vfa-api-stack");
const dbStack = backend.createStack("vfa-db-stack");
const backendStack = backend.createStack("vfa-backend-stack");

// create sqs queue to accept request from APIGateway
const sqsQueue = new aws_sqs.Queue(backendStack, "vfaQueue", {
    visibilityTimeout: Duration.seconds(3600),
});

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

// Create API key
const apiKey = vfaAPI.addApiKey('CallbackApiKey', {
    description: 'API Key for callback endpoint'
});

// Create usage plan
const usagePlan = vfaAPI.addUsagePlan('CallbackUsagePlan', {
    description: 'Usage plan for callback endpoint',
    apiStages: [{
        api: vfaAPI,
        stage: vfaAPI.deploymentStage
    }]
});

// Associate the API key with the usage plan
usagePlan.addApiKey(apiKey);

// Create DynamoDB for User Registration using cdk stack
const userRegistrationTable = new aws_dynamodb.Table(dbStack, "UserRegistration", {
    partitionKey: { name: "email", type: aws_dynamodb.AttributeType.STRING },
    billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    removalPolicy:  RemovalPolicy.DESTROY
});

const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
    cognitoUserPools: [backend.auth.resources.userPool],
});

const bedrockPolicy = new PolicyStatement({
    actions: ["bedrock:*"],
    resources: ["*"],
});

backend.aiApiFunction.resources.lambda.role?.attachInlinePolicy(
    new Policy(apiStack, "BedrockPolicy", {
        statements: [bedrockPolicy],
    })
);

// add permission for email
backend.dbApiFunction.resources.lambda.addToRolePolicy(
    new PolicyStatement({
        actions: ["ses:SendEmail"],
        resources: ["*"],
    })
);

// add dynamodb access
userRegistrationTable.grantReadWriteData(backend.dbApiFunction.resources.lambda);

const dblambdaIntegration = new LambdaIntegration(backend.dbApiFunction.resources.lambda);
const ailambdaIntegration = new LambdaIntegration(backend.aiApiFunction.resources.lambda);
const confylambdaIntegration = new LambdaIntegration(backend.confyApiFunction.resources.lambda);

const authConfig = { authorizationType: AuthorizationType.COGNITO,authorizer: cognitoAuth}

const dbPath = vfaAPI.root.addResource("db");
dbPath.addMethod("GET", dblambdaIntegration, authConfig);
dbPath.addMethod("POST", dblambdaIntegration, authConfig);

const aiPath = vfaAPI.root.addResource("ai");
aiPath.addMethod("POST", ailambdaIntegration, authConfig);

const confyPath = vfaAPI.root.addResource("confy");
confyPath.addMethod("GET", confylambdaIntegration, authConfig);
confyPath.addMethod("POST", confylambdaIntegration, authConfig);


const callbackPath = vfaAPI.root.addResource("callback");
// Create IAM role for API Gateway to SQS integration
const apiGatewayToSqsRole = new Role(apiStack, 'ApiGatewayToSqsRole', {
    assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
});

// Grant SQS permissions to the role
sqsQueue.grantSendMessages(apiGatewayToSqsRole);

const sqsIntegrationOptions: IntegrationOptions = {
    credentialsRole: apiGatewayToSqsRole,
    integrationResponses: [
        {
            statusCode: '200',
            responseTemplates: {
                'application/json': JSON.stringify({ message: 'Message sent to SQS' })
            }
        }
    ],
    requestTemplates: {
        'application/json': 'Action=SendMessage&MessageBody=$input.body'
    },
    passthroughBehavior: PassthroughBehavior.NEVER,
    requestParameters: {
        'integration.request.header.Content-Type': "'application/x-www-form-urlencoded'"
    }
};

const sqsIntegration = new Integration({
    type: IntegrationType.AWS,
    integrationHttpMethod: 'POST',
    uri: `arn:aws:apigateway:${Stack.of(apiStack).region}:sqs:path/${Stack.of(apiStack).account}/${sqsQueue.queueName}`,
    options: sqsIntegrationOptions
});

callbackPath.addMethod('POST', sqsIntegration, {
    apiKeyRequired: true,
    methodResponses: [
        {
            statusCode: '200',
            responseModels: {
                'application/json': Model.EMPTY_MODEL
            }
        }
    ]
});

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

backend.dbApiFunction.addEnvironment("USER_REGISTRATION_TABLE", userRegistrationTable.tableName);

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