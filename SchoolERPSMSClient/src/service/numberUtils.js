// numberUtils.js
// export function ensureNumber(value) {
//     const num = Number(value);
//     if (isNaN(num)) {
//       throw new Error(`Value "${value}" is not a valid number`);
//     }
//     return num;
//   }
  

  export function ensureNumber(value, fieldName = 'value') {
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`"${fieldName}" must be a valid number. Received: "${value}"`);
    }
    return num;
  }
  