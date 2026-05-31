# Technical Findings - 3D-Builder v1.0

## 🏆 Core Breakthroughs

### 1. Topological Naming System (TNS 2.0)
- **Problem**: Changing base geometry (e.g. Cube height) would cause child features (e.g. Fillet on top face) to lose their reference because Face IDs were unstable.
- **Solution**: Implemented `BRepAlgoAPI_History` tracking in the OpenCASCADE backend. By mapping `SketchEdge` IDs to generated faces, we established a deterministic, history-aware naming convention that survives rebuilds.

### 2. Parametric Equation Engine
- **Insight**: Direct numeric entry is insufficient for engineering design intent.
- **Solution**: Developed a topological solver in TypeScript that resolves variable dependency chains. Dimensions prefixed with `=` are parsed as mathematical expressions, allowing for reactive model updates when global variables change.

### 3. Integrated Mechanical Constraints
- **Discovery**: Traditional rigid mates (Coincident, Parallel) don't capture machine behavior.
- **Solution**: Enhanced the assembly solver to support degree-of-freedom coupling. **Gear Mates** couple rotational deltas, while **Screw Mates** couple rotation to translation, allowing for complex kinematic simulation in a browser environment.

### 4. Thin Client, Heavy Engine Architecture
- **Architecture**: Shifted all non-trivial geometric operations to the PythonOCC backend via FastAPI.
- **Result**: The frontend remains performant and lightweight (UI/UX focus), while the backend provides true industrial-grade B-Rep modeling accuracy.

### 5. ISO Fastener Generation
- **Strategy**: Instead of storing static STEP files, we implemented dynamic geometry generators for Bolts and Nuts based on ISO standard tables. This reduces application size and increases flexibility.

---
*These findings represent the architectural foundation that allowed 3D-Builder to achieve SolidWorks 2000 workflow parity.*
