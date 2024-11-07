# Code Pattern Templates

These templates demonstrate the standard patterns for building test builders, test cases, and entities in our codebase.

## 1. Test Builder Pattern

### Basic Builder Template
```php
<?php

declare(strict_types=1);

namespace Domain\Test\Builder;

final class CustomerBuilder
{
    private CustomerId $id;
    private string $name;
    private ?Status $status;

    public function __construct()
    {
        $this->id = CustomerId::generate();
        $this->name = 'Default Name';
        $this->status = null;
    }

    public static function create(): self
    {
        return new self();
    }

    public function withId(string $id): self
    {
        $this->id = CustomerId::fromString($id);
        return $this;
    }

    public function withName(string $name): self
    {
        $this->name = $name;
        return $this;
    }

    public function withStatus(?Status $status): self
    {
        $this->status = $status;
        return $this;
    }

    public function build(): Customer
    {
        return Customer::fromRecordData([
            Customer::ID => $this->id,
            Customer::NAME => $this->name,
            Customer::STATUS => $this->status,
        ]);
    }
}
```

### Complex Builder Example
```php
final class AirportLocationBuilder
{
    private AirportId $airportId;
    private ?string $name;
    private ?Coordinates $coordinates;

    public function __construct()
    {
        $this->airportId = AirportId::generate();
        $this->name = null;
        $this->coordinates = null;
    }

    public static function create(): self
    {
        return new self();
    }

    public function withAirportId(string $airportId): self
    {
        $this->airportId = AirportId::fromString($airportId);
        return $this;
    }

    public function withRequiredData(): self
    {
        $this->name = 'Charles de Gaulle';
        $this->coordinates = Coordinates::fromValues(48.8566, 2.3522);
        return $this;
    }

    public function build(): AirportLocation
    {
        return AirportLocation::fromRecordData([
            AirportLocation::AIRPORT_ID => $this->airportId,
            AirportLocation::NAME => $this->name,
            AirportLocation::COORDINATES => $this->coordinates,
        ]);
    }
}
```

## 2. Test Case Patterns

### Data Provider Pattern
```php
final class WorkdayCalculatorTest extends TestCase
{
    /**
     * @test
     * @dataProvider workdayProvider
     */
    public function it_determines_whether_a_day_is_a_workday(
        DateTimeImmutable $date,
        bool $expected
    ): void {
        // given
        $calculator = new WorkdayCalculator();

        // when
        $result = $calculator->isWorkday($date);

        // then
        self::assertSame($expected, $result);
    }

    public function workdayProvider(): iterable
    {
        yield 'regular workday' => [
            'date' => new DateTimeImmutable('2024-02-12'), // Monday
            'expected' => true,
        ];

        yield 'weekend day' => [
            'date' => new DateTimeImmutable('2024-02-10'), // Saturday
            'expected' => false,
        ];

        yield 'public holiday' => [
            'date' => new DateTimeImmutable('2024-01-01'), // New Year
            'expected' => false,
        ];
    }
}
```

### Complex Test Case Example
```php
final class OrderProcessingTest extends TestCase
{
    /**
     * @test
     * @dataProvider orderScenarioProvider
     */
    public function it_processes_orders_based_on_status(
        Order $order,
        ProcessingResult $expectedResult,
        ?Exception $expectedException
    ): void {
        // given
        $processor = new OrderProcessor();

        // when & then
        if ($expectedException !== null) {
            $this->expectExceptionObject($expectedException);
        }

        $result = $processor->process($order);

        if ($expectedException === null) {
            self::assertEquals($expectedResult, $result);
        }
    }

    public function orderScenarioProvider(): iterable
    {
        yield 'successful processing' => [
            'order' => OrderBuilder::create()
                ->withStatus(OrderStatus::new())
                ->build(),
            'expectedResult' => ProcessingResult::success(),
            'expectedException' => null,
        ];

        yield 'fails for invalid status' => [
            'order' => OrderBuilder::create()
                ->withStatus(OrderStatus::cancelled())
                ->build(),
            'expectedResult' => null,
            'expectedException' => new InvalidOrderStatusException(),
        ];
    }
}
```

## 3. Entity Patterns

### Basic Entity Template
```php
<?php

declare(strict_types=1);

namespace Domain\Entity;

#[ORM\Entity(repositoryClass: CustomerRepository::class)]
#[ORM\Table(name: 'customer')]
final class Customer implements ImmutableRecord
{
    use ImmutableRecordLogic;

    public const ID = 'id';
    public const NAME = 'name';
    public const STATUS = 'status';

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME)]
    private CustomerId $id;

    #[ORM\Column(type: StringType::NAME)]
    private string $name;

    #[ORM\Column(type: StatusType::NAME, nullable: true)]
    private ?Status $status = null;

    public function id(): CustomerId
    {
        return $this->id;
    }

    public function name(): string
    {
        return $this->name;
    }

    public function status(): ?Status
    {
        return $this->status;
    }

    public static function responseTypeSchema(): ResponseTypeSchema
    {
        return JsonSchema::object(
            [
                self::ID => CustomerId::jsonSchemaType(),
                self::NAME => JsonSchema::string(),
            ],
            [
                self::STATUS => Status::jsonSchemaType()->asNullable(),
            ]
        );
    }
}
```

### Complex Entity Example
```php
#[ORM\Entity(repositoryClass: AirlineRepository::class)]
#[ORM\Table(name: 'configuration.airline')]
final class Airline implements HeyworldImmutableRecord
{
    use HeyworldImmutableRecordLogic;

    public const AIRLINE_ID = 'airlineId';
    public const CHAMP_API_AIRLINE_IDENTIFIER = 'champApiAirlineIdentifier';
    public const ACTIVE = 'active';

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME)]
    private AirlineId $airlineId;

    #[ORM\Column(type: StringType::NAME, nullable: true)]
    private ?ChampApiAirlineIdentifier $champApiAirlineIdentifier = null;

    #[ORM\Column(type: BooleanType::NAME)]
    private bool $active = true;

    public function airlineId(): AirlineId
    {
        return $this->airlineId;
    }

    public function champApiAirlineIdentifier(): ?ChampApiAirlineIdentifier
    {
        return $this->champApiAirlineIdentifier;
    }

    public function isActive(): bool
    {
        return $this->active;
    }

    public function deactivate(): void
    {
        $this->active = false;
    }

    public static function responseTypeSchema(): ResponseTypeSchema
    {
        return JsonSchema::object(
            [
                self::AIRLINE_ID => AirlineId::jsonSchemaType(),
                self::ACTIVE => JsonSchema::boolean(),
            ],
            [
                self::CHAMP_API_AIRLINE_IDENTIFIER =>
                    ChampApiAirlineIdentifier::jsonSchemaType()->asNullable(),
            ]
        );
    }
}
```
