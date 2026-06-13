/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { spawn } from "child_process";

dotenv.config();

const app = express();
const PORT = 3000;

// Node.js fallback engine for the Python service
async function runNodeFallbackService(payload: any): Promise<any> {
  const { action, presetDish, imageBase64, mimeType = "image/jpeg", dietaryPreferences = [], targetCalories = 1840, cuisineFocus = "Indian (Regional)" } = payload;
  
  if (action === "analyze") {
    if (presetDish) {
      if (presetDish === "Brown Rice + Dal Tadka + Curd") {
        return {
          success: true,
          items: [
            { name: "Brown Rice", calories: 215, protein: 5, carbs: 45, fat: 2, weightGrams: 180 },
            { name: "Dal Tadka", calories: 180, protein: 8, carbs: 22, fat: 6, weightGrams: 150 },
            { name: "Curd", calories: 98, protein: 4, carbs: 6, fat: 6.5, weightGrams: 100 }
          ],
          engine: "NodeJS Fallback"
        };
      }
      if (presetDish === "Masala Dosa + Sambhar") {
        return {
          success: true,
          items: [
            { name: "Masala Dosa", calories: 360, protein: 7, carbs: 55, fat: 12, weightGrams: 200 },
            { name: "Sambar", calories: 110, protein: 4, carbs: 16, fat: 3, weightGrams: 150 },
            { name: "Coconut Chutney", calories: 95, protein: 1.5, carbs: 4, fat: 8.5, weightGrams: 40 }
          ],
          engine: "NodeJS Fallback"
        };
      }
      if (presetDish === "Idli + Sambar + Coconut Chutney") {
        return {
          success: true,
          items: [
            { name: "Steamed Idli (2 pieces)", calories: 120, protein: 4, carbs: 26, fat: 0.5, weightGrams: 90 },
            { name: "Sambar Bowl", calories: 110, protein: 4, carbs: 16, fat: 3, weightGrams: 150 },
            { name: "Coconut Chutney", calories: 80, protein: 1, carbs: 3, fat: 7.5, weightGrams: 30 }
          ],
          engine: "NodeJS Fallback"
        };
      }
    }

    if (!imageBase64) {
      return { error: "Insufficient parameters. Provide an image base64 payload." };
    }

    if (!ai) {
      return {
        success: true,
        items: [
          { name: "Homemade Roti (Node Fallback)", calories: 85, protein: 3, carbs: 18, fat: 0.5, weightGrams: 30 },
          { name: "Mixed Vegetable Sabzi (Node Fallback)", calories: 140, protein: 3, carbs: 12, fat: 8, weightGrams: 150 },
          { name: "Greek Salad (Node Fallback)", calories: 115, protein: 2, carbs: 6, fat: 9, weightGrams: 100 }
        ],
        simulated: true,
        engine: "NodeJS Fallback",
        message: "NodeJS Fallback Mode: Define GEMINI_API_KEY inside secrets to run active detection."
      };
    }

    try {
      const rawBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const imagePart = {
        inlineData: {
          data: rawBase64,
          mimeType: mimeType
        }
      };
      const textPart = {
        text: "We have clean dietary goals. Analyze this food photo precisely. Extract ALL individual food items visible on the plate. Give honest calorie and macronutrient guesses (protein, carbs, fat, portion weight in grams) tailored for precise daily tracking. Output as a JSON array of objects."
      };

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [imagePart, textPart],
        config: {
          systemInstruction: "You are NutriScan AI, an elite smart nutritionist specializing in high-fidelity computer vision meal tracking.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "List of identified food portions",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                calories: { type: Type.INTEGER },
                protein: { type: Type.INTEGER },
                carbs: { type: Type.INTEGER },
                fat: { type: Type.INTEGER },
                weightGrams: { type: Type.INTEGER }
              },
              required: ["name", "calories", "protein", "carbs", "fat", "weightGrams"]
            }
          }
        }
      });

      if (response && response.text) {
        const parsedItems = JSON.parse(response.text.trim());
        return { success: true, items: parsedItems, engine: "NodeJS Fallback" };
      } else {
        throw new Error("Empty response output from Gemini model");
      }
    } catch (err: any) {
      return { error: "Failed to analyze image via NodeJS fallback.", details: err.message };
    }
  }

  if (action === "generate-plan") {
    if (!ai) {
      const isVeg = dietaryPreferences.includes("Vegetarian");
      return {
        success: true,
        dayName: "Preset Custom (Node Fallback)",
        meals: [
          {
            type: "Breakfast",
            name: "Moong Dal Chilla & Mint Chutney (Node)",
            calories: 320,
            protein: 18,
            carbs: 42,
            fat: 8,
            description: "Lentil protein pancakes served fresh with home-pounded herbal mint and green chili sauce."
          },
          {
            type: "Lunch",
            name: "Soya Chunks Curry & Whole Wheat Roti (Node)",
            calories: 480,
            protein: 32,
            carbs: 55,
            fat: 14,
            description: "Fibre-dense soy meatballs in spicy regional masala with stone-ground rotis."
          },
          {
            type: "Snack",
            name: "Roasted Masala Lotus Seeds & Tea (Node)",
            calories: 150,
            protein: 4,
            carbs: 22,
            fat: 5,
            description: "Crunchy roasted foxnuts popped in olive oil, seasoned lightly."
          },
          {
            type: "Dinner",
            name: isVeg ? "Spiced Paneer Tikka Salad (Node Veg)" : "Grilled Lemon Garlic Chicken (Node)",
            calories: 415,
            protein: 24,
            carbs: 14,
            fat: 28,
            description: "Roasted high-fibre vegetarian proteins or poultry marinated in yogurt spices."
          }
        ],
        simulated: true,
        engine: "NodeJS Fallback",
        message: "NodeJS Fallback Mode: Please set your GEMINI_API_KEY to retrieve live custom AI meal suggestions!"
      };
    }

    try {
      const preferences_str = dietaryPreferences.join(", ") || "No restrictions";
      const prompt = `Write a clean customized 1-day meal plan targeting exactly {targetCalories} calories for a user with the following goals:
- Dietary preferences: ${preferences_str}
- Cuisine focus: ${cuisineFocus}
Make sure all foods are realistic, delicious, and feature highly recognized recipes. Include Breakfast, Lunch, Snack, and Dinner with precise calorie and macronutrient splits (protein, carbs, fat).`;

      const response = await ai.models.generateContent({
        model: "gemini-2.1-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the NutriScan AI automated meal planner. Respond strictly with valid structured JSON conforming to the requested schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dayName: { type: Type.STRING },
              meals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    name: { type: Type.STRING },
                    calories: { type: Type.INTEGER },
                    protein: { type: Type.INTEGER },
                    carbs: { type: Type.INTEGER },
                    fat: { type: Type.INTEGER },
                    description: { type: Type.STRING }
                  },
                  required: ["type", "name", "calories", "protein", "carbs", "fat", "description"]
                }
              }
            },
            required: ["dayName", "meals"]
          }
        }
      });

      if (response && response.text) {
        const parsedPlan = JSON.parse(response.text.trim());
        return {
          success: true,
          dayName: parsedPlan.dayName || "Tailor Plan",
          meals: parsedPlan.meals || [],
          engine: "NodeJS Fallback"
        };
      } else {
        throw new Error("Empty response output from Gemini model");
      }
    } catch (err: any) {
      return { error: "Failed to compile custom meal plan via NodeJS fallback.", details: err.message };
    }
  }

  return { error: `Unknown action: ${action}` };
}

