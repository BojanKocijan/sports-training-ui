import { PRIVACY_NOTICE_PARAGRAPHS } from '../data/privacyPolicy'
import { Modal } from './ui/modal'

/** Short privacy notice, opened from a "Privacy" link (see ClubHeader) rather than shipped as
 * a markdown file — reachable inside the app, before or after unlocking a group. Kept in sync
 * with the fuller PRIVACY.md (see that file's own doc comment for the update discipline). */
export function PrivacyPolicyScreen({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Privacy" onClose={onClose}>
      <div className="space-y-3">
        {PRIVACY_NOTICE_PARAGRAPHS.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-muted-foreground">
            {p}
          </p>
        ))}
      </div>
    </Modal>
  )
}
