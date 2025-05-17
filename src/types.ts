export interface User {
  id?: string;
  name: string;
  password: string;
  wins?: string[];
}

export interface RequestPayload<T> {
  type: string;
  id: number;
  data: T;
}
