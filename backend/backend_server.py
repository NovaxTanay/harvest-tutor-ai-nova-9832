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
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

# --- Global Exception Handling ---

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Global Error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": f"Internal Server Error: {str(exc)}"}
    )

# --- Configuration & Constants ---

# Project root directory (relative to this file)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Explicitly load .env from backend directory
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv(env_path)

# Gemini API Configuration
GEMINI_API_KEY = os.getenv("API_KEY") or os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        print("✅ Gemini API Key configured")
    except Exception as e:
        print(f"⚠️ Error configuring Gemini: {e}")
else:
    print("⚠️ WARNING: API_KEY not set! Explanations will fail.")

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

# --- Helper Functions ---

def load_model_cached(crop):
    """Load model with caching to improve performance"""
    # Use global keras from tensorflow
    keras = tf.keras
    if crop not in _model_cache:
        model_path = MODEL_PATHS.get(crop)
        if not model_path:
            raise ValueError(f"Unknown crop type: {crop}")
        
        if not os.path.exists(model_path):
            raise ValueError(f"Model file not found for {crop} at {model_path}")
            
        print(f"Loading model for {crop} from {model_path}...")
        try:
            # compile=False is important for TF 2.12 cpu compatibility
            _model_cache[crop] = keras.models.load_model(model_path, compile=False)
        except Exception as e:
            print(f"Error loading model {crop}: {e}")
            raise ValueError(f"Failed to load model for {crop}: {e}")
            
    return _model_cache[crop]

def load_labels_cached(crop):
    """Load labels with caching"""
    if crop not in _label_cache:
        label_path = LABEL_PATHS.get(crop)
        if not label_path or not os.path.exists(label_path):
            raise ValueError(f"Labels not found for crop: {crop}")
        try:
            with open(label_path, "r") as f:
                _label_cache[crop] = [line.strip() for line in f.readlines()]
        except Exception as e:
            raise ValueError(f"Failed to load labels for {crop}: {e}")
            
    return _label_cache[crop]

def preprocess_image(image):
    """Preprocess image for model prediction"""
    # Resize to 224x224 as expected by Teachable Machine models
    image = image.resize((224, 224))
    image_array = np.asarray(image)
    # Normalize pixel values
    image_array = (image_array.astype(np.float32) / 127.5) - 1
    # Add batch dimension
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
    return {
        "status": "online", 
        "message": "Harvest Tutor Backend Running",
        "models_available": list(MODEL_PATHS.keys())
    }

@app.post("/predict")
async def predict(request: PredictRequest):
    try:
        if not request.image or not request.crop:
            raise HTTPException(status_code=400, detail="Missing image or crop")

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
        # Always return JSON, never crash
        return JSONResponse(
            status_code=500, 
            content={"success": False, "error": f"Prediction failed: {str(e)}"}
        )

# --- Configuration & Constants ---

# Project root directory (relative to this file)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Explicitly load .env from backend directory
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv(env_path)

# Gemini API Configuration
GEMINI_API_KEY = os.getenv("API_KEY") or os.getenv("GEMINI_API_KEY")

# Configure GenAI globally if key exists
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        print("✅ Gemini API Key configured successfully")
    except Exception as e:
        print(f"⚠️ Failed to configure Gemini API: {e}")
else:
    print("⚠️ WARNING: API_KEY not found in .env or environment")

# ... [Model Paths setup remains roughly same, skipping for brevity in replacement if possible, 
# but I need to replace the whole block or be precise]
# I will just replace the Env Loading and Explain Endpoint.
# Splitting into two chunks is safer.

@app.post("/explain")
async def explain(request: ExplainRequest):
    try:
        # Check API Key again at runtime
        if not GEMINI_API_KEY:
             print("Error: API_KEY missing during /explain call")
             return JSONResponse(
                 status_code=500, 
                 content={
                     "success": False, 
                     "error": "Server configuration error: API_KEY missing. Please check backend/.env"
                 }
             )
             
        # Initialize model (lazy init is safer for some production envs)
        try:
            model = genai.GenerativeModel("models/gemini-1.5-flash")
        except Exception as e:
             print(f"Error initializing Gemini model: {e}")
             return JSONResponse(
                 status_code=500, 
                 content={"success": False, "error": f"AI Service Error: {str(e)}"}
             )
        
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

IMPORTANT:
- Use VERY SIMPLE language.
- Use local agricultural terms if possible.
- Avoid technical jargon.

Format the response in clear sections.
"""
        # Generate content with timeout protection? 
        # Render free tier might suffice, but let's just wrap it.
        response = model.generate_content(prompt)
        
        return {
            "success": True,
            "explanation": response.text,
            "crop": request.crop,
            "disease": request.disease,
            "language": request.language
        }
        
    except Exception as e:
        # Log the real error for the developer
        print(f"❌ Gemini API Error: {str(e)}")
        
        # Return a safe JSON to the frontend
        return JSONResponse(
            status_code=500, 
            content={
                "success": False, 
                "error": f"Explanation unavailable: {str(e)}"
            }
        )

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
        return JSONResponse(
            status_code=500, 
            content={"success": False, "error": f"Voice generation failed: {str(e)}"}
        )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    print(f"Starting server on 0.0.0.0:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
