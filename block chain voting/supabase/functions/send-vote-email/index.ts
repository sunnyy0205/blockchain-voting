import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { to, voterName, electionTitle, candidateName, txHash, receiptId, timestamp } = await req.json();

    if (!to || !electionTitle || !candidateName || !txHash || !receiptId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedDate = new Date(timestamp).toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    });

    const etherscanLink = `https://sepolia.etherscan.io/tx/${txHash}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 32px 24px;text-align:center;">
              <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <span style="font-size:28px;">✓</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Vote Confirmed</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your vote has been recorded on the blockchain</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
                Hi${voterName ? ` ${voterName}` : ''},<br/>
                Your vote in <strong>${electionTitle}</strong> for <strong>${candidateName}</strong> has been successfully recorded.
              </p>

              <!-- Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:14px 16px;border-bottom:1px solid #e5e7eb;">
                    <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Election</span><br/>
                    <span style="color:#111827;font-size:14px;font-weight:500;">${electionTitle}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;border-bottom:1px solid #e5e7eb;">
                    <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Candidate</span><br/>
                    <span style="color:#111827;font-size:14px;font-weight:500;">${candidateName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;border-bottom:1px solid #e5e7eb;">
                    <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Receipt ID</span><br/>
                    <span style="color:#111827;font-size:14px;font-weight:500;font-family:monospace;">${receiptId}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;border-bottom:1px solid #e5e7eb;">
                    <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Transaction Hash</span><br/>
                    <span style="color:#111827;font-size:12px;font-family:monospace;word-break:break-all;">${txHash}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;">
                    <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Timestamp</span><br/>
                    <span style="color:#111827;font-size:14px;font-weight:500;">${formattedDate}</span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="${etherscanLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                      View on Etherscan →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                ChainVote — Secure Blockchain Voting<br/>
                This is an automated confirmation. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ChainVote <onboarding@resend.dev>",
        to: [to],
        subject: `Vote Confirmed — ${electionTitle}`,
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      // Return success with warning instead of error to not break voting flow
      return new Response(
        JSON.stringify({ success: false, warning: data.message || "Failed to send email" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
