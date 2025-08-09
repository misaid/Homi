module V1
  class AuthController < ActionController::API
    def register
      render json: { ok: true, message: "Clerk handles registration" }
    end

    def login
      render json: { ok: true, message: "Clerk handles login" }
    end
  end
end


