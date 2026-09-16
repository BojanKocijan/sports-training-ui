import { PRIVACY_NOTICE_PARAGRAPHS } from '../data/privacyPolicy'
import { Modal } from './ui/Modal'

/** Short privacy notice, opened from a "Privacy" link (see ClubHeader) rather than shipped as
 * a markdown file — reachable inside the app, before or after unlocking a group. Kept honest
 * and minimal on purpose: this app collects no real data today, so the notice says that
 * plainly rather than describing a data-processing policy that doesn't apply yet. */
export function PrivacyPolicyScreen({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Privacy" onClose={onClose}>
      <div className="space-y-3">
        {PRIVACY_NOTICE_PARAGRAPHS.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
            {p}
          </p>
        ))}
      </div>
    </Modal>
  )
}
