/**
 * Cognito Verify Auth Challenge Lambda Trigger
 * Compares the user-provided OTP with the generated one.
 */
import type { VerifyAuthChallengeResponseTriggerHandler } from 'aws-lambda';

export const handler: VerifyAuthChallengeResponseTriggerHandler = async (event) => {
  const expectedOTP = event.request.privateChallengeParameters?.otp;
  const userOTP = event.request.challengeAnswer;

  event.response.answerCorrect = expectedOTP === userOTP;

  return event;
};
