# Development rules
- ALWAYS use `__invoke` method instead of named one when a class has only one method for better readiness, when we want to use it.
make sure the class name tells what it’s about.
- we CAN use static methods when we need it, but it’s not recommended to use them a lot.
- exceptions CAN be used minimally if it's the end of execution, otherwise an error object is expected to be used.
- ALWAYS use `ProvidesProblemDetails` if we want to show an exception publicly in all environments, otherwise `BadRequest` is just used to provide a status code
- ALWAYS throw an exception if the Doctrine Entity is not found and use status code 404 and handle it in the frontend accordingly. We SHOULD NOT return null if the entity does not exist.
- it’s RECOMMENDED to keep commits count at minimum and keep only meaningful commit messages.
- we CAN use todos in RARE cases, but it’s recommended not to use them a lot
- for the Doctrine resolvers we ALWAYS follow the rules:
  - byId() method name for the resolver method that resolves entity by PK
  - by%MethodAttributes% for others, e.g.:
      - byAirline()
      - byAirlineAndCustomer()
  - add prefix *all* for lists, e.g.
    - allByAirlineCode()
- we have an agreement that we NEED to have unit tests for 3rd party request body mapping, example:
  - `SkynetMapper`
- we CAN use @covers annotation to show what this test class covers in case there is no other way to connect it to the unit
