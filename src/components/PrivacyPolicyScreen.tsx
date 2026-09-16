import { PRIVACY_NOTICE_PARAGRAPHS } from '../data/privacyPolicy'

/** Short privacy notice, opened from a "Privacy" link (see ClubHeader) rather than shipped as
 * a markdown file — reachable inside the app, before or after unlocking a group. Kept honest
 * and minimal on purpose: this app collects no real data today, so the notice says that
 * plainly rather than describing a data-processing policy that doesn't apply yet. */
export function PrivacyPolicyScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <header className="shrink-0 border-b border-black/10 bg-white px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] dark:border-white/10 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">Privacy</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-neutral-600 dark:border-white/10 dark:text-neutral-300"
          >
            Close
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-md space-y-3">
          {PRIVACY_NOTICE_PARAGRAPHS.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              {p}
            </p>
          ))}
        </div>
      </main>
    </div>
  )
}
