module V1
  class UploadController < ApplicationController
    before_action :require_organization!

    def create
      unless params[:file].present?
        return render json: { error: "file required" }, status: :unprocessable_entity
      end
      scope = params[:scope]
      uploaded = SupabaseStorage.upload(bucket: "uploads", path: generated_path(scope: scope), io: params[:file].tempfile)
      url = SupabaseStorage.signed_url(bucket: "uploads", path: uploaded[:path], expires_in: 3600)
      render json: { url: url }, status: :ok
    rescue StandardError => e
      render json: { error: e.message }, status: :internal_server_error
    end

    private

    def generated_path(scope:)
      timestamp = Time.now.utc.to_i
      org = current_org_id || "org"
      "#{org}/#{scope || 'misc'}/#{timestamp}-#{SecureRandom.hex(8)}"
    end
  end
end


