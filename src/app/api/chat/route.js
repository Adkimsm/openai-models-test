export async function POST(request) {
  try {
    const { apiBase, apiKey, chatEndpoint = "/v1/chat/completions", model, messages } =
      await request.json()

    if (!apiBase || !apiKey || !model || !messages?.length) {
      return Response.json(
        { error: "请提供 API 地址、Key、模型和消息" },
        { status: 400 }
      )
    }

    const baseUrl = apiBase.replace(/\/$/, "")
    const endpoint = chatEndpoint.startsWith("/") ? chatEndpoint : `/${chatEndpoint}`

    const apiResponse = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    })

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text().catch(() => "")
      return Response.json(
        { error: `HTTP ${apiResponse.status}: ${errorText.slice(0, 500)}` },
        { status: apiResponse.status }
      )
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = apiResponse.body.getReader()
        let buffer = ""

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || !trimmed.startsWith("data: ")) continue

              const data = trimmed.slice(6)
              if (data === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                continue
              }

              try {
                const parsed = JSON.parse(data)
                const delta = parsed.choices?.[0]?.delta
                const reasoningContent = delta?.reasoning_content
                const content = delta?.content

                if (reasoningContent) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: `<think>${reasoningContent}</think>` })}\n\n`)
                  )
                }

                if (content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                  )
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        } catch (err) {
          controller.error(err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    return Response.json(
      { error: `服务器错误: ${error.message}` },
      { status: 500 }
    )
  }
}
