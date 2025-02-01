import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import Header from "./layout/header"
import Footer from "./layout/footer"

const inter = Inter({ subsets: ["latin"] })

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={inter.className}>
      <Header />
      {children}
      <Footer />
      <Toaster />
    </div>
  )
}
