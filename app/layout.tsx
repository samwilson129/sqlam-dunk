import type { Metadata, Viewport } from 'next'
import { Anton, Archivo, IBM_Plex_Mono, Instrument_Serif } from 'next/font/google'
import './globals.css'

const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--ff-anton', display: 'swap' })
const archivo = Archivo({ subsets: ['latin'], variable: '--ff-archivo', display: 'swap' })
const plex = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--ff-plex', display: 'swap' })
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--ff-serif', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://sqlam-dunk.pages.dev'),
  authors: [{ name: 'SQLAM Dunk' }],
  title: 'SQLAM Dunk — The 3–1 Comeback',
  description: 'An editorial SQL investigation into the 2016 NBA Finals. Write queries, uncover evidence and reconstruct the comeback.',
  icons: {
    icon: '/chicken-basketball.avif',
    shortcut: '/chicken-basketball.avif',
    apple: '/chicken-basketball.avif',
  },
  openGraph: {
    title: 'SQLAM Dunk — Every query is a shot.',
    description: 'Learn SQL through 21 challenges across the seven games of the 2016 NBA Finals. Explore basketball history, from basic queries to joins and CTEs.',
    url: 'https://sqlam-dunk.pages.dev/',
    siteName: 'SQLAM Dunk',
    type: 'website',
    images: [
      {
        url: '/gifs/lebron-icon%20(2).gif',
        width: 960,
        height: 540,
        type: 'image/gif',
        alt: 'Cleveland Cavaliers No. 2 pixel-art player from the 2016 Finals.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SQLAM Dunk — Every query is a shot.',
    description: 'Learn SQL through 21 challenges across the seven games of the 2016 NBA Finals. Explore basketball history, from basic queries to joins and CTEs.',
    images: ['/gifs/lebron-icon%20(2).gif'],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f1e9d8',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${anton.variable} ${archivo.variable} ${plex.variable} ${serif.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
