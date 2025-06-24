import { NextResponse } from 'next/server';
import { PythonShell } from 'python-shell';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'parse_docx.py');
    const docxPath = path.join(process.cwd(), 'public', 'book.docx');
    console.log('Script path:', scriptPath);
    console.log('DOCX path:', docxPath);

    if (!fs.existsSync(docxPath)) {
      throw new Error('book.docx not found at ' + docxPath);
    }
    console.log('book.docx exists, size:', fs.statSync(docxPath).size);

    const options = {
      args: [docxPath],
      pythonPath: process.env.PYTHON_PATH || 'python3', // Adjust based on your system
    };
    console.log('Python path:', options.pythonPath);

    const results = await PythonShell.run(scriptPath, options);
    console.log('Python script executed, results length:', results.length);
    const pages = results.map((html, index) => ({
      content: html,
      pageNumber: index + 1,
    }));
    return NextResponse.json({ pages });
  } catch (error: any) {
    console.error('Error parsing DOCX:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}