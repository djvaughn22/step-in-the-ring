import { DETAIL_LABELS, type CatalogDetail } from "./catalog";
import styles from "./products.module.css";

/** The six plain facts every paid product states (owner, Nov 25 2026). */
export default function AtAGlance({ detail }: { detail: CatalogDetail }) {
  return (
    <dl className={styles.glance}>
      {(Object.keys(DETAIL_LABELS) as (keyof CatalogDetail)[]).map((key) => (
        <div key={key}>
          <dt>{DETAIL_LABELS[key]}</dt>
          <dd>{detail[key]}</dd>
        </div>
      ))}
    </dl>
  );
}
