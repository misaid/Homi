Rails.application.routes.draw do
  require "sidekiq/web"

  # Healthcheck
  get "up" => "rails/health#show", as: :rails_health_check
  get "healthz", to: proc { [200, { "Content-Type" => "application/json" }, [{ ok: true }.to_json]] }

  # Sidekiq Web (optional, protect via env basic auth when set)
  if ENV["SIDEKIQ_USER"].present? && ENV["SIDEKIQ_PASSWORD"].present?
    Sidekiq::Web.use Rack::Auth::Basic do |user, pass|
      ActiveSupport::SecurityUtils.secure_compare(user, ENV["SIDEKIQ_USER"]) &
        ActiveSupport::SecurityUtils.secure_compare(pass, ENV["SIDEKIQ_PASSWORD"])
    end
  end
  mount Sidekiq::Web => "/sidekiq"

  namespace :v1 do
    # Auth stubs
    post "auth/register", to: "auth#register"
    post "auth/login", to: "auth#login"

    # Me
    get "me", to: "me#show"

    resources :units
    resources :tenants
    resources :payments, only: %i[index show create update destroy] do
      member do
        post :pay
      end
    end

    post "seed", to: "seed#create"
    post "upload", to: "upload#create"
  end

  # Swagger docs
  mount Rswag::Ui::Engine => "/docs"
  mount Rswag::Api::Engine => "/"
end
