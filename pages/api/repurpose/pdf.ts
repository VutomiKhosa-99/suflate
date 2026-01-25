import type { NextApiRequest, NextApiResponse } from 'next'
import { IncomingForm } from 'formidable'
import * as pdf from 'pdf-parse'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const form = new IncomingForm()
  form.maxFileSize = 10 * 1024 * 1024 // 10MB

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: 'Failed to parse form data' })
    }
    const file = files.file as formidable.File
    if (!file) {
      return res.status(400).json({ error: 'PDF file is required' })
    }
    if (!file.mimetype?.includes('pdf') && !file.originalFilename?.endsWith('.pdf')) {
      return res.status(400).json({ error: 'File must be a PDF' })
    }
    try {
      const buffer = fs.readFileSync(file.filepath)
      const pdfData = await pdf.default(buffer)
      const text = pdfData.text
      const pageCount = pdfData.numpages
      return res.status(200).json({ text, pageCount })
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse PDF' })
    }
  })
}
