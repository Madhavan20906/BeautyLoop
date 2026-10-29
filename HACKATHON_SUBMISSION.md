# 🏆 YouCam API Skin AI & eCommerce VTO Hackathon — Devpost Submission Package

## 📌 Project Overview
- **Project Name:** BeautyLoop — Autonomous Agentic Derm AI & Dual Virtual Try-On Studio
- **Tagline:** Reimagining beauty eCommerce with 10-biomarker clinical skin intelligence, CIELAB colorimetry, and dual AR try-on powered by YouCam APIs.
- **Repository URL:** `https://github.com/Madhavan20906/BeautyLoop.git`
- **Themes:** AR/VR, E-commerce/Retail, Machine Learning/AI
- **YouCam APIs Used:**
  1. `Skin AI Analysis API` (`/s2s/v2.0/task/skin-analysis` with 10 clinical actions)
  2. `Skin Tone & Colorimetry API` (`/s2s/v2.0/task/skin-tone-analysis`)
  3. `Makeup Virtual Try-On API` (`/s2s/v2.0/task/makeup-vto` for Foundation, Lipstick, and Dual Harmonious Looks)

---

## 📝 Devpost Text Description (Copy & Paste Ready)

### 💡 Inspiration
Every year, over **\$60 billion** in beauty and skincare products are returned or abandoned in drawers. Consumers face a dual dilemma:
1. **Skin Confusion**: People wonder about their skin right before a purchase, right after a breakout, or when standing in front of a mirror wondering if a product actually works.
2. **Disconnected Try-On**: Virtual try-on tools are often isolated toys—showing how a lipstick looks without understanding the user's underlying skin undertone, moisture barrier, or foundation shade match.

We built **BeautyLoop** to solve this moment of truth. We wanted to fuse clinical diagnostic dermatology with real-time AR try-on into one cohesive, autonomous agentic workflow. No marketing hype, no blind guesses—just scientific skin biomarkers, sourced formulation facts, and virtual try-on receipts.

---

### 🌟 What It Does
**BeautyLoop** is an autonomous beauty decision and virtual try-on studio that guides shoppers through a high-trust, 4-step consumer journey:

1. **Live Capability & Integrity Radar**: Transparently verifies the provider connection with real-time health checks.
2. **Precision Biometric Studio**:
   - **1-Click Instant Demo Selfie** or **Live Webcam with Oval Alignment Guide**.
   - **10-Biomarker Clinical Analysis**: Analyzes *Pores, Texture, Acne, Wrinkles, Moisture, Oiliness, Redness, Radiance, Firmness,* and *Eye Bags*, calculating a composite **Skin Vitality Index (0–100)**.
   - **CIELAB Colorimetry**: Calculates accurate skin hex values, facial undertones (*Warm, Cool, Neutral, Olive*), natural lip pigment, eye color, and hair color.
3. **Dual Virtual Try-On with Interactive Split Slider**:
   - Renders live **Foundation Try-On** with adjustable color intensity, coverage depth, and glow.
   - Renders live **Lipstick Try-On** across matte, glossy, and shimmer textures.
   - **Complete Harmonious Look Dual VTO**: Simultaneously previews paired foundation and lipstick in a single unified AR render.
   - **Touch & Mouse Draggable Before/After Slider**: Allows pixel-by-pixel inspection of natural baseline skin vs. YouCam AR try-on.
4. **Autonomous Agentic Derm Concierge**:
   - Analyzes biometric findings to classify skin typology (e.g. *Dehydrated Oily with Compromised Barrier*).
   - Generates tailored 4-step AM and 3-step PM regimens with clinical rationales.
   - **Contraindication Conflict Matrix**: Automatically screens formulations to prevent dangerous ingredient clashes (e.g., Retinol + Salicylic Acid / BHA conflict).
   - Suggests harmonious foundation & lip pairings with a 1-click **"Try Harmonious Look"** applicator.
5. **Source-Backed Catalog Comparator & Decision Card**:
   - Cross-references real clinical products with verified retailer receipts, prices, and attribute confirmations.
   - One-click copyable **Clinical Decision Card** for high-confidence purchasing.

---

### ⚙️ How We Built It
- **Frontend**: React 19, TailwindCSS, Lucide Icons, Vite, HTML5 Canvas for facial framing auto-zoom and webcam snapshotting, and custom drag gesture handlers for the Before/After slider.
- **Backend**: Node.js & TypeScript Express REST API with strict Zod schema validation and Orval-generated end-to-end typed client contracts.
- **YouCam API Integration**:
  - Direct integration with Perfect Corp's Server-to-Server (S2S) APIs (`https://yce-api-01.makeupar.com` & `https://yce-api-01.perfectcorp.com`).
  - Pre-signed AWS S3 direct upload pipeline for fast, secure image processing.
  - Asynchronous task polling state machine with exponential backoff and error recovery.
  - CIELAB color space transformation and CIE76 Euclidean Delta-E color difference formulas for foundation shade matching.

---

