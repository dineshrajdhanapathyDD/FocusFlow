/**
 * AWS Cognito Passwordless OTP Authentication
 *
 * Flow:
 * 1. signIn(email) - Initiates custom auth, triggers OTP email
 * 2. verifyOTP(otp) - Verifies the code, returns tokens
 *
 * Uses CUSTOM_AUTH flow with Lambda triggers on Cognito side.
 */
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';

const userPool = new CognitoUserPool({
  UserPoolId: USER_POOL_ID,
  ClientId: CLIENT_ID,
});

let cognitoUser: CognitoUser | null = null;

/**
 * Step 1: Initiate sign-in with email.
 * If user doesn't exist, sign them up first (auto-confirmed via Lambda trigger).
 * Then start the custom auth challenge which sends OTP.
 */
export async function initiateOTPLogin(email: string): Promise<void> {
  // Try to sign up first (idempotent - if user exists, we catch and continue)
  await ensureUserExists(email);

  // Initiate custom auth
  cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
  });

  const authDetails = new AuthenticationDetails({
    Username: email,
  });

  return new Promise((resolve, reject) => {
    cognitoUser!.initiateAuth(authDetails, {
      onSuccess: () => {
        resolve();
      },
      onFailure: (err) => {
        reject(new Error(err.message || 'Failed to initiate login'));
      },
      customChallenge: (challengeParameters) => {
        // If OTP is returned in public params (dev mode), store it for auto-fill
        if (challengeParameters?.otp) {
          (window as any).__focusflow_dev_otp = challengeParameters.otp;
        }
        resolve();
      },
    });
  });
}

/**
 * Step 2: Verify the OTP code.
 * Returns the JWT tokens on success.
 */
export async function verifyOTP(otpCode: string): Promise<{ idToken: string; accessToken: string; email: string }> {
  if (!cognitoUser) {
    throw new Error('No active login session. Call initiateOTPLogin first.');
  }

  return new Promise((resolve, reject) => {
    cognitoUser!.sendCustomChallengeAnswer(otpCode, {
      onSuccess: (session) => {
        const idToken = session.getIdToken().getJwtToken();
        const accessToken = session.getAccessToken().getJwtToken();
        const email = session.getIdToken().payload.email || '';

        resolve({ idToken, accessToken, email });
      },
      onFailure: (err) => {
        reject(new Error(err.message || 'Invalid OTP code'));
      },
      customChallenge: () => {
        // Wrong OTP - Cognito is asking for another attempt
        reject(new Error('Invalid OTP code. Please try again.'));
      },
    });
  });
}

/**
 * Sign out the current user
 */
export function signOut(): void {
  const user = userPool.getCurrentUser();
  if (user) {
    user.signOut();
  }
  cognitoUser = null;
}

/**
 * Get current session tokens (if user is already logged in)
 */
export function getCurrentSession(): Promise<{ idToken: string; email: string; name: string } | null> {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser();
    if (!user) {
      resolve(null);
      return;
    }

    user.getSession((err: Error | null, session: any) => {
      if (err || !session || !session.isValid()) {
        resolve(null);
        return;
      }

      const idToken = session.getIdToken().getJwtToken();
      const payload = session.getIdToken().payload;

      resolve({
        idToken,
        email: payload.email || '',
        name: payload.name || payload.email?.split('@')[0] || 'User',
      });
    });
  });
}

/**
 * Ensure user exists in Cognito (sign up if not)
 */
async function ensureUserExists(email: string): Promise<void> {
  return new Promise((resolve) => {
    const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    userPool.signUp(
      email,
      // Random password (won't be used - custom auth only)
      `Pwd${Math.random().toString(36).slice(2)}!1Aa`,
      [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
        new CognitoUserAttribute({ Name: 'name', Value: name }),
      ],
      [],
      (err) => {
        // If user already exists, that's fine - just continue
        if (err && err.name !== 'UsernameExistsException') {
          console.warn('SignUp note:', err.message);
        }
        resolve();
      }
    );
  });
}

/**
 * Check if Cognito is configured (env vars present)
 */
export function isCognitoConfigured(): boolean {
  return Boolean(USER_POOL_ID && CLIENT_ID);
}

/**
 * Get the dev OTP if it was returned in challenge params (SES sandbox mode).
 * Returns null in production (OTP is sent via email only).
 */
export function getDevOTP(): string | null {
  return (window as any).__focusflow_dev_otp || null;
}
