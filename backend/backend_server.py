import os
import json
import base64
import io
import tempfile
import urllib.request
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

# -------------------------------
# Load environment variables
# -------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv()
load_dotenv(env_path)

# -------------------------------
# Initialize FastAPI app
# -------------------------------
app = FastAPI(title="Harvest Tutor Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for Vercel frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Global Exception Handling
# -------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Global Error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": f"Internal Server Error: {str(exc)}"},
    )

# -------------------------------
# Gemini API Configuration (OPTIONAL)
# -------------------------------
GEMINI_API_KEY = os.getenv("API_KEY") or os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        print("✅ Gemini API Key configured")
    except Exception as e:
        print(f"⚠️ Error configuring Gemini: {e}")
        GEMINI_API_KEY = None
else:
    print("⚠️ Gemini API Key not found (Gemini will be skipped, static fallback enabled)")

# -------------------------------
# Model Paths
# -------------------------------
MODEL_PATHS = {
    "Apple": os.path.join(BASE_DIR, "models", "apple", "keras_model.h5"),
    "Tomato": os.path.join(BASE_DIR, "models", "tomato", "keras_model.h5"),
    "Potato": os.path.join(BASE_DIR, "models", "potato", "keras_model.h5"),
}

LABEL_PATHS = {
    "Apple": os.path.join(BASE_DIR, "models", "apple", "labels.txt"),
    "Tomato": os.path.join(BASE_DIR, "models", "tomato", "labels.txt"),
    "Potato": os.path.join(BASE_DIR, "models", "potato", "labels.txt"),
}

# ✅ Google Drive direct download URLs
MODEL_DOWNLOAD_URLS = {
    "Tomato": {
        "model": "https://drive.google.com/uc?export=download&id=14_DaAX_0Q4ozRl_yVPVD41EuBGs8_0P6",
        "labels": "https://drive.google.com/uc?export=download&id=1VXokvJCPQHMutUvuymWM-PXbPsjqdGYf",
    },
    "Apple": {
        "model": "https://drive.google.com/uc?export=download&id=1xMV06Ka1yFbrCzAxjWpaOanYKn5lXQZO",
        "labels": "https://drive.google.com/uc?export=download&id=1c0og3z3Z1KdBArIwT8djSmmsDgTx40Dg",
    },
    "Potato": {
        "model": "https://drive.google.com/uc?export=download&id=1hl3e9QUWzOETMBDWQWHZ4Gc7R9G7pyj_",
        "labels": "https://drive.google.com/uc?export=download&id=1jR5NJQUFK-G6U17_gn4boGg8Kqzlk0xO",
    },
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
    "Punjabi": "pa",
}

# -------------------------------
# Caching
# -------------------------------
_model_cache = {}
_label_cache = {}

# -------------------------------
# Helper Functions
# -------------------------------
def ensure_model_files(crop: str):
    """Download model + labels from Google Drive if missing."""
    if crop not in MODEL_PATHS or crop not in LABEL_PATHS:
        raise ValueError(f"Unknown crop type: {crop}")

    model_path = MODEL_PATHS[crop]
    label_path = LABEL_PATHS[crop]

    # Ensure parent directory exists
    os.makedirs(os.path.dirname(model_path), exist_ok=True)

    # Download model if missing
    if not os.path.exists(model_path):
        if crop not in MODEL_DOWNLOAD_URLS:
            raise ValueError(f"No download URL configured for crop: {crop}")

        url = MODEL_DOWNLOAD_URLS[crop]["model"]
        print(f"⬇️ Downloading {crop} model from Google Drive...")
        urllib.request.urlretrieve(url, model_path)
        print(f"✅ Downloaded model: {model_path}")

    # Download labels if missing
    if not os.path.exists(label_path):
        if crop not in MODEL_DOWNLOAD_URLS:
            raise ValueError(f"No download URL configured for crop: {crop}")

        url = MODEL_DOWNLOAD_URLS[crop]["labels"]
        print(f"⬇️ Downloading {crop} labels from Google Drive...")
        urllib.request.urlretrieve(url, label_path)
        print(f"✅ Downloaded labels: {label_path}")


def load_model_cached(crop):
    """Load model with caching to improve performance"""
    keras = tf.keras

    # ✅ Auto-download if missing
    ensure_model_files(crop)

    if crop not in _model_cache:
        model_path = MODEL_PATHS.get(crop)
        if not model_path or not os.path.exists(model_path):
            raise ValueError(f"Model file not found for {crop} at {model_path}")

        print(f"Loading model for {crop} from {model_path}...")
        _model_cache[crop] = keras.models.load_model(model_path, compile=False)

    return _model_cache[crop]


def load_labels_cached(crop):
    """Load labels with caching"""
    # ✅ Auto-download if missing
    ensure_model_files(crop)

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
    image_array = (image_array.astype(np.float32) / 127.5) - 1
    image_array = np.expand_dims(image_array, axis=0)
    return image_array


