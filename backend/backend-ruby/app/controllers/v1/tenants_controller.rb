module V1
  class TenantsController < ApplicationController
    before_action :require_organization!
    before_action :set_tenant, only: %i[show update destroy]

    def index
      tenants = Tenant.where(org_id: current_org_id)
      pagy_obj, records = pagy(tenants, page: params[:page], items: params[:limit])
      render json: {
        items: records,
        page: pagy_obj.page,
        limit: pagy_obj.items,
        total: pagy_obj.count,
        hasMore: !!pagy_obj.next
      }
    end

    def show
      render json: @tenant
    end

    def create
      tenant = Tenant.new(tenant_params.merge(org_id: current_org_id))
      if tenant.save
        render json: tenant, status: :created
      else
        render json: { errors: tenant.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @tenant.update(tenant_params)
        render json: @tenant
      else
        render json: { errors: @tenant.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @tenant.destroy
      head :no_content
    end

    private

    def set_tenant
      @tenant = Tenant.where(org_id: current_org_id).find(params[:id])
    end

    def tenant_params
      params.require(:tenant).permit(:full_name, :phone, :email, :lease_start, :lease_end, :unit_id)
    end
  end
end


