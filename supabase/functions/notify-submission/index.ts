import "https://deno.land/x/xhr@0.3.0/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const ADMIN_EMAIL = "alperen.adatepe1905@gmail.com";

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { record } = payload;

    if (!record || !record.message_text) {
      return new Response(JSON.stringify({ error: "No record" }), { status: 400 });
    }

    const messagePreview = record.message_text.substring(0, 500);
    const submittedBy = record.submitted_by || "Anonymous";
    const timestamp = new Date(record.created_at).toLocaleString("en-GB", {
      timeZone: "Europe/Berlin",
    });

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0891b2;">🛡️ New Spam Submission</h2>
        <p><strong>Submitted by:</strong> ${submittedBy}</p>
        <p><strong>Time:</strong> ${timestamp}</p>
        <hr style="border: 1px solid #e5e7eb;" />
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <pre style="white-space: pre-wrap; word-break: break-word; font-size: 14px; color: #374151;">${messagePreview}</pre>
        </div>
        <p>
          <a href="https://your-app.vercel.app/admin" style="background: #0891b2; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">
            Review in Admin Panel
          </a>
        </p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Spam Guard <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `New Spam Report: ${messagePreview.substring(0, 50)}...`,
        html: emailHtml,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.ok ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
