import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdfData } = body;

    if (!pdfData) {
      return NextResponse.json(
        { error: 'No PDF data provided' },
        { status: 400 }
      );
    }

    // Import pdfjs-dist on server side
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfData, 'base64');
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    console.log(`Parsing PDF with ${pdf.numPages} pages on server...`);
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      fullText += pageText + '\n';
    }
    
    if (!fullText || fullText.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text could be extracted from PDF. The PDF may be image-based or empty.' },
        { status: 400 }
      );
    }
    
    console.log(`Successfully extracted ${fullText.length} characters from PDF`);
    
    return NextResponse.json({ 
      text: fullText,
      pages: pdf.numPages,
      length: fullText.length
    });

  } catch (error: any) {
    console.error('PDF parsing error on server:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}
