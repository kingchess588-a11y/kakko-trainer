import { getRules, addRule, deleteRule, saveRules } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { command } = req.body
  if (!command) return res.status(400).json({ error: 'Thiếu lệnh' })

  const text = command.trim()

  try {
    // !dạy hoặc !sửa
    if (text.startsWith('!dạy') || text.startsWith('!sửa')) {
      const body = text.replace(/^!(dạy|sửa)\s*/, '').trim()
      const noteMatch = body.match(/\s+note:\s*(.+)$/)
      const note = noteMatch ? noteMatch[1].trim() : null
      const mainPart = noteMatch ? body.slice(0, noteMatch.index).trim() : body
      const arrowIdx = mainPart.indexOf('→')

      if (arrowIdx === -1) {
        return res.status(200).json({ ok: false, message: '❌ Sai cú pháp. Dùng: !dạy từ → 〖từ|gốc〗' })
      }

      const surface = mainPart.slice(0, arrowIdx).trim()
      const bracket = mainPart.slice(arrowIdx + 1).trim()

      if (!surface || !bracket) {
        return res.status(200).json({ ok: false, message: '❌ Thiếu từ hoặc bracket.' })
      }

      const type = bracket.startsWith('〔') ? 'grammar' : 'vocab'
      const rules = await getRules()
      const isNew = !rules[surface]
      const oldBracket = rules[surface]?.bracket

      // Thêm/cập nhật rule
      rules[surface] = {
        bracket,
        type,
        confirmed: true,
        count: (rules[surface]?.count || 0) + 1,
        updatedAt: new Date().toISOString()
      }
      if (note) rules[surface].note = note
      await saveRules(rules)

      const action = isNew ? 'Đã thêm mới' : 'Đã cập nhật'
      const oldInfo = !isNew && oldBracket ? `\nTrước: ${oldBracket}` : ''
      const noteInfo = note ? `\nGhi chú: ${note}` : ''

      return res.status(200).json({
        ok: true, action: isNew ? 'add' : 'update',
        surface, bracket, note, rules,
        message: `✅ ${action}: ${surface} → ${bracket}${oldInfo}${noteInfo}`
      })
    }

    // !xóa
    if (text.startsWith('!xóa')) {
      const surface = text.replace(/^!xóa\s*/, '').trim()
      if (!surface) return res.status(200).json({ ok: false, message: '❌ Thiếu từ cần xóa.' })

      const rules = await getRules()
      if (!rules[surface]) return res.status(200).json({ ok: false, message: `❌ Không tìm thấy: ${surface}` })

      const oldBracket = rules[surface].bracket
      delete rules[surface]
      await saveRules(rules)

      return res.status(200).json({
        ok: true, action: 'delete', surface, rules,
        message: `🗑️ Đã xóa: ${surface} (${oldBracket})`
      })
    }

    // !note
    if (text.startsWith('!note')) {
      const body = text.replace(/^!note\s*/, '').trim()
      const arrowIdx = body.indexOf('→')
      if (arrowIdx === -1) return res.status(200).json({ ok: false, message: '❌ Dùng: !note từ → ghi chú' })

      const surface = body.slice(0, arrowIdx).trim()
      const note = body.slice(arrowIdx + 1).trim()
      const rules = await getRules()

      if (!rules[surface]) return res.status(200).json({ ok: false, message: `❌ Chưa có rule cho: ${surface}` })

      rules[surface].note = note
      rules[surface].updatedAt = new Date().toISOString()
      await saveRules(rules)

      return res.status(200).json({
        ok: true, action: 'note', surface, note, rules,
        message: `📝 Đã thêm ghi chú cho ${surface}: ${note}`
      })
    }

    // !xem
    if (text.startsWith('!xem')) {
      const surface = text.replace(/^!xem\s*/, '').trim()
      const rules = await getRules()

      if (!surface) {
        return res.status(200).json({ ok: true, message: `📚 Tổng số rule: ${Object.keys(rules).length}` })
      }
      if (!rules[surface]) return res.status(200).json({ ok: false, message: `❌ Không tìm thấy: ${surface}` })

      const r = rules[surface]
      const info = [
        `📖 ${surface} → ${r.bracket}`,
        `Loại: ${r.type}`,
        r.note ? `Ghi chú: ${r.note}` : null,
        `Cập nhật: ${r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('vi') : 'N/A'}`
      ].filter(Boolean).join('\n')

      return res.status(200).json({ ok: true, message: info })
    }

    return res.status(200).json({
      ok: false,
      message: '❓ Lệnh không hợp lệ.\n!dạy từ → bracket\n!sửa từ → bracket\n!xóa từ\n!note từ → ghi chú\n!xem từ'
    })

  } catch (err) {
    console.error('Teach error:', err)
    return res.status(500).json({ error: err.message })
  }
}
