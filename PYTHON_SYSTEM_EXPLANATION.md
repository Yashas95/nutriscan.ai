# NutriScan AI: Full-Stack Architecture & Python Engineering Report

**Prepared for:** Yashas (First-Year Engineering Student)  
**Subject:** Understanding client-server decoupling, inter-process communication (IPC) via standard streams, and Python intelligence engines.

---

## 1. Architectural System Overview

As an engineering student, understanding how different technologies specialize and collaborate is a core milestone. When we build modern interactive web platforms, we divide responsibilities based on where they run:

```
                  ┌──────────────────────────────────────────────┐
                  │          CLIENT WINDOW (User's Device)       │
                  │  Renders HTML/CSS, operates Camera stream    │
                  └──────────────────────┬───────────────────────┘
                                         │
                                   HTTP POST Request
                                         │
                                         v
                  ┌──────────────────────────────────────────────┐
                  │                 NODE.JS GATEWAY              │
                  │  Coordinates security, assets, system spawn  │
                  └──────────────────────┬───────────────────────┘
                                         │
                            Spawn child process (python3)
                            Data piped in via Standard Input (stdin)
                                         │
                                         v
                  ┌──────────────────────────────────────────────┐
                  │            PYTHON INTELLIGENCE ENGINE        │
                  │  Parses JSON, executes AI logic and schemas  │
                  └──────────────────────┬───────────────────────┘
                                         │
                             Prints result to Standard Output (stdout)
                                         │
                                         v
                  ┌──────────────────────────────────────────────┐
                  │                 NODE.JS GATEWAY              │
                  │  Reads terminal print, returns clean payload │
                  └───────────────────────┬──────────────────────┘
                                          │
                                JSON response returned
                                          │
                                          v
                  ┌──────────────────────────────────────────────┐
                  │          CLIENT WINDOW (User's Device)       │
                  │  Fills React state, animations ripple, UI    │
                  └──────────────────────────────────────────────┘
```

### The Three Pillars of our Stack:
1. **The Client Environment (React & TypeScript):** Native smartphones and web browsers do not run Python files natively. They excel at displaying interfaces, processing smooth animations (with `motion`), and binding to live cameras using standard browser APIs like `navigator.mediaDevices.getUserMedia()`. We write this in React/TypeScript.
2. **The Server Gateway (Node.js & Express):** Standard Node.js servers run continuously. They listen on Port `3000` to pick up web interactions, serve your stylesheet files, and route traffic safely. Node.js is great at handling concurrent lightweight web requests but relies on secondary services for computation-heavy processing.
3. **The Intelligence Engine (Python 3):** Python is the industry leader for AI integration and data manipulation. Instead of bloated libraries, our Python engine is written as an optimized, standalone microservices script (`nutrition_service.py`) that executes on-demand.

---

## 2. Inter-Process Communication (IPC) via Standard Streams

To make our React/Node.js backend talk to Python, we use a classic systems-programming pattern called **Standard Stream Pipes (IPC)**. 

When you click "Scan Plate" or "Generate Plan":
1. **The Spawning Phase:** Node.js triggers a built-in operating-system hook to spawn a brand new process:
   ```ts
   const pythonProcess = spawn("python3", ["nutrition_service.py"]);
   ```
2. **Standard Input (stdin):** Node.js serializes (stringifies) the complex parameters (like base64-encoded screenshots, user dietary settings, or calorie goals) into a flat JSON format and pipes it straight into Python's primary input channel (`sys.stdin`).
3. **Python Execution:** Our Python program wakes up, reads from the terminal's standard input till the end of the stream, and runs its operations.
4. **Standard Output (stdout):** Instead of saving files or writing to sockets, Python prints the final structured calculation directly to standard terminal output (`sys.stdout`) using `print(json.dumps(result))`.
5. **Collection Phase:** Node.js listens closely for Python's terminal prints. Once Python exits (termination code `0`), Node.js reads that output buffer, converts the string back into a TypeScript object, and sends it directly back to your React application!

### Defensive Engineering: High-Fidelity Fallbacks
If a user is running this app on a computer or phone sandbox where a local `python3` command isn't configured, we engineered a defensive fallback pattern in `/server.ts`. 

If the Python spawn is rejected:
- Node.js catches the exception.
- It automatically activates an *identical* fallback service written inside `server.ts` using the `@google/genai` TypeScript SDK.
- This guarantees your application remains permanently online and responsive, regardless of local environment configuration.

---

## 3. Explaining the Python Code Structure (`nutrition_service.py`)

Below is the conceptual and functional breakdown of each segment in your Python intelligence engine.

### A. The Orchestrator: `main()`
This function sits at the entry point of the script (triggered by `if __name__ == '__main__':`). Its main job is reading inputs, dispatching them to specialized workers, and safety containment:

```python
def main():
    try:
        # Read parameters from input stream (stdin) piped in by Node.js
        input_raw = sys.stdin.read().strip()
        if not input_raw:
            print(json.dumps({"error": "Empty stdin stream received in Python process."}))
            return

        payload = json.loads(input_raw) # Deserialize raw text into a Python Dict
        action = payload.get("action")

        # Route to specialized routines
        if action == "analyze":
            result = analyze_meal(payload)
        elif action == "generate-plan":
            result = generate_meal_plan(payload)
        else:
            result = {"error": f"Unknown action: {action}"}

        # Print the final dictionary as a single flat JSON string (stdout)
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({
            "error": "Fatal exception in Python process layer.",
            "details": str(e)
        }))
```

