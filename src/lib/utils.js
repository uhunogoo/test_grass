export const range = (start, end, step = 1) => {
  let output = [];
  if (typeof end === 'undefined') {
    end = start;
    start = 0;
  }
  for (let i = start; i < end; i += step) {
    output.push(i);
  }
  return output;
};

export const calculateIndices = (segments, vertices) => {
  const indices = [];
  for (let i = 0; i < segments; i++) {
    const vi = i * 2;
    
    indices[i*12 + 0] = vi + 0;
    indices[i*12 + 1] = vi + 1;
    indices[i*12 + 2] = vi + 2;

    indices[i*12 + 3] = vi + 2;
    indices[i*12 + 4] = vi + 1;
    indices[i*12 + 5] = vi + 3;

    const fi = vertices + vi;

    indices[i*12 + 6] = fi + 2;
    indices[i*12 + 7] = fi + 1;
    indices[i*12 + 8] = fi + 0;

    indices[i*12 + 9] = fi + 3;
    indices[i*12 + 10] = fi + 1;
    indices[i*12 + 11] = fi + 2;
  }
  return indices;
};