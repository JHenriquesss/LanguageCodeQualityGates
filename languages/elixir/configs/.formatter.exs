# Deterministic formatting. Check: mix format --check-formatted
# Pairs with REFERENCE.md (MUST 2). The Elixir formatter is built in and authoritative.
[
  inputs: ["{mix,.formatter,.credo}.exs", "{config,lib,test}/**/*.{ex,exs}"],
  line_length: 100
]
