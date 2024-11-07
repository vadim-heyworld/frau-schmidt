# Development Principles and Conventions
## 1. Class Design Patterns

### Single-Method Classes
✅ REQUIRED:
```php
// ✅ DO: Clear purpose in class name with __invoke
final class CreateCustomerOrder
{
    public function __invoke(OrderData $data): Order
    {
        // Implementation
    }
}

// ❌ DON'T: Generic name or multiple methods
class OrderProcessor
{
    public function process(OrderData $data): Order
    {
        // Implementation
    }
}
```

### Static Methods
⚠️ GUIDELINES:
- Use sparingly and only when necessary
- Prefer instance methods for better testability
- Ideal for factory methods or pure functions
✅ DO:
```php
final class OrderId
{
    public static function generate(): self
    {
        return new self(Uuid::v4());
    }
}
```

## 2. Error Handling

### Exception Usage
✅ REQUIRED:
```php
// Public API Exceptions
class OrderNotFoundException extends Exception implements ProvidesProblemDetails
{
    public function getStatus(): int
    {
        return Response::HTTP_NOT_FOUND;
    }

    public function getType(): string
    {
        return 'order-not-found';
    }
}

// Internal Exceptions
class OrderProcessingException extends Exception
{
    public function __construct()
    {
        parent::__construct('Order processing failed', Response::HTTP_BAD_REQUEST);
    }
}
```

### Entity Resolution
✅ DO:
```php
public function findOrder(OrderId $id): Order
{
    $order = $this->repository->find($id);
    if ($order === null) {
        throw new OrderNotFoundException($id);
    }
    return $order;
}
```

❌ DON'T:
```php
public function findOrder(OrderId $id): ?Order  // ❌ Don't return null
{
    return $this->repository->find($id);
}
```

## 3. Repository Naming Conventions

### Doctrine Resolver Methods
✅ REQUIRED:
```php
interface OrderResolver
{
    // Primary key lookup
    public function byId(OrderId $id): Order;

    // Single entity by attributes
    public function byCustomer(CustomerId $customerId): Order;
    public function byReferenceAndStatus(
        Reference $ref,
        Status $status
    ): Order;

    // Collections
    public function allByStatus(Status $status): array;
    public function allByCustomerType(CustomerType $type): array;
}
```

## 4. Testing Conventions

### Third-Party Integration Tests
✅ REQUIRED:
```php
/**
 * @covers \App\Infrastructure\ThirdParty\SkynetMapper
 */
final class SkynetMapperTest extends TestCase
{
    /**
     * @test
     */
    public function it_maps_response_to_domain_model(): void
    {
        // given
        $response = $this->getSkynetResponse();

        // when
        $result = $this->mapper->map($response);

        // then
        self::assertEquals($expected, $result);
    }
}
```

### Test Coverage
✅ GUIDELINES:
- Use @covers annotation when relationship isn't clear
- Ensure all third-party mappings have unit tests
- Test both success and error scenarios

## 5. Version Control Practices

### Commit Guidelines
✅ RECOMMENDED:
- Keep commits focused and minimal
- Write meaningful commit messages
- Follow conventional commits format

✅ DO:
```bash
feat(orders): add new status transition validation
fix(customer): resolve null reference in address
```

### TODO Comments
⚠️ GUIDELINES:
- Use sparingly and only for temporary notes
- Include ticket reference and deadline
- Review and clean up regularly

✅ DO:
```php
// TODO(TICKET-123): Refactor this after customer module migration
// Expected completion: 2024-02-01
```

❌ DON'T:
```php
// TODO: Fix this later
// TODO: This is not optimal
```
