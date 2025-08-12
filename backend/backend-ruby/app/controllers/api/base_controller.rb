module Api
  class BaseController < ActionController::API
    include CurrentContext
    include Pagy::Backend

    rescue_from ActiveRecord::RecordNotFound do
      render json: { error: "Not Found" }, status: :not_found
    end

    rescue_from ActionController::ParameterMissing do |e|
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end
end


