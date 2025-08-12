module Api
  module V1
    # Thin shim to reuse existing V1 controller under /api/v1 routes
    class UnitsController < ::V1::UnitsController; end
  end
end


