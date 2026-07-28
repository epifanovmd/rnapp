export interface PollOptionDto {
  id: string;
  text: string;
  position: number;
  voterCount: number;
  voterIds: string[];
}
