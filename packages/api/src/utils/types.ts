export type DataType<T> = Omit<T, '_id' | 'id' | 'createdAt' | 'updatedAt'>;
