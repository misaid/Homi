require "faraday"

module Supabase
  class StorageClient
    def initialize(url: ENV.fetch("SUPABASE_URL"), key: ENV.fetch("SUPABASE_SERVICE_ROLE_KEY"))
      @base_url = url
      @api_key = key
      @conn = Faraday.new do |f|
        f.request :retry, max: 2, interval: 0.1
        f.adapter Faraday.default_adapter
      end
    end

    # Uploads and returns key and public URL
    def upload_object(bucket:, key:, io:, content_type: "application/octet-stream")
      put_url = File.join(@base_url, "/storage/v1/object/", bucket.to_s, key)
      resp = @conn.put(put_url) do |req|
        req.headers["Authorization"] = "Bearer #{@api_key}"
        req.headers["Content-Type"] = content_type
        req.headers["x-upsert"] = "true"
        req.body = io.read
      end
      raise "supabase_upload_failed: #{resp.status}" unless resp.success?
      { key: key, public_url: public_url(bucket: bucket, key: key) }
    end

    def delete_object(bucket:, key:)
      del_url = File.join(@base_url, "/storage/v1/object/", bucket.to_s, key)
      @conn.delete(del_url) do |req|
        req.headers["Authorization"] = "Bearer #{@api_key}"
      end
      true
    rescue StandardError
      false
    end

    def public_url(bucket:, key:)
      File.join(@base_url, "/storage/v1/object/public/", bucket.to_s, CGI.escape(key))
    end

    def sign_url(bucket:, key:, expires_in_seconds: 604_800)
      sign_url = File.join(@base_url, "/storage/v1/object/sign/", bucket.to_s, key)
      resp = @conn.post(sign_url) do |req|
        req.headers["Authorization"] = "Bearer #{@api_key}"
        req.headers["Content-Type"] = "application/json"
        req.body = { expiresIn: expires_in_seconds }.to_json
      end
      raise "supabase_sign_failed: #{resp.status}" unless resp.success?
      body = JSON.parse(resp.body) rescue {}
      signed = body["signedURL"] || body["signedUrl"]
      raise "supabase_sign_missing" unless signed
      { signed_url: File.join(@base_url, "/storage/v1", signed) }
    end

    def build_key(unit_id:, original_filename: nil)
      ext = File.extname(original_filename.to_s)
      ext = ".jpg" if ext.blank?
      "units/#{unit_id}/#{Time.now.to_i}#{ext.downcase}"
    end
  end
end


