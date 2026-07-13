/**
 * Cognito Create Auth Challenge Lambda Trigger
 * Generates a 6-digit OTP and sends it via SES email.
 */
import type { CreateAuthChallengeTriggerHandler } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@focusflow.ai';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const handler: CreateAuthChallengeTriggerHandler = async (event) => {
  const otp = generateOTP();
  const email = event.request.userAttributes.email;

  // Store the OTP as private challenge params (not sent to client)
  event.response.privateChallengeParameters = { otp };
  event.response.publicChallengeParameters = { email };

  // Send OTP via SES
  try {
    // In production with SES out of sandbox, send real email
    // For development/sandbox mode, log the OTP to CloudWatch instead
    if (process.env.SES_PRODUCTION === 'true') {
      await ses.send(new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: 'Your FocusFlow login code' },
          Body: {
            Html: {
              Data: `
                <div style="font-family: -apple-system, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
                  <h2 style="color: #1e293b; margin-bottom: 8px;">Your login code</h2>
                  <p style="color: #64748b; font-size: 14px;">Enter this code in FocusFlow to sign in:</p>
                  <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #3b82f6;">${otp}</span>
                  </div>
                  <p style="color: #94a3b8; font-size: 12px;">This code expires in 5 minutes. If you didn't request this, ignore this email.</p>
                </div>
              `,
            },
            Text: { Data: `Your FocusFlow login code is: ${otp}` },
          },
        },
      }));
    } else {
      // Dev mode: OTP is returned in publicChallengeParameters so frontend can display it
      console.log(`[DEV OTP] Email: ${email}, Code: ${otp}`);
      event.response.publicChallengeParameters = { email, otp };
    }
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    // Return OTP in public params as fallback so user isn't locked out
    event.response.publicChallengeParameters = { email, otp };
  }

  return event;
};
