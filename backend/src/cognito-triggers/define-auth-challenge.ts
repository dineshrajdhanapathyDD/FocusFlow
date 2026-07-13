/**
 * Cognito Define Auth Challenge Lambda Trigger
 * Controls the custom auth flow: decides what challenge to present next.
 */
import type { DefineAuthChallengeTriggerHandler } from 'aws-lambda';

export const handler: DefineAuthChallengeTriggerHandler = async (event) => {
  const session = event.request.session;

  if (session.length === 0) {
    // First call - issue a custom challenge (OTP)
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = 'CUSTOM_CHALLENGE';
  } else if (
    session.length === 1 &&
    session[0].challengeName === 'CUSTOM_CHALLENGE' &&
    session[0].challengeResult === true
  ) {
    // OTP verified successfully - issue tokens
    event.response.issueTokens = true;
    event.response.failAuthentication = false;
  } else if (session.length >= 3) {
    // Too many attempts - fail
    event.response.issueTokens = false;
    event.response.failAuthentication = true;
  } else {
    // Wrong OTP - try again
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = 'CUSTOM_CHALLENGE';
  }

  return event;
};
