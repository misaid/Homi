class SupabaseStorage
  class << self
    def upload(bucket:, path:, io:)
      # Real implementation would call Supabase Storage; tests will stub
      raise NotImplementedError, "SupabaseStorage.upload not implemented"
    end

    def signed_url(bucket:, path:, expires_in: 3600)
      # Real implementation would call Supabase to sign; tests will stub
      raise NotImplementedError, "SupabaseStorage.signed_url not implemented"
    end
  end
end


