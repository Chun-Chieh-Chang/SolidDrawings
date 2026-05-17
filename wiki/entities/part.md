# Part Entity Schema (SLDPRT Equivalent)

## Data Structure Definition
A Part is the primary building block of the CAD system.

```json
{
  "id": "uuid",
  "type": "PART",
  "metadata": {
    "name": "Base Plate",
    "author": "Antigravity",
    "units": "MMGS",
    "material": "AISI 304"
  },
  "geometry": {
    "planes": [
      { "id": "front", "normal": [0,0,1], "origin": [0,0,0] },
      { "id": "top", "normal": [0,1,0], "origin": [0,0,0] },
      { "id": "right", "normal": [1,0,0], "origin": [0,0,0] }
    ],
    "origin": [0,0,0]
  },
  "featureHistory": [
    {
      "id": "feat_001",
      "type": "SKETCH",
      "name": "Sketch1",
      "planeId": "top",
      "entities": [
        { "type": "RECTANGLE", "coords": [[-50,-50], [50,50]] }
      ],
      "constraints": []
    },
    {
      "id": "feat_002",
      "type": "EXTRUDE",
      "name": "Boss-Extrude1",
      "sourceId": "feat_001",
      "parameters": {
        "distance": 10,
        "direction": "NORMAL",
        "draft": 0
      }
    }
  ]
}
```

## Lifecycle Rules
1. **Dependency Order**: Features must be processed in index order.
2. **Parent-Child Link**: Deleting a parent feature (e.g., Sketch) will suppress/delete children (e.g., Extrude).
3. **Rebuild Mechanism**: Any parameter change triggers a full re-computation of the OCCT TopoDS_Shape.
