export function deepClone<T>(obj: T): T {
	if (typeOf(obj) !== "table") {
		return obj;
	}

	const result = {} as T;
	for (const [key, value] of pairs(obj as object)) {
		(result as Record<string, defined>)[key as string] = deepClone(value);
	}
	return result;
}

export function tail<T extends defined>(arr: T[]): T[] {
	const result: T[] = [];
	for (let i = 1; i < arr.size(); i++) {
		result.push(arr[i]);
	}
	return result;
}

export function extend<T extends object>(target: T, source: T): T {
	for (const [key, value] of pairs(source)) {
		(target as Record<string, unknown>)[key as string] = value;
	}
	return target;
}
