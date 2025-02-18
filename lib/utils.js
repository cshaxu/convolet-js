"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toObjectMap = toObjectMap;
function toObjectMap(objects, keyMapper, valueMapper) {
    if (valueMapper === void 0) { valueMapper = function (o) { return o; }; }
    return new Map(objects.map(function (o) { return [keyMapper(o), valueMapper(o)]; }));
}
//# sourceMappingURL=utils.js.map