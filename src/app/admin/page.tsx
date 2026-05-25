import Link from 'next/link'
import { getResources, getWelcomeText } from '@/lib/data'
import {
  createResource,
  deleteResource,
  moveResource,
  updateResource,
  updateWelcomeText,
} from '@/app/actions'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [welcomeText, items] = await Promise.all([getWelcomeText(), getResources()])

  return (
    <div className="admin-page">
      <Link href="/" className="admin-back">
        ← dashboard
      </Link>

      <h1>welcome text</h1>
      <div className="admin-card">
        <form action={updateWelcomeText} className="admin-form">
          <label>
            <span>welcome-text</span>
            <input type="text" name="welcome_text" defaultValue={welcomeText} required />
          </label>
          <div className="admin-actions">
            <button className="admin-button" type="submit">save</button>
          </div>
        </form>
      </div>

      <h2>add resource</h2>
      <div className="admin-card">
        <form action={createResource} className="admin-form">
          <div className="admin-form-row">
            <label>
              <span>name</span>
              <input type="text" name="name" required />
            </label>
            <label>
              <span>server name</span>
              <input type="text" name="server_name" />
            </label>
          </div>
          <div className="admin-form-row">
            <label>
              <span>url</span>
              <input type="url" name="url" required />
            </label>
            <label>
              <span>image (optional)</span>
              <input type="text" name="image" placeholder="https://… or empty" />
            </label>
          </div>
          <div className="admin-actions">
            <button className="admin-button" type="submit">create</button>
          </div>
        </form>
      </div>

      <h2>resources ({items.length})</h2>
      {items.map((resource, idx) => (
        <div className="admin-resource" key={resource.id}>
          <div className="admin-resource-header">
            <span className="name">{resource.name}</span>
            <span className="meta">#{resource.id} · order {resource.sortOrder}</span>
          </div>

          <div className="admin-reorder">
            <form action={moveResource}>
              <input type="hidden" name="id" value={resource.id} />
              <input type="hidden" name="direction" value="up" />
              <button
                className="admin-button"
                type="submit"
                disabled={idx === 0}
                aria-label="move up"
                title="move up"
              >
                ↑
              </button>
            </form>
            <form action={moveResource}>
              <input type="hidden" name="id" value={resource.id} />
              <input type="hidden" name="direction" value="down" />
              <button
                className="admin-button"
                type="submit"
                disabled={idx === items.length - 1}
                aria-label="move down"
                title="move down"
              >
                ↓
              </button>
            </form>
          </div>

          <form action={updateResource} className="admin-form">
            <input type="hidden" name="id" value={resource.id} />
            <div className="admin-form-row">
              <label>
                <span>name</span>
                <input type="text" name="name" defaultValue={resource.name} required />
              </label>
              <label>
                <span>server name</span>
                <input type="text" name="server_name" defaultValue={resource.serverName} />
              </label>
            </div>
            <div className="admin-form-row">
              <label>
                <span>url</span>
                <input type="url" name="url" defaultValue={resource.url} required />
              </label>
              <label>
                <span>image</span>
                <input type="text" name="image" defaultValue={resource.image} />
              </label>
            </div>
            <div className="admin-actions">
              <button className="admin-button" type="submit">save</button>
            </div>
          </form>

          <form action={deleteResource} style={{ marginTop: 10 }}>
            <input type="hidden" name="id" value={resource.id} />
            <button className="admin-button danger" type="submit">delete</button>
          </form>
        </div>
      ))}
    </div>
  )
}
