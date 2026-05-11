import pLimit from "p-limit"

async function testModel(apiBase, apiKey, model, timeout, chatEndpoint = "/v1/chat/completions") {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const baseUrl = apiBase.replace(/\/$/, "")
    const endpoint = chatEndpoint.startsWith("/") ? chatEndpoint : `/${chatEndpoint}`
    const start = Date.now()

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 10,
      }),
      signal: controller.signal,
    })

    clearTimeout(timer)
    const latency = Date.now() - start

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      return {
        success: false,
        latency,
        error: `HTTP ${response.status}: ${errorText.slice(0, 200)}`,
      }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ""

    return {
      success: true,
      latency,
      response: content.slice(0, 200),
    }
  } catch (error) {
    clearTimeout(timer)
    if (error.name === "AbortError") {
      return { success: false, error: "超时" }
    }
    return { success: false, error: error.message }
  }
}

export async function POST(request) {
  try {
    const { apiBase, apiKey, models, timeout = 20000, concurrency = 50, chatEndpoint = "/v1/chat/completions" } =
      await request.json()

    if (!apiBase || !apiKey || !models?.length) {
      return Response.json(
        { error: "请提供 API 地址、Key 和模型列表" },
        { status: 400 }
      )
    }

    const limit = pLimit(concurrency)

    const results = await Promise.allSettled(
      models.map((model) =>
        limit(() => testModel(apiBase, apiKey, model, timeout, chatEndpoint))
      )
    )

    const formattedResults = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return {
          model: models[index],
          ...result.value,
        }
      }
      return {
        model: models[index],
        success: false,
        error: result.reason?.message || "未知错误",
      }
    })

    return Response.json({ results: formattedResults })
  } catch (error) {
    return Response.json(
      { error: `服务器错误: ${error.message}` },
      { status: 500 }
    )
  }
}
