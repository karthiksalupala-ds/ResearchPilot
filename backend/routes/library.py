from fastapi import APIRouter, UploadFile, File, HTTPException
from retrieval.pdf_processor import processor
<<<<<<< HEAD
from retrieval.embeddings import generate_embedding
=======
>>>>>>> 03eb864c4c23455f7be527dddc9067537236dbf7
import database
from config import get_settings
from services.audio_service import audio_service

router = APIRouter()
settings = get_settings()

@router.post("/upload")
async def upload_pdf(user_id: str, file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed.")
    
    content = await file.read()
    text = processor.extract_text(content)
    chunks = processor.chunk_text(text)
    
    # For simplicity, we'll only generate audio for the first chunk
    first_chunk = chunks[0] if chunks else ""
    audio_path = None
    if first_chunk:
        audio_path = await audio_service.generate_tts(first_chunk)

    for i, chunk in enumerate(chunks):
<<<<<<< HEAD
        # Generate embedding using the shared provider (HuggingFace by default, no API key needed)
        embedding = await generate_embedding(chunk)
=======
        # Generate embedding
        response = audio_service.client.embeddings.create(
            input=chunk,
            model="text-embedding-3-small"
        )
        embedding = response.data[0].embedding
>>>>>>> 03eb864c4c23455f7be527dddc9067537236dbf7
        
        # Store in DB
        await database.store_chunk(
            title=f"{file.filename} (Chunk {i})",
            content=chunk,
            embedding=embedding,
            user_id=user_id
        )
    
    return {
        "message": f"Successfully indexed {len(chunks)} chunks from {file.filename}.",
        "audio_path": audio_path
    }
<<<<<<< HEAD

=======
>>>>>>> 03eb864c4c23455f7be527dddc9067537236dbf7