def static_explanation(crop: str, disease: str, language: str) -> str:
    d = (disease or "").lower()

    # simple fallback
    if "healthy" in d:
        return (
            f"✅ Your {crop} plant looks HEALTHY.\n\n"
            f"✅ No disease detected.\n\n"
            f"Tips:\n"
            f"- Keep regular watering\n"
            f"- Avoid overwatering\n"
            f"- Ensure sunlight and spacing\n"
            f"- Check leaves weekly\n"
        )

    return (
        f"✅ Disease Detected: {disease} ({crop})\n\n"
        f"🌱 Possible Causes:\n"
        f"- Fungal/bacterial infection\n"
        f"- High humidity or too much rain\n"
        f"- Poor airflow between plants\n"
        f"- Infected soil or old plant debris\n\n"
        f"🛠 What to do now:\n"
        f"1) Remove affected leaves\n"
        f"2) Avoid watering directly on leaves\n"
        f"3) Use recommended fungicide (local guidance)\n"
        f"4) Keep plant area dry and clean\n\n"
        f"✅ Prevention:\n"
        f"- Water early morning\n"
        f"- Maintain spacing\n"
        f"- Rotate crops\n"
        f"- Use clean tools and healthy seeds\n"
    ).strip()


# -------------------------------
# Pydantic Models
# -------------------------------
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


# -------------------------------
# API Routes
# -------------------------------
@app.get("/")
def home():
    return {
        "status": "online",
        "message": "Harvest Tutor Backend Running",
        "models_available": list(MODEL_PATHS.keys()),
    }


@app.post("/predict")
async def predict(request: PredictRequest):
    try:
        if not request.image or not request.crop:
            raise HTTPException(status_code=400, detail="Missing image or crop")

        image_data = request.image
        crop = request.crop

        # Decode base64 image
        if "base64," in image_data:
            image_data = image_data.split("base64,")[1]

        try:
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

        if image.mode != "RGB":
            image = image.convert("RGB")

        # Load model and labels
        model = load_model_cached(crop)
        class_names = load_labels_cached(crop)

        processed_image = preprocess_image(image)
        prediction = model.predict(processed_image, verbose=0)

        index = int(np.argmax(prediction))
        confidence = float(prediction[0][index])
        disease_name = class_names[index]

        return {"success": True, "disease": disease_name, "confidence": confidence, "crop": crop}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Prediction Error: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"Prediction failed: {str(e)}"},
        )


@app.post("/explain")
async def explain(request: ExplainRequest):
    try:
        # ✅ Gemini optional
        if GEMINI_API_KEY:
            try:
                model = genai.GenerativeModel("gemini-1.5-flash")

                prompt = f"""
You are an agricultural expert advisor helping farmers understand crop diseases.

Crop: {request.crop}
Disease: {request.disease}
Language: {request.language}

Explain in {request.language} in very simple words:
1) What is this disease?
2) Why did it happen?
3) How to prevent it?
4) How to treat it now?

Keep it short and practical.
"""

                response = model.generate_content(prompt)

                if response and getattr(response, "text", None):
                    return {
                        "success": True,
                        "explanation": response.text.strip(),
                        "crop": request.crop,
                        "disease": request.disease,
                        "language": request.language,
                        "source": "gemini",
                    }
            except Exception as gemini_error:
                print("⚠️ Gemini failed, using static fallback:", gemini_error)

        # ✅ Always return static explanation if Gemini not available
        explanation = static_explanation(request.crop, request.disease, request.language)
        return {
            "success": True,
            "explanation": explanation,
            "crop": request.crop,
            "disease": request.disease,
            "language": request.language,
            "source": "static",
        }

    except Exception as e:
        print(f"Explain Error: {e}")
        # ✅ never crash
        return {
            "success": True,
            "explanation": "Explanation temporarily unavailable, but prediction was successful.",
            "source": "static",
        }


@app.post("/voice")
async def voice(request: VoiceRequest):
    try:
        lang_code = LANGUAGE_CODES.get(request.language, "en")

        if not request.text:
            raise HTTPException(status_code=400, detail="No text provided")

        tts = gTTS(text=request.text, lang=lang_code, slow=False)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
            temp_path = temp_file.name
            tts.save(temp_path)

        with open(temp_path, "rb") as audio_file:
            audio_data = audio_file.read()
            audio_base64 = base64.b64encode(audio_data).decode("utf-8")

        try:
            os.unlink(temp_path)
        except:
            pass

        return {
            "success": True,
            "audioBase64": audio_base64,
            "language": request.language,
            "languageCode": lang_code,
        }

    except Exception as e:
        print(f"Voice Error: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"Voice generation failed: {str(e)}"},
        )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    print(f"Starting server on 0.0.0.0:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
