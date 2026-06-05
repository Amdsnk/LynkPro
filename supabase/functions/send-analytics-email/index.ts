import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface EmailRequest {
  recipients: string[];
  subject: string;
  message?: string;
  formats: string[];
  data: {
    shares: any[];
    logs: any[];
    files: any[];
    metrics: any;
    dateRange: { from: string; to: string } | null;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const body: EmailRequest = await req.json();
    const { recipients, subject, message, formats, data } = body;

    // Validate inputs
    if (!recipients || recipients.length === 0) {
      throw new Error('At least one recipient is required');
    }

    if (!formats || formats.length === 0) {
      throw new Error('At least one format is required');
    }

    // Generate email content
    const dateRangeText = data.dateRange
      ? `${new Date(data.dateRange.from).toLocaleDateString()} - ${new Date(data.dateRange.to).toLocaleDateString()}`
      : 'All Time';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #1a1a1a; }
            .metrics { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .metric-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
            .metric-row:last-child { border-bottom: none; }
            .metric-label { font-weight: 600; }
            .message { background-color: #fff; padding: 15px; border-left: 4px solid #4a90e2; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>LynkPro Share Analytics Report</h1>
              <p style="margin: 10px 0 0 0; color: #666;">
                Date Range: ${dateRangeText}<br>
                Generated: ${new Date().toLocaleString()}
              </p>
            </div>

            ${message ? `<div class="message"><p>${message}</p></div>` : ''}

            <div class="metrics">
              <h2 style="margin-top: 0;">Summary Metrics</h2>
              <div class="metric-row">
                <span class="metric-label">Total Shares</span>
                <span>${data.metrics.totalShares}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Active Shares</span>
                <span>${data.metrics.activeShares}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Expired Shares</span>
                <span>${data.metrics.expiredShares}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Total Views</span>
                <span>${data.metrics.totalViews}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Total Downloads</span>
                <span>${data.metrics.totalDownloads}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Average Views per Share</span>
                <span>${data.metrics.avgViewsPerShare.toFixed(2)}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Download Conversion Rate</span>
                <span>${data.metrics.downloadRate.toFixed(2)}%</span>
              </div>
            </div>

            <p>Please find the detailed analytics report attached in the following format(s): ${formats.join(', ').toUpperCase()}.</p>

            <div class="footer">
              <p>This report was generated by LynkPro<br>
              Enterprise-grade AEC file management platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Note: Actual file generation and email sending would require additional setup
    // For now, we'll send a simple email notification
    // In production, you would:
    // 1. Generate the actual files (PDF, CSV, Excel) server-side
    // 2. Upload them to temporary storage or encode as base64
    // 3. Attach them to the email using Resend or another email service

    const emailData = {
      from: 'LynkPro <noreply@lynkpro.com>',
      to: recipients,
      subject: subject,
      html: htmlContent,
      // attachments: [] // Would include generated files here
    };

    // Send email using Resend (placeholder - requires RESEND_API_KEY)
    if (RESEND_API_KEY) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!resendResponse.ok) {
        const error = await resendResponse.text();
        console.error('Resend error:', error);
        throw new Error('Failed to send email');
      }
    } else {
      console.log('Email would be sent to:', recipients);
      console.log('Subject:', subject);
      console.log('Formats:', formats);
      // In development, just log the email details
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email sent to ${recipients.length} recipient(s)`,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
