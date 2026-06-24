import worker from '../CORSAPI/_worker.js'

const AUTHENTICATE_HEADERS = {
  'www-authenticate': 'Basic realm="Private LunaTV"',
}

export default async function onRequest(context) {
  const env = context.env || {}
  const privateToken = env.PRIVATE_TOKEN

  if (!privateToken) {
    return new Response('Missing PRIVATE_TOKEN', { status: 500 })
  }

  let request = context.request
  const authMethod = getAuthorizationMethod(request, privateToken)

  if (!authMethod) {
    return new Response('Unauthorized', {
      status: 401,
      headers: AUTHENTICATE_HEADERS,
    })
  }

  request = stripPrivateAuthHeaders(request, privateToken, authMethod)
  request = injectPrivatePrefix(request, privateToken)

  return worker.fetch(request, env, { waitUntil: context.waitUntil })
}

function getAuthorizationMethod(request, privateToken) {
  const url = new URL(request.url)

  if (url.searchParams.get('key') === privateToken) {
    return 'query'
  }

  if (request.headers.get('x-api-key') === privateToken) {
    return 'x-api-key'
  }

  if (getBasicAuthPassword(request.headers.get('authorization')) === privateToken) {
    return 'basic'
  }

  return null
}

function getBasicAuthPassword(authorization) {
  if (!authorization) return null

  const match = authorization.match(/^Basic\s+(.+)$/i)
  if (!match) return null

  try {
    const decoded = atob(match[1])
    const separatorIndex = decoded.indexOf(':')
    if (separatorIndex === -1) return null
    return decoded.slice(separatorIndex + 1)
  } catch {
    return null
  }
}

function stripPrivateAuthHeaders(request, privateToken, authMethod) {
  const headers = new Headers(request.headers)
  let changed = false

  if (headers.get('x-api-key') === privateToken) {
    headers.delete('x-api-key')
    changed = true
  }

  if (authMethod === 'basic') {
    headers.delete('authorization')
    changed = true
  }

  return changed ? new Request(request, { headers }) : request
}

function injectPrivatePrefix(request, privateToken) {
  const url = new URL(request.url)

  if (!url.searchParams.has('format') || url.searchParams.has('prefix')) {
    return request
  }

  url.searchParams.set('prefix', `${url.origin}/?key=${encodeURIComponent(privateToken)}&url=`)
  return new Request(url.toString(), request)
}
