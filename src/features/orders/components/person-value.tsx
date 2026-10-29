import Link from "next/link";
import type { Person } from "../detail";

/** A customer / rider cell: name (linked when `href` is given), display id and a tap-to-call phone. */
export function PersonValue({ person, href, unnamed }: { person: Person; href?: string | null; unnamed: string }) {
  const name = person.name || unnamed;
  return (
    <>
      {href ? (
        <Link href={href} className="text-primary hover:underline">
          {name}
        </Link>
      ) : (
        name
      )}
      {person.ref && <span className="block font-mono text-xs font-normal text-subtext">{person.ref}</span>}
      {person.phone && (
        <a href={`tel:${person.phone}`} dir="ltr" className="block text-xs font-normal text-subtext hover:text-text">
          {person.phone}
        </a>
      )}
    </>
  );
}
