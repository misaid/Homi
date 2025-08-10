module Api
  class MeController < Api::BaseController
    def show
      render json: { userId: current_user_id, orgId: current_org_id }
    end
  end
end


