import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            ITEDA Solutions Platform
          </Link>
          <Link href="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="container py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Solar Dryer Management Platform
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Monitor and manage your solar dryers with real-time data, analytics, and intelligent alerts.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/auth">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/50 py-20">
          <div className="container">
            <h2 className="mb-12 text-center text-3xl font-bold">Key Features</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Real-Time Monitoring</CardTitle>
                  <CardDescription>
                    Monitor temperature, humidity, and power metrics in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  Track your solar dryers' performance with live sensor data and instant updates.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Smart Alerts</CardTitle>
                  <CardDescription>
                    Get notified of important events and threshold breaches
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  Receive intelligent alerts for temperature anomalies, power issues, and maintenance needs.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analytics Dashboard</CardTitle>
                  <CardDescription>
                    Visualize trends and optimize dryer performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  Access comprehensive analytics, export data, and make informed decisions.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © 2025 ITEDA Solutions. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
