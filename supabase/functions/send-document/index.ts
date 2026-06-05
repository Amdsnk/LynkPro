import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendDocumentRequest {
  to: string;
  subject: string;
  documentType: 'proposal' | 'invoice' | 'report';
  documentNumber: string;
  pdfBase64: string;
  message?: string;
  firmName?: string;
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

    const { 
      to, 
      subject, 
      documentType, 
      documentNumber, 
      pdfBase64, 
      message,
      firmName = 'LynkPro'
    }: SendDocumentRequest = await req.json();

    if (!to || !subject || !documentType || !pdfBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare document type display name
    const docTypeDisplay = documentType.charAt(0).toUpperCase() + documentType.slice(1);

    // Create email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">${firmName}</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 24px; font-weight: 600;">${docTypeDisplay} ${documentNumber}</h2>
            
            ${message ? `
              <p style="color: #4b5563; font-size: 16px; margin: 20px 0;">
                ${message}
              </p>
            ` : `
              <p style="color: #4b5563; font-size: 16px; margin: 20px 0;">
                Please find attached your ${documentType} document.
              </p>
            `}
            
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 25px 0;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong style="color: #374151;">Document:</strong> ${docTypeDisplay} ${documentNumber}<br>
                <strong style="color: #374151;">Format:</strong> PDF<br>
                <strong style="color: #374151;">Date:</strong> ${new Date().toLocaleDateString()}
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin: 25px 0;">
              If you have any questions about this ${documentType}, please don't hesitate to contact us.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin: 25px 0;">
              Thank you for your business!
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${firmName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const emailText = `
${docTypeDisplay} ${documentNumber}

${message || `Please find attached your ${documentType} document.`}

Document: ${docTypeDisplay} ${documentNumber}
Format: PDF
Date: ${new Date().toLocaleDateString()}

If you have any questions about this ${documentType}, please don't hesitate to contact us.

Thank you for your business!

© ${new Date().getFullYear()} ${firmName}. All rights reserved.
    `.trim();

    // Extract base64 data (remove data URI prefix if present)
    let base64Data = pdfBase64;
    if (base64Data.includes('base64,')) {
      base64Data = base64Data.split('base64,')[1];
    }

    // Send email with attachment using Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${firmName} <documents@lynkpro.app>`,
        to: [to],
        subject: subject,
        html: emailHtml,
        text: emailText,
        attachments: [
          {
            filename: `${docTypeDisplay}-${documentNumber}.pdf`,
            content: base64Data,
          },
        ],
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
        message: 'Document sent successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-document function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
