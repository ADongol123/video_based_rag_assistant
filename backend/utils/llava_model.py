from PIL import Image
import torch
from transformers import AutoProcessor, LlavaForConditionalGeneration, BitsAndBytesConfig
import requests
from io import BytesIO




class LlavaModel:
    def __init__(self):
        print("Loading the LLaVA model with 4-bit quantization...")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        # Configure 4-bit quantization to save memory
        quant_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4"
        )

        # Load processor and model
        self.processor = AutoProcessor.from_pretrained("llava-hf/llava-1.5-7b-hf")
        self.model = LlavaForConditionalGeneration.from_pretrained(
            "llava-hf/llava-1.5-7b-hf",
            quantization_config=quant_config,
            device_map="auto"  # Automatically maps layers across GPU/CPU if needed
        )

    def answer_from_images(self, image_paths, question):
        results = []

        for img_path in image_paths:
            # Check if it's a URL
            if img_path.startswith("http://") or img_path.startswith("https://"):
                response = requests.get(img_path)
                image = Image.open(BytesIO(response.content)).convert("RGB")
            else:
                image = Image.open(img_path).convert("RGB")

            prompt = f"<image>\n{question}"

            inputs = self.processor(text = prompt, images=image, return_tensors="pt").to(self.device)
            output = self.model.generate(**inputs, max_new_tokens=512)

            answer = self.processor.decode(output[0], skip_special_tokens=True)
            results.append({"image": img_path, "answer": answer})

        return results
