export const toCamelCase = (str: string) => {
  return str.replace(/([-_][a-z])/g, group =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
};

export const toSnakeCase = (str: string) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

export const camelizeKeys = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => camelizeKeys(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      result[toCamelCase(key)] = camelizeKeys(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

export const snakeizeKeys = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => snakeizeKeys(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      result[toSnakeCase(key)] = snakeizeKeys(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};
