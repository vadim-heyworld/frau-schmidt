We ALWAYS follow PSR-12 for PHP code style.

We also ALWAYS:
- Force array element indentation with 4 spaces
- Forbid `array(...)`
- Force whitespace after a type cast
- Forbid any content before opening tag
- Forbid deprecated functions
- Force parameter and return type declarations to be lowercased
- Require comma after last element in multi-line array
- Require presence of constant visibility
- Forbid empty lines around class braces
- Forbid prefix and suffix "Exception" for exception classes
- Forbid prefix and suffix "Interface" for interfaces
- Forbid suffix "Trait" for traits
- Require usage of null coalesce operator when possible
- Forbid usage of conditions when a simple return can be used
- Forbid useless unreachable catch blocks
- Require using Throwable instead of Exception
- Require use statements to be alphabetically sorted
- Forbid fancy group uses
- Forbid multiple use statements on same line
- Forbid using absolute class name references (except global ones)
- Forbid unused use statements
- Forbid superfluous leading backslash in use statements
- Forbid useless uses of the same namespace
- Forbid useless alias for classes, constants and functions
- Forbid weak comparisons
- Require no spacing after spread operator
- Forbid argument unpacking for functions specialized by PHP VM
- Forbid `list(...)` syntax
- Forbid use of longhand cast operators
- Require presence of declare(strict_types=1)
- Forbid useless parentheses
- Forbid useless semicolon `;`
- Require use of short versions of scalar types (i.e. int instead of integer)
- Require the `null` type hint to be in the last position of annotations
- Require ? when default value is null
- Require one space between typehint and variable, require no space between nullability sign and typehint
- Forbid space before colon in return types
- Forbid spaces around square brackets
- Force `self::` for self-reference, force lower-case self, forbid spaces around `::`
- Forbid global functions
- Force camelCase variables
- Forbid `AND` and `OR`, require `&&` and `||`
- Forbid `global`
- Forbid functions inside functions
- Require PHP function calls in lowercase
- Forbid dead code
- Forbid `$this` inside static function
- Force whitespace before and after concatenation
- Forbid spaces in type casts
- Forbid blank line after function opening brace
- Require 1 line before and after function, except at the top and bottom
- Require there be no space between increment/decrement operator and its operand
- Require space after language constructs
- Require space around logical operators
- Forbid spaces around `->` operator
- Forbid spaces before semicolon `;`
- Forbid superfluous whitespaces