### 🧗 Challenges We Overcame
1. **Clinical Facial Framing Requirements**: YouCam's clinical skin analysis engine strictly requires the face to occupy >60% of the image frame (`error_src_face_too_small`). We engineered an intelligent canvas center-and-zoom pre-processor (1.35x–1.5x) that guarantees face width requirements regardless of user camera angle.
2. **Multi-Biomarker Payload Alignment**: Navigated YouCam API parameters to unlock the exact 10 clinically supported skin actions while graceful falling back when candid selfies have non-forward head yaw.
3. **Dual AR Rendering**: Blended foundation coverage and lipstick textures into a single unified `/s2s/v2.0/task/makeup-vto` call, enabling instant dual try-on without doubling API latency or credit consumption.
4. **Agentic Decision Integrity**: Designed the Derm Agent to base all AM/PM recommendations strictly on measured biomarkers and conflict-free formulation matrices, avoiding simulated data or diagnostic overreach.

---

### 🏆 Accomplishments We're Proud Of
- **Zero Mock Data**: When YouCam credentials are live, every single biomarker, undertone, and AR try-on image is 100% computed by Perfect Corp's neural networks.
- **Interactive Before/After Slider**: Built a fluid, hardware-accelerated drag comparison slider that makes virtual try-on intuitive and convincing.
- **Agentic AI Workflow**: Created a genuine agentic engine that bridges biometric skin data with commerce recommendations and ingredient safety checks.

---

### 📚 What We Learned
- How subtle lighting shifts influence RGB color extraction, and why converting to the device-independent CIELAB color space is critical for accurate undertone matching.
- The power of combining Skin AI diagnostics with makeup VTO: consumers don't want beauty in isolation; they want products that address their skin health while enhancing their personal color palette.

---

### 🔮 What's Next for BeautyLoop
- **Longitudinal Skin Tracking**: Storing anonymous periodic scans to generate timeline graphs showing how skin vitality improves over weeks of regimen compliance.
- **AI Hair & Beard Try-On**: Expanding into YouCam's Hair Color & Beard Style APIs for an all-in-one head-to-toe styling concierge.
- **Retailer Webhooks & Cart Sync**: Direct 1-click checkout with Nykaa, Sephora, and Amazon Beauty.

---

## 🎬 1-to-3 Minute Demo Video Storyboard & Script

| Timestamp | Visual on Screen | Voiceover / Script |
| :--- | :--- | :--- |
| **0:00 – 0:25** | Open on BeautyLoop landing page. Point to the problem: $60B beauty return crisis, decision fatigue, and disconnect between skin health and virtual try-on. | *"Choosing skincare and beauty online is full of guesswork. Millions of products end up returned because buyers can't test shades or know if a formula fits their skin. Welcome to BeautyLoop—an autonomous agentic beauty studio powered by Perfect Corp's YouCam APIs."* |
| **0:25 – 0:50** | Scroll to Section 02 (*Color & Skin*). Click **"Live Camera"** to show the webcam oval guide, then click **"Demo Portrait"** to instantly load the calibrated face photo. Check consent. | *"BeautyLoop starts with a consent-first biometric studio. Users can capture a live selfie with our real-time oval alignment guide or test instantly with a demo portrait. Our pre-processor auto-centers framing for clinical accuracy."* |
| **0:50 – 1:25** | Click **"10-Biomarker clinical skin insight"**. Watch the progress indicator, then show the returned results: 10 clinical biomarker cards, vitality score (82/100), and status tags. | *"With one click, BeautyLoop calls YouCam's Clinical Skin AI API. In seconds, we receive 10 clinical biomarkers: pores, texture, acne, wrinkles, moisture, oiliness, redness, radiance, firmness, and eye bags—synthesized into an overall Skin Vitality Index."* |
| **1:25 – 1:55** | Show the **Agentic Derm Blueprint**: highlight the AM Defense protocol, PM Repair regimen, ingredient contraindication check, and harmonized foundation & lip pairing. Click **"Try Harmonious Look VTO"**. | *"Next, our Agentic Derm Concierge takes over. It diagnoses skin typology, builds customized AM and PM regimens, screens for ingredient clashes like Retinol and Salicylic Acid, and pairs the user's undertone with harmonized foundation and lip shades."* |
| **1:55 – 2:30** | Run the **Complete Harmonious Look dual VTO**. Once returned, drag the **Before/After Split Slider** back and forth across the screen to reveal the seamless AR transformation. | *"Now for the magic: eCommerce Virtual Try-On. BeautyLoop sends both foundation and lip parameters in a single YouCam AR payload. Watch our interactive Before/After slider drag across the screen—allowing shoppers to inspect the natural baseline skin against the real AR try-on with sub-pixel clarity."* |
| **2:30 – 3:00** | Scroll down to Section 03 & 04. Select a product, review the verified retailer source and price receipts, and click **"Copy decision card"**. | *"Finally, users can explore sourced catalog matches and export their clinical decision card with full receipts. BeautyLoop bridges AI skin diagnostics with virtual try-on into one seamless, evidence-backed shopping experience. Thank you!"* |

---

## 📸 Recommended Devpost Submission Screenshots
1. **Screenshot 1 (`01-hero-integrity.png`)**: Hero section showing the editorial branding, journey rail, and real-time provider capability status.
2. **Screenshot 2 (`02-clinical-biomarkers.png`)**: The 10-biomarker clinical analysis panel showing vitality index and biomarker status badges.
3. **Screenshot 3 (`03-agentic-blueprint.png`)**: The Autonomous Agentic Derm Blueprint showing AM/PM regimens and contraindication alerts.
4. **Screenshot 4 (`04-before-after-vto.png`)**: The interactive Before/After AR Try-On slider midway across the face showing dual foundation + lipstick transformation.
5. **Screenshot 5 (`05-decision-shortlist.png`)**: Sourced product catalog comparator and the final copied clinical decision card.
