# Server-Side PDF Parsing Solution

## Problem

The error "Object.defineProperty called on non-object" occurred when trying to dynamically import `pdfjs-dist` on the client side in Next.js. This is a known issue with PDF.js module loading in browser environments.

## Root Cause

- PDF.js uses ES modules with specific property definitions
- Next.js webpack configuration conflicts with PDF.js module system
- Dynamic imports of PDF.js in browser cause module loading errors
- Worker configuration issues in client-side environment

## Solution: Server-Side PDF Parsing

Instead of parsing PDFs on the client side, we now:
1. Send PDF data to a server-side API route
2. Parse the PDF on the server where module loading is stable
3. Return extracted text to the client

### Benefits

✅ **No Client-Side Module Issues** - Server handles all PDF.js complexity  
✅ **Better Performance** - Offloads heavy parsing to server  
✅ **More Reliable** - Server environment is consistent  
✅ **Easier Debugging** - Server logs show parsing details  
✅ **Security** - PDF processing happens server-side  

## Implementation

### Client Side (signup-form.tsx)

```typescript
// Convert PDF to base64 for transmission
const bytes = new Uint8Array(content as ArrayBuffer);
let binary = '';
for (let i = 0; i < bytes.byteLength; i++) {
  binary += String.fromCharCode(bytes[i]);
}
const base64 = btoa(binary);

// Send to API route
const response = await fetch('/api/parse-pdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ pdfData: base64 }),
});

const result = await response.json();
const fullText = result.text;
```

### Server Side (api/parse-pdf/route.ts)

```typescript
// Import PDF.js safely on server
const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

// Convert base64 back to buffer
const pdfBuffer = Buffer.from(pdfData, 'base64');

// Parse PDF on server
const loadingTask = pdfjsLib.getDocument({
  data: new Uint8Array(pdfBuffer),
  useSystemFonts: true,
});

const pdf = await loadingTask.promise;

// Extract text from all pages
let fullText = '';
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const textContent = await page.getTextContent();
  const pageText = textContent.items
    .map((item: any) => item.str || '')
    .join(' ');
  fullText += pageText + '\n';
}

return NextResponse.json({ 
  text: fullText,
  pages: pdf.numPages,
  length: fullText.length
});
```

## Data Flow

```
User uploads PDF
    ↓
FileReader reads as ArrayBuffer
    ↓
Convert to base64 string
    ↓
POST to /api/parse-pdf
    ↓
Server receives base64
    ↓
Convert back to buffer
    ↓
PDF.js parses (server-side)
    ↓
Extract text from all pages
    ↓
Return text to client
    ↓
Client auto-fills form
```

## File Structure

```
src/
├── components/
│   └── auth/
│       └── signup-form.tsx          (Client: sends PDF to API)
├── app/
    └── api/
        └── parse-pdf/
            └── route.ts              (Server: parses PDF)
```

## Error Handling

### Client Side

```typescript
try {
  const response = await fetch('/api/parse-pdf', ...);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  const result = await response.json();
  // Use result.text
} catch (error) {
  // Show user-friendly error
  toast({
    variant: 'destructive',
    title: 'PDF parsing failed',
    description: 'The file may be image-based or corrupted.'
  });
}
```

### Server Side

```typescript
try {
  const pdf = await loadingTask.promise;
  // Parse PDF
  return NextResponse.json({ text: fullText });
} catch (error) {
  console.error('PDF parsing error:', error);
  return NextResponse.json(
    { error: 'Failed to parse PDF' },
    { status: 500 }
  );
}
```

## Performance Considerations

### File Size Limits

- Base64 encoding increases size by ~33%
- Recommend max PDF size: 5MB
- Enforced in client before upload

### Optimization

```typescript
// Client validates size first
if (file.size > 5 * 1024 * 1024) {
  toast({
    variant: 'destructive',
    title: 'File too large',
    description: 'Please upload a resume under 5MB.',
  });
  return;
}
```

### Server Timeout

```typescript
// Next.js API route config
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Allow larger payloads for base64
    },
    responseLimit: false,
  },
  maxDuration: 30, // 30 second timeout for parsing
};
```

## Testing

### Test Cases

**1. Text-based PDF (1 page)**
```
✅ Uploads successfully
✅ Text extracted on server
✅ Form auto-filled
```

**2. Multi-page PDF (5 pages)**
```
✅ All pages processed
✅ Text combined correctly
✅ Performance acceptable (<5 seconds)
```

**3. Scanned/Image PDF**
```
⚠️ No text extracted
✅ Error message returned
✅ User informed to try DOCX
```

**4. Corrupted PDF**
```
❌ Parsing fails
✅ Error caught on server
✅ User-friendly error shown
```

**5. Large PDF (>5MB)**
```
❌ Rejected on client
✅ Size error shown
✅ Never sent to server
```

## Advantages Over Client-Side

| Aspect | Client-Side | Server-Side ✅ |
|--------|-------------|----------------|
| Module Loading | ❌ Errors | ✅ Stable |
| Performance | Browser limited | Server resources |
| Security | Exposed | Server-only |
| Debugging | Console only | Server logs |
| Worker Config | Complex | Not needed |
| File Size | Memory limited | More capacity |

## Migration Notes

### Before (Client-Side - Broken)

```typescript
// ❌ This caused errors
const pdfjsLib = await import('pdfjs-dist');
pdfjsLib.GlobalWorkerOptions.workerSrc = ...;
```

### After (Server-Side - Working)

```typescript
// ✅ Client sends to server
const response = await fetch('/api/parse-pdf', {
  body: JSON.stringify({ pdfData: base64 })
});

// ✅ Server parses safely
const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
```

## API Response Format

### Success Response

```json
{
  "text": "Extracted text content...",
  "pages": 2,
  "length": 1234
}
```

### Error Response

```json
{
  "error": "No text could be extracted from PDF. The PDF may be image-based or empty."
}
```

## Security Considerations

### Input Validation

- Validate file size on client
- Validate base64 format on server
- Limit request size (10MB max)

### Rate Limiting

Consider adding rate limiting to prevent abuse:

```typescript
// Future enhancement
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  await rateLimit(request);
  // ... parse PDF
}
```

### Sanitization

- PDF.js handles malicious PDFs safely
- No user data stored
- Text extracted only

## Troubleshooting

### Issue: "Request Entity Too Large"

**Cause:** PDF too large for base64 transmission  
**Solution:** Reduce file size limit or use multipart/form-data

### Issue: "Timeout"

**Cause:** Large PDF taking too long to parse  
**Solution:** Increase maxDuration in config

### Issue: "Module not found: pdfjs-dist"

**Cause:** Package not installed  
**Solution:** 
```bash
npm install pdfjs-dist
```

### Issue: "No text extracted"

**Cause:** Image-based/scanned PDF  
**Solution:** Inform user, suggest DOCX or manual entry

## Future Enhancements

- [ ] Add OCR for scanned PDFs (Tesseract.js)
- [ ] Implement caching for repeat uploads
- [ ] Add progress indicator for large files
- [ ] Support batch PDF processing
- [ ] Add resume quality scoring
- [ ] Implement PDF thumbnail generation

## Summary

By moving PDF parsing to the server side:
- ✅ Eliminated client-side module loading errors
- ✅ Improved reliability and performance
- ✅ Better error handling and debugging
- ✅ Maintained user experience
- ✅ More secure implementation

The user can now upload PDF resumes without errors, and text extraction happens reliably on the server!
