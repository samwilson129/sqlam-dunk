
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://sqlam-dunk.pages.dev'),

  title: 'SQLAM Dunk — The 3–1 Comeback',
  description:
    'SQLAM Dunk is an interactive SQL learning platform based on the 2016 NBA Finals. Solve 21 chronological challenges, explore historical basketball data and progress from basic SQL queries to advanced concepts like joins, CTEs and window functions.',

  icons: {
    icon: '/chicken-basketball.avif',
    shortcut: '/chicken-basketball.avif',
    apple: '/chicken-basketball.avif',
  },

  openGraph: {
    title: 'SQLAM Dunk — The 3–1 Comeback',
    description:
      'An interactive SQL learning experience based on the 2016 NBA Finals. Solve 21 challenges, analyse basketball statistics and master SQL through an investigation.',
    url: 'https://sqlam-dunk.pages.dev/',
    siteName: 'SQLAM Dunk',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SQLAM Dunk — Every query is a shot.',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'SQLAM Dunk — The 3–1 Comeback',
    description:
      'Learn SQL through an interactive investigation of the 2016 NBA Finals.',
    images: ['/og-image.png'],
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
      </body>
    </html>
  )
}
