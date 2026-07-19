import io
from pypdf import PdfReader
from typing import List
import uuid

class PDFProcessor:
    def __init__(self):
        pass

    def extract_text(self, file_content: bytes) -> str:
        """Extract all text from a PDF file byte stream."""
        reader = PdfReader(io.BytesIO(file_content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text

    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split text into overlapping chunks for indexing."""
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)
            if i + chunk_size >= len(words):
                break
        return chunks

processor = PDFProcessor()
