import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

// Ces métadonnées ne fonctionnent QUE si le fichier n'a PAS "use client"
export const metadata = {
  title: 'SKRINERLAB | Football Management System',
  description: 'Logiciel de gestion de club et de tactique de match',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-[#fcfcfc] text-[#1a1a1a] antialiased`}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}