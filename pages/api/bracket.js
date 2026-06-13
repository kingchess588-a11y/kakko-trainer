import { getRules } from '../../lib/db'
import { buildSystemPrompt } from '../../lib/systemPrompt'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'Thiếu văn bản' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Chưa cấu hình GEMINI_API_KEY' })

  try {
    const rules = await getRules()
    const systemPrompt = buildSystemPrompt(rules)

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: `Hãy đóng ngoặc đoạn văn sau theo đúng quy tắc Kakko:\n\n${text}` }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          }
        })
      }
    )

    const data = await geminiRes.json()

    // Debug: log toàn bộ response để kiểm tra
    console.log('Gemini response:', JSON.stringify(data, null, 2))

    if (data.error) {
      return res.status(500).json({ error: data.error.message })
    }

    // Kiểm tra finish reason
    const candidate = data.candidates?.[0]
    const finishReason = candidate?.finishReason
    const output = candidate?.content?.parts?.[0]?.text || ''

    // Nếu bị block hoặc rỗng
    if (!output) {
      const reason = finishReason || 'unknown'
      return res.status(500).json({ 
        error: `Gemini không trả về kết quả. Lý do: ${reason}. Response: ${JSON.stringify(data).slice(0, 300)}`
      })
    }

    return res.status(200).json({ output })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
