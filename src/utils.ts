function toObjectMap<OBJECT, KEY, VALUE = OBJECT>(
  objects: OBJECT[],
  keyMapper: (object: OBJECT) => KEY,
  valueMapper: (object: OBJECT) => VALUE = (o) => o as unknown as VALUE
): Map<KEY, VALUE> {
  return new Map(objects.map((o) => [keyMapper(o), valueMapper(o)]));
}

export { toObjectMap };
