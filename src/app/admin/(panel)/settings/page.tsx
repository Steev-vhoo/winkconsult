import { Flash, Topbar } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { type DayHours, getSettings } from "@/lib/settings";
import { saveSettingsAction } from "../../actions";

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
  return (
    <>
      <Topbar title="Site settings" sub="Contact details, opening hours and the main text across the website." />
      <Flash sp={sp} />
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
