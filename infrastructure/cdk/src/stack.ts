import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export class FocusFlowStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ===== DynamoDB Tables =====
    const tasksTable = new dynamodb.Table(this, 'TasksTable', {
      tableName: 'FocusFlow-Tasks-dev',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    tasksTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'status', type: dynamodb.AttributeType.STRING },
    });

    const plansTable = new dynamodb.Table(this, 'PlansTable', {
      tableName: 'FocusFlow-Plans-dev',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const insightsTable = new dynamodb.Table(this, 'InsightsTable', {
      tableName: 'FocusFlow-Insights-dev',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const notificationsTable = new dynamodb.Table(this, 'NotificationsTable', {
      tableName: 'FocusFlow-Notifications-dev',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ===== Cognito =====
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'focusflow-users-dev',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      standardAttributes: {
        fullname: { required: true, mutable: true },
        email: { required: true, mutable: false },
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      userPoolClientName: 'focusflow-app-dev',
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      preventUserExistenceErrors: true,
    });

    // ===== Lambda Environment =====
    const lambdaEnv = {
      TASKS_TABLE: tasksTable.tableName,
      PLANS_TABLE: plansTable.tableName,
      INSIGHTS_TABLE: insightsTable.tableName,
      NOTIFICATIONS_TABLE: notificationsTable.tableName,
      BEDROCK_MODEL_ID: 'amazon.nova-lite-v1:0',
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    };

    const backendCode = lambda.Code.fromAsset(path.join(__dirname, '../../../backend'), {
      exclude: ['src', '*.ts', 'tsconfig.json', '.env', '.env.example'],
    });

    // ===== Lambda Functions =====
    const authFn = new lambda.Function(this, 'AuthFunction', {
      functionName: 'focusflow-auth-dev',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/handlers/auth.handler',
      code: backendCode,
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      logRetention: logs.RetentionDays.TWO_WEEKS,
    });

    const tasksFn = new lambda.Function(this, 'TasksFunction', {
      functionName: 'focusflow-tasks-dev',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/handlers/tasks.handler',
      code: backendCode,
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      logRetention: logs.RetentionDays.TWO_WEEKS,
    });
    tasksTable.grantReadWriteData(tasksFn);

    const aiFn = new lambda.Function(this, 'AIFunction', {
      functionName: 'focusflow-ai-dev',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/handlers/ai.handler',
      code: backendCode,
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      architecture: lambda.Architecture.ARM_64,
      logRetention: logs.RetentionDays.TWO_WEEKS,
    });
    tasksTable.grantReadData(aiFn);
    insightsTable.grantReadWriteData(aiFn);
    aiFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: ['*'],
    }));

    const plannerFn = new lambda.Function(this, 'PlannerFunction', {
      functionName: 'focusflow-planner-dev',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/handlers/planner.handler',
      code: backendCode,
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      logRetention: logs.RetentionDays.TWO_WEEKS,
    });
    plansTable.grantReadWriteData(plannerFn);
    tasksTable.grantReadData(plannerFn);

    const analyticsFn = new lambda.Function(this, 'AnalyticsFunction', {
      functionName: 'focusflow-analytics-dev',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/handlers/analytics.handler',
      code: backendCode,
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      logRetention: logs.RetentionDays.TWO_WEEKS,
    });
    tasksTable.grantReadData(analyticsFn);

    const notificationsFn = new lambda.Function(this, 'NotificationsFunction', {
      functionName: 'focusflow-notifications-dev',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/handlers/notifications.handler',
      code: backendCode,
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      logRetention: logs.RetentionDays.TWO_WEEKS,
    });
    notificationsTable.grantReadWriteData(notificationsFn);

    // ===== API Gateway =====
    const api = new apigateway.RestApi(this, 'FocusFlowApi', {
      restApiName: 'focusflow-api-dev',
      deployOptions: { stageName: 'dev' },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key'],
      },
    });

    // Auth endpoints (no authorizer)
    const authResource = api.root.addResource('api').addResource('auth');
    authResource.addResource('login').addMethod('POST', new apigateway.LambdaIntegration(authFn));
    authResource.addResource('register').addMethod('POST', new apigateway.LambdaIntegration(authFn));
    const profileResource = authResource.addResource('profile');
    profileResource.addMethod('GET', new apigateway.LambdaIntegration(authFn));
    profileResource.addMethod('PUT', new apigateway.LambdaIntegration(authFn));

    // Tasks
    const apiRoot = api.root.getResource('api')!;
    const tasksResource = apiRoot.addResource('tasks');
    tasksResource.addMethod('GET', new apigateway.LambdaIntegration(tasksFn));
    tasksResource.addMethod('POST', new apigateway.LambdaIntegration(tasksFn));
    const taskIdResource = tasksResource.addResource('{id}');
    taskIdResource.addMethod('GET', new apigateway.LambdaIntegration(tasksFn));
    taskIdResource.addMethod('PUT', new apigateway.LambdaIntegration(tasksFn));
    taskIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(tasksFn));

    // AI
    const aiResource = apiRoot.addResource('ai');
    aiResource.addResource('chat').addMethod('POST', new apigateway.LambdaIntegration(aiFn));
    aiResource.addResource('prioritize').addMethod('POST', new apigateway.LambdaIntegration(aiFn));
    aiResource.addResource('breakdown').addMethod('POST', new apigateway.LambdaIntegration(aiFn));
    aiResource.addResource('plan').addMethod('POST', new apigateway.LambdaIntegration(aiFn));
    aiResource.addResource('insights').addMethod('GET', new apigateway.LambdaIntegration(aiFn));

    // Planner
    const plannerResource = apiRoot.addResource('planner');
    plannerResource.addMethod('POST', new apigateway.LambdaIntegration(plannerFn));
    plannerResource.addMethod('PUT', new apigateway.LambdaIntegration(plannerFn));
    plannerResource.addResource('{date}').addMethod('GET', new apigateway.LambdaIntegration(plannerFn));

    // Analytics
    apiRoot.addResource('analytics').addMethod('GET', new apigateway.LambdaIntegration(analyticsFn));

    // Notifications
    const notifResource = apiRoot.addResource('notifications');
    notifResource.addMethod('GET', new apigateway.LambdaIntegration(notificationsFn));
    notifResource.addResource('read-all').addMethod('PUT', new apigateway.LambdaIntegration(notificationsFn));
    const notifIdResource = notifResource.addResource('{id}');
    notifIdResource.addResource('read').addMethod('PUT', new apigateway.LambdaIntegration(notificationsFn));

    // ===== Outputs =====
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url, description: 'API Gateway URL' });
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'TasksTableName', { value: tasksTable.tableName });
    new cdk.CfnOutput(this, 'Region', { value: this.region });
  }
}
