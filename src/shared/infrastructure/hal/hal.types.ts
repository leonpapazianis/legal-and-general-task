export interface HalLink {
  href: string;
  method?: string;
}

export interface HalResponse<T> {
  data: T;
  _links: Record<string, HalLink>;
}
