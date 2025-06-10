export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)
    const subdomain = url.hostname.split('.')[0]
    const excludeList = env.EXCLUDE_LIST.split(',')
    console.log('excludeList', excludeList)
    if (excludeList.includes(subdomain)) {
      console.log('---1', 'in list')
      return fetch(request)
    }
    if (env.APP_WORKER) {
      console.log('---2', 'no list')
      return env.APP_WORKER.fetch(request)
    }
    return new Response('Router Worker: APP_WORKER is not configured.', { status: 500 })
  }
} satisfies ExportedHandler<Env>
