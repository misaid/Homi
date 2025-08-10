Rails.application.routes.draw do
  require "sidekiq/web"

  # Healthcheck
  get "up" => "rails/health#show", as: :rails_health_check
  get "api/healthz", to: "api/health#show"

  # Sidekiq Web (optional, protect via env basic auth when set)
  if ENV["SIDEKIQ_USER"].present? && ENV["SIDEKIQ_PASSWORD"].present?
    Sidekiq::Web.use Rack::Auth::Basic do |user, pass|
      ActiveSupport::SecurityUtils.secure_compare(user, ENV["SIDEKIQ_USER"]) &
        ActiveSupport::SecurityUtils.secure_compare(pass, ENV["SIDEKIQ_PASSWORD"])
    end
  end
  mount Sidekiq::Web => "/sidekiq"

  namespace :api do
    scope "/v1" do
      get "/me", to: "me#show"
      resources :units
    end
  end

  # Swagger docs
  mount Rswag::Ui::Engine => "/docs"
  mount Rswag::Api::Engine => "/"
end
