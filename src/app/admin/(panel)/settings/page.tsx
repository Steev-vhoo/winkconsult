import { Flash, Topbar } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { type DayHours, getSettings } from "@/lib/settings";
import { emailConfigured } from "@/lib/email";
import { saveSettingsAction, sendTestAlert } from "../../actions";

export const metadata = { title: "Site settings" };

function Day({ id, label, d }: { id: string; label: string; d: DayHours }) {
  return (
    <div className="row3" style={{ alignItems: "end" }}>
      <div><label htmlFor={`${id}_open`}>{label}: opens</label><input id={`${id}_open`} name={`${id}_open`} type="time" defaultValue={d.open} /></div>
      <div><label htmlFor={`${id}_close`}>Closes</label><input id={`${id}_close`} name={`${id}_close`} type="time" defaultValue={d.close} /></div>
      <div style={{ paddingBottom: 10 }}><label className="check"><input type="checkbox" name={`${id}_closed`} defaultChecked={d.closed} /> Closed all day</label></div>
    </div>
  );
}

export default async function Settings({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("admin");
  const [sp, s] = await Promise.all([searchParams, getSettings()]);
  const configured = emailConfigured();
  const fallback = !s.notify.emails.length && process.env.NOTIFY_TO;
  return (
    <>
      <Topbar title="Site settings" sub="Contact details, opening hours and the main text across the website." />
      <Flash sp={sp} messages={{ email: `“${sp.bad ?? ""}” isn't a valid email address. Nothing was saved.` }} />
      <form className="f" action={saveSettingsAction}>
        <fieldset className="box f">
          <legend>Contact details</legend>
          <div className="row2">
            <div><label htmlFor="whatsapp">WhatsApp number</label><input id="whatsapp" name="whatsapp" type="tel" required defaultValue={s.contact.whatsapp} /><p className="hint">Include the country code, e.g. +233 20 837 6517. Every WhatsApp button uses this.</p></div>
            <div><label htmlFor="phone">Phone number for calls</label><input id="phone" name="phone" type="tel" defaultValue={s.contact.phone} /></div>
          </div>
          <div className="row2">
            <div><label htmlFor="email">Email</label><input id="email" name="email" type="email" defaultValue={s.contact.email} /></div>
            <div><label htmlFor="tiktok">TikTok handle</label><input id="tiktok" name="tiktok" type="text" defaultValue={s.contact.tiktok} placeholder="wink_consult" /></div>
          </div>
          <div className="row2">
            <div><label htmlFor="whatsappGroup">WhatsApp group invite link</label><input id="whatsappGroup" name="whatsappGroup" type="url" defaultValue={s.contact.whatsappGroup} placeholder="https://chat.whatsapp.com/…" /></div>
            <div><label htmlFor="address">Office address (optional)</label><input id="address" name="address" type="text" defaultValue={s.contact.address} /></div>
          </div>
        </fieldset>

        <fieldset className="box f" id="alerts" style={{ scrollMarginTop: 20 }}>
          <legend>Email alerts for new enquiries</legend>
          {sp.test === "sent" && <div className="flash ok" style={{ margin: 0 }}>Test email sent to {sp.to}. Check the inbox (and the spam folder).</div>}
          {sp.test === "failed" && <div className="flash err" style={{ margin: 0 }}>Test email failed: {sp.msg}</div>}
          {!configured && (
            <div className="flash err" style={{ margin: 0 }}>
              Email sending isn&apos;t switched on yet. Add <code>RESEND_API_KEY</code> (and <code>EMAIL_FROM</code>) in the hosting settings. See the README.
            </div>
          )}
          <div>
            <label htmlFor="notify_emails">Send an email to</label>
            <textarea id="notify_emails" name="notify_emails" defaultValue={s.notify.emails.join("\n")} style={{ minHeight: 80 }} placeholder="winkconsult24@gmail.com" />
            <p className="hint">
              One address per line (up to 10). Everyone listed gets an email for each new enquiry, with the message and a WhatsApp reply button.
              {fallback && ` Currently using the NOTIFY_TO fallback: ${process.env.NOTIFY_TO}.`}
            </p>
          </div>
          <div className="actions">
            <button className="btn btn-ghost btn-sm" formAction={sendTestAlert} formNoValidate disabled={!configured}>Send a test email</button>
            <span className="hint" style={{ margin: 0 }}>Uses the saved addresses. Save first if you changed them.</span>
          </div>
        </fieldset>

        <fieldset className="box f">
          <legend>Booking hours (GMT)</legend>
          <Day id="weekdays" label="Monday – Friday" d={s.hours.weekdays} />
          <Day id="saturday" label="Saturday" d={s.hours.saturday} />
          <Day id="sunday" label="Sunday" d={s.hours.sunday} />
          <p className="hint" style={{ margin: 0 }}>Consultation time slots on the booking form follow these hours.</p>
        </fieldset>

        <fieldset className="box f">
          <legend>Home page</legend>
          <div className="row2">
            <div><label htmlFor="hero_title">Headline</label><input id="hero_title" name="hero_title" type="text" defaultValue={s.hero.title} /></div>
            <div><label htmlFor="hero_accent">Headline (green part)</label><input id="hero_accent" name="hero_accent" type="text" defaultValue={s.hero.accent} /></div>
          </div>
          <div><label htmlFor="hero_lead">Intro paragraph</label><textarea id="hero_lead" name="hero_lead" defaultValue={s.hero.lead} style={{ minHeight: 80 }} /></div>
          <div><label htmlFor="destinations">Popular destinations</label><textarea id="destinations" name="destinations" defaultValue={s.destinations.join("\n")} style={{ minHeight: 120 }} /><p className="hint">One country per line. Leave empty to hide the section.</p></div>
          <div><label htmlFor="banner">Notice bar at the top of every page</label><input id="banner" name="banner" type="text" defaultValue={s.banner} placeholder="e.g. Closed on 25 December. Happy holidays!" /><p className="hint">Leave empty to hide it.</p></div>
        </fieldset>

        <fieldset className="box f">
          <legend>Brand &amp; About page</legend>
          <div className="row2">
            <div><label htmlFor="tagline">Tagline</label><input id="tagline" name="tagline" type="text" defaultValue={s.brand.tagline} /></div>
            <div><label htmlFor="hashtag">Hashtag</label><input id="hashtag" name="hashtag" type="text" defaultValue={s.brand.hashtag} /></div>
          </div>
          <div><label htmlFor="about_intro">About intro</label><textarea id="about_intro" name="about_intro" defaultValue={s.about.intro} style={{ minHeight: 70 }} /></div>
          <div className="row2">
            <div><label htmlFor="vision">Vision</label><textarea id="vision" name="vision" defaultValue={s.about.vision} /></div>
            <div><label htmlFor="mission">Mission</label><textarea id="mission" name="mission" defaultValue={s.about.mission} /></div>
          </div>
        </fieldset>

        <div className="actions"><button className="btn btn-primary">Save settings</button></div>
      </form>
    </>
  );
}
