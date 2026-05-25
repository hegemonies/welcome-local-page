import Link from 'next/link'
import { getResources, getWelcomeText } from '@/lib/data'

export const dynamic = 'force-dynamic'

const PLACEHOLDER_IMAGE = '/resource-image-empty.svg'

export default async function HomePage() {
  const [welcomeText, items] = await Promise.all([getWelcomeText(), getResources()])

  return (
    <>
      <Link href="/admin" className="admin-link">
        admin
      </Link>

      <div className="welcome-resources">
        <div className="welcome-phrase">
          <p>{welcomeText}</p>
        </div>

        <div className="resources">
          {items.map((resource) => {
            const imageSrc = resource.image && resource.image.length > 0 ? resource.image : PLACEHOLDER_IMAGE
            return (
              <div className="resource" key={resource.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageSrc} alt="" />
                <div className="resource-texts">
                  <p className="resource-name">{resource.name}</p>
                  <p className="resource-server-name">{resource.serverName}</p>
                  <p className="resource-url">
                    <a href={resource.url}>{resource.url}</a>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
