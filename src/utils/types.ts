export type ResolvedPromiseType<Type> = Type extends Promise<infer X> ? X : never;
