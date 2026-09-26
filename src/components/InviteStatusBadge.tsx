export function InviteStatusBadge({ confirmed }: { confirmed: boolean }) {
  return <span className={`text-xs font-semibold ${confirmed ? 'text-green-600' : 'text-amber-600'}`}>
    {confirmed ? 'Confirmed' : 'Pending'}
  </span>
}
