import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Scalio Admin',
  description: 'Scalio Operations Manager Portal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
