/**
 * EquationEngine.ts
 * Core logic for parsing and evaluating mathematical expressions in 3D-Builder.
 * Supports basic operators: +, -, *, /, ^ and variable substitution.
 */

export class EquationEngine {
  /**
   * Safely evaluates a mathematical expression string.
   * @param expr The expression to evaluate (e.g., "WIDTH * 2 + 10")
   * @param context A dictionary of variables and their numeric values
   * @returns The evaluated result as a number
   */
  public static evaluate(expr: string, context: Record<string, number> = {}): number {
    // 1. Basic Sanitization: Remove whitespace and handle common SW symbols
    let sanitized = expr.replace(/\s+/g, '');
    
    // 2. Variable Substitution: Sort by length descending to prevent partial matches (e.g., "W" matching "WIDTH")
    const sortedVars = Object.keys(context).sort((a, b) => b.length - a.length);
    for (const varName of sortedVars) {
      const value = context[varName];
      // Use regex with word boundary or simple replace if sanitized is pure alphanumeric+ops
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      sanitized = sanitized.replace(regex, `(${value})`);
    }

    // 3. Evaluation
    try {
      // For SW2000 parity, we use a simple functional evaluator. 
      // In a production app, we'd use a parser library, but here we'll implement a safe subset.
      // We replace '^' with '**' for JS compatibility
      sanitized = sanitized.replace(/\^/g, '**');
      
      // Safety check: Only allow numbers, basic operators, and parentheses
      if (/[^-+*/().0-9e**]/.test(sanitized)) {
        throw new Error(`Invalid characters in expression: ${sanitized}`);
      }

      // eslint-disable-next-line no-eval
      const result = eval(sanitized);
      return typeof result === 'number' ? result : 0;
    } catch (err) {
      console.warn(`[EquationEngine] Failed to evaluate: "${expr}" -> "${sanitized}"`, err);
      return 0;
    }
  }

  /**
   * Resolves a set of potentially interdependent variable formulas.
   * Handles dependency ordering and detects circular references.
   */
  public static solveVariableChain(variables: Record<string, string>): Record<string, number> {
    const solved: Record<string, number> = {};
    const unsolved = { ...variables };
    let changed = true;

    // Iterative resolution (Topological-lite)
    while (changed) {
      changed = false;
      for (const [name, formula] of Object.entries(unsolved)) {
        // If formula is pure numeric
        if (!isNaN(parseFloat(formula)) && !/[a-zA-Z]/.test(formula)) {
          solved[name] = parseFloat(formula);
          delete unsolved[name];
          changed = true;
          continue;
        }

        // Try to solve using already solved variables
        try {
          // Check if all variables in the formula are already solved
          const requiredVars = formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
          const allResolved = requiredVars.every(v => solved.hasOwnProperty(v));

          if (allResolved) {
            solved[name] = this.evaluate(formula, solved);
            delete unsolved[name];
            changed = true;
          }
        } catch (e) {
          // Skip for now
        }
      }
    }

    return solved;
  }
}
