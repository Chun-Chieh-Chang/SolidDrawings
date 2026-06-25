/**
 * Drawing view builders — Standard 3 Views / Model View handlers.
 *
 * Provides handler functions for the DRAWING ribbon tab that create
 * standard orthographic views (Front, Top, Right) or custom Model Views
 * in the active drawing sheet.
 */

import { useCadStore } from '../store/useCadStore';

/**
 * Create Standard 3 Views (Front, Top, Right) in the active sheet.
 * Per SOLIDWORKS third-angle projection layout:
 *   - Front view: center
 *   - Top view: above Front
 *   - Right view: to the right of Front
 */
export function handleCreateStandard3Views(): void {
  const store = useCadStore.getState();
  const sheetId = store.activeSheetId;

  if (!sheetId) {
    console.warn('[DrawingViews] No active sheet');
    return;
  }

  // Add all 3 views in SW-standard layout order
  store.addViewToSheet('FRONT', sheetId);
  store.addViewToSheet('TOP', sheetId);
  store.addViewToSheet('RIGHT', sheetId);
}

/**
 * Create a Model View from a custom orientation.
 * Currently defaults to ISO view as a reasonable trimetric default.
 */
export function handleCreateModelView(orientation?: { eye: number[]; up: number[] }): void {
  const store = useCadStore.getState();
  const sheetId = store.activeSheetId;

  if (!sheetId) {
    console.warn('[DrawingViews] No active sheet');
    return;
  }

  store.addViewToSheet('ISO', sheetId);
}
