import type { InquiryInput } from "@/lib/validation/inquiry";
import { topicLabels } from "@/lib/validation/inquiry";
import { site } from "@/data/site";
import type { VenueDetails } from "@/lib/content/venue";

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

export function inquiryEmailHtml(data: InquiryInput) {
  const rows: [string, string | undefined][] = [
    ["Name", data.name],
    ["Email", data.email],
    ["Phone", data.phone],
    ["About", topicLabels[data.topic]],
  ];
  const table = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;color:#6e675d;font-size:13px;letter-spacing:.08em;text-transform:uppercase">${k}</td><td style="padding:8px 12px;font-size:15px;color:#1b1916">${escape(v ?? "")}</td></tr>`,
    )
    .join("");

  return `<!doctype html><html><body style="margin:0;background:#f7f4ee;font-family:Georgia,serif;color:#1b1916">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border:1px solid #d5cdbe">
    <div style="padding:28px 32px;border-bottom:1px solid #d5cdbe">
      <div style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#b8975a">New message from the website</div>
      <h1 style="margin:12px 0 0;font-weight:400;font-size:28px">${escape(data.name)}</h1>
    </div>
    <table style="width:100%;border-collapse:collapse;padding:12px 20px">${table}</table>
    <div style="padding:20px 32px 32px">
      <div style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#b8975a;margin-bottom:8px">Message</div>
      <p style="margin:0;font-size:16px;line-height:1.6;white-space:pre-wrap">${escape(data.message)}</p>
    </div>
  </div></body></html>`;
}

export function inquiryEmailText(data: InquiryInput) {
  return [
    `New message from the website`,
    ``,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.phone ? `Phone: ${data.phone}` : null,
    `About: ${topicLabels[data.topic]}`,
    ``,
    data.message,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

/* ------------------------------------------------------------------ */
/* Auto-reply to the guest, with Chef Amrit's personal video message   */
/* ------------------------------------------------------------------ */

export function autoReplyHtml(data: InquiryInput, venue: VenueDetails) {
  const base = site.url.replace(/\/$/, "");
  const videoPage = `${base}/thank-you`;
  const poster = `${base}${site.thankYou.poster.src}`;
  return `<!doctype html><html><body style="margin:0;background:#1f130d;font-family:Helvetica,Arial,sans-serif;color:#f6efe2">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px">
    <div style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#e2bd6c">Chef Amrit Pal Singh · Angel Indian Restaurant</div>
    <h1 style="margin:16px 0 0;font-family:Georgia,serif;font-weight:400;font-size:34px;line-height:1.1">Thank you, ${escape(data.name)}.</h1>
    <p style="margin:18px 0 0;font-size:16px;line-height:1.7;color:#e9dcc4">${escape(site.thankYou.message)}</p>

    <a href="${videoPage}" style="display:block;margin:28px 0 0;text-decoration:none;border:1px solid rgba(226,189,108,.4);border-radius:18px;overflow:hidden;background:#2c1b12">
      <img src="${poster}" alt="${escape(site.thankYou.headline)}" width="600" style="display:block;width:100%;height:auto;opacity:.85">
      <div style="padding:16px 20px;background:linear-gradient(90deg,#2c1b12,#1f130d)">
        <span style="display:inline-block;padding:10px 18px;border-radius:999px;background:linear-gradient(90deg,#f0d9a0,#e2bd6c);color:#1f130d;font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase">&#9654;&nbsp; Watch the video message</span>
        <span style="display:block;margin-top:10px;font-family:Georgia,serif;font-size:18px;color:#f6efe2">${escape(site.thankYou.headline)}</span>
      </div>
    </a>

    <div style="margin:32px 0 0;padding:24px;border:1px solid rgba(246,239,226,.12);border-radius:18px;background:#2c1b12">
      <div style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#e2bd6c">Your message · ${escape(topicLabels[data.topic])}</div>
      <p style="margin:12px 0 0;font-size:14px;line-height:1.8;color:#e9dcc4;white-space:pre-wrap">${escape(data.message)}</p>
    </div>
${venue.resyUrl ? `
    <a href="${escape(venue.resyUrl)}" style="display:inline-block;margin:28px 0 0;padding:12px 22px;border-radius:999px;background:linear-gradient(90deg,#e8d29c,#a87c40);color:#1f130d;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase">Reserve a table at Angel</a>
` : ""}
    <p style="margin:32px 0 0;font-size:12px;line-height:1.7;color:#c9b391">${escape(venue.name)} · ${escape(venue.address.street)}, ${escape(venue.address.city)}, ${escape(venue.address.region)} ${escape(venue.address.postal)}<br>Michelin Guide · Bib Gourmand</p>
  </div></body></html>`;
}

export function autoReplyText(data: InquiryInput, venue: VenueDetails) {
  const base = site.url.replace(/\/$/, "");
  return [
    `Thank you, ${data.name}.`,
    ``,
    site.thankYou.message,
    ``,
    `Watch Chef Amrit's video message: ${base}/thank-you`,
    ``,
    `Your message (${topicLabels[data.topic]}):`,
    data.message,
    ``,
    ...(venue.resyUrl ? [`Reserve a table at Angel: ${venue.resyUrl}`, ``] : []),
    `${venue.name}, ${venue.address.street}, ${venue.address.city}, ${venue.address.region} ${venue.address.postal}`,
  ].join("\n");
}
