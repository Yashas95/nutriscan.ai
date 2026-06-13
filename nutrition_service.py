#!/usr/bin/env python3
"""
NutriScan AI - Core Intelligent Nutrition Engine (Python Layer)
Designed for elite academic presentation. Handles high-fidelity food computer-vision 
analysis, portion estimation, and custom-tailored automated meal planning using Gemini APIs.
"""

import sys
import os
import json
import base64
import urllib.request
import urllib.error

def analyze_meal(args):
    """
    Analyzes an image base64 stream or returns preset mock meal plans.
    """
    preset_dish = args.get("presetDish")
    
    # 1. Check Presets First
    if preset_dish:
        if preset_dish == "Brown Rice + Dal Tadka + Curd":
            return {
                "success": True,
                "items": [
                    {"name": "Brown Rice", "calories": 215, "protein": 5, "carbs": 45, "fat": 2, "weightGrams": 180},
                    {"name": "Dal Tadka", "calories": 180, "protein": 8, "carbs": 22, "fat": 6, "weightGrams": 150},
                    {"name": "Curd", "calories": 98, "protein": 4, "carbs": 6, "fat": 6.5, "weightGrams": 100}
                ]
            }
        elif preset_dish == "Masala Dosa + Sambhar":
            return {
                "success": True,
                "items": [
                    {"name": "Masala Dosa", "calories": 360, "protein": 7, "carbs": 55, "fat": 12, "weightGrams": 200},
                    {"name": "Sambar", "calories": 110, "protein": 4, "carbs": 16, "fat": 3, "weightGrams": 150},
                    {"name": "Coconut Chutney", "calories": 95, "protein": 1.5, "carbs": 4, "fat": 8.5, "weightGrams": 40}
                ]
            }
        elif preset_dish == "Idli + Sambar + Coconut Chutney":
            return {
                "success": True,
                "items": [
                    {"name": "Steamed Idli (2 pieces)", "calories": 120, "protein": 4, "carbs": 26, "fat": 0.5, "weightGrams": 90},
                    {"name": "Sambar Bowl", "calories": 110, "protein": 4, "carbs": 16, "fat": 3, "weightGrams": 150},
                    {"name": "Coconut Chutney", "calories": 80, "protein": 1, "carbs": 3, "fat": 7.5, "weightGrams": 30}
                ]
            }

    # 2. Extract Base64 Image
    image_base64 = args.get("imageBase64")
    mime_type = args.get("mimeType", "image/jpeg")

    if not image_base64:
        return {"error": "Insufficient parameters. Provide an image base64 payload or preset details."}

    # Clean prefix metadata of base64 if present (e.g. data:image/png;base64,...)
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]

    # 3. Handle Missing API Key (Offline Sandbox Fallback)
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {
            "success": True,
            "items": [
                {"name": "Homemade Roti (Python)", "calories": 85, "protein": 3, "carbs": 18, "fat": 0.5, "weightGrams": 30},
                {"name": "Mixed Vegetable Sabzi (Python)", "calories": 140, "protein": 3, "carbs": 12, "fat": 8, "weightGrams": 150},
                {"name": "Greek Salad (Python-Mock)", "calories": 115, "protein": 2, "carbs": 6, "fat": 9, "weightGrams": 100}
            ],
            "simulated": True,
            "message": "[Python Layer Engine] Please define GEMINI_API_KEY inside your settings workspace for raw live vision detection."
        }

    # 4. Invoke Live Vision API via Standard urllib
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        prompt_text = (
            "We have clean dietary goals. Analyze this food photo precisely. "
            "Extract ALL individual food items visible on the plate. "
            "Give honest calorie and macronutrient guesses (protein, carbs, fat, portion weight in grams) "
            "tailored for precise daily tracking. Output as a JSON array of objects matching the schema."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": image_base64
                            }
                        },
                        {
                            "text": prompt_text
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "ARRAY",
                    "description": "List of identified food portions",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "name": {"type": "STRING", "description": "Human friendly name of the food item"},
                            "calories": {"type": "INTEGER", "description": "Estimated Calorie count in kcal"},
                            "protein": {"type": "INTEGER", "description": "Protein in grams"},
                            "carbs": {"type": "INTEGER", "description": "Carbohydrates gram size"},
                            "fat": {"type": "INTEGER", "description": "Fats gram size"},
                            "weightGrams": {"type": "INTEGER", "description": "Estimated portion weight in grams"}
                        },
                        "required": ["name", "calories", "protein", "carbs", "fat", "weightGrams"]
                    }
                }
            },
            "systemInstruction": {
                "parts": [
                    {"text": "You are NutriScan AI, an elite smart nutritionist specializing in high-fidelity computer vision meal tracking."}
                ]
            }
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'User-Agent': 'aistudio-build-python'},
            method='POST'
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = response.read().decode('utf-8')
            parsed_raw = json.loads(res_data)
            
            # Access response text block
            text_result = parsed_raw["candidates"][0]["content"]["parts"][0]["text"]
            parsed_items = json.loads(text_result.strip())
            
            return {
                "success": True,
                "items": parsed_items,
                "engine": "Python 3 + Gemini API"
            }

    except Exception as e:
        return {
            "error": "Failed to analyze image via Python layer.",
            "details": str(e)
        }


