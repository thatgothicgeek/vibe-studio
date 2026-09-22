const isObject = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value)

async function signalRequest(path, options = {}) {
  const response = await fetch(`/signal-api${path}`, {
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
    throw new Error(`Signal API unavailable: ${response.status}`)
  }

  return response.json()
}

export async function getNativeSignalStatus(signal) {
  const data = await signalRequest('/signal/status/', {
    signal,
  })

  if (
    !isObject(data) ||
    !['ready', 'warning'].includes(data.status) ||
    !isObject(data.sources) ||
    !isObject(data.stories)
  ) {
    throw new Error('Invalid Signal status response')
  }

  return data
}

export async function getNativeSources(signal) {
  const data = await signalRequest('/sources/', {
    signal,
  })

  if (
    !isObject(data) ||
    data.status !== 'ok' ||
    !Array.isArray(data.sources)
  ) {
    throw new Error('Invalid Signal sources response')
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

  const data = await signalRequest(
    `/stories/?limit=${safeLimit}`,
    { signal },
  )

  if (
    !isObject(data) ||
    data.status !== 'ok' ||
    !Array.isArray(data.stories)
  ) {
    throw new Error('Invalid Signal stories response')
  }

  return data
}

export async function refreshNativeSignal(signal) {
  const data = await signalRequest('/signal/refresh/', {
    method: 'POST',
    signal,
  })

  if (
    !isObject(data) ||
    !['ready', 'warning'].includes(data.status) ||
    !isObject(data.totals)
  ) {
    throw new Error('Invalid Signal refresh response')
  }

  return data
}

export async function createNativeSource(source) {
  const data = await signalRequest('/sources/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(source),
  })

  if (
    !isObject(data) ||
    data.status !== 'ok' ||
    !isObject(data.source)
  ) {
    throw new Error('Invalid source creation response')
  }

  return data.source
}

export async function updateNativeSource(id, source) {
  const data = await signalRequest(
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
    throw new Error('Invalid source update response')
  }

  return data.source
}

export async function refreshNativeSource(id) {
  const data = await signalRequest(
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
    throw new Error('Invalid source refresh response')
  }

  return data
}
