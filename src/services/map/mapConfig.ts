export const SIQUIJOR_CENTER: [number, number] = [9.18367, 123.592717];

export const DEFAULT_ZOOM = 12.4;

export const MIN_ZOOM = 10;
export const MAX_ZOOM = 18;

/**
 * Island overview can use one extra zoom level; general route/UI stays at MAX_ZOOM.
 * Without this, fitBounds often hits MAX_ZOOM and a tiny `setZoom` nudge is a no-op.
 */
export const ISLAND_OVERVIEW_MAX_ZOOM = 19;

/** Slightly shrink chrome padding for island fit only so fitBounds zooms in before hitting the cap. */
export const ISLAND_FIT_PADDING_SCALE = 0.88;

/** Extra zoom after fitBounds (capped by ISLAND_OVERVIEW_MAX_ZOOM). */
export const ISLAND_OVERVIEW_ZOOM_INSET = 0.5;
