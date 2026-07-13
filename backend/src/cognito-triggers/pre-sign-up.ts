/**
 * Cognito Pre Sign Up Lambda Trigger
 * Auto-confirms users and their email so they can sign in immediately with OTP.
 */
import type { PreSignUpTriggerHandler } from 'aws-lambda';

export const handler: PreSignUpTriggerHandler = async (event) => {
  // Auto-confirm user and email (no verification email needed - we verify via OTP)
  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;

  return event;
};
