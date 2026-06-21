# SimpleCov setup. Require this at the very top of spec/spec_helper.rb
# (or test/test_helper.rb) BEFORE loading application code:
#
#   require_relative "../config/simplecov"   # adjust path
#
# Pairs with REFERENCE.md coverage thresholds. Run coverage with COVERAGE=1.

if ENV["COVERAGE"] || ENV["CI"]
  require "simplecov"

  SimpleCov.start do
    enable_coverage :branch
    add_filter "/spec/"
    add_filter "/test/"
    add_filter "/config/"

    add_group "Domain", "app/domain"
    add_group "Application", "app/application"
    add_group "Infrastructure", "app/infrastructure"

    # Global floor; tighten per group/path to the doc tiers (domain 90 / app 85).
    minimum_coverage line: 80, branch: 75
  end
end
