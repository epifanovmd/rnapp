/**
 * Узел в матрице связности.
 */
export interface INodeMeshNodeDto {
  id: string;
  name: string;
  /** @nullable */
  host: string | null;
}
