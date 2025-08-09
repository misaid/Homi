module V1
  class UnitsController < ApplicationController
    before_action :require_organization!
    before_action :set_unit, only: %i[show update destroy]

    def index
      units = Unit.where(org_id: current_org_id)
      pagy_obj, records = pagy(units, page: params[:page], items: params[:limit])
      render json: {
        items: records,
        page: pagy_obj.page,
        limit: pagy_obj.items,
        total: pagy_obj.count,
        hasMore: !!pagy_obj.next
      }
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


