/**
 * Pagination controls.
 * Uses real values from the backend pagination object:
 * { page, limit, total, totalPages }
 *
 * Props:
 *   pagination  — { page, totalPages, total }
 *   onChange    — (newPage: number) => void
 */
export default function Pagination({ pagination, onChange }) {
  const { page, totalPages, total } = pagination;

  if (totalPages <= 1) return null;

  const pages = buildPageList(page, totalPages);

  return (
    <nav className="a-pagination" aria-label="Pagination">
      <span className="a-pagination__info">
        Page {page} of {totalPages} ({total} total)
      </span>
      <div className="a-pagination__controls">
        <button
          className="a-btn a-btn--ghost a-btn--sm"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          ← Prev
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="a-pagination__ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`a-btn a-btn--sm ${p === page ? 'a-btn--primary' : 'a-btn--ghost'}`}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          className="a-btn a-btn--ghost a-btn--sm"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </nav>
  );
}

/** Builds a compact page list with ellipsis for large page counts */
function buildPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [1];
  if (current > 3) pages.push('…');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}
