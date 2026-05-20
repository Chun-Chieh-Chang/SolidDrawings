import os

file_path = r"C:\Users\3kids\Downloads\3D-Builder\backend\app\routers\geometry.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add ProjectRequest and endpoint
project_endpoint = """
class ProjectRequest(BaseModel):
    features: List[FeatureDefinition]
    plane: str = 'FRONT'

@router.post("/project")
async def project_2d(request: ProjectRequest):
    try:
        return geometry_service.project_2d(request.features, request.plane)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
"""

if "/project" not in content:
    content += project_endpoint

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("geometry.py updated with /project endpoint")
