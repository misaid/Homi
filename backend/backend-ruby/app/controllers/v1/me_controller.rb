module V1
  class MeController < ApplicationController
    def show
      require_organization!
      render json: {
        user_id: current_user_id,
        session_id: current_session_id,
        org_id: current_org_id
      }
    end
  end
end