// Orchestrate and communicate with the high-fidelity Python 3 Nutrition Engine
async function runPythonService(payload: any): Promise<any> {
  const trySpawn = (cmd: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      console.log(`[Python Microservice] Trying to spawn: ${cmd} for action: ${payload.action}`);
      const pythonProcess = spawn(cmd, ["nutrition_service.py"]);
      
      let stdoutData = "";
      let stderrData = "";
      
      pythonProcess.stdout.on("data", (data) => {
        stdoutData += data.toString();
      });
      
      pythonProcess.stderr.on("data", (data) => {
        stderrData += data.toString();
      });
      
      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          console.error(`Python script exited with code ${code}. Stderr: ${stderrData}`);
          resolve({ error: "Python execution failed on engine layer.", details: stderrData });
          return;
        }
        
        try {
          const parsed = JSON.parse(stdoutData.trim());
          resolve(parsed);
        } catch (err: any) {
          console.error("Failed to parse Python output as JSON. Output:", stdoutData);
          resolve({ error: "Failed to parse Python service response.", details: err.message, rawOutput: stdoutData });
        }
      });

      pythonProcess.on("error", (err) => {
        console.warn(`Spawning ${cmd} failed:`, err.message);
        reject(err);
      });

      // Write parameters to standard input & finish stream to prevent CLI length bounds
      pythonProcess.stdin.write(JSON.stringify(payload));
      pythonProcess.stdin.end();
    });
  };

  try {
    // Try python3 first
    return await trySpawn("python3");
  } catch (err3) {
    try {
      // Try python as alternative
      return await trySpawn("python");
    } catch (errPy) {
      console.warn("Python is completely unavailable in host or sandbox container. Automatically falling back to high-fidelity Node.js local implementation...");
      // Activate the Node.js identical implementation
      const fallbackResult = await runNodeFallbackService(payload);
      return {
        ...fallbackResult,
        warning: "Python environment is unavailable in container. Automatically handled by high-fidelity local fallback engine."
      };
    }
  }
}

