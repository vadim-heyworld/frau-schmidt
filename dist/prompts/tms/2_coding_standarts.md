# Backend

## 1. Architecture Patterns
### Domain Organization
- One domain concept per file
- Clear boundary between domains
- Use resolvers for cross-domain communication
✅ Module Dependencies:
```php
// ✅ DO: Import from dependent module
use OtherModule\Domain\Customer;

// ❌ DON'T: Duplicate models across modules
class Customer { /* duplicated code */ }
```


### Data Access
✅ REQUIRED:
- Use resolvers over direct entity manager access
- Use typed parameters and return values
- Follow naming conventions:

#### Naming Conventions:
- Don't use Interface or I prefix/suffix for interfaces
- Don't use Exception suffix for exceptions
- In listeners, name functions by action, not event (e.g., `retrieveLabel` not `onShipmentCreated`)
- Don't use 'get' prefix for getters
- Don't use 'resolve' prefix for resolvers

✅ DO:
```php
// Interface
interface OrderProcessor { }  // Not OrderProcessorInterface

// Exception
class InvalidOrder extends RuntimeException { }  // Not InvalidOrderException

// Listener
public function retrieveLabel(ShipmentEvent $event) { }  // Not onShipmentCreated

// Getter
public function total(): float { }  // Not getTotal

// Resolver
public function customer(CustomerId $id): Customer { }  // Not resolveCustomer

public function byStatus(Status $status): array
{
    return $this->resolver->allByStatus($status);
}
```
❌ DON'T:
```php
interface IOrderProcessor { }  // ❌ BAD
interface OrderProcessorInterface { }  // ❌ BAD

class InvalidOrderException extends RuntimeException { }  // ❌ BAD

public function onShipmentCreated(ShipmentEvent $event) { }  // ❌ BAD

public function getTotal(): float { }  // ❌ BAD

public function resolveCustomer(CustomerId $id): Customer { }  // ❌ BAD
```

### Error Handling
- Use Result objects for expected errors
- Throw exceptions for system errors
- Always include context in errors
✅ REQUIRED:
```php
// Business logic errors
public function process(): Result
{
    if (!$this->isValid()) {
        return Result::failure('Invalid data', context: ['id' => $this->id]);
    }
    return Result::success($data);
}

// System errors
public function retrieve(): void
{
    if (!$this->connection->isActive()) {
        throw new ConnectionException('Database connection failed');
    }
}


## 2. Code Organization
### Constants
We MUST use consts instead of strings to identify properties
✅ DO:
```php
class ShippingOrder
{
    public const SHIPPING_ORDER_ID = 'shippingOrderId';
    public const STATUS = 'status';

    private ShippingOrderId $id;
    private Status $status;
}
```
❌ DON'T:
- Use magic strings
- Duplicate constants across domains

### Database Practices
✅ DO:
- Use prepared statements
- Implement batch processing
- Use correct data types

❌ DON'T:
- Query in loops
```php
// Avoid queries in loops
foreach ($orders as $order) {
    $this->entityManager->persist($order);  // ❌ BAD
    $this->entityManager->flush();          // ❌ BAD
}
```
- Use string for UUID/timestamps
- Mix database concerns with business logic

### Annotations and Types
✅ REQUIRED:
```php
class OrderService {
    /**
     * @return Order[] Array of pending orders
     */
    public function pendingOrders(): array {
        // Implementation
    }

    /** @psalm-suppress InvalidArgument */
    public function process(): void {
        // Only when absolutely necessary
    }
}
```

### PHP Best Practices
✅ DO:
```php
// String concatenation
$message = "Order {$orderId} processed";
$path = $basePath . '/' . $filename;

// Array operations
$items = ArrayList::from($array)
    ->filter(fn($item) => $item->isActive())
    ->map(fn($item) => $item->toArray());
```

❌ DON'T:
```php
use function array_map;  // ❌ Don't import PHP functions
$message = sprintf("Order %s processed", $orderId);  // ❌ Don't use sprintf
```

### Misc
Each basic class MUST define its own `jsonSchemaType` and that should be used in complex models, we avoid using `Schema.php`, ie.:
✅ DO:
```php
public static function jsonSchemaType(): BoolType
{
    return JsonSchema::boolean();
}
```

### Tests Standards
✅ REQUIRED:
```php
final class OrderProcessTest extends TestCase
{
    /**
     * @test
     * @dataProvider orderStatusProvider
     */
    public function it_processes_order_with_different_statuses(
        OrderStatus $status,
        bool $expectedResult
    ): void {
        // given
        $order = OrderBuilder::create()
            ->withStatus($status)
            ->build();

        // when
        $result = $this->processor->process($order);

        // then
        self::assertSame($expectedResult, $result);
    }

    public function orderStatusProvider(): array
    {
        return [
            'new order can be processed' => [
                OrderStatus::new(),
                true,
            ],
            'completed order cannot be processed' => [
                OrderStatus::completed(),
                false,
            ],
        ];
    }
}
```

### Test Requirements
✅ REQUIRED:
- Snake case test names starting with `it_`
- Given/When/Then structure
- Individual test seeding
- Return type declarations
- Cover new features with tests
- Use data providers for multiple scenarios


## 4. Frontend Standards

### Structure
✅ DO:
```typescript
// Component.tsx
export const OrderList: React.FC = () => {
    return <div className={styles.container}>...</div>;
};

// Component.styles.ts
export const styles = {
    container: 'p-4 bg-white rounded',
};
```

### Types and API
✅ DO:
```typescript
// Complex types are okay
type OrderStatus = 'pending' | 'completed' | 'cancelled';

// API calls
const fetchOrder = async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
};
```

❌ DON'T:
```typescript
// Don't wrap primitive types
type OrderId = string;  // ❌ BAD

// Don't check status in component
if (response.status === 200) {  // ❌ BAD
    // handle response
}
```
