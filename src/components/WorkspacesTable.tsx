import { ChevronLeft, ChevronRight, MoreVertical, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { AdminOverview } from '../hooks/useAdminOverview'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { DeleteWorkspaceDialog } from './DeleteWorkspaceDialog'

type Workspace = AdminOverview['workspaces'][number]

export type SortKey = 'name' | 'players' | 'groups' | 'created'
export interface TableState { query: string; sort: SortKey; desc: boolean; page: number; pageSize: number }
export const INITIAL_TABLE_STATE: TableState = { query: '', sort: 'name', desc: false, page: 0, pageSize: 10 }

/** Filter (name/slug), sort and slice one page. Pure so paging can be tested without the DOM. */
export function pageOfWorkspaces(workspaces: Workspace[], state: TableState) {
  const q = state.query.trim().toLowerCase()
  const filtered = q
    ? workspaces.filter((w) => w.name.toLowerCase().includes(q) || w.slug.toLowerCase().includes(q))
    : workspaces
  const value = (w: Workspace) =>
    state.sort === 'name' ? w.name.toLowerCase()
      : state.sort === 'players' ? w.playerCount
        : state.sort === 'groups' ? w.groupCount
          : w.createdAt ?? ''
  const sorted = [...filtered].sort((a, b) => (value(a) < value(b) ? -1 : value(a) > value(b) ? 1 : 0) * (state.desc ? -1 : 1))
  const pageCount = Math.max(1, Math.ceil(sorted.length / state.pageSize))
  const page = Math.min(state.page, pageCount - 1)
  return { rows: sorted.slice(page * state.pageSize, (page + 1) * state.pageSize), total: sorted.length, page, pageCount }
}

function dateLabel(value?: string) {
  return value ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)) : '—'
}

const th = 'px-4 py-3 font-semibold'

/** Workspaces as a searchable, sortable, paginated table; a row opens the workspace. */
export function WorkspacesTable({ overview, state, onState, onOpen, onDeleted }: {
  overview: AdminOverview
  state: TableState
  onState: (next: TableState) => void
  onOpen: (id: string) => void
  onDeleted: () => Promise<void>
}) {
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null)
  const { rows, total, page, pageCount } = pageOfWorkspaces(overview.workspaces, state)
  const ownerEmail = (w: Workspace) =>
    overview.access.find((a) => a.clubId === w.id && a.role === 'owner')?.email ?? null

  const sortHeader = (key: SortKey, label: string) => (
    <th scope="col" className={th} aria-sort={state.sort === key ? (state.desc ? 'descending' : 'ascending') : 'none'}>
      <button type="button" className="font-semibold"
        onClick={() => onState({ ...state, sort: key, desc: state.sort === key ? !state.desc : false, page: 0 })}>
        {label}{state.sort === key ? (state.desc ? ' ↓' : ' ↑') : ''}
      </button>
    </th>
  )

  return (
    <div className="space-y-3">
      <input
        type="search" aria-label="Search workspaces" placeholder="Search by name or slug"
        value={state.query} onChange={(e) => onState({ ...state, query: e.target.value, page: 0 })}
        className="w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr>
              {sortHeader('name', 'Workspace')}
              <th scope="col" className={th}>Plan</th>
              {sortHeader('groups', 'Groups')}
              {sortHeader('players', 'Players')}
              <th scope="col" className={th}>Owner</th>
              {sortHeader('created', 'Created')}
              <th scope="col" className="w-10 px-2 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-3">
                  <button type="button" onClick={() => onOpen(w.id)} className="text-left font-medium text-primary hover:underline">
                    {w.name}
                  </button>
                  <p className="text-xs text-muted-foreground">{w.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold uppercase">{w.tier ?? '—'}</span>
                  {w.tier === 'free' && w.playerLimit !== undefined && (
                    <span className="ml-2 text-xs text-muted-foreground">{w.playerLimit} players max</span>
                  )}
                </td>
                <td className="px-4 py-3">{w.groupCount}</td>
                <td className="px-4 py-3">{w.playerCount}</td>
                <td className="px-4 py-3 text-muted-foreground">{ownerEmail(w) ?? 'No owner'}</td>
                <td className="px-4 py-3 text-muted-foreground">{dateLabel(w.createdAt)}</td>
                <td className="px-2 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${w.name}`}>
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(w)}>
                        <Trash2 />
                        Delete workspace
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No workspaces found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{total} {total === 1 ? 'workspace' : 'workspaces'} · page {page + 1} of {pageCount}</span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">
            Rows
            <select value={state.pageSize} onChange={(e) => onState({ ...state, pageSize: Number(e.target.value), page: 0 })}
              className="rounded-lg border border-border bg-background px-2 py-1">
              {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <Button variant="secondary" size="icon" aria-label="Previous page" disabled={page === 0}
            onClick={() => onState({ ...state, page: page - 1 })}><ChevronLeft /></Button>
          <Button variant="secondary" size="icon" aria-label="Next page" disabled={page >= pageCount - 1}
            onClick={() => onState({ ...state, page: page + 1 })}><ChevronRight /></Button>
        </div>
      </div>
      <DeleteWorkspaceDialog workspace={deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }} onDeleted={onDeleted} />
    </div>
  )
}
