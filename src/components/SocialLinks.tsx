import type { Settings } from "@/lib/settings";

export function SocialLinks({ settings, className = "" }: { settings: Settings; className?: string }) {
  const fb = settings.str("social.facebook_url");
  const ig = settings.str("social.instagram_url");
  if (!fb && !ig) return null;
  return (
    <ul className={`flex gap-3 ${className}`}>
      {fb && (
        <li>
          <a
            href={fb}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-line px-3 py-2 text-sm text-cream hover:border-gold hover:text-gold-light"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M14 8h3V4h-3c-2.8 0-4 1.9-4 4.3V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6.6-.6Z" />
            </svg>
            Facebook
          </a>
        </li>
      )}
      {ig && (
        <li>
          <a
            href={ig}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-line px-3 py-2 text-sm text-cream hover:border-gold hover:text-gold-light"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
            </svg>
            Instagram
          </a>
        </li>
      )}
    </ul>
  );
}
