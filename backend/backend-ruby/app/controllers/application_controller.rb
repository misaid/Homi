class ApplicationController < ActionController::API
  include Pagy::Backend

  before_action :authenticate_request!
  around_action :scope_current_tenant

  rescue_from ActiveRecord::RecordNotFound do
    render json: { error: "Not Found" }, status: :not_found
  end

  rescue_from ActionController::ParameterMissing do |e|
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def authenticate_request!
    # API key bypass
    api_key = request.headers["X-API-Key"]
    if api_key.present? && ActiveSupport::SecurityUtils.secure_compare(api_key, ENV.fetch("API_KEY", ""))
      @current_user_id = "api_key"
      @current_session_id = nil
      @current_org_id = params[:org_id] || request.headers["X-Org-Id"]
      return require_organization!
    end

    @current_user_id = request.env["clerk.user_id"]
    @current_session_id = request.env["clerk.session_id"]
    @current_org_id = request.env["clerk.org_id"]
    render json: { error: "Unauthorized" }, status: :unauthorized unless @current_user_id.present?
  end

  def current_user_id
    @current_user_id
  end

  def current_session_id
    @current_session_id
  end

  def current_org_id
    @current_org_id
  end

  def require_organization!
    render json: { error: "Organization required" }, status: :forbidden unless current_org_id.present?
  end

  def scope_current_tenant
    if defined?(ActsAsTenant) && current_org_id.present?
      org = Org.find_by(id: current_org_id)
      ActsAsTenant.with_tenant(org) { yield }
    else
      yield
    end
  end
end
