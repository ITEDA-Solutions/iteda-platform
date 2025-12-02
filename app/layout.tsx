import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Providers from './providers'
import '../src/index.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ITEDA SOLUTIONS PLATFORM',
  description: 'ITEDA Solutions - Industrial monitoring and management platform',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
