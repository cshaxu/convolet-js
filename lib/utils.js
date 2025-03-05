"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toObjectMap = toObjectMap;
function toObjectMap(objects, keyMapper, valueMapper = (o) => o) {
    return new Map(objects.map((o) => [keyMapper(o), valueMapper(o)]));
}
//# sourceMappingURL=utils.js.map