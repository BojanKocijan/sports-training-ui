import type { JerseyColor } from '../../hooks/usePlayers'
import { JerseyGraphic } from '../JerseyGraphic'

/** Live preview of the jersey being built in a create/edit form — mirrors the in-progress
 * nickname/color/number back to the trainer as they change them, instead of only showing the
 * result after Save. */
export function PlayerPreviewCard({
  nickname,
  jerseyColor,
  jerseyNumber,
}: {
  nickname: string
  jerseyColor: JerseyColor | null
  jerseyNumber: number | null
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <JerseyGraphic
        color={jerseyColor}
        number={jerseyNumber}
        nickname={nickname.trim() || 'Preview'}
        size="lg"
      />
      <p className="max-w-full truncate text-xs font-semibold text-neutral-500 dark:text-neutral-400">
        {nickname.trim() || 'New player'}
      </p>
    </div>
  )
}
