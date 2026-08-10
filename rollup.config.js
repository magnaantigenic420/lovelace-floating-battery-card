import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

const production = process.env.NODE_ENV !== 'development';

export default {
  input: 'src/floating-battery-card.ts',
  output: {
    file: 'dist/floating-battery-card.js',
    format: 'es',
    sourcemap: !production,
    inlineDynamicImports: true,
  },
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
    production && terser({ ecma: 2022, format: { comments: false } }),
  ].filter(Boolean),
};
