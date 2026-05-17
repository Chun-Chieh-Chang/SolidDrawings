# Drawing Entity Schema (SLDDRW Equivalent)

## Data Structure Definition
A Drawing is a 2D representation of a Part or Assembly for manufacturing documentation.

```json
{
  "id": "uuid",
  "type": "DRAWING",
  "metadata": {
    "name": "Base Plate Production Drawing"
  },
  "sheets": [
    {
      "id": "sheet_1",
      "format": "A3",
      "scale": "1:2",
      "views": [
        {
          "id": "view_001",
          "type": "FRONT",
          "sourceDocId": "part_uuid_ref",
          "position": [100, 150],
          "scale": 1,
          "displayMode": "HIDDEN_LINES_REMOVED"
        },
        {
          "id": "view_002",
          "type": "TOP",
          "sourceDocId": "part_uuid_ref",
          "position": [100, 300],
          "scale": 1,
          "projectionParent": "view_001"
        }
      ],
      "annotations": [
        {
          "type": "DIMENSION",
          "viewId": "view_001",
          "entities": ["edge_1", "edge_2"],
          "text": "100.00 mm"
        }
      ]
    }
  ]
}
```

## Drawing Projection Logic
1. **Orthographic Projection**: The `ViewProjector` calculates the 2D silhouettes of the 3D model.
2. **Associativity**: If the 3D model changes, the 2D view and dimensions must automatically update (Bi-directional associativity).
3. **Layer Management**: Dimensions, centerlines, and notes are managed on separate SVG/Canvas layers.
