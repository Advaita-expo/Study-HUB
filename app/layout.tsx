import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Status Focus - Study Activity Tracker',
  description: 'Track your study focus with real-time distraction detection and beautiful visualizations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="dark">{children}</body>
    </html>
  )
}
