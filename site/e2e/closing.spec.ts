import { test, expect } from "./fixtures";

const RESUME = "/Manoj_Kumar_M_Resume.pdf";

test("certifications: name (code), issuer · year, a small badge and a Verify link; then the in-progress row", async ({ page }) => {
  await page.goto("/");
  const rows = page.locator("#certifications .cert-row");
  await expect(rows).toHaveCount(4);
  const expected = [
    { name: "Azure Administrator Associate (AZ-104)", meta: "Microsoft · 2026", badge: "/badges/az-104.svg", verify: "https://learn.microsoft.com/api/credentials/share/en-us/MANOJKUMARM-0248/86275562C52DBC07?sharingId=346965264DE87BDA" },
    { name: "Terraform Associate (003)", meta: "HashiCorp (IBM) · 2025", badge: "/badges/terraform-associate-003.webp", verify: "https://www.credly.com/badges/5bb7c69e-706c-42e1-a0b4-23b5f54f7950/public_url" },
    { name: "Azure Fundamentals (AZ-900)", meta: "Microsoft · 2023", badge: "/badges/az-900.svg", verify: "https://learn.microsoft.com/api/credentials/share/en-us/MANOJKUMARM-0248/63F13D872332851A?sharingId=346965264DE87BDA" },
  ];
  for (const [i, c] of expected.entries()) {
    const row = rows.nth(i);
    await expect(row).toContainText(c.name);
    await expect(row.locator(".cert-meta")).toHaveText(c.meta);
    const img = row.locator("img");
    await expect(img).toHaveAttribute("src", c.badge);
    // Spec 5.3: shown at 128px (96px on phones); sized up front, so no layout shift.
    await expect(img).toHaveAttribute("width", "128");
    await expect(img).toHaveAttribute("height", "128");
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    const verify = row.getByRole("link", { name: /^Verify/ });
    await expect(verify).toHaveAttribute("href", c.verify);
    await expect(verify).toHaveAttribute("target", "_blank");
    await expect(verify).toHaveAttribute("rel", "noopener noreferrer");
  }
  await expect(rows.nth(3)).toContainText("In progress");
  await expect(rows.nth(3)).toContainText("Certified Kubernetes Administrator (CKA)");
  await expect(page.locator("#certifications")).not.toContainText("MANOJKUMARM");
});

test("contact: email, LinkedIn, GitHub and the résumé in a new tab; no phone and no copy button", async ({ page }) => {
  await page.goto("/");
  const contact = page.locator("#contact");
  await expect(contact.getByRole("heading", { level: 2 })).toHaveText("Let's talk");
  await expect(contact.getByRole("link", { name: "manojkumarm0107@gmail.com" })).toHaveAttribute("href", "mailto:manojkumarm0107@gmail.com");
  await expect(contact.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", "https://www.linkedin.com/in/mkthecoder");
  await expect(contact.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/mkthecoder-ai");
  const resume = contact.getByRole("link", { name: "Resume (PDF)" });
  await expect(resume).toHaveAttribute("href", RESUME);
  await expect(resume).toHaveAttribute("target", "_blank");
  await expect(resume).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  await expect(contact.locator("button")).toHaveCount(0);
});

test("footer: wordmark, credit, last-updated date and back to top; the links live in Contact only (spec 5.5)", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.locator(".footer-wordmark")).toHaveText("Manoj Kumar");
  await expect(footer).toContainText(`© ${new Date().getFullYear()} Manoj Kumar`);
  await expect(footer).toContainText("Built with Azure Static Web Apps and Terraform");
  await expect(footer).toContainText(/Last updated \d{1,2} [A-Z][a-z]{2,4} \d{4}/);
  await expect(footer.getByRole("link", { name: "Back to top" })).toHaveAttribute("href", "#home");
  await expect(footer.getByRole("link", { name: /resume|linkedin|github/i })).toHaveCount(0);
  // One set of links, in Contact: email, LinkedIn, GitHub and the résumé (new tab).
  const contact = page.locator("#contact");
  await expect(contact.getByRole("link", { name: "LinkedIn" })).toHaveCount(1);
  await expect(contact.getByRole("link", { name: "GitHub" })).toHaveCount(1);
  const resume = contact.getByRole("link", { name: /Resume/ });
  await expect(resume).toHaveAttribute("href", RESUME);
  await expect(resume).toHaveAttribute("target", "_blank");
  await expect(contact.getByRole("link", { name: /@gmail\.com/ })).toHaveCount(1);
});

test("the résumé PDF is served", async ({ request }) => {
  const res = await request.get(RESUME);
  expect(res.ok()).toBe(true);
  expect(res.headers()["content-type"]).toContain("application/pdf");
});

test("small links keep a 44px touch target while the underline hugs the text", async ({ page }) => {
  await page.goto("/");
  const links = page.locator("#contact .contact-links a, footer .footer-row a, #certifications .cert-verify");
  expect(await links.count()).toBeGreaterThanOrEqual(7);
  const boxes = await links.evaluateAll((els) => els.map((a) => {
    const underlined = a.classList.contains("link") ? a : a.querySelector(".link");
    return { text: a.textContent, target: a.getBoundingClientRect().height, underlined: underlined ? underlined.getBoundingClientRect().height : -1 };
  }));
  for (const b of boxes) {
    expect(b.target, `${b.text}: touch target`).toBeGreaterThanOrEqual(44);
    expect(b.underlined, `${b.text}: underlined box`).toBeGreaterThan(0);
    expect(b.underlined, `${b.text}: underlined box`).toBeLessThanOrEqual(32);
  }
});
