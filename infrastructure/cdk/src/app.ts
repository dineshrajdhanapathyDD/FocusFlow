#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FocusFlowStack } from './stack';

const app = new cdk.App();

new FocusFlowStack(app, 'FocusFlowStack', {
  env: { region: 'us-east-1', account: process.env.CDK_DEFAULT_ACCOUNT },
});