// High limits for base64 file uploads
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

// Shared Gemini Client
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } else {
    console.warn("GEMINI_API_KEY is not defined in environments. Proceeding with mocking.");
  }
} catch (e) {
  console.error("Failed to initialize Gemini:", e);
}

// REST APIs
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", hasGeminiKey: !!process.env.GEMINI_API_KEY });
});

// Real-time Food Image Analyzer Route using our custom Python 3 Intelligent Nutrition Engine
app.post("/api/analyze-image", async (req, res) => {
  const { imageBase64, mimeType = "image/jpeg", presetDish = null } = req.body;

  try {
    const pyResult = await runPythonService({
      action: "analyze",
      imageBase64,
      mimeType,
      presetDish
    });

    if (pyResult.error) {
      return res.status(500).json({ 
        error: pyResult.error, 
        details: pyResult.details, 
        message: "Python engine encountered an operational error."
      });
    }

    return res.json(pyResult);
  } catch (err: any) {
    console.error("Express routing error calling Python vision service:", err);
    res.status(500).json({ error: "Failed to query the Python analysis engine.", details: err.message });
  }
});

// Auto-generative meal planning endpoints using our custom Python 3 Intelligent Nutrition Engine
app.post("/api/generate-meal-plan", async (req, res) => {
  const { dietaryPreferences = [], targetCalories = 1840, cuisineFocus = "Indian (Regional)" } = req.body;

  try {
    const pyResult = await runPythonService({
      action: "generate-plan",
      dietaryPreferences,
      targetCalories,
      cuisineFocus
    });

    if (pyResult.error) {
      return res.status(500).json({ 
        error: pyResult.error, 
        details: pyResult.details, 
        message: "Python engine encountered an operational error on meal planning."
      });
    }

    // Inject high quality food images into meal plans based on meal category or name match
    if (pyResult.meals && Array.isArray(pyResult.meals)) {
      pyResult.meals = pyResult.meals.map((meal: any) => {
        let imageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"; // fallback
        const nameLower = (meal.name || "").toLowerCase();
        
        if (meal.type === "Breakfast" || nameLower.includes("chilla") || nameLower.includes("idli") || nameLower.includes("oat") || nameLower.includes("egg")) {
          imageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuAZ7uJFmAewVGP0KiBgkm3z1SRtsw0K-1VLHIM21caliJiwxdh9aIxQY-qqIaAs3JgbqkD36Z_l-mqM48ZQZ1eSSlQSfOTStMduxEDiN2AHOezbf6ePVka8GPiWYWBs_EkiGWDU7flmTC6TKfZAdBdrYkjuiRS-4VpBCQLnIYBt9Cib0j-xnvmIaBpsMejz0TCAtWQLNTo5X1Ff6Zc0qfq6931Zo2hliW0XL7AsLLAODLsEKlhet46a";
        } else if (meal.type === "Lunch" || nameLower.includes("curry") || nameLower.includes("rice") || nameLower.includes("dal")) {
          imageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuCrn89_huh2PRi3DQcIYgL00WYyUEsS_WyApAsrkFqzpVSWQZ6J5p2GWPgixoIp49qWWXFe5M8Pw2kDatU8Oz-bl3W57Gr-6J9kNdaWejnuSPRmGnISvBr4c1KlVlH-IVPi41flFPl4KzglQBJDgtmK-g9qf1lOWgBFeh9EkYNIqJU8qejqUCPdzwcBlknAlrejCMQDyGuZ1_lY97jvgPzw59gR4sbZzH-8ZK-StEZgwGPi239lX8Gl";
        } else if (meal.type === "Snack" || nameLower.includes("makhana") || nameLower.includes("lassi") || nameLower.includes("tea") || nameLower.includes("seeds")) {
          imageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuBZ26GWhhcN4lMlVcNcHpbXc1OcHePHnrDLTnPgOqw4dDW5bpmxSdrjpaVBeRqMxIsePV_edatEjsZahMfpraXOH50uvq0UOl-RBAV_fWaS1hz0noCDF6_rE3WoRpdm5EaO62TF7MJQlp3u86prI8QjGylwlVRsxi-xDPY7q-6kgHZTK3PCUXC431BekzvReZCgXS91C5OX1hR4hE8GNmKmbAvxRWOpct62GxTUCpcOW7ncRhqCwo1V";
        } else if (meal.type === "Dinner" || nameLower.includes("paneer") || nameLower.includes("salad") || nameLower.includes("tikka") || nameLower.includes("fish") || nameLower.includes("chicken")) {
          imageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuBlhdqZsoyBTpPZ2_NIIB66kohcwoEF_BXIacLSdJNv75wg-IoRjgbz6eFGzhTYwcI_0Ztd9jGfM1JtYVJry6S-9bsDO_oq6l2fNDE0Th_T7SL8g4InpcJmsIdfmJdiVc-KALHNVTQPFFicDyrbL0lShW8dKEuyc45vfKoBPPitPwpD2JemmmCSejidaFqewVl3MO1QSzaF_xgyl3KEO-amZZ8Y1NclNM_VG_zV7tO7Xg-Bop2mZmon";
        }
        return { ...meal, image: imageUrl };
      });
    }

    return res.json(pyResult);
  } catch (err: any) {
    console.error("Express routing error calling Python planning service:", err);
    res.status(500).json({ error: "Failed to query the Python planning engine.", details: err.message });
  }
});

