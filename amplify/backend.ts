import { defineBackend } from '@aws-amplify/backend';
import { aws_dynamodb, RemovalPolicy, Stack, aws_sqs, Duration } from "aws-cdk-lib";
import { auth } from "./auth/resource";
import { storage } from "./storage/resource";
import {
    AuthorizationType,
    CognitoUserPoolsAuthorizer,
    Cors,
    LambdaIntegration,
    IntegrationType, IntegrationOptions,
    PassthroughBehavior,
    RestApi,
    Integration,
    MethodLoggingLevel,
    Model,
} from "aws-cdk-lib/aws-apigateway";
import { Policy, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { dbApiFunction, aiApiFunction, confyApiFunction, sqsApiFunction, imageApiFunction } from "./functions/api-function/resource";
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { CfnApp, CfnSegment } from 'aws-cdk-lib/aws-pinpoint';

const EMAIL_ID = "no-reply@domain.com";
const SUPPORT_EMAIL_ID = "email@domain.com";
const COMFY_SERVER = "<link-to-your-comfy_server>"

const backend = defineBackend({
    auth, dbApiFunction, aiApiFunction, confyApiFunction, storage, sqsApiFunction, imageApiFunction
});

//add m2m application type app client on user pool

// Add resource server to define custom scopes
const vpaResourceScope = new cognito.ResourceServerScope({
    scopeDescription: 'Read access to API',
    scopeName: 'read'
})

const vfaUserPoolResourceServer = backend.auth.resources.userPool.addResourceServer('ResourceServer', {
    identifier: 'api',
    scopes: [vpaResourceScope]
});


const vfaUserPoolClient = backend.auth.resources.userPool.addClient('m2m-client', {
    generateSecret: true, // Enable client secret for M2M applications
    authFlows: {
        adminUserPassword: true,
        custom: true,
        userPassword: false,
        userSrp: false
    },
    preventUserExistenceErrors: true,
    enableTokenRevocation: true,
    accessTokenValidity: Duration.minutes(60),
    refreshTokenValidity: Duration.minutes(60),
    supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
    oAuth: {
        flows: {
            clientCredentials: true,
            implicitCodeGrant: false,
            authorizationCodeGrant: false
        },
        scopes: [
            cognito.OAuthScope.resourceServer(vfaUserPoolResourceServer, vpaResourceScope)
        ]
    }
});

const apiStack = backend.createStack("vfa-api-stack");
const dbStack = backend.createStack("vfa-db-stack");
const backendStack = backend.createStack("vfa-backend-stack");
const inAppMessagingStack = backend.createStack("inAppMessaging-stack");

// create sqs queue to accept request from APIGateway
const sqsQueue = new aws_sqs.Queue(backendStack, "vfaQueue", {
    visibilityTimeout: Duration.seconds(60),
});

const sqsEventSource = new SqsEventSource(sqsQueue, {
    batchSize: 10, // Number of messages to process in a batch
    maxBatchingWindow: Duration.seconds(30) // Wait up to 30 seconds to gather messages
});

backend.sqsApiFunction.resources.lambda.addEventSource(sqsEventSource)

const vfaAPI = new RestApi(apiStack, "vfaAPI", {
    restApiName: "vfaAPI",
    deploy: true,
    deployOptions: {
        stageName: "dev",
        throttlingRateLimit: 100,
        throttlingBurstLimit: 50,
        cacheClusterEnabled: true,
        cacheClusterSize: "0.5",
        cacheTtl: Duration.seconds(60),
        loggingLevel: MethodLoggingLevel.INFO,
        tracingEnabled: true,
        metricsEnabled: true,
        dataTraceEnabled: true,
        methodOptions: {
            "/*/*": {
                throttlingRateLimit: 100,
                throttlingBurstLimit: 50,
            },
        },
    },
    defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS, // Restrict this to domains you trust
        allowMethods: Cors.ALL_METHODS, // Specify only the methods you need to allow
        allowHeaders: [
            'Content-Type',
            'X-Amz-Date',
            'Authorization',
            'X-Api-Key',
            'X-Amz-Security-Token'
        ]
    },
});

/*
// Create API key
const vfaApiKey = vfaAPI.addApiKey('VFA-ApiKey', {
    description: 'API Key for VFA'
});

// Create usage plan
const usagePlan = vfaAPI.addUsagePlan('VPA-UsagePlan', {
    description: 'Usage plan for VFA endpoint',
    apiStages: [{
        api: vfaAPI,
        stage: vfaAPI.deploymentStage
    }]
});

// Associate the API key with the usage plan
usagePlan.addApiKey(vfaApiKey);
*/

