import { Section } from "@/components/ui/Section";
import { hasResume } from "@/lib/assets";
import { CONTACT, PROFILE, SECTIONS } from "@/lib/data";

/** Spec 3.1: server-only; no copy button. */
export function Contact() {
  return (
    <Section meta={SECTIONS.contact} titleClassName="h2 contact-title" className="contact">
      <p className="lead-muted reveal">{CONTACT.body}</p>
      <p className="contact-email reveal">
        <a href={`mailto:${PROFILE.email}`} className="link contact-email-link">{PROFILE.email}</a>
      </p>
      <ul className="contact-links reveal">
        <li><a href={PROFILE.linkedin} className="hit"><span className="link">LinkedIn</span></a></li>
        <li><a href={PROFILE.github} className="hit"><span className="link">GitHub</span></a></li>
        {hasResume()
          ? <li><a href={PROFILE.resumePath} className="hit" target="_blank" rel="noopener noreferrer"><span className="link">Resume (PDF)</span></a></li>
          : <li hidden data-missing="resume" />}
      </ul>
    </Section>
  );
}
