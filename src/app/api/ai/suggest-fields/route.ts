import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'documentId is required' },
        { status: 400 }
      );
    }

    const document = await db.document.findUnique({
      where: { id: documentId },
      select: {
        ocrText: true,
        title: true,
        description: true,
        fields: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    const existingFields = document.fields.map((f) => ({
      type: f.type,
      label: f.label,
      page: f.page,
    }));

    const documentText = document.ocrText || document.description || document.title;

    const zai = await ZAI.create();
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a document field suggestion assistant for an enterprise document signing platform. Based on the document content, suggest where signature fields, date fields, text fields, and checkbox fields should be placed.

For each suggested field, provide:
- type: Field type ("signature", "initial", "date", "text", "checkbox")
- label: A descriptive label for the field
- x: X position as percentage (0-100) of page width
- y: Y position as percentage (0-100) of page height
- page: Page number (1-based)

Typical placements:
- Signature fields: bottom of signature pages (y: 80-90%)
- Date fields: near signature areas (y: 75-85%)
- Text fields: near fillable areas in the document body (y: 20-70%)
- Checkbox fields: near agreement/consent statements (y: 50-80%)

Return your response as a JSON object with "fields" (array of objects). Do not include any other text outside the JSON.`,
        },
        {
          role: 'user',
          content: `Suggest signature and form fields for the following document${
            existingFields.length > 0
              ? `. Note: these fields already exist: ${JSON.stringify(existingFields)}. Suggest additional fields only.`
              : '.'
          }\n\nDocument: "${documentText}"`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content || '';
    let fields: { type: string; label: string; x: number; y: number; page: number }[] = [];

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        fields = parsed.fields || [];
      }
    } catch {
      fields = [];
    }

    return NextResponse.json({
      success: true,
      data: { fields },
    });
  } catch (error) {
    console.error('Suggest fields error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to suggest fields for document' },
      { status: 500 }
    );
  }
}
