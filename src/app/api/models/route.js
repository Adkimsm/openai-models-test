export async function POST(request) {
  try {
    const { apiBase, apiKey, modelsEndpoint = "/v1/models" } = await request.json()

    if (!apiBase || !apiKey) {
      return Response.json(
        { error: "请提供 API 地址和 Key" },
        { status: 400 }
      )
    }

    const baseUrl = apiBase.replace(/\/$/, "")
    const endpoint = modelsEndpoint.startsWith("/") ? modelsEndpoint : `/${modelsEndpoint}`
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      return Response.json(
        { error: `请求失败: HTTP ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const models = data.data?.map((m) => m.id) || []

    return Response.json({ models })
  } catch (error) {
    return Response.json(
      { error: `网络错误: ${error.message}` },
      { status: 500 }
    )
  }
}
