const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const SITE_EMAIL = 'info@yvkdesign.com.ua';
const SITE_NAME = 'YVK Design';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8'
    }
  });
}

function normalize(value) {
  return String(value || '').trim();
}

function buildMessage(fields) {
  const rows = [
    ['Name', fields.name],
    ['Phone', fields.phone],
    ['Email', fields.email || 'Not provided'],
    ['Project type', fields.projectType || 'Not selected'],
    ['Page language', fields.language || 'Unknown'],
    ['Page', fields.page || 'Unknown'],
    ['Message', fields.message || 'Not provided']
  ];

  const text = rows.map(([label, value]) => `${label}: ${value}`).join('\n');
  const htmlRows = rows
    .map(([label, value]) => `
      <tr>
        <td style="padding:8px 12px;border:1px solid #ddd;font-weight:600;">${escapeHtml(label)}</td>
        <td style="padding:8px 12px;border:1px solid #ddd;">${escapeHtml(value)}</td>
      </tr>
    `)
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#171717;">
      <h2 style="margin:0 0 16px;">New enquiry from ${SITE_NAME}</h2>
      <table style="border-collapse:collapse;width:100%;max-width:720px;">${htmlRows}</table>
    </div>
  `;

  return { text, html };
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed.' }, 405);
  }

  const formData = await request.formData();
  const honeypot = normalize(formData.get('company'));

  if (honeypot) {
    return json({ ok: true });
  }

  const fields = {
    name: normalize(formData.get('name')),
    phone: normalize(formData.get('phone')),
    email: normalize(formData.get('email')),
    projectType: normalize(formData.get('project-type')),
    message: normalize(formData.get('message')),
    language: normalize(formData.get('language')),
    page: normalize(formData.get('page'))
  };

  if (!fields.name || !fields.phone) {
    return json({ ok: false, error: 'Name and phone are required.' }, 400);
  }

  if (!env.BREVO_API_KEY) {
    return json({ ok: false, error: 'Email service is not configured.' }, 500);
  }

  const { text, html } = buildMessage(fields);
  const subject = `New enquiry from ${fields.name}`;
  const payload = {
    sender: {
      name: SITE_NAME,
      email: SITE_EMAIL
    },
    to: [
      {
        email: SITE_EMAIL,
        name: SITE_NAME
      }
    ],
    subject,
    textContent: text,
    htmlContent: html
  };

  if (fields.email) {
    payload.replyTo = {
      email: fields.email,
      name: fields.name
    };
  }

  const response = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return json({ ok: false, error: 'Email service rejected the request.' }, 502);
  }

  return json({ ok: true });
}
