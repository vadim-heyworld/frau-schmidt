# Backend
## General
### Constants
We MUST use consts instead of strings to identify properties, i.e. `$state[Parcel::PARCEL_ID]` and in any other case where it makes sense.
*Note*: mappings for 3rd party APIs usually use plain string array keys
Commonly used consts like `SHIPPING_ORDER_ID` MUST be in `GlobalPayload` (**Application domain**)

### Annotations
We use return type annotations only when the return cannot be expressed with return type argument,
i.e. the return is an array, then the contents of the array can be specified with an annotation
`@psalm-suppress` as one-line comment, `@test as multi-line comment
Psalm suppressions should be avoided, but if unavoidable, preferrably they are in the file itself rather than the **psalm.xml**
(only put them there if they affect a whole bunch of files)

### php internal functions
DON'T import ‘use function’
DO use template strings when possible or concat with `'.'`. **sprintf should not be used**
DON'T use php internal array methods in favour of `ArrayList` helper class: `\heyworld\Collections\ArrayList`

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

When making changes to states/events (especially in the `ShippingOrder` and `ParcelTracking` domains) make sure that the projections still work
When integrating a new Last Mile Provider, the seeding MUST be updated to include it

## Database
DON'T use database queries in for loops (performance)
ALWAYS use generators when loading large data sets from the database
ALWAYS use the correct database types (timestamp, uuid) instead of varchar
ALWAYS use prepared statements to avoid SQL injection
Table names MUST use singular (e.g. configuration.customer)
ALWAYS use *snake_case* for column names
When loading entities we use **resolver** over **entityManager** (the exception are the command handlers because we need the entityManager there to do the persisting).

## Naming
DON'T use **Interface** or I prefix/suffix for interfaces
DON'T use **Exception** suffix for exceptions
In listeners the function name MUST state what it is doing not when (i.e. retrieveLabel rather than onShipmentCreated)
External queries/events that are needed in a module should be listed in a class **ExternalQuery/ExternalEvent** to make it obvious that it is external
DON'T use the ‘get’ prefix for getters
DON'T use the ‘resolve’ prefix for resolvers
Preprocessors MUST use method **preProcess** rather than **__invoke**

## Tests
Tests name MUST be in snake case starting with *it_* and do not include test in the name
We MUST seed every app test individually
We SHOULD structure tests by **given/when/then** structure (then can be before when in case of expectException)
Test methods ALWAYS have a return type (usually void)
Handlers MUST have at least one app test to cover the routing
Data Provider cases MUST have names and they should be in plain text (no snake_case) with the essential information for the case
Builders MUST have a static **create** method and we use that to instantiate them
3rd party tests MUST have the **@thirdParty** group annotation
If a feature is added/modified there MUST be a test that covers it

# Frontend
Separate styles from DOM (i.e. have a separate file for styles)
We DON'T use index.tsx to name componentes
We MUST use prettier for formatting
Custom types that just wrap a primitive type (e.g. string) should not be used, they are fine for complex types like enums though
API calls should not check the status code of the result
