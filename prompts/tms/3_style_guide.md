clea# PHP Style Guide
We MUST follow PSR-12 for PHP code styling and MUST use PHP 8.2 syntax

## 1. Code Structure
### File Organization
✅ REQUIRED:
- declare(strict_types=1) must be first
- No content before opening PHP tag
- Use statements must be:
  - Alphabetically sorted
  - One use statement per line
  - No group uses
  - No leading backslash
  - No unused statements
  - No useless namespace uses

### Class Organization
✅ DO:
- Order: constants, properties, constructor, methods
- Use visibility modifiers for constants
- No empty lines around class braces
- No functions inside functions
- Proper type declarations

❌ DON'T:
- Use suffix "Exception", "Interface", or "Trait"
- Use global functions or `global` keyword
- Use `$this` inside static functions
- Mix concerns in single class

### Method Organization
✅ Required Format:
```php
public function methodName(
    Type $param1,
    ?Type $param2 = null
): ReturnType {
    // One line space before and after function
    // No blank line after opening brace
}
```

## 2. Syntax Requirements

### Types and Declarations
✅ DO:
- Use short scalar types (int vs integer)
- Use lowercase for parameter and return types
- Place null type hint last in annotations
- Use ? for nullable types when default is null
- Use Throwable instead of Exception

### Spacing Rules
✅ REQUIRED:
- 4 spaces for array indentation
- One space between typehint and variable
- No space between nullability sign (?) and typehint
- No space before colon in return types
- No spaces around square brackets
- No spaces around `->` operator
- No spaces around `::`
- No spaces in type casts
- Space after language constructs
- Space around logical operators
- Space before/after concatenation
- No space between increment/decrement operator and operand
- No spaces before semicolon
- No superfluous whitespaces

### Array Syntax
✅ DO:
```php
$array = [
    'key' => 'value',
    'another' => 'value',    // Comma required in multi-line
];
```

❌ DON'T:
- Use `array()`
- Use `list(...)` syntax
- Skip trailing comma in multi-line arrays

### Operators and Comparisons
✅ DO:
- Use `&&` and `||`
- Use null coalesce operator when possible
- Use strict comparisons (=== and !==)

❌ DON'T:
- Use `AND` and `OR`
- Use weak comparisons (== and !=)
- Use argument unpacking for PHP VM specialized functions
- Have value assignment in IF statements

### Clean Code
✅ REQUIRED:
- No dead code
- No useless parentheses
- No useless semicolons
- No useless catch blocks
- No deprecated functions
- Simple returns instead of conditions when possible

## 3. Naming Conventions
### Classes
✅ DO:
- PascalCase for class names
- Descriptive, action-based names
- Single responsibility principle

❌ DON'T:
- Use suffixes (Exception, Interface)
- Create generic names
- Mix naming conventions

### Variables and Methods
✅ DO:
- camelCase for methods/variables
- Boolean prefix: is/has/should
- Clear, descriptive names

❌ DON'T:
- Use Hungarian notation
- Single letter variables
- Abbreviations

## 4. Examples
### Good Code Example:
```php
declare(strict_types=1);

namespace App\Domain;

final class Customer
{
    public const STATUS_ACTIVE = 'active';
    private CustomerId $id;
    private ?string $name = null;

    public function setName(?string $name): self
    {
        $this->name = $name ?? '';
        return $this;
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }
}
```

### Bad Code Example:
```php
namespace App\Domain;

class CustomerInterface    // ❌ Don't use Interface suffix
{
    function GetName()     // ❌ Missing visibility, wrong case
    {
        global $status;    // ❌ Don't use global

        if ($name = $this->loadName()) {  // ❌ Assignment in condition
            return $name;
        } else {
            return NULL;   // ❌ Wrong case for null
        }
    }
}
```
