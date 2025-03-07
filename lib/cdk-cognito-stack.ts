import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class CdkCognitoAuthStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Cognito User Pool
    const userPool = new cognito.UserPool(this, 'MyUserPool', {
      userPoolName: 'MyUserPool',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: { email: { required: true, mutable: true } },
    });

    // Create Cognito User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
    });

    // Create an Identity Pool
    const identityPool = new cognito.CfnIdentityPool(this, 'MyIdentityPool', {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{
        clientId: userPoolClient.userPoolClientId,
        providerName: userPool.userPoolProviderName,
      }],
    });

    // IAM Role for Authenticated Users
    const authenticatedRole = new iam.Role(this, 'CognitoAuthRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
          "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "authenticated" }
        },
        "sts:AssumeRoleWithWebIdentity"
      )
    });

    // Attach policies to authenticated role
    authenticatedRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess"));

    // Create a Lambda Function
    const myLambda = new lambda.Function(this, 'MyLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'MyApi');

    // Add Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'APIAuthorizer', {
      cognitoUserPools: [userPool],
    });

    // Add a Lambda-based resource
    const lambdaIntegration = new apigateway.LambdaIntegration(myLambda);
    const protectedResource = api.root.addResource('protected');
    protectedResource.addMethod('GET', lambdaIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer,
    });

    // Output values
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'IdentityPoolId', { value: identityPool.ref });
    new cdk.CfnOutput(this, 'ApiEndpoint', { value: api.url });
  }
}
