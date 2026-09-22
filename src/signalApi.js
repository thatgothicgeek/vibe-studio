const isObject = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value)

const localNative =
  import.meta.env?.DEV === true

export const nativeSignalManagementAvailable =
  localNative

export const nativeSignalRefreshAvailable = true

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    cache: 'no-store',
    redirect: 'error',
    headers: {
      Accept: 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  if (
    !response.ok ||
    !response.headers
      .get('content-type')
      ?.includes('application/json')
  ) {
    throw new Error(
      `Signal API unavailable: ${response.status}`,
    )
  }

  return response.json()
}

function nativeReadUrl(
  localPath,
  hostedPath,
) {
  return localNative
    ? `/signal-api${localPath}`
    : `/api/native-signal${hostedPath}`
}

async function nativeReadRequest(
  localPath,
  hostedPath,
  options = {},
) {
  return requestJson(
    nativeReadUrl(
      localPath,
      hostedPath,
    ),
    options,
  )
}

async function localNativeRequest(
  path,
  options = {},
) {
  if (!nativeSignalManagementAvailable) {
    throw new Error(
      'Native Signal management is not yet enabled in hosted Studio.',
    )
  }

  return requestJson(
    `/signal-api${path}`,
    options,
  )
}

export async function getNativeSignalStatus(signal) {
  const data = await nativeReadRequest(
    '/signal/status/',
    '/status',
    {
      signal,
    },
  )

  if (
    !isObject(data) ||
    !['ready', 'warning'].includes(data.status) ||
    !isObject(data.sources) ||
    !isObject(data.stories)
  ) {
    throw new Error(
      'Invalid Signal status response',
    )
  }

  return data
}

export async function getNativeSources(signal) {
  const data = await nativeReadRequest(
    '/sources/',
    '/sources',
    {
      signal,
    },
  )

  if (
    !isObject(data) ||
    data.status !== 'ok' ||
    !Array.isArray(data.sources)
  ) {
    throw new Error(
      'Invalid Signal sources response',
    )
  }

  return data
}

export async function getNativeStories({
  limit = 20,
  signal,
} = {}) {
  const safeLimit =
    Number.isSafeInteger(limit) &&
    limit > 0 &&
    limit <= 100
      ? limit
      : 20

  const data = await nativeReadRequest(
    `/stories/?limit=${safeLimit}`,
    `/stories?limit=${safeLimit}`,
    {
      signal,
    },
  )

  if (
    !isObject(data) ||
    data.status !== 'ok' ||
    !Array.isArray(data.stories)
  ) {
    throw new Error(
      'Invalid Signal stories response',
    )
  }

  return data
}

export async function refreshNativeSignal(signal) {
  if (localNative) {
    const data = await localNativeRequest(
      '/signal/refresh/',
      {
        method: 'POST',
        signal,
      },
    )

    if (
      !isObject(data) ||
      !['ready', 'warning'].includes(data.status) ||
      !isObject(data.totals)
    ) {
      throw new Error(
        'Invalid Signal refresh response',
      )
    }

    return data
  }

  const data = await requestJson(
    '/api/actions/native-signal',
    {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action_type: 'refresh_all',
        payload: {},
      }),
    },
  )

  if (
    !isObject(data) ||
    data.status !== 'ok' ||
    !isObject(data.action) ||
    typeof data.action.request_id !== 'string'
  ) {
    throw new Error(
      'Invalid Native Signal action response',
    )
  }

  return {
    queued: true,
    request_id: data.action.request_id,
    status: data.action.status,
  }
}

export async function getNativeSignalAction(
  requestId,
  signal,
) {
  const data = await requestJson(
    `/api/actions/native-signal/${encodeURIComponent(requestId)}`,
    {
      signal,
    },
  )

  if (
    !isObject(data) ||
    data.status !== 'ok' ||
    !isObject(data.action)
  ) {
    throw new Error(
      'Invalid Native Signal action status response',
    )
  }

  return data.action
}

export async function createNativeSource(source) {
  const data = await localNativeRequest(
    '/sources/',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(source),
    },
  )

  if (
    !isObject(data) ||
    data.status !== 'ok' ||
    !isObject(data.source)
  ) {
    throw new Error(
      'Invalid source creation response',
    )
  }

  return data.source
}

export async function updateNativeSource(
  id,
  source,
) {
  const data = await localNativeRequest(
    `/sources/?id=${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(source),
    },
  )

  if (
    !isObject(data) ||
    data.status !== 'ok' ||
    !isObject(data.source)
  ) {
    throw new Error(
      'Invalid source update response',
    )
  }

  return data.source
}

export async function refreshNativeSource(id) {
  const data = await localNativeRequest(
    `/sources/refresh/?id=${encodeURIComponent(id)}`,
    {
      method: 'POST',
    },
  )

  if (
    !isObject(data) ||
    data.status !== 'ok' ||
    !isObject(data.source)
  ) {
    throw new Error(
      'Invalid source refresh response',
    )
  }

  return data.source
}
