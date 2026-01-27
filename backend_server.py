import os
import json
import base64
import io
import tempfile
import numpy as np
from PIL import Image
import tensorflow as tf
import google.generativeai as genai
from gtts import gTTS
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Harvest Tutor Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for Vercel frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration & Constants ---

# Project root directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Gemini API Configuration
GEMINI_API_KEY = os.getenv("API_KEY") or os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Model Paths
MODEL_PATHS = {
    "Apple": os.path.join(BASE_DIR, "models", "apple", "keras_model.h5"),
    "Tomato": os.path.join(BASE_DIR, "models", "tomato", "keras_model.h5"),
    "Potato": os.path.join(BASE_DIR, "models", "potato", "keras_model.h5")
}

LABEL_PATHS = {
    "Apple": os.path.join(BASE_DIR, "models", "apple", "labels.txt"),
    "Tomato": os.path.join(BASE_DIR, "models", "tomato", "labels.txt"),
    "Potato": os.path.join(BASE_DIR, "models", "potato", "labels.txt")
}

# Voice Language Codes
LANGUAGE_CODES = {
    "English": "en",
    "Hindi": "hi",
    "Telugu": "te",
    "Tamil": "ta",
    "Bengali": "bn",
    "Marathi": "mr",
    "Gujarati": "gu",
    "Kannada": "kn",
    "Malayalam": "ml",
    "Punjabi": "pa"
}

# --- Caching ---
_model_cache = {}
_label_cache = {}

# --- Helper Functions (From Original Backend) ---

def load_model_cached(crop):
    """Load model with caching to improve performance"""
    # Use global keras from tensorflow
    keras = tf.keras
    if crop not in _model_cache:
        model_path = MODEL_PATHS.get(crop)
        if not model_path or not os.path.exists(model_path):
            raise ValueError(f"Model not found for crop: {crop}")
        print(f"Loading model for {crop} from {model_path}...")
        _model_cache[crop] = keras.models.load_model(model_path, compile=False)
    return _model_cache[crop]

def load_labels_cached(crop):
    """Load labels with caching"""
    if crop not in _label_cache:
        label_path = LABEL_PATHS.get(crop)
        if not label_path or not os.path.exists(label_path):
            raise ValueError(f"Labels not found for crop: {crop}")
        with open(label_path, "r") as f:
            _label_cache[crop] = [line.strip() for line in f.readlines()]
    return _label_cache[crop]

def preprocess_image(image):
    """Preprocess image for model prediction"""
    image = image.resize((224, 224))
    image_array = np.asarray(image)
    image_array = image_array / 255.0
    image_array = np.expand_dims(image_array, axis=0)
    return image_array

# --- Pydantic Models ---

class PredictRequest(BaseModel):
    image: str
    crop: str

class ExplainRequest(BaseModel):
    crop: str
    disease: str
    language: str

class VoiceRequest(BaseModel):
    text: str
    language: str

# --- API Routes ---

@app.get("/")
def home():
    return {"status": "online", "message": "Harvest Tutor Backend Running"}

@app.post("/predict")
async def predict(request: PredictRequest):
    try:
        image_data = request.image
        crop = request.crop
        
        # Decode base64 image
        if 'base64,' in image_data:
            image_data = image_data.split('base64,')[1]
        
        try:
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Load model and labels
        try:
            model = load_model_cached(crop)
            class_names = load_labels_cached(crop)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # Preprocess and predict
        processed_image = preprocess_image(image)
        prediction = model.predict(processed_image, verbose=0)
        
        # Get prediction results
        index = np.argmax(prediction)
        confidence = float(prediction[0][index])
        disease_name = class_names[index]
        
        return {
            "success": True,
            "disease": disease_name,
            "confidence": confidence,
            "crop": crop
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain")
async def explain(request: ExplainRequest):
    try:
        if not GEMINI_API_KEY:
             raise HTTPException(status_code=500, detail="API_KEY not configured on server")
             
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        
        prompt = f"""
You are an agricultural expert advisor helping farmers understand crop diseases.

Crop: {request.crop}
Disease: {request.disease}
Language: {request.language}

Please provide a comprehensive explanation in {request.language} that includes:

1. **What is this disease?** (Simple explanation using everyday analogies)
2. **Why did this happen?** (Common causes: weather, soil, water, etc.)
3. **How to prevent it?** (Practical prevention tips)
4. **How to treat it now?** (Immediate treatment steps)

IMPORTANT GUIDELINES:
- Use VERY SIMPLE language that a farmer with basic education can understand
- Use local farming context and relatable examples
- Avoid technical jargon or scientific terms
- Keep it practical and actionable
- Be empathetic and encouraging
- If in Hindi or Telugu, use local agricultural terms farmers use

Format the response in clear sections with simple headings.
"""
        response = model.generate_content(prompt)
        
        return {
            "success": True,
            "explanation": response.text,
            "crop": request.crop,
            "disease": request.disease,
            "language": request.language
        }
        
    except Exception as e:
        print(f"Explanation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/voice")
async def voice(request: VoiceRequest):
    try:
        lang_code = LANGUAGE_CODES.get(request.language, "en")
        
        if not request.text:
             raise HTTPException(status_code=400, detail="No text provided")

        tts = gTTS(text=request.text, lang=lang_code, slow=False)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
            temp_path = temp_file.name
            tts.save(temp_path)
        
        # Read file and encode as base64
        with open(temp_path, 'rb') as audio_file:
            audio_data = audio_file.read()
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
        # Clean up
        try:
            os.unlink(temp_path)
        except:
            pass
            
        return {
            "success": True,
            "audioBase64": audio_base64,
            "language": request.language,
            "languageCode": lang_code
        }
        
    except Exception as e:
        print(f"Voice Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Global Exception Handling ---

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"Global Error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": f"Internal Server Error: {str(exc)}"}
    )

@app.on_event("startup")
async def startup_event():
    print("Starting Harvest Tutor Backend...")
    # Verify API Key
    if not GEMINI_API_KEY:
        print("WARNING: API_KEY not set! Explanations will fail.")
    
    # Pre-load models? No, keeping lazy load to save memory on startup.
    # But checking if model directory exists is good.
    for crop, path in MODEL_PATHS.items():
        if not os.path.exists(path):
            print(f"WARNING: Model for {crop} not found at {path}")
    
    print("Startup checks complete.")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    print(f"Server listening on 0.0.0.0:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
