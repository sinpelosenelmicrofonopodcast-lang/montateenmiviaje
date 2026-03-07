import Link from "next/link";
import { PageSection } from "@/lib/cms-service";

interface GenericSectionsRendererProps {
  sections: PageSection[];
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function GenericSectionsRenderer({ sections }: GenericSectionsRendererProps) {
  const ordered = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section className="stack-grid section">
      {ordered.map((section) => {
        const content = asRecord(section.content);
        const items = asArray(content.items).map((item) => asRecord(item));

        return (
          <article key={section.id} className="card">
            {section.badge ? <p className="chip">{section.badge}</p> : null}
            <h3>{section.title || section.sectionKey}</h3>
            {section.subtitle ? <p className="section-subtitle">{section.subtitle}</p> : null}

            {items.length > 0 ? (
              <div className="stack-grid" style={{ marginTop: "12px" }}>
                {items.map((item, index) => (
                  <div key={`${section.id}-${index}`}>
                    <p style={{ margin: 0, fontWeight: 700 }}>{asString(item.title) || asString(item.q)}</p>
                    <p className="muted" style={{ marginTop: "6px" }}>
                      {asString(item.description) || asString(item.a)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {section.ctaLabel && section.ctaHref ? (
              <div className="button-row">
                <Link href={section.ctaHref} className="button-outline">
                  {section.ctaLabel}
                </Link>
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
