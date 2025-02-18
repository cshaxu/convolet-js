declare function toObjectMap<OBJECT, KEY, VALUE = OBJECT>(objects: OBJECT[], keyMapper: (object: OBJECT) => KEY, valueMapper?: (object: OBJECT) => VALUE): Map<KEY, VALUE>;
export { toObjectMap };
