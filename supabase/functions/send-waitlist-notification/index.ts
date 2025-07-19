import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WaitlistNotificationRequest {
  full_name: string;
  email: string;
  company: string;
  listings_count: string;
  source?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { full_name, email, company, listings_count, source }: WaitlistNotificationRequest = await req.json();

    console.log("Processing waitlist notification for:", { full_name, email, company });

    // Create formatted submission timestamp
    const submissionTime = new Date().toLocaleString('en-US', {
      timeZone: 'Europe/Berlin',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Create the email content with professional styling
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Beta Waitlist Signup – Leasy</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px;
              background-color: #f8fafc;
            }
            .container { 
              background: white; 
              border-radius: 12px; 
              padding: 32px; 
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #e2e8f0; 
              padding-bottom: 24px; 
              margin-bottom: 32px; 
            }
            .logo { 
              font-size: 28px; 
              font-weight: 700; 
              color: #1e293b; 
              margin-bottom: 8px;
            }
            .subtitle { 
              color: #64748b; 
              font-size: 16px; 
            }
            .field-group { 
              margin-bottom: 20px; 
              padding: 16px; 
              background-color: #f8fafc; 
              border-radius: 8px; 
              border-left: 4px solid #3b82f6;
            }
            .field-label { 
              font-weight: 600; 
              color: #374151; 
              font-size: 14px; 
              text-transform: uppercase; 
              letter-spacing: 0.5px; 
              margin-bottom: 4px; 
            }
            .field-value { 
              font-size: 16px; 
              color: #1f2937; 
              font-weight: 500; 
            }
            .timestamp { 
              text-align: center; 
              margin-top: 32px; 
              padding-top: 24px; 
              border-top: 1px solid #e2e8f0; 
              color: #6b7280; 
              font-size: 14px; 
            }
            .footer { 
              text-align: center; 
              margin-top: 32px; 
              color: #9ca3af; 
              font-size: 12px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Leasy</div>
              <div class="subtitle">New Beta Waitlist Signup</div>
            </div>
            
            <div class="field-group">
              <div class="field-label">Full Name</div>
              <div class="field-value">${full_name}</div>
            </div>
            
            <div class="field-group">
              <div class="field-label">Email Address</div>
              <div class="field-value">${email}</div>
            </div>
            
            <div class="field-group">
              <div class="field-label">Company</div>
              <div class="field-value">${company}</div>
            </div>
            
            <div class="field-group">
              <div class="field-label">Number of Listings</div>
              <div class="field-value">${listings_count}</div>
            </div>
            
            ${source ? `
            <div class="field-group">
              <div class="field-label">Source</div>
              <div class="field-value">${source}</div>
            </div>
            ` : ''}
            
            <div class="timestamp">
              <strong>Submitted:</strong> ${submissionTime}
            </div>
            
            <div class="footer">
              This email was automatically generated by the Leasy waitlist system.
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: "Leasy Waitlist <onboarding@resend.dev>",
      to: ["luca.steinmetz@farawayhome.com"],
      subject: "New Beta Waitlist Signup – Leasy",
      html: emailHtml,
      // Add reply-to as the user's email for easy follow-up
      reply_to: email,
    });

    console.log("Email sent successfully:", emailResponse);

    // Store the submission in the database
    const { error: dbError } = await supabaseClient
      .from('waitlist_submissions')
      .insert({
        full_name,
        email,
        company,
        listings_count,
        source: source || 'Leasy Beta Waitlist'
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log("Waitlist submission stored successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Waitlist notification sent successfully",
        email_id: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in send-waitlist-notification function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to send waitlist notification", 
        details: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);