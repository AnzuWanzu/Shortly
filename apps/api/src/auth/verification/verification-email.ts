import nodemailer from 'nodemailer';

export function createVerificationEmailSender(smtpUrl: string, from: string) {
  const transport = nodemailer.createTransport(smtpUrl);

  return async function sendVerificationEmail(input: {
    email: string;
    code: string;
    expiresInMinutes: number;
  }) {
    await transport.sendMail({
      from,
      to: input.email,
      subject: 'Verify your Shortly email',
      text: `Your Shortly verification code is ${input.code}. It expires in ${input.expiresInMinutes} minutes.`,
      html: `<p>Your Shortly verification code is:</p><p><strong>${input.code}</strong></p><p>It expires in ${input.expiresInMinutes} minutes.</p>`,
    });
  };
}
