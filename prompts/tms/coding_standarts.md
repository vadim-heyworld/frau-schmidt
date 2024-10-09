# Backend
## General
### Consts
We use consts instead of strings to identify properties, i.e. `$state[Parcel::PARCEL_ID]` and in any other case where it makes sense.
Note: mappings for 3rd party APIs usually use plain string array keys
Commonly used consts like `SHIPPING_ORDER_ID` should be in `GlobalPayload` (**Application domain**)

### Annotations
We use return type annotations only when the return cannot be expressed with return type argument,
i.e. the return is an array, then the contents of the array can be specified with an annotation
`@psalm-suppress` as one-line comment, `@test as multi-line comment
Psalm suppressions should be avoided, but if unavoidable, preferrably they are in the file itself rather than the **psalm.xml**
(only put them there if they affect a whole bunch of files)

### php internal functions
We **don’t** import ‘use function’
We use template strings when possible or concat with `'.'`. **sprintf should not be used**
We *avoid* php internal array methods in favour of `ArrayList` helper class: `\heyworld\Collections\ArrayList`

### Different modules
If the current module depends on the module that models are needed from, we import them rather than duplicating them
We use resolvers when possible (existing dependency between modules), and `messageDispatcher` when the modules have no dependency to each other (avoid creating unnecessary dependencies)

### Misc
Providers return objects, resolvers return arrays (resolve method, the internal methods should return objects, that are converted to arrays in the resolve method)
Each basic class should define its own `jsonSchemaType` and that should be used in complex models, we avoid using `Schema.php`, ie.:
```php
public static function jsonSchemaType(): BoolType
{
    return JsonSchema::boolean();
}
```

When making changes to states/events (especially in the `ShippingOrder` and `ParcelTracking` domains) make sure that the projections still work
When integrating a new last mile provider, the seeding should be updated to include it

## Database
We **don’t** use database queries in for loops (performance)
We use generators when loading large data sets from the database
We use the correct database types (timestamp, uuid) instead of varchar
We always use prepared statements to avoid SQL injection
Table names should use singular (e.g. configuration.customer)
We use *snake_case* for column names
When loading entities we use **resolver** over **entityManager** (the exception are the command handlers because we need the entityManager there to do the persisting).

## Naming
We **don’t** use **Interface** or I prefix/suffix for interfaces
We **don’t** use **Exception** suffix for exceptions
In listeners the function name should state what it is doing not when (i.e. retrieveLabel rather than onShipmentCreated)
External queries/events that are needed in a module should be listed in a class **ExternalQuery/ExternalEvent** to make it obvious that it is external
We **don't** use the ‘get’ prefix for getters
We **don’t** use the ‘resolve’ prefix for resolvers
Preprocessors should use method **preProcess** rather than **__invoke**

## Tests
We name tests in snake case starting with *it_* and do not include test in the name (old tests with test and camel case still exist)
We seed every app test individually
We structure tests by **given/when/then** structure (then can be before when in case of expectException)
Test methods **always** have a return type (usually void)
Handlers should have at least one app test to cover the routing
Dataprovider cases should have names and they should be in plain text (no snake_case) with the essential information for the case
Builders should have a static **create** method and we use that to instantiate them
Put 3rd party tests into the **@thirdParty** group
If a feature is added/modified there must be a test that covers it (rare exceptions)

# Frontend
Separate styles from DOM (i.e. have a separate file for styles)
We **don’t** use index.tsx to name componentes (a lot of old components still have that, rename by boy-scout-rule)
We use prettier for formatting
Custom types that just wrap a primitive type (e.g. string) should not be used, they are fine for complex types like enums though
API calls should not check the status code of the result

# Misc
We always prefix commits with the corresponding ticket number (exception when there is no ticket for a commit)
Naming convention for branches: `<type>/TMS-XXXX-<description>`, where `type is either `feature`, `bugfix` or `other`
We add descriptions to PRs when it is not immediately clear from the ticket or the code what is going on and why
We add the feature toggle name as comment to the ticket (can be done as smart commit by adding to the commit message: #comment feature toggle: <FeatureToggleName>)
