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
        documentText = `Document titled "${document?.title || 'Unknown'}" - no OCR text available for clause extraction.`;
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
          content: `You are a legal document analysis assistant. Extract all legal clauses from the provided document text. For each clause, identify:
- type: The type of clause (e.g., "Confidentiality", "Termination", "Indemnification", "Liability", "Payment Terms", "Governing Law", "Force Majeure", "Warranty", "Arbitration", "Intellectual Property", "Non-Compete", "Assignment", "Severability", "Entire Agreement")
- text: The full text of the clause
- page: Estimated page number if determinable (optional)

Return your response as a JSON object with "clauses" (array of objects with type, text, and optional page fields). Do not include any other text outside the JSON.`,
        },
        {
          role: 'user',
          content: `Extract all legal clauses from the following document:\n\n${documentText}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content || '';
    let clauses: { type: string; text: string; page?: number }[] = [];

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        clauses = parsed.clauses || [];
      }
    } catch {
      clauses = [];
    }

    return NextResponse.json({
      success: true,
      data: { clauses },
    });
  } catch (error) {
    console.error('Extract clauses error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to extract clauses from document' },
      { status: 500 }
    );
  }
}
