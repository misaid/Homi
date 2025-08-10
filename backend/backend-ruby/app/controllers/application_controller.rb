class ApplicationController < ActionController::API
  include Pagy::Backend
  include CurrentContext

  rescue_from ActiveRecord::RecordNotFound do
    render json: { error: "Not Found" }, status: :not_found
  end

  rescue_from ActionController::ParameterMissing do |e|
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def require_organization!
    head :unauthorized if current_org_id.blank?
  end
end
