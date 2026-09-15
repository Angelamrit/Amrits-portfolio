import type { InquiryInput } from "@/lib/validation/inquiry";
import { budgetLabels, experienceLabels } from "@/lib/validation/inquiry";
import { process } from "@/data/process";
import { site } from "@/data/site";

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

export function inquiryEmailHtml(data: InquiryInput) {
  const rows: [string, string | undefined][] = [
    ["Name", data.name],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Experience", experienceLabels[data.experience]],
    ["Event date", data.eventDate],
    ["Location", data.location],
    ["Guests", String(data.guests)],
    ["Dietary requirements", data.dietary],
    ["Budget", data.budget ? budgetLabels[data.budget] : undefined],
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
      <div style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#b8975a">New private experience enquiry</div>
      <h1 style="margin:12px 0 0;font-weight:400;font-size:28px">${escape(data.name)}</h1>
    </div>
    <table style="width:100%;border-collapse:collapse;padding:12px 20px">${table}</table>
    <div style="padding:20px 32px 32px">
      <div style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#b8975a;margin-bottom:8px">About the event</div>
      <p style="margin:0;font-size:16px;line-height:1.6;white-space:pre-wrap">${escape(data.message)}</p>
    </div>
  </div></body></html>`;
}

export function inquiryEmailText(data: InquiryInput) {
  return [
    `New private experience enquiry`,
    ``,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.phone ? `Phone: ${data.phone}` : null,
    `Experience: ${experienceLabels[data.experience]}`,
    data.eventDate ? `Event date: ${data.eventDate}` : null,
    data.location ? `Location: ${data.location}` : null,
    `Guests: ${data.guests}`,
    data.dietary ? `Dietary: ${data.dietary}` : null,
    data.budget ? `Budget: ${budgetLabels[data.budget]}` : null,
    ``,
    data.message,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

/* ------------------------------------------------------------------ */
/* Auto-reply to the guest, with Chef Amrit's personal video message   */
/* ------------------------------------------------------------------ */

export function autoReplyHtml(data: InquiryInput) {
  const base = site.url.replace(/\/$/, "");
  const videoPage = `${base}/thank-you`;
  const poster = `${base}${site.thankYou.poster.src}`;
  const steps = process
    .map(
      (s) =>
        `<tr><td style="padding:10px 0;vertical-align:top;width:36px;font-family:Georgia,serif;font-size:20px;color:#e2bd6c">${String(s.step).padStart(2, "0")}</td><td style="padding:10px 0;font-size:14px;line-height:1.6;color:#f6efe2"><strong style="font-weight:400;font-family:Georgia,serif;font-size:17px">${escape(s.title)}</strong><br><span style="color:#c9b391">${escape(s.body)}</span></td></tr>`,
    )
    .join("");

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
      <div style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#e2bd6c">Your enquiry</div>
      <p style="margin:12px 0 0;font-size:14px;line-height:1.8;color:#e9dcc4">
        ${escape(experienceLabels[data.experience])} · ${data.guests} guests${data.eventDate ? ` · ${escape(data.eventDate)}` : ""}${data.location ? ` · ${escape(data.location)}` : ""}${data.budget ? ` · ${escape(budgetLabels[data.budget])}` : ""}
      </p>
    </div>

    <div style="margin:32px 0 0">
      <div style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#e2bd6c">What happens next</div>
      <table style="width:100%;border-collapse:collapse;margin-top:8px">${steps}</table>
    </div>

    <p style="margin:32px 0 0;font-size:12px;line-height:1.7;color:#c9b391">${escape(site.restaurant.name)} · ${escape(site.restaurant.address.street)}, ${escape(site.restaurant.address.city)}, ${escape(site.restaurant.address.region)} ${escape(site.restaurant.address.postal)}<br>Michelin Guide · Bib Gourmand</p>
  </div></body></html>`;
}

export function autoReplyText(data: InquiryInput) {
  const base = site.url.replace(/\/$/, "");
  return [
    `Thank you, ${data.name}.`,
    ``,
    site.thankYou.message,
    ``,
    `Watch Chef Amrit's video message: ${base}/thank-you`,
    ``,
    `Your enquiry: ${experienceLabels[data.experience]} · ${data.guests} guests${data.eventDate ? ` · ${data.eventDate}` : ""}${data.location ? ` · ${data.location}` : ""}`,
    ``,
    `What happens next:`,
    ...process.map((s) => `${s.step}. ${s.title}: ${s.body}`),
    ``,
    `${site.restaurant.name}, ${site.restaurant.address.street}, ${site.restaurant.address.city}, ${site.restaurant.address.region} ${site.restaurant.address.postal}`,
  ].join("\n");
}
