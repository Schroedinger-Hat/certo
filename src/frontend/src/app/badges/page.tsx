import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Explore Badges | Certo',
  description: 'Explore all available digital badges that can be issued through Certo.'
}

// This is a server component that will fetch the badges directly from the API
async function getBadges() {
  // Use cached data from the API
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/achievements?populate=*`, {
    next: { revalidate: 60 }, // Revalidate the data at most every 60 seconds
    headers: {
      'Content-Type': 'application/json',
      // API key will need to be set in Strapi and environment variables
      // For now, we're including the fetch in a try/catch to handle errors
    },
    cache: 'no-store' // Ensure we're not using browser cache
  })
  
  if (!res.ok) {
    throw new Error('Failed to fetch badges')
  }
  
  return res.json()
}

export default async function BadgesPage() {
  let badges = []
  let error = null
  
  try {
    const data = await getBadges()
    badges = data.data || []
  } catch (err) {
    console.error('Error fetching badges:', err)
    error = 'Failed to load badges. Please try again later.'
  }
  
  return (
    <main className="flex min-h-screen flex-col py-12 px-6">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Explore Badges</h1>
        
        <div className="flex justify-between items-center mb-8">
          <p className="text-gray-600">
            Browse all available digital badges that can be issued through Certo.
          </p>
          
          <Link
            href="/issue"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Issue Badge
          </Link>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md mb-6">
            {error}
          </div>
        )}
        
        {badges.length === 0 && !error ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No badges available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {badges.map((badge: any) => (
              <div 
                key={badge.id} 
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-square relative">
                  {badge.attributes.image?.data && (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}${badge.attributes.image.data.attributes.url}`}
                      alt={badge.attributes.name}
                      className="w-full h-full object-contain p-4"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{badge.attributes.name}</h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {badge.attributes.description}
                  </p>
                  {badge.attributes.issuer?.data && (
                    <p className="mt-2 text-xs text-gray-500">
                      Issuer: {badge.attributes.issuer.data.attributes.name}
                    </p>
                  )}
                  <div className="mt-4">
                    <Link
                      href={`/badges/${badge.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
} 