import { WEBSITE_URL } from '@/lib/site'

/** The lockup, linking back to the public website. */
export function BrandLink({ className = 'h-10 w-auto' }: { className?: string }) {
  return (
    <a href={WEBSITE_URL} className="inline-block" aria-label="Veno, back to the website">
      <img src="/brand/lockup-color.svg" alt="" className={className} />
    </a>
  )
}
