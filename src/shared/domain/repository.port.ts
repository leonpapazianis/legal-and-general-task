export interface RepositoryPort<T> {
  findById(id: string): T | undefined;
  findAll(): T[];
  save(entity: T): T;
  delete(id: string): void;
}