// Auto-generative meal planning endpoints using Gemini 3.5-Flash (Legacy fallback)
app.post("/api/generate-meal-plan-legacy", async (req, res) => {
  const { dietaryPreferences = [], targetCalories = 1840, cuisineFocus = "Indian (Regional)" } = req.body;

  // Static Fallback Meal Plan if API Key is not set
  if (!ai) {
    console.warn("Running simulated meal planning due to missing GEMINI_API_KEY");
    
    // Custom tailored mock matching active diets
    const isVeg = dietaryPreferences.includes("Vegetarian");
    const isWeightLoss = dietaryPreferences.includes("Weight Loss");

    const proteinGoal = isWeightLoss ? "High" : "Standard";
    
    return res.json({
      success: true,
      dayName: "7-Day Sample",
      meals: [
        {
          type: "Breakfast",
          name: isVeg ? "Moong Dal Chilla & Mint Chutney" : "Spiced Scrambled Egg whites & Toast",
          calories: 320,
          protein: 18,
          carbs: 42,
          fat: 8,
          description: "High-protein savory lentil crêpes with refreshing herbal cold green relish.",
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAZ7uJFmAewVGP0KiBgkm3z1SRtsw0K-1VLHIM21caliJiwxdh9aIxQY-qqIaAs3JgbqkD36Z_l-mqM48ZQZ1eSSlQSfOTStMduxEDiN2AHOezbf6ePVka8GPiWYWBs_EkiGWDU7flmTC6TKfZAdBdrYkjuiRS-4VpBCQLnIYBt9Cib0j-xnvmIaBpsMejz0TCAtWQLNTo5X1Ff6Zc0qfq6931Zo2hliW0XL7AsLLAODLsEKlhet46a"
        },
        {
          type: "Lunch",
          name: "Soya Chunks Curry & Whole Wheat Roti",
          calories: 480,
          protein: 32,
          carbs: 55,
          fat: 14,
          description: "Slow-braised high-protein soya chunks in fresh tomato & onion spicy masala.",
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCrn89_huh2PRi3DQcIYgL00WYyUEsS_WyApAsrkFqzpVSWQZ6J5p2GWPgixoIp49qWWXFe5M8Pw2kDatU8Oz-bl3W57Gr-6J9kNdaWejnuSPRmGnISvBr4c1KlVlH-IVPi41flFPl4KzglQBJDgtmK-g9qf1lOWgBFeh9EkYNIqJU8qejqUCPdzwcBlknAlrejCMQDyGuZ1_lY97jvgPzw59gR4sbZzH-8ZK-StEZgwGPi239lX8Gl"
        },
        {
          type: "Snack",
          name: "Spiced Makhana & Black Tea",
          calories: 150,
          protein: 4,
          carbs: 22,
          fat: 5,
          description: "Lightly dry-roasted lotus seeds tossed with turmeric and black pepper served with unsweetened tea.",
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBZ26GWhhcN4lMlVcNcHpbXc1OcHePHnrDLTnPgOqw4dDW5bpmxSdrjpaVBeRqMxIsePV_edatEjsZahMfpraXOH50uvq0UOl-RBAV_fWaS1hz0noCDF6_rE3WoRpdm5EaO62TF7MJQlp3u86prI8QjGylwlVRsxi-xDPY7q-6kgHZTK3PCUXC431BekzvReZCgXS91C5OX1hR4hE8GNmKmbAvxRWOpct62GxTUCpcOW7ncRhqCwo1V"
        },
        {
          type: "Dinner",
          name: "Grilled Paneer Tikka Salad",
          calories: 410,
          protein: 22,
          carbs: 15,
          fat: 28,
          description: "A gorgeous mix of spicy grilled tandoori cottage cheese cubes alongside greens.",
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlhdqZsoyBTpPZ2_NIIB66kohcwoEF_BXIacLSdJNv75wg-IoRjgbz6eFGzhTYwcI_0Ztd9jGfM1JtYVJry6S-9bsDO_oq6l2fNDE0Th_T7SL8g4InpcJmsIdfmJdiVc-KALHNVTQPFFicDyrbL0lShW8dKEuyc45vfKoBPPitPwpD2JemmmCSejidaFqewVl3MO1QSzaF_xgyl3KEO-amZZ8Y1NclNM_VG_zV7tO7Xg-Bop2mZmon"
        }
      ],
      simulated: true,
      message: "Please configure your GEMINI_API_KEY to unlock completely customized real-time recipes!"
    });
  }

  try {
    const preferences_str = dietaryPreferences.join(", ") || "No restrictions";
    const prompt = `Write a clean customized 1-day meal plan targeting exactly ${targetCalories} calories for a user with the following goals:
- Dietary preferences: ${preferences_str}
- Cuisine focus: ${cuisineFocus}
Make sure all foods are realistic, delicious, and feature highly recognized recipes. Include Breakfast, Lunch, Snack, and Dinner with precise calorie and macronutrient splits (protein, carbs, fat).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the NutriScan AI automated meal planner. You provide accurate, authentic meal plans that conform to specific macronutrient limits. Choose delicious and real regional meals (especially Indian). Respond strictly with valid structured JSON conforming to the requested schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dayName: { type: Type.STRING, description: "E.g., 'Target Day Plan'" },
            meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Must be exactly 'Breakfast', 'Lunch', 'Dinner', or 'Snack'" },
                  name: { type: Type.STRING, description: "Beautiful name of the meal item" },
                  calories: { type: Type.INTEGER, description: "Calories count" },
                  protein: { type: Type.INTEGER, description: "Protein in grams" },
                  carbs: { type: Type.INTEGER, description: "Carbohydrates in grams" },
                  fat: { type: Type.INTEGER, description: "Fat in grams" },
                  description: { type: Type.STRING, description: "Taste descriptors & ingredients" }
                },
                required: ["type", "name", "calories", "protein", "carbs", "fat", "description"]
              }
            }
          },
          required: ["dayName", "meals"]
        }
      }
    });

    if (response && response.text) {
      const generatedPlan = JSON.parse(response.text.trim());
      
      // Inject correct high quality food images into meal plans based on meal category or name match
      const updatedMeals = generatedPlan.meals.map((meal: any) => {
        let imageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"; // fallback
        const nameLower = meal.name.toLowerCase();
        
        if (meal.type === "Breakfast" || nameLower.includes("chilla") || nameLower.includes("idli") || nameLower.includes("oat")) {
          imageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuAZ7uJFmAewVGP0KiBgkm3z1SRtsw0K-1VLHIM21caliJiwxdh9aIxQY-qqIaAs3JgbqkD36Z_l-mqM48ZQZ1eSSlQSfOTStMduxEDiN2AHOezbf6ePVka8GPiWYWBs_EkiGWDU7flmTC6TKfZAdBdrYkjuiRS-4VpBCQLnIYBt9Cib0j-xnvmIaBpsMejz0TCAtWQLNTo5X1Ff6Zc0qfq6931Zo2hliW0XL7AsLLAODLsEKlhet46a";
        } else if (meal.type === "Lunch" || nameLower.includes("curry") || nameLower.includes("rice") || nameLower.includes("dal")) {
          imageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuCrn89_huh2PRi3DQcIYgL00WYyUEsS_WyApAsrkFqzpVSWQZ6J5p2GWPgixoIp49qWWXFe5M8Pw2kDatU8Oz-bl3W57Gr-6J9kNdaWejnuSPRmGnISvBr4c1KlVlH-IVPi41flFPl4KzglQBJDgtmK-g9qf1lOWgBFeh9EkYNIqJU8qejqUCPdzwcBlknAlrejCMQDyGuZ1_lY97jvgPzw59gR4sbZzH-8ZK-StEZgwGPi239lX8Gl";
        } else if (meal.type === "Snack" || nameLower.includes("makhana") || nameLower.includes("lassi") || nameLower.includes("tea")) {
          imageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuBZ26GWhhcN4lMlVcNcHpbXc1OcHePHnrDLTnPgOqw4dDW5bpmxSdrjpaVBeRqMxIsePV_edatEjsZahMfpraXOH50uvq0UOl-RBAV_fWaS1hz0noCDF6_rE3WoRpdm5EaO62TF7MJQlp3u86prI8QjGylwlVRsxi-xDPY7q-6kgHZTK3PCUXC431BekzvReZCgXS91C5OX1hR4hE8GNmKmbAvxRWOpct62GxTUCpcOW7ncRhqCwo1V";
        } else if (meal.type === "Dinner" || nameLower.includes("paneer") || nameLower.includes("salad") || nameLower.includes("tikka")) {
          imageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuBlhdqZsoyBTpPZ2_NIIB66kohcwoEF_BXIacLSdJNv75wg-IoRjgbz6eFGzhTYwcI_0Ztd9jGfM1JtYVJry6S-9bsDO_oq6l2fNDE0Th_T7SL8g4InpcJmsIdfmJdiVc-KALHNVTQPFFicDyrbL0lShW8dKEuyc45vfKoBPPitPwpD2JemmmCSejidaFqewVl3MO1QSzaF_xgyl3KEO-amZZ8Y1NclNM_VG_zV7tO7Xg-Bop2mZmon";
        }
        return { ...meal, image: imageUrl };
      });

      return res.json({ success: true, dayName: generatedPlan.dayName, meals: updatedMeals });
    } else {
      throw new Error("Empty meal plan returned from Gemini");
    }
  } catch (err: any) {
    console.error("Gemini meal planner error:", err);
    res.status(500).json({ error: "Failed to generate AI plan. Please check custom prompts.", details: err.message });
  }
});

// Vite & Static Asset Delivery Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[NutriScan AI Server] booted successfully. Running on http://localhost:${PORT}`);
  });
}

startServer();
