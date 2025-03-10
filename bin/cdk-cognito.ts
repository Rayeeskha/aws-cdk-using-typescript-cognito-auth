#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkCognitoAuthStack } from '../lib/cdk-cognito-stack';

const app = new cdk.App();
new CdkCognitoAuthStack(app, 'CdkCognitoAuthStack');
