Please, these code examples are the classes we can take as a reference.

## Test Builder:
````php
<?php

declare(strict_types=1);

namespace heyworld\ShippingOrderTest\Builder;

class AirportLocationBuilder
{
    private AirportId $airportId;

    public function __construct()
    {
        $this->airportId = AirportId::generate();
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

    public function build(): AirportLocation
    {
        return AirportLocation::fromRecordData(
            [
                AirportLocation::AIRPORT_ID => $this->airportId,
            ]
        );
    }
}
```

## Test case that uses dataProvider:
```php
     /**
     * @test
     * @dataProvider trackingTimeProvider
     */
    public function it_determines_whether_a_day_is_a_workday(TrackingTime $trackingTime, bool $expected): void
    {
        // given
        $franceTrackingItem = FranceTrackingItem::fromRecordData(TrackingItemBuilder::create()->build());

        // when
        $isWorkday = $franceTrackingItem->isWorkday($trackingTime);

        // then
        self::assertEquals($expected, $isWorkday);
    }

    public function trackingTimeProvider(): iterable
    {
        yield 'Sunday' => [
            'trackingTime' => TrackingTime::fromString('2024-06-23'),
            'expected' => false,
        ];

        yield 'France public holiday' => [
            'trackingTime' => TrackingTime::fromString('2024-07-14'),
            'expected' => false,
        ];
    }
```

## Entity class example:
```php
<?php

declare(strict_types=1);

namespace heyworld\Configuration\Domain\Entity;

#[ORM\Entity(repositoryClass: AirlineRepository::class)]
#[ORM\Table(name: 'configuration.airline')]
class Airline implements HeyworldImmutableRecord
{
    use HeyworldImmutableRecordLogic;

    public const AIRLINE_ID = 'airlineId';
    public const CHAMP_API_AIRLINE_IDENTIFIER = 'champApiAirlineIdentifier';

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME)]
    private AirlineId $airlineId;

    #[ORM\Column(type: StringType::NAME, nullable: true)]
    private ?ChampApiAirlineIdentifier $champApiAirlineIdentifier = null;

    public function airlineId(): AirlineId
    {
        return $this->airlineId;
    }

    public function champApiAirlineIdentifier(): ?ChampApiAirlineIdentifier
    {
        return $this->champApiAirlineIdentifier;
    }

    public static function responseTypeSchema(): ResponseTypeSchema
    {
        return JsonSchema::object(
            [
                self::AIRLINE_ID => AirlineId::jsonSchemaType(),
            ],
            [
                self::CHAMP_API_AIRLINE_IDENTIFIER => ChampApiAirlineIdentifier::jsonSchemaType()->asNullable(),
            ]
        );
    }
}
```
