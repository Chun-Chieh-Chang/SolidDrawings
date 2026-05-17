# Assembly Entity Schema (SLDASM Equivalent)

## Data Structure Definition
An Assembly combines multiple Parts or Sub-Assemblies using relational constraints.

```json
{
  "id": "uuid",
  "type": "ASSEMBLY",
  "metadata": {
    "name": "Main Engine Assembly",
    "author": "Antigravity"
  },
  "components": [
    {
      "instanceId": "inst_001",
      "partId": "part_uuid_ref",
      "position": [0, 0, 0],
      "rotation": [0, 0, 0, 1],
      "isFixed": true
    },
    {
      "instanceId": "inst_002",
      "partId": "part_uuid_ref_2",
      "position": [100, 0, 0],
      "rotation": [0, 0, 0, 1],
      "isFixed": false
    }
  ],
  "mates": [
    {
      "id": "mate_001",
      "type": "COINCIDENT",
      "entities": [
        { "instanceId": "inst_001", "faceId": "face_1" },
        { "instanceId": "inst_002", "faceId": "face_A" }
      ],
      "alignment": "ALIGNED"
    }
  ]
}
```

## Mate Solving Logic
1. **Degrees of Freedom (DOF)**: The solver reduces DOF based on mates.
2. **Fixed Component**: At least one component should be `isFixed` to serve as the anchor.
3. **Instance Referencing**: Assemblies do not store geometry, only references (Paths) to Part files.