def generate_meal_plan(args):
    """
    Generates single-day tailored meal plans on client demand.
    """
    dietary_preferences = args.get("dietaryPreferences", [])
    target_calories = args.get("targetCalories", 1840)
    cuisine_focus = args.get("cuisineFocus", "Indian (Regional)")

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        # Fallback Mock Meal Plan
        is_veg = "Vegetarian" in dietary_preferences
        return {
            "success": True,
            "dayName": "Preset Custom (Python-Fallout)",
            "meals": [
                {
                    "type": "Breakfast",
                    "name": "Moong Dal Chilla & Mint Chutney (Python)",
                    "calories": 320,
                    "protein": 18,
                    "carbs": 42,
                    "fat": 8,
                    "description": "Lentil protein pancakes served fresh with home-pounded herbal mint and green chili sauce."
                },
                {
                    "type": "Lunch",
                    "name": "Soya Chunks Curry & Whole Wheat Roti (Python)",
                    "calories": 480,
                    "protein": 32,
                    "carbs": 55,
                    "fat": 14,
                    "description": "Fibre-dense soy meatballs in spicy regional masala with stone-ground rotis."
                },
                {
                    "type": "Snack",
                    "name": "Roasted Masala Lotus Seeds & Herbal Tea",
                    "calories": 150,
                    "protein": 4,
                    "carbs": 22,
                    "fat": 5,
                    "description": "Crunchy roasted foxnuts popped in extra virgin olive oil, seasoned lightly."
                },
                {
                    "type": "Dinner",
                    "name": "Spiced Paneer Tikka Salad (Python Veg)" if is_veg else "Grilled Lemon Garlic Fish/Chicken (Python High Protein)",
                    "calories": 415,
                    "protein": 24,
                    "carbs": 14,
                    "fat": 28,
                    "description": "Roasted high-fibre vegetables marinated with classic yogurt and ground coriander spices."
                }
            ],
            "simulated": True,
            "message": "[Python Layer Engine] Please set your GEMINI_API_KEY to retrieve live custom AI meal suggestions!"
        }

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        pref_str = ", ".join(dietary_preferences) if dietary_preferences else "Balanced Diet"
        prompt_text = (
            f"Write a clean customized 1-day meal plan targeting exactly {target_calories} calories for a user with these goals:\n"
            f"- Dietary preferences: {pref_str}\n"
            f"- Cuisine focus: {cuisine_focus}\n"
            "Include Breakfast, Lunch, Snack, and Dinner with precise calorie and macronutrient splits (protein, carbs, fat). Make them highly realistic."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt_text
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "OBJECT",
                    "properties": {
                        "dayName": {"type": "STRING", "description": "E.g., 'Custom Day Plan'"},
                        "meals": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "type": {"type": "STRING", "description": "Exactly 'Breakfast', 'Lunch', 'Dinner', or 'Snack'"},
                                    "name": {"type": "STRING", "description": "Enticing name of the meal"},
                                    "calories": {"type": "INTEGER", "description": "Estimated calories"},
                                    "protein": {"type": "INTEGER", "description": "Protein grams"},
                                    "carbs": {"type": "INTEGER", "description": "Carbohydrates grams"},
                                    "fat": {"type": "INTEGER", "description": "Fat grams"},
                                    "description": {"type": "STRING", "description": "Quick description and health benefit summary"}
                                },
                                "required": ["type", "name", "calories", "protein", "carbs", "fat", "description"]
                            }
                        }
                    },
                    "required": ["dayName", "meals"]
                }
            },
            "systemInstruction": {
                "parts": [
                    {"text": "You are the NutriScan AI automated meal planner. Provide healthy regional plans. Respond in solid clean JSON."}
                ]
            }
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'User-Agent': 'aistudio-build-python'},
            method='POST'
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = response.read().decode('utf-8')
            parsed_raw = json.loads(res_data)
            
            text_result = parsed_raw["candidates"][0]["content"]["parts"][0]["text"]
            parsed_plan = json.loads(text_result.strip())
            
            return {
                "success": True,
                "dayName": parsed_plan.get("dayName", "Tailor Plan"),
                "meals": parsed_plan.get("meals", []),
                "engine": "Python 3 + Gemini API"
            }

    except Exception as e:
        return {
            "error": "Failed to compile custom meal plan via Python.",
            "details": str(e)
        }


def main():
    """
    Main orchestration entry point. Receives JSON piped inputs from Node Express layer
    and yields back processed outputs with correct headers.
    """
    try:
        # Read parameters from input stream (unbound size limits)
        input_raw = sys.stdin.read().strip()
        if not input_raw:
            print(json.dumps({"error": "Empty stdin stream received in Python process."}))
            return

        payload = json.loads(input_raw)
        action = payload.get("action")

        if action == "analyze":
            result = analyze_meal(payload)
        elif action == "generate-plan":
            result = generate_meal_plan(payload)
        else:
            result = {"error": f"Unknown action: {action}"}

        # Return single printed JSON block to Node.js
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({
            "error": "Fatal exception in Python process layer.",
            "details": str(e)
        }))

if __name__ == "__main__":
    main()
