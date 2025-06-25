export interface Photo {
  id: number;
  name: string;
  data: string;
  url: string;
  thumbnailUrl?: string;
  image_data?: string;
  _assignedWorld?: string;
}

export interface Album {
  id: number;
  custom_id: string;
  name: string;
}

export interface WorldGroup {
  [worldName: string]: Photo[];
} 