// Create DynamoDB for User Registration using cdk stack
const userRegistrationTable = new aws_dynamodb.Table(dbStack, "UserRegistration", {
    partitionKey: { name: "email", type: aws_dynamodb.AttributeType.STRING },
    billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    removalPolicy: RemovalPolicy.DESTROY
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
backend.dbApiFunction.resources.lambda.addToRolePolicy(
    new PolicyStatement({
        actions: ["ses:SendRawEmail"],
        resources: ["*"],
    })
);

backend.sqsApiFunction.resources.lambda.addToRolePolicy(
    new PolicyStatement({
        actions: ["ses:SendRawEmail"],
        resources: ["*"],
    })
);
backend.sqsApiFunction.resources.lambda.addToRolePolicy(
    new PolicyStatement({
        actions: ["ses:SendEmail"],
        resources: ["*"],
    })
);

// add s3 access for storage
backend.storage.resources.bucket.grantReadWrite(backend.sqsApiFunction.resources.lambda);
backend.storage.resources.bucket.grantReadWrite(backend.dbApiFunction.resources.lambda);
backend.storage.resources.bucket.grantReadWrite(backend.imageApiFunction.resources.lambda);


// add dynamodb access
userRegistrationTable.grantReadWriteData(backend.dbApiFunction.resources.lambda);
userRegistrationTable.grantReadWriteData(backend.sqsApiFunction.resources.lambda);
userRegistrationTable.grantReadWriteData(backend.imageApiFunction.resources.lambda);

const dblambdaIntegration = new LambdaIntegration(backend.dbApiFunction.resources.lambda);
const ailambdaIntegration = new LambdaIntegration(backend.aiApiFunction.resources.lambda);
const confylambdaIntegration = new LambdaIntegration(backend.confyApiFunction.resources.lambda);
const imageLambdaIntegration = new LambdaIntegration(backend.imageApiFunction.resources.lambda);

const authConfig = {
    authorizationType: AuthorizationType.COGNITO,
    authorizer: cognitoAuth,
}

const authConfigWithScope = {
    authorizationType: AuthorizationType.COGNITO,
    authorizer: cognitoAuth,
    authorizationScopes: [`${vfaUserPoolResourceServer.userPoolResourceServerId}/${vpaResourceScope.scopeName}`],
    methodResponses: [
        {
            statusCode: '200',
            responseParameters: {
                'method.response.header.Access-Control-Allow-Origin': true
            },
            responseModels: {
                'application/json': Model.EMPTY_MODEL
            }
        },
        {
            statusCode: '400',
            responseParameters: {
                'method.response.header.Access-Control-Allow-Origin': true
            },
            responseModels: {
                'application/json': Model.ERROR_MODEL
            }
        }
    ]
}

const dbPath = vfaAPI.root.addResource("db");
dbPath.addMethod("GET", dblambdaIntegration, authConfig);
dbPath.addMethod("POST", dblambdaIntegration, authConfig);

const aiPath = vfaAPI.root.addResource("ai");
aiPath.addMethod("POST", ailambdaIntegration, authConfig);

const confyPath = vfaAPI.root.addResource("confy");
confyPath.addMethod("POST", confylambdaIntegration, authConfig);


const imagePath = vfaAPI.root.addResource("image");
imagePath.addMethod("GET", imageLambdaIntegration);

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
                'application/json': JSON.stringify({ message: 'Request Received' })
            },
            responseParameters: {
                'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
        },
        {
            selectionPattern: '.*Error.*',  // Match error patterns
            statusCode: '400',
            responseTemplates: {
                'application/json': JSON.stringify({
                    message: 'Error processing message',
                    error: "$input.path('$.errorMessage')"
                })
            }
        }
    ],
    requestTemplates: {
        'application/json': 'Action=SendMessage&MessageBody=$input.body'
    },
    passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
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

/*
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
*/
callbackPath.addMethod("POST", sqsIntegration, authConfigWithScope);


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
backend.sqsApiFunction.addEnvironment("USER_REGISTRATION_TABLE", userRegistrationTable.tableName);
backend.imageApiFunction.addEnvironment("USER_REGISTRATION_TABLE", userRegistrationTable.tableName);

backend.dbApiFunction.addEnvironment("S3_BUCKET", backend.storage.resources.bucket.bucketName);
backend.sqsApiFunction.addEnvironment("S3_BUCKET", backend.storage.resources.bucket.bucketName);
backend.imageApiFunction.addEnvironment("S3_BUCKET", backend.storage.resources.bucket.bucketName);

backend.dbApiFunction.addEnvironment("EMAIL_ID", EMAIL_ID);
backend.sqsApiFunction.addEnvironment("EMAIL_ID", EMAIL_ID);
backend.sqsApiFunction.addEnvironment("SUPPORT_EMAIL_ID", SUPPORT_EMAIL_ID);


backend.confyApiFunction.addEnvironment("COMFY_SERVER", COMFY_SERVER);

backend.auth.resources.userPool.addDomain('vpaUserPoolDomain', {
    cognitoDomain: {
        domainPrefix: `vfa-${apiStack.node.addr}`.toLowerCase().replace(/[^a-z0-9]/g, '-')
    }
})

// create a Pinpoint app
const pinpoint = new CfnApp(inAppMessagingStack, "Pinpoint", {
    name: "vfaPinpoint",
});

//create an IAM policy to allow interacting with Pinpoint in-app messaging
const pinpointPolicy = new Policy(inAppMessagingStack, "PinpointPolicy", {
    statements: [
        new PolicyStatement({
            actions: [
                "mobiletargeting:GetInAppMessages",
                "mobiletargeting:UpdateEndpoint",
                "mobiletargeting:PutEvents",
            ],
            resources: [pinpoint.attrArn + "/*", pinpoint.attrArn],
        }),
    ],
});

// apply the policy to the authenticated and unauthenticated roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(pinpointPolicy);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(pinpointPolicy);

backend.sqsApiFunction.addEnvironment("PINPOINT_APP_ID", pinpoint.ref);

backend.addOutput({
    custom: {
        API: {
            [vfaAPI.restApiName]: {
                endpoint: vfaAPI.url,
                region: Stack.of(vfaAPI).region,
                apiName: vfaAPI.restApiName,
            },
        }
    },
    analytics:{
        amazon_pinpoint:{
            aws_region: Stack.of(pinpoint).region,
            app_id: pinpoint.ref
        }
    }
});