- **Why `json.dumps()`?** Printing data back to the terminal as a string is the most universal way to communicate across different runtimes (Node.js, C++, Rust, Python). Node.js reads this terminal output as a single buffer.

---

### B. The Computer Vision Tracker: `analyze_meal(args)`
This function handles incoming meal photos and food plate computer vision.

#### 1. Instant Preset Evaluation
To avoid consuming unnecessary cloud APIs, we check if the user selected a preset dish first. If yes, we instantly return high-fidelity nutritional numbers:
```python
preset_dish = args.get("presetDish")
if preset_dish == "Masala Dosa + Sambhar":
    return {
        "success": True,
        "items": [
            {"name": "Masala Dosa", "calories": 360, "protein": 7, "carbs": 55, "fat": 12, "weightGrams": 200},
            {"name": "Sambar", "calories": 110, "protein": 4, "carbs": 16, "fat": 3, "weightGrams": 150},
            {"name": "Coconut Chutney", "calories": 95, "protein": 1.5, "carbs": 4, "fat": 8.5, "weightGrams": 40}
        ]
    }
```

#### 2. Base64 Header Stripping
Web browsers prepend base64 files with dynamic header information (e.g., `data:image/jpeg;base64,...`). Python strips this because neural networks can only digest pure, raw base64 binary structures:
```python
if "," in image_base64:
    image_base64 = image_base64.split(",", 1)[1]
```

#### 3. Low-Impact HTTP Request System (urllib)
Instead of importing heavy external Python packages like `requests`, we wrote the direct HTTP integration using Python's standard system-native library `urllib.request`. This keeps process-load-times virtually instant.

It constructs a standard POST payload pointing to Google's specialized multimodal neural endpoints (`gemini-2.5-flash`), specifying a **strict response schema structure**:
```python
"generationConfig": {
    "responseMimeType": "application/json",
    "responseSchema": {
        "type": "ARRAY",
        "items": {
            "type": "OBJECT",
            "properties": {
                "name": {"type": "STRING"},
                "calories": {"type": "INTEGER"},
                "protein": {"type": "INTEGER"},
                "carbs": {"type": "INTEGER"},
                "fat": {"type": "INTEGER"},
                "weightGrams": {"type": "INTEGER"}
            },
            "required": ["name", "calories", "protein", "carbs", "fat", "weightGrams"]
        }
    }
}
```
- **Why do we define a `responseSchema`?** If we query AI models via plain text, they might return sentences, conversational filler, or malformed JSON blocks. Enforcing a strict typed schema forces the model's neural layers to populate our predefined variables. This ensures the React map, charts, and table widgets in your visual dashboard never crash due to a structural error.

---

### C. The Dynamic Diet Planner: `generate_meal_plan(args)`
This function takes the user's customized input attributes (target calories, cuisine styles, and dietary restrictions) to synthesize a coherent daily plan with accurate mathematical divisions.

1. **Variables Extraction:** Reads the configurations:
   ```python
   dietary_preferences = args.get("dietaryPreferences", [])
   target_calories = args.get("targetCalories", 1840)
   cuisine_focus = args.get("cuisineFocus", "Indian (Regional)")
   ```
2. **Context-Driven Prompt Assembly:** We instruct the AI behavior dynamically:
   ```python
   pref_str = ", ".join(dietary_preferences) if dietary_preferences else "Balanced Diet"
   prompt_text = (
       f"Write a clean customized 1-day meal plan targeting exactly {target_calories} calories for a user with these goals:\n"
       f"- Dietary preferences: {pref_str}\n"
       f"- Cuisine focus: {cuisine_focus}\n"
       "Include Breakfast, Lunch, Snack, and Dinner with precise calorie and macronutrient splits (protein, carbs, fat)."
   )
   ```
3. **Execution & Translation:** The JSON schema configuration ensures the AI responses are parsed into an overall header (`dayName`) and an array of individual meals containing consistent keys (`type`, `name`, `calories`, `protein`, `carbs`, `fat`, `description`), which are returned safely to the user's dashboard charts.

---

## 4. Key Takeaways for Academic Portfolios

As an engineer, keep these core principles in mind when explaining this project to professors, peers, or recruiters:

1. **Decoupled Architecture (Microservice Design):** The frontend has zero business doing data estimation, and the Python layer has zero business knowing how screens are rendered. They are loosely coupled, communicating solely via light, structured JSON interfaces.
2. **Standard Stream IPC vs Memory Spills:** Passing parameters via standard input and standard output keeps memory isolation high. If a Python process hits a memory leak or a fatal instruction, the main Node.js process stays completely safe.
3. **Graceful Fail-forwards:** High-performance software must survive in hostile user runtimes. Having built-in alternative code paths (like our Node.js SDK backup engine) ensures continuous accessibility and superior reliability.
