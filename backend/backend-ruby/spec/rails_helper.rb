require 'spec_helper'
ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
abort("The Rails environment is running in production mode!") if Rails.env.production?
require 'rspec/rails'
require 'webmock/rspec'

Dir[Rails.root.join('spec/support/**/*.rb')].sort.each { |f| require f }

# Ensure predictable env for tests
# Point tests to a local ephemeral Postgres unless DATABASE_URL is provided
ENV['DATABASE_URL'] ||= 'postgres://postgres:postgres@localhost:5433/backend_ruby_test?sslmode=disable'
ENV['PGUSER'] ||= 'postgres'
ENV['API_KEY'] ||= 'dev_api_key'
ENV['CLERK_ISSUER'] ||= 'test-issuer'

if ENV['SUPABASE_URL']
  begin
    supa = URI(ENV['SUPABASE_URL'])
    allow_patterns = [ %r{\A#{Regexp.escape(supa.scheme)}://#{Regexp.escape(supa.host)}(:\d+)?} ]
    WebMock.disable_net_connect!(allow_localhost: true, allow: allow_patterns)
  rescue StandardError
    WebMock.disable_net_connect!(allow_localhost: true)
  end
else
  WebMock.disable_net_connect!(allow_localhost: true)
end

RSpec.configure do |config|
  # Use DatabaseCleaner instead
  config.use_transactional_fixtures = false
  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!
  config.include FactoryBot::Syntax::Methods

  # Ensure DB can be reached in CI/local without docker link name
  # Allow overriding PG host via ENV DATABASE_URL; otherwise default config applies.
end

# Bypass Clerk verification in test middleware
ENV['CLERK_BYPASS'] = '1'


