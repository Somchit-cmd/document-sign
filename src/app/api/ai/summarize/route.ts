import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, text } = body;

    let documentText = text || '';

    if (documentId && !documentText) {
      const document = await db.document.findUnique({
        where: { id: documentId },
        select: { ocrText: true, title: true, description: true },
      });

      documentText = document?.ocrText || document?.description || '';

      if (!documentText) {
        documentText = `Document titled "${document?.title || 'Unknown'}" - no OCR text available for summarization.`;
      }
    }

    if (!documentText) {
      return NextResponse.json(
        { success: false, error: 'Either documentId or text must be provided' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a legal document summarization assistant. Analyze the provided document text and generate:
1. A concise summary (2-3 paragraphs)
2. Key points (bullet list of 3-7 items)

Return your response as a JSON object with "summary" (string) and "keyPoints" (array of strings). Do not include any other text outside the JSON.`,
        },
        {
          role: 'user',
          content: `Summarize the following document:\n\n${documentText}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content || '';

    let summary = '';
    let keyPoints: string[] = [];

    try {
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        summary = parsed.summary || '';
        keyPoints = parsed.keyPoints || [];
      }
    } catch {
      // Fallback: use the raw content as summary
      summary = content;
      keyPoints = [];
    }

    return NextResponse.json({
      success: true,
      data: { summary, keyPoints },
    });
  } catch (error) {
    console.error('Summarize error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to summarize document' },
      { status: 500 }
    );
  }
}
