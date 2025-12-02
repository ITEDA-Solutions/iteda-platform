import ProtectedRoute from '../../src/components/ProtectedRoute'
import Layout from '../../src/components/Layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <Layout>
        {children}
      </Layout>
    </ProtectedRoute>
  )
}
