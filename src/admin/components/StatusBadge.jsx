/**
 * Status badge — maps ContactStatus enum values to styled pills.
 * Values: NEW | READ | REPLIED | ARCHIVED
 */
export default function StatusBadge({ status }) {
  const map = {
    NEW:      { label: 'New',      cls: 'a-badge a-badge--new' },
    READ:     { label: 'Read',     cls: 'a-badge a-badge--read' },
    REPLIED:  { label: 'Replied',  cls: 'a-badge a-badge--replied' },
    ARCHIVED: { label: 'Archived', cls: 'a-badge a-badge--archived' },
  };

  const { label, cls } = map[status] || { label: status, cls: 'a-badge' };
  return <span className={cls}>{label}</span>;
}
