import { Metadata } from 'next'
import BadgeIssuanceForm from '../../components/BadgeIssuanceForm'

export const metadata: Metadata = {
  title: 'Issue Badge | Certo',
  description: 'Issue digital badges using the Open Badges 3.0 standard.'
}

export default function IssuePage() {
  return (
    <main className="flex min-h-screen flex-col py-12 px-6">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Issue Badge</h1>
        <p className="text-gray-600 mb-10 text-center max-w-2xl mx-auto">
          Issue digital badges to recipients following the Open Badges 3.0 standard.
          Recipients will receive an email with their badge that they can share on
          social media platforms.
        </p>

        <BadgeIssuanceForm />
      </div>
    </main>
  )
} 