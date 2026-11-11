
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://sqlam-dunk.pages.dev'),

  title: 'SQLAM Dunk — Every query is a shot.',
  description:
    'SQLAM Dunk is an interactive SQL learning platform based on the 2016 NBA Finals. Solve 21 chronological challenges across seven games, explore historical basketball data, and progress from basic SQL queries to advanced concepts like joins, CTEs, and window functions. Built for learners who want real SQL practice with live data.',
  authors: [{ name: 'SQLAM Dunk' }],

  icons: {
    icon: '/chicken-basketball.avif',
    shortcut: '/chicken-basketball.avif',
    apple: '/chicken-basketball.avif',
  },

  openGraph: {
    title: 'SQLAM Dunk — Every query is a shot.',
    description:
      'SQLAM Dunk is an interactive SQL learning platform based on the 2016 NBA Finals. Solve 21 chronological challenges across seven games, explore historical basketball data, and progress from basic SQL queries to advanced concepts like joins, CTEs, and window functions.',
    url: 'https://sqlam-dunk.pages.dev/',
    siteName: 'SQLAM Dunk',
    type: 'website',
    images: [
      {
        url: '/og-share.png',
        width: 1424,
        height: 752,
        alt: 'SQLAM Dunk — Every query is a shot.',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'SQLAM Dunk — Every query is a shot.',
    description:
      'Learn SQL through an interactive investigation of the 2016 NBA Finals. Solve 21 chronological challenges across seven games and master concepts from basic SELECT to advanced window functions.',
    images: ['/og-share.png'],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
