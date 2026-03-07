# HOMEPAGE_CRO_AUDIT

## Scope audited
- Existing homepage renderer: `components/cms/home-sections.tsx`
- Homepage styles: `components/cms/home-sections.module.css`
- Public header/navigation: `components/site-header.tsx` + `app/globals.css`
- Home data orchestration: `app/page.tsx`

## Current strengths found
- Existing CMS section system already in place (hero/benefits/how-it-works/final CTA).
- Dynamic data already connected for trips, offers, raffles, testimonials and gallery.
- Good visual base with Framer Motion and premium editorial direction.
- Existing raffle integration and public routes already functional.

## CRO / UX issues detected
1. Hero clarity: aspirational tone existed but value proposition was not explicit enough in first 3 seconds.
2. CTA structure: actions existed but hierarchy was weak (insufficient prioritization for purchase-intent actions).
3. Discovery friction: no practical intent-capture bar to route users by destination/date/people/budget.
4. Trust strip quality: some metrics looked generic/weak and could reduce perceived traction.
5. Social proof depth: testimonials existed, but missing "filling fast" + "upcoming confirmed" blocks to drive urgency and confidence.
6. Benefits messaging: section copy felt generic and not tied strongly to operational benefits.
7. Raffle block conversion: present, but needed stronger urgency/progress framing from homepage context.
8. Public nav overload: too many top-level links competing for attention and lowering conversion focus.
9. Empty-state strategy: several sections lacked conversion-ready fallback states when data is sparse.
10. Homepage inventory scope: only featured trips fetched on home, reducing perceived catalog depth.

## Conversion risks observed
- Users may not understand quickly what to do next.
- Competing nav options dilute clicks into core business goals.
- Weak urgency/social-proof signals reduce action on raffles and trips.
- Sparse data scenarios can make the brand feel less active.

## Changes proposed (and implemented)
- Stronger hero value proposition + 3 clear CTAs.
- Discovery bar wired to `/viajes` with practical filters.
- Trust strip converted to concrete benefit-based proof.
- Stronger destination and offer cards with urgency labels.
- Raffle block upgraded with sold/available/progress + countdown focus.
- Added "viajes que se estan llenando" and "proximas salidas" blocks.
- Reintroduced/strengthened benefits section with clear operational value.
- Improved how-it-works clarity for faster decision-making.
- Added conversion-safe empty states with actionable fallback CTAs.
- Simplified public navigation and emphasized account CTA.
- Home now fetches all published trips (not only featured) for better merchandising.

## Expected impact
- Faster comprehension of offer and value proposition.
- Higher CTA click concentration on trips, raffles and custom requests.
- Better FOMO/urgency through visible progression and capacity signals.
- Better trust and intent quality before form submission.
- Stronger conversion resilience when catalog sections have low content volume.
