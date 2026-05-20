import os

file_path = r"C:\Users\3kids\Downloads\3D-Builder\src\kernel\HeavyEngineClient.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add project call
project_method = """
  /**
   * Request a 2D projection of the 3D model.
   */
  public async project(features: CADFeature[], plane: string = 'FRONT'): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ features, plane }),
      });

      if (!response.ok) {
        throw new Error(`Engine error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[HeavyEngineClient] Failed to project:', error);
      return [];
    }
  }
"""

if "public async project" not in content:
    # Insert before the last closing brace
    content = content.rstrip()
    if content.endswith("}"):
        content = content[:-1] + project_method + "}\n"

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("HeavyEngineClient.ts updated with project method")
