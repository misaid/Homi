module V1
  class UploadController < ApplicationController
    before_action :require_organization!

    def create
      unless params[:file].present?
        return render json: { error: "file required" }, status: :unprocessable_entity
      end
      scope = params[:scope]
      bucket = scope == "unit" ? ENV.fetch("SUPABASE_STORAGE_BUCKET_UNITS", "unit-media") : ENV.fetch("SUPABASE_STORAGE_BUCKET_TENANTS", "tenant-media")
      path = generated_path(scope: scope)
      uploaded = SupabaseStorage.upload(bucket: bucket, path: path, io: params[:file].tempfile, content_type: params[:file].content_type)
      url = SupabaseStorage.signed_url(bucket: bucket, path: uploaded[:path], expires_in: 3600)
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


