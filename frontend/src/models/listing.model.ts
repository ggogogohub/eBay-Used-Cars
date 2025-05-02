export interface Location {
  type: string;
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Listing {
  _id?: string;
  title: string;
  price: number;
  description?: string;
  car_type: string;
  mileage: number;
  location?: {
    name: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  listing_age?: number;
  views?: number;
  seller_id?: string;
  created_at?: Date;
  updated_at?: Date;
}
