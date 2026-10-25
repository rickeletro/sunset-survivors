import type { PortalPoint } from '../systems/BuildingPath';

/** Reusable facade/threshold contract: only the visual aperture is inside the building. */
export interface BuildingPortal {
  id: string;
  facade: { x: number; y: number; width: number; height: number; texture: string; scale?: number };
  threshold: PortalPoint;
  aperture: PortalPoint;
  /** Optional door-leaf cutouts from the existing facade texture; never redraw its art. */
  leaves?: readonly { x: number; y: number; width: number; height: number }[];
}
