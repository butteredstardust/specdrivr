import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat();

/**
 * @type {import('eslint').Linter.Config[]}
 */
const eslintConfig = [...compat.extends('next/core-web-vitals', 'next/typescript')];

export default eslintConfig;
