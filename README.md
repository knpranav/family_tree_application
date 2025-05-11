# 🧬 Family Relationship Inference Tool

A graph-based web application that determines the exact family relationship between any two individuals in a dynamic, editable family tree. Built with **React**, **Cytoscape.js**, and **graph algorithms**, this tool supports advanced relationship inference—including in-laws, step-relations, and multigenerational trees.

---

## 🚀 Features

### ✅ Interactive Family Tree Editor
- Add/Edit/Delete individuals
- Add parents, partners, children, and siblings
- Smart layout with generation tracking

### 🧠 Relationship Inference
- Automatically determine how two people are related (e.g., *“uncle,” “second cousin,” “daughter-in-law”*)
- Supports complex relationships including in-laws and step-relations
- Uses BFS and relationship rules to interpret graph paths

### 🧩 Visual Graph Layout
- Powered by Cytoscape.js and dagre for clean tree rendering
- Gender-colored nodes and styled relationship edges

### 🖱️ User-Friendly Interface
- Form-based inputs for all node and relationship operations
- Relationship finder with auto-suggestion and live output

---

## 🛠️ Tech Stack

- **Frontend:** React (Hooks, Functional Components)
- **Graph Library:** Cytoscape.js + cytoscape-dagre
- **Algorithms:** Custom BFS, rule-based relationship translator
- **Language:** JavaScript (ES6+)

---


## 📂 Project Structure

```
📁 public/
├── favicon.ico
├── index.html
├── logo192.png
├── logo512.png
├── manifest.json
└── robots.txt

📁 src/
├── App.css
├── App.js
├── App.test.js
├── index.css
├── index.js
├── logo.svg
├── RelationshipUtils.js
├── reportWebVitals.js
└── setupTests.js

📄 .gitignore
📄 package.json
📄 package-lock.json
📄 README.md
```

---

## ⚠️ Limitations & Future Work

### Known Limitations
- Reverse/mirrored relationships (e.g., *"uncle"* shown both ways)
- Overextended relationship paths (due to missing sibling edges)
- Limited in-law detection (e.g., *mother-in-law* logic incomplete)
- No maternal/paternal clarity for aunts/uncles/grandparents
- No persistence across page reloads (data is cleared)

### Future Enhancements
- Add invisible sibling connections for more accurate inference
- Expand and refine kinship rule set
- Output “maternal” or “paternal” in applicable relationships
- Add database storage (Firebase or local storage for persistence)

---

## 🧭 How to Use

### 1. Clone the Repo
```bash
git clone https://github.com/your-username/family-relationship-tool.git
cd family-relationship-tool
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the App
```bash
npm start
```

### 4. Build for Production
```bash
npm run build
```

---

## 👥 Authors

- **Pranav Srinivasan K N** 
- **Harshit Singh**  
- **Rida Javed** 
---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

