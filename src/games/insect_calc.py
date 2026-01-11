# insect_calc.py - Simple calculation utility for Pyodide
# Constraints: No external assets, pure Python logic.
# Provides calculate(expression: str) -> str
# Supports simple unit conversion (kg to lbs) and basic arithmetic.
# Triggers SFX on successful calculation.

import re

# Simple conversion factors (hard‑coded for demonstration)
CONVERSION_FACTORS = {
    ('kg', 'lbs'): 2.20462,
    ('lbs', 'kg'): 1 / 2.20462,
    ('g', 'kg'): 0.001,
    ('kg', 'g'): 1000,
    ('m', 'cm'): 100,
    ('cm', 'm'): 0.01,
}

def _try_conversion(expr: str):
    """Parse strings like '10kg to lbs' and perform conversion.
    Returns result string or None if pattern not matched.
    """
    match = re.fullmatch(r"\s*(\d+(?:\.\d*)?)\s*([a-zA-Z]+)\s+to\s+([a-zA-Z]+)\s*", expr)
    if not match:
        return None
    value, src, dst = match.groups()
    key = (src.lower(), dst.lower())
    if key not in CONVERSION_FACTORS:
        return f"Conversion {src}→{dst} not supported"
    factor = CONVERSION_FACTORS[key]
    result = float(value) * factor
    return f"{value} {src} = {result:.4f} {dst}"

def _try_arithmetic(expr: str):
    """Parse simple arithmetic like '500 / 2' or '3 + 4'.
    Supports +, -, *, / operators.
    """
    # Allow spaces around operator
    match = re.fullmatch(r"\s*(\d+(?:\.\d*)?)\s*([+\-*/])\s*(\d+(?:\.\d*)?)\s*", expr)
    if not match:
        return None
    left, op, right = match.groups()
    left_val = float(left)
    right_val = float(right)
    if op == '+':
        res = left_val + right_val
    elif op == '-':
        res = left_val - right_val
    elif op == '*':
        res = left_val * right_val
    elif op == '/':
        if right_val == 0:
            return "Error: division by zero"
        res = left_val / right_val
    else:
        return None
    # Return integer if no fractional part
    if res.is_integer():
        res_str = str(int(res))
    else:
        res_str = f"{res:.4f}"
    return f"{expr.strip()} = {res_str}"

def calculate(expression: str) -> str:
    """Parse a simple expression and return a string result.
    Supports unit conversion (e.g., '10kg to lbs') and basic arithmetic.
    """
    # Try conversion first
    result = _try_conversion(expression)
    if result is not None:
        # Trigger SFX for calculation
        try:
            import js
            js.window.triggerSFX('calc')
        except Exception:
            pass
        return result
    # Then arithmetic
    result = _try_arithmetic(expression)
    if result is not None:
        try:
            import js
            js.window.triggerSFX('calc')
        except Exception:
            pass
        return result
    return "Unsupported expression"

# Example usage (will be ignored in Pyodide unless called explicitly)
if __name__ == "__main__":
    examples = ["10kg to lbs", "500 / 2", "3 + 4", "5 * 6", "7 - 2"]
    for ex in examples:
        print(calculate(ex))
