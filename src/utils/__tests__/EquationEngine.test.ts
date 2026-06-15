/// <reference types="jest" />
// Simple test file — uses global describe/it/expect (configure test runner as needed)
import { EquationEngine } from '../EquationEngine';

describe('EquationEngine', () => {
  describe('evaluate', () => {
    it('converts 1in to mm (25.4)', () => {
      const result = EquationEngine.evaluate('1in', {});
      expect(result).toBeCloseTo(25.4, 1);
    });

    it('keeps 5mm as 5.0', () => {
      const result = EquationEngine.evaluate('5mm', {});
      expect(result).toBeCloseTo(5.0, 1);
    });

    it('adds 1in + 5mm = 30.4', () => {
      const result = EquationEngine.evaluate('1in + 5mm', {});
      expect(result).toBeCloseTo(30.4, 1);
    });

    it('handles plain numbers', () => {
      const result = EquationEngine.evaluate('42', {});
      expect(result).toBeCloseTo(42.0, 1);
    });

    it('supports variable substitution', () => {
      const result = EquationEngine.evaluate('A + B', { A: 10, B: 5 });
      expect(result).toBeCloseTo(15.0, 1);
    });

    it('supports cm and m units', () => {
      expect(EquationEngine.evaluate('1cm', {})).toBeCloseTo(10.0, 1);
      expect(EquationEngine.evaluate('1m', {})).toBeCloseTo(1000.0, 1);
    });

    it('returns 0 for empty expression', () => {
      expect(EquationEngine.evaluate('', {})).toBe(0);
    });
  });

  describe('solveVariableChain', () => {
    it('resolves linear chain A=B, B=C, C=5', () => {
      const result = EquationEngine.solveVariableChain({
        A: 'B',
        B: 'C',
        C: '5',
      });
      expect(result.A).toBeCloseTo(5.0, 1);
      expect(result.B).toBeCloseTo(5.0, 1);
      expect(result.C).toBeCloseTo(5.0, 1);
    });

    it('detects circular dependency and does not hang', () => {
      const result = EquationEngine.solveVariableChain({
        A: 'B',
        B: 'A',
      });
      expect(result.A).toBe(0);
      expect(result.B).toBe(0);
    });

    it('resolves mixed numeric and variable formulas', () => {
      const result = EquationEngine.solveVariableChain({
        radius: '10',
        diameter: 'radius * 2',
        circumference: 'diameter * 3.14159',
      });
      expect(result.radius).toBeCloseTo(10.0, 1);
      expect(result.diameter).toBeCloseTo(20.0, 1);
      expect(result.circumference).toBeCloseTo(62.8318, 1);
    });

    it('handles single variable with no dependencies', () => {
      const result = EquationEngine.solveVariableChain({
        length: '100',
      });
      expect(result.length).toBeCloseTo(100.0, 1);
    });
  });
});
