import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  invitationId: string;
  email: string;
  inviterName: string;
  firmName: string;
  token: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { invitationId, email, inviterName, firmName, token }: InvitationRequest = await req.json();

    if (!invitationId || !email || !token) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the invitation URL
    const baseUrl = req.headers.get('origin') || 'http://localhost:5173';
    const invitationUrl = `${baseUrl}/register?token=${token}`;

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation to Join ${firmName}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">LynkPro</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 24px; font-weight: 600;">You've Been Invited!</h2>
            
            <p style="color: #4b5563; font-size: 16px; margin: 20px 0;">
              <strong>${inviterName}</strong> has invited you to join <strong>${firmName}</strong> on LynkPro.
            </p>
            
            <p style="color: #6b7280; font-size: 15px; margin: 20px 0;">
              LynkPro is an enterprise-grade project management platform designed for AEC professionals. 
              Join your team to collaborate on projects, manage documents, and streamline workflows.
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${invitationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 14px 32px; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        font-weight: 600; 
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);">
                Accept Invitation
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 13px; margin: 30px 0 10px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
            </p>
            
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
              Or copy and paste this link into your browser:<br>
              <span style="color: #667eea; word-break: break-all;">${invitationUrl}</span>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} LynkPro. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const emailText = `
You've Been Invited to Join ${firmName}!

${inviterName} has invited you to join ${firmName} on LynkPro.

LynkPro is an enterprise-grade project management platform designed for AEC professionals. 
Join your team to collaborate on projects, manage documents, and streamline workflows.

Accept your invitation by clicking this link:
${invitationUrl}

This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} LynkPro. All rights reserved.
    `.trim();

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LynkPro <invitations@lynkpro.app>',
        to: [email],
        subject: `You've been invited to join ${firmName} on LynkPro`,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Resend API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendData = await resendResponse.json();

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: resendData.id,
        message: 'Invitation email sent successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-invitation function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
