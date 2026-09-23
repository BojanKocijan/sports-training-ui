import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/apiClient'

export type AdminRole =
  | 'owner'
  | 'club_admin'
  | 'trainer'
  | 'co_coach'

export interface AdminOverview {
  stats: {
    workspaces: number
    staffAccounts: number
    platformAdmins: number
    groups: number
    players: number
  }

  workspaces: {
    id: string
    slug: string
    name: string
    tier: string | null
    groupCount: number
    playerCount: number
    staffCount: number
    ownerCount: number
    primaryGroupId: string | null
  }[]

  access: {
    userId: string
    email: string
    clubId: string
    workspace: string
    groupId: string | null
    groupName: string | null
    role: AdminRole
    active: boolean
    status: 'active' | 'invited' | 'inactive'
    createdAt: string
    lastSignInAt: string | null
  }[]

  parents: {
    linkId: string
    email: string
    childId: string | null
    childName: string
    groupId: string | null
    groupName: string | null
    status: 'active' | 'invited'
    createdAt: string
    lastSignInAt: string | null
  }[]

  platformAdmins: {
    userId: string
    email: string
    createdAt: string
    lastSignInAt: string | null
  }[]
}

export function useAdminOverview() {
  const [overview, setOverview] =
    useState<AdminOverview | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data =
        await api.get<AdminOverview>('/admin/overview')

      setOverview(data)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not load platform overview',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    overview,
    loading,
    error,
    refresh,
  }
}
