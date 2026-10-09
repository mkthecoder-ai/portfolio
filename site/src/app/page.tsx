import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { About } from "@/components/sections/About";
import { Certifications } from "@/components/sections/Certifications";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { DuskHero } from "@/components/hero/DuskHero";
import { Play } from "@/components/sections/Play";
import { Services } from "@/components/sections/Services";
import { Stack } from "@/components/sections/Stack";
import { Work } from "@/components/sections/Work";
import { LivingSky } from "@/components/sky/LivingSky";
import { hasResume } from "@/lib/assets";
import { NAV, OBSERVED_SECTION_IDS, PROFILE } from "@/lib/data";

export default function Home() {
  return (
    <>
      <LivingSky />
      <Header items={NAV} observeIds={OBSERVED_SECTION_IDS} name={PROFILE.name} handle={PROFILE.handle} resumeHref={hasResume() ? PROFILE.resumePath : null} />
      <main id="main" tabIndex={-1}>
        <DuskHero />
        <Work />
        <About />
        <Play />
        <Services />
        <Stack />
        <Experience />
        <Certifications />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
