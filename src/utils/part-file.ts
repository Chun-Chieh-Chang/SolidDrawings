import type { CADFeature, SketchConstraint, SketchEdge, SketchNode } from '@/store/useCadStore';

export const PART_SCHEMA = 'com.3dbuilder.part';
export const LEGACY_PART_SCHEMA = '3D-BUILDER-PARAMETRIC-SCHEMA';
export const PART_SCHEMA_VERSION = '1.0.0';
export const APP_VERSION = '3.2.0-phase16';

export interface PartFileDocument {
  schema: typeof PART_SCHEMA;
  schemaVersion: string;
  appVersion: string;
  units: 'mm';
  metadata: {
    projectName: string;
    createdAt: string;
    updatedAt: string;
    author: string;
    description: string;
  };
  features: CADFeature[];
  sketchNodes: Record<string, SketchNode>;
  sketchEdges: Record<string, SketchEdge>;
  sketchConstraints: Record<string, SketchConstraint>;
  materials: Record<string, unknown>;
  documentSettings: {
    drawingScale: string;
    precision: number;
  };
}

export interface ParsedPartFile {
  features: CADFeature[];
  sketchNodes: Record<string, SketchNode>;
  sketchEdges: Record<string, SketchEdge>;
  sketchConstraints: Record<string, SketchConstraint>;
  projectName?: string;
  drawingScale?: string;
}

export function serializePartFile(input: {
  projectName: string;
  drawingScale: string;
  features: CADFeature[];
  sketchNodes: Record<string, SketchNode>;
  sketchEdges: Record<string, SketchEdge>;
  sketchConstraints: Record<string, SketchConstraint>;
  createdAt?: string;
}): string {
  const now = new Date().toISOString();
  const doc: PartFileDocument = {
    schema: PART_SCHEMA,
    schemaVersion: PART_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    units: 'mm',
    metadata: {
      projectName: input.projectName,
      createdAt: input.createdAt ?? now,
      updatedAt: now,
      author: '',
      description: '',
    },
    features: input.features,
    sketchNodes: input.sketchNodes,
    sketchEdges: input.sketchEdges,
    sketchConstraints: input.sketchConstraints,
    materials: {},
    documentSettings: {
      drawingScale: input.drawingScale,
      precision: 3,
    },
  };
  return JSON.stringify(doc, null, 2);
}

export function parsePartFile(content: string): ParsedPartFile | null {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }

  const features = Array.isArray(data.features) ? (data.features as CADFeature[]) : null;
  if (!features) return null;

  const sketchNodes = (data.sketchNodes as Record<string, SketchNode>) ?? {};
  const sketchEdges = (data.sketchEdges as Record<string, SketchEdge>) ?? {};
  const sketchConstraints = (data.sketchConstraints as Record<string, SketchConstraint>) ?? {};

  const metadata = data.metadata as PartFileDocument['metadata'] | undefined;
  const documentSettings = data.documentSettings as PartFileDocument['documentSettings'] | undefined;

  return {
    features,
    sketchNodes,
    sketchEdges,
    sketchConstraints,
    projectName: metadata?.projectName,
    drawingScale: documentSettings?.drawingScale,
  };
}

export function isRecognizedPartSchema(data: Record<string, unknown>): boolean {
  const schema = data.schema;
  return (
    schema === PART_SCHEMA ||
    schema === LEGACY_PART_SCHEMA ||
    Array.isArray(data.features)
  );
}
