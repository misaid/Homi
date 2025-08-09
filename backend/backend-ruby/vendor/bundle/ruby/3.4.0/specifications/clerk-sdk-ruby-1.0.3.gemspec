# -*- encoding: utf-8 -*-
# stub: clerk-sdk-ruby 1.0.3 ruby lib

Gem::Specification.new do |s|
  s.name = "clerk-sdk-ruby".freeze
  s.version = "1.0.3".freeze

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.metadata = { "changelog_uri" => "https://github.com/clerkinc/clerk-sdk-ruby/blob/main/CHANGELOG.md", "homepage_uri" => "https://github.com/clerkinc/clerk-sdk-ruby", "source_code_uri" => "https://github.com/clerkinc/clerk-sdk-ruby" } if s.respond_to? :metadata=
  s.require_paths = ["lib".freeze]
  s.authors = ["Clerk".freeze]
  s.bindir = "exe".freeze
  s.date = "2021-07-21"
  s.description = "Client SDK for the Clerk backend API.".freeze
  s.email = ["ruby-sdk@clerk.dev".freeze]
  s.homepage = "https://github.com/clerkinc/clerk-sdk-ruby".freeze
  s.licenses = ["MIT".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.4.0".freeze)
  s.rubygems_version = "3.2.15".freeze
  s.summary = "Clerk SDK for Ruby.".freeze

  s.installed_by_version = "3.7.1".freeze

  s.specification_version = 4

  s.add_runtime_dependency(%q<faraday>.freeze, ["~> 1.4.1".freeze])
end
