# Credo config for the quality gate. Run: mix credo --strict
# Pairs with REFERENCE.md (MUST 3, 6 + Complexity Limits).
#
# This sets strict mode and tunes the complexity checks to the doc maximums.
# To keep the full default check set, run `mix credo gen.config` once and merge
# the `strict: true` flag and the three complexity overrides below into it.
%{
  configs: [
    %{
      name: "default",
      files: %{
        included: ["lib/", "src/", "web/", "apps/"],
        excluded: [~r"/_build/", ~r"/deps/", ~r"/node_modules/"]
      },
      strict: true,
      checks: %{
        enabled: [
          # Complexity limits (doc maximums).
          {Credo.Check.Refactor.CyclomaticComplexity, [max_complexity: 10]},
          {Credo.Check.Refactor.Nesting, [max_nesting: 3]},
          {Credo.Check.Refactor.FunctionArity, [max_arity: 6]},
          # High-value correctness/readability checks.
          {Credo.Check.Warning.UnusedEnumOperation, []},
          {Credo.Check.Warning.IExPry, []},
          {Credo.Check.Warning.IoInspect, []},
          {Credo.Check.Design.TagTODO, []},
          {Credo.Check.Readability.ModuleDoc, []}
        ]
      }
    }
  ]
}
