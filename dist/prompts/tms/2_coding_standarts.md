# Backend
## General
### Constants
We MUST use consts instead of strings to identify properties, i.e. `$state[Parcel::PARCEL_ID]` and in any other case where it makes sense.
*Note*: mappings for 3rd party APIs usually use plain string array keys
Commonly used consts like `SHIPPING_ORDER_ID` MUST be in `GlobalPayload` (**Application domain**)

### Annotations
We MUST use return type annotations only when the return cannot be expressed with return type argument,
i.e. the return is an array, then the contents of the array can be specified with an annotation
`@psalm-suppress` as one-line comment, `@test as multi-line comment
Psalm suppressions SHOULD BE avoided, but if unavoidable, preferrably they are in the file itself rather than the **psalm.xml**
(only put them there if they affect a whole bunch of files)

### php internal functions
We MUST NOT import ‘use function’
We MUST use template strings when possible or concat with `'.'`. **sprintf should not be used**
We MUST NOT use php internal array methods in favour of `ArrayList` helper class: `\heyworld\Collections\ArrayList`

### Different modules
If the current module depends on the module that models are needed from, we import them rather than duplicating them
We MUST use resolvers when possible (existing dependency between modules), and `messageDispatcher` when the modules have no dependency to each other (avoid creating unnecessary dependencies)

### Misc
Each basic class MUST define its own `jsonSchemaType` and that should be used in complex models, we avoid using `Schema.php`, ie.:
```php
public static function jsonSchemaType(): BoolType
{
    return JsonSchema::boolean();
}
```

When making changes to states/events (especially in the `ShippingOrder` and `ParcelTracking` domains) we MUST make sure that the projections still work
The seeding MUST be updated to include it, when integrating a new Last Mile Provider.

## Database
- We MUST NOT use database queries in for loops (performance)
- We MUST use generators when loading large data sets from the database
- We MUST use the correct database types (timestamp, uuid) instead of varchar
- We MUST use prepared statements to avoid SQL injection
- Table names MUST use singular (e.g. configuration.customer)
- We MUST use *snake_case* for column names
- We MUST use **resolver** over **entityManager** (the exception are the command handlers because we need the entityManager there to do the persisting) when loading entities

## Naming
- We MUST NOT use **Interface** or I prefix/suffix for interfaces
- We MUST NOT use **Exception** suffix for exceptions
- In listeners the function name MUST state what it is doing not when (i.e. retrieveLabel rather than onShipmentCreated)
- External queries/events that are needed in a module MUST be listed in a class **ExternalQuery/ExternalEvent** to make it obvious that it is external
- We MUST NOT use the ‘get’ prefix for getters
- We MUST MOT use the ‘resolve’ prefix for resolvers
- Preprocessors MUST use method **preProcess** rather than **__invoke**

## Tests
- Tests name MUST be in snake case starting with *it_* and do not include test in the name
- We MUST seed every app test individually
- We SHOULD structure tests by **given/when/then** structure (then can be before when in case of expectException)
- Test methods MUST ALWAYS have a return type (usually void)
- Handlers MUST have at least one app test to cover the routing
- Data Provider cases MUST have names and they should be in plain text (no snake_case) with the essential information for the case
- Builders MUST have a static **create** method and we use that to instantiate them
- 3rd party tests MUST have the **@thirdParty** group annotation
- If a feature is added/modified there MUST be a test that covers it

# Frontend
- We MUST separate styles from DOM (i.e. have a separate file for styles)
- We MUST NOT use index.tsx to name componentes
- We MUST use Prettier tool for formatting
- Custom types that just wrap a primitive type (e.g. string) MUST NOT be used, BUT they are fine for complex types like enums
- API calls MUST NOT check the status code of the result
