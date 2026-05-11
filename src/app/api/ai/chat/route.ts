import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

interface ChatMessage {
  role: string;
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, documentId, history } = body as {
      message: string;
      documentId?: string;
      history?: ChatMessage[];
    };

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'message is required' },
        { status: 400 }
      );
    }

    let documentContext = '';

    if (documentId) {
      const document = await db.document.findUnique({
        where: { id: documentId },
        select: {
          ocrText: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          category: true,
          createdAt: true,
        },
      });

      if (document) {
        documentContext = `\n\nCurrent Document Context:\n- Title: ${document.title}\n- Description: ${document.description || 'N/A'}\n- Status: ${document.status}\n- Priority: ${document.priority}\n- Category: ${document.category || 'N/A'}\n- Created: ${document.createdAt}\n${document.ocrText ? `- OCR Text (excerpt): ${document.ocrText.substring(0, 2000)}${document.ocrText.length > 2000 ? '...' : ''}` : '- No OCR text available'}`;
      }
    }

    const systemMessage = `You are an AI assistant for an enterprise document signing platform called DocuSign Enterprise. You help users with:
- Understanding document contents and legal terms
- Guiding through the signing process
- Explaining document statuses and workflows
- Suggesting next steps for documents
- Answering questions about the platform features

Be concise, professional, and helpful. If referencing the current document, use the context provided.${documentContext}`;

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemMessage },
    ];

    // Add conversation history
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      }
    }

    messages.push({ role: 'user', content: message });

    const zai = await ZAI.create();
    const response = await zai.chat.completions.create({
      messages,
    });

    const aiResponse = response.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';

    return NextResponse.json({
      success: true,
      data: { response: aiResponse },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
