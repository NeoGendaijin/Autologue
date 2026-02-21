# Bytecode VM and Tiny Language

Build a small programming language that compiles to bytecode and runs on a custom VM.

## Objective
Design a stack-based virtual machine and a compiler pipeline from source text to executable bytecode.

## Language Requirements
1. Syntax:
- Variables: `let x = 10`
- Arithmetic: `+ - * / %`
- Comparisons: `== != < <= > >=`
- Control flow: `if/else`, `while`
- Functions: definition, call, return values
- Built-in `print(...)`

2. Semantics:
- Lexical scoping.
- Runtime errors for undefined variables and type mismatches.
- Deterministic execution order.

## Compiler/Runtime Requirements
1. Stages:
- Lexer -> Parser -> AST -> Bytecode compiler -> VM executor

2. VM:
- Stack-based instruction set (`PUSH`, `LOAD`, `STORE`, `ADD`, `JMP`, `JMP_IF_FALSE`, `CALL`, `RET`, etc.)
- Call frames for function calls.
- Constants pool.

3. Tooling:
- `--dump-tokens`
- `--dump-ast`
- `--dump-bytecode`
- `--trace-vm` (step-by-step instruction trace)

## CLI
- `python tinyvm.py run program.tl`
- `python tinyvm.py check program.tl`
- `python tinyvm.py repl`

## Constraints
- Python standard library only.
- No parser generators; write lexer/parser manually.
- Keep architecture modular and testable.

## Output Files
- `tinyvm.py`
- `examples/` folder with at least 6 programs:
  - recursion (factorial/fibonacci)
  - loops
  - branching
  - function composition
  - runtime error example
  - performance micro benchmark

## Acceptance Criteria
- Recursive functions and nested scopes work correctly.
- Bytecode dump is readable and consistent.
- VM trace is sufficient to debug program flow.
- Error messages include source location when possible.
