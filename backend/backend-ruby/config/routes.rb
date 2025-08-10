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
      if Rails.env.development?
        get "/debug/auth", to: "debug#auth"
      end
    end

    # Backward compatible API under /api/v1 mapped to V1 controllers
    scope "/v1", module: "v1", as: "v1" do
      resources :units
      resources :tenants
      resources :payments do
        post :pay, on: :member
      end
    end
  end

  # Versioned public API without the /api prefix
  namespace :v1 do
    resources :units
    resources :tenants
    resources :payments do
      post :pay, on: :member
    end
  end

  # Swagger docs
  mount Rswag::Ui::Engine => "/docs"
  mount Rswag::Api::Engine => "/"
end
