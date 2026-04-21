interface TableRowSkeletonProps {
  colSpan: number;
  rows?: number;
}

export function TableRowSkeleton({ colSpan, rows = 5 }: TableRowSkeletonProps) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <tr key={i} className="border-b border-slate-100 last:border-b-0">
          <td colSpan={colSpan} className="px-4 py-4">
            <div className="h-8 rounded bg-white animate-pulse" />
          </td>
        </tr>
      ))}
    </>
  );
}

interface CardListSkeletonProps {
  rows?: number;
  height?: string;
}

export function CardListSkeleton({ rows = 5, height = "h-36" }: CardListSkeletonProps) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className={`${height} rounded-2xl bg-white animate-pulse`} />
      ))}
    </div>
  );
}
