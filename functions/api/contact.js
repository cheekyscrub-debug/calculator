const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;
const ipHits = new Map();

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function getClientIp(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown"
  );
}

function isRateLimited(ip) {
  const now = Date.now();
  const entries = ipHits.get(ip) || [];
  const recent = entries.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  ipHits.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

function redact(value) {
  if (!value) return "";
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
}

async function sendWithMailchannels(payload, env) {
  const fromEmail = env.FROM_EMAIL;
  const toEmail = env.TO_EMAIL;
  if (!fromEmail || !toEmail) {
    throw new Error("Missing FROM_EMAIL or TO_EMAIL env vars");
  }

  const mailBody = {
    personalizations: [
      {
        to: [{ email: toEmail }]
      }
    ],
    from: { email: fromEmail, name: "Nasa Gas Plumbing & Heating" },
    subject: `New website enquiry from ${payload.name}`,
    content: [
      {
        type: "text/plain",
        value: payload.summary
      }
    ]
  };

  const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mailBody)
  });

  if (!response.ok) {
    throw new Error("MailChannels failed to send");
  }
}

async function sendWithResend(payload, env) {
  const apiKey = env.RESEND_API_KEY;
  const fromEmail = env.FROM_EMAIL;
  const toEmail = env.TO_EMAIL;
  if (!apiKey || !fromEmail || !toEmail) {
    throw new Error("Missing Resend credentials");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: `New website enquiry from ${payload.name}`,
      text: payload.summary
    })
  });

  if (!response.ok) {
    throw new Error("Resend failed to send");
  }
}

function buildSummary(body) {
  return [
    `Name: ${body.name}`,
    `Phone: ${body.phone}`,
    `Email: ${body.email || "(not provided)"}`,
    `Postcode: ${body.postcode}`,
    `Emergency: ${body.emergency ? "Yes" : "No"}`,
    `Preferred contact: ${body.preferredContact || "(not specified)"}`,
    `Message: ${body.message}`
  ].join("\n");
}

export async function onRequestPost({ request, env }) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return jsonResponse({ ok: false, error: "Too many requests" }, 429);
    }

    const body = await request.json();

    if (body.company) {
      return jsonResponse({ ok: true });
    }

    const requiredFields = ["name", "phone", "postcode", "message", "consent"];
    const missing = requiredFields.filter((field) => !body[field]);
    if (missing.length) {
      return jsonResponse({ ok: false, error: "Missing required fields" }, 400);
    }

    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return jsonResponse({ ok: false, error: "Invalid email" }, 400);
    }

    if (typeof body.timeSinceLoad === "number" && body.timeSinceLoad < 1500) {
      return jsonResponse({ ok: false, error: "Spam detected" }, 400);
    }

    const summary = buildSummary(body);
    const payload = { ...body, summary };

    const provider = env.EMAIL_PROVIDER || "logging";
    if (provider === "mailchannels") {
      await sendWithMailchannels(payload, env);
    } else if (provider === "resend") {
      await sendWithResend(payload, env);
    } else {
      // Logging mode (default). TODO: Avoid logging full PII in production.
      console.log("New enquiry (redacted)", {
        name: payload.name,
        phone: redact(payload.phone),
        email: redact(payload.email),
        postcode: payload.postcode,
        emergency: payload.emergency,
        preferredContact: payload.preferredContact
      });
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: "Server error" }, 500);
  }
}
