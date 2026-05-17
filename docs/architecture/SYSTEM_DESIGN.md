# SolidWorks-Clone System Architecture (Client-Server Microservices)

## 1. System Hierarchy

### Layer 1: Frontend Application (Thin Client - Next.js)
The frontend is strictly for presentation, user interaction, and state management.
- **UI Architecture**: Next.js App Router + Glass Order Styling.
- **CAD Store**: Zustand handles the local state of the Feature Tree and UI mode.
- **Three.js Renderer**: Receives raw triangle mesh data (Positions, Normals, Indices) and renders it using React Three Fiber.
- **API Client**: Sends parametric data (e.g., `{ type: 'EXTRUDE', w: 10, h: 5, d: 5 }`) to the backend.

### Layer 2: API Gateway (FastAPI)
The bridge between the Web UI and the heavy geometric kernel.
- **REST/WebSocket Endpoints**: Receives parametric commands, triggers kernel rebuilds, and streams mesh data back.
- **Session Manager**: Keeps track of the active CAD document in memory for each user/session.

### Layer 3: Document & Engine Layer (Heavy Backend - PythonOCC)
The core intelligence of the CAD software, running natively.
- **CADDocument**: Python representation of `SLDPRT`, `SLDASM`, `SLDDRW`.
- **FeatureManager**: Processes the history tree sequentially.
- **Geometric Kernel (OCCT)**: Direct C++ bindings via PythonOCC. Executes Boolean operations, fillets, and shells using full system RAM.
- **Constraint Solver**: Solves 2D sketch constraints and 3D Assembly Mates.

### Layer 4: File I/O & Storage
- **Native Parser**: Reads and writes standard formats (STEP, IGES, BREP).
- **Project Files**: Saves the proprietary JSON feature tree locally to the disk.

## 2. Data Flow (Parametric Rebuild Cycle)
1. **User Action**: Modifies a dimension in the React UI.
2. **API Call**: Next.js sends an HTTP POST `/api/rebuild` with the updated Feature Tree JSON.
3. **Backend Processing**: Python FastAPI receives the JSON.
4. **Kernel Math**: PythonOCC rebuilds the TopoDS_Shape based on the new parameters.
5. **Tessellation**: PythonOCC extracts the mesh data (Vertices, Normals, Indices).
6. **Response**: FastAPI returns the raw mesh payload.
7. **Render**: React Three Fiber updates the buffer geometry and displays the result.

## 3. PDCA Roadmap (Pivot Phase)
- **[Plan]**: Define this Client-Server architecture.
- **[Do]**: Setup Python FastAPI + PythonOCC environment.
- **[Check]**: Verify the API can generate a Box mesh and send it to Next.js.
- **[Act]**: Integrate STEP file importing capabilities.
