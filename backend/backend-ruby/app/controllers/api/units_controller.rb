module Api
  class UnitsController < Api::BaseController
    before_action :set_unit, only: %i[show update destroy]

    def index
      page = params[:page].presence || 1
      limit = params[:limit].presence || 20
      scope = Unit.where(org_id: current_org_id)
      total = scope.count
      items = scope.offset((page.to_i - 1) * limit.to_i).limit(limit)
      has_more = (page.to_i * limit.to_i) < total
      render json: { items: items, page: page.to_i, limit: limit.to_i, total: total, hasMore: has_more }
    end

    def show
      render json: @unit
    end

    def create
      unit = Unit.new(unit_params.merge(org_id: current_org_id))
      if unit.save
        render json: unit, status: :created
      else
        render json: { errors: unit.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @unit.update(unit_params)
        render json: @unit
      else
        render json: { errors: @unit.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @unit.destroy
      head :no_content
    end

    private

    def set_unit
      @unit = Unit.where(org_id: current_org_id).find(params[:id])
    end

    def unit_params
      params.require(:unit).permit(:name, :address, :monthly_rent, :notes, :cover_image_uri)
    end
  end
end


