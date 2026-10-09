import type { INodeMeshCellDto } from "./iNodeMeshCellDto";
import type { INodeMeshNodeDto } from "./iNodeMeshNodeDto";

/**
 * Матрица связности узлов.
 */
export interface INodeMeshDto {
  nodes: INodeMeshNodeDto[];
  cells: INodeMeshCellDto[];
  /** Когда собрана, мс. */
  generatedAt: number;
}
